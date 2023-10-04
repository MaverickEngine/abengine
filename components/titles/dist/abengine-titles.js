var abengine_titles = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var ajax = {};

    Object.defineProperty(ajax, "__esModule", { value: true });
    var apiPut_1 = ajax.apiPut = apiDelete_1 = ajax.apiDelete = apiGet_1 = ajax.apiGet = apiPost_1 = ajax.apiPost = void 0;
    function handleError(response) {
        if (!response.ok) {
            const status = response.status;
            const message = response.responseJSON?.message || response.statusText || response.responseText || response;
            const code = response.responseJSON?.code || response.code || "";
            return { status, code, message };
        }
        return response;
    }
    function apiPost(path, data, headers = {}) {
        return new Promise((resolve, reject) => {
            wp.apiRequest({
                path,
                data,
                type: "POST",
                headers
            })
                .done(async (response) => {
                if (response.error) {
                    reject(response);
                }
                resolve(response);
            })
                .fail(async (response) => {
                reject(handleError(response));
            });
        });
    }
    var apiPost_1 = ajax.apiPost = apiPost;
    function apiGet(path, headers = {}) {
        return new Promise((resolve, reject) => {
            wp.apiRequest({
                path,
                type: "GET",
                headers
            })
                .done(async (response) => {
                if (response.error) {
                    reject(response);
                }
                resolve(response);
            })
                .fail(async (response) => {
                reject(handleError(response));
            });
        });
    }
    var apiGet_1 = ajax.apiGet = apiGet;
    function apiDelete(path, headers = {}) {
        return new Promise((resolve, reject) => {
            wp.apiRequest({
                path,
                type: "DELETE",
                headers
            })
                .done(async (response) => {
                if (response.error) {
                    reject(response);
                }
                resolve(response);
            })
                .fail(async (response) => {
                reject(handleError(response));
            });
        });
    }
    var apiDelete_1 = ajax.apiDelete = apiDelete;
    function apiPut(path, data, headers = {}) {
        return new Promise((resolve, reject) => {
            wp.apiRequest({
                path,
                data,
                type: "PUT",
                headers
            })
                .done(async (response) => {
                if (response.error) {
                    reject(response);
                }
                resolve(response);
            })
                .fail(async (response) => {
                reject(handleError(response));
            });
        });
    }
    apiPut_1 = ajax.apiPut = apiPut;

    /* ../../../../../svelte-wordpress-components/svelte-wordpress-alert.svelte generated by Svelte v3.49.0 */

    const file$2 = "../../../../../svelte-wordpress-components/svelte-wordpress-alert.svelte";

    // (14:4) {#if display_icon}
    function create_if_block$1(ctx) {
    	let span;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", span_class_value = "dashicons dashicons-" + /*type*/ ctx[0]);
    			add_location(span, file$2, 14, 4, 449);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*type*/ 1 && span_class_value !== (span_class_value = "dashicons dashicons-" + /*type*/ ctx[0])) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:4) {#if display_icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let p;
    	let div_class_value;
    	let current;
    	let if_block = /*display_icon*/ ctx[1] && create_if_block$1(ctx);
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			p = element("p");
    			if (default_slot) default_slot.c();
    			add_location(p, file$2, 16, 4, 512);
    			attr_dev(div, "class", div_class_value = "notice notice-" + /*type*/ ctx[0]);
    			toggle_class(div, "is-dismissible", /*dismissible*/ ctx[2]);
    			add_location(div, file$2, 12, 0, 352);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);
    			append_dev(div, p);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*display_icon*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*type*/ 1 && div_class_value !== (div_class_value = "notice notice-" + /*type*/ ctx[0])) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*type, dismissible*/ 5) {
    				toggle_class(div, "is-dismissible", /*dismissible*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Svelte_wordpress_alert', slots, ['default']);
    	var AlertTypes;

    	(function (AlertTypes) {
    		AlertTypes["success"] = "success";
    		AlertTypes["error"] = "error";
    		AlertTypes["warning"] = "warning";
    		AlertTypes["info"] = "info";
    	})(AlertTypes || (AlertTypes = {}));

    	let { type = AlertTypes.info } = $$props;
    	let { display_icon = false } = $$props;
    	let { dismissible = true } = $$props;
    	const writable_props = ['type', 'display_icon', 'dismissible'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Svelte_wordpress_alert> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('display_icon' in $$props) $$invalidate(1, display_icon = $$props.display_icon);
    		if ('dismissible' in $$props) $$invalidate(2, dismissible = $$props.dismissible);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		AlertTypes,
    		type,
    		display_icon,
    		dismissible
    	});

    	$$self.$inject_state = $$props => {
    		if ('AlertTypes' in $$props) AlertTypes = $$props.AlertTypes;
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('display_icon' in $$props) $$invalidate(1, display_icon = $$props.display_icon);
    		if ('dismissible' in $$props) $$invalidate(2, dismissible = $$props.dismissible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, display_icon, dismissible, $$scope, slots];
    }

    class Svelte_wordpress_alert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { type: 0, display_icon: 1, dismissible: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svelte_wordpress_alert",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get type() {
    		throw new Error("<Svelte_wordpress_alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Svelte_wordpress_alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get display_icon() {
    		throw new Error("<Svelte_wordpress_alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set display_icon(value) {
    		throw new Error("<Svelte_wordpress_alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dismissible() {
    		throw new Error("<Svelte_wordpress_alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dismissible(value) {
    		throw new Error("<Svelte_wordpress_alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../../../../svelte-wordpress-components/svelte-wordpress-button.svelte generated by Svelte v3.49.0 */

    const file$1 = "../../../../../svelte-wordpress-components/svelte-wordpress-button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", /*type*/ ctx[0]);
    			attr_dev(button, "href", /*href*/ ctx[1]);
    			attr_dev(button, "target", /*target*/ ctx[2]);
    			attr_dev(button, "rel", /*rel*/ ctx[3]);
    			attr_dev(button, "title", /*title*/ ctx[4]);
    			button.disabled = /*disabled*/ ctx[5];
    			attr_dev(button, "aria-label", /*aria_label*/ ctx[11]);
    			attr_dev(button, "aria-hidden", /*aria_hidden*/ ctx[12]);
    			attr_dev(button, "id", /*id*/ ctx[6]);
    			attr_dev(button, "class", button_class_value = "button " + /*btn_class*/ ctx[13] + " " + (/*$$restProps*/ ctx[15].class || ''));
    			attr_dev(button, "style", /*style*/ ctx[14]);
    			toggle_class(button, "button-primary", /*primary*/ ctx[7]);
    			toggle_class(button, "button-large", /*large*/ ctx[8]);
    			toggle_class(button, "delete", /*warning*/ ctx[9]);
    			toggle_class(button, "button-link", /*link*/ ctx[10]);
    			add_location(button, file$1, 26, 0, 690);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[19], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 131072)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[17],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[17])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[17], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*type*/ 1) {
    				attr_dev(button, "type", /*type*/ ctx[0]);
    			}

    			if (!current || dirty & /*href*/ 2) {
    				attr_dev(button, "href", /*href*/ ctx[1]);
    			}

    			if (!current || dirty & /*target*/ 4) {
    				attr_dev(button, "target", /*target*/ ctx[2]);
    			}

    			if (!current || dirty & /*rel*/ 8) {
    				attr_dev(button, "rel", /*rel*/ ctx[3]);
    			}

    			if (!current || dirty & /*title*/ 16) {
    				attr_dev(button, "title", /*title*/ ctx[4]);
    			}

    			if (!current || dirty & /*disabled*/ 32) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[5]);
    			}

    			if (!current || dirty & /*aria_label*/ 2048) {
    				attr_dev(button, "aria-label", /*aria_label*/ ctx[11]);
    			}

    			if (!current || dirty & /*aria_hidden*/ 4096) {
    				attr_dev(button, "aria-hidden", /*aria_hidden*/ ctx[12]);
    			}

    			if (!current || dirty & /*id*/ 64) {
    				attr_dev(button, "id", /*id*/ ctx[6]);
    			}

    			if (!current || dirty & /*btn_class, $$restProps*/ 40960 && button_class_value !== (button_class_value = "button " + /*btn_class*/ ctx[13] + " " + (/*$$restProps*/ ctx[15].class || ''))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*style*/ 16384) {
    				attr_dev(button, "style", /*style*/ ctx[14]);
    			}

    			if (dirty & /*btn_class, $$restProps, primary*/ 41088) {
    				toggle_class(button, "button-primary", /*primary*/ ctx[7]);
    			}

    			if (dirty & /*btn_class, $$restProps, large*/ 41216) {
    				toggle_class(button, "button-large", /*large*/ ctx[8]);
    			}

    			if (dirty & /*btn_class, $$restProps, warning*/ 41472) {
    				toggle_class(button, "delete", /*warning*/ ctx[9]);
    			}

    			if (dirty & /*btn_class, $$restProps, link*/ 41984) {
    				toggle_class(button, "button-link", /*link*/ ctx[10]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"type","href","target","rel","title","disabled","id","primary","large","warning","danger","link","aria_label","aria_hidden","btn_class"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Svelte_wordpress_button', slots, ['default']);
    	let { type = "button" } = $$props;
    	let { href = null } = $$props;
    	let { target = null } = $$props;
    	let { rel = null } = $$props;
    	let { title = null } = $$props;
    	let { disabled = false } = $$props;
    	let { id = null } = $$props;
    	let { primary = false } = $$props;
    	let { large = false } = $$props;
    	let { warning = false } = $$props;
    	let { danger = false } = $$props;
    	let { link = false } = $$props;
    	let { aria_label = null } = $$props;
    	let { aria_hidden = false } = $$props;
    	let { btn_class = "button" } = $$props;
    	let style = "";

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(15, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('type' in $$new_props) $$invalidate(0, type = $$new_props.type);
    		if ('href' in $$new_props) $$invalidate(1, href = $$new_props.href);
    		if ('target' in $$new_props) $$invalidate(2, target = $$new_props.target);
    		if ('rel' in $$new_props) $$invalidate(3, rel = $$new_props.rel);
    		if ('title' in $$new_props) $$invalidate(4, title = $$new_props.title);
    		if ('disabled' in $$new_props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ('id' in $$new_props) $$invalidate(6, id = $$new_props.id);
    		if ('primary' in $$new_props) $$invalidate(7, primary = $$new_props.primary);
    		if ('large' in $$new_props) $$invalidate(8, large = $$new_props.large);
    		if ('warning' in $$new_props) $$invalidate(9, warning = $$new_props.warning);
    		if ('danger' in $$new_props) $$invalidate(16, danger = $$new_props.danger);
    		if ('link' in $$new_props) $$invalidate(10, link = $$new_props.link);
    		if ('aria_label' in $$new_props) $$invalidate(11, aria_label = $$new_props.aria_label);
    		if ('aria_hidden' in $$new_props) $$invalidate(12, aria_hidden = $$new_props.aria_hidden);
    		if ('btn_class' in $$new_props) $$invalidate(13, btn_class = $$new_props.btn_class);
    		if ('$$scope' in $$new_props) $$invalidate(17, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		href,
    		target,
    		rel,
    		title,
    		disabled,
    		id,
    		primary,
    		large,
    		warning,
    		danger,
    		link,
    		aria_label,
    		aria_hidden,
    		btn_class,
    		style
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('type' in $$props) $$invalidate(0, type = $$new_props.type);
    		if ('href' in $$props) $$invalidate(1, href = $$new_props.href);
    		if ('target' in $$props) $$invalidate(2, target = $$new_props.target);
    		if ('rel' in $$props) $$invalidate(3, rel = $$new_props.rel);
    		if ('title' in $$props) $$invalidate(4, title = $$new_props.title);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ('id' in $$props) $$invalidate(6, id = $$new_props.id);
    		if ('primary' in $$props) $$invalidate(7, primary = $$new_props.primary);
    		if ('large' in $$props) $$invalidate(8, large = $$new_props.large);
    		if ('warning' in $$props) $$invalidate(9, warning = $$new_props.warning);
    		if ('danger' in $$props) $$invalidate(16, danger = $$new_props.danger);
    		if ('link' in $$props) $$invalidate(10, link = $$new_props.link);
    		if ('aria_label' in $$props) $$invalidate(11, aria_label = $$new_props.aria_label);
    		if ('aria_hidden' in $$props) $$invalidate(12, aria_hidden = $$new_props.aria_hidden);
    		if ('btn_class' in $$props) $$invalidate(13, btn_class = $$new_props.btn_class);
    		if ('style' in $$props) $$invalidate(14, style = $$new_props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*warning*/ 512) {
    			if (warning) {
    				$$invalidate(14, style = "color: #a00; border-color: #a00;");
    			}
    		}

    		if ($$self.$$.dirty & /*danger*/ 65536) {
    			if (danger) {
    				$$invalidate(14, style = "background-color: #a00; border-color: #a00; color: #fff;");
    			}
    		}
    	};

    	return [
    		type,
    		href,
    		target,
    		rel,
    		title,
    		disabled,
    		id,
    		primary,
    		large,
    		warning,
    		link,
    		aria_label,
    		aria_hidden,
    		btn_class,
    		style,
    		$$restProps,
    		danger,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Svelte_wordpress_button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			type: 0,
    			href: 1,
    			target: 2,
    			rel: 3,
    			title: 4,
    			disabled: 5,
    			id: 6,
    			primary: 7,
    			large: 8,
    			warning: 9,
    			danger: 16,
    			link: 10,
    			aria_label: 11,
    			aria_hidden: 12,
    			btn_class: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svelte_wordpress_button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get type() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get target() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set target(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rel() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rel(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primary() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primary(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get large() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set large(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get warning() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set warning(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get danger() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set danger(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get aria_label() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aria_label(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get aria_hidden() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aria_hidden(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get btn_class() {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set btn_class(value) {
    		throw new Error("<Svelte_wordpress_button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* components/titles/src/abengine-post-titles.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;
    const file = "components/titles/src/abengine-post-titles.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (151:0) {#if message}
    function create_if_block_4(ctx) {
    	let alert;
    	let current;

    	alert = new Svelte_wordpress_alert({
    			props: {
    				type: /*message*/ ctx[1].status,
    				dismissible: true,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(alert.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(alert, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const alert_changes = {};
    			if (dirty & /*message*/ 2) alert_changes.type = /*message*/ ctx[1].status;

    			if (dirty & /*$$scope, message*/ 2097154) {
    				alert_changes.$$scope = { dirty, ctx };
    			}

    			alert.$set(alert_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(alert, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(151:0) {#if message}",
    		ctx
    	});

    	return block;
    }

    // (152:4) <Alert type={message.status} dismissible={true}>
    function create_default_slot_3(ctx) {
    	let t_value = /*message*/ ctx[1].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 2 && t_value !== (t_value = /*message*/ ctx[1].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(152:4) <Alert type={message.status} dismissible={true}>",
    		ctx
    	});

    	return block;
    }

    // (159:29) 
    function create_if_block_2(ctx) {
    	let t;
    	let button;
    	let current;
    	let each_value = /*experiments*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	button = new Svelte_wordpress_button({
    			props: {
    				class: "abengine-title-new-experiment-button",
    				primary: "true",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*onNewExperimentClick*/ ctx[4]);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*onDeleteExperimentClick, experiments*/ 36) {
    				each_value = /*experiments*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(159:29) ",
    		ctx
    	});

    	return block;
    }

    // (157:26) 
    function create_if_block_1(ctx) {
    	let button;
    	let current;

    	button = new Svelte_wordpress_button({
    			props: {
    				primary: "true",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*onNewCampaignClick*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(157:26) ",
    		ctx
    	});

    	return block;
    }

    // (155:0) {#if state === "loading"}
    function create_if_block(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "ABEngine loading...";
    			add_location(h3, file, 155, 4, 4856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(155:0) {#if state === \\\"loading\\\"}",
    		ctx
    	});

    	return block;
    }

    // (164:8) {#if i > 0}
    function create_if_block_3(ctx) {
    	let button;
    	let current;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*i*/ ctx[20], ...args);
    	}

    	button = new Svelte_wordpress_button({
    			props: {
    				warning: "true",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(164:8) {#if i > 0}",
    		ctx
    	});

    	return block;
    }

    // (165:12) <Button warning=true on:click={e => onDeleteExperimentClick(e, i)}>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(165:12) <Button warning=true on:click={e => onDeleteExperimentClick(e, i)}>",
    		ctx
    	});

    	return block;
    }

    // (160:4) {#each experiments as experiment, i}
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let input_id_value;
    	let t0;
    	let span;
    	let t1_value = /*experiment*/ ctx[18].wins + "";
    	let t1;
    	let t2;
    	let t3_value = /*experiment*/ ctx[18].hits + "";
    	let t3;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[6].call(input, /*each_value*/ ctx[19], /*i*/ ctx[20]);
    	}

    	let if_block = /*i*/ ctx[20] > 0 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text("/");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "class", "abengine-title-input svelte-xrvaeh");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "abengine_title_" + /*i*/ ctx[20]);
    			attr_dev(input, "size", "30");
    			attr_dev(input, "id", input_id_value = /*experiment*/ ctx[18].uid);
    			attr_dev(input, "spellcheck", "true");
    			attr_dev(input, "autocomplete", "off");
    			input.readOnly = /*i*/ ctx[20] === 0;
    			add_location(input, file, 161, 8, 5116);
    			attr_dev(span, "class", "abengine-title-stats svelte-xrvaeh");
    			add_location(span, file, 162, 8, 5315);
    			attr_dev(div, "class", "abengine-title-container svelte-xrvaeh");
    			add_location(div, file, 160, 4, 5069);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*experiment*/ ctx[18].value);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(div, t4);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*experiments*/ 4 && input_id_value !== (input_id_value = /*experiment*/ ctx[18].uid)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*experiments*/ 4 && input.value !== /*experiment*/ ctx[18].value) {
    				set_input_value(input, /*experiment*/ ctx[18].value);
    			}

    			if ((!current || dirty & /*experiments*/ 4) && t1_value !== (t1_value = /*experiment*/ ctx[18].wins + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*experiments*/ 4) && t3_value !== (t3_value = /*experiment*/ ctx[18].hits + "")) set_data_dev(t3, t3_value);
    			if (/*i*/ ctx[20] > 0) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(160:4) {#each experiments as experiment, i}",
    		ctx
    	});

    	return block;
    }

    // (169:4) <Button class="abengine-title-new-experiment-button" primary=true on:click={onNewExperimentClick}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New AB Title Experiment");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(169:4) <Button class=\\\"abengine-title-new-experiment-button\\\" primary=true on:click={onNewExperimentClick}>",
    		ctx
    	});

    	return block;
    }

    // (158:4) <Button primary=true on:click={onNewCampaignClick}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New AB Title Test");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(158:4) <Button primary=true on:click={onNewCampaignClick}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*message*/ ctx[1] && create_if_block_4(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === "loading") return 0;
    		if (/*state*/ ctx[0] === "new") return 1;
    		if (/*state*/ ctx[0] === "loaded") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*message*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*message*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Abengine_post_titles', slots, []);
    	let post_id;
    	let state = "loading";
    	let message = null;
    	let campaign = null;
    	let experiments = null;
    	let title = null;
    	let titleElement = null;

    	onMount(async () => {
    		post_id = document.querySelector("#post_ID").value;
    		titleElement = document.querySelector("#title");
    		title = titleElement.value;
    		await load_campaign();
    		if (state === "new") return;
    		await init();
    	});

    	async function init() {
    		await load_experiments();

    		if (experiments.length === 0) {
    			await save_current_title();
    		}

    		if (experiments[0].value != title) {
    			await save_current_title();
    		}

    		const form = document.querySelector("form#post");

    		form.addEventListener("submit", async e => {
    			try {
    				e.preventDefault();
    				await save_all_titles();
    				form.submit();
    			} catch(err) {
    				$$invalidate(1, message = {
    					status: "error",
    					message: `Error saving ABEngine Campaign: ${err.message}`
    				});
    			}
    		});

    		titleElement.addEventListener("change", async e => {
    			$$invalidate(2, experiments[0].value = e.target.value, experiments);
    		});

    		titleElement.addEventListener("keyup", async e => {
    			$$invalidate(2, experiments[0].value = e.target.value, experiments);
    		});

    		console.log({ campaign, experiments });
    		$$invalidate(0, state = "loaded");
    	}

    	async function onNewCampaignClick(e) {
    		try {
    			e.preventDefault();
    			const title = document.querySelector("#title").value;
    			const response = await apiPost_1(`abengine/titles/v1/post/${post_id}`, { title });
    			campaign = response.campaign.data;
    			console.log(response);
    			await init();
    		} catch(err) {
    			$$invalidate(1, message = {
    				status: "error",
    				message: `Error creating new ABEngine Campaign: ${err.message}`
    			});
    		}
    	}

    	async function load_campaign() {
    		try {
    			const response = await apiGet_1(`abengine/titles/v1/post/${post_id}`);
    			campaign = response.campaign.data;
    			console.log({ campaign });
    		} catch(err) {
    			if (err.status === 404) {
    				$$invalidate(0, state = "new");
    			} else {
    				$$invalidate(1, message = {
    					status: "error",
    					message: `Error loading ABEngine Campaign: ${err.message}`
    				});
    			}
    		}
    	}

    	async function load_experiments() {
    		try {
    			const response = await apiGet_1(`abengine/v1/experiments/${campaign._id}`);
    			$$invalidate(2, experiments = response.experiments.data);
    		} catch(err) {
    			$$invalidate(1, message = {
    				status: "error",
    				message: `Error loading ABEngine Experiments: ${err.message}`
    			});
    		}
    	}

    	async function save_current_title() {
    		try {
    			const title = document.querySelector("#title").value;

    			const experiment = {
    				value: title,
    				uid: `abengine-title-${post_id}-primary`,
    				campaign_id: campaign._id
    			};

    			await apiPost_1(`abengine/v1/experiment`, experiment);
    			await load_experiments();
    		} catch(err) {
    			$$invalidate(1, message = {
    				status: "error",
    				message: `Error saving ABEngine Title: ${err.message}`
    			});
    		}
    	}

    	async function save_all_titles() {
    		await apiPut_1(`abengine/v1/experiments`, {
    			experiments: experiments.filter(experiment => experiment.value && experiment.value.length > 0 && experiment.uid)
    		});
    	}

    	function uniqueUid() {
    		let num = experiments.length;

    		while (experiments.find(experiment => experiment.uid === `abengine-title-${post_id}-${num}`)) {
    			num++;
    		}

    		return `abengine-title-${post_id}-${num}`;
    	}

    	function onNewExperimentClick(e) {
    		e.preventDefault();

    		experiments.push({
    			value: "",
    			uid: uniqueUid(),
    			campaign_id: campaign._id,
    			hits: 0,
    			wins: 0
    		});

    		$$invalidate(2, experiments = [...experiments]);
    	}

    	function onDeleteExperimentClick(e, i) {
    		e.preventDefault();
    		const experiment = experiments.splice(i, 1);
    		$$invalidate(2, experiments = [...experiments]);
    		apiDelete_1(`abengine/v1/experiment/${experiment[0]._id}`);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Abengine_post_titles> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(each_value, i) {
    		each_value[i].value = this.value;
    		$$invalidate(2, experiments);
    	}

    	const click_handler = (i, e) => onDeleteExperimentClick(e, i);

    	$$self.$capture_state = () => ({
    		onMount,
    		apiGet: apiGet_1,
    		apiPut: apiPut_1,
    		apiPost: apiPost_1,
    		apiDelete: apiDelete_1,
    		Button: Svelte_wordpress_button,
    		Alert: Svelte_wordpress_alert,
    		post_id,
    		state,
    		message,
    		campaign,
    		experiments,
    		title,
    		titleElement,
    		init,
    		onNewCampaignClick,
    		load_campaign,
    		load_experiments,
    		save_current_title,
    		save_all_titles,
    		uniqueUid,
    		onNewExperimentClick,
    		onDeleteExperimentClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('post_id' in $$props) post_id = $$props.post_id;
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('message' in $$props) $$invalidate(1, message = $$props.message);
    		if ('campaign' in $$props) campaign = $$props.campaign;
    		if ('experiments' in $$props) $$invalidate(2, experiments = $$props.experiments);
    		if ('title' in $$props) title = $$props.title;
    		if ('titleElement' in $$props) titleElement = $$props.titleElement;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		state,
    		message,
    		experiments,
    		onNewCampaignClick,
    		onNewExperimentClick,
    		onDeleteExperimentClick,
    		input_input_handler,
    		click_handler
    	];
    }

    class Abengine_post_titles extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Abengine_post_titles",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new Abengine_post_titles({
    	target: document.getElementById("abenginePostTitles"),
    	props: {
    	}
    });

    return app;

})();
//# sourceMappingURL=abengine-titles.js.map

<script>
    export let href = null;
    export let target = null;
    export let rel = null;
    export let title = null;
    export let id = null;
    export let primary = false;
    export let large = false;
    export let warning = false;
    export let danger = false;
    export let link = false;
    let style = "";
    $: if (warning) {
        style = "color: #a00; border-color: #a00;";
    }
    $: if (danger) {
        style = "background-color: #a00; border-color: #a00; color: #fff;";
    }

</script>

<button {href} {target} {rel} {title} {id} class="abengine-button button" class:button-primary={primary} class:button-large={large} class:delete={warning} class:button-link={link} {style}>
    <slot></slot>
</button>
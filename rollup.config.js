// import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
// import resolve from '@rollup/plugin-node-resolve';
// import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import less from 'rollup-plugin-less'
import css from 'rollup-plugin-css-only';
// import preprocess from 'svelte-preprocess';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import strip from '@rollup/plugin-strip';
import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import preprocess from 'svelte-preprocess';


const production = !process.env.ROLLUP_WATCH;
const test = process.env.NODE_ENV === 'test';

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

const pkg = require('./package.json');
const config = [
	{
		input: "src/abengine-client.js",
		output: [
			{
				sourcemap: true,
				format: 'iife',
				name: "abengine_client",
				file: "dist/abengine-client.js"
			},
		],
		plugins: [
			nodeResolve({
				browser: true,
			}),
			less({ output: 'dist/abengine-client.css' }),
			commonjs(),
			typescript(),
			json(),
			!production && serve(),
			production && terser() && strip()
		]
	},
	{
		input: "src/abengine-admin.js",
		output: [
			{
				sourcemap: true,
				format: 'iife',
				name: "abengine_admin",
				file: "dist/abengine-admin.js"
			},
		],
		plugins: [
			nodeResolve({
				browser: true,
			}),
			commonjs(),
			!production && serve(),
			production && terser() && strip()
		]
	},
	{
		input: "src/abengine-admin-campaigns.js",
		output: [
			{
				sourcemap: true,
				format: 'iife',
				name: "abengine_admin",
				file: "dist/abengine-admin-campaigns.js"
			},
		],
		plugins: [
			// nodeResolve({
			// 	browser: true,
			// 	dedupe: ['svelte']
			// }),
			svelte({
				compilerOptions: {
					// enable run-time checks when not in production
					dev: !production
				},
				preprocess: preprocess({ defaults: { style: 'scss' } })
			}),
			typescript(),
			css({ output: 'abengine-admin.css' }),
			nodeResolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs(),
			!production && serve(),
			production && terser() && strip()
		]
	}
];

export default config;

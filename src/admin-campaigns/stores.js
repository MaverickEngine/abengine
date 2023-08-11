import { writable, readable } from 'svelte/store';

export const tests = writable([]);
export const abengine = readable(window.abengine);
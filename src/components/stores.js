import { writable } from 'svelte/store';

export const users = writable([]);

export const speedMultiplier = writable(15);

export const selectedPlanet = writable(null);

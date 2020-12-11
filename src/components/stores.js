import { writable } from 'svelte/store';

export const users = writable([]);

// TODO: sync initial value with Timer
export const speedMultiplier = writable(10);

export const selectedPlanet = writable(null);

// TODO: sync initial value with Timer
// Contract epoch stuff
export const blockInformation = writable({
  number: 12314145,
  date: new Date(1601677525000),
});

import { writable } from 'svelte/store';
import { firstReplayBlock, defaultWidthInWorldUnits, defaultCenterCoords } from '../constants';

export const users = writable([]);

export const speedMultiplier = writable(1);

export const selectedPlanet = writable(null);

// Contract epoch stuff
export const blockInformation = writable();

export const seekTo = writable({ init: true, seeking: false, blockNumber: firstReplayBlock });

export const centerCoords = writable(defaultCenterCoords);
export const widthInWorldUnits = writable(defaultWidthInWorldUnits);

export const playing = writable(false);

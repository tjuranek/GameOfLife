// there aren't any parent/child relationships between my components so i'm using a writable store to do so
import { writable } from 'svelte/store';

// the current iteration number
export const iterationCount = writable(0);

// the time in milliseconds between each iteration in the game loop
export const iterationInterval = writable(0);

// the matrix that's help by the gameboard. i can't figure out how to have the gameboard object be in store and still call it's functions, like randomlyPopulate
export const matrix = writable([]);
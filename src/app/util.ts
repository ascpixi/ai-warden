/**
 * Returns a `Promise` that resolves after the specified amount of milliseconds.
 */
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Equivalent to `arr[arr.length - 1]`.
 */
export function last<T>(arr: T[]) {
    return arr[arr.length - 1];
}

/**
 * Picks a random integer, from `min` (inclusive) to `max` (exclusive). 
 * @param min The minimum bound, inclusive.
 * @param max The maximum bound, exclusive.
 */
export function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Picks a random element from the given array.
 */
export function pickRandom<T>(arr: T[]): T {
    if (arr.length == 0)
        throw new Error("Attempted to pick a random element from an empty array.");

    return arr[rng(0, arr.length)];
}

/**
 * Returns the given amount of minutes in milliseconds.
 */
export function minutes(mins: number) {
    return seconds(mins * 60);
}

/**
 * Returns the given amount of seconds in milliseconds.
 */
export function seconds(secs: number) {
    return secs * 1000;
}
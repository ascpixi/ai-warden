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

/**
 * Similar to a "switch expression" in languages like C#.
 * 
 *     const myValue = match(someValue, {
 *       "ONE": 1,
 *       "TWO": 2,
 *       "THREE": 3
 *     });
 * 
 */
export function match<TTarget extends string | number | symbol, TOutput>(
    against: TTarget,
    cases: { [matchCase in TTarget]: TOutput }
) {
    if (!(against in cases)) {
        console.error("match(...) did not account for case", against, ". Cases:", cases);
        throw new Error(`Unhandled "${String(against)}" value in "match" block.`)
    }

    return cases[against];
}

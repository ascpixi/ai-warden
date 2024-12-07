/**
 * Starts a linear tween, which transitions a value which begins from `start`,
 * and should become `target` in `duration` milliseconds. 
 */
export function tweenLinear(
    start: number,
    setter: (x: number) => void,
    target: number,
    duration: number
) {
    const change = target - start;
    const startTime = performance.now();

    function update() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
            const progress = elapsed / duration;
            const currentValue = start + (change * progress);
            setter(currentValue);

            requestAnimationFrame(update);
        } else {
            setter(target);
        }
    }

    requestAnimationFrame(update);
}
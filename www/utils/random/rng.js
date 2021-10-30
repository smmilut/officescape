import * as SquirrelNoise from "./squirrelNoise5.js";

/**
 * Template object for generating sequential noise-based pseudo-random numbers
 */
const Rng = {
    /**
     * Always call init()
     * @param {object} initOptions {
     *   position: (optional) initial position in the noise,
     *   seed: (optional) seed for the noise,
     *   noiseFn: (optional) 1D noise function,
     * }
     */
    init: function Rng_init(initOptions) {
        initOptions = initOptions || {};
        this.noiseFn = initOptions.noiseFn || SquirrelNoise.get1dNoiseZeroToOne;
        this.seed = initOptions.seed || 0;
        this.initialPosition = initOptions.position || 0;
        this.position = this.initialPosition;
    },
    /**
     * Reset the noise to the initial position.
     * If parameter `position` is provided, then make that the new initial position.
     * @param {int} position (optional) new initial position in the noise
     */
    resetPosition: function Rng_resetPosition(position) {
        if (position === undefined) {
            /// reset
            this.position = this.initialPosition;
        } else {
            /// set new initial position and reset
            this.initialPosition = position;
            this.position = this.initialPosition;
        }
    },
    /**
     * Get next random number :
     *   roll for a new random number and advance to the next position
     * @returns next random number in sequence (type depends on `this.noiseFn`)
     */
    roll: function Rng_roll() {
        return this.noiseFn(this.position++, this.seed);
    },
    /**
     * Get the current state of the Rng
     * @returns {object} {
     *   position: current position in the noise,
     *   seed: seed for the noise,
     *   noiseFn: 1D noise function,
     * }
     */
    getState: function Rng_getState() {
        return {
            position: this.position,
            seed: this.seed,
            noiseFn: this.noiseFn,
        };
    },
};

/**
 * Instantiate a new `Rng` object to generate sequential noise-based pseudo-random numbers
 * @param {object} initOptions {
 *   position: (optional) initial position in the noise,
 *   seed: (optional) seed for the noise,
 *   noiseFn: (optional) 1D noise function,
 * }
 * @returns a new `Rng` object
 */
export function newRng(initOptions) {
    const o = Object.create(Rng);
    o.init(initOptions);
    return o;
}

/**
 * largest possible 32bit signed integer
 */
 const MAX_INT32 = ~(1 << 31);
/**
 * Get a Uint32 seed to have an unpredictable value
 */
export function newSeedUndeterminist() {
    return (Date.now() * performance.now()) & MAX_INT32;
}

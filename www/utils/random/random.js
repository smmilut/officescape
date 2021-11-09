import * as Rng from "./rng.js";
import * as SquirrelNoise from "./squirrelNoise5.js";
import * as Perlin from "./perlin.js";
/**
 * Random utilities
 * @module random
 */

/**
 * RNGG : a Random Number Generator Generator :
 *   generates RNG's with predictable pseudo-random seeds
 */
const Resource_Rngg = {
    name: "rngg",
    /**
     * 
     * @param {object} initOptions {
     *   seed: (optional) base seed. If omitted, an undeterminist seed is choosen at init. ,
     * }
     */
    prepareInit: function Time_prepareInit(initOptions) {
        this.initOptions = initOptions || {};
        this.initQueryResources = initOptions.initQueryResources;
    },
    init: function Rngg_init(queryResults) {
        const browserInfo = queryResults.resources.browserInfo;
        const urlSeed = browserInfo.urlParameters.get("seed");
        if (urlSeed) {
            console.log("seeding RNGG from URL parameter");
            this.seed = Number(urlSeed);
        } else if (this.initOptions.seed !== undefined) {
            console.log("seeding RNGG from scene options");
            this.seed = this.initOptions.seed;
        } else {
            console.log("seeding RNGG from undeterministic timing");
            this.seed = Rng.newSeedUndeterminist();
        }
        console.log("RNGG seed", this.seed);
        this.seedGenerator = Rng.newRng({
            seed: this.seed,
            noiseFn: SquirrelNoise.get1dNoiseUint,
        });
        this.rngStore = new Map();
    },
    /**
     * Get or instanciate the named RNG
     * @param {string} rngName name of the requested RNG
     * @returns the RNG
     */
    getRng: function Rngg_getRng(rngName) {
        if (!this.rngStore.has(rngName)) {
            const rng = this.newRng();
            this.rngStore.set(rngName, rng)
        }
        return this.rngStore.get(rngName);
    },
    /**
     * Instantiate a new `Rng` object to generate sequential noise-based pseudo-random numbers
     * @param {object} options {
     *   position: (optional) initial position in the noise,
     *   seed: (optional) seed for the noise,
     *   noiseFn: (optional) 1D noise function,
     * }
     * @returns a new `Rng` object
     */
    newRng: function Rngg_newRng(options) {
        options = options || {};
        if (options.seed === undefined) {
            options.seed = this.seedGenerator.roll();
        }
        return Rng.newRng(options);
    },
    /**
     * Instantiate a bi-dimensionnal Perlin noise generator
     *   from https://en.wikipedia.org/wiki/Perlin_noise
     * @param {object} options {
     *   interpolate: (optional) interpolation function,
     *   random2dNoise: (optional) random 2D noise function,
     *   seed: (optional) RNG seed,
     * }
     * @returns {object} a Perlin2D noise generator
     */
    newPerlin2D: function Rngg_newPerlin2D(options) {
        options = options || {};
        if (options.seed === undefined) {
            options.seed = this.seedGenerator.roll();
        }
        return Perlin.newPerlin2D(options);
    },
};

/** Call when loading */
export async function init(engine) {
    engine.registerResource(Resource_Rngg);
}

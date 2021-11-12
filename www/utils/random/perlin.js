import * as Interpolation from "../interpolation.js";
import * as SquirrelNoise from "./squirrelNoise5.js";

/**
 * largest possible 32bit signed integer
 */
const MAX_INT32 = ~(1 << 31);

/**
 * Bi-dimensionnal Perlin noise
 *  taken from https://en.wikipedia.org/wiki/Perlin_noise
 */
const Perlin2D = {
    /**
     * Always call init()
     * @param {object} initOptions {
     *   interpolate: (optional) interpolation function,
     *   random2dNoise: (optional) random 2D noise function,
     *   seed: (optional) RNG seed,
     *   spatialScale: (optional) { x, y } scale to resize the noise positions,
     * }
     */
    init: function Perlin2D_init(initOptions) {
        this.setDefaultOptions();
        this.setOptions(initOptions);
        /// Calculate theoritical amplitude of values
        // confirmed experimentally
        // and taken from https://digitalfreepen.com/2017/06/20/range-perlin-noise.html
        let numberOfDimensions = 2;  // 2 because bi-dimensionnal
        this.theoriticalAmplitude = Math.sqrt(numberOfDimensions / 4.0);
    },
    /**
     * Set all options to default, including seed
     */
    setDefaultOptions: function Perlin2D_setDefaultOptions() {
        this.interpolate = Interpolation.smootherstep;
        this.random2dNoise = SquirrelNoise.get2dNoiseZeroToOne;
        this.seed = 0;
        this.spatialScale = { x: 1.0, y: 1.0 };
    },
    /**
     * Set requested options to a new value
     * @param {object} options {
     *   interpolate: (optional) interpolation function,
     *   random2dNoise: (optional) random 2D noise function,
     *   seed: (optional) RNG seed,
     *   spatialScale: (optional) { x, y } scale to resize the noise positions,
     * }
     */
    setOptions: function Perlin2D_setOptions(options) {
        if (options === undefined) {
            return;
        }
        if (options.interpolate !== undefined) {
            this.interpolate = options.interpolate;
        }
        if (options.random2dNoise !== undefined) {
            this.random2dNoise = options.random2dNoise;
        }
        if (options.seed !== undefined) {
            this.seed = options.seed;
        }
        if (options.spatialScale !== undefined) {
            this.spatialScale = options.spatialScale;
        }
    },
    /**
     * Get noise at requested position, saturating the range [-1, 1], and scaled spatially
     * @param {object} position {x, y} position where to evaluate for noise
     */
    getValueSaturatedAt: function Perlin2D_getValueSaturatedAt(position) {
        return Interpolation.lerp(
            -1, 1,
            this.getValueAt(position),
            -this.theoriticalAmplitude, this.theoriticalAmplitude
        );
    },
    /**
     * Get noise at requested position, in the range of Perlin noise, but scaled spatially
     * @param {object} position {x, y} position where to evaluate for noise
     */
    getValueAt: function Perlin2D_getValueAt(position) {
        return this._getRawAt({
            x: position.x * 1.0 / this.spatialScale.x,
            y: position.y * 1.0 / this.spatialScale.y,
        })
    },
    /**
     * Get Perlin noise at requested position
     * @param {object} position {x, y} position where to evaluate for noise
     */
    _getRawAt: function Perlin2D_getRawAt(position) {
        const gridSides = this._getGridSides(position);
        const interpolationWeights = this._getInterpolationWeights(position, gridSides);

        const bottomleft = { i: gridSides.left, j: gridSides.bottom };
        const bottomright = { i: gridSides.right, j: gridSides.bottom };
        const topleft = { i: gridSides.left, j: gridSides.top };
        const topright = { i: gridSides.right, j: gridSides.top };

        // interpolate horizontally at the bottom
        const dotProduct_bottomleft = this._dotProductWithGridGradient(bottomleft, position);
        const dotProduct_bottomright = this._dotProductWithGridGradient(bottomright, position);
        const iNoiseInterpolatedAt_bottom = this.interpolate(dotProduct_bottomleft, dotProduct_bottomright, interpolationWeights.iRelative)

        // interpolate horizontally at the top
        const dotProduct_topleft = this._dotProductWithGridGradient(topleft, position);
        const dotProduct_topright = this._dotProductWithGridGradient(topright, position);
        const iNoiseInterpolatedAt_top = this.interpolate(dotProduct_topleft, dotProduct_topright, interpolationWeights.iRelative)

        // interpolate vertically
        return this.interpolate(iNoiseInterpolatedAt_bottom, iNoiseInterpolatedAt_top, interpolationWeights.jRelative)
    },
    /**
     * Determine grid cell surrounding the `position`
     * @param {object} position {x, y} position where to evaluate for noise
     * @returns {object} {left, right, bottom, top} grid sides surrounding the `position`
     */
    _getGridSides: function Perlin2D_getGridSides(position) {
        const left = Math.floor(position.x);
        const bottom = Math.floor(position.y);
        const right = left + 1;
        const top = bottom + 1;
        return {
            left: left,
            right: right,
            bottom: bottom,
            top: top,
        };
    },
    /**
     * Determine interpolation weights
     * @param {object} position {x, y} position where to evaluate for noise
     * @param {object} gridSides {left, right, bottom, top} grid sides surrounding the `position`
     * @returns {object} {sx, sy} weights of relative position inside the grid cell
     */
    _getInterpolationWeights: function Perlin2D_getInterpolationWeights(position, gridSides) {
        // Could also use higher order polynomial/s-curve here
        const iRelative = position.x - gridSides.left;
        const jRelative = position.y - gridSides.bottom;
        return {
            iRelative: iRelative,
            jRelative: jRelative,
        };
    },
    /**
     * Computes the dot product of the distance and gradient vectors.
     * @param {object} gridCornerPosition {i, j} grid cell coordinates of corner from where to calculate gradient
     * @param {object} position {x, y} position where to evaluate for noise
     * @returns {number} value of the dot product with the gradient
     */
    _dotProductWithGridGradient: function Perlin2D_dotProductWithGridGradient(gridCornerPosition, position) {
        const gradient = this._randomUnitVector(gridCornerPosition);
        const xDistanceToCorner = position.x - gridCornerPosition.i;
        const yDistanceToCorner = position.y - gridCornerPosition.j;
        // Compute the dot-product
        return xDistanceToCorner * gradient.x + yDistanceToCorner * gradient.y;
    },
    /**
     * Get gradient from integer coordinates : create pseudorandom direction vector
     * @param {object} gridCornerPosition {i, j} grid cell coordinates where to calculate gradient
     * @returns {object} {x, y} coordinates of unit vector
     */
    _randomUnitVector: function Perlin2D_randomUnitVector(gridCornerPosition) {
        const randomAngle = 2 * Math.PI * this._random2D(gridCornerPosition);
        return {
            x: Math.sin(randomAngle),
            y: Math.cos(randomAngle),
        };
    },
    /**
     * Unique pseudorandom number for each pair of coordinates
     * @param {object} gridCornerPosition {i, j} grid cell coordinates where to calculate gradient
     * @returns {number} pseudorandom float in [0, 1]
     */
    _random2D: function _random2D(gridCornerPosition) {
        return this.random2dNoise(gridCornerPosition.i, gridCornerPosition.j, this.seed);
    }
};

/**
 * Instantiate a bi-dimensionnal Perlin noise generator
 *   from https://en.wikipedia.org/wiki/Perlin_noise
 * @param {object} initOptions {
 *   interpolate: (optional) interpolation function,
 *   random2dNoise: (optional) random 2D noise function,
 *   seed: (optional) RNG seed,
 * }
 * @returns {object} a Perlin2D noise generator
 */
export function newPerlin2D(initOptions) {
    const o = Object.create(Perlin2D);
    o.init(initOptions);
    return o;
}

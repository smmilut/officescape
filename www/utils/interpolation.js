/**
 * Interpolation utilities
 * @module interpolation
 */

/**
 * Linear interpolation between value0 and value1, for parameter t between edge0 and edge1
 * @param {number} value0 value at point "0" where transition begins and `t == edge0`
 * @param {number} value1 value at point "1" where transition ends and `t == edge1`
 * @param {number} t relative position inside the transition, between point "0" and point "1" expressed as number inside [edge0, edge1] interval
 * @param {number} edge0 (optional, default 0.0) parameter value when the transition begins, and where `result == value0`
 * @param {number} edge1 (optional, default 1.0) parameter value when the transition ends, and where `result == value1`
 * @returns {number} interpolated value in the interval
 */
export function lerp(value0, value1, t, edge0, edge1) {
    if (edge0 === undefined) {
        edge0 = 0.0;
    }
    if (edge1 === undefined) {
        edge1 = 1.0;
    }
    // Scale, bias and saturate x to [0, 1] range
    t = clamp((t - edge0) / (edge1 - edge0), 0.0, 1.0);
    return (1.0 - t) * value0 + t * value1;
}

/**
 * Smooth interpolation between value0 and value1, for parameter t between edge0 and edge1
 * @param {number} value0 value at point "0" where transition begins and `t == edge0`
 * @param {number} value1 value at point "1" where transition ends and `t == edge1`
 * @param {number} t relative position inside the transition, between point "0" and point "1" expressed as number inside [edge0, edge1] interval
 * @param {number} edge0 (optional, default 0.0) parameter value when the transition begins, and where `result == value0`
 * @param {number} edge1 (optional, default 1.0) parameter value when the transition ends, and where `result == value1`
 * @returns {number} interpolated value in the interval
 */
export function smoothstep(value0, value1, t, edge0, edge1) {
    if (edge0 === undefined) {
        edge0 = 0.0;
    }
    if (edge1 === undefined) {
        edge1 = 1.0;
    }
    // Scale, bias and saturate x to 0..1 range
    t = clamp((t - edge0) / (edge1 - edge0), 0.0, 1.0);
    // Evaluate polynomial
    return value0 + (value1 - value0) * t * t * (3.0 - 2.0 * t);
}

/**
 * Smoother interpolation between value0 and value1, for parameter t between edge0 and edge1
 * @param {number} value0 value at point "0" where transition begins and `t == edge0`
 * @param {number} value1 value at point "1" where transition ends and `t == edge1`
 * @param {number} t relative position inside the transition, between point "0" and point "1" expressed as number inside [edge0, edge1] interval
 * @param {number} edge0 (optional, default 0.0) parameter value when the transition begins, and where `result == value0`
 * @param {number} edge1 (optional, default 1.0) parameter value when the transition ends, and where `result == value1`
 * @returns {number} interpolated value in the interval
 */
export function smootherstep(value0, value1, t, edge0, edge1) {
    if (edge0 === undefined) {
        edge0 = 0.0;
    }
    if (edge1 === undefined) {
        edge1 = 1.0;
    }
    // Scale, bias and saturate x to 0..1 range
    t = clamp((t - edge0) / (edge1 - edge0), 0.0, 1.0);
    // Evaluate polynomial
    return value0 + (value1 - value0) * t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

/**
 * clamp a value between a lower and higher bound
 * @param {number} x input value that we want to clamp
 * @param {number} lowerLimit `x` cannot be lower than this value
 * @param {number} upperLimit `x` cannot be higher than this value
 * @returns 
 */
export function clamp(x, lowerLimit, upperLimit) {
    if (x < lowerLimit) {
        return lowerLimit;
    } else if (x > upperLimit) {
        return upperLimit;
    } else {
        return x;
    }
}
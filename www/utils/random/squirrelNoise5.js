/** SquirrelNoise5 - Squirrel's Raw Noise utilities (version 5)
 *   taken from http://eiserloh.net/noise/SquirrelNoise5.hpp
 *
 * This code is made available under the Creative Commons attribution 3.0 license (CC-BY-3.0 US):
 *	Attribution in source code comments (even closed-source/commercial code) is sufficient.
 *	License summary and text available at: https://creativecommons.org/licenses/by/3.0/us/
 *
 * These noise functions were written by Squirrel Eiserloh as a cheap and simple substitute for
 *	the [sometimes awful] bit-noise sample code functions commonly found on the web, many of which
 *	are hugely biased or terribly patterned, e.g. having bits which are on (or off) 75% or even
 *	100% of the time (or are excessively overkill/slow for our needs, such as MD5 or SHA).
 *
 * Note: This is work in progress; not all functions have been tested.  Use at your own risk.
 *	Please report any bugs, issues, or bothersome cases to SquirrelEiserloh at gmail.com.
 *
 * The following functions are all based on a simple bit-noise hash function which returns an
 *	unsigned integer containing 32 reasonably-well-scrambled bits, based on a given (signed)
 *	integer input parameter (position/index) and [optional] seed.  Kind of like looking up a
 *	value in an infinitely large [non-existent] table of previously rolled random numbers.
 *
 * These functions are deterministic and random-access / order-independent (i.e. state-free),
 *	so they are particularly well-suited for use in smoothed/fractal/simplex/Perlin noise
 *	functions and out-of-order (or or-demand) procedural content generation (i.e. that mountain
 *	village is the same whether you generated it first or last, ahead of time or just now).
 *
 * The N-dimensional variations simply hash their multidimensional coordinates down to a single
 *	32-bit index and then proceed as usual, so while results are not unique they should
 *	(hopefully) not seem locally predictable or repetitive.
 *
 */

/** largest possible 32bit signed integer
 */
const MAX_INT32 = ~(1 << 31);

/** Fast hash of an int32 into a different (unrecognizable) uint32.
 *
 * Returns an unsigned integer containing 32 reasonably-well-scrambled bits, based on the hash
 *	of a given (signed) integer input parameter (position/index) and [optional] seed.  Kind of
 *	like looking up a value in an infinitely large table of previously generated random numbers.
 *
 * I call this particular approach SquirrelNoise5 (5th iteration of my 1D raw noise function).
 *
 * Many thanks to Peter Schmidt-Nielsen whose outstanding analysis helped identify a weakness
 *	in the SquirrelNoise3 code I originally used in my GDC 2017 talk, "Noise-based RNG".
 *	Version 5 avoids a noise repetition found in version 3 at extremely high position values
 *	caused by a lack of influence by some of the high input bits onto some of the low output bits.
 *
 * The revised SquirrelNoise5 function ensures all input bits affect all output bits, and to
 *	(for me) a statistically acceptable degree.  I believe the worst-case here is in the amount
 *	of influence input position bit #30 has on output noise bit #0 (49.99%, vs. 50% ideal).
 * @param {number} index integer position where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} an unsigned integer containing 32 reasonably-well-scrambled bits, based on the hash
 *	of a given (signed) integer input parameter (position/index) and [optional] seed.  Kind of
 *	like looking up a value in an infinitely large table of previously generated random numbers.
 */
function squirrelNoise5(index, seed = 0) {
    const SQ5_BIT_NOISE1 = 0xd2a80a3f;  // 11010010101010000000101000111111
    const SQ5_BIT_NOISE2 = 0xa884f197;  // 10101000100001001111000110010111
    const SQ5_BIT_NOISE3 = 0x6C736F4B;  // 01101100011100110110111101001011
    const SQ5_BIT_NOISE4 = 0xB79F3ABB;  // 10110111100111110011101010111011
    const SQ5_BIT_NOISE5 = 0x1b56c4f5;  // 00011011010101101100010011110101

    let mangledBits = index;  // could explicitly convert here
    mangledBits *= SQ5_BIT_NOISE1;
    mangledBits += seed;
    mangledBits ^= (mangledBits >> 9);
    mangledBits += SQ5_BIT_NOISE2;
    mangledBits ^= (mangledBits >> 11);
    mangledBits *= SQ5_BIT_NOISE3;
    mangledBits ^= (mangledBits >> 13);
    mangledBits += SQ5_BIT_NOISE4;
    mangledBits ^= (mangledBits >> 15);
    mangledBits *= SQ5_BIT_NOISE5;
    mangledBits ^= (mangledBits >> 17);
    return mangledBits;
}

//-----------------------------------------------------------------------------------------------
// Raw pseudorandom noise functions (random-access / deterministic).  Basis of all other noise.
//
/**
 * Fast hash of an int32 into a different (unrecognizable) uint32.
 * @param {number} index integer position (X) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} an unsigned integer containing 32 reasonably-well-scrambled bits based on a hash of the input
 */
export function get1dNoiseUint(index, seed = 0) {
    return squirrelNoise5(index, seed);
}

/**
 * Fast hash of two int32 into a different (unrecognizable) uint32.
 * @param {number} indexX first integer position (X) where to evaluate for noise
 * @param {number} indexY second integer position (Y) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} an unsigned integer containing 32 reasonably-well-scrambled bits based on a hash of the input
 */
export function get2dNoiseUint(indexX, indexY, seed = 0) {
    const PRIME_NUMBER = 198491317; // Large prime number with non-boring bits
    return squirrelNoise5(indexX + (PRIME_NUMBER * indexY), seed);
}

/**
 * Fast hash of three int32 into a different (unrecognizable) uint32.
 * @param {number} indexX first integer position (X) where to evaluate for noise
 * @param {number} indexY second integer position (Y) where to evaluate for noise
 * @param {number} indexZ third integer position (Z) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} an unsigned integer containing 32 reasonably-well-scrambled bits based on a hash of the input
 */
export function get3dNoiseUint(indexX, indexY, indexZ, seed = 0) {
    const PRIME1 = 198491317; // Large prime number with non-boring bits
    const PRIME2 = 6542989; // Large prime number with distinct and non-boring bits
    return squirrelNoise5(indexX + (PRIME1 * indexY) + (PRIME2 * indexZ), seed);
}

/**
 * Fast hash of four int32 into a different (unrecognizable) uint32.
 * @param {number} indexX first integer position (X) where to evaluate for noise
 * @param {number} indexY second integer position (Y) where to evaluate for noise
 * @param {number} indexZ third integer position (Z) where to evaluate for noise
 * @param {number} indexT third integer position (T) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} an unsigned integer containing 32 reasonably-well-scrambled bits based on a hash of the input
 */
export function get4dNoiseUint(indexX, indexY, indexZ, indexT, seed) {
    const PRIME1 = 198491317; // Large prime number with non-boring bits
    const PRIME2 = 6542989; // Large prime number with distinct and non-boring bits
    const PRIME3 = 357239; // Large prime number with distinct and non-boring bits
    return squirrelNoise5(indexX + (PRIME1 * indexY) + (PRIME2 * indexZ) + (PRIME3 * indexT), seed);
}

//-----------------------------------------------------------------------------------------------
// Same functions, mapped to floats in [0,1] for convenience.
//
/**
 * Fast hash of an int32 into a float in [0,1].
 * @param {number} index integer position (X) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} a float in [0,1] reasonably-well-scrambled based on a hash of the input
 */
export function get1dNoiseZeroToOne(index, seed = 0) {
    return squirrelNoise5(index, seed) * 1.0 / MAX_INT32;
}

/**
 * Fast hash of an int32 into a float in [0,1].
 * @param {number} indexX first integer position (X) where to evaluate for noise
 * @param {number} indexY second integer position (Y) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} a float in [0,1] reasonably-well-scrambled based on a hash of the input
 */
export function get2dNoiseZeroToOne(indexX, indexY, seed = 0) {
    return get2dNoiseUint(indexX, indexY, seed) * 1.0 / MAX_INT32;
}

/**
 * Fast hash of an int32 into a float in [0,1].
 * @param {number} indexX first integer position (X) where to evaluate for noise
 * @param {number} indexY second integer position (Y) where to evaluate for noise
 * @param {number} indexZ third integer position (Z) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} a float in [0,1] reasonably-well-scrambled based on a hash of the input
 */
export function get3dNoiseZeroToOne(indexX, indexY, indexZ, seed = 0) {
    return get3dNoiseUint(indexX, indexY, indexZ, seed) * 1.0 / MAX_INT32;
}

/**
 * Fast hash of an int32 into a float in [0,1].
 * @param {number} indexX first integer position (X) where to evaluate for noise
 * @param {number} indexY second integer position (Y) where to evaluate for noise
 * @param {number} indexZ third integer position (Z) where to evaluate for noise
 * @param {number} indexT third integer position (T) where to evaluate for noise
 * @param {number} seed integer seed to get a different set of values
 * @returns {number} a float in [0,1] reasonably-well-scrambled based on a hash of the input
 */
export function get4dNoiseZeroToOne(indexX, indexY, indexZ, indexT, seed = 0) {
    return get4dNoiseUint(indexX, indexY, indexZ, indexT, seed) * 1.0 / MAX_INT32;
}

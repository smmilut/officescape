import * as Browser from "./browser.js";
import * as Time from "./time.js";
import * as Random from "./random/random.js";
/**
 * Common utilities
 * @module utils
 */


/**
 * Init all sub modules
 * 
 * Call this first.
 */
 function initSubModules(engine) {
    Browser.init(engine);
    Time.init(engine);
    Random.init(engine);
}

/** Call when loading */
export function init(engine) {
    initSubModules(engine);
}

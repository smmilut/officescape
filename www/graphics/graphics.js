import * as Camera from "./camera.js";
import * as Sprites from "./sprites.js";
import * as TileSprites from "./tileSprites.js";
/**
 * Graphics-related sub-modules
 * @module graphics
 */

/**
 * Init all sub modules
 * 
 * Call this first.
 */
function initSubModules(engine) {
    Camera.init(engine);
    Sprites.init(engine);
    TileSprites.init(engine);
}

/** Call when loading */
export function init(engine) {
    initSubModules(engine);
}

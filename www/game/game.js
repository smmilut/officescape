import * as Actions from "./actions.js";
import * as LevelMap from "./levelMap.js";
import * as Physics from "./physics.js";
import * as Player from "./player.js";

/**
 * Game-specific modules
 * @module game
 */


function initSubModules(engine) {
    Actions.init(engine);
    LevelMap.init(engine);
    Physics.init(engine);
    Player.init(engine);
}

/** Call when loading */
export function init(engine) {
    initSubModules(engine);
}

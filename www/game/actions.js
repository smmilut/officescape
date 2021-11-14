/**
 * Character actions : Components and constants for interaction
 */

/** Enum of action poses */
export const ACTION_POSE = Object.freeze({
    UNUSED: "*unused*", // pose exists in the sprite sheet, but not in the game
    NONE: "",
    STAND: "Stand",
    WALK: "Walk",
    Using: "Using",
    WALKPANIC: "WalkPanic",
    PINNED: "Pinned",
    JUMP: "Jump",
    ATTACK: "Attack",
});

/** Enum of facing directions */
export const FACING = Object.freeze({
    NONE: "",
    LEFT: "Left",
    RIGHT: "Right",
});

export function newComponent_Facing(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "facing",
        direction: initOptions.direction || FACING.LEFT,
    };
};

/** Call when loading */
export function init(engine) {
    /// nothing for now
}
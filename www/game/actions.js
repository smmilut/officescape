/**
 * Character actions : Components and constants for interaction
 */

/** Enum of action poses */
export const ACTION_POSE = Object.freeze({
    UNUSED: "*unused*", // pose exists in the sprite sheet, but not in the game
    NONE: "",
    STAND: "Stand",
    WALK: "Walk",
    USING: "Using",
    IDLE: "Idle",
    SPAWNING: "Spawning",
    WALKPANIC: "WalkPanic",
    PINNED: "Pinned",
    ATTACKED: "Attacked",
    DEAD: "Dead",
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
        FACING: FACING,
        direction: initOptions.direction || FACING.LEFT,
    };
};

const Component_Attack = {
    name: "attack",
    init: function Attack_init() {
        this._isAttacking = false;
        this._isAttackReady = true;
    },
    tryApply: function Attack_tryApply() {
        if (this._isAttackReady) {
            this._isAttacking = true;
            this._isAttackReady = false;
        }
    },
    stop: function Attack_stop() {
        this._isAttacking = false;
    },
    rearm: function Attack_rearm() {
        this._isAttackReady = true;
    },
    isAttacking: function Attack_isAttacking() {
        return this._isAttacking;
    },
};

export function newComponent_Attack(_initOptions) {
    const attack = Object.create(Component_Attack);
    attack.init();
    return attack;
};

/** Call when loading */
export function init(engine) {
    /// nothing for now
}
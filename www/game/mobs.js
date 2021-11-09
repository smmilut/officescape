import * as Physics from "./physics.js";
import * as Actions from "./actions.js";
/**
 * Manage enemies
 * @module mobs
 */

/** Component to tag if an Entity is a "mob" (an enemy) */
function newComponent_TagMob(_initOptions) {
    return {
        name: "tagMob",
    };
};

/** Enum of mob states */
const MOB_STATES = Object.freeze({
    STANDING: 0,
    WALKING: 1,
});

function newComponent_MobState(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "mobState",
        state: initOptions.state,
    };
};

async function spawnNewMob(engine, spriteServer, tileCenter) {
    const animatedSprite = spriteServer.getNew("bossMoustache");
    const spriteImage = animatedSprite.getComponent_spriteImage();
    const drawPosition = animatedSprite.getComponent_drawPosition();
    const collisionRectangle = Physics.newCollisionRectangle({
        size: {
            x: 6,
            y: 2,
        },
        positionRelativeToAnchor: {
            x: 0,
            y: 0,
        },
    });
    return engine.spawn()
        .addComponent(newComponent_TagMob())
        .addComponent(newComponent_MobState({
            state: MOB_STATES.STANDING,
        }))
        .addComponent(Physics.newComponent_worldPosition(tileCenter))
        .addComponent(Physics.newComponent_Speed({
            increment: 10.0,
        }))
        .addComponent(Actions.newComponent_Facing())
        .addComponent(drawPosition)
        .addComponent(collisionRectangle)
        .addComponent(animatedSprite)
        .addComponent(spriteImage);
}

const System_spawnMobs = {
    name: "spawnMobs",
    resourceQuery: ["spriteServer"],
    promiseRun: async function spawnMobs(queryResults) {
        const engine = queryResults.engine;
        const spriteServer = queryResults.resources.spriteServer;
        await spawnNewMob(engine, spriteServer, { x: 40, y: 40 });
        await spawnNewMob(engine, spriteServer, { x: 100, y: 100 });
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_spawnMobs);
}
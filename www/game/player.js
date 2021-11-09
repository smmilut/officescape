import * as Physics from "./physics.js";
import * as Actions from "./actions.js";
/**
 * Manage player
 * @module player
 */

/** Component to tag if an Entity is a (the) player */
function newComponent_TagPlayer(_initOptions) {
    return {
        name: "tagPlayer",
    };
};

const System_handleInput = {
    name: "handleInput",
    resourceQuery: ["input"],
    componentQueries: {
        player: ["speed", "facing", "animatedSprite", "tagPlayer"],
    },
    run: function handleInput(queryResults) {
        let input = queryResults.resources.input;
        for (let p of queryResults.components.player) {
            let actionName = Actions.ACTION_POSE.STAND;
            if (input.isKeyDown(input.USER_ACTION.LEFT)) {
                p.speed.incrementLeft();
                actionName = Actions.ACTION_POSE.WALK;
                p.facing.direction = Actions.FACING.LEFT;
            } else if (input.isKeyDown(input.USER_ACTION.RIGHT)) {
                p.speed.incrementRight();
                actionName = Actions.ACTION_POSE.WALK;
                p.facing.direction = Actions.FACING.RIGHT;
            }
            if (input.isKeyDown(input.USER_ACTION.DOWN)) {
                p.speed.incrementDown();
                actionName = Actions.ACTION_POSE.WALK;
            } else if (input.isKeyDown(input.USER_ACTION.UP)) {
                p.speed.incrementUp();
                actionName = Actions.ACTION_POSE.WALK;
            }
            p.animatedSprite.setPose({
                action: actionName,
                facing: p.facing.direction,
            });
        }
    },
};

async function spawnNewPlayer(engine, spriteServer, tileCenter) {
    const animatedSprite = spriteServer.getNew("rockerGuitar");
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
        .addComponent(newComponent_TagPlayer())
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

const System_spawnPlayer = {
    name: "spawnPlayer",
    resourceQuery: ["spriteServer"],
    promiseRun: async function spawnPlayer(queryResults) {
        const engine = queryResults.engine;
        const spriteServer = queryResults.resources.spriteServer;
        await spawnNewPlayer(engine, spriteServer, { x: 20, y: 20 });
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_spawnPlayer);
    engine.registerSystem(System_handleInput);
}

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
        players: ["speed", "facing", "animatedSprite", "attack", "tagPlayer"],
    },
    run: function handleInput(queryResults) {
        let input = queryResults.resources.input;
        for (const player of queryResults.components.players) {
            let actionName = Actions.ACTION_POSE.STAND;
            let isKeepFrameProgress = false;
            if (input.isKeyDown(input.USER_ACTION.ATTACK)) {
                /// user wants to attack
                player.attack.tryApply();
            } else if (input.isKeyUp(input.USER_ACTION.ATTACK)) {
                /// user stops attack
                player.attack.rearm();
            }
            if (player.attack.isAttacking()) {
                /// attack is actually in progress
                if (player.animatedSprite.isStopped()) {
                    /// attack has completed
                    player.attack.stop();
                } else {
                    /// attack still in progress
                    actionName = Actions.ACTION_POSE.ATTACK;
                }
            }
            if (input.isKeyDown(input.USER_ACTION.LEFT)) {
                if (player.facing.direction !== Actions.FACING.LEFT) {
                    isKeepFrameProgress = true;
                }
                player.facing.direction = Actions.FACING.LEFT;
                player.speed.incrementLeft();
                if (!player.attack.isAttacking()) {
                    actionName = Actions.ACTION_POSE.WALK;
                }
            } else if (input.isKeyDown(input.USER_ACTION.RIGHT)) {
                if (player.facing.direction !== Actions.FACING.RIGHT) {
                    isKeepFrameProgress = true;
                }
                player.facing.direction = Actions.FACING.RIGHT;
                player.speed.incrementRight();
                if (!player.attack.isAttacking()) {
                    actionName = Actions.ACTION_POSE.WALK;
                }
            }
            if (input.isKeyDown(input.USER_ACTION.DOWN)) {
                player.speed.incrementDown();
                if (!player.attack.isAttacking()) {
                    actionName = Actions.ACTION_POSE.WALK;
                }
            } else if (input.isKeyDown(input.USER_ACTION.UP)) {
                player.speed.incrementUp();
                if (!player.attack.isAttacking()) {
                    actionName = Actions.ACTION_POSE.WALK;
                }
            }
            player.animatedSprite.setPose({
                action: actionName,
                facing: player.facing.direction,
                isKeepFrameProgress: isKeepFrameProgress,
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
            x: 10,
            y: 3,
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
        .addComponent(Actions.newComponent_Attack())
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

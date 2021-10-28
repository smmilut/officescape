import * as Physics from "./physics.js";
import * as Actions from "./actions.js";
import * as Sprites from "../graphics/sprites.js";
/**
 * Manage player
 * @module player
 */

/** Component to tag if an Entity is a (the) player */
const newTagPlayer = function newTagPlayer(_initOptions) {
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

async function spawnNewPlayer(engine, pixelCanvas, tileCenter) {
    const animatedSprite = await Sprites.newComponent_AnimatedSprite({
        sheetSrc: "assets/devil_sheet.png",
        sheetConfigUrl: "assets/devil_sheet.json",
        pixelCanvas: pixelCanvas,
    });
    const frameImage = animatedSprite.getFrameImage();
    const spriteImage = Sprites.newComponent_spriteImage(frameImage);
    const drawCenter = animatedSprite.getDrawCenter();
    const drawPosition = Sprites.newComponent_drawPosition({
        drawCenter: drawCenter,
    });
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
        .addComponent(newTagPlayer())
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
    resourceQuery: ["pixelCanvas"],
    promiseRun: async function spawnPlayer(queryResults) {
        const engine = queryResults.engine;
        const pixelCanvas = queryResults.resources.pixelCanvas;
        await spawnNewPlayer(engine, pixelCanvas, { x: 20, y: 20 });
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_spawnPlayer);
    engine.registerSystem(System_handleInput);
}

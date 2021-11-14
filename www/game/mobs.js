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

const System_mobBehave = {
    name: "mobBehave",
    resourceQuery: ["rngg", "time"],
    componentQueries: {
        mobs: ["speed", "facing", "animatedSprite", "mobState", "tagMob"],
    },
    run: function mobBehave(queryResults) {
        const time = queryResults.resources.time;
        const rngg = queryResults.resources.rngg;
        const mobRng = rngg.getRng("mobRng");
        if (time.isPaused()) {
            return;
        }
        for (let e of queryResults.components.mobs) {
            /* TODO : program the real behaviour
                This is for now only a simple trick to get things moving.
            */
            let actionName = Actions.ACTION_POSE.NONE;
            switch (e.mobState.state) {
                case MOB_STATES.STANDING:
                    actionName = Actions.ACTION_POSE.STAND;
                    e.speed.x = 0;
                    e.speed.y = 0;
                    break;
                case MOB_STATES.WALKING:
                    actionName = Actions.ACTION_POSE.WALK;
                    const randChangeDirection = mobRng.roll();
                    if (randChangeDirection < 0.02) {
                        /// pick a random direction
                        const randDirectionChoiceX = mobRng.roll();
                        const randDirectionChoiceY = mobRng.roll();
                        if (randDirectionChoiceX < 0.3) {
                            e.speed.x = -1;
                        } else if (randDirectionChoiceX < 0.6) {
                            e.speed.x = 1;
                        }
                        if (randDirectionChoiceY < 0.3) {
                            e.speed.y = -1;
                        } else if (randDirectionChoiceY < 0.6) {
                            e.speed.y = 1;
                        }
                    } else {
                        /// somehow continue in the direction
                        if (e.speed.x > 0) {
                            e.speed.incrementRight();
                        } else {
                            e.speed.incrementLeft();
                        }
                        if (e.speed.y > 0) {
                            e.speed.incrementDown();
                        } else {
                            e.speed.incrementUp();
                        }
                    }
                    break;
            }
            if (e.speed.x > 0) {
                e.facing.direction = Actions.FACING.RIGHT;
            } else if (e.speed.x < 0) {
                e.facing.direction = Actions.FACING.LEFT;
            }
            e.animatedSprite.setPose({
                action: actionName,
                facing: e.facing.direction
            });
        }
    },
};

function spawnNewMob(engine, spriteServer, mobRng, position) {
    const state = mobRng.selectWeighted([
        {
            value: MOB_STATES.WALKING,
            weight: 2,
        },
        {
            value: MOB_STATES.STANDING,
            weight: 1,
        },
    ]);
    const facing = mobRng.selectWeighted([
        {
            value: Actions.FACING.LEFT,
            weight: 1,
        },
        {
            value: Actions.FACING.RIGHT,
            weight: 1,
        },
    ]);
    const spriteName = mobRng.selectWeighted([
        {
            value: "bossMoustache",
            weight: 1,
        },
        {
            value: "bossLady",
            weight: 1,
        },
        {
            value: "zombieLame",
            weight: 1,
        },
        {
            value: "zombieHairy",
            weight: 1,
        },
    ]);
    const animatedSprite = spriteServer.getNew(spriteName);
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
            state: state,
        }))
        .addComponent(Physics.newComponent_worldPosition(position))
        .addComponent(Physics.newComponent_Speed({
            increment: 5.0,
        }))
        .addComponent(Actions.newComponent_Facing({
            direction: facing,
        }))
        .addComponent(drawPosition)
        .addComponent(collisionRectangle)
        .addComponent(animatedSprite)
        .addComponent(spriteImage);
}


function spawnSpawnpoint(engine, spriteServer, position) {
    const animatedSprite = spriteServer.getNew("waterfountain");
    const spriteImage = animatedSprite.getComponent_spriteImage();
    const drawPosition = animatedSprite.getComponent_drawPosition();
    return engine.spawn()
        .addComponent(Physics.newComponent_worldPosition({
            x: position.x,
            y: position.y - 8,
        }))
        .addComponent(drawPosition)
        .addComponent(animatedSprite)
        .addComponent(spriteImage);
}

const System_spawnMobs = {
    name: "spawnMobs",
    resourceQuery: ["rngg", "spriteServer", "levelMap"],
    run: function spawnMobs(queryResults) {
        let debugMobCounter = 0;
        console.log("spawning mobs");
        const engine = queryResults.engine;
        const spriteServer = queryResults.resources.spriteServer;
        const levelMap = queryResults.resources.levelMap;
        const levelData = levelMap.data;
        const tileWidth = levelMap.tileWidth;
        const tileHeight = levelMap.tileHeight;
        const rngg = queryResults.resources.rngg;
        const mobRng = rngg.getRng("mobRng");
        /// iterate the level map data
        for (let rowIndex = 0, tileCenterY = Math.floor(tileHeight / 2); rowIndex < levelData.length; rowIndex++, tileCenterY += tileHeight) {
            const row = levelData[rowIndex];
            for (let columnIndex = 0, tileCenterX = Math.floor(tileWidth / 2); columnIndex < row.length; columnIndex++, tileCenterX += tileWidth) {
                const cellValue = row[columnIndex];
                if (cellValue.content !== undefined) {
                    for (const content of cellValue.content) {
                        if (content.type === levelMap.CELL_CONTENT_TYPE.MOBSPAWNPOINT) {
                            const position = {
                                x: tileCenterX,
                                y: tileCenterY,
                            };
                            debugMobCounter++;
                            spawnNewMob(engine, spriteServer, mobRng, position);
                            spawnSpawnpoint(engine, spriteServer, position);
                        }
                    }
                }
            }
        }
        console.log("finished spawning", debugMobCounter, "mobs")
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_spawnMobs);
    engine.registerSystem(System_mobBehave);
}
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

/** Instantiate a new "mobState" Component */
function newComponent_MobState(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "mobState",
        state: initOptions.state,
    };
};

/** Behaviour of colleagues / human enemies */
const System_mobBehave = {
    name: "mobBehave",
    resourceQuery: ["rngg", "time"],
    componentQueries: {
        mobs: ["speed", "facing", "animatedSprite", "mobState", "tagMob"],
    },
    run: function mobBehave(queryResults) {
        const time = queryResults.resources.time;
        if (time.isPaused()) {
            return;
        }
        const rngg = queryResults.resources.rngg;
        const mobRng = rngg.getRng("mobRng");
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

/** Spawn a new entity for a colleague / human enemy */
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

/**
 * Spawn a new entity for a spawnpoint of colleague / human enemy
 * This is to visualize where the colleague spawned from
 * (mostly for debug pruposes for now)
 */
function spawnMobspawnpoint(engine, spriteServer, position) {
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

/**
 * Spawn 2 types of "mobs" :
 *  - on MOBSPAWNPOINT : a single human colleague and a visualization of their spawn point
 *  - on WORKSPAWNPOINT : a spawnpoint for later spawning work
 */
const System_spawnMobs = {
    name: "spawnMobs",
    resourceQuery: ["rngg", "spriteServer", "levelMap"],
    run: function spawnMobs(queryResults) {
        let debugMobCounter = 0;
        let debugWorkCounter = 0;
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
                            /// spawn a colleague
                            spawnNewMob(engine, spriteServer, mobRng, position);
                            /// visualize the colleague spawn point
                            spawnMobspawnpoint(engine, spriteServer, position);
                        } else if (content.type === levelMap.CELL_CONTENT_TYPE.WORKSPAWNPOINT) {
                            const position = {
                                x: tileCenterX,
                                y: tileCenterY,
                            };
                            spawnWorkspawnpoint(engine, spriteServer, position);
                            debugWorkCounter++;
                        }
                    }
                }
            }
        }
        console.log("finished spawning", debugMobCounter, "mobs and ", debugWorkCounter, "xerox machines")
    },
};


/** Component to tag if an Entity is a "workspawnpoint" (a point that will spawn work) */
function newComponent_TagWorkspawnpoint(_initOptions) {
    return {
        name: "tagWorkspawnpoint",
    };
};

/** Enum of spawnpoint states */
const SPAWNPOINT_STATES = Object.freeze({
    IDLE: 0,
    SPAWNING: 1,
});

function newComponent_spawnpointState(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "spawnpointState",
        state: initOptions.state,
    };
};

/**
 * Spawn a Spawnpoint for work. That Spawnpoint will spawn work.
 */
function spawnWorkspawnpoint(engine, spriteServer, position) {
    const animatedSprite = spriteServer.getNew("xerox");
    const spriteImage = animatedSprite.getComponent_spriteImage();
    const drawPosition = animatedSprite.getComponent_drawPosition();
    return engine.spawn()
        .addComponent(newComponent_TagWorkspawnpoint())
        .addComponent(newComponent_spawnpointState({
            state: SPAWNPOINT_STATES.IDLE,
        }))
        .addComponent(Physics.newComponent_worldPosition(position))
        .addComponent(drawPosition)
        .addComponent(animatedSprite)
        .addComponent(spriteImage);
}


/** Component to tag if an Entity is a "work" (an enemy that is work) */
function newComponent_TagWork(_initOptions) {
    return {
        name: "tagWork",
    };
};

/** Enum of spawnpoint states */
const WORK_STATES = Object.freeze({
    STANDING: 0,
    WALKING: 1,
    ANGRY: 2,
    ATTACKED: 3,
    DEAD: 4,
});

function newComponent_workState(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "workState",
        WORK_STATES: WORK_STATES,
        state: initOptions.state,
    };
};

/** Spawn a single Work entity */
function spawnWork(engine, spriteServer, workRng, position) {
    const facing = workRng.selectWeighted([
        {
            value: Actions.FACING.LEFT,
            weight: 1,
        },
        {
            value: Actions.FACING.RIGHT,
            weight: 1,
        },
    ]);
    const spriteName = workRng.selectWeighted([
        {
            value: "stapler",
            weight: 1,
        },
        {
            value: "scissors",
            weight: 1,
        },
        {
            value: "mouse",
            weight: 1,
        },
        {
            value: "folderfly",
            weight: 1,
        },
    ]);
    const animatedSprite = spriteServer.getNew(spriteName);
    const spriteImage = animatedSprite.getComponent_spriteImage();
    const drawPosition = animatedSprite.getComponent_drawPosition();
    const collisionRectangle = Physics.newCollisionRectangle({
        size: {
            x: 12,
            y: 8,
        },
        positionRelativeToAnchor: {
            x: 0,
            y: 0,
        },
    });
    return engine.spawn()
        .addComponent(newComponent_TagWork())
        .addComponent(newComponent_workState({
            state: WORK_STATES.WALKING,
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

/** Behavior of spawnpoints */
const System_spawnpointBehave = {
    name: "spawnpointBehave",
    resourceQuery: ["time", "rngg", "spriteServer"],
    componentQueries: {
        spawnpoints: ["tagWorkspawnpoint", "spawnpointState", "animatedSprite", "worldPosition"],
    },
    run: function spawnpointBehave(queryResults) {
        const time = queryResults.resources.time;
        if (time.isPaused()) {
            return;
        }
        const engine = queryResults.engine;
        const spriteServer = queryResults.resources.spriteServer;
        const rngg = queryResults.resources.rngg;
        const workRng = rngg.getRng("workRng");
        for (let s of queryResults.components.spawnpoints) {
            /* TODO : program the real behaviour
                This is for now only a simple trick to get things moving.
            */
            switch (s.spawnpointState.state) {
                case SPAWNPOINT_STATES.IDLE:
                    if (workRng.isChance(0.0005)) {
                        /// changing to SPAWNING
                        s.spawnpointState.state = SPAWNPOINT_STATES.SPAWNING;
                        s.animatedSprite.setPose({
                            name: Actions.ACTION_POSE.SPAWNING,
                        });
                    }
                    break;
                case SPAWNPOINT_STATES.SPAWNING:
                    if (s.animatedSprite.isStopped()) {
                        /// spawning animation has completed
                        spawnWork(engine, spriteServer, workRng, s.worldPosition);
                        /// go back to IDLE state
                        s.spawnpointState.state = SPAWNPOINT_STATES.IDLE;
                        s.animatedSprite.setPose({
                            name: Actions.ACTION_POSE.IDLE,
                        });
                    }
                    break;
            }
        }
    },
};

/** Behavior of "Work" enemies */
const System_workBehave = {
    name: "workBehave",
    resourceQuery: ["rngg", "time"],
    componentQueries: {
        works: ["speed", "facing", "animatedSprite", "workState", "tagWork"],
    },
    run: function workBehave(queryResults) {
        const time = queryResults.resources.time;
        if (time.isPaused()) {
            return;
        }
        const rngg = queryResults.resources.rngg;
        const workRng = rngg.getRng("workRng");
        for (const work of queryResults.components.works) {
            /* TODO : program the real behaviour
                This is for now only a simple trick to get things moving.
            */
            let actionName;
            if (work.workState.state === work.workState.WORK_STATES.ATTACKED) {
                work.speed.x = 0;
                work.speed.y = 0;
                work.facing.direction = work.facing.FACING.NONE;
                actionName = Actions.ACTION_POSE.ATTACKED;
            } else {
                actionName = Actions.ACTION_POSE.WALK;
                if (workRng.isChance(0.02)) {
                    /// pick a random direction
                    const randDirectionChoiceX = workRng.roll();
                    const randDirectionChoiceY = workRng.roll();
                    if (randDirectionChoiceX < 0.3) {
                        work.speed.x = -1;
                    } else if (randDirectionChoiceX < 0.6) {
                        work.speed.x = 1;
                    }
                    if (randDirectionChoiceY < 0.3) {
                        work.speed.y = -1;
                    } else if (randDirectionChoiceY < 0.6) {
                        work.speed.y = 1;
                    }
                } else {
                    /// somehow continue in the direction
                    if (work.speed.x > 0) {
                        work.speed.incrementRight();
                    } else {
                        work.speed.incrementLeft();
                    }
                    if (work.speed.y > 0) {
                        work.speed.incrementDown();
                    } else {
                        work.speed.incrementUp();
                    }
                }
                if (work.speed.x > 0) {
                    work.facing.direction = Actions.FACING.RIGHT;
                } else {
                    work.facing.direction = Actions.FACING.LEFT;
                }
            }
            if (actionName === undefined) {
                console.warn("action name undefined ?!");
            }
            work.animatedSprite.setPose({
                action: actionName,
                facing: work.facing.direction,
            });
        }
    },
};


/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_spawnMobs);
    engine.registerSystem(System_mobBehave);
    engine.registerSystem(System_spawnpointBehave);
    engine.registerSystem(System_workBehave);
}
/**
 * Physics-related functions
 * @module physics
 */

/** Resource of some constants */
const Resource_Physics = {
    name: "physics",
    prepareInit: function Physics_prepareInit(initOptions) {
        this.initOptions = initOptions || {};
    },
    init: function Physics_init() {
        /// speed decay multiplicator < 1
        this.speedDecay = this.initOptions.speedDecay || 1.0;
    },
};

/** Position of the object in pixels relative to the world */
export function newComponent_worldPosition(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "worldPosition",
        x: initOptions.x || 0,
        y: initOptions.y || 0,
    };
}

export function newComponent_Speed(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "speed",
        x: initOptions.x || 0,
        y: initOptions.y || 0,
        increment: initOptions.increment || 1,
        incrementLeft: function Speed_incrementLeft() {
            this.x -= this.increment;
        },
        incrementRight: function Speed_incrementRight() {
            this.x += this.increment;
        },
        incrementDown: function Speed_incrementDown() {
            this.y += this.increment;
        },
        incrementUp: function Speed_incrementUp() {
            this.y -= this.increment;
        },
    };
};


const System_moveMobiles = {
    name: "moveMobiles",
    resourceQuery: ["time", "physics"],
    componentQueries: {
        mobiles: ["worldPosition", "speed"],
    },
    run: function moveMobiles(queryResults) {
        let time = queryResults.resources.time;
        if (time.isPaused()) {
            return;
        }
        let physics = queryResults.resources.physics;
        for (let mobile of queryResults.components.mobiles) {
            mobile.worldPosition.x += mobile.speed.x * time.dt;
            mobile.speed.x *= physics.speedDecay;
            mobile.worldPosition.y += mobile.speed.y * time.dt;
            mobile.speed.y *= physics.speedDecay;
        }
    },
};

const CollisionRectangle = {
    init: function CollisionRectangle_init(width, height) {
        this.size = {
            x: width,
            y: height,
        };
    },
    collideRectangle: function CollisionRectangle_collideRectangle(thisPosition, otherCollider, otherPosition) {
        const thisLeft = thisPosition.x - this.size.x / 2.0;
        const thisRight = thisPosition.x + this.size.x / 2.0;
        const thisTop = thisPosition.y - this.size.y / 2.0;
        const thisBottom = thisPosition.y + this.size.y / 2.0;
        const otherLeft = otherPosition.x - otherCollider.size.x / 2.0;
        const otherRight = otherPosition.x + otherCollider.size.x / 2.0;
        const otherTop = otherPosition.y - otherCollider.size.y / 2.0;
        const otherBottom = otherPosition.y + otherCollider.size.y / 2.0;
        if (
            thisLeft <= otherRight &&
            thisRight >= otherLeft &&
            thisBottom >= otherTop &&
            thisTop <= otherBottom
        ) {
            /*
            TODO : calculate pushback direction
            const distanceX = thisPosition.x - otherPosition.x;
            const distanceY = thisPosition.y - otherPosition.y;
            */
            return {
                hasCollision: true,
            };
        } else {
            return {
                hasCollision: false,
            };
        }
    },
    collidePoint: function CollisionRectangle_collidePoint(thisPosition, pointPosition) {
        const thisLeft = thisPosition.x - this.size.x / 2.0;
        const thisRight = thisPosition.x + this.size.x / 2.0;
        const thisTop = thisPosition.y - this.size.y / 2.0;
        const thisBottom = thisPosition.y + this.size.y / 2.0;
        const distanceToLeft = pointPosition.x - thisLeft;
        const distanceToRight = pointPosition.x - thisRight;
        const distanceToBottom = pointPosition.y - thisBottom;
        const distanceToTop = pointPosition.y - thisTop;
        if (
            distanceToLeft >= 0 &&
            distanceToRight <= 0 &&
            distanceToBottom <= 0 &&
            distanceToTop >= 0
        ) {
            let pushbackX, pushbackY;
            if (distanceToLeft < -distanceToRight) {
                pushbackX = -distanceToLeft;
            } else {
                pushbackX = -distanceToRight;
            }
            if (distanceToTop < -distanceToBottom) {
                pushbackY = -distanceToTop;
            } else {
                pushbackY = -distanceToBottom;
            }
            return {
                hasCollision: true,
                pushback: {
                    pushbackX,
                    pushbackY,
                },
            };
        } else {
            return {
                hasCollision: false,
            };
        }
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_Physics);
    engine.registerSystem(System_moveMobiles);
}

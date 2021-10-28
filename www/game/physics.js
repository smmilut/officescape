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

/**
 * Single rectangle that can collide other shapes
 */
const Component_CollisionRectangle = {
    name: "collisionRectangle",
    /**
     * Always call when instantiating
     * @param {object} initOptions { size: {x, y}, positionRelativeToAnchor: {x, y} }
     *  with : `positionRelativeToAnchor` the position of the center of this rectangle, relative to the anchor of the collider
     */
    init: function CollisionRectangle_init(initOptions) {
        this.size = initOptions.size;
        this.positionRelativeToAnchor = initOptions.positionRelativeToAnchor;
        this.updatePosition({ x: 0, y: 0 });
    },
    /**
     * Update position : x, y, left, right, top, bottom
     * Call this before colliding
     * @param {object} newAnchorPosition {x, y} new position of the anchor
     */
    updatePosition: function CollisionRectangle_updatePosition(newAnchorPosition) {
        /** position of the center of this rectangle */
        this.position = {
            x: newAnchorPosition.x + this.positionRelativeToAnchor.x,
            y: newAnchorPosition.y + this.positionRelativeToAnchor.y,
        };
        this.left = this.position.x - this.size.x / 2.0;
        this.right = this.position.x + this.size.x / 2.0;
        this.top = this.position.y - this.size.y / 2.0;
        this.bottom = this.position.y + this.size.y / 2.0;
    },
    /**
     * * Calculate collision between another rectangle and this rectangle
     * @param {*} otherCollider other rectangle like { size: {x, y}, position: {left, right, top, bottom} }
     * @returns {object} { hasCollision, pushback: {x, y} } with :
     *  `hasCollision` a boolean true if there is collision
     *  `pushback` a vector of the minimum displacement to push the other rectangle out of this rectangle
     */
    collideRectangle: function CollisionRectangle_collideRectangle(otherCollider) {
        return this._collide(otherCollider.left, otherCollider.right, otherCollider.top, otherCollider.bottom);
    },
    /**
     * Calculate collision between a point and this rectangle
     * @param {object} pointPosition {x, y} position of the other point
     * @returns {object} { hasCollision, pushback: {x, y} } with :
     *  `hasCollision` a boolean true if there is collision
     *  `pushback` a vector of the minimum displacement to push the point out of this rectangle
     */
    collidePoint: function CollisionRectangle_collidePoint(pointPosition) {
        return this._collide(pointPosition.x, pointPosition.x, pointPosition.y, pointPosition.y);
    },
    /**
     * Calculate collision between another object and this rectangle
     * @param {integer} otherLeft 
     * @param {integer} otherRight 
     * @param {integer} otherBottom 
     * @param {integer} otherTop 
     * @returns {object} { hasCollision, pushback: {x, y} } with :
     *  `hasCollision` a boolean true if there is collision
     *  `pushback` a vector of the minimum displacement to push the other object out of this rectangle
     */
    _collide: function CollisionRectangle_collide(otherLeft, otherRight, otherBottom, otherTop) {
        const distanceToLeft = this.left - otherRight;
        const distanceToRight = this.right - otherLeft;
        const distanceToBottom = this.bottom - otherTop;
        const distanceToTop = this.top - otherBottom;
        if (
            distanceToLeft <= 0 &&
            distanceToRight >= 0 &&
            distanceToBottom >= 0 &&
            distanceToTop <= 0
        ) {
            /// there is collision
            let pushbackX, pushbackY;
            if (Math.abs(distanceToLeft) < Math.abs(distanceToRight)) {
                /// closer to the left
                /// push back towards the left
                pushbackX = distanceToLeft;
            } else {
                /// closer to the right
                /// push back towards the right
                pushbackX = distanceToRight;
            }
            if (Math.abs(distanceToTop) < Math.abs(distanceToBottom)) {
                /// closer to the top
                /// push back towards the top
                pushbackY = distanceToTop;
            } else {
                /// closer to the bottom
                /// push back towards the bottom
                pushbackY = distanceToBottom;
            }
            /// Now only push back on the direction that is the shortest
            if (Math.abs(pushbackX) < Math.abs(pushbackY)) {
                pushbackY = 0;
            } else {
                pushbackX = 0;
            }
            return {
                hasCollision: true,
                pushback: {
                    x: pushbackX,
                    y: pushbackY,
                },
            };
        } else {
            return {
                hasCollision: false,
                pushback: {
                    x: 0,
                    y: 0,
                },
            };
        }
    },
};

/**
 * Instantiate a new CollisionRectangle Component :
 *  a single rectangle that can collide other shapes
 * @param {object} initOptions { size: {x, y}, positionRelativeToAnchor: {x, y} }
 * @returns a new initialized CollisionRectangle Component
 */
export function newCollisionRectangle(initOptions) {
    const o = Object.create(Component_CollisionRectangle);
    o.init(initOptions);
    return o;
}

/**
 * Complex shape made of multiple CollisionRectangle
 */
const Component_CollisionRectangles = {
    name: "collisionRectangles",
    /**
     * Always call when instantiating
     * @param {object} initOptions [ { size: {x, y}, positionRelativeToAnchor: {x, y} }, ]
     *  with, for each : `positionRelativeToAnchor` the position of the center of this rectangle, relative to the anchor of the collider
     */
    init: function Collider_init(initOptions) {
        this.collisionShapes = [];
        for (const rectangleOptions of initOptions) {
            this.addRectangle(rectangleOptions);
        }
    },
    /**
     * Add one CollisionRectangle to the shape
     * @param {object} rectangleOptions { size: {x, y}, positionRelativeToAnchor: {x, y} }
     */
    addRectangle: function Collider_addRectangle(rectangleOptions) {
        this.collisionShapes.push(newCollisionRectangle(rectangleOptions));
    },
    /**
     * Update position of all Collision Rectangles : x, y, left, right, top, bottom
     * Call this before colliding
     * @param {object} newAnchorPosition {x, y} new position of the anchor
     */
    updatePosition: function Collider_updatePosition(newAnchorPosition) {
        for (const collisionRectangle of this.collisionShapes) {
            collisionRectangle.updatePosition(newAnchorPosition);
        }
    },
    /**
     * Calculate collision between another rectangle and this shape
     * @param {CollisionRectangle} otherRectangle a CollisionRectangle like { size: {x, y}, position: {left, right, top, bottom} }
     * @returns {object} { hasCollision, pushback: {x, y} } with :
     *  `hasCollision` a boolean true if there is collision
     *  `pushback` a vector of the minimum displacement to push the other rectangle out of this shape
     */
    collide: function Collider_collide(otherRectangle) {
        let hasCollision = false;
        let pushbackX = 0
        let pushbackY = 0;
        for (const collisionRectangle of this.collisionShapes) {
            const collision = collisionRectangle.collideRectangle(otherRectangle);
            if (collision.hasCollision) {
                hasCollision = true
                pushbackX += collision.pushback.x;
                pushbackY += collision.pushback.y;
            }
        }
        return {
            hasCollision: hasCollision,
            pushback: {
                x: pushbackX,
                y: pushbackY,
            },
        };
    },
};

/**
 * Instantiate a new CollisionRectangles Component :
 *  a complex shape made of multiple CollisionRectangle
 * @param {object} initOptions { size: {x, y}, positionRelativeToAnchor: {x, y} }
 * @returns a new initialized CollisionRectangles Component
 */
export function newCollisionRectangles(initOptions) {
    const o = Object.create(Component_CollisionRectangles);
    o.init(initOptions);
    return o;
}

const System_collideMobiles = {
    name: "collideMobiles",
    componentQueries: {
        mobiles: ["worldPosition", "speed", "collisionRectangle"],
        obstacles: ["worldPosition", "collisionRectangles"],
    },
    run: function collideMobiles(queryResults) {
        for (let mobile of queryResults.components.mobiles) {
            mobile.collisionRectangle.updatePosition(mobile.worldPosition);
            //console.log("mobile rectangle :", mobile.collisionRectangle);
            for (let obstacle of queryResults.components.obstacles) {
                //console.log("wall rectangles :", obstacle.collisionRectangles, obstacle.worldPosition);
                const collision = obstacle.collisionRectangles.collide(mobile.collisionRectangle);
                if (collision.hasCollision) {
                    console.log("COLLISION");
                    mobile.worldPosition.x += collision.pushback.x;
                    mobile.worldPosition.y += collision.pushback.y;
                }
            }
        }
    },
};


const System_debugCollisions = {
    name: "debugCollisions",
    resourceQuery: ["camera"],
    componentQueries: {
        mobiles: ["collisionRectangle"],
        obstacles: ["collisionRectangles"],
    },
    run: function renderSprites(queryResults) {
        let camera = queryResults.resources.camera;
        camera.context.strokeStyle = 'green';
        for (let mobile of queryResults.components.mobiles) {
            const rect = mobile.collisionRectangle;
            const cameraPosition = camera.gameToCameraPosition({
                x: rect.left,
                y: rect.top,
            });
            const x = cameraPosition.x;
            const y = cameraPosition.y;
            const width = rect.size.x;
            const height = rect.size.y;
            camera.context.strokeRect(x, y, width, height);
        }
        camera.context.strokeStyle = 'blue';
        for (let obstacle of queryResults.components.obstacles) {
            const rects = obstacle.collisionRectangles;
            for (let rect of rects.collisionShapes) {
                const cameraPosition = camera.gameToCameraPosition({
                    x: rect.left,
                    y: rect.top,
                });
                const x = cameraPosition.x;
                const y = cameraPosition.y;
                const width = rect.size.x;
                const height = rect.size.y;
                camera.context.strokeRect(x, y, width, height);
            }
        }
    }
};

/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_Physics);
    engine.registerSystem(System_moveMobiles);
    engine.registerSystem(System_collideMobiles);
    engine.registerSystem(System_debugCollisions);
}

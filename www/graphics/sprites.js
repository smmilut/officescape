import * as FileUtils from "../utils/fileUtils.js";
import * as HttpUtils from "../utils/httpUtils.js";
/**
 * Manage image sprites
 * @module sprites
 */

/** Drawable sprite Component */
export function newComponent_spriteImage(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "spriteImage",
        image: initOptions.image,
    };
}

/** Position of the drawing corner of the object in pixels relative to the screen */
export function newComponent_drawPosition(initOptions) {
    initOptions = initOptions || {};
    return {
        name: "drawPosition",
        drawCenter: initOptions.drawCenter,
        getFromWorldPosition: function DrawPosition_getFromWorldPosition(worldPosition) {
            return {
                x: worldPosition.x - this.drawCenter.x,
                y: worldPosition.y - this.drawCenter.y,
            }
        },
    };
}


/** Enum for animation playing direction */
export const ANIMATION_DIRECTION = Object.freeze({
    FORWARD: 1,  // currently animate frames in order
    BACKWARD: -1,  // currently animate frames in reverse order
    STOPPED: 0,
});

/** Enum for animation play type */
export const ANIMATION_TYPE = Object.freeze({
    NONE: "none",
    FORWARD: "forward",  // animation happens in continuous forward order
    REVERSE: "reverse",  // animation happens in continuous reverse order
    PINGPONG: "pingpong",  // animation happens in ping-pong mode, alternating forward and backward
});


/**
* a Sprite with animation from a sprite sheet
*/
const AnimatedSprite = {
    name: "animatedSprite",
    init: async function AnimatedSprite_init(initOptions) {
        this.sheetSrc = initOptions.sheetSrc;
        this.sheetConfigUrl = initOptions.sheetConfigUrl;
        const data = await HttpUtils.request({
            url: initOptions.sheetConfigUrl,
        });
        this.sheetConfig = JSON.parse(data.responseText);
        this.sheetCellWidth = this.sheetConfig.cellWidth;
        this.sheetCellHeight = this.sheetConfig.cellHeight;
        /**
        * A map of :
        *   {
        *       poseName: {
        *           frames: [
        *               frameImage,
        *           ],
        *           drawCenter,
        *           pose,
        *           animation,
        *       }
        *   }
        */
        this.sheetLayout = this.sheetConfig.layout;
        this.sheetImage = await FileUtils.ImageLoader.get(this.sheetSrc);
        await this._parseSpriteSheet(initOptions.pixelCanvas);
        this.setPose({ name: this.sheetConfig.defaultPose });
    },
    _parseSpriteSheet: async function AnimatedSprite_parseSpriteSheet(pixelCanvas) {
        // Run through all cells in the sprite sheet to define separate animation frames
        let framePromises = [];
        for (let sourceY = 0, poseIndex = 0; sourceY < this.sheetImage.height; sourceY += this.sheetCellHeight, poseIndex++) {
            // Y position in the sprite sheet is the animation pose
            const options = this.sheetLayout[poseIndex];
            const drawCenter = options.drawCenter;
            const animationOptions = options.animation;
            const poseOptions = options.pose;
            const poseName = poseOptions.action + poseOptions.facing; // should already be like this, but instead of checking, I force, because it's only a convenience for inputting the options
            poseOptions.name = poseName;
            this.sheetLayout[poseName] = {
                frames: [],
                drawCenter: drawCenter,
                pose: poseOptions,
                animation: animationOptions,
            };
            for (let sourceX = 0, frameIndex = 0; frameIndex < animationOptions.length; sourceX += this.sheetCellWidth, frameIndex++) {
                // X position in the sprite sheet is the animation frame for this pose
                const framePromise = this._configureFrame(frameIndex, poseName, pixelCanvas, sourceX, sourceY);
                framePromises.push(framePromise);
            }
        }
        await Promise.all(framePromises);
    },
    _configureFrame: function AnimatedSprite_configureFrame(frameIndex, poseName, pixelCanvas, sourceX, sourceY) {
        return new Promise(function promiseFrameImage(resolve, _reject) {
            const [canvas, context] = pixelCanvas.newUnscaled(this.sheetCellWidth, this.sheetCellHeight);
            // Draw to the hidden temporary canvas
            context.drawImage(this.sheetImage,
                sourceX,
                sourceY,
                this.sheetCellWidth,
                this.sheetCellHeight,
                0, 0,
                this.sheetCellWidth,
                this.sheetCellHeight
            );
            // Export to image
            const imageUri = canvas.toDataURL();
            const frameImage = new Image();
            frameImage.addEventListener("load", function onFrameImageReady() {
                /// Image has finished copying
                /// Configure the frame
                this.sheetLayout[poseName].frames[frameIndex] = frameImage;
                resolve(frameImage);
            }.bind(this));
            frameImage.src = imageUri;
        }.bind(this));
    },
    /**
     * Get current frame as an Image
     * @returns Image
     */
    getFrameImage: function AnimatedSprite_getFrameImage() {
        return this.frameImage;
    },
    /**
     * Get current frame as a "spriteImage" Component
     * @returns "spriteImage" Component
     */
    getComponent_spriteImage: function AnimatedSprite_getComponent_spriteImage() {
        return newComponent_spriteImage({
            image: this.getFrameImage(),
        });
    },
    /**
     * Get the position of the sprite center
     * @returns relative position of the sprite's center relative to the topleft corner of the image
     */
    getDrawCenter: function AnimatedSprite_getDrawCenter() {
        return this.poseInfo.drawCenter;
    },
    /**
     * Get the "drawPosition" Component for the current pose
     * @returns "drawPosition" Component
     */
    getComponent_drawPosition: function AnimatedSprite_getComponent_drawPosition() {
        return newComponent_drawPosition({
            drawCenter: this.getDrawCenter(),
        });
    },
    /**
    * set animation pose
    *
    *   poseInfo = {
    *       name,
    *   }
    * 
    * or
    * 
    *   poseInfo = {
    *       action,
    *       facing,
    *   }
    */
    setPose: function AnimatedSprite_setPose(poseInfo) {
        let poseName = poseInfo.name;
        if (poseInfo.action && poseInfo.facing) {
            poseName = poseInfo.action + poseInfo.facing;
        }
        if (poseName !== undefined && this.pose != poseName) {
            // the pose changed
            this.pose = poseName;
            // reset animation
            this.frameTime = 0;
            this.poseInfo = this.sheetLayout[this.pose];
            switch (this.poseInfo.animation.type) {
                case ANIMATION_TYPE.FORWARD:
                case ANIMATION_TYPE.PINGPONG:
                    this.frame = 0;
                    this.animationDirection = ANIMATION_DIRECTION.FORWARD;
                case ANIMATION_TYPE.REVERSE:
                    // last frame
                    this.frame = this.poseInfo.animation.length - 1;
                    this.animationDirection = ANIMATION_DIRECTION.BACKWARD;
                    break;
                case ANIMATION_TYPE.NONE:
                    this.frame = 0;
                    this.animationDirection = ANIMATION_DIRECTION.STOPPED;
                    break;
            }
            this.frameImage = this.poseInfo.frames[this.frame];
        }
    },
    /**
    * update animation frame time, change frame, change animation direction if necessary
    */
    updateAnimation: function AnimatedSprite_updateAnimation(timePassed) {
        if (this.animationDirection != ANIMATION_DIRECTION.STOPPED) {
            this.frameTime += timePassed;
            while (this.frameTime > this.poseInfo.animation.frameDuration) {
                this._nextFrame();
                this.frameTime -= this.poseInfo.animation.frameDuration;
            }
        }
    },
    /**
    * move animation to next frame, change animation direction if necessary
    */
    _nextFrame: function AnimatedSprite_nextFrame() {
        const animationLength = this.poseInfo.frames.length;
        this.frame += this.animationDirection;
        if (this.frame >= animationLength || this.frame < 0) {
            switch (this.poseInfo.animation.type) {
                case ANIMATION_TYPE.FORWARD:
                case ANIMATION_TYPE.BACKWARD:
                    this.frame = (this.frame + animationLength) % animationLength;
                    break;
                case ANIMATION_TYPE.PINGPONG:
                    this.animationDirection = -this.animationDirection;
                    this.frame += this.animationDirection;
                    break;
                default:
                    console.warn("unexpected case");
                    break;
            }
        }
        this.frameImage = this.poseInfo.frames[this.frame];
    },
};

export async function newComponent_AnimatedSprite(initOptions) {
    const animatedSprite = Object.create(AnimatedSprite);
    await animatedSprite.init(initOptions);
    return animatedSprite;
};

const System_updateSpriteAnimation = {
    name: "updateSpriteAnimation",
    resourceQuery: ["time"],
    componentQueries: {
        sprites: ["animatedSprite", "spriteImage"],
    },
    run: function updateSpriteAnimation(queryResults) {
        const time = queryResults.resources.time;
        for (let s of queryResults.components.sprites) {
            s.animatedSprite.updateAnimation(time.dt);
            const frameImage = s.animatedSprite.getFrameImage();
            s.spriteImage.image = frameImage;
        }
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_updateSpriteAnimation);
}
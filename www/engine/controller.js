import * as Engine from "./engine.js";
/**
    # Controller

    The global object `Controller` controls the program flow.
    It runs Systems.
    It is responsible of the main program loop.

    Start the program with `Controller.start()`

    ## Program flow

    1. Run each module's `init()`. This in turn will :
        1. run each sub-module's `init()` as necessary
        2. register the module's Systems
        3. register the module's Resources
    2. Load the global objects. For now this is only Resources.
    3. Load the first Scene. This will :
        1. Load the Scene's Resources
        2. Load the Scene's Systems
    4. Start the game. This will :
        1. Initialize Resource systems in order of their priority. Wait for completion of each priority.
        2. Run "init"-type Systems from SYSTEM_STAGE.FRAME_INIT and wait for completion
        3. --> Controller.start() : Start the main loop :
            1. Run Resource systems `Resource.update()`, wait for completion
            2. Run "normal" Systems in parallel, but wait for each stage to complete :
                1. SYSTEM_STAGE.FRAME_INIT
                2. SYSTEM_STAGE.FRAME_MAIN
                3. SYSTEM_STAGE.FRAME_END
    
    @module controller
*/

/**
* Program flow control
*/
export const Controller = (function build_Controller() {
    const obj_Controller = {};

    let Controller_animationRequestId, Controller_isStopping;

    /**
    * Start the main loop
    * @returns promise
    */
    obj_Controller.start = async function Controller_start() {
        Controller_isStopping = false;
        return new Promise(function requestFirstFrame(resolve, reject) {
            Controller_animationRequestId = window.requestAnimationFrame(animateFrame);
        });
    };

    obj_Controller.stop = async function Controller_stop() {
        Controller_isStopping = true;
        window.cancelAnimationFrame(Controller_animationRequestId);
    }

    /**
    * Main loop : run all Systems, call next frame
    */
    async function animateFrame(_timeNow) {
        await Engine.updateAllResources();
        for (const stage of [
            Engine.SYSTEM_STAGE.FRAME_INIT,
            Engine.SYSTEM_STAGE.FRAME_MAIN,
            Engine.SYSTEM_STAGE.FRAME_END,
        ]) {
            if (Controller_isStopping) {
                /// interrupt the frame
                return;
            }
            await Engine.runStage(stage);
        }
        if (Controller_isStopping) {
            /// interrupt the frame
            return;
        }
        return new Promise(function requestNewFrame(resolve, reject) {
            Controller_animationRequestId = window.requestAnimationFrame(animateFrame);
        });
    }

    return obj_Controller;
})();

/** Call when loading */
export async function init() {
    /// nothing yet
}

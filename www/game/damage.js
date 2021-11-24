/**
 * Manage damage
 * @module damage
 */

const System_collideCharacters = {
    name: "collideCharacters",
    componentQueries: {
        players: ["worldPosition", "collisionRectangle", "attack", "tagPlayer"],
        works: ["worldPosition", "collisionRectangle", "workState", "tagWork"],
    },
    run: function collideCharacters(queryResults) {
        for (const player of queryResults.components.players) {
            player.collisionRectangle.updatePosition(player.worldPosition);
            const playerIsAttacking = player.attack.isAttacking();
            for (const work of queryResults.components.works) {
                work.collisionRectangle.updatePosition(work.worldPosition);
                const collision = player.collisionRectangle.collideRectangle(work.collisionRectangle);
                if (collision.hasCollision &&
                    playerIsAttacking &&
                    work.workState.state !== work.workState.WORK_STATES.DEAD
                ) {
                    work.workState.state = work.workState.WORK_STATES.ATTACKED;
                } else {
                    work.workState.state = work.workState.WORK_STATES.STANDING;
                }
            }
        }
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerSystem(System_collideCharacters);
}

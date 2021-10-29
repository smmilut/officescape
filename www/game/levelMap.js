import * as Utils from "../utils.js";

/// TODO : create separate notion for map cell type (block, sky, etc) and things like items or spawn points that are also located on those map cells
/** Enum of map tile types */
export const TILE_TYPE = Object.freeze({
    NONE: "none",
    WALL: "wall",
    EDGEWALL: "edgeWall",
    EDGE: "edge",
    DESK: "desk",
});

/*
*   TODO : replace this code by the TILE_TYPE
    I Keep it for now, because It's easier to manually write maps in a text file with single numbers.
    But TODO replace this when we do procedural generation of maps (then we no longer care to have maps easy to edit as text)
*/
/** Conversion from tile code number to tile type */
export const MANUAL_TILE_CODE = new Map([
    [0, TILE_TYPE.NONE],
    [1, TILE_TYPE.WALL],
    [2, TILE_TYPE.EDGEWALL],
    [3, TILE_TYPE.DESK],
]);

/** Holds the level data (position of walls, etc) */
const Resource_levelMap = {
    name: "levelMap",
    TILE_TYPE: TILE_TYPE,
    prepareInit: function levelMap_prepareInit(initOptions) {
        this.initOptions = initOptions || {};
    },
    init: async function levelMap_init() {
        this.tileWidth = this.initOptions.tileWidth;
        this.tileHeight = this.initOptions.tileHeight;
        const data = await Utils.Http.Request({
            url: this.initOptions.url,
        });
        let json_obj = JSON.parse(data.responseText);
        this.gridHeight = json_obj.map.length;
        this.gridWidth = json_obj.map[0].length;
        this.height = this.gridHeight * this.tileHeight;
        this.width = this.gridWidth * this.tileWidth;
        /// TODO : replace when doing map procedural generation
        /// convert manually generated map (with number codes) to actual TILE_TYPE
        this.data = json_obj.map.map(function getTileCodesOfRow(row) {
            return row.map(function getTileCode(cellCode) {
                return MANUAL_TILE_CODE.get(cellCode);
            });
        });
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_levelMap);
}
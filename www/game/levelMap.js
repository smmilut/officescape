import * as Interpolation from "../utils/interpolation.js";

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
        this.initQueryResources = this.initOptions.initQueryResources;
    },
    init: async function levelMap_init(queryResults) {
        const rngg = queryResults.resources.rngg;
        this.perlin = rngg.newPerlin2D();
        this.tileWidth = this.initOptions.tileWidth;
        this.tileHeight = this.initOptions.tileHeight;
        this.gridHeight = 20;
        this.gridWidth = 30;
        this.height = this.gridHeight * this.tileHeight;
        this.width = this.gridWidth * this.tileWidth;
        this.generateMap();
    },
    generateMap: function levelMap_generateMap() {
        let data = [];
        for (let rowIndex = 0; rowIndex < this.gridHeight; rowIndex++) {
            let row = [];
            for (let columnIndex = 0; columnIndex < this.gridWidth; columnIndex++) {
                let intValue = 0;
                if (rowIndex == 0 ||
                    rowIndex == this.gridHeight - 1 ||
                    columnIndex == 0 ||
                    columnIndex == this.gridWidth - 1
                ) {
                    intValue = 2;
                } else {
                    const noiseValue = this.perlin.getValueScaledAt({
                        x: columnIndex,
                        y: rowIndex,
                    },
                        {
                            x: 5.0,
                            y: 5.0,
                        });
                    const scaledValue = Interpolation.lerp(0, 10, noiseValue, -1, 1);
                    if (scaledValue < 4) {
                        intValue = 3;
                    } else if (scaledValue < 5) {
                        intValue = 1;
                    }
                }
                row.push(intValue);
            }
            data.push(row);
        }
        console.log(data);
        this.data = data.map(function getTileCodesOfRow(row) {
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
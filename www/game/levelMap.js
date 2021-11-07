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
        this.gridHeight = this.initOptions.gridHeight;
        this.gridWidth = this.initOptions.gridWidth;
        this.height = this.gridHeight * this.tileHeight;
        this.width = this.gridWidth * this.tileWidth;
        this.mapGenerationOptions = this.initOptions.mapGeneration;
        this.generateMap();
    },
    generateMap: function levelMap_generateMap() {
        const scaleX = this.mapGenerationOptions.scaleX;
        const scaleY = this.mapGenerationOptions.scaleY;
        const amplitude = this.mapGenerationOptions.amplitude;
        const thresholds = this.mapGenerationOptions.thresholds;
        /// sort thresholds by increasing "noiseValue"
        thresholds.sort(function compareThresholds(t1, t2) {
            return t1.noiseValue - t2.noiseValue;
        })
        let data = [];
        for (let rowIndex = 0; rowIndex < this.gridHeight; rowIndex++) {
            let row = [];
            for (let columnIndex = 0; columnIndex < this.gridWidth; columnIndex++) {
                let cellType = TILE_TYPE.NONE;
                if (rowIndex == 0 ||
                    rowIndex == this.gridHeight - 1 ||
                    columnIndex == 0 ||
                    columnIndex == this.gridWidth - 1
                ) {
                    /// external edge
                    cellType = TILE_TYPE.EDGEWALL;
                } else {
                    /// calculate noise
                    const noiseValue = this.perlin.getValueScaledAt({
                        x: columnIndex,
                        y: rowIndex,
                    },
                        {
                            x: scaleX,
                            y: scaleY,
                        });
                    /// scale noise amplitude (for easier configuration of thresholds)
                    const scaledValue = Interpolation.lerp(0, amplitude, noiseValue, -1, 1);
                    for (const threshold of thresholds) {
                        if (scaledValue < threshold.noiseValue) {
                            cellType = threshold.cellType;
                            break;
                        }
                    }
                }
                row.push(cellType);
            }
            data.push(row);
        }
        this.data = data;
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_levelMap);
}
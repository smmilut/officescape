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
        this.mapGenerationOptions = this.initOptions.mapGeneration;
        /// sort thresholds by increasing "noiseValue"
        this.mapGenerationOptions.thresholds.sort(function compareThresholds(t1, t2) {
            return t1.noiseValue - t2.noiseValue;
        })
        this.perlin = rngg.getPerlin2D("mapPerlin",
            {
                spatialScale: {
                    x: this.mapGenerationOptions.scaleX,
                    y: this.mapGenerationOptions.scaleY,
                },
            });
        this.tileWidth = this.initOptions.tileWidth;
        this.tileHeight = this.initOptions.tileHeight;
        this.gridHeight = this.initOptions.gridHeight;
        this.gridWidth = this.initOptions.gridWidth;
        this.height = this.gridHeight * this.tileHeight;
        this.width = this.gridWidth * this.tileWidth;
        this.cacheMap();
    },
    cacheMap: function levelMap_cacheMap() {
        let data = [];
        for (let rowIndex = 0; rowIndex < this.gridHeight; rowIndex++) {
            let row = [];
            for (let columnIndex = 0; columnIndex < this.gridWidth; columnIndex++) {
                const cellValue = this.getMapValueAtCell(columnIndex, rowIndex);
                row.push(cellValue);
            }
            data.push(row);
        }
        this.data = data;
    },
    getMapValueAtPosition: function levelMap_getMapValueAtPosition(position) {
        const columnIndex = Math.floor(position.x / this.tileWidth);
        const rowIndex = Math.floor(position.y / this.tileHeight);
        if (this.data) {
            /// it's cached
            return this.data[rowIndex][columnIndex];
        } else {
            return this.getMapValueAtCell(columnIndex, rowIndex);
        }
    },
    getMapValueAtCell: function levelMap_getMapValueAtCell(columnIndex, rowIndex) {
        const configurationAmplitude = this.mapGenerationOptions.amplitude;
        const perlinAmplitude = this.perlin.theoriticalAmplitude;
        const thresholds = this.mapGenerationOptions.thresholds;
        let cellType = TILE_TYPE.NONE;
        if (rowIndex === 0 ||
            rowIndex === this.gridHeight - 1 ||
            columnIndex === 0 ||
            columnIndex === this.gridWidth - 1
        ) {
            /// external edge
            cellType = TILE_TYPE.EDGEWALL;
        } else {
            /// calculate noise
            const noiseValue = this.perlin.getValueAt({
                x: columnIndex,
                y: rowIndex,
            });
            /// scale noise amplitude (for easier configuration of thresholds)
            const scaledValue = Interpolation.lerp(
                0, configurationAmplitude,
                noiseValue,
                -perlinAmplitude, perlinAmplitude
            );
            for (const threshold of thresholds) {
                if (scaledValue < threshold.noiseValue) {
                    cellType = threshold.cellType;
                    break;
                }
            }
        }
        return {
            cellType: cellType,
        };
    },
};

/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_levelMap);
}
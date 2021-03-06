import * as FileUtils from "../utils/fileUtils.js";
import * as HttpUtils from "../utils/httpUtils.js";
import * as Sprites from "./sprites.js";
import * as Physics from "../game/physics.js";

/** Holds the spritesheet for the terrain tileset */
const Resource_terrainSheet = {
    name: "terrainSheet",
    prepareInit: function terrainSheet_prepareInit(initOptions) {
        this.initOptions = initOptions || {};
    },
    init: async function terrainSheet_init() {
        const data = await HttpUtils.request({
            url: this.initOptions.sheetConfigUrl,
        });
        this.sheetConfig = JSON.parse(data.responseText);
        this.sheetImage = await FileUtils.ImageLoader.get(this.initOptions.sheetSrc);
    },
};

/** Spawn "tile" Entities for each map tile, configured with the correct image, etc */
const System_spawnTiles = {
    name: "spawnTiles",
    resourceQuery: ["levelMap", "terrainSheet", "pixelCanvas"],
    promiseRun: async function spawnTiles(queryResults) {
        let spawnPromises = [];
        const engine = queryResults.engine;
        const pixelCanvas = queryResults.resources.pixelCanvas;
        const levelMap = queryResults.resources.levelMap;
        const TILE_TYPE = levelMap.TILE_TYPE;
        const levelData = levelMap.data;
        const tileWidth = levelMap.tileWidth;
        const tileHeight = levelMap.tileHeight;
        const terrainSheet = queryResults.resources.terrainSheet;
        const terrainSheetImage = terrainSheet.sheetImage;
        const terrainSheetConfig = terrainSheet.sheetConfig;
        const sheetLayout = terrainSheetConfig.layout;
        /// iterate the level map data
        for (let rowIndex = 0, tileCenterY = Math.floor(tileHeight / 2); rowIndex < levelData.length; rowIndex++, tileCenterY += tileHeight) {
            const row = levelData[rowIndex];
            const upRow = levelData[rowIndex - 1];
            const downRow = levelData[rowIndex + 1];
            for (let columnIndex = 0, tileCenterX = Math.floor(tileWidth / 2); columnIndex < row.length; columnIndex++, tileCenterX += tileWidth) {
                const neighbors = getNeighbors(TILE_TYPE, row, upRow, downRow, columnIndex);
                if (neighbors.centerCell.cellType === TILE_TYPE.NONE) {
                    /// nothing to draw on empty tiles
                    continue;
                }
                /// The info of the sheet cell that correponds the best to the current map cell
                const bestSheetCells = getBestSheetCell(sheetLayout, neighbors);

                if (bestSheetCells === undefined) {
                    /// We didn't find any tile in the sheet that matches the requirements of the map
                    console.warn("No best sheet cell for this tile", columnIndex, rowIndex);
                } else {
                    /// This neighbor code has been defined in the sheet layout,
                    /// we can draw it.
                    /// For now we take the first alternative (index 0).
                    /// TODO : In the future, randomly choose between alternatives ?
                    const cellInfo = bestSheetCells[0];
                    const spawnPromise = spawnTile(
                        engine,
                        pixelCanvas,
                        terrainSheetImage,
                        cellInfo,
                        { x: tileCenterX, y: tileCenterY }
                    );
                    spawnPromises.push(spawnPromise);
                }
            }
        }
        await Promise.all(spawnPromises);
    },
};

/** Get the tile types of neighbors in all directions surrounding a map cell */
function getNeighbors(TILE_TYPE, row, upRow, downRow, columnIndex) {
    const neighbors = {};
    if (upRow === undefined) {
        /// top edge of the map
        neighbors.topLeft = { cellType: TILE_TYPE.EDGE, };
        neighbors.topCenter = { cellType: TILE_TYPE.EDGE, };
        neighbors.topRight = { cellType: TILE_TYPE.EDGE, };
    } else {
        neighbors.topLeft = upRow[columnIndex - 1] || { cellType: TILE_TYPE.EDGE, };
        neighbors.topCenter = upRow[columnIndex];
        neighbors.topRight = upRow[columnIndex + 1] || { cellType: TILE_TYPE.EDGE, };
    }
    if (downRow === undefined) {
        /// bottom edge of the map
        neighbors.botLeft = { cellType: TILE_TYPE.EDGE, };
        neighbors.botCenter = { cellType: TILE_TYPE.EDGE, };
        neighbors.botRight = { cellType: TILE_TYPE.EDGE, };
    } else {
        neighbors.botLeft = downRow[columnIndex - 1] || { cellType: TILE_TYPE.EDGE, };
        neighbors.botCenter = downRow[columnIndex];
        neighbors.botRight = downRow[columnIndex + 1] || { cellType: TILE_TYPE.EDGE, };
    }
    /// current row
    neighbors.midLeft = row[columnIndex - 1];
    if (neighbors.midLeft === undefined) {
        /// left edge of the map
        neighbors.midLeft = { cellType: TILE_TYPE.EDGE, };
    }
    neighbors.midRight = row[columnIndex + 1];
    if (neighbors.midRight === undefined) {
        /// right edge of the map
        neighbors.midRight = { cellType: TILE_TYPE.EDGE, };
    }
    /// current cell
    neighbors.centerCell = row[columnIndex];
    return neighbors;
}

/** Find the cell from the sheet that corresponds best to this particular neighbor situation */
function getBestSheetCell(sheetLayout, neighbors) {
    /** The info of the sheet cell that corresponds the best to the current map cell
     *   This is an array of alternatives
     */
    let bestSheetCells;
    /** The score of the best sheet cell */
    let bestSheetCellScore = -10;
    for (const sheetCellInfo of sheetLayout) {
        if (sheetCellInfo.type != neighbors.centerCell.cellType) {
            /// the sheet cell is the wrong type of block
            /// skip it, we'll find better
            continue;
        }
        const score = getScoreOfSheetcell(sheetCellInfo, neighbors);
        /// Finished calculating this score, time to compare to the previous scores
        if (score > bestSheetCellScore) {
            /// This is the best sheet cell config for now
            bestSheetCells = [sheetCellInfo,];
            bestSheetCellScore = score;
        } else if (score === bestSheetCellScore) {
            /// This has the same score as the best
            /// Add it to the alternatives
            bestSheetCells.push(sheetCellInfo);
        }
    }
    return bestSheetCells;
}
/** Evaluate if the sheet cell matches the map element we are processing */
function getScoreOfSheetcell(sheetCellInfo, neighbors) {
    let score = 0;
    for (const neighborName in neighbors) {
        const neighborCellType = neighbors[neighborName].cellType;
        const sheetCellNeighborValues = sheetCellInfo[neighborName];
        if (sheetCellNeighborValues === undefined) {
            /// The sheet configuration doesn't specify anything for this neighbor direction.
            /// So this is a tolerant configuration that accepts anything.
            /// We don't change the score.
            //score += 0;
            continue;
        }
        /// The sheet configuration expects something specific in this direction
        if (sheetCellNeighborValues.includes(neighborCellType)) {
            /// We have a match, we increase the score by 1 only
            score += 1;
            const numberOfAlternatives = sheetCellNeighborValues.length;
            const priority = sheetCellNeighborValues.indexOf(neighborCellType);
            if (numberOfAlternatives > 1 && priority > 0) {
                /// This is not the type of neighbor preferred by this sheet configuration.
                /// We will decrease the score by that much, but still less than 2.
                score -= priority * 2.0 / numberOfAlternatives;
            }
        } else {
            /// The sheet configuration specifies a different type of block for this neighbor direction.
            /// So this doesn't match.
            /// We decrease the score by 2 (more than increase).
            score -= 2;
        }
    }
    return score;
}

/** spawn the tile Entity */
function spawnTile(
    engine,
    pixelCanvas,
    terrainSheetImage,
    cellInfo,
    tileCenter
) {
    return new Promise(function promiseSpawnedTile(resolve, _reject) {
        const drawPosition = Sprites.newComponent_drawPosition({
            drawCenter: cellInfo.drawCenter,
        });
        const worldPosition = Physics.newComponent_worldPosition({
            x: tileCenter.x - cellInfo.tileCenter.x + cellInfo.drawCenter.x,
            y: tileCenter.y - cellInfo.tileCenter.y + cellInfo.drawCenter.y,
        });
        const collisionRectanglesOptions = cellInfo.collisionRectangles.map(
            /** Convert from configured `topLeftRelativePosition` (easy to input manually) to useful `positionRelativeToAnchor` */
            function convertAnchorPosition(rectOptions) {
                rectOptions.positionRelativeToAnchor = {};
                rectOptions.positionRelativeToAnchor.x = rectOptions.topLeftRelativePosition.x + rectOptions.size.x / 2.0 - cellInfo.drawCenter.x;
                rectOptions.positionRelativeToAnchor.y = rectOptions.topLeftRelativePosition.y + rectOptions.size.y / 2.0 - cellInfo.drawCenter.y;
                return rectOptions;
            });
        const collisionRectangles = Physics.newCollisionRectangles(collisionRectanglesOptions);
        collisionRectangles.updatePosition(worldPosition);

        const sourceColumn = cellInfo.cellPosition[0];
        const sourceRow = cellInfo.cellPosition[1];
        const cellWidth = cellInfo.cellWidth;
        const cellHeight = cellInfo.cellHeight;
        const sourceX = sourceColumn * cellWidth;
        const sourceY = sourceRow * cellHeight;
        const [canvas, context] = pixelCanvas.newUnscaled(cellWidth, cellHeight);
        // Draw to the hidden temporary canvas
        context.drawImage(terrainSheetImage,
            sourceX, sourceY,
            cellWidth, cellHeight,
            0, 0,
            cellWidth, cellHeight);
        // Export to image
        const imageUri = canvas.toDataURL();
        const tileImage = new Image();
        tileImage.addEventListener("load", function onTileImageReady() {
            /// Image has finished copying
            /// spawn the tile
            const spriteImage = Sprites.newComponent_spriteImage({
                image: tileImage,
            });
            const tileEntity = engine.spawn()
                .addComponent(drawPosition)
                .addComponent(worldPosition)
                .addComponent(collisionRectangles)
                .addComponent(spriteImage);
            resolve(tileEntity);
        });
        tileImage.src = imageUri;
    });
}


/** Call when loading */
export function init(engine) {
    engine.registerResource(Resource_terrainSheet);
    engine.registerSystem(System_spawnTiles);
}
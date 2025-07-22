import { grid, labelPlacements, ROWS, COLS } from './world.js';
import { clearPreviousSpawn, setSpawnPosition } from './world.js';
import { drawMap } from './renderer.js';

let painting = false;
let currentTool = null;
let hoverCell = null;
let selectionStart = null;
let selectionEnd = null;

let canvasEl, ctx, cellSize, borderSize, hoverColor, selectionColor, mainColor, textSize;

export function initInput(canvas, context, cellSizeArg, borderSizeArg, hoverColorArg, selectionColorArg, mainColorArg, textSizeArg) {
    canvasEl = canvas;
    ctx = context;
    cellSize = cellSizeArg;
    borderSize = borderSizeArg;
    hoverColor = hoverColorArg;
    selectionColor = selectionColorArg;
    mainColor = mainColorArg;
    textSize = textSizeArg;

    canvasEl.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvasEl.addEventListener('click', onClick);
}

function onMouseMove(e) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const x = Math.floor(canvasX / cellSize);
    const y = Math.floor(canvasY / cellSize);

    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        hoverCell = [x, y];
    } else {
        hoverCell = null;
    }

    if (painting) {
        if (currentTool) {
            if (hoverCell) handleAction(hoverCell[0], hoverCell[1]);
        } else if (selectionStart) {
            if (hoverCell) selectionEnd = hoverCell.slice();
        }
    }
    drawAll();
}

function onMouseDown() {
    painting = true;
    if (!currentTool && hoverCell) {
        selectionStart = hoverCell.slice();
        selectionEnd = hoverCell.slice();
    }
}

function onMouseUp() {
    painting = false;
}

function onClick() {
    if (hoverCell) handleAction(hoverCell[0], hoverCell[1]);
    drawAll();
}

export function handleAction(x, y) {
    const cell = grid[y][x];
    if ((currentTool === null || currentTool === 'door') && cell.type === 'door') {
        // Rotate door (will be saved )9
        cell.orientation = (cell.orientation + 1) % 4;

    } else if (currentTool === 'wall') {
        cell.type = 'wall';
    } else if (currentTool === 'eraser') {
        cell.type = 'floor';
        const i = labelPlacements.findIndex(p => p.x === x && p.y === y);
        if (i !== -1) labelPlacements.splice(i, 1);
    } else if (currentTool === 'door' && cell.type !== 'wall') {
        cell.type = 'door';
        cell.orientation = 0;
    } else if (currentTool === 'plate') {
        if (cell.type === 'floor') {
            cell.type = 'plate';
        } else if (cell.type === 'plate') {
            if (!dangerousPlates.find(p => p.x === x && p.y === y)) {
                dangerousPlates.push({ x, y });
            }
        }
    } else if (currentTool === 'placeS' || currentTool === 'placeM') {
        if (cell.type === 'floor') {
            const i = labelPlacements.findIndex(p => p.x === x && p.y === y);
            if (i !== -1) labelPlacements.splice(i, 1);
            labelPlacements.push({ x, y, label: currentTool === 'placeS' ? 'S' : 'M' });
        }
    } else if (currentTool === 'placeSpawn') {
        if (cell.type === 'floor') {
            clearPreviousSpawn();
            setSpawnPosition(x, y);
        }
    }
    drawAll();
}

export function applyToolToSelection(tool) {
    if (!selectionStart || !selectionEnd) return;
    const x0 = Math.min(selectionStart[0], selectionEnd[0]);
    const y0 = Math.min(selectionStart[1], selectionEnd[1]);
    const x1 = Math.max(selectionStart[0], selectionEnd[0]);
    const y1 = Math.max(selectionStart[1], selectionEnd[1]);
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const cell = grid[y][x];
            if (tool === 'eraser') {
                cell.type = 'floor';
                const i = labelPlacements.findIndex(p => p.x === x && p.y === y);
                if (i !== -1) labelPlacements.splice(i, 1);
            } else if (tool === 'wall') {
                cell.type = 'wall';
            } else if (tool === 'door') {
                if (cell.type !== 'wall') {
                    cell.type = 'door';
                }
            } else if (tool === 'plate') {
                if (cell.type === 'floor') {
                    cell.type = 'plate';
                }
            } else if (tool === 'placeS' || tool === 'placeM') {
                if (cell.type === 'floor') {
                    const i = labelPlacements.findIndex(p => p.x === x && p.y === y);
                    if (i !== -1) labelPlacements.splice(i, 1);
                    labelPlacements.push({ x, y, label: tool === 'placeS' ? 'S' : 'M' });
                }
            } else if (tool === 'placeSpawn') {
                if (cell.type === 'floor') {
                    clearPreviousSpawn();
                    setSpawnPosition(x, y);
                }
            }
        }
    }
    selectionStart = selectionEnd = null;
    drawAll();
}

export function setCurrentTool(tool) {
    currentTool = tool;
}

export function getCurrentTool() {
    return currentTool;
}

export function hasSelection() {
    return selectionStart !== null && selectionEnd !== null;
}

export function resetSelection() {
    selectionStart = null;
    selectionEnd = null;
}

export function resetHover() {
    hoverCell = null;
}

export function drawAll() {
  drawMap(canvasEl, ctx, cellSize, borderSize, mainColor, textSize);

  if (hoverCell) {
    ctx.save();
    ctx.fillStyle = hoverColor;
    ctx.fillRect(
      hoverCell[0] * cellSize,
      hoverCell[1] * cellSize,
      cellSize,
      cellSize
    );
    ctx.restore();
  }

  // 3) Auswahl‑Rechteck
  if (selectionStart && selectionEnd) {
    const x0 = Math.min(selectionStart[0], selectionEnd[0]);
    const y0 = Math.min(selectionStart[1], selectionEnd[1]);
    const x1 = Math.max(selectionStart[0], selectionEnd[0]);
    const y1 = Math.max(selectionStart[1], selectionEnd[1]);
    ctx.save();
    // Draw border first
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x0 * cellSize,
      y0 * cellSize,
      (x1 - x0 + 1) * cellSize,
      (y1 - y0 + 1) * cellSize
    );
    // Then fill with selection color
    ctx.fillStyle = selectionColor;
    ctx.fillRect(
      x0 * cellSize,
      y0 * cellSize,
      (x1 - x0 + 1) * cellSize,
      (y1 - y0 + 1) * cellSize
    );
    ctx.restore();
  }
}

import { initInput, drawAll } from './input.js';
import { setupUI } from './ui.js';
import { initGrid, placeRooms, connectRooms, ROWS, COLS } from './world.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');

    const cellSize   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cellsize'));
    const borderSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mazeborder'));
    const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--hovercolor');
    const mainColor  = getComputedStyle(document.documentElement).getPropertyValue('--maincolor');
    const textSize   = Math.floor(cellSize * 0.75);
    const selectionColor = 'rgba(25, 86, 254, 0.2)';

    ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = 'pixelated';
    canvas.width  = COLS * cellSize;
    canvas.height = ROWS * cellSize;

    initInput(canvas, ctx, cellSize, borderSize, hoverColor, selectionColor, mainColor, textSize);
    setupUI();

    initGrid();
    placeRooms();
    connectRooms();
    drawAll();
});

import { grid, labelPlacements, spawnPosition, ROWS, COLS } from './world.js';

const wallImage = new Image();
const plateImage = new Image();
const spawnImage = new Image();

wallImage.src = 'assets/Wall.png';
plateImage.src = 'assets/Plate.png';
spawnImage.src = 'assets/Spawn.png';

let useTextures = false;

export function setUseTextures(value) {
    useTextures = value;
}

export function drawMap(canvas, ctx, cellSize, borderSize, textSize) {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = grid[y][x];
            const px = x * cellSize, py = y * cellSize;
            //evry block
            if (cell.type === 'floor' || cell.type === 'door' || cell.type === 'plate') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(px, py, cellSize, cellSize);
            }
            if (cell.type === 'plate') {
                if (useTextures) {
                    const scale = Math.floor(cellSize / 12);
                    const offset = (cellSize - (15 * scale)) / 2;
                    ctx.drawImage(plateImage, 
                        px + 1, py + 1,
                        cellSize - 2, cellSize - 2
                    );
                } else {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
                }
            }
            if (cell.type === 'door') {
                const t = Math.floor(cellSize * 0.3);
                ctx.fillStyle = '#000';
                if (cell.orientation % 2 === 0) {
                    // vertical door
                    ctx.fillRect(px + (cellSize - t) / 2, py, t, cellSize);
                } else {
                    // horizontal door
                    ctx.fillRect(px, py + (cellSize - t) / 2, cellSize, t);
                }
            }
        }
    }

    if (spawnPosition) {
        const { x, y } = spawnPosition;
        const px = x * cellSize, py = y * cellSize;
        if (useTextures) {
            const scale = Math.floor(cellSize / 12);
            const offset = (cellSize - (16 * scale)) / 2;
            ctx.drawImage(spawnImage, 
                px + offset, py + offset,
                16 * scale, 16 * scale
            );
        } else {
            ctx.beginPath();
            ctx.fillStyle = '#089';
            ctx.fillRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
            ctx.fill();
        }
    }

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x].type === 'wall') {
                const px = x * cellSize, py = y * cellSize;
                if (useTextures && wallImage.complete) {
                    const scale = Math.floor(cellSize / 12);
                    const offset = (cellSize - (16 * scale)) / 2;
                    ctx.drawImage(wallImage, 
                        px + offset, py + offset,
                        16 * scale, 16 * scale
                    );
                } else {
                    ctx.fillStyle = 'rgb(246, 243, 238)';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }
            }
        }
    }

    ctx.fillStyle = '#000';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = grid[y][x];
            if (cell.type === 'floor' || cell.type === 'door' || cell.type === 'plate') {
                const px = x * cellSize, py = y * cellSize;
                if (y > 0 && grid[y-1][x].type === 'wall') {
                    ctx.fillRect(px, py, cellSize, borderSize);
                }
                if (y < ROWS-1 && grid[y+1][x].type === 'wall') {
                    ctx.fillRect(px, py + cellSize - borderSize, cellSize, borderSize);
                }
                if (x > 0 && grid[y][x-1].type === 'wall') {
                    ctx.fillRect(px, py, borderSize, cellSize);
                }
                if (x < COLS-1 && grid[y][x+1].type === 'wall') {
                    ctx.fillRect(px + cellSize - borderSize, py, borderSize, cellSize);
                }
            }
        }
    }

    ctx.font = `${textSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    labelPlacements.forEach(p => {
        ctx.fillText(p.label, p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2);
    });
}

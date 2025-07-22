export const ROWS = 50;
export const COLS = 50;
export let grid = [];
export let rooms = [];
export let labelPlacements = [];
export let spawnPosition = null;
export let currentTheme = 'concrete';

export class Cell {
    constructor() {
        this.type = 'wall';
        this.orientation = 0;
    }
}

export function initGrid() {
    grid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => new Cell())
    );
    rooms = [];
    labelPlacements = [];
    spawnPosition = null;
}

export function setTheme(theme) {
    currentTheme = theme;
}

export function placeRooms() {
    const occ = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let attempts = 0;
    const maxAttempts = 100;
    
    while (rooms.length < 6 && attempts < maxAttempts) {
        attempts++;
        const w = Math.floor(Math.random() * 8) + 8;
        const h = Math.floor(Math.random() * 7) + 6;
        const x = Math.floor(Math.random() * (COLS - w - 2)) + 1;
        const y = Math.floor(Math.random() * (ROWS - h - 2)) + 1;
        
        let overlap = false;
        for (let yy = y - 2; yy <= y + h + 1; yy++) {
            for (let xx = x - 2; xx <= x + w + 1; xx++) {
                if (yy >= 0 && yy < ROWS && xx >= 0 && xx < COLS && grid[yy][xx].type !== 'wall') {
                    overlap = true;
                    break;
                }
            }
            if (overlap) break;
        }
        
        if (!overlap) {
            for (let yy = y; yy < y + h; yy++) {
                for (let xx = x; xx < x + w; xx++) {
                    grid[yy][xx].type = 'floor';
                }
            }
            rooms.push({ x, y, w, h });
            
            if (rooms.length === 1) {
                const spawnX = x + Math.floor(w/2);
                const spawnY = y + Math.floor(h/2);
                clearPreviousSpawn();
                setSpawnPosition(spawnX, spawnY);
            }
        }
    }
}

export function carveCorridor(a, b) {
    let x = a.x, y = a.y;
    if (Math.random() < 0.5) {
        while (x !== b.x) {
            grid[y][x].type = 'floor';
            x += x < b.x ? 1 : -1;
        }
        while (y !== b.y) {
            grid[y][x].type = 'floor';
            y += y < b.y ? 1 : -1;
        }
    } else {
        while (y !== b.y) {
            grid[y][x].type = 'floor';
            y += y < b.y ? 1 : -1;
        }
        while (x !== b.x) {
            grid[y][x].type = 'floor';
            x += x < b.x ? 1 : -1;
        }
    }
    grid[b.y][b.x].type = 'floor';
}

export function connectRooms() {
    const centers = rooms.map(r => ({
        x: r.x + Math.floor(r.w / 2),
        y: r.y + Math.floor(r.h / 2)
    }));
    centers.slice(1).forEach((c, i) => carveCorridor(centers[i], c));
    
    // Add 1-3 dead-end corridors
    const deadEnds = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < deadEnds; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const startX = room.x + Math.floor(room.w/2);
        const startY = room.y + Math.floor(room.h/2);
        const length = Math.floor(Math.random() * 8) + 5;
        const direction = Math.floor(Math.random() * 4);
        
        let dx = 0, dy = 0;
        switch(direction) {
            case 0: dx = 1; break;  // right
            case 1: dx = -1; break; // left
            case 2: dy = 1; break;  // down
            case 3: dy = -1; break; //up
        }
        
        let x = startX, y = startY;
        for (let j = 0; j < length; j++) {
            x += dx;
            y += dy;
            if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
                grid[y][x].type = 'floor';
            }
        }
    }
}

export function clearPreviousSpawn() {
    if (spawnPosition) {
        grid[spawnPosition.y][spawnPosition.x].type = 'floor';
        spawnPosition = null;
    }
}

export function setSpawnPosition(x, y) {
    spawnPosition = { x, y };
}

export function loadWorld(worldData) {
    grid = worldData.grid.map(row =>
        row.map(c => Object.assign(new Cell(), c))
    );
    rooms = worldData.rooms;
    labelPlacements = worldData.labelPlacements;
    spawnPosition = worldData.spawnPosition;
}

window.addEventListener('DOMContentLoaded', () => {
    const optBtn  = document.getElementById('optBtn');
    const options = document.getElementById('options');
    const modal = document.getElementById('initialModal');
    const close = document.getElementById('modalClose');
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cellsize'));
    const borderSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mazeborder'));
    const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--hovercolor');
    const selectionColor = 'rgba(25, 86, 254, 0.2)';
    const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--maincolor');
    const textSize = Math.floor(cellSize * 0.75);



    modal.style.display = 'flex';
    close.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    optBtn.addEventListener('click', () => {
        options.classList.toggle('open');
        optBtn.classList.toggle('open');
    });

    const rows = 40, cols = 40;
    let grid = [], rooms = [], labelPlacements = [];
    let spawnPosition = null;

    ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = 'pixelated';
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    class Cell { constructor() { this.type = 'wall'; this.orientation = 0; } }

    let painting = false;
    let currentTool = null;
    let hoverCell = null;
    let selectionStart = null;
    let selectionEnd = null;
    let lastGenTime = 0;

    function initGrid() {
        grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => new Cell()));
        rooms = [];
        labelPlacements = [];
        selectionStart = selectionEnd = null;
        spawnPosition = null;
    }
    function placeRooms() {
        const occ = Array.from({ length: rows }, () => Array(cols).fill(false));
        while (rooms.length < 6) {
            const w = Math.floor(Math.random() * 8) + 8;
            const h = Math.floor(Math.random() * 7) + 6;
            const x = Math.floor(Math.random() * (cols - w - 2)) + 1;
            const y = Math.floor(Math.random() * (rows - h - 2)) + 1;
            let overlap = false;
            for (let yy = y - 1; yy <= y + h && !overlap; yy++)
                for (let xx = x - 1; xx <= x + w; xx++)
                    if (occ[yy]?.[xx]) overlap = true;
            if (overlap) continue;
            for (let yy = y - 1; yy <= y + h; yy++)
                for (let xx = x - 1; xx <= x + w; xx++) occ[yy][xx] = true;
            for (let yy = y; yy < y + h; yy++)
                for (let xx = x; xx < x + w; xx++) grid[yy][xx].type = 'floor';
            rooms.push({ x, y, w, h });
        }
    }
    function carveCorridor(a, b) {
        let x = a.x, y = a.y;
        if (Math.random() < 0.5) {
            while (x !== b.x) { grid[y][x].type = 'floor'; x += x < b.x ? 1 : -1; }
            while (y !== b.y) { grid[y][x].type = 'floor'; y += y < b.y ? 1 : -1; }
        } else {
            while (y !== b.y) { grid[y][x].type = 'floor'; y += y < b.y ? 1 : -1; }
            while (x !== b.x) { grid[y][x].type = 'floor'; x += x < b.x ? 1 : -1; }
        }
        grid[b.y][b.x].type = 'floor';
    }
    function connectRooms() {
        const centers = rooms.map(r => ({ x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) }));
        centers.slice(1).forEach((c, i) => carveCorridor(centers[i], c));
    }
    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            const cell = grid[y][x];
            const px = x * cellSize, py = y * cellSize;
            if (cell.type === 'floor' || cell.type === 'door' || cell.type === 'plate') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(px, py, cellSize, cellSize);
            }
            if (cell.type === 'plate') {
                ctx.fillStyle = '#000';
                ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            }
            if (cell.type === 'door') {
                const t = Math.floor(cellSize * 0.3);
                ctx.fillStyle = '#000';
                if (cell.orientation % 2 === 0) ctx.fillRect(px + (cellSize - t) / 2, py, t, cellSize);
                else ctx.fillRect(px, py + (cellSize - t) / 2, cellSize, t);
            }
        }

        if (spawnPosition) {
            const { x, y } = spawnPosition;
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize / 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'green';
            ctx.fill();
        }

        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (grid[y][x].type === 'wall') {
            ctx.fillStyle = mainColor;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }

        ctx.fillStyle = '#000';
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            const cell = grid[y][x];
            const px = x * cellSize, py = y * cellSize;
            if (cell.type === 'floor' || cell.type === 'door' || cell.type === 'plate') {
                if (grid[y - 1]?.[x]?.type === 'wall') ctx.fillRect(px, py, cellSize, borderSize);
                if (grid[y + 1]?.[x]?.type === 'wall') ctx.fillRect(px, py + cellSize - borderSize, cellSize, borderSize);
                if (grid[y]?.[x - 1]?.type === 'wall') ctx.fillRect(px, py, borderSize, cellSize);
                if (grid[y]?.[x + 1]?.type === 'wall') ctx.fillRect(px + cellSize - borderSize, py, borderSize, cellSize);
            }
        }

        ctx.font = `${textSize}px 'Press Start 2P'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        labelPlacements.forEach(p => ctx.fillText(p.label, p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2));

        if (selectionStart && selectionEnd) {
            const x0 = Math.min(selectionStart[0], selectionEnd[0]);
            const y0 = Math.min(selectionStart[1], selectionEnd[1]);
            const x1 = Math.max(selectionStart[0], selectionEnd[0]);
            const y1 = Math.max(selectionStart[1], selectionEnd[1]);
            ctx.save();
            ctx.fillStyle = selectionColor;
            ctx.fillRect(x0 * cellSize, y0 * cellSize, (x1 - x0 + 1) * cellSize, (y1 - y0 + 1) * cellSize);
            ctx.restore();
        }

        if (hoverCell) {
            ctx.save();
            ctx.fillStyle = hoverColor;
            ctx.fillRect(hoverCell[0] * cellSize, hoverCell[1] * cellSize, cellSize, cellSize);
            ctx.restore();
        }
    }
    function clearPreviousSpawn() {
        if (spawnPosition) {
            grid[spawnPosition.y][spawnPosition.x].type = 'floor';
            spawnPosition = null;
        }
    }
    function applyToolToSelection(tool) {
        if (!selectionStart || !selectionEnd) return;
        const x0 = Math.min(selectionStart[0], selectionEnd[0]);
        const y0 = Math.min(selectionStart[1], selectionEnd[1]);
        const x1 = Math.max(selectionStart[0], selectionEnd[0]);
        const y1 = Math.max(selectionStart[1], selectionEnd[1]);
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                if (tool === 'eraser') {
                    grid[y][x].type = 'floor';
                    labelPlacements = labelPlacements.filter(p => p.x !== x || p.y !== y);
                } else if (tool === 'wall') {
                    grid[y][x].type = 'wall';
                } else if (tool === 'door') {
                    if (grid[y][x].type !== 'wall') grid[y][x].type = 'door';
                } else if (tool === 'plate') {
                    if (grid[y][x].type === 'floor') grid[y][x].type = 'plate';
                } else if (tool === 'placeS' || tool === 'placeM') {
                    if (grid[y][x].type === 'floor') {
                        labelPlacements = labelPlacements.filter(p => p.x !== x || p.y !== y);
                        labelPlacements.push({ x, y, label: tool === 'placeS' ? 'S' : 'M' });
                    }
                } else if (tool === 'placeSpawn') {
                    if (grid[y][x].type === 'floor') {
                        clearPreviousSpawn();
                        grid[y][x].type = 'floor';
                        spawnPosition = { x, y };
                    }
                }
            }
        }
        selectionStart = selectionEnd = null;
        drawMap();
    }
    function handleAction(x, y) {
        const c = grid[y][x];
        if ((currentTool === null || currentTool === 'door') && c.type === 'door') {
            c.orientation = (c.orientation + 1) % 4;
        } else if (currentTool === 'wall') {
            c.type = 'wall';
        } else if (currentTool === 'eraser') {
            c.type = 'floor';
            labelPlacements = labelPlacements.filter(p => p.x !== x || p.y !== y);
        } else if (currentTool === 'door' && c.type !== 'wall') {
            c.type = 'door'; c.orientation = 0;
        } else if (currentTool === 'plate' && c.type === 'floor') {
            c.type = 'plate';
        } else if (currentTool === 'placeS' || currentTool === 'placeM') {
            if (c.type === 'floor') {
                labelPlacements = labelPlacements.filter(p => p.x !== x || p.y !== y);
                labelPlacements.push({ x, y, label: currentTool === 'placeS' ? 'S' : 'M' });
            }
        } else if (currentTool === 'placeSpawn') {
            if (c.type === 'floor') {
                clearPreviousSpawn();
                spawnPosition = { x, y };
            }
        }
        drawMap();
    }
    canvas.addEventListener('mousemove', e => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    // compute mouse position on the *canvas* coordinate system
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top)  * scaleY;

    const x = Math.floor(canvasX / cellSize);
    const y = Math.floor(canvasY / cellSize);

    hoverCell = (x >= 0 && x < cols && y >= 0 && y < rows)
        ? [x, y]
        : null;

    if (painting) {
        if (currentTool) {
        if (hoverCell) handleAction(...hoverCell);
        } else if (selectionStart) {
        if (hoverCell) selectionEnd = hoverCell;
        }
    }
    drawMap();
    });
    canvas.addEventListener('mousedown', () => {
        painting = true;
        if (!currentTool && hoverCell) {
            selectionStart = hoverCell.slice();
            selectionEnd = hoverCell.slice();
        }
    });
    window.addEventListener('mouseup', () => {
        painting = false;
    });
    canvas.addEventListener('click', () => {
        if (hoverCell) handleAction(...hoverCell);
        drawMap();
    });
    document.querySelectorAll('#options .tool-btn').forEach(btn => btn.addEventListener('click', e => {
        const map = {
            placeS: 'placeS',
            placeM: 'placeM',
            placeWall: 'wall',
            placeBlock: 'wall',
            eraser: 'eraser',
            placeDoor: 'door',
            placePlate: 'plate',
            placeSpawn: 'placeSpawn'
        };
        const tool = map[e.target.id];
        if (selectionStart && selectionEnd) {
            applyToolToSelection(tool);
            currentTool = null;
            document.querySelectorAll('#options .tool-btn').forEach(b => b.classList.remove('active'));
            return;
        }
        if (currentTool === tool) {
            currentTool = null;
            btn.classList.remove('active');
        } else {
            currentTool = tool;
            document.querySelectorAll('#options .tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        selectionStart = selectionEnd = null;
        drawMap();
    }));
    const generateBtn = document.getElementById('btn');
    generateBtn.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastGenTime < 1000) return;
        lastGenTime = now;
        initGrid();
        placeRooms();
        connectRooms();
        drawMap();
    });
    function saveWorld(filename, data) {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    function onDownload(format) {
        const world = { grid, rooms, labelPlacements, spawnPosition };
        const json = JSON.stringify(world);
        saveWorld(`world_${Date.now()}.${format}`, json);
    }
    function onUpload(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const world = JSON.parse(reader.result);
                grid = world.grid.map(row => row.map(c => Object.assign(new Cell(), c)));
                rooms = world.rooms;
                labelPlacements = world.labelPlacements;
                spawnPosition = world.spawnPosition;
                drawMap();
            } catch (err) {}
        };
        reader.readAsText(file);
    }

    const dlBtn = document.getElementById('downloadBtn');
    dlBtn.innerHTML = '<img src="icons/file-down.svg" alt="Download">  ​ download';
    dlBtn.addEventListener('click', () => onDownload('json'));
    dlBtn.addEventListener('contextmenu', e => { e.preventDefault(); onDownload('dat'); });

    const ulBtn = document.getElementById('uploadBtn');
    ulBtn.innerHTML = '<img src="icons/file-up.svg" alt="Upload">  ​ upload';
    ulBtn.addEventListener('click', () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,.dat';
        input.addEventListener('change', onUpload); input.click();
    });

    initGrid();
    placeRooms();
    connectRooms();
    drawMap();
});


import {
    hasSelection, applyToolToSelection, getCurrentTool,
    setCurrentTool, resetSelection, drawAll
} from './input.js';
import {
    initGrid, placeRooms, connectRooms, loadWorld,
    grid, rooms, labelPlacements, spawnPosition
} from './world.js';
import { setUseTextures } from './renderer.js';

export function setupUI() {
    const optBtn = document.getElementById('optBtn');
    const options = document.getElementById('options');
    const modal = document.getElementById('initialModal');
    const close = document.getElementById('modalClose');


    modal.style.display = 'flex';
    close.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    optBtn.addEventListener('click', () => {
        options.classList.toggle('open');
        optBtn.classList.toggle('open');
    });

    // Tool buttons 
    const toolButtons = document.querySelectorAll('#options .tool-btn');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
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
            if (hasSelection()) {
                applyToolToSelection(tool);
                setCurrentTool(null);
                toolButtons.forEach(b => b.classList.remove('active'));
                return;
            }
            if (getCurrentTool() === tool) {
                setCurrentTool(null);
                btn.classList.remove('active');
            } else {
                setCurrentTool(tool);
                toolButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            resetSelection();
            drawAll();
        });
    });

    const generateBtn = document.getElementById('btn');
    let lastGenTime = 0;
    generateBtn.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastGenTime < 1000) return;
        lastGenTime = now;
        initGrid();
        placeRooms();
        connectRooms();
        resetSelection();
        drawAll();
    });

    function saveWorld(filename, data) {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    function onDownload(format) {
        const worldData = { grid, rooms, labelPlacements, spawnPosition };
        const json = JSON.stringify(worldData);
        saveWorld(`world_${Date.now()}.${format}`, json);
    }

    function onUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const worldData = JSON.parse(reader.result);
                loadWorld(worldData);
                drawAll();
            } catch (err) {
                // invalid file
            }
        };
        reader.readAsText(file);
    }

    const dlBtn = document.getElementById('downloadBtn');
    dlBtn.addEventListener('click', () => onDownload('json'));
    dlBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        onDownload('dat');
    });

    const ulBtn = document.getElementById('uploadBtn');
    ulBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const worldData = JSON.parse(reader.result);
                    loadWorld(worldData);
                    drawAll();
                } catch (err) {
                }
            };
            reader.readAsText(file);
        });
        input.click();
    });

    const playBtn = document.getElementById('playBtn');
    playBtn.addEventListener('click', () => {
        startGame();
    });



    const concreteThemeBtn = document.getElementById('concreteTheme');
    const brickThemeBtn = document.getElementById('brickTheme');
    const sandThemeBtn = document.getElementById('sandTheme');

    function setActiveTheme(activeBtn) {
        [concreteThemeBtn, brickThemeBtn, sandThemeBtn].forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    concreteThemeBtn.addEventListener('click', () => {
        setUseTextures(false);
        setActiveTheme(concreteThemeBtn);
        drawAll();
    });

    brickThemeBtn.addEventListener('click', () => {
        setUseTextures(true);
        setActiveTheme(brickThemeBtn);
        drawAll();
    });

    sandThemeBtn.addEventListener('click', () => {
        setUseTextures(true); // same like brick theme because it is not availabl yet
        setActiveTheme(sandThemeBtn);
        drawAll();
    });
}

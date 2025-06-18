window.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const canvas    = document.getElementById('mazeCanvas');
  const ctx       = canvas.getContext('2d');

  const canvasBorder = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--canvas-border')) || 0;
  canvas.style.border = none;
  canvas.style.borderRadius = '0';
  const cellSize   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cellsize'));
  const borderSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mazeborder'));
  const wallInner  = getComputedStyle(document.documentElement).getPropertyValue('--wallInnerColor');
  const wallBorder = getComputedStyle(document.documentElement).getPropertyValue('--wallBorderColor');
  const floorColor = getComputedStyle(document.documentElement).getPropertyValue('--floorcolor');
  const doorColor  = getComputedStyle(document.documentElement).getPropertyValue('--doorcolor');
  const plateColor = getComputedStyle(document.documentElement).getPropertyValue('--platecolor');
  const playerColor= getComputedStyle(document.documentElement).getPropertyValue('--playercolor');

  const viewR = 15;
  const viewW = viewR * 2 + 1;
  canvas.width  = viewW * cellSize;
  canvas.height = viewW * cellSize;

  // // Zusätzliche CSS-Styles setzen (falls dynamisch):
  // canvas.style.width  = ${canvas.width * 2}px;
  // canvas.style.height = ${canvas.height * 2}px;
  // canvas.style.margin = '0 auto';

  let grid = [];
  let rows = 0, cols = 0;
  let player = { x: 0, y: 0, dir: 0 };

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const w = JSON.parse(reader.result);
      grid = w.grid;
      rows = grid.length;
      cols = grid[0].length;
      if (w.spawnPosition
          && grid[w.spawnPosition.y]?.[w.spawnPosition.x]?.type === 'floor') {
        player.x = w.spawnPosition.x;
        player.y = w.spawnPosition.y;
      } else {
        outer: for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (grid[y][x].type === 'floor') {
              player.x = x;
              player.y = y;
              break outer;
            }
          }
        }
      }
      draw();
    };
    reader.readAsText(f);
  });

  window.addEventListener('keydown', e => {
    const key = e.key;
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];
    // Kamera dreh'n
    if (key === 'ArrowLeft') player.dir = (player.dir + 3) % 4;
    if (key === 'ArrowRight') player.dir = (player.dir + 1) % 4;
    // Bewegung
    let stepX = 0, stepY = 0;
    if (key === 'w') { stepX = dx[player.dir]; stepY = dy[player.dir]; }
    if (key === 's') { stepX = -dx[player.dir]; stepY = -dy[player.dir]; }
    if (key === 'a') { stepX = dx[(player.dir + 3) % 4]; stepY = dy[(player.dir + 3) % 4]; }
    if (key === 'd') { stepX = dx[(player.dir + 1) % 4]; stepY = dy[(player.dir + 1) % 4]; }
    if (stepX !== 0 || stepY !== 0) {
      const nx = player.x + stepX;
      const ny = player.y + stepY;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        const t = grid[ny][nx].type;
        if (['floor', 'door', 'plate'].includes(t)) {
          player.x = nx;
          player.y = ny;
        }
      }
    }
    draw();
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let dyOff = -viewR; dyOff <= viewR; dyOff++) {
      for (let dxOff = -viewR; dxOff <= viewR; dxOff++) {
        const gx = player.x + dxOff;
        const gy = player.y + dyOff;
        if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) continue;
        const cell = grid[gy][gx];
        const px = (dxOff + viewR) * cellSize;
        const py = (dyOff + viewR) * cellSize;
        if (['floor','door','plate'].includes(cell.type)) {
          ctx.fillStyle = floorColor;
          ctx.fillRect(px,py,cellSize,cellSize);
        }
      }
    }
    for (let dyOff = -viewR; dyOff <= viewR; dyOff++) {
      for (let dxOff = -viewR; dxOff <= viewR; dxOff++) {
        const gx = player.x + dxOff;
        const gy = player.y + dyOff;
        if (gx<0||gx>=cols||gy<0||gy>=rows) continue;
        if (grid[gy][gx].type==='wall') {
          const px=(dxOff+viewR)*cellSize;
          const py=(dyOff+viewR)*cellSize;
          ctx.fillStyle=wallInner;
          ctx.fillRect(px,py,cellSize,cellSize);
        }
      }
    }
    ctx.fillStyle=wallBorder;
    for (let dyOff=-viewR;dyOff<=viewR;dyOff++){
      for (let dxOff=-viewR;dxOff<=viewR;dxOff++){
        const gx=player.x+dxOff, gy=player.y+dyOff;
        if (gx<0||gx>=cols||gy<0||gy>=rows) continue;
        if (grid[gy][gx].type==='wall') continue;
        const px=(dxOff+viewR)*cellSize, py=(dyOff+viewR)*cellSize;
        if (grid[gy-1]?.[gx]?.type==='wall') ctx.fillRect(px,py,cellSize,borderSize);
        if (grid[gy+1]?.[gx]?.type==='wall') ctx.fillRect(px,py+cellSize-borderSize,cellSize,borderSize);
        if (grid[gy]?.[gx-1]?.type==='wall') ctx.fillRect(px,py,borderSize,cellSize);
        if (grid[gy]?.[gx+1]?.type==='wall') ctx.fillRect(px+cellSize-borderSize,py,borderSize,cellSize);
      }
    }
    for (let dyOff=-viewR;dyOff<=viewR;dyOff++){
      for(let dxOff=-viewR;dxOff<=viewR;dxOff++){
        const gx=player.x+dxOff, gy=player.y+dyOff;
        if(gx<0||gx>=cols||gy<0||gy>=rows) continue;
        const cell=grid[gy][gx];
        const px=(dxOff+viewR)*cellSize, py=(dyOff+viewR)*cellSize;
        if(cell.type==='door'){
          const t=cellSize*0.3;
          ctx.fillStyle=doorColor;
          if(cell.orientation%2===0) ctx.fillRect(px+(cellSize-t)/2,py,t,cellSize);
          else ctx.fillRect(px,py+(cellSize-t)/2,cellSize,t);
        }
        if(cell.type==='plate'){
          ctx.fillStyle=plateColor;
          ctx.fillRect(px+1,py+1,cellSize-2,cellSize-2);
        }
      }
    }
    const baseX=(viewR*cellSize), baseY=(viewR*cellSize);
    const size=cellSize*0.6;
    const offset=(cellSize-size)/2;
    ctx.fillStyle=playerColor;
    ctx.fillRect(baseX+offset, baseY+offset, size, size);
    const midX=baseX+cellSize/2, midY=baseY+cellSize/2;
    const len=cellSize*0.5;
    let endX=midX, endY=midY;
    if(player.dir===0) endY=midY-len;
    if(player.dir===1) endX=midX+len;
    if(player.dir===2) endY=midY+len;
    if(player.dir===3) endX=midX-len;
    ctx.beginPath(); ctx.moveTo(midX,midY); ctx.lineTo(endX,endY);
    ctx.lineWidth=3; ctx.strokeStyle=playerColor; ctx.stroke();
  }
});

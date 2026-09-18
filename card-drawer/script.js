const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');

// Landscape card proportions — easy to change later if you want a different shape.
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.style.width = CANVAS_WIDTH + 'px';
canvas.style.height = CANVAS_HEIGHT + 'px';

const CARD_MARGIN = 20;
const CARD_RADIUS = 24;

function cardOutlinePath() {
  const x = CARD_MARGIN;
  const y = CARD_MARGIN;
  const w = CANVAS_WIDTH - CARD_MARGIN * 2;
  const h = CANVAS_HEIGHT - CARD_MARGIN * 2;
  const r = CARD_RADIUS;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCardOutline() {
  cardOutlinePath();
  ctx.save();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
drawCardOutline();

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushSizeLabel = document.getElementById('brushSizeLabel');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

let strokes = [];
let currentStroke = null;
let isDrawing = false;
let isEraser = false;

brushSize.addEventListener('input', () => {
  brushSizeLabel.textContent = brushSize.value;
});

eraserBtn.addEventListener('click', () => {
  isEraser = !isEraser;
  eraserBtn.classList.toggle('active', isEraser);
});

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function redrawAll() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  cardOutlinePath();
  ctx.clip();
  for (const stroke of strokes) {
    drawStroke(stroke);
  }
  ctx.restore();

  drawCardOutline();
}

function drawStroke(stroke) {
  if (stroke.points.length < 1) return;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = stroke.eraser ? '#ffffff' : stroke.color;
  ctx.lineWidth = stroke.size;

  if (stroke.points.length === 1) {
    const p = stroke.points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.eraser ? '#ffffff' : stroke.color;
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
}

canvas.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  const pos = getPos(e);
  currentStroke = {
    color: colorPicker.value,
    size: Number(brushSize.value),
    eraser: isEraser,
    points: [pos]
  };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDrawing || !currentStroke) return;
  const pos = getPos(e);
  currentStroke.points.push(pos);
  ctx.save();
  cardOutlinePath();
  ctx.clip();
  drawStroke({ ...currentStroke, points: currentStroke.points.slice(-2) });
  ctx.restore();
});

function endStroke() {
  if (!isDrawing || !currentStroke) return;
  strokes.push(currentStroke);
  currentStroke = null;
  isDrawing = false;
  saveToLocalStorage();
}

canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointerleave', endStroke);
canvas.addEventListener('pointercancel', endStroke);

undoBtn.addEventListener('click', () => {
  strokes.pop();
  redrawAll();
  saveToLocalStorage();
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear the whole drawing?')) return;
  strokes = [];
  redrawAll();
  saveToLocalStorage();
});

function saveToLocalStorage() {
  try {
    localStorage.setItem('cardDrawerStrokes', JSON.stringify(strokes));
  } catch (e) {
    // ignore storage errors
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('cardDrawerStrokes');
    if (raw) {
      strokes = JSON.parse(raw);
      redrawAll();
    }
  } catch (e) {
    // ignore
  }
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

saveBtn.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-drawing.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');

  downloadFile('card-drawing-strokes.json', JSON.stringify(strokes), 'application/json');
});

loadFromLocalStorage();

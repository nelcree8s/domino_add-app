/**
 * Domino Score — visual selector + camera detection
 */

const totalEl = document.getElementById('totalPoints');
const selectedList = document.getElementById('selectedList');
const selectedEmpty = document.getElementById('selectedEmpty');
const dominoGrid = document.getElementById('dominoGrid');
const btnReset = document.getElementById('btnReset');

// Camera elements
const btnModeManual = document.getElementById('btnModeManual');
const btnModeCamera = document.getElementById('btnModeCamera');
const cameraSection = document.getElementById('cameraSection');
const manualSection = document.getElementById('manualSection');
const video = document.getElementById('video');
const captureCanvas = document.getElementById('captureCanvas');
const fileInput = document.getElementById('fileInput');
const btnCapture = document.getElementById('btnCapture');
const cameraStatus = document.getElementById('cameraStatus');
const detectedPreview = document.getElementById('detectedPreview');
const detectedList = document.getElementById('detectedList');

let stream = null;
let opencvReady = false;

/** @type {{ left: number, right: number, id: number }[]} */
let pieces = [];
let nextId = 0;

// Generate all 28 unique domino combinations (0-0 through 6-6)
const allDominos = [];
for (let i = 0; i <= 6; i++) {
  for (let j = i; j <= 6; j++) {
    allDominos.push({ left: i, right: j });
  }
}

// Create domino grid
allDominos.forEach((domino) => {
  const tile = document.createElement('button');
  tile.className = 'domino-tile';
  tile.setAttribute('data-left', domino.left);
  tile.setAttribute('data-right', domino.right);
  tile.setAttribute('aria-label', `Domino ${domino.left}-${domino.right}`);
  
  const leftHalf = document.createElement('div');
  leftHalf.className = 'domino-half';
  leftHalf.innerHTML = renderDots(domino.left);
  
  const divider = document.createElement('div');
  divider.className = 'domino-divider';
  
  const rightHalf = document.createElement('div');
  rightHalf.className = 'domino-half';
  rightHalf.innerHTML = renderDots(domino.right);
  
  tile.appendChild(leftHalf);
  tile.appendChild(divider);
  tile.appendChild(rightHalf);
  
  tile.addEventListener('click', () => addPiece(domino.left, domino.right));
  dominoGrid.appendChild(tile);
});

/**
 * Render dots for a domino half (0-6) in standard patterns
 */
function renderDots(count) {
  if (count === 0) return '<span class="dot-empty"></span>';
  // Standard domino pip patterns
  const patterns = {
    1: '<span class="dot"></span>',
    2: '<span class="dot"></span><span class="dot"></span>',
    3: '<span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    4: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    5: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    6: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>'
  };
  return `<span class="dots dots-${count}">${patterns[count] || ''}</span>`;
}

/**
 * Add a piece to the list
 */
function addPiece(left, right) {
  pieces.push({ left, right, id: nextId++ });
  render();
  // Brief visual feedback
  const tiles = dominoGrid.querySelectorAll(`[data-left="${left}"][data-right="${right}"]`);
  tiles.forEach(tile => {
    tile.classList.add('tapped');
    setTimeout(() => tile.classList.remove('tapped'), 200);
  });
}

/**
 * Remove a piece by ID
 */
function removePiece(id) {
  pieces = pieces.filter(p => p.id !== id);
  render();
}

/**
 * Calculate total
 */
function total() {
  return pieces.reduce((s, p) => s + p.left + p.right, 0);
}

/**
 * Render the UI
 */
function render() {
  totalEl.textContent = String(total());
  selectedList.innerHTML = '';
  pieces.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'piece-item';
    
    const domino = document.createElement('div');
    domino.className = 'piece-domino';
    domino.innerHTML = `
      <div class="domino-half">${renderDots(p.left)}</div>
      <div class="domino-divider"></div>
      <div class="domino-half">${renderDots(p.right)}</div>
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', 'Remove');
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', () => removePiece(p.id));
    
    li.appendChild(domino);
    li.appendChild(removeBtn);
    selectedList.appendChild(li);
  });
  selectedEmpty.classList.toggle('hidden', pieces.length > 0);
}

btnReset.addEventListener('click', () => {
  pieces = [];
  nextId = 0;
  render();
});

// ---- Mode Toggle ----
btnModeManual.addEventListener('click', () => {
  cameraSection.classList.add('hidden');
  manualSection.classList.remove('hidden');
  btnModeManual.classList.add('active');
  btnModeCamera.classList.remove('active');
  stopCamera();
});

btnModeCamera.addEventListener('click', () => {
  cameraSection.classList.remove('hidden');
  manualSection.classList.add('hidden');
  btnModeCamera.classList.add('active');
  btnModeManual.classList.remove('active');
  startCamera();
});

// ---- Camera ----
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    cameraStatus.textContent = 'Camera ready. Point at the dominoes and tap Scan.';
    btnCapture.disabled = false;
  } catch (e) {
    cameraStatus.textContent = 'Camera access denied. Use "Choose photo" or switch to Manual mode.';
    console.warn('getUserMedia failed:', e);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

function captureFromVideo() {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;
  captureCanvas.width = w;
  captureCanvas.height = h;
  const ctx = captureCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  processImage(captureCanvas);
}

fileInput.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(800 / img.width, 800 / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    captureCanvas.width = w;
    captureCanvas.height = h;
    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    processImage(captureCanvas);
  };
  img.src = URL.createObjectURL(f);
  e.target.value = '';
});

btnCapture.addEventListener('click', captureFromVideo);

// ---- OpenCV ----
function onOpenCvReady() {
  opencvReady = true;
  console.log('OpenCV.js ready');
}

if (typeof cv !== 'undefined' && typeof cv.Mat !== 'undefined') {
  onOpenCvReady();
} else {
  window.addEventListener('opencvReady', onOpenCvReady);
}

/**
 * Simple pip counting - count dark blobs in a half
 */
function countPips(halfGray) {
  const area = halfGray.rows * halfGray.cols;
  if (area < 100) return 0;
  const thresh = new cv.Mat();
  cv.adaptiveThreshold(halfGray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(thresh, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const minArea = Math.max(4, area * 0.02);
  const maxArea = area * 0.3;
  let count = 0;
  for (let i = 0; i < contours.size(); i++) {
    const a = cv.contourArea(contours.get(i));
    if (a >= minArea && a <= maxArea) count++;
  }
  thresh.delete();
  contours.delete();
  hier.delete();
  return Math.min(6, Math.max(0, count));
}

/**
 * Simplified detection - find rectangular regions and count pips
 */
function detectPieces(canvas) {
  if (typeof cv === 'undefined' || !opencvReady) return [];
  try {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    src.delete();
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    const contours = new cv.MatVector();
    const hier = new cv.Mat();
    cv.findContours(thresh, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    thresh.delete();
    hier.delete();
    const imgArea = blurred.rows * blurred.cols;
    const candidates = [];
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const r = cv.boundingRect(c);
      const a = r.width * r.height;
      if (a < imgArea * 0.01 || a > imgArea * 0.3) continue;
      const ar = r.width / r.height;
      const isH = ar >= 1.5 && ar <= 2.5;
      const isV = ar >= 0.4 && ar <= 0.67;
      if (!isH && !isV) continue;
      const contourArea = cv.contourArea(c);
      if (contourArea / a < 0.5) continue; // Reject sparse shapes
      let v1, v2;
      if (isH) {
        const mid = Math.floor(r.x + r.width / 2);
        v1 = countPips(blurred.roi(new cv.Rect(r.x, r.y, mid - r.x, r.height)));
        v2 = countPips(blurred.roi(new cv.Rect(mid, r.y, r.x + r.width - mid, r.height)));
      } else {
        const mid = Math.floor(r.y + r.height / 2);
        v1 = countPips(blurred.roi(new cv.Rect(r.x, r.y, r.width, mid - r.y)));
        v2 = countPips(blurred.roi(new cv.Rect(r.x, mid, r.width, r.y + r.height - mid)));
      }
      if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6) {
        candidates.push({ left: v1, right: v2 });
      }
    }
    blurred.delete();
    gray.delete();
    contours.delete();
    // Remove duplicates (simple NMS)
    const unique = [];
    for (const c of candidates) {
      const exists = unique.some(u => u.left === c.left && u.right === c.right);
      if (!exists) unique.push(c);
    }
    return unique.slice(0, 10); // Max 10 pieces
  } catch (e) {
    console.error('Detection error:', e);
    return [];
  }
}

function processImage(canvas) {
  if (!opencvReady) {
    cameraStatus.textContent = 'OpenCV.js not ready yet.';
    return;
  }
  cameraStatus.textContent = 'Processing...';
  const detected = detectPieces(canvas);
  detectedPreview.classList.toggle('hidden', detected.length === 0);
  detectedList.innerHTML = '';
  if (detected.length > 0) {
    detected.forEach((d, idx) => {
      const li = document.createElement('li');
      li.className = 'detected-item';
      const btn = document.createElement('button');
      btn.className = 'detected-domino';
      btn.innerHTML = `
        <div class="domino-half">${renderDots(d.left)}</div>
        <div class="domino-divider"></div>
        <div class="domino-half">${renderDots(d.right)}</div>
      `;
      btn.addEventListener('click', () => {
        addPiece(d.left, d.right);
        btn.disabled = true;
        btn.classList.add('added');
      });
      li.appendChild(btn);
      detectedList.appendChild(li);
    });
    cameraStatus.textContent = `Found ${detected.length} piece(s). Tap to add.`;
  } else {
    cameraStatus.textContent = 'No pieces detected. Try better lighting or use Manual mode.';
  }
}

// ---- Lifecycle ----
window.addEventListener('beforeunload', stopCamera);

// Initial render
render();

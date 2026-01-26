/**
 * Domino Score — scan remaining pieces from camera/photo and sum points.
 * Uses OpenCV.js for contour + dot detection; manual entry as fallback.
 */

const video = document.getElementById('video');
const captureCanvas = document.getElementById('captureCanvas');
const fileInput = document.getElementById('fileInput');
const btnCapture = document.getElementById('btnCapture');
const btnAdd = document.getElementById('btnAdd');
const btnReset = document.getElementById('btnReset');
const selectLeft = document.getElementById('selectLeft');
const selectRight = document.getElementById('selectRight');
const totalEl = document.getElementById('totalPoints');
const detectedList = document.getElementById('detectedList');
const detectedEmpty = document.getElementById('detectedEmpty');
const cameraStatus = document.getElementById('cameraStatus');
const opencvStatus = document.getElementById('opencvStatus');

/** @type {{ left: number, right: number }[]} */
let pieces = [];
let stream = null;
let opencvReady = false;

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
    cameraStatus.textContent = 'Camera access denied. Use "Choose photo" or add manually.';
    console.warn('getUserMedia failed:', e);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

// ---- Capture ----
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
  opencvStatus.textContent = 'OpenCV.js ready. You can scan.';
}

if (typeof cv !== 'undefined' && typeof cv.Mat !== 'undefined') {
  onOpenCvReady();
} else {
  window.addEventListener('opencvReady', onOpenCvReady);
}

/**
 * Count dots (0–6) in a half-domino image. Uses threshold + contour count.
 * Pips are dark on light, so we use BINARY_INV to find them.
 * @param {cv.Mat} halfGray - grayscale ROI of one half
 * @returns {number} 0–6
 */
function countDotsInHalf(halfGray) {
  const area = halfGray.rows * halfGray.cols;
  if (area < 100) return 0; // too small, skip
  const thresh = new cv.Mat();
  cv.threshold(halfGray, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(thresh, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  // A pip is typically 5–25% of the half; reject tiny noise and huge blobs
  const minArea = Math.max(4, area * 0.025);
  const maxArea = area * 0.35;
  let count = 0;
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const a = cv.contourArea(c);
    if (a >= minArea && a <= maxArea) count++;
  }
  thresh.delete();
  contours.delete();
  hier.delete();
  return Math.min(6, Math.max(0, count));
}

/**
 * Run OpenCV pipeline: find domino-like rectangles, count dots per half, return list of [a,b].
 * We find LIGHT regions (domino faces) with THRESH_BINARY so we get the domino outline,
 * not dark pips/center-line which caused false detections.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ left: number, right: number }[]}
 */
function detectPieces(canvas) {
  if (typeof cv === 'undefined') return [];
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  src.delete();
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  const imgArea = blurred.rows * blurred.cols;
  const minArea = imgArea * 0.015;  // ~1.5%; ignore tiny blobs
  const maxArea = imgArea * 0.30;   // ignore huge (whole table)
  // Domino is ~2:1; reject thin strips (center line, shadows). Horizontal: 1.5–2.5, vertical: 0.4–0.67
  const candidates = [];

  function findCandidates(threshMat) {
    const cont = new cv.MatVector();
    const h = new cv.Mat();
    cv.findContours(threshMat, cont, h, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    h.delete();
    for (let i = 0; i < cont.size(); i++) {
      const c = cont.get(i);
      const r = cv.boundingRect(c);
      const a = r.width * r.height;
      if (a < minArea || a > maxArea) continue;
      const ar = r.width / r.height;
      const isH = ar >= 1.5 && ar <= 2.5;
      const isV = ar >= 0.4 && ar <= 0.67;
      if (!isH && !isV) continue;
      let v1, v2;
      if (isH) {
        const mid = Math.floor(r.x + r.width / 2);
        v1 = countDotsInHalf(blurred.roi(new cv.Rect(r.x, r.y, mid - r.x, r.height)));
        v2 = countDotsInHalf(blurred.roi(new cv.Rect(mid, r.y, r.x + r.width - mid, r.height)));
      } else {
        const mid = Math.floor(r.y + r.height / 2);
        v1 = countDotsInHalf(blurred.roi(new cv.Rect(r.x, r.y, r.width, mid - r.y)));
        v2 = countDotsInHalf(blurred.roi(new cv.Rect(r.x, mid, r.width, r.y + r.height - mid)));
      }
      if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6) {
        candidates.push({ rect: r, area: a, left: v1, right: v2 });
      }
    }
    cont.delete();
  }

  // Prefer light regions (domino on dark table); fallback to dark regions (domino on light table)
  const th = new cv.Mat();
  cv.threshold(blurred, th, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
  findCandidates(th);
  th.delete();
  if (candidates.length === 0) {
    const th2 = new cv.Mat();
    cv.threshold(blurred, th2, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
    findCandidates(th2);
    th2.delete();
  }

  blurred.delete();
  gray.delete();
  // NMS: drop candidates that overlap too much with a larger one (avoid double-count)
  candidates.sort((a, b) => b.area - a.area);
  const kept = [];
  for (const cur of candidates) {
    const r = cur.rect;
    let overlapped = false;
    for (const k of kept) {
      const ix = Math.max(0, Math.min(r.x + r.width, k.x + k.width) - Math.max(r.x, k.x));
      const iy = Math.max(0, Math.min(r.y + r.height, k.y + k.height) - Math.max(r.y, k.y));
      if (ix * iy / cur.area > 0.5) { overlapped = true; break; }
    }
    if (!overlapped) kept.push(cur.rect);
  }
  return candidates.filter((c) => kept.includes(c.rect)).map((c) => ({ left: c.left, right: c.right }));
}

function processImage(canvas) {
  const detected = opencvReady ? detectPieces(canvas) : [];
  if (detected.length > 0) {
    pieces.push(...detected);
  }
  render();
}

// ---- Manual ----
btnAdd.addEventListener('click', () => {
  const l = parseInt(selectLeft.value, 10);
  const r = parseInt(selectRight.value, 10);
  pieces.push({ left: l, right: r });
  render();
});

btnReset.addEventListener('click', () => {
  pieces = [];
  render();
});

// ---- Render ----
function total() {
  return pieces.reduce((s, p) => s + p.left + p.right, 0);
}

function render() {
  totalEl.textContent = String(total());
  detectedList.innerHTML = '';
  pieces.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = `${p.left}–${p.right}`;
    detectedList.appendChild(li);
  });
  detectedEmpty.classList.toggle('hidden', pieces.length > 0);
}

// ---- Lifecycle ----
startCamera();
render();

window.addEventListener('beforeunload', stopCamera);

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
 * @param {cv.Mat} halfGray - grayscale ROI of one half
 * @returns {number} 0–6
 */
function countDotsInHalf(halfGray) {
  const thresh = new cv.Mat();
  cv.threshold(halfGray, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(thresh, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const area = halfGray.rows * halfGray.cols;
  const minArea = Math.max(2, area * 0.003);
  const maxArea = area * 0.4;
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
  const thresh = new cv.Mat();
  cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(thresh, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  thresh.delete();
  hier.delete();
  const imgArea = blurred.rows * blurred.cols;
  const minArea = imgArea * 0.005;
  const maxArea = imgArea * 0.35;
  const out = [];
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const r = cv.boundingRect(c);
    const a = r.width * r.height;
    if (a < minArea || a > maxArea) continue;
    const ar = r.width / r.height;
    const isHorizontal = ar >= 1.2;
    const isVertical = ar <= 1 / 1.2;
    if (!isHorizontal && !isVertical) continue;
    let v1, v2;
    if (isHorizontal) {
      const mid = Math.floor(r.x + r.width / 2);
      const left = blurred.roi(new cv.Rect(r.x, r.y, mid - r.x, r.height));
      const right = blurred.roi(new cv.Rect(mid, r.y, r.x + r.width - mid, r.height));
      v1 = countDotsInHalf(left);
      v2 = countDotsInHalf(right);
    } else {
      const mid = Math.floor(r.y + r.height / 2);
      const top = blurred.roi(new cv.Rect(r.x, r.y, r.width, mid - r.y));
      const bot = blurred.roi(new cv.Rect(r.x, mid, r.width, r.y + r.height - mid));
      v1 = countDotsInHalf(top);
      v2 = countDotsInHalf(bot);
    }
    if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6) {
      out.push({ left: v1, right: v2 });
    }
  }
  contours.delete();
  blurred.delete();
  gray.delete();
  return out;
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

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
 * Count dots (0–6) in a half-domino image. Uses adaptive threshold + contour analysis.
 * Validates pips by circularity and size to reduce false positives.
 * @param {cv.Mat} halfGray - grayscale ROI of one half
 * @returns {number} 0–6
 */
function countDotsInHalf(halfGray) {
  const area = halfGray.rows * halfGray.cols;
  if (area < 150) return 0; // too small, skip
  // Use adaptive threshold for better handling of lighting variations
  const thresh = new cv.Mat();
  cv.adaptiveThreshold(halfGray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
  // Morphological opening to remove noise
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
  const cleaned = new cv.Mat();
  cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, kernel);
  kernel.delete();
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(cleaned, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  // Pips are roughly circular and 3–20% of the half area
  const minArea = Math.max(8, area * 0.03);
  const maxArea = area * 0.25;
  const validPips = [];
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const a = cv.contourArea(c);
    if (a < minArea || a > maxArea) continue;
    // Check circularity: 4π*area / perimeter² should be close to 1 for circles
    const perim = cv.arcLength(c, true);
    if (perim < 10) continue; // too small
    const circularity = (4 * Math.PI * a) / (perim * perim);
    // Accept if reasonably circular (0.5+) or if it's a large blob (might be multiple pips merged)
    if (circularity >= 0.5 || (a > area * 0.15 && circularity >= 0.3)) {
      validPips.push(a);
    }
  }
  thresh.delete();
  cleaned.delete();
  contours.delete();
  hier.delete();
  // Count: if we have large blobs, they might be multiple pips merged (e.g., 6-pip pattern)
  let count = validPips.length;
  // If we have fewer than expected but large blobs, might be merged pips
  const largeBlobs = validPips.filter(a => a > area * 0.12).length;
  if (count < 3 && largeBlobs > 0) {
    // Estimate: large blob might be 2-3 pips
    count = Math.min(6, count + largeBlobs);
  }
  return Math.min(6, Math.max(0, count));
}

/**
 * Check if a region has a center line (vertical or horizontal) indicating it's a domino.
 * @param {cv.Mat} roi - grayscale ROI of potential domino
 * @param {boolean} isHorizontal - true if domino is horizontal
 * @returns {boolean}
 */
function hasCenterLine(roi, isHorizontal) {
  const thresh = new cv.Mat();
  cv.threshold(roi, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  // Look for a line near the center (center line is dark, so shows up in BINARY_INV)
  const center = isHorizontal ? Math.floor(roi.cols / 2) : Math.floor(roi.rows / 2);
  const margin = Math.max(2, Math.floor((isHorizontal ? roi.cols : roi.rows) * 0.15));
  let linePixels = 0;
  const startX = isHorizontal ? Math.max(0, center - margin) : 0;
  const startY = isHorizontal ? 0 : Math.max(0, center - margin);
  const endX = isHorizontal ? Math.min(roi.cols, center + margin) : roi.cols;
  const endY = isHorizontal ? roi.rows : Math.min(roi.rows, center + margin);
  const checkArea = (endX - startX) * (endY - startY);
  if (checkArea < 10) {
    thresh.delete();
    return false;
  }
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (thresh.ucharPtr(y, x)[0] > 200) linePixels++;
    }
  }
  const lineRatio = linePixels / checkArea;
  thresh.delete();
  // Center line should have significant dark pixels (15%+ in the center region)
  return lineRatio > 0.15;
}

/**
 * Run OpenCV pipeline: find domino-like rectangles using edge detection, validate center line, count dots.
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
  // Use Canny edge detection to find actual boundaries
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);
  // Dilate edges slightly to close gaps
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const dilated = new cv.Mat();
  cv.dilate(edges, dilated, kernel);
  kernel.delete();
  edges.delete();
  const imgArea = blurred.rows * blurred.cols;
  const minArea = imgArea * 0.02;  // ~2%; more conservative
  const maxArea = imgArea * 0.25;  // ignore huge regions
  const candidates = [];
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(dilated, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  dilated.delete();
  hier.delete();
  // First pass: strict validation with center line
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const r = cv.boundingRect(c);
    const a = r.width * r.height;
    if (a < minArea || a > maxArea) continue;
    const ar = r.width / r.height;
    const isH = ar >= 1.6 && ar <= 2.4;  // Tighter: closer to true 2:1
    const isV = ar >= 0.42 && ar <= 0.625;
    if (!isH && !isV) continue;
    // Extract ROI and validate it has a center line
    const roi = blurred.roi(new cv.Rect(r.x, r.y, r.width, r.height));
    if (!hasCenterLine(roi, isH)) continue;  // Skip if no center line
    let v1, v2;
    if (isH) {
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
    // Only accept if both halves have valid counts
    if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6) {
      candidates.push({ rect: r, area: a, left: v1, right: v2 });
    }
  }
  // Fallback: if no candidates with center line, try without (might be faint center line)
  if (candidates.length === 0) {
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const r = cv.boundingRect(c);
      const a = r.width * r.height;
      if (a < minArea || a > maxArea) continue;
      const ar = r.width / r.height;
      const isH = ar >= 1.6 && ar <= 2.4;
      const isV = ar >= 0.42 && ar <= 0.625;
      if (!isH && !isV) continue;
      let v1, v2;
      if (isH) {
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
      // Require at least one half to have pips (reject blank regions)
      if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6 && (v1 > 0 || v2 > 0)) {
        candidates.push({ rect: r, area: a, left: v1, right: v2 });
      }
    }
  }
  contours.delete();
  blurred.delete();
  gray.delete();
  // NMS: drop candidates that overlap too much with a larger one
  candidates.sort((a, b) => b.area - a.area);
  const kept = [];
  for (const cur of candidates) {
    const r = cur.rect;
    let overlapped = false;
    for (const k of kept) {
      const ix = Math.max(0, Math.min(r.x + r.width, k.x + k.width) - Math.max(r.x, k.x));
      const iy = Math.max(0, Math.min(r.y + r.height, k.y + k.height) - Math.max(r.y, k.y));
      if (ix * iy / cur.area > 0.4) { overlapped = true; break; }  // 40% overlap threshold
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

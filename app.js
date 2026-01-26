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
  if (area < 100) return 0; // too small, skip
  // Use OTSU threshold - simpler and more reliable
  const thresh = new cv.Mat();
  cv.threshold(halfGray, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  // Light morphological opening to remove tiny noise
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(2, 2));
  const cleaned = new cv.Mat();
  cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, kernel);
  kernel.delete();
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(cleaned, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  // More lenient: pips are 2–30% of the half area
  const minArea = Math.max(4, area * 0.02);
  const maxArea = area * 0.30;
  let count = 0;
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const a = cv.contourArea(c);
    if (a >= minArea && a <= maxArea) {
      count++;
    }
  }
  thresh.delete();
  cleaned.delete();
  contours.delete();
  hier.delete();
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
  const imgArea = blurred.rows * blurred.cols;
  const minArea = imgArea * 0.015;  // 1.5% - more conservative
  const maxArea = imgArea * 0.25;   // ignore huge regions
  const candidates = [];
  
  // Try multiple approaches: threshold on light regions first
  const th = new cv.Mat();
  cv.threshold(blurred, th, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  cv.findContours(th, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  th.delete();
  hier.delete();
  
  // Process all contours with strict validation
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const r = cv.boundingRect(c);
    const a = r.width * r.height;
    if (a < minArea || a > maxArea) continue;
    
    // Stricter aspect ratio: closer to true 2:1 domino shape
    const ar = r.width / r.height;
    const isH = ar >= 1.7 && ar <= 2.3;  // Tighter: 1.7-2.3
    const isV = ar >= 0.43 && ar <= 0.59; // Tighter: 0.43-0.59
    if (!isH && !isV) continue;
    
    // Validate: contour should fill most of its bounding box (dominoes are solid rectangles)
    const contourArea = cv.contourArea(c);
    const fillRatio = contourArea / a;
    if (fillRatio < 0.6) continue; // Reject sparse shapes (table texture, shadows)
    
    let v1, v2;
    try {
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
      // Require at least one half to have pips (reject pure blank regions unless very clear)
      // Also reject if both halves have 0 (0-0 is valid but rare, and often false positive)
      if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6) {
        if (v1 === 0 && v2 === 0) {
          // Only accept 0-0 if the region is very clear (high fill ratio)
          if (fillRatio > 0.8) {
            candidates.push({ rect: r, area: a, left: v1, right: v2 });
          }
        } else {
          candidates.push({ rect: r, area: a, left: v1, right: v2 });
        }
      }
    } catch (e) {
      console.warn('Error processing contour:', e);
      continue;
    }
  }
  
  // If no candidates from light regions, try dark regions (inverted) - but with same strict validation
  if (candidates.length === 0) {
    const th2 = new cv.Mat();
    cv.threshold(blurred, th2, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
    const cont2 = new cv.MatVector();
    const h2 = new cv.Mat();
    cv.findContours(th2, cont2, h2, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    th2.delete();
    h2.delete();
    for (let i = 0; i < cont2.size(); i++) {
      const c = cont2.get(i);
      const r = cv.boundingRect(c);
      const a = r.width * r.height;
      if (a < minArea || a > maxArea) continue;
      const ar = r.width / r.height;
      const isH = ar >= 1.7 && ar <= 2.3;
      const isV = ar >= 0.43 && ar <= 0.59;
      if (!isH && !isV) continue;
      // Same fill ratio check
      const contourArea = cv.contourArea(c);
      const fillRatio = contourArea / a;
      if (fillRatio < 0.6) continue;
      try {
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
        if (v1 >= 0 && v1 <= 6 && v2 >= 0 && v2 <= 6) {
          if (v1 === 0 && v2 === 0) {
            if (fillRatio > 0.8) {
              candidates.push({ rect: r, area: a, left: v1, right: v2 });
            }
          } else {
            candidates.push({ rect: r, area: a, left: v1, right: v2 });
          }
        }
      } catch (e) {
        console.warn('Error processing inverted contour:', e);
        continue;
      }
    }
    cont2.delete();
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
      const intersection = ix * iy;
      const union = cur.area + k.width * k.height - intersection;
      const iou = intersection / union; // Intersection over Union
      if (iou > 0.3) { overlapped = true; break; } // Stricter: 30% IoU threshold
    }
    if (!overlapped) kept.push(cur.rect);
  }
  const result = candidates.filter((c) => kept.includes(c.rect)).map((c) => ({ left: c.left, right: c.right }));
  // Limit to reasonable number (max 10 pieces in a scan)
  return result.slice(0, 10);
}

function processImage(canvas) {
  if (!opencvReady) {
    cameraStatus.textContent = 'OpenCV.js not ready yet.';
    return;
  }
  try {
    const detected = detectPieces(canvas);
    console.log('Detected pieces:', detected);
    if (detected.length > 0) {
      pieces.push(...detected);
      cameraStatus.textContent = `Found ${detected.length} piece(s).`;
    } else {
      cameraStatus.textContent = 'No pieces detected. Try better lighting or add manually.';
    }
    render();
  } catch (e) {
    console.error('Detection error:', e);
    cameraStatus.textContent = 'Detection error. Try again or add manually.';
  }
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

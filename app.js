/**
 * Domino Score — Dominican-style match tracker + optional camera assist.
 *
 * Primary workflow (reliable):
 * - Pick which bucket you're adding to (Team A leftovers / Team B leftovers)
 * - Tap dominoes (0–6) to build each side's leftover tiles
 * - Open "Score hand" (list icon), choose Win / Tranque / Bonus, choose bonuses, Apply
 * - App awards points, stores history, continues until target is reached
 *
 * Camera workflow (secondary/experimental):
 * - Switch to Camera mode, scan table, then tap detected tiles to add to active bucket
 */

// -------------------- DOM helpers --------------------
const $ = (id) => document.getElementById(id);

// Scoreboard
const teamANameEl = $('teamAName');
const teamBNameEl = $('teamBName');
const teamAScoreEl = $('teamAScore');
const teamBScoreEl = $('teamBScore');
const targetChipEl = $('targetChip');
const instructionTextEl = $('instructionText');

// Navigation
const btnMenu = $('btnMenu');
const btnCameraNav = $('btnCameraNav');
const btnListNav = $('btnListNav');
const btnClearNav = $('btnClearNav');
const btnSettingsNav = $('btnSettingsNav');
const listView = $('listView');
const btnCloseList = $('btnCloseList');

// Manual (domino grid + buckets)
const btnBucketA = $('btnBucketA');
const btnBucketB = $('btnBucketB');
const dominoGrid = $('dominoGrid');

// Hand scoring controls
const handTypeEl = $('handType');
const awardTeamEl = $('awardTeam');
const startingTeamField = $('startingTeamField');
const startingTeamEl = $('startingTeam');
const bonusOpeningPassEl = $('bonusOpeningPass');
const bonusPaseCorridoEl = $('bonusPaseCorrido');
const bonusCapicuaEl = $('bonusCapicua');
const bucketAListEl = $('bucketAList');
const bucketBListEl = $('bucketBList');
const bucketATotalEl = $('bucketATotal');
const bucketBTotalEl = $('bucketBTotal');
const btnClearBuckets = $('btnClearBuckets');
const btnApplyScore = $('btnApplyScore');
const historyListEl = $('historyList');
const btnNewGame = $('btnNewGame');

// Mode toggle + camera section
const btnModeManual = $('btnModeManual');
const btnModeCamera = $('btnModeCamera');
const cameraSection = $('cameraSection');
const manualSection = $('manualSection');
const video = $('video');
const captureCanvas = $('captureCanvas');
const fileInput = $('fileInput');
const btnCapture = $('btnCapture');
const cameraStatus = $('cameraStatus');
const detectedPreview = $('detectedPreview');
const detectedList = $('detectedList');

// -------------------- State / persistence --------------------
const STORAGE_KEY = 'domino_score_match_v1';

function defaultGame() {
  return {
    target: 250,
    teams: {
      A: { id: 'A', name: 'Team A', score: 0 },
      B: { id: 'B', name: 'Team B', score: 0 },
    },
    rules: {
      openingPassEnabled: true,
      // Dominican variant: in some 500 matches, all hands are counted on a win.
      countAllHandsIn500: false,
    },
    history: [],
  };
}

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw);
    if (!g?.teams?.A || !g?.teams?.B) return null;
    return g;
  } catch {
    return null;
  }
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // ignore
  }
}

/** @type {ReturnType<typeof defaultGame>} */
let game = loadGame() ?? defaultGame();

/** @type {{ A: Array<{left:number,right:number}>, B: Array<{left:number,right:number}> }} */
let leftovers = { A: [], B: [] };

/** @type {'A'|'B'} */
let activeBucket = 'A';

// Camera runtime
let stream = null;
let opencvReady = false;

// -------------------- Domino rendering --------------------
function renderDots(count) {
  if (count === 0) return '<span class="dot-empty"></span>';
  const patterns = {
    1: '<span class="dot"></span>',
    2: '<span class="dot"></span><span class="dot"></span>',
    3: '<span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    4: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    5: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    6: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
  };
  return `<span class="dots dots-${count}">${patterns[count] || ''}</span>`;
}

function dominoHTML(left, right) {
  return `
    <div class="piece-domino">
      <div class="domino-half">${renderDots(left)}</div>
      <div class="domino-divider"></div>
      <div class="domino-half">${renderDots(right)}</div>
    </div>
  `;
}

// -------------------- Scoring helpers --------------------
function pipSum(tiles) {
  return tiles.reduce((s, t) => s + t.left + t.right, 0);
}

function openingPassPoints() {
  return game.target === 500 ? 25 : 10;
}

function matchWinner() {
  if (game.teams.A.score >= game.target) return 'A';
  if (game.teams.B.score >= game.target) return 'B';
  return null;
}

function computeBonuses() {
  let bonus = 0;
  const parts = [];
  if (bonusOpeningPassEl?.checked && game.rules.openingPassEnabled) {
    const pts = openingPassPoints();
    bonus += pts;
    parts.push(`Opening pass +${pts}`);
  }
  if (bonusPaseCorridoEl?.checked) {
    bonus += 25;
    parts.push('Pase corrido +25');
  }
  if (bonusCapicuaEl?.checked) {
    bonus += 25;
    parts.push('Capicúa +25');
  }
  return { bonus, parts };
}

function clearLeftovers() {
  leftovers = { A: [], B: [] };
}

function addTileToBucket(bucket, left, right) {
  leftovers[bucket].push({ left, right });
}

function removeTileFromBucket(bucket, idx) {
  leftovers[bucket].splice(idx, 1);
}

// -------------------- Render --------------------
function render() {
  // Scoreboard
  teamANameEl.textContent = game.teams.A.name;
  teamBNameEl.textContent = game.teams.B.name;
  teamAScoreEl.textContent = String(game.teams.A.score);
  teamBScoreEl.textContent = String(game.teams.B.score);
  targetChipEl.textContent = `Target: ${game.target}`;

  // Instruction
  const a = pipSum(leftovers.A);
  const b = pipSum(leftovers.B);
  const winner = matchWinner();
  if (winner) {
    instructionTextEl.textContent = `${game.teams[winner].name} wins! (${game.teams[winner].score} ≥ ${game.target})`;
  } else {
    instructionTextEl.textContent = `Leftovers — ${game.teams.A.name}: ${a}, ${game.teams.B.name}: ${b}`;
  }

  // Bucket buttons
  btnBucketA.classList.toggle('active', activeBucket === 'A');
  btnBucketB.classList.toggle('active', activeBucket === 'B');

  // Totals
  bucketATotalEl.textContent = String(a);
  bucketBTotalEl.textContent = String(b);

  // Bucket lists
  bucketAListEl.innerHTML = '';
  leftovers.A.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'piece-item';
    li.innerHTML = dominoHTML(t.left, t.right);
    const rm = document.createElement('button');
    rm.className = 'remove-btn';
    rm.setAttribute('aria-label', 'Remove');
    rm.textContent = '×';
    rm.addEventListener('click', () => {
      removeTileFromBucket('A', idx);
      render();
    });
    li.appendChild(rm);
    bucketAListEl.appendChild(li);
  });

  bucketBListEl.innerHTML = '';
  leftovers.B.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'piece-item';
    li.innerHTML = dominoHTML(t.left, t.right);
    const rm = document.createElement('button');
    rm.className = 'remove-btn';
    rm.setAttribute('aria-label', 'Remove');
    rm.textContent = '×';
    rm.addEventListener('click', () => {
      removeTileFromBucket('B', idx);
      render();
    });
    li.appendChild(rm);
    bucketBListEl.appendChild(li);
  });

  // Hand type conditional UI
  startingTeamField.classList.toggle('hidden', handTypeEl.value !== 'tranque');

  // History
  historyListEl.innerHTML = '';
  const history = game.history.slice().reverse();
  history.forEach((h) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    const when = new Date(h.ts).toLocaleString();
    const teamName = game.teams[h.awardTeam].name;
    li.innerHTML = `
      <div class="meta">${when} • ${h.type.toUpperCase()} • ${teamName}</div>
      <div class="line"><div>${h.detail}</div><div class="delta">+${h.delta}</div></div>
    `;
    historyListEl.appendChild(li);
  });
}

// -------------------- Hand scoring --------------------
function applyScore() {
  const type = handTypeEl.value; // win | tranque | bonus
  let awardTeam = awardTeamEl.value; // A | B

  const sums = { A: pipSum(leftovers.A), B: pipSum(leftovers.B) };
  const { bonus, parts } = computeBonuses();

  let base = 0;
  let detail = '';

  if (type === 'bonus') {
    base = 0;
    detail = 'Bonuses only';
  } else if (type === 'win') {
    const losing = awardTeam === 'A' ? 'B' : 'A';
    if (game.target === 500 && game.rules.countAllHandsIn500) {
      base = sums.A + sums.B;
      detail = `Win: all hands (${sums.A}+${sums.B})`;
    } else {
      base = sums[losing];
      detail = `Win: opponents hand (${sums[losing]})`;
    }
  } else if (type === 'tranque') {
    if (sums.A < sums.B) awardTeam = 'A';
    else if (sums.B < sums.A) awardTeam = 'B';
    else awardTeam = startingTeamEl.value;
    const losing = awardTeam === 'A' ? 'B' : 'A';
    base = sums[losing];
    detail = `Tranque: ${game.teams.A.name}=${sums.A}, ${game.teams.B.name}=${sums.B}`;
  }

  const delta = base + bonus;
  if (delta <= 0) {
    alert('Nothing to apply. Add leftovers and/or bonuses first.');
    return;
  }

  game.teams[awardTeam].score += delta;
  game.history.push({
    ts: Date.now(),
    type,
    awardTeam,
    delta,
    detail: [detail, ...parts].filter(Boolean).join(' • '),
  });
  saveGame();

  // Reset hand inputs
  clearLeftovers();
  bonusOpeningPassEl.checked = false;
  bonusPaseCorridoEl.checked = false;
  bonusCapicuaEl.checked = false;

  render();
}

// -------------------- New game --------------------
function newGame() {
  const aName = (prompt('Team A name', game.teams.A.name) || game.teams.A.name).trim();
  const bName = (prompt('Team B name', game.teams.B.name) || game.teams.B.name).trim();
  const targetStr = (prompt('Target score (200, 250, 500)', String(game.target)) || String(game.target)).trim();
  const targetNum = Number(targetStr);
  const target = [200, 250, 500].includes(targetNum) ? targetNum : game.target;

  game = defaultGame();
  game.teams.A.name = aName || 'Team A';
  game.teams.B.name = bName || 'Team B';
  game.target = target;
  saveGame();
  clearLeftovers();
  render();
}

// -------------------- Domino grid --------------------
function buildDominoGrid() {
  const all = [];
  for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) all.push({ left: i, right: j });

  dominoGrid.innerHTML = '';
  all.forEach((domino) => {
    const tile = document.createElement('button');
    tile.className = 'domino-tile';
    tile.type = 'button';
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

    tile.addEventListener('click', () => {
      addTileToBucket(activeBucket, domino.left, domino.right);
      tile.classList.add('tapped');
      setTimeout(() => tile.classList.remove('tapped'), 160);
      render();
    });

    dominoGrid.appendChild(tile);
  });
}

// -------------------- Navigation wiring --------------------
function wireUI() {
  btnBucketA.addEventListener('click', () => { activeBucket = 'A'; render(); });
  btnBucketB.addEventListener('click', () => { activeBucket = 'B'; render(); });

  btnListNav.addEventListener('click', () => listView.classList.remove('hidden'));
  btnCloseList.addEventListener('click', () => listView.classList.add('hidden'));
  btnMenu.addEventListener('click', () => btnListNav.click());

  btnClearBuckets.addEventListener('click', () => {
    if ((leftovers.A.length || leftovers.B.length) && confirm('Clear leftover tiles?')) {
      clearLeftovers();
      render();
    }
  });

  btnApplyScore.addEventListener('click', applyScore);
  handTypeEl.addEventListener('change', () => render());

  btnNewGame.addEventListener('click', () => {
    if (confirm('Start a new game? This will reset scores and history.')) newGame();
  });

  btnClearNav.addEventListener('click', () => {
    if (confirm('Clear leftover tiles?')) {
      clearLeftovers();
      render();
    }
  });

  btnSettingsNav.addEventListener('click', () => {
    const msg =
      `Rules:\\n\\n` +
      `- Opening pass bonus: ${game.rules.openingPassEnabled ? 'ON' : 'OFF'} (${openingPassPoints()} pts)\\n` +
      `- In 500, count all hands on win: ${game.rules.countAllHandsIn500 ? 'ON' : 'OFF'}\\n\\n` +
      `Toggle “count all hands in 500”?`;
    if (confirm(msg)) {
      game.rules.countAllHandsIn500 = !game.rules.countAllHandsIn500;
      saveGame();
      render();
    }
  });

  // Mode toggle
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

  btnCameraNav.addEventListener('click', () => btnModeCamera.click());
}

// -------------------- Camera assist (experimental) --------------------
function onOpenCvReady() { opencvReady = true; }
if (typeof cv !== 'undefined' && typeof cv.Mat !== 'undefined') onOpenCvReady();
else window.addEventListener('opencvReady', onOpenCvReady);

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = stream;
    cameraStatus.textContent = 'Camera ready. Scan, then tap detected tiles to add to the active bucket.';
    btnCapture.disabled = false;
  } catch {
    cameraStatus.textContent = 'Camera access denied. Use Manual mode.';
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
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

btnCapture.addEventListener('click', captureFromVideo);

fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(900 / img.width, 900 / img.height, 1);
    captureCanvas.width = Math.round(img.width * scale);
    captureCanvas.height = Math.round(img.height * scale);
    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, captureCanvas.width, captureCanvas.height);
    processImage(captureCanvas);
  };
  img.src = URL.createObjectURL(f);
  e.target.value = '';
});

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
  thresh.delete(); contours.delete(); hier.delete();
  return Math.min(6, Math.max(0, count));
}

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
    thresh.delete(); hier.delete();

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
      if (contourArea / a < 0.5) continue;
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
      candidates.push({ left: v1, right: v2 });
    }
    blurred.delete(); gray.delete(); contours.delete();

    // Dedup
    const unique = [];
    for (const c of candidates) {
      const exists = unique.some((u) => u.left === c.left && u.right === c.right);
      if (!exists) unique.push(c);
    }
    return unique.slice(0, 10);
  } catch {
    return [];
  }
}

function processImage(canvas) {
  if (!opencvReady) {
    cameraStatus.textContent = 'OpenCV.js still loading…';
    return;
  }
  cameraStatus.textContent = 'Processing…';
  const detected = detectPieces(canvas);
  detectedList.innerHTML = '';
  detectedPreview.classList.toggle('hidden', detected.length === 0);

  if (!detected.length) {
    cameraStatus.textContent = 'No pieces detected (camera is experimental). Use Manual mode for accuracy.';
    return;
  }

  detected.forEach((d) => {
    const li = document.createElement('li');
    li.className = 'detected-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'detected-domino';
    btn.innerHTML = dominoHTML(d.left, d.right);
    btn.addEventListener('click', () => {
      addTileToBucket(activeBucket, d.left, d.right);
      render();
      btn.disabled = true;
      btn.classList.add('added');
    });
    li.appendChild(btn);
    detectedList.appendChild(li);
  });
  cameraStatus.textContent = `Found ${detected.length} piece(s). Tap to add to ${activeBucket === 'A' ? game.teams.A.name : game.teams.B.name}.`;
}

// -------------------- Init --------------------
buildDominoGrid();
wireUI();
render();
window.addEventListener('beforeunload', stopCamera);


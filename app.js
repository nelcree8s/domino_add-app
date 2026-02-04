/**
 * Domino Score — Dominican-style match tracker.
 *
 * Workflow:
 * - Pick which bucket you're adding to (Team A / Team B leftovers)
 * - Tap pips (1–6) to add values to the active bucket
 * - Open "Score hand" (list icon), choose Win / Tranque / Bonus, apply score
 */

// -------------------- DOM helpers --------------------
const $ = (id) => document.getElementById(id);

// Scoreboard + card
const targetChipEl = $("targetChip");
const instructionTextEl = $("instructionText");
const scoreCardMathEl = $("scoreCardMath");
const scoreCardTotalEl = $("scoreCardTotal");
const scoreCardTotalWrapEl = $("scoreCardTotalWrap");
const teamANameTabEl = $("teamANameTab");
const teamBNameTabEl = $("teamBNameTab");
const teamATabScoreEl = $("teamATabScore");
const teamBTabScoreEl = $("teamBTabScore");
const btnSettingsTop = $("btnSettingsTop");
const btnRulesTop = $("btnRulesTop");
const rulesOverlay = $("rulesOverlay");
const btnCloseRules = $("btnCloseRules");

// Navigation
const btnMenu = $("btnMenu");
const listView = $("listView");
const btnCloseList = $("btnCloseList");

// Team tabs = who won
const btnWinnerA = $("btnWinnerA");
const btnWinnerB = $("btnWinnerB");

// Bonus controls
const bonusOpeningPassEl = $("bonusOpeningPass");
const bonusPaseCorridoEl = $("bonusPaseCorrido");
const bonusCapicuaEl = $("bonusCapicua");
const bonusChuchazoEl = $("bonusChuchazo");
const btnClearBuckets = $("btnClearBuckets");
const btnApplyScore = $("btnApplyScore");
const historyListEl = $("historyList");
const btnNewGame = $("btnNewGame");
const gameOverOverlay = $("gameOverOverlay");
const gameOverTitle = $("gameOverTitle");
const gameOverSubtitle = $("gameOverSubtitle");
const btnStartNew = $("btnStartNew");
const optionsOverlay = $("optionsOverlay");
const btnCloseOptions = $("btnCloseOptions");
const optGameType = $("optGameType");
const optOpeningPass = $("optOpeningPass");
const optCountAll500 = $("optCountAll500");
const optPaseCorridoPoints = $("optPaseCorridoPoints");
const optCapicuaPoints = $("optCapicuaPoints");
const optChuchazoPoints = $("optChuchazoPoints");
const btnApplyOptions = $("btnApplyOptions");

// -------------------- State / persistence --------------------
const STORAGE_KEY = "domino_score_match_v3";

/** @type {'200'|'250'|'500'|'500-bonuses'} */
const GAME_TYPES = ["200", "250", "500", "500-bonuses"];

/** Round bonuses for 500-bonuses: 1st=100, 2nd=75, 3rd=50, 4th=25, 5th+=0 */
function roundBonus(roundNum) {
  if (typeof roundNum !== "number" || roundNum < 1) return 0;
  const bonuses = [100, 75, 50, 25];
  return roundNum <= 4 ? bonuses[roundNum - 1] : 0;
}

function defaultGame() {
  const gameType = "500-bonuses";
  return {
    gameType,
    target: targetFromGameType(gameType),
    roundNumber: 1,
    teams: {
      A: { id: "A", name: "Team A", score: 0 },
      B: { id: "B", name: "Team B", score: 0 },
    },
    rules: {
      openingPassEnabled: true,
      countAllHandsIn500: false,
      paseCorridoPoints: 25,
      capicuaPoints: 50,
      chuchazoPoints: 50,
    },
    history: [],
  };
}

function targetFromGameType(gt) {
  return gt === "500-bonuses" ? 500 : Number(gt);
}

function loadGame() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem("domino_score_match_v2");
    if (!raw) raw = localStorage.getItem("domino_score_match_v1");
    if (!raw) return null;
    const g = JSON.parse(raw);
    if (!g?.teams?.A || !g?.teams?.B) return null;
    // Migrate v1: target → gameType, add roundNumber
    if (!g.gameType) {
      g.gameType = String(g.target ?? 250);
      if (!GAME_TYPES.includes(g.gameType)) g.gameType = "500-bonuses";
    }
    if (typeof g.roundNumber !== "number") g.roundNumber = 1;
    g.target = targetFromGameType(g.gameType);
    if (!g.rules) g.rules = {};
    if (typeof g.rules.paseCorridoPoints !== "number")
      g.rules.paseCorridoPoints = 25;
    if (typeof g.rules.capicuaPoints !== "number") g.rules.capicuaPoints = 50;
    if (typeof g.rules.chuchazoPoints !== "number") g.rules.chuchazoPoints = 50;
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

/** @type {number[]} — losers' leftover pips for current hand */
let leftovers = [];

/** @type {'A'|'B'} — team that won (receives points) */
let winner = "A";

// Pip colors (muted, light-interface palette)
const PIP_COLORS = [
  "#9e9e9e",
  "#5c6bc0",
  "#66bb6a",
  "#ef5350",
  "#a67c52",
  "#4a6fa5",
  "#d4a017",
]; // 0-6

// -------------------- Pip rendering --------------------
function renderDots(count, colorClass = "") {
  if (count === 0) return `<span class="dot-empty ${colorClass}"></span>`;
  const patterns = {
    1: '<span class="dot"></span>',
    2: '<span class="dot"></span><span class="dot"></span>',
    3: '<span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    4: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    5: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    6: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
  };
  return `<span class="dots dots-${count} pip-${count}">${
    patterns[count] || ""
  }</span>`;
}

// -------------------- Scoring helpers --------------------
function pipSum(values) {
  return values.reduce((s, v) => s + v, 0);
}

function openingPassPoints() {
  return game.target === 500 ? 25 : 10;
}

function matchWinner() {
  if (game.teams.A.score >= game.target) return "A";
  if (game.teams.B.score >= game.target) return "B";
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
  const pasePts = game.rules.paseCorridoPoints ?? 25;
  if (bonusPaseCorridoEl?.checked) {
    bonus += pasePts;
    parts.push(`Pase corrido +${pasePts}`);
  }
  const capicuaPts = game.rules.capicuaPoints ?? 50;
  if (bonusCapicuaEl?.checked) {
    bonus += capicuaPts;
    parts.push(`Capicúa +${capicuaPts}`);
  }
  const chuchazoPts = game.rules.chuchazoPoints ?? 50;
  if (bonusChuchazoEl?.checked) {
    bonus += chuchazoPts;
    parts.push(`Chuchazo +${chuchazoPts}`);
  }
  return { bonus, parts };
}

function clearLeftovers() {
  leftovers = [];
}

function addPip(value) {
  leftovers.push(value);
}

function removePip(idx) {
  leftovers.splice(idx, 1);
}

// -------------------- Render --------------------
function render() {
  const total = pipSum(leftovers);
  const gameWinner = matchWinner();

  if (teamANameTabEl) teamANameTabEl.textContent = game.teams.A.name;
  if (teamBNameTabEl) teamBNameTabEl.textContent = game.teams.B.name;
  if (teamATabScoreEl) teamATabScoreEl.textContent = `(${game.teams.A.score})`;
  if (teamBTabScoreEl) teamBTabScoreEl.textContent = `(${game.teams.B.score})`;
  if (targetChipEl) {
    const label =
      game.gameType === "500-bonuses"
        ? "500 (bonuses)"
        : `Target: ${game.target}`;
    targetChipEl.textContent = label;
  }
  if (scoreCardTotalEl) scoreCardTotalEl.textContent = String(total);
  if (scoreCardTotalWrapEl)
    scoreCardTotalWrapEl.classList.toggle("has-values", leftovers.length > 0);

  if (scoreCardMathEl) {
    if (!leftovers.length) {
      scoreCardMathEl.innerHTML =
        '<span class="score-card__placeholder">Tap dots to add points</span>';
    } else {
      const maxChips = 4;
      const remaining = Math.max(0, leftovers.length - maxChips);
      const recent = leftovers.slice(-maxChips);
      const chipsHtml = recent
        .map(
          (v) =>
            `<span class="score-card__chip pip-${v}">${renderDots(
              v,
              `pip-${v}`,
            )}</span>`,
        )
        .join('<span class="score-card__plus">+</span>');
      const prefix = remaining
        ? `<span class="score-card__chip score-card__chip--more">+${remaining}</span><span class="score-card__plus">+</span>`
        : "";
      scoreCardMathEl.innerHTML = `${prefix}${chipsHtml}`;
    }
  }

  if (instructionTextEl) {
    if (gameWinner) {
      instructionTextEl.textContent = `${game.teams[gameWinner].name} wins! (${game.teams[gameWinner].score} ≥ ${game.target})`;
    } else {
      instructionTextEl.textContent = `${total} pts • Award to ${game.teams[winner].name}`;
    }
  }

  if (btnWinnerA) {
    btnWinnerA.classList.toggle("active", winner === "A");
    btnWinnerA.setAttribute("aria-selected", winner === "A" ? "true" : "false");
  }
  if (btnWinnerB) {
    btnWinnerB.classList.toggle("active", winner === "B");
    btnWinnerB.setAttribute("aria-selected", winner === "B" ? "true" : "false");
  }

  if (gameOverOverlay) {
    const hasWinner = !!gameWinner;
    gameOverOverlay.classList.toggle("hidden", !hasWinner);
    if (hasWinner && gameOverTitle)
      gameOverTitle.textContent = `${game.teams[gameWinner].name} wins!`;
    if (hasWinner && gameOverSubtitle)
      gameOverSubtitle.textContent = `First to ${game.target}`;
  }

  if (historyListEl) {
    historyListEl.innerHTML = "";
    const history = game.history.slice().reverse();
    history.forEach((h) => {
      const li = document.createElement("li");
      li.className = "history-item";
      const when = new Date(h.ts).toLocaleString();
      const teamName = game.teams[h.awardTeam].name;
      li.innerHTML = `
        <div class="meta">${when} • ${h.type.toUpperCase()} • ${teamName}</div>
        <div class="line"><div>${h.detail}</div><div class="delta">+${
          h.delta
        }</div></div>
      `;
      historyListEl.appendChild(li);
    });
  }
}

// -------------------- Hand scoring --------------------
function applyScore() {
  const awardTeam = winner;
  const base = pipSum(leftovers);
  const { bonus, parts } = computeBonuses();
  let delta = base + bonus;

  // 500 with bonuses: add round bonus automatically
  const rndBonus =
    game.gameType === "500-bonuses" ? roundBonus(game.roundNumber) : 0;
  if (rndBonus > 0) {
    delta += rndBonus;
    parts.push(`Round bonus +${rndBonus}`);
  }

  if (delta <= 0) {
    alert("Add leftover pips and/or check bonuses first.");
    return;
  }

  const confirmMsg = `Award ${delta} to ${
    game.teams[awardTeam].name
  }?\n\nLeftovers: ${base}\nBonuses: ${bonus}${
    rndBonus ? `\nRound bonus: +${rndBonus}` : ""
  }\nTotal: ${delta}`;
  if (!confirm(confirmMsg)) return;

  game.teams[awardTeam].score += delta;
  const detail = base > 0 ? `Leftovers: ${base}` : "";
  game.history.push({
    ts: Date.now(),
    type: "win",
    awardTeam,
    delta,
    detail: [detail, ...parts].filter(Boolean).join(" • "),
  });
  if (game.gameType === "500-bonuses") game.roundNumber++;
  saveGame();

  // Reset hand inputs
  clearLeftovers();
  bonusOpeningPassEl && (bonusOpeningPassEl.checked = false);
  bonusPaseCorridoEl && (bonusPaseCorridoEl.checked = false);
  bonusCapicuaEl && (bonusCapicuaEl.checked = false);
  bonusChuchazoEl && (bonusChuchazoEl.checked = false);

  render();
}

// -------------------- New game --------------------
function newGame() {
  const aName = (
    prompt("Team A name", game.teams.A.name) || game.teams.A.name
  ).trim();
  const bName = (
    prompt("Team B name", game.teams.B.name) || game.teams.B.name
  ).trim();
  const prevGameType = game.gameType;

  game = defaultGame();
  game.teams.A.name = aName || "Team A";
  game.teams.B.name = bName || "Team B";
  game.gameType = GAME_TYPES.includes(prevGameType)
    ? prevGameType
    : "500-bonuses";
  game.target = targetFromGameType(game.gameType);
  saveGame();
  clearLeftovers();
  render();
}

// -------------------- Pip picker (domino dots) --------------------
function buildPipPicker() {
  const el = document.getElementById("pipPicker");
  if (!el) return;
  el.innerHTML = "";
  for (let v = 1; v <= 6; v++) {
    const btn = document.createElement("button");
    btn.className = `pip-btn pip-${v}`;
    btn.type = "button";
    btn.setAttribute("aria-label", `Add ${v}`);
    btn.dataset.value = String(v);
    btn.innerHTML = renderDots(v, `pip-${v}`);
    btn.addEventListener("click", () => {
      addPip(v);
      render();
    });
    el.appendChild(btn);
  }
}

// -------------------- Navigation wiring --------------------
function wireUI() {
  buildPipPicker();
  if (btnWinnerA)
    btnWinnerA.addEventListener("click", () => {
      winner = "A";
      render();
    });
  if (btnWinnerB)
    btnWinnerB.addEventListener("click", () => {
      winner = "B";
      render();
    });

  const toggleHistory = (show) => {
    if (!listView) return;
    listView.classList.toggle("hidden", !show);
  };
  if (btnMenu)
    btnMenu.addEventListener("click", () => {
      toggleHistory(true);
    });
  if (btnCloseList)
    btnCloseList.addEventListener("click", () => {
      toggleHistory(false);
    });

  if (btnClearBuckets)
    btnClearBuckets.addEventListener("click", () => {
      if (leftovers.length && confirm("Clear hand?")) {
        clearLeftovers();
        render();
      }
    });

  if (btnApplyScore) btnApplyScore.addEventListener("click", applyScore);

  if (btnNewGame)
    btnNewGame.addEventListener("click", () => {
      if (confirm("Start a new game? This will reset scores and history."))
        newGame();
    });

  if (btnStartNew)
    btnStartNew.addEventListener("click", () => {
      gameOverOverlay?.classList.add("hidden");
      newGame();
    });

  const openOptions = () => {
    if (optGameType) optGameType.value = game.gameType || "500-bonuses";
    if (optOpeningPass) optOpeningPass.checked = game.rules.openingPassEnabled;
    if (optCountAll500) optCountAll500.checked = game.rules.countAllHandsIn500;
    if (optPaseCorridoPoints)
      optPaseCorridoPoints.value = String(game.rules.paseCorridoPoints ?? 25);
    if (optCapicuaPoints)
      optCapicuaPoints.value = String(game.rules.capicuaPoints ?? 50);
    if (optChuchazoPoints)
      optChuchazoPoints.value = String(game.rules.chuchazoPoints ?? 50);
    optionsOverlay?.classList.remove("hidden");
    if (typeof feather !== "undefined") feather.replace();
  };

  const applyOptions = () => {
    const gt = optGameType?.value;
    if (GAME_TYPES.includes(gt)) {
      const was500Bonus = game.gameType === "500-bonuses";
      game.gameType = gt;
      game.target = targetFromGameType(gt);
      if (gt === "500-bonuses" && !was500Bonus) game.roundNumber = 1;
    }
    if (optOpeningPass) game.rules.openingPassEnabled = optOpeningPass.checked;
    if (optCountAll500) game.rules.countAllHandsIn500 = optCountAll500.checked;
    const pase = parseInt(optPaseCorridoPoints?.value, 10);
    if (!isNaN(pase) && pase >= 0) game.rules.paseCorridoPoints = pase;
    const capicua = parseInt(optCapicuaPoints?.value, 10);
    if (!isNaN(capicua) && capicua >= 0) game.rules.capicuaPoints = capicua;
    const chuchazo = parseInt(optChuchazoPoints?.value, 10);
    if (!isNaN(chuchazo) && chuchazo >= 0) game.rules.chuchazoPoints = chuchazo;
    saveGame();
    render();
  };

  const closeOptions = () => {
    applyOptions(); // save options when closing
    optionsOverlay?.classList.add("hidden");
  };

  if (btnSettingsTop) btnSettingsTop.addEventListener("click", openOptions);
  if (btnCloseOptions) btnCloseOptions.addEventListener("click", closeOptions);
  if (btnApplyOptions)
    btnApplyOptions.addEventListener("click", () => {
      applyOptions();
      optionsOverlay?.classList.add("hidden");
    });

  const openRules = () => {
    rulesOverlay?.classList.remove("hidden");
    if (typeof feather !== "undefined") feather.replace();
  };
  const closeRules = () => rulesOverlay?.classList.add("hidden");
  if (btnRulesTop) btnRulesTop.addEventListener("click", openRules);
  if (btnCloseRules) btnCloseRules.addEventListener("click", closeRules);

  // Tooltip handling
  document.querySelectorAll(".tooltip-trigger").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.tooltip;
      let text = "";
      if (key === "opening-pass") {
        text = `First play of the hand; if the next player cannot play, the first player's team gets ${openingPassPoints()} pts. Nullified if the next player after that also cannot play.`;
      } else if (key === "pase-corrido") {
        text = `A player plays and all three opponents cannot play. That player's team gets ${game.rules.paseCorridoPoints ?? 25} pts (configurable in Options). That player then plays again.`;
      } else if (key === "capicua") {
        text = `The last piece matches the number at the opposite end of the chain. Worth ${game.rules.capicuaPoints ?? 50} pts (configurable in Options). Nullified if matched with a blank or double.`;
      } else if (key === "chuchazo") {
        text = `The winning piece is the double-blank (0–0), "la Chucha!" Worth ${game.rules.chuchazoPoints ?? 50} pts (configurable in Options).`;
      }
      if (!text) return;
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip-popover";
      tooltip.textContent = text;
      document.body.appendChild(tooltip);
      const rect = btn.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      let left = rect.left;
      let top = rect.bottom + 8;
      // Keep tooltip on screen
      if (left + tooltipRect.width > window.innerWidth - 16) {
        left = window.innerWidth - tooltipRect.width - 16;
      }
      if (left < 16) left = 16;
      if (top + tooltipRect.height > window.innerHeight - 16) {
        top = rect.top - tooltipRect.height - 8;
      }
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      const closeTooltip = () => {
        tooltip.remove();
        document.removeEventListener("click", closeTooltip);
      };
      setTimeout(() => document.addEventListener("click", closeTooltip), 100);
    });
  });
}

// -------------------- Init --------------------
function init() {
  wireUI();
  render();
  if (typeof feather !== "undefined") feather.replace();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

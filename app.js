/**
 * Domino Score — Dominican-style match tracker.
 *
 * Workflow:
 * - Pick which bucket you're adding to (Team A / Team B leftovers)
 * - Tap pips (1–6) to add values to the active bucket
 * - Open "Score hand" (list icon), choose Win / Tranque / Bonus, apply score
 */

// -------------------- i18n --------------------
const STRINGS = {
  en: {
    title: "Domino Score",
    ariaHistory: "History",
    ariaRules: "Rules",
    ariaSettings: "Settings",
    ariaClose: "Close",
    targetLabel: "Target: {target}",
    target500Bonuses: "500 (bonuses)",
    tapDotsToAddPoints: "Tap dots to add points",
    tapDotsThenApply: "Tap dots to add points, then apply",
    teamA: "Team A",
    teamB: "Team B",
    bonusOpeningPass: "Pase primera mano (opening pass)",
    bonusPaseCorrido: "Pase corrido (skipping everyone)",
    bonusCapicua: "Capicúa (matching ends)",
    bonusChuchazo: "Chuchazo (double-blank)",
    ariaWhatIsThis: "What is this?",
    clearHand: "Clear hand",
    applyScore: "Apply score",
    instructionAwardTo: "{total} pts • Award to {name}",
    instructionWins: "{name} wins! ({score} ≥ {target})",
    gameOverWins: "{name} wins!",
    gameOverFirstTo: "First to {target}",
    startNewGame: "Start new game",
    recentHands: "Recent hands",
    history: "History",
    newGame: "New game",
    options: "Options",
    game: "Game",
    gameType: "Game type",
    gameType200: "200",
    gameType250: "250",
    gameType500: "500",
    gameType500Bonuses: "500 with bonuses",
    rules: "Rules",
    openingPassBonus: "Opening pass bonus",
    countAll500: "In 500, count all hands on win",
    bonusPoints: "Bonus points",
    paseCorridoPts: "Pase corrido (pts)",
    capicuaPts: "Capicúa (pts)",
    chuchazoPts: "Chuchazo / double-blank (pts)",
    apply: "Apply",
    addPip: "Add {v}",
    clearHandConfirm: "Clear hand?",
    alertAddPips: "Add leftover pips and/or check bonuses first.",
    confirmAward: "Award {delta} to {name}?\n\nLeftovers: {base}\nBonuses: {bonus}{roundBonus}\nTotal: {delta}",
    confirmNewGame: "Start a new game? This will reset scores and history.",
    teamAPrompt: "Team A name",
    teamBPrompt: "Team B name",
    tooltipOpeningPass: "First play of the hand; if the next player cannot play, the first player's team gets {pts} pts. Nullified if the next player after that also cannot play.",
    tooltipPaseCorrido: "A player plays and all three opponents cannot play. That player's team gets {pts} pts (configurable in Options). That player then plays again.",
    tooltipCapicua: "The last piece matches the number at the opposite end of the chain. Worth {pts} pts (configurable in Options). Nullified if matched with a blank or double.",
    tooltipChuchazo: "The winning piece is the double-blank (0–0), \"la Chucha!\" Worth {pts} pts (configurable in Options).",
    rulesHowYouScore: "How you score points",
    rulesWinningHand: "1. Winning the hand (leftover pieces)",
    rulesWinningHandP: "When a player gets rid of all their pieces, their team wins. Add up the dots on all pieces not played. That total goes to the winning team's score.",
    rulesPasePrimera: "2. Pase primera mano (opening pass)",
    rulesPasePrimeraP: "Only on the very first play of the hand. If the next player cannot play, the first player's team gets 10 (200/250) or 25 (500). Nullified if the next player after that also cannot play.",
    rulesPaseCorrido: "3. Pase corrido (skipping everyone)",
    rulesPaseCorridoP: "A player plays and all three opponents cannot play. That player's team gets 25 pts (default; configurable). That player then plays again.",
    rulesCapicua: "4. Capicúa (matching ends)",
    rulesCapicuaP: "The last piece matches the number at the opposite end of the chain. Worth 50 pts (default; configurable). Nullified if matched with a blank or double.",
    rulesChuchazo: "5. Chuchazo (double-blank)",
    rulesChuchazoP: "The winning piece is the double-blank (0–0), \"la Chucha!\" Worth 50 pts (default; configurable).",
    rulesTranque: "6. Tranque (lock)",
    rulesTranqueP: "No one can play. Compare hands; lowest total wins and gets opponents' leftover points. Tie goes to the player who started the hand.",
    rulesGameTypes: "Game types",
    rulesGameTypesP1: "200, 250, 500: First to reach target score.",
    rulesGameTypesP2: "500 with bonuses: Same as 500, plus round bonuses: 1st hand +100, 2nd +75, 3rd +50, 4th +25.",
    openingPassPlus: "Opening pass +{pts}",
    paseCorridoPlus: "Pase corrido +{pts}",
    capicuaPlus: "Capicúa +{pts}",
    chuchazoPlus: "Chuchazo +{pts}",
    roundBonusLine: "\nRound bonus: +{pts}",
    leftOverLabel: "Leftovers: {base}",
    matchScore: "Match score",
    moveToTeam: "Move to {name}",
  },
  es: {
    title: "Domino Puntos",
    ariaHistory: "Historial",
    ariaRules: "Reglas",
    ariaSettings: "Ajustes",
    ariaClose: "Cerrar",
    targetLabel: "Meta: {target}",
    target500Bonuses: "500 con premios",
    tapDotsToAddPoints: "Toca los puntos para sumar",
    tapDotsThenApply: "Toca los puntos y luego aplica",
    teamA: "Equipo A",
    teamB: "Equipo B",
    bonusOpeningPass: "Pase primera mano",
    bonusPaseCorrido: "Pase corrido",
    bonusCapicua: "Capicúa",
    bonusChuchazo: "Chuchazo (doble blanco)",
    ariaWhatIsThis: "¿Qué es esto?",
    clearHand: "Borrar mano",
    applyScore: "Aplicar puntos",
    instructionAwardTo: "{total} pts • Para {name}",
    instructionWins: "¡{name} gana! ({score} ≥ {target})",
    gameOverWins: "¡{name} gana!",
    gameOverFirstTo: "Primero en llegar a {target}",
    startNewGame: "Nueva partida",
    recentHands: "Manos recientes",
    history: "Historial",
    newGame: "Nueva partida",
    options: "Opciones",
    game: "Partida",
    gameType: "Tipo de partida",
    gameType200: "200",
    gameType250: "250",
    gameType500: "500",
    gameType500Bonuses: "500 con premios",
    rules: "Reglas",
    openingPassBonus: "Premio pase primera mano",
    countAll500: "En 500, contar todas las manos al ganar",
    bonusPoints: "Puntos de premios",
    paseCorridoPts: "Pase corrido (pts)",
    capicuaPts: "Capicúa (pts)",
    chuchazoPts: "Chuchazo / doble blanco (pts)",
    apply: "Aplicar",
    addPip: "Añadir {v}",
    clearHandConfirm: "¿Borrar mano?",
    alertAddPips: "Añade puntos de fichas y/o marca los premios primero.",
    confirmAward: "¿Dar {delta} a {name}?\n\nFichas: {base}\nPremios: {bonus}{roundBonus}\nTotal: {delta}",
    confirmNewGame: "¿Empezar una partida nueva? Se reiniciarán los puntajes y el historial.",
    teamAPrompt: "Nombre del equipo A",
    teamBPrompt: "Nombre del equipo B",
    tooltipOpeningPass: "Primera jugada de la mano; si el siguiente no puede jugar, el equipo del primero recibe {pts} pts. Se anula si el siguiente tampoco puede jugar.",
    tooltipPaseCorrido: "Un jugador juega y los tres contrarios no pueden. Su equipo recibe {pts} pts (configurable en Opciones). Ese jugador vuelve a jugar.",
    tooltipCapicua: "La última ficha coincide con el número al otro extremo de la cadena. Vale {pts} pts (configurable en Opciones). Se anula si coincide con blanco o doble.",
    tooltipChuchazo: "La ficha ganadora es el doble blanco (0–0), \"¡la Chucha!\" Vale {pts} pts (configurable en Opciones).",
    rulesHowYouScore: "Cómo se suman puntos",
    rulesWinningHand: "1. Ganar la mano (fichas sobrantes)",
    rulesWinningHandP: "Cuando un jugador se queda sin fichas, su equipo gana. Suma los puntos de todas las fichas no jugadas. Ese total va al puntaje del equipo ganador.",
    rulesPasePrimera: "2. Pase primera mano",
    rulesPasePrimeraP: "Solo en la primera jugada de la mano. Si el siguiente no puede jugar, el equipo del primero recibe 10 (200/250) o 25 (500). Se anula si el siguiente tampoco puede jugar.",
    rulesPaseCorrido: "3. Pase corrido",
    rulesPaseCorridoP: "Un jugador juega y los tres contrarios no pueden. Su equipo recibe 25 pts (por defecto; configurable). Ese jugador vuelve a jugar.",
    rulesCapicua: "4. Capicúa",
    rulesCapicuaP: "La última ficha coincide con el número al otro extremo. Vale 50 pts (por defecto; configurable). Se anula si coincide con blanco o doble.",
    rulesChuchazo: "5. Chuchazo (doble blanco)",
    rulesChuchazoP: "La ficha ganadora es el doble blanco (0–0), \"¡la Chucha!\" Vale 50 pts (por defecto; configurable).",
    rulesTranque: "6. Tranque (bloqueo)",
    rulesTranqueP: "Nadie puede jugar. Se comparan manos; gana el menor total y recibe los puntos del rival. En empate gana quien empezó la mano.",
    rulesGameTypes: "Tipos de partida",
    rulesGameTypesP1: "200, 250, 500: El primero en llegar a la meta.",
    rulesGameTypesP2: "500 con premios: Igual que 500, más premios por ronda: 1.ª mano +100, 2.ª +75, 3.ª +50, 4.ª +25.",
    openingPassPlus: "Pase primera mano +{pts}",
    paseCorridoPlus: "Pase corrido +{pts}",
    capicuaPlus: "Capicúa +{pts}",
    chuchazoPlus: "Chuchazo +{pts}",
    roundBonusLine: "\nPremio de ronda: +{pts}",
    leftOverLabel: "Fichas: {base}",
    matchScore: "Puntaje",
    moveToTeam: "Pasar a {name}",
  },
};

function getLocale() {
  const lang = typeof navigator !== "undefined" && (navigator.language || (navigator.languages && navigator.languages[0]));
  const code = lang ? String(lang).toLowerCase().split("-")[0] : "en";
  return code === "es" ? "es" : "en";
}

const locale = getLocale();

function t(key, replacements = {}) {
  let s = (STRINGS[locale] && STRINGS[locale][key]) || (STRINGS.en && STRINGS.en[key]) || key;
  Object.keys(replacements).forEach((k) => {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(replacements[k]));
  });
  return s;
}

function applyLocale() {
  document.documentElement.lang = locale;
  if (document.title !== undefined) document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) el.setAttribute("aria-label", t(key));
  });
}

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
const matchScoreANameEl = $("matchScoreAName");
const matchScoreBNameEl = $("matchScoreBName");
const matchScoreAValueEl = $("matchScoreAValue");
const matchScoreBValueEl = $("matchScoreBValue");
const matchScoreTargetEl = $("matchScoreTarget");
const matchScoreTargetBEl = $("matchScoreTargetB");
const matchScoreTeamAEl = $("matchScoreTeamA");
const matchScoreTeamBEl = $("matchScoreTeamB");
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
      A: { id: "A", name: t("teamA"), score: 0 },
      B: { id: "B", name: t("teamB"), score: 0 },
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

/** Previous displayed scores for count-up animation */
let prevDisplayScoreA = game.teams.A.score;
let prevDisplayScoreB = game.teams.B.score;

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
    parts.push(t("openingPassPlus", { pts }));
  }
  const pasePts = game.rules.paseCorridoPoints ?? 25;
  if (bonusPaseCorridoEl?.checked) {
    bonus += pasePts;
    parts.push(t("paseCorridoPlus", { pts: pasePts }));
  }
  const capicuaPts = game.rules.capicuaPoints ?? 50;
  if (bonusCapicuaEl?.checked) {
    bonus += capicuaPts;
    parts.push(t("capicuaPlus", { pts: capicuaPts }));
  }
  const chuchazoPts = game.rules.chuchazoPoints ?? 50;
  if (bonusChuchazoEl?.checked) {
    bonus += chuchazoPts;
    parts.push(t("chuchazoPlus", { pts: chuchazoPts }));
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

// -------------------- Count-up animation --------------------
function countUp(el, fromVal, toVal, durationMs, onComplete) {
  if (!el || fromVal === toVal) {
    if (onComplete) onComplete();
    return;
  }
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = 1 - (1 - t) * (1 - t); // ease-out quad
    const current = Math.round(fromVal + (toVal - fromVal) * eased);
    el.textContent = String(current);
    if (t < 1) requestAnimationFrame(tick);
    else {
      el.textContent = String(toVal);
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(tick);
}

// -------------------- Render --------------------
function render() {
  const total = pipSum(leftovers);
  const gameWinner = matchWinner();
  const prevA = prevDisplayScoreA;
  const prevB = prevDisplayScoreB;

  if (teamANameTabEl) teamANameTabEl.textContent = game.teams.A.name;
  if (teamBNameTabEl) teamBNameTabEl.textContent = game.teams.B.name;

  if (matchScoreANameEl) matchScoreANameEl.textContent = game.teams.A.name;
  if (matchScoreBNameEl) matchScoreBNameEl.textContent = game.teams.B.name;
  if (matchScoreTargetEl) matchScoreTargetEl.textContent = String(game.target);
  if (matchScoreTargetBEl) matchScoreTargetBEl.textContent = String(game.target);

  if (matchScoreAValueEl) {
    if (game.teams.A.score !== prevA) {
      countUp(matchScoreAValueEl, prevA, game.teams.A.score, 380, () => {
        matchScoreAValueEl.classList.remove("match-score-value--highlight");
        if (matchScoreTeamAEl) matchScoreTeamAEl.classList.remove("match-score-team--highlight");
      });
      matchScoreAValueEl.classList.add("match-score-value--highlight");
      if (matchScoreTeamAEl) matchScoreTeamAEl.classList.add("match-score-team--highlight");
    } else {
      matchScoreAValueEl.textContent = String(game.teams.A.score);
    }
  }
  if (matchScoreBValueEl) {
    if (game.teams.B.score !== prevB) {
      countUp(matchScoreBValueEl, prevB, game.teams.B.score, 380, () => {
        matchScoreBValueEl.classList.remove("match-score-value--highlight");
        if (matchScoreTeamBEl) matchScoreTeamBEl.classList.remove("match-score-team--highlight");
      });
      matchScoreBValueEl.classList.add("match-score-value--highlight");
      if (matchScoreTeamBEl) matchScoreTeamBEl.classList.add("match-score-team--highlight");
    } else {
      matchScoreBValueEl.textContent = String(game.teams.B.score);
    }
  }
  prevDisplayScoreA = game.teams.A.score;
  prevDisplayScoreB = game.teams.B.score;

  if (targetChipEl) {
    const label =
      game.gameType === "500-bonuses"
        ? t("target500Bonuses")
        : t("targetLabel", { target: game.target });
    targetChipEl.textContent = label;
  }
  if (scoreCardTotalEl) scoreCardTotalEl.textContent = String(total);
  if (scoreCardTotalWrapEl)
    scoreCardTotalWrapEl.classList.toggle("has-values", leftovers.length > 0);

  if (scoreCardMathEl) {
    if (!leftovers.length) {
      scoreCardMathEl.innerHTML =
        `<span class="score-card__placeholder">${t("tapDotsToAddPoints")}</span>`;
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
      instructionTextEl.textContent = t("instructionWins", {
        name: game.teams[gameWinner].name,
        score: game.teams[gameWinner].score,
        target: game.target,
      });
    } else {
      instructionTextEl.textContent = t("instructionAwardTo", {
        total,
        name: game.teams[winner].name,
      });
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
      gameOverTitle.textContent = t("gameOverWins", { name: game.teams[gameWinner].name });
    if (hasWinner && gameOverSubtitle)
      gameOverSubtitle.textContent = t("gameOverFirstTo", { target: game.target });
  }

  if (historyListEl) {
    historyListEl.innerHTML = "";
    const history = game.history.slice().reverse();
    history.forEach((h, i) => {
      const li = document.createElement("li");
      li.className = "history-item";
      const realIndex = game.history.length - 1 - i;
      const when = new Date(h.ts).toLocaleString();
      const teamName = game.teams[h.awardTeam].name;
      const otherTeam = h.awardTeam === "A" ? "B" : "A";
      const otherTeamName = game.teams[otherTeam].name;
      li.innerHTML = `
        <div class="meta">${when} • ${h.type.toUpperCase()} • ${teamName}</div>
        <div class="line"><div>${h.detail}</div><div class="delta">+${h.delta}</div></div>
        <button type="button" class="history-item-move" data-history-index="${realIndex}" aria-label="${t("moveToTeam", { name: otherTeamName })}">${t("moveToTeam", { name: otherTeamName })}</button>
      `;
      historyListEl.appendChild(li);
    });
  }
}

function moveScoreToTeam(historyIndex) {
  const h = game.history[historyIndex];
  if (!h) return;
  const otherTeam = h.awardTeam === "A" ? "B" : "A";
  game.teams[h.awardTeam].score -= h.delta;
  game.teams[otherTeam].score += h.delta;
  h.awardTeam = otherTeam;
  saveGame();
  render();
}

// -------------------- Hand scoring --------------------
function applyScore() {
  const awardTeam = winner;
  const base = pipSum(leftovers);
  const { bonus, parts } = computeBonuses();
  let delta = base + bonus;

  // Only opening pass and pase corrido can happen mid-hand; pips/capicúa/chuchazo = hand over
  const isEndOfHand =
    base > 0 || bonusCapicuaEl?.checked || bonusChuchazoEl?.checked;

  let rndBonus = 0;
  if (isEndOfHand && game.gameType === "500-bonuses") {
    rndBonus = roundBonus(game.roundNumber);
    if (rndBonus > 0) {
      delta += rndBonus;
      parts.push(`Round bonus +${rndBonus}`);
    }
  }

  if (delta <= 0) {
    alert(t("alertAddPips"));
    return;
  }

  const confirmMsg = t("confirmAward", {
    delta,
    name: game.teams[awardTeam].name,
    base,
    bonus,
    roundBonus: rndBonus ? t("roundBonusLine", { pts: rndBonus }) : "",
  });
  if (!confirm(confirmMsg)) return;

  game.teams[awardTeam].score += delta;
  const detail = base > 0 ? t("leftOverLabel", { base }) : "";
  game.history.push({
    ts: Date.now(),
    type: isEndOfHand ? "win" : "mid",
    awardTeam,
    delta,
    detail: [detail, ...parts].filter(Boolean).join(" • "),
  });
  if (isEndOfHand && game.gameType === "500-bonuses") game.roundNumber++;
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
    prompt(t("teamAPrompt"), game.teams.A.name) || game.teams.A.name
  ).trim();
  const bName = (
    prompt(t("teamBPrompt"), game.teams.B.name) || game.teams.B.name
  ).trim();
  const prevGameType = game.gameType;

  game = defaultGame();
  game.teams.A.name = aName || t("teamA");
  game.teams.B.name = bName || t("teamB");
  game.gameType = GAME_TYPES.includes(prevGameType)
    ? prevGameType
    : "500-bonuses";
  game.target = targetFromGameType(game.gameType);
  prevDisplayScoreA = 0;
  prevDisplayScoreB = 0;
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
    btn.setAttribute("aria-label", t("addPip", { v }));
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
      if (leftovers.length && confirm(t("clearHandConfirm"))) {
        clearLeftovers();
        render();
      }
    });

  if (btnApplyScore) btnApplyScore.addEventListener("click", applyScore);

  if (btnNewGame)
    btnNewGame.addEventListener("click", () => {
      if (confirm(t("confirmNewGame"))) newGame();
    });

  if (historyListEl)
    historyListEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".history-item-move");
      if (!btn) return;
      const idx = parseInt(btn.dataset.historyIndex, 10);
      if (!isNaN(idx)) moveScoreToTeam(idx);
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
        text = t("tooltipOpeningPass", { pts: openingPassPoints() });
      } else if (key === "pase-corrido") {
        text = t("tooltipPaseCorrido", { pts: game.rules.paseCorridoPoints ?? 25 });
      } else if (key === "capicua") {
        text = t("tooltipCapicua", { pts: game.rules.capicuaPoints ?? 50 });
      } else if (key === "chuchazo") {
        text = t("tooltipChuchazo", { pts: game.rules.chuchazoPoints ?? 50 });
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
  applyLocale();
  wireUI();
  render();
  if (typeof feather !== "undefined") feather.replace();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

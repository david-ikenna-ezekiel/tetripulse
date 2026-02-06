const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold");
const holdCtx = holdCanvas.getContext("2d");
const nextMobileCanvas = document.getElementById("nextMobile");
const nextMobileCtx = nextMobileCanvas
  ? nextMobileCanvas.getContext("2d")
  : null;
const holdMobileCanvas = document.getElementById("holdMobile");
const holdMobileCtx = holdMobileCanvas
  ? holdMobileCanvas.getContext("2d")
  : null;

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const speedEl = document.getElementById("speed");
const highScoreListEl = document.getElementById("highScoreList");
const stageNameEl = document.getElementById("stageName");
const stageProgressFillEl = document.getElementById("stageProgressFill");
const stageOverlay = document.getElementById("stageOverlay");
const stageOverlayEyebrow = document.getElementById("stageOverlayEyebrow");
const stageOverlayName = document.getElementById("stageOverlayName");
const stageOverlaySub = document.getElementById("stageOverlaySub");
const winOverlay = document.getElementById("winOverlay");
const boardShell = document.getElementById("boardShell");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const statusEl = document.getElementById("statusText");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const soundBtn = document.getElementById("soundBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsDrawer = document.getElementById("settingsDrawer");
const settingsClose = document.getElementById("settingsClose");
const themeSelect = document.getElementById("themeSelect");
const themeAutoToggle = document.getElementById("themeAuto");
const gridToggle = document.getElementById("gridToggle");
const soundToggleMobile = document.getElementById("soundToggleMobile");
const themeSelectMobile = document.getElementById("themeSelectMobile");
const themeAutoMobile = document.getElementById("themeAutoMobile");
const gridToggleMobile = document.getElementById("gridToggleMobile");
const highScoreListMobileEl = document.getElementById("highScoreListMobile");
const touchButtons = document.querySelectorAll("[data-action]");
const touchPauseBtn = document.querySelector(
  '.device-meta [data-action="pause"]'
);

const COLS = 10;
const ROWS = 20;
const PREVIEW_SIZE = 4;

let blockSize = 30;
let previewBlock = 30;

let COLORS = {
  T: "#3a6f6a",
  O: "#e6b34a",
  L: "#d07b4b",
  J: "#5c7bd9",
  I: "#4bb7d0",
  S: "#78b86c",
  Z: "#d55b5b",
};

const SHAPES = {
  T: [
    [0, "T", 0],
    ["T", "T", "T"],
  ],
  O: [
    ["O", "O"],
    ["O", "O"],
  ],
  L: [
    [0, 0, "L"],
    ["L", "L", "L"],
  ],
  J: [
    ["J", 0, 0],
    ["J", "J", "J"],
  ],
  I: [["I", "I", "I", "I"]],
  S: [
    [0, "S", "S"],
    ["S", "S", 0],
  ],
  Z: [
    ["Z", "Z", 0],
    [0, "Z", "Z"],
  ],
};

const bag = [];
const ZOO_ANIMALS = [
  "lion",
  "tiger",
  "elephant",
  "panda",
  "giraffe",
  "zebra",
  "rabbit",
];

const lineScores = [0, 40, 100, 300, 1200];
const HIGH_SCORE_KEY = "tetripulse_high_scores";
const THEME_KEY = "tetripulse_theme";
const THEME_MODE_KEY = "tetripulse_theme_mode";
const GRID_KEY = "tetripulse_grid";
const STAGES = [
  { name: "Drift", lineGoal: 8, speeds: [800, 650, 520] },
  { name: "Flow", lineGoal: 10, speeds: [720, 580, 460] },
  { name: "Pressure", lineGoal: 12, speeds: [660, 520, 400] },
  { name: "Signal", lineGoal: 14, speeds: [600, 470, 360] },
  { name: "Scale", lineGoal: 16, speeds: [540, 410, 320] },
  { name: "Focus", lineGoal: 18, speeds: [480, 360, 280] },
  { name: "Clarity", lineGoal: 20, speeds: [420, 320, 240] },
  { name: "Endless", lineGoal: Number.POSITIVE_INFINITY, speeds: [360, 280, 200] },
];
const STAGE_THEMES = [
  "minimal",
  "ocean",
  "noir",
  "neon",
  "canyon",
  "wireframe",
  "ember",
  "zoo",
];

let board = createMatrix(COLS, ROWS);
let player = createPlayer();
let dropCounter = 0;
let lastTime = 0;
let dropInterval = STAGES[0].speeds[0];
let isPaused = true;
let hasStarted = false;
let isGameOver = false;
let isWin = false;
let score = 0;
let lines = 0;
let level = 1;
let holdPiece = null;
let holdUsed = false;
let highScores = loadHighScores();
let lastRecordedScore = null;
let soundEnabled = true;
let audioCtx = null;
let stageIndex = 0;
let stageLines = 0;
let stageSection = 0;
let themeDirty = false;
let themeMode = "auto";
let stageTransition = false;
let gridEnabled = localStorage.getItem(GRID_KEY) === "true";
let themeTokens = {
  boardBg: "#fefdfb",
  previewBg: "#faf9f6",
  gridLine: "rgba(0, 0, 0, 0.05)",
  gridLineStrong: "rgba(0, 0, 0, 0.12)",
  gridVisible: false,
  ghostAlpha: 0.12,
  wireframe: false,
};
let gesturesEnabled = false;

const touchMedia = window.matchMedia("(pointer: coarse)");
const supportsPointer = "PointerEvent" in window;
const nextPreviewTargets = [];
const holdPreviewTargets = [];

if (nextCanvas && nextCtx) {
  nextPreviewTargets.push({ canvas: nextCanvas, ctx: nextCtx });
}
if (nextMobileCanvas && nextMobileCtx) {
  nextPreviewTargets.push({ canvas: nextMobileCanvas, ctx: nextMobileCtx });
}
if (holdCanvas && holdCtx) {
  holdPreviewTargets.push({ canvas: holdCanvas, ctx: holdCtx });
}
if (holdMobileCanvas && holdMobileCtx) {
  holdPreviewTargets.push({ canvas: holdMobileCanvas, ctx: holdMobileCtx });
}
const touchState = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  moved: false,
};
const SWIPE_THRESHOLD = 18;
const TAP_THRESHOLD = 10;
const REPEAT_DELAY = 220;
const REPEAT_INTERVAL = 70;

function createMatrix(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function randomAnimal() {
  return ZOO_ANIMALS[Math.floor(Math.random() * ZOO_ANIMALS.length)];
}

function readCssVar(name, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

function parseColorToRgb(color) {
  if (!color) return { r: 0, g: 0, b: 0 };

  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const int = Number.parseInt(hex, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    };
  }

  if (color.startsWith("rgb")) {
    const parts = color
      .replace(/rgba?\(/, "")
      .replace(")", "")
      .split(",")
      .map((value) => Number.parseFloat(value.trim()));
    return {
      r: parts[0] || 0,
      g: parts[1] || 0,
      b: parts[2] || 0,
    };
  }

  return { r: 0, g: 0, b: 0 };
}

function mixColors(colorA, colorB, amount) {
  return {
    r: Math.round(colorA.r + (colorB.r - colorA.r) * amount),
    g: Math.round(colorA.g + (colorB.g - colorA.g) * amount),
    b: Math.round(colorA.b + (colorB.b - colorA.b) * amount),
  };
}

function toRgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function updateThemeTokens() {
  const themeName = document.body.dataset.theme || "minimal";
  themeTokens = {
    boardBg: readCssVar("--board-bg", "#fefdfb"),
    previewBg: readCssVar("--preview-bg", "#faf9f6"),
    gridLine: readCssVar("--grid-line", "rgba(0, 0, 0, 0.05)"),
    gridLineStrong: readCssVar(
      "--grid-line-strong",
      readCssVar("--grid-line", "rgba(0, 0, 0, 0.05)")
    ),
    gridVisible: themeName === "wireframe",
    ghostAlpha: Number.parseFloat(readCssVar("--ghost-alpha", "0.12")) || 0.12,
    wireframe: themeName === "wireframe",
    water: themeName === "ocean",
    zoo: themeName === "zoo",
  };

  COLORS = {
    T: readCssVar("--piece-t", COLORS.T),
    O: readCssVar("--piece-o", COLORS.O),
    L: readCssVar("--piece-l", COLORS.L),
    J: readCssVar("--piece-j", COLORS.J),
    I: readCssVar("--piece-i", COLORS.I),
    S: readCssVar("--piece-s", COLORS.S),
    Z: readCssVar("--piece-z", COLORS.Z),
  };
}

function applyTheme(themeName) {
  document.body.dataset.theme = themeName;
  localStorage.setItem(THEME_KEY, themeName);
  themeSelect.value = themeName;
  if (themeSelectMobile) {
    themeSelectMobile.value = themeName;
  }
  updateThemeTokens();
  themeDirty = false;
}

function setGridEnabled(enabled) {
  gridEnabled = enabled;
  localStorage.setItem(GRID_KEY, enabled ? "true" : "false");
  if (gridToggle) {
    gridToggle.checked = enabled;
  }
  if (gridToggleMobile) {
    gridToggleMobile.checked = enabled;
  }
}

function isGridEnabled() {
  if (themeTokens.gridVisible) return true;
  if (gridToggle) return gridToggle.checked;
  return gridEnabled;
}

function setPauseButtonLabel(label) {
  toggleBtn.textContent = label;
  if (touchPauseBtn) {
    touchPauseBtn.textContent = label;
  }
}

function syncPauseLabel() {
  if (isGameOver || isWin) {
    setPauseButtonLabel("Restart");
    return;
  }
  if (!hasStarted) {
    setPauseButtonLabel("Start");
    return;
  }
  if (stageTransition || isPaused) {
    setPauseButtonLabel("Resume");
    return;
  }
  setPauseButtonLabel("Pause");
}

function syncSoundLabel() {
  const label = `Sound: ${soundEnabled ? "On" : "Off"}`;
  soundBtn.textContent = label;
  if (soundToggleMobile) {
    soundToggleMobile.checked = soundEnabled;
  }
}

function syncThemeControls(themeName) {
  const currentTheme = themeName || themeSelect.value || "minimal";
  themeSelect.value = currentTheme;
  if (themeSelectMobile) {
    themeSelectMobile.value = currentTheme;
  }
  if (themeAutoMobile) {
    themeAutoMobile.checked = themeMode === "auto";
  }
  if (themeSelectMobile) {
    themeSelectMobile.disabled = themeMode === "auto";
  }
  if (gridToggleMobile) {
    gridToggleMobile.checked = gridEnabled;
  }
}

function setSettingsOpen(open) {
  if (!settingsDrawer) return;
  document.body.classList.toggle("settings-open", open);
  settingsDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  if (settingsBtn) {
    settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
}

function themeForStage(index) {
  return STAGE_THEMES[Math.min(index, STAGE_THEMES.length - 1)] || "minimal";
}

function setThemeMode(mode) {
  themeMode = mode;
  localStorage.setItem(THEME_MODE_KEY, mode);
  themeAutoToggle.checked = mode === "auto";
  themeSelect.disabled = mode === "auto";
  if (themeAutoMobile) {
    themeAutoMobile.checked = mode === "auto";
  }
  if (themeSelectMobile) {
    themeSelectMobile.disabled = mode === "auto";
  }

  if (mode === "auto") {
    applyTheme(themeForStage(stageIndex));
  } else {
    applyTheme(themeSelect.value || "minimal");
  }
}

function configureCanvas(canvasEl, context, width, height, scale) {
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = Math.round(width * dpr);
  canvasEl.height = Math.round(height * dpr);
  canvasEl.style.width = `${width}px`;
  canvasEl.style.height = `${height}px`;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(dpr, dpr);
  context.scale(scale, scale);
  context.imageSmoothingEnabled = false;
}

function getAvailableBoardHeight() {
  if (!boardShell) return null;
  const boardSection = boardShell.closest(".board");
  if (!boardSection) return null;
  const hint = boardSection.querySelector(".hint");
  const controls = boardSection.querySelector(".controls");
  const device = boardSection.querySelector(".device");
  const deviceMeta = device ? device.querySelector(".device-meta") : null;
  const deviceControls = device ? device.querySelector(".device-controls") : null;
  const hintHeight = hint ? hint.getBoundingClientRect().height : 0;
  const controlsHeight = controls ? controls.getBoundingClientRect().height : 0;
  const deviceMetaHeight = deviceMeta
    ? deviceMeta.getBoundingClientRect().height
    : 0;
  const deviceControlsHeight = deviceControls
    ? deviceControls.getBoundingClientRect().height
    : 0;
  const rect = boardShell.getBoundingClientRect();
  const spacing = 24;
  const viewportHeight =
    window.visualViewport?.height || window.innerHeight || 0;
  const available =
    viewportHeight -
    rect.top -
    hintHeight -
    controlsHeight -
    deviceMetaHeight -
    deviceControlsHeight -
    spacing;
  return available > 0 ? available : null;
}

function resizeCanvases() {
  const rect = canvas.getBoundingClientRect();
  const boardRow = boardShell ? boardShell.parentElement : null;
  const containerWidth = boardRow ? boardRow.clientWidth : rect.width;
  if (!rect.width && !containerWidth) return;

  const mobileHud = boardRow ? boardRow.querySelector(".mobile-hud") : null;
  const hudVisible =
    mobileHud && getComputedStyle(mobileHud).display !== "none";
  const hudWidth = hudVisible ? mobileHud.getBoundingClientRect().width : 0;
  const rowGap = hudVisible ? 16 : 0;
  const usableWidth =
    containerWidth - hudWidth - rowGap > 0
      ? containerWidth - hudWidth - rowGap
      : containerWidth;

  const maxBoardWidth = Math.min(usableWidth || rect.width, 360);
  let maxBlockSize = Math.floor(maxBoardWidth / COLS);
  const availableHeight = getAvailableBoardHeight();
  if (availableHeight) {
    const heightBlockSize = Math.floor(availableHeight / ROWS);
    maxBlockSize = Math.min(maxBlockSize, heightBlockSize);
  }
  blockSize = Math.max(12, maxBlockSize);
  const boardWidth = blockSize * COLS;
  const boardHeight = blockSize * ROWS;

  configureCanvas(canvas, ctx, boardWidth, boardHeight, blockSize);

  previewBlock = Math.max(10, Math.floor(blockSize * 0.9));
  const previewSize = previewBlock * PREVIEW_SIZE;
  const mobilePreviewBlock = Math.max(8, Math.floor(blockSize * 0.7));
  const mobilePreviewSize = mobilePreviewBlock * PREVIEW_SIZE;

  configureCanvas(nextCanvas, nextCtx, previewSize, previewSize, previewBlock);
  configureCanvas(holdCanvas, holdCtx, previewSize, previewSize, previewBlock);
  if (nextMobileCanvas && nextMobileCtx) {
    configureCanvas(
      nextMobileCanvas,
      nextMobileCtx,
      mobilePreviewSize,
      mobilePreviewSize,
      mobilePreviewBlock
    );
  }
  if (holdMobileCanvas && holdMobileCtx) {
    configureCanvas(
      holdMobileCanvas,
      holdMobileCtx,
      mobilePreviewSize,
      mobilePreviewSize,
      mobilePreviewBlock
    );
  }
}

function setInputMode(mode) {
  document.body.dataset.input = mode;
}

function detectInputMode() {
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isCoarse = touchMedia.matches;
  const isNarrow = window.matchMedia("(max-width: 900px)").matches;
  const mode = hasTouch || isCoarse || isNarrow ? "touch" : "keyboard";
  setInputMode(mode);
  gesturesEnabled = false;
  if (mode !== "touch") {
    setSettingsOpen(false);
  }
  resizeCanvases();
  requestAnimationFrame(resizeCanvases);
}

function isTouchInput(event) {
  if (!event) return document.body.dataset.input === "touch";
  return event.pointerType === "touch" || event.pointerType === "pen";
}

function startTouchGesture(pointerId, clientX, clientY) {
  if (!gesturesEnabled) return;
  if (touchState.active) return;
  touchState.active = true;
  touchState.pointerId = pointerId;
  touchState.startX = clientX;
  touchState.startY = clientY;
  touchState.lastX = clientX;
  touchState.lastY = clientY;
  touchState.moved = false;
}

function moveTouchGesture(pointerId, clientX, clientY) {
  if (!gesturesEnabled) return;
  if (!touchState.active || pointerId !== touchState.pointerId) return;
  const dx = clientX - touchState.lastX;
  const dy = clientY - touchState.lastY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

  if (absDx > absDy) {
    handleAction(dx > 0 ? "right" : "left");
    touchState.lastX = clientX;
    touchState.moved = true;
    return;
  }

  if (dy > 0) {
    handleAction("down");
    touchState.lastY = clientY;
    touchState.moved = true;
  }
}

function endTouchGesture(pointerId, clientX, clientY) {
  if (!gesturesEnabled) return;
  if (!touchState.active || pointerId !== touchState.pointerId) return;
  const dx = clientX - touchState.startX;
  const dy = clientY - touchState.startY;
  const distance = Math.hypot(dx, dy);
  if (!touchState.moved && distance < TAP_THRESHOLD) {
    handleAction("rotate");
  }
  touchState.active = false;
  touchState.pointerId = null;
}

function preventPinchZoom(target) {
  const onTouch = (event) => {
    if (document.body.dataset.input !== "touch") return;
    if (event.touches && event.touches.length > 1) {
      event.preventDefault();
    }
  };
  target.addEventListener("touchstart", onTouch, { passive: false });
  target.addEventListener("touchmove", onTouch, { passive: false });
}

function preventDoubleTapZoom(target) {
  let lastTap = 0;
  target.addEventListener(
    "touchend",
    (event) => {
      if (document.body.dataset.input !== "touch") return;
      const now = Date.now();
      if (now - lastTap < 300) {
        event.preventDefault();
      }
      lastTap = now;
    },
    { passive: false }
  );
}

function loadHighScores() {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => Number.isFinite(value)).slice(0, 5);
    }
  } catch (error) {
    return [];
  }
  return [];
}

function saveHighScores(scores) {
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
}

function renderHighScores() {
  highScoreListEl.innerHTML = "";
  if (highScoreListMobileEl) {
    highScoreListMobileEl.innerHTML = "";
  }

  if (highScores.length === 0) {
    const item = document.createElement("li");
    item.textContent = "—";
    item.classList.add("muted");
    highScoreListEl.appendChild(item);
    if (highScoreListMobileEl) {
      const mobileItem = document.createElement("li");
      mobileItem.textContent = "—";
      mobileItem.classList.add("muted");
      highScoreListMobileEl.appendChild(mobileItem);
    }
    return;
  }

  highScores.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value.toString();
    highScoreListEl.appendChild(item);
    if (highScoreListMobileEl) {
      const mobileItem = document.createElement("li");
      mobileItem.textContent = value.toString();
      highScoreListMobileEl.appendChild(mobileItem);
    }
  });
}

function updateGameOverUI(gameOver) {
  boardShell.classList.toggle("game-over", gameOver);
  gameOverOverlay.setAttribute("aria-hidden", gameOver ? "false" : "true");
}

function updateWinUI(win) {
  boardShell.classList.toggle("win", win);
  winOverlay.setAttribute("aria-hidden", win ? "false" : "true");
}

function getStage() {
  return STAGES[Math.min(stageIndex, STAGES.length - 1)];
}

function showStageOverlay(eyebrow, name, subline) {
  stageOverlayEyebrow.textContent = eyebrow;
  stageOverlayName.textContent = name;
  stageOverlaySub.textContent = subline;
  stageOverlay.setAttribute("aria-hidden", "false");
  boardShell.classList.add("stage-flash");
}

function hideStageOverlay() {
  boardShell.classList.remove("stage-flash");
  stageOverlay.setAttribute("aria-hidden", "true");
}

function startStageTransition(prevStage, nextStage) {
  if (isGameOver || isWin) return;

  if (themeMode === "auto") {
    applyTheme(themeForStage(stageIndex));
  }

  stageTransition = true;
  isPaused = true;
  statusEl.textContent = "Stage cleared";
  syncPauseLabel();

  board = createMatrix(COLS, ROWS);
  player = createPlayer();
  holdPiece = null;
  holdUsed = false;
  dropCounter = 0;

  showStageOverlay(
    `${prevStage} cleared`,
    "Next stage is ready",
    `Press Space to play ${nextStage}`
  );
  playSound("stage");
}

function endStageTransition() {
  if (isGameOver || isWin) return;
  stageTransition = false;
  isPaused = false;
  statusEl.textContent = "Playing";
  syncPauseLabel();
  hideStageOverlay();
}

function updateStageUI() {
  const stage = getStage();
  stageNameEl.textContent = stage.name;

  let progressRatio = 0;
  if (stage.lineGoal === Number.POSITIVE_INFINITY) {
    progressRatio = (stageLines % 10) / 10;
  } else {
    progressRatio = Math.min(1, stageLines / stage.lineGoal);
  }
  stageProgressFillEl.style.width = `${Math.round(progressRatio * 100)}%`;
}

function updateStageProgress(cleared) {
  if (cleared <= 0) return;

  stageLines += cleared;
  let stage = getStage();
  const prevStageName = stage.name;

  let stageChanged = false;
  while (
    stage.lineGoal !== Number.POSITIVE_INFINITY &&
    stageLines >= stage.lineGoal
  ) {
    stageLines -= stage.lineGoal;
    stageIndex = Math.min(stageIndex + 1, STAGES.length - 1);
    stageSection = 0;
    stage = getStage();
    stageChanged = true;
    if (stage.lineGoal === Number.POSITIVE_INFINITY) {
      stageLines = 0;
      break;
    }
  }

  if (stageChanged) {
    stageLines = 0;
    stageSection = 0;
    dropInterval = stage.speeds[0];
    level = stageIndex + 1;
    updateStageUI();
    startStageTransition(prevStageName, stage.name);
    return;
  }

  if (
    stage.lineGoal === Number.POSITIVE_INFINITY &&
    stageLines >= 40 &&
    !isWin
  ) {
    isWin = true;
    isPaused = true;
    statusEl.textContent = "You Won!!";
    updateWinUI(true);
    syncPauseLabel();
  }

  if (!isWin) {
    const sectionSize =
      stage.lineGoal === Number.POSITIVE_INFINITY
        ? 10
        : Math.ceil(stage.lineGoal / stage.speeds.length);
    stageSection = Math.min(
      stage.speeds.length - 1,
      Math.floor(stageLines / sectionSize)
    );

    dropInterval = stage.speeds[stageSection];
    level = stageIndex + 1;
    updateStageUI();
    if (stageChanged) {
      startStageTransition(prevStageName, stage.name);
    }
  }
}

function recordScore(value) {
  if (!Number.isFinite(value) || value <= 0 || value === lastRecordedScore) {
    return;
  }
  highScores = [...highScores, value].sort((a, b) => b - a).slice(0, 5);
  lastRecordedScore = value;
  saveHighScores(highScores);
  renderHighScores();
}

function finalizeScore() {
  if (score > 0) {
    recordScore(score);
  }
}

function ensureAudio() {
  if (!soundEnabled) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(frequency, duration, type, gainValue) {
  if (!soundEnabled) return;
  ensureAudio();
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.value = 0;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gainValue, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playSound(type) {
  if (!soundEnabled) return;
  switch (type) {
    case "move":
      playTone(320, 0.05, "triangle", 0.04);
      break;
    case "rotate":
      playTone(440, 0.06, "square", 0.045);
      break;
    case "drop":
      playTone(220, 0.05, "sine", 0.035);
      break;
    case "harddrop":
      playTone(180, 0.08, "sawtooth", 0.05);
      break;
    case "line":
      playTone(660, 0.1, "triangle", 0.06);
      break;
    case "hold":
      playTone(520, 0.07, "sine", 0.04);
      break;
    case "gameover":
      playTone(140, 0.2, "sine", 0.07);
      break;
    case "stage":
      playTone(480, 0.12, "triangle", 0.05);
      window.setTimeout(() => {
        playTone(660, 0.12, "triangle", 0.04);
      }, 90);
      break;
    default:
      break;
  }
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  syncSoundLabel();
  if (!enabled && audioCtx && audioCtx.state === "running") {
    audioCtx.suspend();
  }
}

function createPlayer() {
  const current = randomPiece();
  return {
    pos: { x: 0, y: 0 },
    matrix: cloneMatrix(current.matrix),
    type: current.type,
    animal: current.animal,
    next: randomPiece(),
  };
}

function randomPiece() {
  if (bag.length === 0) {
    const pieces = Object.keys(SHAPES);
    while (pieces.length) {
      const index = Math.floor(Math.random() * pieces.length);
      bag.push(pieces.splice(index, 1)[0]);
    }
  }
  const key = bag.pop();
  return {
    type: key,
    matrix: SHAPES[key].map((row) => row.slice()),
    animal: randomAnimal(),
  };
}

function resetPlayer() {
  player.matrix = cloneMatrix(player.next.matrix);
  player.type = player.next.type;
  player.animal = player.next.animal;
  player.next = randomPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);
  holdUsed = false;

  if (collide(board, player)) {
    isGameOver = true;
    isPaused = true;
    statusEl.textContent = "Game Over";
    updateGameOverUI(true);
    playSound("gameover");
    recordScore(score);
    syncPauseLabel();
  }
}

function collide(arena, playerState) {
  const { matrix, pos } = playerState;
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x] !== 0) {
        const arenaRow = arena[y + pos.y];
        if (!arenaRow || arenaRow[x + pos.x] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(arena, playerState) {
  playerState.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + playerState.pos.y][x + playerState.pos.x] = {
          type: playerState.type,
          animal: playerState.animal,
        };
      }
    });
  });
}

function rotate(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      rotated[x][rows - 1 - y] = matrix[y][x];
    }
  }
  return rotated;
}

function playerRotate() {
  const rotated = rotate(player.matrix);
  const offsets = [0, -1, 1, -2, 2, -3, 3];
  const originalX = player.pos.x;

  for (const offset of offsets) {
    player.pos.x = originalX + offset;
    player.matrix = rotated;
    if (!collide(board, player)) {
      playSound("rotate");
      return;
    }
  }

  player.pos.x = originalX;
  player.matrix = rotate(rotated);
}

function clearLines() {
  let cleared = 0;
  for (let y = board.length - 1; y >= 0; y -= 1) {
    if (board[y].every((cell) => cell !== 0)) {
      const row = board.splice(y, 1)[0].fill(0);
      board.unshift(row);
      cleared += 1;
      y += 1;
    }
  }
  if (cleared > 0) {
    lines += cleared;
    score += lineScores[cleared] * level;
    updateStageProgress(cleared);
    playSound("line");
  }
}

function playerDrop(manual = false) {
  player.pos.y += 1;
  if (collide(board, player)) {
    player.pos.y -= 1;
    merge(board, player);
    clearLines();
    resetPlayer();
    updateStats();
  }
  if (manual) {
    playSound("drop");
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(board, player)) {
    player.pos.y += 1;
  }
  player.pos.y -= 1;
  merge(board, player);
  clearLines();
  resetPlayer();
  updateStats();
  playSound("harddrop");
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(board, player)) {
    player.pos.x -= dir;
  } else {
    playSound("move");
  }
}

function holdSwap() {
  if (holdUsed || isPaused || isGameOver || isWin || stageTransition) {
    return;
  }

  const current = {
    matrix: cloneMatrix(player.matrix),
    type: player.type,
    animal: player.animal,
  };
  if (!holdPiece) {
    holdPiece = current;
    player.matrix = cloneMatrix(player.next.matrix);
    player.type = player.next.type;
    player.animal = player.next.animal;
    player.next = randomPiece();
  } else {
    player.matrix = cloneMatrix(holdPiece.matrix);
    player.type = holdPiece.type;
    player.animal = holdPiece.animal;
    holdPiece = current;
  }

  player.pos.y = 0;
  player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);
  holdUsed = true;
  playSound("hold");

  if (collide(board, player)) {
    isGameOver = true;
    isPaused = true;
    statusEl.textContent = "Game Over";
    updateGameOverUI(true);
    playSound("gameover");
    recordScore(score);
    syncPauseLabel();
  }
}

function updateStats() {
  scoreEl.textContent = score.toString();
  linesEl.textContent = lines.toString();
  speedEl.textContent = (stageSection + 1).toString();
  renderHighScores();
  updateStageUI();
}

function getWaterGradient(color, context, x, y) {
  const base = parseColorToRgb(color);
  const light = mixColors(base, { r: 255, g: 255, b: 255 }, 0.35);
  const deep = mixColors(base, { r: 0, g: 60, b: 80 }, 0.25);
  const gradient = context.createLinearGradient(x, y, x + 1, y + 1);
  gradient.addColorStop(0, toRgba(light, 0.95));
  gradient.addColorStop(0.5, toRgba(base, 0.9));
  gradient.addColorStop(1, toRgba(deep, 0.9));
  return gradient;
}

function drawPawPrint(context, x, y, color) {
  const base = parseColorToRgb(color);
  const dark = mixColors(base, { r: 0, g: 0, b: 0 }, 0.35);
  const paw = toRgba(dark, 0.35);

  const toeR = 0.06;
  const padR = 0.13;
  const toes = [
    { x: x + 0.28, y: y + 0.32 },
    { x: x + 0.45, y: y + 0.22 },
    { x: x + 0.55, y: y + 0.22 },
    { x: x + 0.72, y: y + 0.32 },
  ];

  context.fillStyle = paw;
  toes.forEach((toe) => {
    context.beginPath();
    context.arc(toe.x, toe.y, toeR, 0, Math.PI * 2);
    context.fill();
  });

  context.beginPath();
  context.arc(x + 0.5, y + 0.62, padR, 0, Math.PI * 2);
  context.fill();
}

function drawAnimalFace(context, x, y, animal, color) {
  const base = parseColorToRgb(color);
  const dark = mixColors(base, { r: 0, g: 0, b: 0 }, 0.45);
  const stroke = toRgba(dark, 0.7);
  const fill = toRgba(dark, 0.4);

  const drawEyes = () => {
    context.fillStyle = stroke;
    context.beginPath();
    context.arc(x + 0.35, y + 0.45, 0.05, 0, Math.PI * 2);
    context.arc(x + 0.65, y + 0.45, 0.05, 0, Math.PI * 2);
    context.fill();
  };

  const drawNose = () => {
    context.fillStyle = stroke;
    context.beginPath();
    context.arc(x + 0.5, y + 0.6, 0.045, 0, Math.PI * 2);
    context.fill();
  };

  context.save();
  context.lineWidth = 0.06;
  context.strokeStyle = stroke;

  switch (animal) {
    case "lion":
      context.beginPath();
      context.arc(x + 0.5, y + 0.5, 0.42, 0, Math.PI * 2);
      context.stroke();
      drawEyes();
      drawNose();
      break;
    case "tiger":
      for (let i = -1; i <= 1; i += 1) {
        context.beginPath();
        context.moveTo(x + 0.28 + i * 0.12, y + 0.2);
        context.lineTo(x + 0.38 + i * 0.12, y + 0.35);
        context.stroke();
      }
      drawEyes();
      drawNose();
      break;
    case "elephant":
      context.beginPath();
      context.arc(x + 0.22, y + 0.5, 0.18, 0.6 * Math.PI, 1.4 * Math.PI);
      context.arc(x + 0.78, y + 0.5, 0.18, -0.4 * Math.PI, 0.4 * Math.PI);
      context.stroke();
      context.beginPath();
      context.moveTo(x + 0.5, y + 0.55);
      context.lineTo(x + 0.5, y + 0.8);
      context.stroke();
      drawEyes();
      break;
    case "panda":
      context.fillStyle = fill;
      context.beginPath();
      context.ellipse(x + 0.35, y + 0.45, 0.12, 0.1, 0, 0, Math.PI * 2);
      context.ellipse(x + 0.65, y + 0.45, 0.12, 0.1, 0, 0, Math.PI * 2);
      context.fill();
      drawEyes();
      drawNose();
      break;
    case "giraffe":
      context.fillStyle = fill;
      [
        { dx: 0.32, dy: 0.3 },
        { dx: 0.7, dy: 0.35 },
        { dx: 0.45, dy: 0.65 },
        { dx: 0.68, dy: 0.7 },
      ].forEach((spot) => {
        context.beginPath();
        context.arc(x + spot.dx, y + spot.dy, 0.06, 0, Math.PI * 2);
        context.fill();
      });
      drawEyes();
      drawNose();
      break;
    case "zebra":
      for (let i = 0; i < 4; i += 1) {
        context.beginPath();
        context.moveTo(x + 0.22 + i * 0.16, y + 0.2);
        context.lineTo(x + 0.12 + i * 0.16, y + 0.8);
        context.stroke();
      }
      drawEyes();
      drawNose();
      break;
    case "rabbit":
      context.beginPath();
      context.ellipse(x + 0.38, y + 0.18, 0.08, 0.18, 0, 0, Math.PI * 2);
      context.ellipse(x + 0.62, y + 0.18, 0.08, 0.18, 0, 0, Math.PI * 2);
      context.stroke();
      drawEyes();
      drawNose();
      break;
    default:
      drawEyes();
      drawNose();
      break;
  }

  context.restore();
}

function drawBorder(context, x, y, color) {
  const base = parseColorToRgb(color);
  const dark = mixColors(base, { r: 0, g: 0, b: 0 }, 0.35);
  const stroke = toRgba(dark, 0.22);

  context.save();
  context.strokeStyle = stroke;
  context.lineWidth = 0.03;
  context.strokeRect(x + 0.04, y + 0.04, 0.92, 0.92);
  context.restore();
}

function resolveCell(value, fallbackAnimal) {
  if (!value) return null;
  if (typeof value === "string") {
    return { type: value, animal: fallbackAnimal };
  }
  if (value.type) {
    return value;
  }
  return null;
}

function drawMatrix(matrix, offset, context, options = {}) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const cell = resolveCell(value, options.animal);
        if (!cell) return;
        const color = COLORS[cell.type];

        if (themeTokens.wireframe) {
          context.strokeStyle = color;
          context.lineWidth = 0.08;
          context.strokeRect(x + offset.x, y + offset.y, 1, 1);
        } else if (themeTokens.water) {
          context.fillStyle = getWaterGradient(
            color,
            context,
            x + offset.x,
            y + offset.y
          );
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
          drawBorder(context, x + offset.x, y + offset.y, color);
        } else {
          context.fillStyle = color;
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
          drawBorder(context, x + offset.x, y + offset.y, color);
        }

        if (themeTokens.zoo && !options.ghost && cell.animal) {
          drawAnimalFace(context, x + offset.x, y + offset.y, cell.animal, color);
        }
      }
    });
  });
}

function drawGrid() {
  const gridColor = themeTokens.gridVisible
    ? themeTokens.gridLine
    : gridEnabled
      ? themeTokens.gridLineStrong
      : null;
  if (!gridColor) return;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = themeTokens.gridVisible ? 0.035 : 0.04;
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ROWS);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(COLS, y);
    ctx.stroke();
  }
}

function getGhostPosition() {
  const ghost = {
    pos: { x: player.pos.x, y: player.pos.y },
    matrix: player.matrix,
  };

  if (collide(board, ghost)) {
    return null;
  }

  while (!collide(board, ghost)) {
    ghost.pos.y += 1;
  }
  ghost.pos.y -= 1;
  return ghost.pos;
}

function drawGhost() {
  const ghostPos = getGhostPosition();
  if (!ghostPos) return;

  ctx.save();
  ctx.globalAlpha = themeTokens.ghostAlpha;
  drawMatrix(player.matrix, ghostPos, ctx, { ghost: true, animal: player.animal });
  ctx.restore();
}

function drawPreview(context, piece) {
  context.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  context.fillStyle = themeTokens.previewBg;
  context.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  if (piece && piece.matrix) {
    drawMatrix(piece.matrix, { x: 0.5, y: 0.5 }, context, {
      animal: piece.animal,
    });
  }
}

function draw() {
  ctx.fillStyle = themeTokens.boardBg;
  ctx.fillRect(0, 0, COLS, ROWS);
  drawGrid();
  drawMatrix(board, { x: 0, y: 0 }, ctx);
  drawGhost();
  drawMatrix(player.matrix, player.pos, ctx, { animal: player.animal });

  nextPreviewTargets.forEach(({ ctx: targetCtx }) => {
    drawPreview(targetCtx, player.next);
  });
  holdPreviewTargets.forEach(({ ctx: targetCtx }) => {
    drawPreview(targetCtx, holdPiece);
  });
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (themeDirty) {
    void document.body.offsetHeight;
    updateThemeTokens();
    themeDirty = false;
  }

  if (!isPaused && !isGameOver && !isWin && !stageTransition) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

function togglePause() {
  if (stageTransition) {
    endStageTransition();
    return;
  }
  if (isGameOver || isWin) {
    resetGame();
  }
  hasStarted = true;
  isPaused = !isPaused;
  statusEl.textContent = isPaused ? "Paused" : "Playing";
  syncPauseLabel();
}

function resetGame() {
  if (hasStarted && !isGameOver) {
    finalizeScore();
  }
  board = createMatrix(COLS, ROWS);
  player = createPlayer();
  score = 0;
  lines = 0;
  stageIndex = 0;
  stageLines = 0;
  stageSection = 0;
  level = 1;
  dropInterval = STAGES[0].speeds[0];
  isGameOver = false;
  isWin = false;
  stageTransition = false;
  isPaused = false;
  hasStarted = true;
  holdPiece = null;
  holdUsed = false;
  updateGameOverUI(false);
  updateWinUI(false);
  hideStageOverlay();
  if (themeMode === "auto") {
    applyTheme(themeForStage(stageIndex));
  }
  statusEl.textContent = "Playing";
  syncPauseLabel();
  updateStats();
  resetPlayer();
}

function handleAction(action) {
  ensureAudio();

  if (action === "pause") {
    if (!hasStarted) {
      resetGame();
      return;
    }
    togglePause();
    return;
  }

  if (action === "reset") {
    resetGame();
    return;
  }

  if (action === "sound") {
    setSoundEnabled(!soundEnabled);
    return;
  }

  if (!hasStarted) return;

  if (stageTransition) {
    endStageTransition();
    return;
  }

  if (action === "hold") {
    holdSwap();
    return;
  }

  if (isPaused || isGameOver || isWin) return;

  if (action === "left") {
    playerMove(-1);
  } else if (action === "right") {
    playerMove(1);
  } else if (action === "down") {
    playerDrop(true);
  } else if (action === "rotate") {
    playerRotate();
  } else if (action === "hard") {
    hardDrop();
  }
}

function bindTouchButton(button) {
  const action = button.dataset.action;
  const repeatable = action === "left" || action === "right" || action === "down";
  let repeatTimeout = null;
  let repeatInterval = null;
  let ignoreClick = false;

  const clearTimers = () => {
    if (repeatTimeout) {
      clearTimeout(repeatTimeout);
      repeatTimeout = null;
    }
    if (repeatInterval) {
      clearInterval(repeatInterval);
      repeatInterval = null;
    }
  };

  const blockClick = () => {
    ignoreClick = true;
    window.setTimeout(() => {
      ignoreClick = false;
    }, 350);
  };

  const startRepeat = () => {
    if (!repeatable) return;
    repeatTimeout = setTimeout(() => {
      repeatInterval = setInterval(() => {
        handleAction(action);
      }, REPEAT_INTERVAL);
    }, REPEAT_DELAY);
  };

  const onPointerDown = (event) => {
    if (!isTouchInput(event)) return;
    event.preventDefault();
    blockClick();
    button.setPointerCapture?.(event.pointerId);
    handleAction(action);
    startRepeat();
  };

  const onPointerUp = () => {
    clearTimers();
  };

  const onTouchStart = (event) => {
    if (event.touches.length > 1) return;
    event.preventDefault();
    blockClick();
    handleAction(action);
    startRepeat();
  };

  const onTouchEnd = () => {
    clearTimers();
  };

  const onClick = () => {
    if (ignoreClick) return;
    handleAction(action);
  };

  if (supportsPointer) {
    button.addEventListener("pointerdown", onPointerDown);
    button.addEventListener("pointerup", onPointerUp);
    button.addEventListener("pointercancel", onPointerUp);
    button.addEventListener("pointerleave", onPointerUp);
  } else {
    button.addEventListener("touchstart", onTouchStart, { passive: false });
    button.addEventListener("touchend", onTouchEnd);
    button.addEventListener("touchcancel", onTouchEnd);
  }

  button.addEventListener("click", onClick);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

toggleBtn.addEventListener("click", () => {
  ensureAudio();
  if (!hasStarted) {
    resetGame();
    return;
  }
  togglePause();
});

resetBtn.addEventListener("click", () => {
  ensureAudio();
  resetGame();
});

soundBtn.addEventListener("click", () => {
  setSoundEnabled(!soundEnabled);
});

if (soundToggleMobile) {
  soundToggleMobile.addEventListener("change", (event) => {
    setSoundEnabled(event.target.checked);
  });
}

themeSelect.addEventListener("change", (event) => {
  if (themeMode !== "auto") {
    applyTheme(event.target.value);
  }
});

if (themeSelectMobile) {
  themeSelectMobile.addEventListener("change", (event) => {
    if (themeMode !== "auto") {
      applyTheme(event.target.value);
    }
  });
}

themeAutoToggle.addEventListener("change", (event) => {
  setThemeMode(event.target.checked ? "auto" : "manual");
});

if (themeAutoMobile) {
  themeAutoMobile.addEventListener("change", (event) => {
    setThemeMode(event.target.checked ? "auto" : "manual");
  });
}

if (gridToggle) {
  gridToggle.addEventListener("change", (event) => {
    setGridEnabled(event.target.checked);
  });
  gridToggle.addEventListener("input", (event) => {
    setGridEnabled(event.target.checked);
  });
}

if (gridToggleMobile) {
  gridToggleMobile.addEventListener("change", (event) => {
    setGridEnabled(event.target.checked);
  });
  gridToggleMobile.addEventListener("input", (event) => {
    setGridEnabled(event.target.checked);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  ensureAudio();

  const controlKeys = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowDown",
    "ArrowUp",
    "Space",
    "KeyP",
    "KeyR",
    "KeyC",
    "KeyM",
  ]);

  if (controlKeys.has(event.code)) {
    event.preventDefault();
  }

  if (event.code === "KeyM") {
    setSoundEnabled(!soundEnabled);
  }

  if (event.code === "KeyR") {
    resetGame();
  }

  if (stageTransition) {
    if (event.code === "Space") {
      endStageTransition();
    }
    return;
  }

  if (event.code === "KeyP") {
    if (!hasStarted) return;
    togglePause();
  }

  if (event.code === "KeyC") {
    holdSwap();
  }

  if (isPaused || isGameOver || isWin) return;

  if (event.code === "ArrowLeft") {
    playerMove(-1);
  } else if (event.code === "ArrowRight") {
    playerMove(1);
  } else if (event.code === "ArrowDown") {
    playerDrop(true);
  } else if (event.code === "ArrowUp") {
    playerRotate();
  } else if (event.code === "Space") {
    hardDrop();
  }
});

if (touchButtons.length) {
  touchButtons.forEach((button) => bindTouchButton(button));
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    setSettingsOpen(true);
  });
}

if (settingsClose) {
  settingsClose.addEventListener("click", () => {
    setSettingsOpen(false);
  });
}

if (settingsDrawer) {
  settingsDrawer.addEventListener("click", (event) => {
    if (event.target === settingsDrawer) {
      setSettingsOpen(false);
    }
  });
}

if (boardShell) {
  if (supportsPointer) {
    boardShell.addEventListener("pointerdown", (event) => {
      if (!isTouchInput(event)) return;
      event.preventDefault();
      startTouchGesture(event.pointerId, event.clientX, event.clientY);
      boardShell.setPointerCapture?.(event.pointerId);
    });

    boardShell.addEventListener("pointermove", (event) => {
      moveTouchGesture(event.pointerId, event.clientX, event.clientY);
    });

    boardShell.addEventListener("pointerup", (event) => {
      endTouchGesture(event.pointerId, event.clientX, event.clientY);
    });

    boardShell.addEventListener("pointercancel", (event) => {
      endTouchGesture(event.pointerId, event.clientX, event.clientY);
    });
  } else {
    boardShell.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
        event.preventDefault();
        const touch = event.changedTouches[0];
        startTouchGesture(touch.identifier, touch.clientX, touch.clientY);
      },
      { passive: false }
    );

    boardShell.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length !== 1) return;
        const touch = event.changedTouches[0];
        moveTouchGesture(touch.identifier, touch.clientX, touch.clientY);
      },
      { passive: false }
    );

    boardShell.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      endTouchGesture(touch.identifier, touch.clientX, touch.clientY);
    });

    boardShell.addEventListener("touchcancel", (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      endTouchGesture(touch.identifier, touch.clientX, touch.clientY);
    });
  }

  boardShell.addEventListener("contextmenu", (event) => event.preventDefault());
}

window.addEventListener("resize", () => {
  resizeCanvases();
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeCanvases);
  window.visualViewport.addEventListener("scroll", resizeCanvases);
}

preventPinchZoom(document);
preventDoubleTapZoom(document);
["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    (event) => {
      if (document.body.dataset.input !== "touch") return;
      event.preventDefault();
    },
    { passive: false }
  );
});

detectInputMode();
if (touchMedia.addEventListener) {
  touchMedia.addEventListener("change", detectInputMode);
} else if (touchMedia.addListener) {
  touchMedia.addListener(detectInputMode);
}

const savedTheme = localStorage.getItem(THEME_KEY) || "minimal";
const savedMode = localStorage.getItem(THEME_MODE_KEY) || "auto";
themeSelect.value = savedTheme;
setThemeMode(savedMode);
updateThemeTokens();
setGridEnabled(gridEnabled);
syncThemeControls(savedTheme);

updateStats();
setSoundEnabled(soundEnabled);
syncPauseLabel();
draw();
update();

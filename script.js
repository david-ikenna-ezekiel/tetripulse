const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold");
const holdCtx = holdCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const speedEl = document.getElementById("speed");
const highScoreListEl = document.getElementById("highScoreList");
const stageNameEl = document.getElementById("stageName");
const stageProgressFillEl = document.getElementById("stageProgressFill");
const stageOverlay = document.getElementById("stageOverlay");
const stageOverlayName = document.getElementById("stageOverlayName");
const winOverlay = document.getElementById("winOverlay");
const boardShell = document.getElementById("boardShell");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const statusEl = document.getElementById("statusText");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const soundBtn = document.getElementById("soundBtn");
const themeSelect = document.getElementById("themeSelect");

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

const lineScores = [0, 40, 100, 300, 1200];
const HIGH_SCORE_KEY = "tetripulse_high_scores";
const THEME_KEY = "tetripulse_theme";
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
let themeTokens = {
  boardBg: "#fefdfb",
  previewBg: "#faf9f6",
  gridLine: "rgba(0, 0, 0, 0.05)",
  ghostAlpha: 0.12,
  wireframe: false,
};

function createMatrix(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function readCssVar(name, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

function updateThemeTokens() {
  themeTokens = {
    boardBg: readCssVar("--board-bg", "#fefdfb"),
    previewBg: readCssVar("--preview-bg", "#faf9f6"),
    gridLine: readCssVar("--grid-line", "rgba(0, 0, 0, 0.05)"),
    ghostAlpha: Number.parseFloat(readCssVar("--ghost-alpha", "0.12")) || 0.12,
    wireframe: readCssVar("--wireframe", "0") === "1",
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
  updateThemeTokens();
  draw();
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

function resizeCanvases() {
  const rect = canvas.getBoundingClientRect();
  const containerWidth = canvas.parentElement
    ? canvas.parentElement.clientWidth
    : rect.width;
  if (!rect.width && !containerWidth) return;

  const maxBoardWidth = Math.min(containerWidth || rect.width, 320);
  blockSize = Math.max(12, Math.floor(maxBoardWidth / COLS));
  const boardWidth = blockSize * COLS;
  const boardHeight = blockSize * ROWS;

  configureCanvas(canvas, ctx, boardWidth, boardHeight, blockSize);

  previewBlock = Math.max(10, Math.floor(blockSize * 0.9));
  const previewSize = previewBlock * PREVIEW_SIZE;

  configureCanvas(nextCanvas, nextCtx, previewSize, previewSize, previewBlock);
  configureCanvas(holdCanvas, holdCtx, previewSize, previewSize, previewBlock);
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

  if (highScores.length === 0) {
    const item = document.createElement("li");
    item.textContent = "—";
    item.classList.add("muted");
    highScoreListEl.appendChild(item);
    return;
  }

  highScores.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value.toString();
    highScoreListEl.appendChild(item);
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

flashStageOverlay.timer = null;

function flashStageOverlay(name) {
  stageOverlayName.textContent = name;
  stageOverlay.setAttribute("aria-hidden", "false");
  boardShell.classList.add("stage-flash");

  window.clearTimeout(flashStageOverlay.timer);
  flashStageOverlay.timer = window.setTimeout(() => {
    boardShell.classList.remove("stage-flash");
    stageOverlay.setAttribute("aria-hidden", "true");
  }, 1200);
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

  if (
    stage.lineGoal === Number.POSITIVE_INFINITY &&
    stageLines >= 40 &&
    !isWin
  ) {
    isWin = true;
    isPaused = true;
    statusEl.textContent = "You Won!!";
    toggleBtn.textContent = "Restart";
    updateWinUI(true);
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
      flashStageOverlay(stage.name);
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
    default:
      break;
  }
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  soundBtn.textContent = `Sound: ${enabled ? "On" : "Off"}`;
  if (!enabled && audioCtx && audioCtx.state === "running") {
    audioCtx.suspend();
  }
}

function createPlayer() {
  return {
    pos: { x: 0, y: 0 },
    matrix: randomPiece(),
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
  return SHAPES[key].map((row) => row.slice());
}

function resetPlayer() {
  player.matrix = player.next;
  player.next = randomPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);
  holdUsed = false;

  if (collide(board, player)) {
    isGameOver = true;
    isPaused = true;
    statusEl.textContent = "Game Over";
    toggleBtn.textContent = "Restart";
    updateGameOverUI(true);
    playSound("gameover");
    recordScore(score);
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
        arena[y + playerState.pos.y][x + playerState.pos.x] = value;
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
  if (holdUsed || isPaused || isGameOver) {
    return;
  }

  const current = cloneMatrix(player.matrix);
  if (!holdPiece) {
    holdPiece = current;
    player.matrix = player.next;
    player.next = randomPiece();
  } else {
    player.matrix = holdPiece;
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
    toggleBtn.textContent = "Restart";
    updateGameOverUI(true);
    playSound("gameover");
    recordScore(score);
  }
}

function updateStats() {
  scoreEl.textContent = score.toString();
  linesEl.textContent = lines.toString();
  speedEl.textContent = (stageSection + 1).toString();
  renderHighScores();
  updateStageUI();
}

function drawMatrix(matrix, offset, context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        if (themeTokens.wireframe) {
          context.strokeStyle = COLORS[value];
          context.lineWidth = 0.08;
          context.strokeRect(x + offset.x, y + offset.y, 1, 1);
        } else {
          context.fillStyle = COLORS[value];
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      }
    });
  });
}

function drawGrid() {
  ctx.strokeStyle = themeTokens.gridLine;
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
  drawMatrix(player.matrix, ghostPos, ctx);
  ctx.restore();
}

function drawPreview(context, matrix) {
  context.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  context.fillStyle = themeTokens.previewBg;
  context.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  if (matrix) {
    drawMatrix(matrix, { x: 0.5, y: 0.5 }, context);
  }
}

function draw() {
  ctx.fillStyle = themeTokens.boardBg;
  ctx.fillRect(0, 0, COLS, ROWS);
  drawGrid();
  drawMatrix(board, { x: 0, y: 0 }, ctx);
  drawGhost();
  drawMatrix(player.matrix, player.pos, ctx);

  drawPreview(nextCtx, player.next);
  drawPreview(holdCtx, holdPiece);
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!isPaused && !isGameOver && !isWin) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

function togglePause() {
  if (isGameOver || isWin) {
    resetGame();
  }
  hasStarted = true;
  isPaused = !isPaused;
  statusEl.textContent = isPaused ? "Paused" : "Playing";
  toggleBtn.textContent = isPaused ? "Resume" : "Pause";
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
  isPaused = false;
  hasStarted = true;
  holdPiece = null;
  holdUsed = false;
  updateGameOverUI(false);
  updateWinUI(false);
  statusEl.textContent = "Playing";
  toggleBtn.textContent = "Pause";
  updateStats();
  resetPlayer();
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

themeSelect.addEventListener("change", (event) => {
  applyTheme(event.target.value);
});

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

  if (event.code === "KeyP") {
    if (!hasStarted) return;
    togglePause();
  }

  if (event.code === "KeyM") {
    setSoundEnabled(!soundEnabled);
  }

  if (event.code === "KeyR") {
    resetGame();
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

resizeCanvases();
window.addEventListener("resize", () => {
  resizeCanvases();
});

const savedTheme = localStorage.getItem(THEME_KEY) || "minimal";
themeSelect.value = savedTheme;
applyTheme(savedTheme);

updateStats();
setSoundEnabled(soundEnabled);
draw();
update();

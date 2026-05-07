/* ─── State ─────────────────────────────────────────────────────────────── */
let state = {
  baseWord:     '',
  hint:         '',
  tileOrder:    [],
  selected:     [],
  found:        new Set(),
  score:        0,
  timerSecs:    180,
  timerHandle:  null,
  running:      false,
};

/* ─── Normalise (strip accents, uppercase) ──────────────────────────────── */
function normalise(str) {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ·]/g, '');
}

/* ─── Letter availability check ─────────────────────────────────────────── */
function canForm(word, base) {
  const counts = {};
  for (const ch of base) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of word) {
    if (!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}

/* ─── Validation ─────────────────────────────────────────────────────────── */
function validate(raw) {
  const word = normalise(raw);
  if (word.length < 3)                return { ok: false, msg: "Massa curta! (mínim 3 lletres)" };
  if (!canForm(word, state.baseWord)) return { ok: false, msg: "Lletres no disponibles" };
  if (!DICTIONARY.has(word))          return { ok: false, msg: "No és al diccionari" };
  if (state.found.has(word))          return { ok: false, msg: "Ja l'has trobada!" };
  return { ok: true, word };
}

/* ─── Timer ──────────────────────────────────────────────────────────────── */
function startTimer() {
  state.timerHandle = setInterval(() => {
    state.timerSecs--;
    renderTimer();
    if (state.timerSecs <= 0) endGame();
  }, 1000);
}

function renderTimer() {
  const el = document.getElementById('timer');
  const m  = Math.floor(state.timerSecs / 60);
  const s  = state.timerSecs % 60;
  el.textContent = `${m}:${String(s).padStart(2, '0')}`;
  el.classList.toggle('urgent', state.timerSecs <= 30);
}

/* ─── Tile rendering ─────────────────────────────────────────────────────── */
function renderBaseTiles() {
  const container = document.getElementById('base-tiles');
  container.innerHTML = '';
  container.className = 'base-tiles' + (state.baseWord.length >= 9 ? ' long' : '');

  state.tileOrder.forEach((origIdx) => {
    const letter = state.baseWord[origIdx];
    const tile   = document.createElement('button');
    tile.className    = 'tile';
    tile.textContent  = letter;
    tile.dataset.idx  = origIdx;
    tile.setAttribute('aria-label', `Lletra ${letter}`);
    tile.addEventListener('click', () => onTileClick(origIdx));
    container.appendChild(tile);
  });
  updateTileStates();
}

function getTileElement(origIdx) {
  return document.querySelector(`.tile[data-idx="${origIdx}"]`);
}

function updateTileStates() {
  const usedIdxSet = new Set(state.selected.map(s => s.tileIdx));
  state.tileOrder.forEach(origIdx => {
    const el = getTileElement(origIdx);
    if (!el) return;
    const isUsed = usedIdxSet.has(origIdx);
    el.classList.toggle('selected', isUsed);
    el.classList.remove('used');
    el.disabled = isUsed;
  });
}

/* ─── Current word rendering ─────────────────────────────────────────────── */
function renderCurrentWord() {
  const container = document.getElementById('current-word');
  container.innerHTML = '';

  if (state.selected.length === 0) {
    const hint = document.createElement('span');
    hint.className = 'hint-text';
    hint.textContent = 'Toca les lletres per formar una paraula';
    container.appendChild(hint);
    return;
  }

  state.selected.forEach((sel, pos) => {
    const tile = document.createElement('button');
    tile.className   = 'cur-tile';
    tile.textContent = sel.letter;
    tile.setAttribute('aria-label', `Elimina ${sel.letter}`);
    tile.addEventListener('click', () => removeLetter(pos));
    container.appendChild(tile);
  });
}

/* ─── Tile interaction ───────────────────────────────────────────────────── */
function onTileClick(origIdx) {
  if (!state.running) return;
  const letter = state.baseWord[origIdx];
  state.selected.push({ letter, tileIdx: origIdx });
  updateTileStates();
  renderCurrentWord();
  clearMessage();
}

function removeLetter(pos) {
  state.selected.splice(pos, 1);
  updateTileStates();
  renderCurrentWord();
}

function clearSelection() {
  state.selected = [];
  updateTileStates();
  renderCurrentWord();
}

/* ─── Submit ─────────────────────────────────────────────────────────────── */
function submitWord() {
  if (!state.running || state.selected.length === 0) return;

  const raw    = state.selected.map(s => s.letter).join('');
  const result = validate(raw);

  if (!result.ok) {
    showMessage(result.msg, 'err');
    shakeCurrentWord();
    return;
  }

  const word = result.word;
  const pts  = getScore(word.length);
  state.found.add(word);
  state.score += pts;

  clearSelection();
  updateScore();
  addFoundWord(word, pts);
  updateProgress();
  showMessage(`+${pts} punt${pts !== 1 ? 's' : ''}  ✓`, 'ok');
}

/* ─── Found words list ───────────────────────────────────────────────────── */
function addFoundWord(word, pts) {
  const list = document.getElementById('found-list');
  const el   = document.createElement('div');
  el.className = `found-word len-${word.length}`;
  el.innerHTML = `<span>${word}</span><span class="pts">${pts}pt</span>`;
  list.prepend(el);
}

/* ─── Score & progress ───────────────────────────────────────────────────── */
function updateScore() {
  document.getElementById('score').textContent = state.score;
}

function updateProgress() {
  const total  = state.found.size;
  const target = Math.max(1, Math.floor(state.baseWord.length * 1.2));
  const pct    = Math.min(100, Math.round((total / target) * 100));
  document.getElementById('progress-fill').style.width  = pct + '%';
  document.getElementById('progress-label').textContent = `${total} paraula${total !== 1 ? 'es' : ''}`;
}

/* ─── Messages ───────────────────────────────────────────────────────────── */
function showMessage(text, type = 'info') {
  const el = document.getElementById('message');
  el.textContent  = text;
  el.className    = `message-area ${type}`;
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.textContent = ''; el.className = 'message-area'; }, 2000);
}

function clearMessage() {
  const el = document.getElementById('message');
  clearTimeout(el._timeout);
  el.textContent = '';
  el.className   = 'message-area';
}

function shakeCurrentWord() {
  const el = document.getElementById('current-word');
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

/* ─── Game flow ──────────────────────────────────────────────────────────── */
function startGame() {
  const entry       = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)];
  state.baseWord    = entry.word;
  state.hint        = entry.hint;
  state.tileOrder   = shuffle([...Array(entry.word.length).keys()]);
  state.selected    = [];
  state.found       = new Set();
  state.score       = 0;
  state.timerSecs   = 180;
  state.running     = true;

  updateScore();
  renderTimer();
  renderBaseTiles();
  renderCurrentWord();
  updateProgress();
  clearMessage();
  document.getElementById('found-list').innerHTML = '';
  document.getElementById('overlay-start').classList.add('hidden');
  document.getElementById('overlay-gameover').classList.add('hidden');

  clearInterval(state.timerHandle);
  startTimer();
}

function endGame() {
  clearInterval(state.timerHandle);
  state.running = false;

  const missed = findMissedWords().slice(0, 10);

  document.getElementById('final-score').textContent = state.score;
  document.getElementById('final-words').textContent = state.found.size;

  const missedContainer = document.getElementById('missed-words');
  const missedLabel     = document.getElementById('missed-label');
  missedContainer.innerHTML = '';

  if (missed.length > 0) {
    missedLabel.textContent = 'Paraules que et van escapar';
    missed.forEach(w => {
      const el = document.createElement('span');
      el.className   = 'missed-word';
      el.textContent = w;
      missedContainer.appendChild(el);
    });
  } else {
    missedLabel.textContent = 'Increïble! Ho has trobat tot!';
  }

  document.getElementById('overlay-gameover').classList.remove('hidden');
}

function findMissedWords() {
  const missed = [];
  for (const word of DICTIONARY) {
    if (state.found.has(word)) continue;
    if (word.length < 3 || word.length > 7) continue;
    if (canForm(word, state.baseWord)) missed.push(word);
    if (missed.length >= 15) break;
  }
  return missed.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

/* ─── Utilities ──────────────────────────────────────────────────────────── */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─── Keyboard support ───────────────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (!state.running) return;
  if (e.key === 'Enter')     { submitWord(); return; }
  if (e.key === 'Backspace') {
    if (state.selected.length > 0) removeLetter(state.selected.length - 1);
    return;
  }
  if (e.key === 'Escape') { clearSelection(); return; }

  const ch = normalise(e.key);
  if (!/^[A-Z]$/.test(ch)) return;

  const usedIdxSet = new Set(state.selected.map(s => s.tileIdx));
  const origIdx = state.tileOrder.find(
    i => state.baseWord[i] === ch && !usedIdxSet.has(i)
  );
  if (origIdx !== undefined) onTileClick(origIdx);
});

/* ─── Wire up buttons ────────────────────────────────────────────────────── */
document.getElementById('btn-clear').addEventListener('click', clearSelection);
document.getElementById('btn-submit').addEventListener('click', submitWord);
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-newgame').addEventListener('click', startGame);
document.getElementById('btn-shuffle').addEventListener('click', () => {
  if (!state.running) return;
  clearSelection();
  shuffle(state.tileOrder);
  renderBaseTiles();
});
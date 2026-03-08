/**
 * Songmaker — app.js
 * Handles state, rendering and localStorage persistence.
 */

const STORAGE_KEY = 'songmaker_data';

// ── Default state ────────────────────────────────────────
function defaultState() {
  return {
    title:  '',
    artist: '',
    key:    '',
    mode:   '',
    bpm:    '',
    genre:  '',
    lyrics: [
      { id: uid(), label: 'Verse 1',  text: '' },
      { id: uid(), label: 'Chorus',   text: '' },
    ],
    notes: '',
  };
}

// ── Tiny unique-id helper (timestamp + random suffix) ────
let _uidCounter = 0;
function uid() {
  return Date.now().toString(36) + (++_uidCounter).toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── State ────────────────────────────────────────────────
let state = load();

// ── DOM refs ─────────────────────────────────────────────
const elTitle       = document.getElementById('song-title');
const elArtist      = document.getElementById('song-artist');
const elKey         = document.getElementById('song-key');
const elMode        = document.getElementById('song-mode');
const elBpm         = document.getElementById('song-bpm');
const elGenre       = document.getElementById('song-genre');
const elLyricsList  = document.getElementById('lyrics-sections');
const elNotes       = document.getElementById('notes-area');
const elBtnSave     = document.getElementById('btn-save');
const elBtnNew      = document.getElementById('btn-new');
const elBtnAdd      = document.getElementById('btn-add-section');
const elTemplate    = document.getElementById('section-template');
const elToast       = document.getElementById('toast');

// ── Initialise UI from state ─────────────────────────────
function init() {
  elTitle.value  = state.title;
  elArtist.value = state.artist;
  elKey.value    = state.key;
  elMode.value   = state.mode;
  elBpm.value    = state.bpm;
  elGenre.value  = state.genre;
  elNotes.value  = state.notes;
  renderLyrics();
}

// ── Render lyric blocks ──────────────────────────────────
function renderLyrics() {
  elLyricsList.innerHTML = '';
  state.lyrics.forEach(section => {
    elLyricsList.appendChild(createLyricBlock(section));
  });
}

function createLyricBlock(section) {
  const block = document.createElement('div');
  block.className = 'lyric-block';
  block.dataset.id = section.id;

  // Header
  const header = document.createElement('div');
  header.className = 'lyric-block-header';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'lyric-block-label';
  labelInput.value = section.label;
  labelInput.setAttribute('aria-label', 'Section name');
  labelInput.addEventListener('input', () => {
    updateSection(section.id, { label: labelInput.value });
  });

  const btnDel = document.createElement('button');
  btnDel.className = 'btn btn-danger';
  btnDel.textContent = '✕';
  btnDel.setAttribute('aria-label', 'Remove section');
  btnDel.addEventListener('click', () => {
    removeSection(section.id);
  });

  header.appendChild(labelInput);
  header.appendChild(btnDel);

  // Text area
  const ta = document.createElement('textarea');
  ta.placeholder = 'Write your lyrics here…';
  ta.value = section.text;
  ta.setAttribute('aria-label', section.label + ' lyrics');
  ta.addEventListener('input', () => {
    updateSection(section.id, { text: ta.value });
  });

  block.appendChild(header);
  block.appendChild(ta);
  return block;
}

// ── Section mutations ────────────────────────────────────
function updateSection(id, patch) {
  state.lyrics = state.lyrics.map(s => s.id === id ? { ...s, ...patch } : s);
}

function removeSection(id) {
  state.lyrics = state.lyrics.filter(s => s.id !== id);
  renderLyrics();
}

function addSection(label) {
  const section = { id: uid(), label, text: '' };
  state.lyrics.push(section);
  elLyricsList.appendChild(createLyricBlock(section));
  // Scroll the new block into view
  elLyricsList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Collect current form values into state ───────────────
function collectState() {
  state.title  = elTitle.value.trim();
  state.artist = elArtist.value.trim();
  state.key    = elKey.value;
  state.mode   = elMode.value;
  state.bpm    = elBpm.value;
  state.genre  = elGenre.value.trim();
  state.notes  = elNotes.value;
  // lyrics already updated via event listeners
}

// ── Persistence ──────────────────────────────────────────
function save() {
  collectState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showToast('✅ Saved!');
  } catch (e) {
    showToast('⚠️ Could not save — storage may be full.');
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return defaultState();
}

function newSong() {
  if (!confirm('Start a new song? This will clear all fields and sections.')) return;
  state = defaultState();
  init();
  showToast('New song started!');
}

// ── Toast notification ────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  elToast.textContent = msg;
  elToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elToast.classList.remove('show'), 2000);
}

// ── Auto-save on input (debounced) ────────────────────────
let autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    collectState();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, 1000);
}

// ── Event listeners ───────────────────────────────────────
elBtnSave.addEventListener('click', save);
elBtnNew.addEventListener('click', newSong);
elBtnAdd.addEventListener('click', () => {
  addSection(elTemplate.value);
});

// Keyboard shortcut: Ctrl+S / Cmd+S
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
});

// Auto-save on every change
[elTitle, elArtist, elKey, elMode, elBpm, elGenre, elNotes].forEach(el => {
  el.addEventListener('input', scheduleAutoSave);
});

// Delegate auto-save for dynamic lyric textareas / label inputs
elLyricsList.addEventListener('input', scheduleAutoSave);

// ── Boot ──────────────────────────────────────────────────
init();

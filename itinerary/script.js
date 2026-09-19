// EDIT ME: change this to whatever numeric password you want to type in to unlock each game (digits only).
const UNLOCK_PASSWORD = '7771';

const NEW_COUNTRIES_NEEDED = 5;

const STORAGE_KEYS = {
  unlocked: 'itineraryUnlockedFlags',
  found: 'itineraryFoundCountries',
  pending: 'itineraryPendingNew',
  passwordVerifiedIndices: 'itineraryPasswordVerifiedIndices'
};

// barWidth only affects the blurred placeholder shown while an activity is locked.
const activities = [
  { label: '9:00am: Surprise item', unlocked: false, barWidth: '75%' },
  { label: '9:00am: Foot + full body massage', unlocked: false, barWidth: '85%' },
  { label: '9:30am: Cuddle break', unlocked: false, barWidth: '55%' },
  { label: "10:30am: Breakfast at Beth's Cafe", unlocked: false, barWidth: '85%' },
  { label: '12:00pm: Pedicure', unlocked: false, barWidth: '50%' },
  { label: '1:00pm: Fashion show shopping', unlocked: false, barWidth: '88%' },
  { label: '4:15pm: Dinner', unlocked: false, barWidth: '42%' },
  { label: '5:30pm: Cuddle break', unlocked: false, barWidth: '55%' },
  { label: '6:30pm: Bubble bath', unlocked: false, barWidth: '52%' },
  { label: "7:30pm: Ice cream @ Frankie and Joe's", unlocked: false, barWidth: '90%' },
  { label: '8:00pm: Watch Hank Green cancer video', unlocked: false, barWidth: '90%' }
];

function loadUnlockedFlags() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.unlocked);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    // ignore
  }
  return activities.map(() => false);
}

function saveUnlockedFlags(flags) {
  try {
    localStorage.setItem(STORAGE_KEYS.unlocked, JSON.stringify(flags));
  } catch (e) {
    // ignore
  }
}

function loadFoundCountries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.found);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    // ignore
  }
  return new Set();
}

function saveFoundCountries(set) {
  try {
    localStorage.setItem(STORAGE_KEYS.found, JSON.stringify([...set]));
  } catch (e) {
    // ignore
  }
}

function loadPendingNew() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pending);
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return n;
  } catch (e) {
    // ignore
  }
  return 0;
}

function savePendingNew(n) {
  try {
    localStorage.setItem(STORAGE_KEYS.pending, String(n));
  } catch (e) {
    // ignore
  }
}

function loadPasswordVerifiedIndices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.passwordVerifiedIndices);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    // ignore
  }
  return new Set();
}

function savePasswordVerifiedIndices(set) {
  try {
    localStorage.setItem(STORAGE_KEYS.passwordVerifiedIndices, JSON.stringify([...set]));
  } catch (e) {
    // ignore
  }
}

// Apply persisted unlock state onto the activities array.
const savedFlags = loadUnlockedFlags();
activities.forEach((activity, i) => {
  activity.unlocked = !!savedFlags[i];
});

let foundCountries = loadFoundCountries();
let pendingNew = loadPendingNew();
let passwordVerifiedIndices = loadPasswordVerifiedIndices();

const list = document.getElementById('activityList');

function firstLockedIndex() {
  return activities.findIndex((a) => !a.unlocked);
}

function render() {
  list.innerHTML = '';
  const activeIndex = firstLockedIndex();

  activities.forEach((activity, i) => {
    const li = document.createElement('li');
    li.className = 'activity ' + (activity.unlocked ? 'unlocked' : 'locked');

    const icon = document.createElement('img');
    icon.className = 'icon';
    icon.src = activity.unlocked
      ? '../assets/unlock-drawing.png'
      : '../assets/lock-drawing.png';
    icon.alt = activity.unlocked ? 'Unlocked' : 'Locked';

    li.appendChild(icon);

    if (activity.unlocked) {
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = activity.label;
      li.appendChild(label);
    } else {
      const bar = document.createElement('span');
      bar.className = 'locked-bar';
      bar.style.width = activity.barWidth || '65%';
      li.appendChild(bar);

      if (i === activeIndex) {
        li.classList.add('clickable');
        li.addEventListener('click', () => openIntroModal(i));
      }
    }

    list.appendChild(li);
  });
}

// --- Intro modal ---

const introModal = document.getElementById('introModal');
const introUnderstandBtn = document.getElementById('introUnderstandBtn');
let pendingActivityIndex = null;

function openIntroModal(index) {
  pendingActivityIndex = index;
  introModal.hidden = false;
}

introUnderstandBtn.addEventListener('click', () => {
  introModal.hidden = true;
  if (passwordVerifiedIndices.has(pendingActivityIndex)) {
    activeActivityIndex = pendingActivityIndex;
    openGameModal();
  } else {
    openPasswordModal(pendingActivityIndex);
  }
});

// --- Password modal (numeric keypad) ---

const passwordModal = document.getElementById('passwordModal');
const passwordDots = document.getElementById('passwordDots');
const passwordError = document.getElementById('passwordError');
const passwordCancelBtn = document.getElementById('passwordCancelBtn');
const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
const keypad = document.getElementById('keypad');
const keypadClear = document.getElementById('keypadClear');
const keypadBackspace = document.getElementById('keypadBackspace');

let activeActivityIndex = null;
let enteredDigits = '';

const PASSWORD_MAX_LENGTH = Math.max(UNLOCK_PASSWORD.length, 8);

function renderPasswordDots() {
  passwordDots.innerHTML = '';
  const dotCount = Math.max(enteredDigits.length, UNLOCK_PASSWORD.length);
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i < enteredDigits.length ? '' : ' empty');
    passwordDots.appendChild(dot);
  }
}

function openPasswordModal(index) {
  activeActivityIndex = index;
  enteredDigits = '';
  passwordError.hidden = true;
  renderPasswordDots();
  passwordModal.hidden = false;
}

function closePasswordModal() {
  passwordModal.hidden = true;
}

passwordCancelBtn.addEventListener('click', closePasswordModal);

function submitPassword() {
  if (enteredDigits === UNLOCK_PASSWORD) {
    passwordVerifiedIndices.add(activeActivityIndex);
    savePasswordVerifiedIndices(passwordVerifiedIndices);
    closePasswordModal();
    openGameModal();
  } else {
    passwordError.hidden = false;
    enteredDigits = '';
    renderPasswordDots();
  }
}

passwordSubmitBtn.addEventListener('click', submitPassword);

keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('.keypad-btn');
  if (!btn) return;

  passwordError.hidden = true;

  if (btn.dataset.digit !== undefined) {
    if (enteredDigits.length < PASSWORD_MAX_LENGTH) {
      enteredDigits += btn.dataset.digit;
      renderPasswordDots();
    }
  }
});

keypadBackspace.addEventListener('click', () => {
  passwordError.hidden = true;
  enteredDigits = enteredDigits.slice(0, -1);
  renderPasswordDots();
});

keypadClear.addEventListener('click', () => {
  passwordError.hidden = true;
  enteredDigits = '';
  renderPasswordDots();
});

document.addEventListener('keydown', (e) => {
  if (passwordModal.hidden) return;
  if (e.key >= '0' && e.key <= '9') {
    if (enteredDigits.length < PASSWORD_MAX_LENGTH) {
      passwordError.hidden = true;
      enteredDigits += e.key;
      renderPasswordDots();
    }
  } else if (e.key === 'Backspace') {
    passwordError.hidden = true;
    enteredDigits = enteredDigits.slice(0, -1);
    renderPasswordDots();
  } else if (e.key === 'Enter') {
    submitPassword();
  }
});

// --- World map ---

const worldMapContainer = document.getElementById('worldMapContainer');
let worldMapReady = false;

function highlightCountryOnMap(name) {
  const iso = COUNTRY_ISO.get(name);
  if (!iso) return; // this map doesn't include every microstate — see countries.js
  const el = document.getElementById(iso);
  if (!el) return;
  el.classList.add('found');
  el.querySelectorAll('path').forEach((p) => p.classList.add('found'));
}

fetch('../assets/world-map.svg')
  .then((r) => r.text())
  .then((svgText) => {
    worldMapContainer.innerHTML = svgText;
    worldMapReady = true;
    foundCountries.forEach(highlightCountryOnMap);
  })
  .catch(() => {
    // Map is decorative — if it fails to load, the counter/list still work fine.
  });

// --- Game modal ---

const gameModal = document.getElementById('gameModal');
const gameRoundProgress = document.getElementById('gameRoundProgress');
const countryInput = document.getElementById('countryInput');
const gameFeedback = document.getElementById('gameFeedback');
const gameCancelBtn = document.getElementById('gameCancelBtn');
const gameContinueBtn = document.getElementById('gameContinueBtn');
const gameTotalFound = document.getElementById('gameTotalFound');
const foundCountriesList = document.getElementById('foundCountriesList');

let feedbackTimeout = null;

function updateGameUI() {
  gameRoundProgress.textContent = pendingNew + ' / ' + NEW_COUNTRIES_NEEDED + ' new countries';
  gameTotalFound.textContent = foundCountries.size + ' / ' + TOTAL_COUNTRIES + ' countries found so far';

  foundCountriesList.innerHTML = '';
  [...foundCountries].reverse().forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    foundCountriesList.appendChild(li);
  });
}

function showFeedback(message) {
  gameFeedback.textContent = message;
  gameFeedback.hidden = false;
  if (feedbackTimeout) clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => {
    gameFeedback.hidden = true;
  }, 1600);
}

function openGameModal() {
  countryInput.value = '';
  countryInput.hidden = false;
  gameCancelBtn.hidden = false;
  gameContinueBtn.hidden = true;
  updateGameUI();
  gameModal.hidden = false;
  countryInput.focus();
}

function closeGameModal() {
  gameModal.hidden = true;
  activeActivityIndex = null;
}

gameCancelBtn.addEventListener('click', closeGameModal);

let lastUnlockedLabel = null;

gameContinueBtn.addEventListener('click', () => {
  closeGameModal();
  openCelebrationModal(lastUnlockedLabel);
});

const SKIP_SECRET = 'SKIP_SECRET';

function completeRound() {
  if (activeActivityIndex === null) return;
  const unlockedActivity = activities[activeActivityIndex];
  unlockedActivity.unlocked = true;
  saveUnlockedFlags(activities.map((a) => a.unlocked));
  pendingNew = 0;
  savePendingNew(pendingNew);

  lastUnlockedLabel = unlockedActivity.label + '!';
  countryInput.hidden = true;
  gameCancelBtn.hidden = true;
  gameContinueBtn.hidden = false;
}

function submitCountry() {
  const value = countryInput.value;
  if (!value.trim()) return;

  if (value.trim() === SKIP_SECRET) {
    countryInput.value = '';
    pendingNew = NEW_COUNTRIES_NEEDED;
    savePendingNew(pendingNew);
    updateGameUI();
    completeRound();
    return;
  }

  const match = matchCountry(value);
  countryInput.value = '';

  if (!match) {
    showFeedback('Not recognized, check spelling');
    return;
  }

  if (foundCountries.has(match)) {
    showFeedback(match + ' already found!');
    return;
  }

  foundCountries.add(match);
  saveFoundCountries(foundCountries);
  highlightCountryOnMap(match);
  pendingNew += 1;
  savePendingNew(pendingNew);
  showFeedback(match + ' ✓');
  updateGameUI();

  if (pendingNew >= NEW_COUNTRIES_NEEDED) {
    completeRound();
  }
}

countryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitCountry();
});

// --- Celebration modal ---

const celebrationModal = document.getElementById('celebrationModal');
const celebrationActivityLabel = document.getElementById('celebrationActivityLabel');
const celebrationContinueBtn = document.getElementById('celebrationContinueBtn');
const confettiLayer = document.getElementById('confettiLayer');

const CONFETTI_COLORS = ['#e8763c', '#2a7a3b', '#4a90d9', '#e63946', '#f2c94c', '#9b59b6', '#f2994a'];

function launchConfetti() {
  confettiLayer.innerHTML = '';
  const pieceCount = 220;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.width = 6 + Math.random() * 6 + 'px';
    piece.style.height = 10 + Math.random() * 8 + 'px';
    piece.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
    piece.style.animationDelay = Math.random() * 1.2 + 's';
    confettiLayer.appendChild(piece);
  }
}

function openCelebrationModal(label) {
  celebrationActivityLabel.textContent = label || '';
  celebrationModal.hidden = false;
  launchConfetti();
}

function closeCelebrationModal() {
  celebrationModal.hidden = true;
  confettiLayer.innerHTML = '';
}

celebrationContinueBtn.addEventListener('click', () => {
  closeCelebrationModal();
  render();
});

render();

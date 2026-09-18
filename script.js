const cardScene = document.getElementById('cardScene');
const cardFlip = document.getElementById('cardFlip');
const flipBtn = document.getElementById('flipBtn');
const cardBack = document.querySelector('.card-back');
const cardBackText = document.querySelector('.card-back p');

// --- Countdown gate ---

const COUNTDOWN_TARGET = new Date('2026-09-20T09:00:00-07:00'); // 9am Pacific

const countdownScene = document.getElementById('countdownScene');
const cardArea = document.getElementById('cardArea');
const bgPhoto = document.getElementById('bgPhoto');
const bgPhotoBlur = document.getElementById('bgPhotoBlur');
const cdDays = document.getElementById('cdDays');
const cdHours = document.getElementById('cdHours');
const cdMinutes = document.getElementById('cdMinutes');
const cdSeconds = document.getElementById('cdSeconds');

function pad(n) {
  return String(n).padStart(2, '0');
}

function revealCard() {
  countdownScene.hidden = true;
  cardArea.hidden = false;
  bgPhoto.src = 'assets/us-photo-1.jpg';
  bgPhotoBlur.src = 'assets/us-photo-1.jpg';
}

let countdownInterval = null;

function tickCountdown() {
  const remaining = COUNTDOWN_TARGET - new Date();

  if (remaining <= 0) {
    clearInterval(countdownInterval);
    revealCard();
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  cdDays.textContent = pad(days);
  cdHours.textContent = pad(hours);
  cdMinutes.textContent = pad(minutes);
  cdSeconds.textContent = pad(seconds);
}

if (COUNTDOWN_TARGET - new Date() <= 0) {
  revealCard();
} else {
  tickCountdown();
  countdownInterval = setInterval(tickCountdown, 1000);
}

// EDIT ME: keep this in sync with UNLOCK_PASSWORD in itinerary/script.js if you change it there.
const SKIP_PASSWORD = '7771';

const skipCountdownBtn = document.getElementById('skipCountdownBtn');
skipCountdownBtn.addEventListener('click', () => {
  const entered = window.prompt('Enter password to skip the countdown:');
  if (entered === null) return;
  if (entered === SKIP_PASSWORD) {
    clearInterval(countdownInterval);
    revealCard();
  } else {
    window.alert('Incorrect password.');
  }
});

function fitCardBackText() {
  const maxSize = window.innerWidth >= 700 ? 1.7 : 1.15;
  const minSize = 0.75;
  const step = 0.05;
  const cap = window.innerHeight * 0.62; // matches .card-back's max-height
  let size = maxSize;
  cardBackText.style.fontSize = size + 'rem';

  while (size > minSize && cardBack.scrollHeight > cap) {
    size -= step;
    cardBackText.style.fontSize = size + 'rem';
  }
}

// Measuring before the Quicksand webfont finishes loading fits against the
// fallback font's (different) metrics, so explicitly wait on the exact font/weight.
async function fitCardBackTextWhenFontReady() {
  if (document.fonts && document.fonts.load) {
    try {
      await Promise.all([
        document.fonts.load('600 1.15rem Quicksand'),
        document.fonts.ready
      ]);
    } catch (e) {
      // ignore — fall through and fit with whatever font is available
    }
  }
  fitCardBackText();
}

fitCardBackTextWhenFontReady();
window.addEventListener('resize', fitCardBackText);

cardScene.addEventListener('animationend', (e) => {
  if (e.animationName === 'cardIntro') {
    cardFlip.classList.add('idle-tilt');
    flipBtn.classList.add('visible');
  }
});

let flipped = false;

flipBtn.addEventListener('click', () => {
  if (!flipped) {
    flipped = true;
    cardFlip.classList.remove('idle-tilt');
    flipBtn.textContent = "Sounds good, take me to the itinerary!";

    // Lock in the current (front-card) height explicitly so we can transition
    // from it — height can't animate from an aspect-ratio-derived value otherwise.
    cardScene.style.height = cardScene.offsetHeight + 'px';
    fitCardBackText();
    const targetHeight = cardBack.scrollHeight;

    // Force a reflow, then flip/grow on the next frame so the browser reliably
    // picks up both transitions instead of coalescing them with the changes above.
    void cardFlip.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardFlip.classList.add('flipped');
        cardScene.style.height = targetHeight + 'px';
      });
    });
  } else {
    window.location.href = 'itinerary/index.html';
  }
});

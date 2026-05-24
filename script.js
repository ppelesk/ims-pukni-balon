"use strict";

const gameArea = document.getElementById('game-area');
const targetLetterEl = document.getElementById('target-letter');
const currentScoreEl = document.getElementById('current-score');
const startScreen = document.getElementById('start-screen');
const totalStarsDisplay = document.getElementById('total-stars-display');
const uiBar = document.getElementById('ui-bar');
const progressBar = document.getElementById('progress-bar');
const roundDisplay = document.getElementById('round-display');
const roundMessage = document.getElementById('round-message');
const settingsBtn = document.getElementById('open-settings-btn');
const settingsGameBtn = document.getElementById('open-settings-game-btn');
const settingsScreen = document.getElementById('settings-screen');
const settingsFontSelect = document.getElementById('settings-font-select');
const settingsFontSizeSelect = document.getElementById('settings-font-size-select');
const settingsThemeSelect = document.getElementById('settings-theme-select');

const settingsSaveBtn = document.getElementById('settings-save-btn');
const settingsCancelBtn = document.getElementById('settings-cancel-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const helpBtn = document.getElementById('open-help-btn');
const helpScreen = document.getElementById('help-screen');
const helpCloseBtn = document.getElementById('help-close-btn');

const charsEasy = "ABCDEFGHIJKLMNOPQRSTUVWXYZĐŽŠĆČ".split('');
const charsMedium = "abcdefghijklmnopqrstuvwxyzšđžćč".split('');
const charsHard = "ABCDEFGHIJKLMNOPQRSTUVWXYZĐŽŠĆČšđžćčabcdefghijklmnopqrstuvwxyz0123456789".split('');
const settingsKey = 'pukniBalonSettings';
const starsKey = 'svemirskaSlovaZvijezde';

const fontMap = {
  open: '"OpenDyslexicCustom", Arial, sans-serif',
  arial: 'Arial, sans-serif',
  comic: '"Comic Sans MS", Comic Sans, sans-serif',
};

const fontSizeMap = {
  small: 16,
  medium: 18,
  large: 22,
};

const defaultSettings = {
  font: 'open',
  size: 'medium',
  theme: 'default',
};

let activeChars = [];
let currentScore = 0;
let targetLetter = '';
let currentRound = 1;
let totalCorrectInRound = 0;
let poppedInRound = 0;
let totalStars = loadStars();
let gameSettings = loadSettings();
let roundTimeout = null;

function loadStars() {
  const value = localStorage.getItem(starsKey);
  return value ? parseInt(value, 10) : 0;
}

function saveStars() {
  localStorage.setItem(starsKey, totalStars.toString());
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(settingsKey);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(gameSettings));
}

function applySettings() {
  const fontFamily = fontMap[gameSettings.font] || fontMap.open;
  const fontSize = fontSizeMap[gameSettings.size] || fontSizeMap.medium;

  document.body.style.fontFamily = fontFamily;
  document.documentElement.style.fontSize = `${fontSize}px`;

  document.body.classList.remove('theme-daltonist', 'theme-highcontrast', 'theme-bw');
  if (gameSettings.theme !== 'default') {
    document.body.classList.add(`theme-${gameSettings.theme}`);
  }

  settingsFontSelect.value = gameSettings.font;
  settingsFontSizeSelect.value = gameSettings.size;
  settingsThemeSelect.value = gameSettings.theme;
}

function openSettings() {
  settingsFontSelect.value = gameSettings.font;
  settingsFontSizeSelect.value = gameSettings.size;
  settingsThemeSelect.value = gameSettings.theme;
  settingsScreen.classList.remove('hidden');
  settingsScreen.setAttribute('aria-hidden', 'false');
}

function closeSettings() {
  settingsScreen.classList.add('hidden');
  settingsScreen.setAttribute('aria-hidden', 'true');
}

function saveSettingsFromUi() {
  gameSettings.font = settingsFontSelect.value;
  gameSettings.size = settingsFontSizeSelect.value;
  gameSettings.theme = settingsThemeSelect.value;
  saveSettings();
  applySettings();
  closeSettings();
}


settingsBtn.addEventListener('click', openSettings);
settingsGameBtn.addEventListener('click', openSettings);
settingsSaveBtn.addEventListener('click', saveSettingsFromUi);
settingsCancelBtn.addEventListener('click', closeSettings);

function returnToMenu() {
  if (roundTimeout) {
    clearTimeout(roundTimeout);
    roundTimeout = null;
  }
  roundMessage.style.opacity = '0';
  uiBar.style.display = 'none';
  gameArea.innerHTML = '';
  startScreen.style.display = 'flex';
  totalStarsDisplay.textContent = totalStars;
}

backToMenuBtn.addEventListener('click', returnToMenu);

function openHelp() {
  helpScreen.classList.remove('hidden');
  helpScreen.setAttribute('aria-hidden', 'false');
}

function closeHelp() {
  helpScreen.classList.add('hidden');
  helpScreen.setAttribute('aria-hidden', 'true');
}

helpBtn.addEventListener('click', openHelp);
helpCloseBtn.addEventListener('click', closeHelp);

applySettings();
totalStarsDisplay.textContent = totalStars;

function startGame(difficulty) {
  if (difficulty === 'easy') activeChars = charsEasy;
  else if (difficulty === 'medium') activeChars = charsMedium;
  else activeChars = charsHard;

  startScreen.style.display = 'none';
  uiBar.style.display = 'flex';
  currentScore = 0;
  currentRound = 1;
  currentScoreEl.textContent = currentScore;

  spawnRound();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function updateProgressBar() {
  const percentage = totalCorrectInRound === 0 ? 0 : (poppedInRound / totalCorrectInRound) * 100;
  progressBar.style.width = `${percentage}%`;
}

function getThemeConfettiColors() {
  const style = getComputedStyle(document.documentElement);
  return [1, 2, 3, 4, 5].map((n) => style.getPropertyValue(`--balloon-${n}`).trim()).filter(Boolean);
}

function createConfetti(x, y) {
  const colors = getThemeConfettiColors();
  for (let i = 0; i < 15; i += 1) {
    const particle = document.createElement('div');
    particle.classList.add('confetti-particle');
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${x + (Math.random() - 0.5) * 40}px`;
    particle.style.top = `${y + (Math.random() - 0.5) * 40}px`;
    particle.style.animation = `confettiFall ${0.5 + Math.random() * 0.5}s ease-out forwards`;
    gameArea.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

function spawnRound() {
  gameArea.innerHTML = '';
  roundDisplay.textContent = currentRound;
  poppedInRound = 0;

  const isMobile = window.innerWidth < 600;
  const maxBalloons = isMobile ? 9 : 12;
  const extraBalloons = Math.floor((currentRound - 1) / 3);
  const totalBalloonsThisRound = Math.min(maxBalloons, 3 + extraBalloons);
  totalCorrectInRound = Math.max(1, Math.ceil(totalBalloonsThisRound / 3));

  updateProgressBar();

  targetLetter = activeChars[Math.floor(Math.random() * activeChars.length)];
  targetLetterEl.textContent = targetLetter;

  const balloonLetters = [];
  for (let i = 0; i < totalCorrectInRound; i += 1) {
    balloonLetters.push(targetLetter);
  }

  while (balloonLetters.length < totalBalloonsThisRound) {
    const randomChar = activeChars[Math.floor(Math.random() * activeChars.length)];
    if (randomChar !== targetLetter) {
      balloonLetters.push(randomChar);
    }
  }

  shuffleArray(balloonLetters);

  balloonLetters.forEach((letter) => {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.classList.add(`color-${Math.floor(Math.random() * 5) + 1}`);
    balloon.textContent = letter;
    balloon.dataset.letter = letter;

    balloon.addEventListener('pointerdown', (event) => {
      if (balloon.classList.contains('popped')) return;
      if (balloon.dataset.letter === targetLetter) {
        balloon.classList.add('popped');
        createConfetti(event.clientX, event.clientY);
        poppedInRound += 1;
        currentScore += 1;
        totalStars += 1;
        currentScoreEl.textContent = currentScore;
        totalStarsDisplay.textContent = totalStars;
        saveStars();
        updateProgressBar();
        if (poppedInRound === totalCorrectInRound) {
          endRound();
        }
      } else {
        balloon.classList.add('wrong');
        setTimeout(() => balloon.classList.remove('wrong'), 300);
      }
    });

    gameArea.appendChild(balloon);
  });
}

function endRound() {
  roundMessage.style.opacity = '1';
  roundTimeout = setTimeout(() => {
    roundTimeout = null;
    roundMessage.style.opacity = '0';
    currentRound += 1;
    spawnRound();
  }, 1200);
}

import {
  applyClick,
  applyOfflineGain,
  applyTick,
  awaken,
  createInitialState,
  getClickPower,
  purchaseFacility,
  purchaseUpgrade,
} from './game.js';
import { clearGame, exportGame, importGame, loadGame, saveGame } from './storage.js';
import { createUi } from './ui.js';

let state = loadGame() ?? createInitialState();
let buyMode = '1';
let lastFrame = performance.now();
let lastSave = Date.now();
let audioContext;

const ui = createUi({
  click(event) {
    const gain = getClickPower(state);
    state = applyClick(state);
    ui.floatGain(gain, event);
    playTone(260, 0.035);
    renderAndSave();
  },
  setBuyMode(mode) {
    buyMode = mode;
    document.querySelectorAll('[data-buy-mode]').forEach((button) => {
      const selected = button.dataset.buyMode === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    ui.render(state, buyMode);
  },
  buyFacility(id) {
    const result = purchaseFacility(state, id, buyMode);
    if (!result.purchased) return;
    state = result.state;
    playTone(420, 0.06);
    ui.notify(`${result.purchased}個、ドパ装置へ接続`);
    renderAndSave();
  },
  buyUpgrade(id) {
    const previous = state;
    state = purchaseUpgrade(state, id);
    if (state === previous) return;
    playTone(620, 0.1);
    ui.notify('脳内ブーストを装着');
    renderAndSave();
  },
  awaken() {
    const next = awaken(state);
    if (next === state || !confirm('通常施設と強化をリセットして覚醒しますか？')) return;
    state = next;
    ui.notify('覚醒完了。世界が少し遅く見える。');
    renderAndSave();
  },
  setSetting(name, value) {
    state = { ...state, settings: { ...state.settings, [name]: value } };
    renderAndSave();
  },
  async exportSave() {
    const encoded = exportGame(state);
    try {
      await navigator.clipboard.writeText(encoded);
      ui.notify('セーブ文字列をコピーしました');
    } catch {
      const text = document.getElementById('importText');
      document.getElementById('importBox').hidden = false;
      text.value = encoded;
      text.select();
      ui.notify('文字列を選択しました。手動でコピーしてください。');
    }
  },
  importSave(encoded) {
    try {
      const imported = importGame(encoded);
      state = imported;
      ui.setImportError();
      document.getElementById('settingsDialog').close();
      ui.notify('セーブデータを読み込みました');
      renderAndSave();
    } catch (error) {
      ui.setImportError(error.message);
    }
  },
  reset() {
    if (!confirm('全ての進行を消去します。この操作は取り消せません。')) return;
    clearGame();
    state = createInitialState();
    document.getElementById('settingsDialog').close();
    ui.notify('新しいドパ人生を開始');
    renderAndSave();
  },
});

function renderAndSave() {
  ui.render(state, buyMode);
  try {
    state = saveGame(state);
    lastSave = Date.now();
    document.getElementById('saveStatus').textContent = '自動保存: 完了';
  } catch {
    document.getElementById('saveStatus').textContent = '自動保存: 失敗';
    ui.notify('保存できません。ブラウザのストレージ設定を確認してください。', true);
  }
}

function playTone(frequency, duration) {
  if (!state.settings.sound) return;
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio is optional; browsers may deny it without affecting the game.
  }
}

function frame(now) {
  const seconds = Math.min(1, (now - lastFrame) / 1000);
  lastFrame = now;
  state = applyTick(state, seconds);
  ui.render(state, buyMode);
  if (Date.now() - lastSave >= 10000) renderAndSave();
  requestAnimationFrame(frame);
}

const offline = applyOfflineGain(state);
state = offline.state;
ui.render(state, buyMode);
ui.showOffline(offline.result);
renderAndSave();
requestAnimationFrame(frame);
window.addEventListener('beforeunload', () => {
  try {
    saveGame(state);
  } catch {
    // The page is closing; the in-page save error already explains recovery.
  }
});

// IMP-004 / REQ-BIZ-002, REQ-API-001: local orchestration and visual-only FLOW.
import {
  applyClick,
  applyOfflineGain,
  applyTick,
  awaken,
  createInitialState,
  getClickPower,
  getDps,
  purchaseFacility,
  purchaseUpgrade,
} from './game.js';
import { createEffects } from './effects.js';
import { clearGame, exportGame, importGame, loadGame, saveGame } from './storage.js';
import { createUi } from './ui.js';

let state = loadGame() ?? createInitialState();
let buyMode = '1';
let lastFrame = performance.now();
let lastRender = 0;
let lastSave = Date.now();
let flow = 1;
let lastIgnite = 0;
let flowTimer = 0;
let renderQueued = false;

const effects = createEffects();
const ui = createUi({
  click(event) {
    const now = performance.now();
    flow = now - lastIgnite < 1200 ? Math.min(10, flow + 0.75) : 1;
    lastIgnite = now;
    window.clearTimeout(flowTimer);
    flowTimer = window.setTimeout(resetFlow, 1200);
    const gain = getClickPower(state);
    state = applyClick(state);
    effects.ignite(event, gain, flow);
    effects.setEnergy(flow, getDps(state));
    ui.setFlow(flow);
    ui.floatGain(gain, event, flow);
    scheduleRenderAndSave();
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
  buyFacility(id, source) {
    const result = purchaseFacility(state, id, buyMode);
    if (!result.purchased) return;
    effects.purchase(source);
    state = result.state;
    ui.notify(`${result.purchased} NODE CONNECTED`);
    renderAndSave();
  },
  buyUpgrade(id, source) {
    const previous = state;
    state = purchaseUpgrade(state, id);
    if (state === previous) return;
    effects.purchase(source);
    ui.notify('SYSTEM MOD INSTALLED');
    renderAndSave();
  },
  awaken() {
    const next = awaken(state);
    if (next === state || !confirm('現在のノードとMODをリセットしてASCENDしますか？')) return;
    state = next;
    effects.phase('TIMELINE REBORN', state.awakenCount + 1);
    ui.notify('ASCENSION COMPLETE');
    renderAndSave();
  },
  rankUp(rank) {
    effects.phase(rank.name, rank.index + 1);
  },
  achievement() {
    effects.achievement(document.querySelector('.badge.earned:last-of-type'));
  },
  setSetting(name, value) {
    state = { ...state, settings: { ...state.settings, [name]: value } };
    effects.setEnergy(flow, getDps(state));
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
      state = importGame(encoded);
      ui.setImportError();
      document.getElementById('settingsDialog').close();
      ui.notify('セーブデータを同期しました');
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
    ui.notify('BOOT SEQUENCE RESTARTED');
    resetFlow();
    renderAndSave();
  },
});

function resetFlow() {
  flow = 1;
  ui.setFlow(flow);
  effects.setEnergy(flow, getDps(state));
}

function renderAndSave() {
  renderQueued = false;
  ui.render(state, buyMode);
  effects.setEnergy(flow, getDps(state));
  try {
    state = saveGame(state);
    lastSave = Date.now();
    document.getElementById('saveStatus').textContent = '自動保存: 完了';
  } catch {
    document.getElementById('saveStatus').textContent = '自動保存: 失敗';
    ui.notify('保存できません。ブラウザのストレージ設定を確認してください。', true);
  }
}

function scheduleRenderAndSave() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderAndSave);
}

function frame(now) {
  const seconds = Math.min(1, (now - lastFrame) / 1000);
  lastFrame = now;
  state = applyTick(state, seconds);
  if (now - lastRender >= 250) {
    ui.render(state, buyMode);
    effects.setEnergy(flow, getDps(state));
    lastRender = now;
  }
  if (Date.now() - lastSave >= 10000) renderAndSave();
  requestAnimationFrame(frame);
}

const offline = applyOfflineGain(state);
state = offline.state;
ui.render(state, buyMode);
ui.setFlow(flow);
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
window.addEventListener('pagehide', () => effects.destroy(), { once: true });

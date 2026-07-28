// IMP-003 / REQ-UI-001..005: accessible rendering and interaction feedback.
import {
  ACHIEVEMENTS,
  FACILITIES,
  UPGRADES,
  formatDuration,
  formatNumber,
  getAwakenGain,
  getClickPower,
  getDps,
  getFacilityCost,
  getGlobalMultiplier,
  getPurchaseQuote,
  getRank,
} from './game.js';

const byId = (id) => document.getElementById(id);

export function createUi(actions) {
  const elements = {
    dopaAmount: byId('dopaAmount'),
    dpsAmount: byId('dpsAmount'),
    clickPower: byId('clickPower'),
    globalMultiplier: byId('globalMultiplier'),
    facilityList: byId('facilityList'),
    upgradeList: byId('upgradeList'),
    achievementList: byId('achievementList'),
    toast: byId('toast'),
    floatLayer: byId('floatLayer'),
    settings: byId('settingsDialog'),
  };
  let lastRank = -1;
  let lastAchievements = 0;
  let toastTimer = 0;

  const bind = () => {
    byId('dopaButton').addEventListener('click', (event) => actions.click(event));
    document
      .querySelectorAll('[data-buy-mode]')
      .forEach((button) =>
        button.addEventListener('click', () => actions.setBuyMode(button.dataset.buyMode)),
      );
    byId('settingsButton').addEventListener('click', () => elements.settings.showModal());
    byId('awakenButton').addEventListener('click', actions.awaken);
    byId('reducedMotion').addEventListener('change', (event) =>
      actions.setSetting('reducedMotion', event.target.checked),
    );
    byId('soundEnabled').addEventListener('change', (event) =>
      actions.setSetting('sound', event.target.checked),
    );
    byId('exportButton').addEventListener('click', actions.exportSave);
    byId('showImportButton').addEventListener('click', () => {
      byId('importBox').hidden = false;
      byId('importText').focus();
    });
    byId('importButton').addEventListener('click', () =>
      actions.importSave(byId('importText').value),
    );
    byId('resetButton').addEventListener('click', actions.reset);
    document.addEventListener('keydown', (event) => {
      if (
        event.code === 'Space' &&
        !event.repeat &&
        event.target === document.body &&
        !elements.settings.open
      ) {
        event.preventDefault();
        actions.click();
      }
    });
  };

  const renderFacilities = (state, buyMode) => {
    FACILITIES.forEach((facility) => {
      const unlocked = state.allTimeTotal >= facility.unlock;
      const quote = getPurchaseQuote(state, facility.id, buyMode);
      const owned = state.facilities[facility.id];
      let card = elements.facilityList.querySelector(`[data-facility-id="${facility.id}"]`);
      if (!card) {
        card = document.createElement('button');
        card.dataset.facilityId = facility.id;
        const icon = document.createElement('span');
        icon.className = 'machine-icon';
        const copy = document.createElement('span');
        copy.className = 'machine-copy';
        const name = document.createElement('strong');
        name.textContent = facility.name;
        copy.append(name, document.createElement('small'), document.createElement('em'));
        const buy = document.createElement('span');
        buy.className = 'machine-buy';
        const unit = document.createElement('small');
        unit.textContent = 'DOPA';
        buy.append(document.createElement('b'), unit, document.createElement('i'));
        card.append(icon, copy, buy);
        card.addEventListener('click', () => actions.buyFacility(facility.id));
        elements.facilityList.append(card);
      }
      card.className = `machine ${quote.affordable ? 'affordable' : ''} ${unlocked ? '' : 'locked'}`;
      card.disabled = !unlocked || !quote.affordable;
      card.setAttribute(
        'aria-label',
        unlocked
          ? `${facility.name}を${buyMode === 'max' ? '最大' : quote.count}個購入。価格${formatNumber(quote.cost)} DOPA。所持${owned}`
          : `${facility.name}、累計${formatNumber(facility.unlock)} DOPAで解放`,
      );
      const icon = card.querySelector('.machine-icon');
      icon.textContent = unlocked ? facility.icon : '🔒';
      const description = card.querySelector('.machine-copy small');
      description.textContent = unlocked
        ? facility.description
        : `累計 ${formatNumber(facility.unlock)} DOPA で解放`;
      const production = card.querySelector('.machine-copy em');
      production.textContent = `+${formatNumber(facility.dps)} / 秒 × ${2 ** Math.floor(owned / 10)}`;
      const cost = card.querySelector('.machine-buy b');
      cost.textContent = formatNumber(
        buyMode === 'max' && quote.count === 0 ? getFacilityCost(facility, owned) : quote.cost,
      );
      const count = card.querySelector('.machine-buy i');
      count.textContent = String(owned);
    });
  };

  const renderUpgrades = (state) => {
    const visible = UPGRADES.filter(
      ({ unlock, id }) => state.allTimeTotal >= unlock || state.upgrades.includes(id),
    );
    const candidates = visible.filter(({ id }) => !state.upgrades.includes(id));
    const fragment = document.createDocumentFragment();
    candidates.slice(0, 3).forEach((upgrade) => {
      const button = document.createElement('button');
      button.className = 'boost-card';
      button.disabled = state.dopa < upgrade.cost;
      button.setAttribute(
        'aria-label',
        `${upgrade.name}、${upgrade.description}、価格${formatNumber(upgrade.cost)} DOPA`,
      );
      const icon = document.createElement('span');
      icon.textContent = upgrade.icon;
      const text = document.createElement('span');
      text.className = 'boost-copy';
      const name = document.createElement('strong');
      name.textContent = upgrade.name;
      const description = document.createElement('small');
      description.textContent = upgrade.description;
      text.append(name, description);
      const cost = document.createElement('b');
      cost.textContent = `${formatNumber(upgrade.cost)} DOPA`;
      button.append(icon, text, cost);
      button.addEventListener('click', () => actions.buyUpgrade(upgrade.id));
      fragment.append(button);
    });
    if (!candidates.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent =
        state.upgrades.length === UPGRADES.length
          ? 'すべての回路を強化済み。'
          : '次のブーストは累計DOPAで出現。';
      fragment.append(empty);
    }
    elements.upgradeList.replaceChildren(fragment);
    byId('upgradeCounter').textContent = `${state.upgrades.length} / ${UPGRADES.length}`;
  };

  const renderAchievements = (state) => {
    const fragment = document.createDocumentFragment();
    ACHIEVEMENTS.forEach((achievement) => {
      const earned = state.achievements.includes(achievement.id);
      const badge = document.createElement('div');
      badge.className = `badge ${earned ? 'earned' : ''}`;
      badge.setAttribute('role', 'img');
      badge.setAttribute(
        'aria-label',
        earned ? `${achievement.name}: ${achievement.description}、達成済み` : '未達成の実績',
      );
      badge.textContent = earned ? achievement.icon : '?';
      if (earned) {
        const tooltip = document.createElement('span');
        tooltip.textContent = achievement.name;
        badge.append(tooltip);
      }
      fragment.append(badge);
    });
    elements.achievementList.replaceChildren(fragment);
    byId('achievementCounter').textContent =
      `${state.achievements.length} / ${ACHIEVEMENTS.length}`;
  };

  const render = (state, buyMode) => {
    elements.dopaAmount.textContent = formatNumber(state.dopa);
    elements.dpsAmount.textContent = `+${formatNumber(getDps(state))}`;
    elements.clickPower.textContent = `+${formatNumber(getClickPower(state))} DOPA`;
    elements.globalMultiplier.textContent = `×${getGlobalMultiplier(state).toFixed(2)}`;
    const rank = getRank(state.allTimeTotal);
    byId('rankNumber').textContent = `RANK ${String(rank.index + 1).padStart(2, '0')}`;
    byId('rankName').textContent = rank.name;
    if (rank.next) {
      const progress =
        ((state.allTimeTotal - rank.threshold) / (rank.next.threshold - rank.threshold)) * 100;
      byId('nextRankName').textContent = rank.next.name;
      byId('rankProgressText').textContent =
        `${formatNumber(state.allTimeTotal)} / ${formatNumber(rank.next.threshold)}`;
      byId('rankProgressBar').style.width = `${Math.min(100, progress)}%`;
      byId('rankProgress').hidden = false;
    } else {
      byId('rankProgress').hidden = true;
    }
    if (lastRank >= 0 && rank.index > lastRank) notify(`RANK UP — ${rank.name}`);
    lastRank = rank.index;

    renderFacilities(state, buyMode);
    renderUpgrades(state);
    renderAchievements(state);

    const gain = getAwakenGain(state);
    byId('awakenOwned').textContent = String(state.awakenPoints);
    byId('awakenGain').textContent = `→ +${gain}`;
    byId('awakenButton').disabled = gain < 1;
    byId('awakenButton').textContent = gain
      ? `+${gain} チップで覚醒`
      : `${formatNumber(100000 - Math.min(100000, state.runTotal))} DOPA で解放`;
    byId('allTimeTotal').textContent = formatNumber(state.allTimeTotal);
    byId('totalClicks').textContent = state.clicks.toLocaleString('ja-JP');
    byId('awakenCount').textContent = state.awakenCount.toLocaleString('ja-JP');
    byId('playTime').textContent = formatDuration(state.playSeconds);
    byId('reducedMotion').checked = state.settings.reducedMotion;
    byId('soundEnabled').checked = state.settings.sound;
    document.body.classList.toggle('reduce-motion', state.settings.reducedMotion);

    if (lastAchievements && state.achievements.length > lastAchievements) {
      const achievement = ACHIEVEMENTS.find(({ id }) => id === state.achievements.at(-1));
      if (achievement) notify(`実績解除 — ${achievement.name}`);
    }
    lastAchievements = state.achievements.length;
  };

  const notify = (message, error = false) => {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${error ? 'error' : ''}`;
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2500);
  };

  const floatGain = (amount, event) => {
    const button = byId('dopaButton');
    const rect = button.getBoundingClientRect();
    const node = document.createElement('span');
    node.className = 'float-gain';
    node.textContent = `+${formatNumber(amount)}`;
    node.style.left = `${event?.clientX ?? rect.left + rect.width / 2}px`;
    node.style.top = `${event?.clientY ?? rect.top + rect.height / 2}px`;
    elements.floatLayer.append(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
    setTimeout(() => node.remove(), 800);
  };

  const showOffline = (result) => {
    if (result.seconds < 60 || result.amount <= 0) return;
    byId('offlineDuration').textContent = formatDuration(result.seconds);
    byId('offlineAmount').textContent = `+${formatNumber(result.amount)} DOPA`;
    byId('offlineDialog').showModal();
  };

  const setImportError = (message = '') => {
    byId('importError').textContent = message;
    byId('importText').setAttribute('aria-invalid', String(Boolean(message)));
    if (message) byId('importText').focus();
  };

  bind();
  return { render, notify, floatGain, showOffline, setImportError };
}

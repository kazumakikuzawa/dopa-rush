// IMP-001 / REQ-BIZ-001..008: deterministic progression and balance rules.
export const SAVE_VERSION = 1;
export const COST_GROWTH = 1.15;
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const OFFLINE_EFFICIENCY = 0.5;

export const FACILITIES = Object.freeze([
  {
    id: 'scroll',
    icon: '📱',
    name: '無限スクロール',
    description: '親指が勝手に次を探す',
    cost: 15,
    dps: 1,
    unlock: 0,
  },
  {
    id: 'playlist',
    icon: '🎧',
    name: '爆音プレイリスト',
    description: '脳内フェス、常時開催',
    cost: 180,
    dps: 6,
    unlock: 100,
  },
  {
    id: 'shorts',
    icon: '⚡',
    name: 'ショート動画工場',
    description: '15秒で次の刺激を量産',
    cost: 3200,
    dps: 35,
    unlock: 5000,
  },
  {
    id: 'gacha',
    icon: '🎰',
    name: 'ガチャ研究室',
    description: '次こそ出る、を永久機関に',
    cost: 48000,
    dps: 220,
    unlock: 100000,
  },
  {
    id: 'energy',
    icon: '🥤',
    name: '深夜エナドリ港',
    description: '眠気を未来へ先送り',
    cost: 700000,
    dps: 1400,
    unlock: 2000000,
  },
  {
    id: 'lab',
    icon: '🧪',
    name: '刺激最適化ラボ',
    description: '報酬回路をフルチューニング',
    cost: 12000000,
    dps: 9000,
    unlock: 50000000,
  },
  {
    id: 'satellite',
    icon: '🛰️',
    name: '軌道ドパ衛星',
    description: '地球全体へ刺激を照射',
    cost: 200000000,
    dps: 60000,
    unlock: 1000000000,
  },
  {
    id: 'singularity',
    icon: '🌀',
    name: 'ドパ特異点',
    description: '刺激が刺激を生む終着点',
    cost: 4000000000,
    dps: 400000,
    unlock: 50000000000,
  },
]);

export const RANKS = Object.freeze([
  { name: '無刺激ベビー', threshold: 0 },
  { name: '夜ふかし見習い', threshold: 100 },
  { name: '常時接続キッズ', threshold: 5000 },
  { name: '刺激の錬金術師', threshold: 100000 },
  { name: '報酬回路ハッカー', threshold: 2000000 },
  { name: '銀河級ドパガキ', threshold: 50000000 },
  { name: '刺激概念体', threshold: 1000000000 },
  { name: 'DOPA OVERLORD', threshold: 50000000000 },
]);

export const UPGRADES = Object.freeze([
  {
    id: 'double-tap',
    icon: '🔥',
    name: '両手スクロール',
    description: 'クリック威力 ×2',
    cost: 750,
    unlock: 250,
    type: 'click',
    multiplier: 2,
  },
  {
    id: 'blue-light',
    icon: '👁️',
    name: 'ブルーライト浴',
    description: '全生産 ×1.5',
    cost: 10000,
    unlock: 5000,
    type: 'global',
    multiplier: 1.5,
  },
  {
    id: 'hyper-thumb',
    icon: '👍',
    name: '超速親指',
    description: 'クリック威力 ×5',
    cost: 80000,
    unlock: 30000,
    type: 'click',
    multiplier: 5,
  },
  {
    id: 'autoplay',
    icon: '♾️',
    name: '自動再生の罠',
    description: '全生産 ×2',
    cost: 600000,
    unlock: 200000,
    type: 'global',
    multiplier: 2,
  },
  {
    id: 'night-mode',
    icon: '🌃',
    name: '永続深夜モード',
    description: '全生産 ×2.5',
    cost: 10000000,
    unlock: 3000000,
    type: 'global',
    multiplier: 2.5,
  },
  {
    id: 'sixth-sense',
    icon: '🧠',
    name: '第六の親指',
    description: 'クリック威力 ×10',
    cost: 120000000,
    unlock: 30000000,
    type: 'click',
    multiplier: 10,
  },
  {
    id: 'algorithm',
    icon: '🤖',
    name: 'おすすめ神託',
    description: '全生産 ×4',
    cost: 2000000000,
    unlock: 500000000,
    type: 'global',
    multiplier: 4,
  },
  {
    id: 'overclock',
    icon: '💥',
    name: '報酬回路オーバークロック',
    description: '全て ×10',
    cost: 80000000000,
    unlock: 20000000000,
    type: 'all',
    multiplier: 10,
  },
]);

export const ACHIEVEMENTS = Object.freeze([
  {
    id: 'first-hit',
    icon: '☝️',
    name: 'はじめの一撃',
    description: '初めてドパる',
    test: (s) => s.clicks >= 1,
  },
  {
    id: 'ten-buildings',
    icon: '🔟',
    name: '量産体制',
    description: '施設を合計10個所有',
    test: (s) => totalFacilities(s) >= 10,
  },
  {
    id: 'click-100',
    icon: '💯',
    name: '腱鞘炎予備軍',
    description: '100回ドパる',
    test: (s) => s.clicks >= 100,
  },
  {
    id: 'one-k',
    icon: '✨',
    name: '最初の千',
    description: '累計1K DOPA',
    test: (s) => s.allTimeTotal >= 1000,
  },
  {
    id: 'factory-25',
    icon: '🏭',
    name: '指先工場長',
    description: '施設を合計25個所有',
    test: (s) => totalFacilities(s) >= 25,
  },
  {
    id: 'one-m',
    icon: '💎',
    name: 'ミリオンドーパ',
    description: '累計1M DOPA',
    test: (s) => s.allTimeTotal >= 1000000,
  },
  {
    id: 'upgrade-4',
    icon: '🧬',
    name: '強化人間',
    description: '強化を4個購入',
    test: (s) => s.upgrades.length >= 4,
  },
  {
    id: 'hundred-buildings',
    icon: '🏙️',
    name: '刺激都市',
    description: '施設を合計100個所有',
    test: (s) => totalFacilities(s) >= 100,
  },
  {
    id: 'first-awaken',
    icon: '🌅',
    name: '初覚醒',
    description: '初めて覚醒する',
    test: (s) => s.awakenCount >= 1,
  },
  {
    id: 'one-b',
    icon: '🌍',
    name: 'ビリオンキッズ',
    description: '累計1B DOPA',
    test: (s) => s.allTimeTotal >= 1000000000,
  },
  {
    id: 'all-upgrades',
    icon: '⚙️',
    name: '完全強化体',
    description: '強化を全て購入',
    test: (s) => s.upgrades.length >= UPGRADES.length,
  },
  {
    id: 'overlord',
    icon: '👑',
    name: 'ドパガキの王',
    description: '最終ランクへ到達',
    test: (s) => getRank(s.allTimeTotal).index === RANKS.length - 1,
  },
]);

const finite = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
const int = (value, fallback = 0) => Math.floor(finite(value, fallback));

export function createInitialState(now = Date.now()) {
  return {
    schemaVersion: SAVE_VERSION,
    dopa: 0,
    runTotal: 0,
    allTimeTotal: 0,
    clicks: 0,
    facilities: Object.fromEntries(FACILITIES.map(({ id }) => [id, 0])),
    upgrades: [],
    achievements: [],
    awakenPoints: 0,
    awakenCount: 0,
    playSeconds: 0,
    settings: { reducedMotion: false, sound: true },
    createdAt: now,
    savedAt: now,
  };
}

export function sanitizeState(input, now = Date.now()) {
  const base = createInitialState(now);
  if (!input || typeof input !== 'object' || Number(input.schemaVersion) !== SAVE_VERSION)
    return base;
  const knownUpgrades = new Set(UPGRADES.map(({ id }) => id));
  const knownAchievements = new Set(ACHIEVEMENTS.map(({ id }) => id));
  return {
    ...base,
    dopa: finite(input.dopa),
    runTotal: finite(input.runTotal),
    allTimeTotal: finite(input.allTimeTotal),
    clicks: int(input.clicks),
    facilities: Object.fromEntries(FACILITIES.map(({ id }) => [id, int(input.facilities?.[id])])),
    upgrades: [...new Set(Array.isArray(input.upgrades) ? input.upgrades : [])].filter((id) =>
      knownUpgrades.has(id),
    ),
    achievements: [...new Set(Array.isArray(input.achievements) ? input.achievements : [])].filter(
      (id) => knownAchievements.has(id),
    ),
    awakenPoints: int(input.awakenPoints),
    awakenCount: int(input.awakenCount),
    playSeconds: finite(input.playSeconds),
    settings: {
      reducedMotion: Boolean(input.settings?.reducedMotion),
      sound: input.settings?.sound !== false,
    },
    createdAt: finite(input.createdAt, now),
    savedAt: finite(input.savedAt, now),
  };
}

export function getAchievementMultiplier(state) {
  return 1 + state.achievements.length * 0.05;
}

export function getAwakenMultiplier(state) {
  return 1 + state.awakenPoints * 0.25;
}

export function getUpgradeMultiplier(state, type) {
  return UPGRADES.filter(
    ({ id, type: upgradeType }) =>
      state.upgrades.includes(id) && (upgradeType === type || upgradeType === 'all'),
  ).reduce((product, { multiplier }) => product * multiplier, 1);
}

export function getGlobalMultiplier(state) {
  return (
    getUpgradeMultiplier(state, 'global') *
    getAchievementMultiplier(state) *
    getAwakenMultiplier(state)
  );
}

export function getClickPower(state) {
  return getUpgradeMultiplier(state, 'click') * getGlobalMultiplier(state);
}

export function getMilestoneMultiplier(count) {
  return 2 ** Math.floor(count / 10);
}

export function getDps(state) {
  const base = FACILITIES.reduce(
    (sum, facility) =>
      sum +
      state.facilities[facility.id] *
        facility.dps *
        getMilestoneMultiplier(state.facilities[facility.id]),
    0,
  );
  return base * getGlobalMultiplier(state);
}

export function getFacilityCost(facility, owned) {
  return Math.ceil(facility.cost * COST_GROWTH ** owned);
}

export function getPurchaseQuote(state, facilityId, mode = 1) {
  const facility = FACILITIES.find(({ id }) => id === facilityId);
  if (!facility) return { count: 0, cost: 0 };
  const owned = state.facilities[facilityId];
  const limit = mode === 'max' ? 10000 : Math.max(1, int(mode, 1));
  let count = 0;
  let cost = 0;
  while (count < limit) {
    const next = getFacilityCost(facility, owned + count);
    if (cost + next > state.dopa) break;
    cost += next;
    count += 1;
  }
  if (mode !== 'max' && count < limit) {
    let requestedCost = 0;
    for (let index = 0; index < limit; index += 1)
      requestedCost += getFacilityCost(facility, owned + index);
    return { count: limit, cost: requestedCost, affordable: false };
  }
  return { count, cost, affordable: count > 0 };
}

export function applyClick(state) {
  const gain = getClickPower(state);
  return claimAchievements({
    ...state,
    dopa: state.dopa + gain,
    runTotal: state.runTotal + gain,
    allTimeTotal: state.allTimeTotal + gain,
    clicks: state.clicks + 1,
  });
}

export function applyTick(state, seconds) {
  const safeSeconds = Math.min(1, finite(seconds));
  const gain = getDps(state) * safeSeconds;
  return claimAchievements({
    ...state,
    dopa: state.dopa + gain,
    runTotal: state.runTotal + gain,
    allTimeTotal: state.allTimeTotal + gain,
    playSeconds: state.playSeconds + safeSeconds,
  });
}

export function purchaseFacility(state, facilityId, mode) {
  const quote = getPurchaseQuote(state, facilityId, mode);
  if (!quote.affordable) return { state, purchased: 0 };
  const next = {
    ...state,
    dopa: state.dopa - quote.cost,
    facilities: { ...state.facilities, [facilityId]: state.facilities[facilityId] + quote.count },
  };
  return { state: claimAchievements(next), purchased: quote.count };
}

export function purchaseUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find(({ id }) => id === upgradeId);
  if (
    !upgrade ||
    state.upgrades.includes(upgradeId) ||
    state.allTimeTotal < upgrade.unlock ||
    state.dopa < upgrade.cost
  )
    return state;
  return claimAchievements({
    ...state,
    dopa: state.dopa - upgrade.cost,
    upgrades: [...state.upgrades, upgradeId],
  });
}

export function getRank(total) {
  let index = 0;
  RANKS.forEach((rank, candidate) => {
    if (total >= rank.threshold) index = candidate;
  });
  return { ...RANKS[index], index, next: RANKS[index + 1] ?? null };
}

export function getAwakenGain(state) {
  return Math.max(0, Math.floor(Math.sqrt(state.runTotal / 100000)));
}

export function awaken(state, now = Date.now()) {
  const gain = getAwakenGain(state);
  if (gain < 1) return state;
  const fresh = createInitialState(now);
  return claimAchievements({
    ...fresh,
    allTimeTotal: state.allTimeTotal,
    clicks: state.clicks,
    achievements: state.achievements,
    awakenPoints: state.awakenPoints + gain,
    awakenCount: state.awakenCount + 1,
    playSeconds: state.playSeconds,
    settings: state.settings,
    createdAt: state.createdAt,
  });
}

export function calculateOfflineGain(state, now = Date.now()) {
  const seconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - state.savedAt) / 1000));
  return { seconds, amount: getDps(state) * seconds * OFFLINE_EFFICIENCY };
}

export function applyOfflineGain(state, now = Date.now()) {
  const result = calculateOfflineGain(state, now);
  return {
    result,
    state: claimAchievements({
      ...state,
      dopa: state.dopa + result.amount,
      runTotal: state.runTotal + result.amount,
      allTimeTotal: state.allTimeTotal + result.amount,
      savedAt: now,
    }),
  };
}

export function claimAchievements(state) {
  const earned = ACHIEVEMENTS.filter(
    ({ id, test }) => !state.achievements.includes(id) && test(state),
  ).map(({ id }) => id);
  return earned.length ? { ...state, achievements: [...state.achievements, ...earned] } : state;
}

export function totalFacilities(state) {
  return Object.values(state.facilities).reduce((sum, value) => sum + value, 0);
}

export function formatNumber(value) {
  const number = finite(value);
  const units = [
    [1e20, '垓'],
    [1e16, '京'],
    [1e12, '兆'],
    [1e8, '億'],
    [1e4, '万'],
  ];
  for (const [threshold, suffix] of units) {
    if (number >= threshold) {
      const scaled = number / threshold;
      return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}${suffix}`;
    }
  }
  if (number >= 1000) return number.toLocaleString('ja-JP', { maximumFractionDigits: 0 });
  if (number >= 10) return number.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
  return number.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
}

export function formatDuration(seconds) {
  const total = int(seconds);
  if (total >= 3600) return `${Math.floor(total / 3600)}時間${Math.floor((total % 3600) / 60)}分`;
  if (total >= 60) return `${Math.floor(total / 60)}分${total % 60}秒`;
  return `${total}秒`;
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FACILITIES,
  OFFLINE_CAP_SECONDS,
  applyClick,
  applyOfflineGain,
  applyTick,
  awaken,
  createInitialState,
  getAwakenGain,
  getDps,
  getFacilityCost,
  getMilestoneMultiplier,
  getPurchaseQuote,
  purchaseFacility,
  purchaseUpgrade,
  sanitizeState,
} from '../src/game.js';

test('click gains CHARGE and records the first achievement', () => {
  const state = applyClick(createInitialState(0));
  assert.equal(state.dopa, 1);
  assert.equal(state.clicks, 1);
  assert.ok(state.achievements.includes('first-hit'));
});

test('facility cost grows and ten facilities double their output', () => {
  const facility = FACILITIES[0];
  assert.equal(getFacilityCost(facility, 0), 15);
  assert.ok(getFacilityCost(facility, 1) > 15);
  assert.equal(getMilestoneMultiplier(9), 1);
  assert.equal(getMilestoneMultiplier(10), 2);
});

test('purchase modes are atomic and MAX buys only affordable facilities', () => {
  const rich = { ...createInitialState(), dopa: 1000 };
  const quote10 = getPurchaseQuote(rich, 'scroll', 10);
  assert.equal(quote10.count, 10);
  const bought = purchaseFacility(rich, 'scroll', 10);
  assert.equal(bought.purchased, 10);
  assert.equal(bought.state.facilities.scroll, 10);

  const poor = { ...createInitialState(), dopa: 14 };
  assert.equal(purchaseFacility(poor, 'scroll', 1).state, poor);
  assert.equal(getPurchaseQuote(poor, 'scroll', 'max').count, 0);
});

test('DPS applies milestone and upgrade multipliers', () => {
  let state = {
    ...createInitialState(),
    dopa: 100000,
    allTimeTotal: 100000,
    facilities: { ...createInitialState().facilities, scroll: 10 },
  };
  assert.equal(getDps(state), 20);
  state = purchaseUpgrade(state, 'blue-light');
  // Buying the upgrade also claims two eligible achievements (+10% permanent).
  assert.equal(getDps(state), 33);
});

test('tick clamps large frame gaps to one second', () => {
  const state = {
    ...createInitialState(),
    facilities: { ...createInitialState().facilities, scroll: 1 },
  };
  assert.equal(applyTick(state, 50).dopa, 1);
});

test('awakening requires progress and retains permanent progress', () => {
  const state = {
    ...createInitialState(),
    dopa: 100000,
    runTotal: 100000,
    allTimeTotal: 100000,
    clicks: 42,
  };
  assert.equal(getAwakenGain(state), 1);
  const next = awaken(state, 123);
  assert.equal(next.awakenPoints, 1);
  assert.equal(next.awakenCount, 1);
  assert.equal(next.dopa, 0);
  assert.equal(next.clicks, 42);
});

test('offline gain is capped at eight hours and 50 percent efficiency', () => {
  const state = {
    ...createInitialState(0),
    savedAt: 0,
    facilities: { ...createInitialState().facilities, scroll: 1 },
  };
  const result = applyOfflineGain(state, (OFFLINE_CAP_SECONDS + 1000) * 1000);
  assert.equal(result.result.seconds, OFFLINE_CAP_SECONDS);
  assert.equal(result.result.amount, OFFLINE_CAP_SECONDS * 0.5);
});

test('sanitize removes invalid numbers and unknown IDs', () => {
  const state = sanitizeState({
    ...createInitialState(),
    dopa: Number.NaN,
    facilities: { scroll: -3 },
    upgrades: ['not-real', 'double-tap', 'double-tap'],
    achievements: ['not-real'],
  });
  assert.equal(state.dopa, 0);
  assert.equal(state.facilities.scroll, 0);
  assert.deepEqual(state.upgrades, ['double-tap']);
  assert.deepEqual(state.achievements, []);
});

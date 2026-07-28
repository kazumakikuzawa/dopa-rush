import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState } from '../src/game.js';
import { SAVE_KEY, clearGame, exportGame, importGame, loadGame, saveGame } from '../src/storage.js';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
};

test('save and load round trip uses one local key', () => {
  const storage = createStorage();
  const state = { ...createInitialState(1), dopa: 42 };
  saveGame(state, storage, 10);
  assert.ok(storage.values.has(SAVE_KEY));
  assert.equal(loadGame(storage, 10).dopa, 42);
});

test('invalid stored JSON returns null without overwriting it', () => {
  const storage = createStorage();
  storage.setItem(SAVE_KEY, '{broken');
  assert.equal(loadGame(storage), null);
  assert.equal(storage.getItem(SAVE_KEY), '{broken');
});

test('export and import preserve Japanese-safe JSON state', () => {
  const state = {
    ...createInitialState(),
    dopa: 1234,
    settings: { reducedMotion: true, sound: false },
  };
  const imported = importGame(exportGame(state));
  assert.equal(imported.dopa, 1234);
  assert.deepEqual(imported.settings, state.settings);
});

test('invalid import throws and cannot mutate current state', () => {
  const current = { ...createInitialState(), dopa: 999 };
  assert.throws(() => importGame('not-base64!'), /読み込めません/);
  assert.equal(current.dopa, 999);
});

test('clear removes only the game save key', () => {
  const storage = createStorage();
  storage.setItem(SAVE_KEY, '{}');
  storage.setItem('other', 'keep');
  clearGame(storage);
  assert.equal(storage.getItem(SAVE_KEY), null);
  assert.equal(storage.getItem('other'), 'keep');
});

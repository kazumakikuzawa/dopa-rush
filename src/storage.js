// IMP-002 / REQ-DB-001..003: local-only persistence with validation and rollback.
import { SAVE_VERSION, sanitizeState } from './game.js';

export const SAVE_KEY = 'dopaRushSave';

export function saveGame(state, storage = localStorage, now = Date.now()) {
  const safe = sanitizeState({ ...state, savedAt: now }, now);
  storage.setItem(SAVE_KEY, JSON.stringify(safe));
  return safe;
}

export function loadGame(storage = localStorage, now = Date.now()) {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SAVE_VERSION)
      throw new Error('このセーブデータのバージョンには対応していません。');
    return sanitizeState(parsed, now);
  } catch {
    return null;
  }
}

export function clearGame(storage = localStorage) {
  storage.removeItem(SAVE_KEY);
}

export function exportGame(state) {
  const json = JSON.stringify(sanitizeState(state));
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function importGame(encoded, now = Date.now()) {
  try {
    const binary = atob(encoded.trim());
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed.schemaVersion !== SAVE_VERSION) throw new Error('version');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
    return sanitizeState(parsed, now);
  } catch {
    throw new Error('セーブ文字列を読み込めません。コピー内容を確認してください。');
  }
}

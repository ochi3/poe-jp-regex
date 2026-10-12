/** Persistent values retain their original keys and legacy formats. */
const invalidStorageValues = new Map<string, string>();
function readStoredText(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}
function storageRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function storageStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
function storageSelections(value: unknown): boolean {
  return storageStrings(value) || (Array.isArray(value) && value.every(item =>
    Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && ['ng', 'wanted'].includes(item[1]))) ||
    (storageRecord(value) && Object.values(value).every(item => ['ng', 'wanted'].includes(item)));
}
function validStoredSettings(value: unknown): boolean {
  if (!storageRecord(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    if (key === 'searchMode' && !['any', 'all'].includes(item)) return false;
    if (/^(?:anyThreeLink|anyFourLink|anyFiveLink|anySixLink|anySixSocket|ngModChecked|mapTierChecked)$/.test(key)) return typeof item === 'boolean';
    if (['colors', 'movement', 'weapon', 'excludeWeapons', 'selected', 'rarities', 'rarityChecked'].includes(key)) return storageRecord(item) && Object.values(item).every(flag => typeof flag === 'boolean');
    if (key === 'selectedGems') return storageStrings(item);
    if (key === 'gemInfo') return Array.isArray(item) && item.every(gem => storageRecord(gem) && typeof gem.regex === 'string');
    return typeof item === 'string' || typeof item === 'boolean' || typeof item === 'number' ||
      (storageRecord(item) && Object.values(item).every(flag => typeof flag === 'boolean'));
  });
}
function validStoredProfile(value: unknown): value is SavedProfile {
  if (!storageRecord(value)) return false;
  if ('settings' in value && !validStoredSettings(value.settings)) return false;
  if ('mods' in value && !storageSelections(value.mods)) return false;
  for (const key of ['checkedMods', 'selectedMods', 'beasts', 'scarabs', 'essences', 'tattoos', 'runegrafts']) {
    if (key in value && !(key === 'checkedMods' ? storageSelections(value[key]) : storageStrings(value[key]))) return false;
  }
  if ('timestamp' in value && (typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp))) return false;
  if ('gemInfo' in value && !(Array.isArray(value.gemInfo) && value.gemInfo.every(gem => storageRecord(gem) && typeof gem.regex === 'string'))) return false;
  return true;
}
function validProfileForStorage(key: string, value: unknown): value is SavedProfile {
  if (!validStoredProfile(value)) return false;
  if (/poeProfiles$/.test(key)) return 'mods' in value && storageSelections(value.mods);
  if (/(?:flask|item|tablet)Profiles$/.test(key)) return storageStrings(value.mods);
  if (/vendorProfiles$/.test(key)) return validStoredSettings(value.settings);
  const catalog = key.replace(/Profiles$/, '') + 's';
  return storageStrings(value[catalog]);
}
function storedJsonFallback(key: string): any {
  return /(?:CheckboxState$|tablet_checked|chart_checked|savedRegexOrder$|ModsData$)/.test(key) && !/modCheckboxState$/.test(key) ? [] : {};
}
function validStoredJson(key: string, value: unknown): boolean {
  if (/Profiles$/.test(key)) return storageRecord(value) && Object.values(value).every(profile => validProfileForStorage(key, profile));
  if (/savedRegexOrder$/.test(key)) return Array.isArray(value) && value.every(item => storageRecord(item) && typeof item.name === 'string' && typeof item.type === 'string');
  if (/chart_checked/.test(key)) return Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && ['ng', 'wanted'].includes(item[1]));
  if (/tablet_checked|(?:beast|scarab|essence|tattoo|runegraft|flaskMod|itemMod)CheckboxState$/.test(key)) return storageStrings(value);
  if (/modCheckboxState$/.test(key)) return storageRecord(value) && Object.values(value).every(item => ['ng', 'wanted'].includes(item));
  if (/TypeStates$/.test(key)) return storageRecord(value) && Object.values(value).every(storageStrings);
  if (/ModsData$/.test(key)) return Array.isArray(value) && value.every(storageRecord);
  if (/vendorSettings$|inputState$|searchModeState$|FilterState$/.test(key)) return validStoredSettings(value);
  return storageRecord(value);
}
function readStoredJson(key: string): any {
  const raw = readStoredText(key);
  if (raw === null) return storedJsonFallback(key);
  try {
    const value: unknown = JSON.parse(raw);
    if (validStoredJson(key, value)) return value;
    // Keep usable profiles even when another entry is damaged.
    if (/Profiles$/.test(key) && storageRecord(value)) {
      invalidStorageValues.set(key, raw);
      return Object.fromEntries(Object.entries(value).filter(([, profile]) => validProfileForStorage(key, profile)));
    }
  } catch { /* Retain the original text for recovery before a later write. */ }
  invalidStorageValues.set(key, raw);
  return storedJsonFallback(key);
}
function writeStoredText(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; }
  catch {
    showNotification('設定を保存できませんでした。ブラウザの保存領域を確認してください。', true);
    return false;
  }
}
function writeStoredJson(key: string, value: unknown): boolean {
  if (!validStoredJson(key, value)) {
    restoreStoredProfiles(key, value);
    showNotification('保存データの形式が正しくありません。', true);
    return false;
  }
  try {
    const raw = invalidStorageValues.get(key);
    if (raw !== undefined) localStorage.setItem(key + '__invalid_backup', raw);
    localStorage.setItem(key, JSON.stringify(value));
    invalidStorageValues.delete(key);
    return true;
  } catch {
    restoreStoredProfiles(key, value);
    showNotification('設定を保存できませんでした。ブラウザの保存領域を確認してください。', true);
    return false;
  }
}
/** Profile editors mutate their dictionaries before saving; undo that mutation on failure. */
function restoreStoredProfiles(key: string, value: unknown): void {
  if (!/Profiles$/.test(key) || !storageRecord(value)) return;
  const previous = readStoredJson(key);
  Object.keys(value).forEach(name => delete value[name]);
  Object.defineProperties(value, Object.getOwnPropertyDescriptors(previous));
}
function removeStoredValue(key: string): boolean {
  try { localStorage.removeItem(key); invalidStorageValues.delete(key); return true; }
  catch { showNotification('設定を削除できませんでした。', true); return false; }
}
function readLanguagePreference(key: string): Language {
  return readStoredText(key) === 'en' ? 'en' : 'ja';
}

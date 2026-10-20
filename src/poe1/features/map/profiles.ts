let profiles: ProfileDictionary = {};
let selectedProfile = null;

function saveProfile() {
  const profileName = getElement('profileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (profiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  if (!validateInputs()) return;

  profiles[profileName] = {
    mods: Array.from(checkedMods), // [[id, state], ...] の形式で保存
    settings: {
      ...(getElement('mapCustomRegex').value ? {customRegex: getElement('mapCustomRegex').value} : {}),
      itemQuantity: getElement('itemQuantityInput').value,
      packSize: getElement('packSizeInput').value,
      rarity: getElement('rarityInput').value,
      scarab: getElement('scarabInput').value,
      currency: getElement('currencyInput').value,
      map: getElement('mapInput').value,
      searchMode: document.querySelector<HTMLInputElement>('input[name="searchMode"]:checked')?.value || 'any',
      ngModChecked: getElement('ngModCheckbox').checked,
      mapTierChecked: getElement('mapTierCheckbox').checked,
      rarities: {
        normal: getElement('normalCheckbox')?.checked || false,
        magic: getElement('magicCheckbox')?.checked || false,
        rare: getElement('rareCheckbox')?.checked || false
      }
    }
  };

  if (!writeStoredJson('poeProfiles', profiles)) return false;
  updateProfileList();

  // ローカルストレージ更新
  saveModCheckboxState();
  saveInputState();
  saveCheckboxState();
  saveSearchModeState();

  showNotification(`"${profileName}" を保存しました`);
  getElement('profileName').value = '';
}

// プロファイル読み込み
function loadProfile() {
  const profileName = getElement('profileList').value;
  if (!profileName || !profiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    // 完全リセット
    resetAll();

    const profile = profiles[profileName];
    getElement('mapCustomRegex').value = profile.settings?.customRegex || '';

    // 入力値復元
    if (getElement('itemQuantityInput')) getElement('itemQuantityInput').value = profile.settings?.itemQuantity || '';
    if (getElement('packSizeInput')) getElement('packSizeInput').value = profile.settings?.packSize || '';
    if (getElement('rarityInput')) getElement('rarityInput').value = profile.settings?.rarity || '';
    if (getElement('scarabInput')) getElement('scarabInput').value = profile.settings?.scarab || '';
    if (getElement('currencyInput')) getElement('currencyInput').value = profile.settings?.currency || '';
    if (getElement('mapInput')) getElement('mapInput').value = profile.settings?.map || '';

    // チェックボックス状態復元（オプショナルチェイニングで安全に）
    if (getElement('ngModCheckbox')) getElement('ngModCheckbox').checked = profile.settings?.ngModChecked || false;
    if (getElement('mapTierCheckbox')) getElement('mapTierCheckbox').checked = profile.settings?.mapTierChecked || false;
    if (getElement('normalCheckbox')) getElement('normalCheckbox').checked = profile.settings?.rarities?.normal || false;
    if (getElement('magicCheckbox')) getElement('magicCheckbox').checked = profile.settings?.rarities?.magic || false;
    if (getElement('rareCheckbox')) getElement('rareCheckbox').checked = profile.settings?.rarities?.rare || false;

    // 検索モード
    const searchMode = profile.settings?.searchMode || 'any';
    const searchModeRadio = document.querySelector<HTMLInputElement>(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
      searchModeRadio.checked = true;
    }

    // MODチェックボックス復元 - 存在するMODのみ
    checkedMods.clear();
    if (Array.isArray(profile.mods)) {
      profile.mods.forEach(modData => {
        // 旧バージョンのSet形式プロファイルと現在のMap形式の互換性を維持
        if (Array.isArray(modData)) {
            const [id, state] = modData;
            if (ModList[id]) checkedMods.set(id, state);
        } else {
            // 以前のプロパティ形式の互換性 (デフォルトで 'ng' として扱う)
            if (ModList[modData]) checkedMods.set(modData, 'ng');
        }
      });
    }

    // プロファイル名を入力欄に表示
    if (getElement('profileName')) getElement('profileName').value = profileName;

    saveModCheckboxState();

    updateModList();
    updateCombinedRegex();
    if (profile.settings?.customRegex) saveInputState();

    ['change', 'input'].forEach(event => {
      const tierCb = getElement('mapTierCheckbox');
      if (tierCb) tierCb.dispatchEvent(new Event(event));
      
      const ngCb = getElement('ngModCheckbox');
      if (ngCb) ngCb.dispatchEvent(new Event(event));
    });

    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('プロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

// プロファイル削除
function deleteProfile() {
  const profileName = getElement('profileList').value;
  if (!profileName || !profiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete profiles[profileName];
    if (!writeStoredJson('poeProfiles', profiles)) return false;
    updateProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

// 入力バリデーション
function validateInputs() {
  const inputs = [
    'itemQuantityInput',
    'packSizeInput',
    'rarityInput',
    'scarabInput',
    'currencyInput',
    'mapInput'
  ];

  for (const id of inputs) {
    const value = getElement<HTMLInputElement>(id).value;
    if (value && (isNaN(Number(value)) || Number(value) < 0)) {
      alert(`${id.replace('Input', '')} には0以上の数値を入力してください`);
      getElement<HTMLInputElement>(id).focus();
      return false;
    }
  }
  return true;
}

// フィルターリセット
function resetFilterSettings() {
    resetAll();
}

function exportProfiles() {
  const data = JSON.stringify(profiles);
  const blob = new Blob([data], {type: 'application/json'});
  // ダウンロード処理...
}

function importProfiles(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported: unknown = JSON.parse(String(reader.result));
      if (!validStoredJson('poeProfiles', imported)) throw new Error('Invalid profiles');
      if (!writeStoredJson('poeProfiles', imported)) return;
      profiles = imported as ProfileDictionary;
      updateProfileList();
    } catch {
      showNotification('プロファイルの形式が正しくありません。JSONファイルを確認してください。', true);
    }
  };
  reader.onerror = () => showNotification('ファイルを読み込めませんでした。', true);
  reader.readAsText(file);
}

// ビースト

function loadProfiles() {
    const saved = readStoredText('poeProfiles');
    if (saved) {
        try {
            profiles = readStoredJson('poeProfiles');
            updateProfileList();
        } catch (e) {
            console.error('プロファイルの読み込みエラー:', e);
            profiles = {};
        }
    }
}

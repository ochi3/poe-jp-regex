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
    mods: Array.from(checkedMods),
    settings: getPoe2MapProfileSettings(),
    timestamp: Date.now()
  };

  if (!writeStoredJson('poe2_poeProfiles', profiles)) return false;
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
  if (!profileName) {
    getElement('profileName').value = '';
    return;
  }
  if (!profiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    // 完全リセット
    resetAll();

    const profile = profiles[profileName];

    applyPoe2MapProfileSettings(profile.settings);

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
    getElement('profileName').value = profileName;

    saveModCheckboxState();

    updateModList();
    updateCombinedRegex();

    ['change', 'input'].forEach(event => {
      getElement('mapTierCheckbox')?.dispatchEvent(new Event(event));
      getElement('ngModCheckbox').dispatchEvent(new Event(event));
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
    if (!writeStoredJson('poe2_poeProfiles', profiles)) return false;
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
    'reviveInput',
    'waystoneInput',
    'effectivenessInput',
    'mapMonsterRarityInput',
    'rareMonsterInput',
    'magicMonsterInput'
  ];

  for (const id of inputs) {
    const el = getElement<HTMLInputElement>(id);
    if (!el) continue;
    const value = el.value;
    if (value === '') continue;
    if (isNaN(Number(value)) || Number(value) < 0) {
      alert(`${id.replace('Input', '')} には0以上の数値を入力してください`);
      getElement<HTMLInputElement>(id).focus();
      return false;
    }
    if (id === 'reviveInput' && Number(value) > 9) {
      alert('復活 には0〜9の数値を入力してください');
      getElement<HTMLInputElement>(id).focus();
      return false;
    }
  }
  return true;
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  const profileSelect = getElement('profileList');
  if (profileSelect && !profileSelect.hasEventListener) {
    profileSelect.addEventListener('change', function() {
      if (this.value) loadProfile();
      else getElement('profileName').value = '';
    });
    profileSelect.hasEventListener = true;
  }
});

function loadProfiles() {
    const saved = readStoredText('poe2_poeProfiles');
    if (saved) {
        try {
            profiles = readStoredJson('poe2_poeProfiles');
            updateProfileList();
        } catch (e) {
            console.error('プロファイルの読み込みエラー:', e);
            profiles = {};
        }
    }
}

let ModList = {...originalModList};

let currentLanguage = 'ja';
let checkedMods = new Set();
let checkedBeasts = new Set();

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    updateModList();
    updateCombinedRegex();
}

function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    // ModListをtierでソート
    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(!isT17 && value.modTier17))
        .sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);

    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });
}


function addEffectItem(key, value) {
    const ModListDiv = document.getElementById('ModList');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = key;
    checkbox.id = key;
    checkbox.checked = checkedMods.has(key);
    checkbox.onchange = function() {
        if (this.checked) {
            checkedMods.add(key);
        } else {
            checkedMods.delete(key);
        }
        saveModCheckboxState();
        updateCombinedRegex();
    };

    const labelElem = document.createElement('label');
    labelElem.htmlFor = key;
    labelElem.textContent = currentLanguage === 'ja' ? value.mod : value.engMod;

    const effectItem = document.createElement('div');
    effectItem.classList.add('effect-item');
    if (value.tier > 1001) {
        effectItem.style.color = '#e0b8ee';
        effectItem.classList.add('t17-effect');
    } else if (value.tier > 750) {
        effectItem.style.color = '#ed4c4c';
    } else if (value.tier > 500) {
        effectItem.style.color = '#F87171';
    } else if (value.tier > 250) {
        effectItem.style.color = '#FCA5A5';
    } else if (value.tier > 100) {
        effectItem.style.color = '#f2d5d5';
    } else {
        effectItem.style.color = 'white';
    }

    effectItem.appendChild(checkbox);
    effectItem.appendChild(labelElem);

    ModListDiv.appendChild(effectItem);
}

function generateRarityRegex() {
    const normalChecked = document.getElementById('normalCheckbox').checked;
    const magicChecked = document.getElementById('magicCheckbox').checked;
    const rareChecked = document.getElementById('rareCheckbox').checked;

    const rarities = {
        ja: [],
        en: []
    };

    if (normalChecked) {
        rarities.ja.push('ル');
        rarities.en.push('n');
    }
    if (magicChecked) {
        rarities.ja.push('ク');
        rarities.en.push('m');
    }
    if (rareChecked) {
        rarities.ja.push('ア');
        rarities.en.push('r');
    }

    const currentRarities = rarities[currentLanguage];

    if (currentRarities.length === 0 || currentRarities.length === 3) {
        return '';
    } else if (currentRarities.length === 1) {
        return currentLanguage === 'ja'
            ? `${currentRarities[0]}\$`
            : `"y: ${currentRarities[0]}"`;
    } else {
        return currentLanguage === 'ja'
            ? `(${currentRarities.join('|')})\$`
            : `"y: (${currentRarities.join('|')})"`;
    }
}
//保存-消すかも
document.getElementById('normalCheckbox').addEventListener('change', () => {
    saveSearchModeState();
    updateCombinedRegex();
});
document.getElementById('magicCheckbox').addEventListener('change', () => {
    saveSearchModeState();
    updateCombinedRegex();
});
document.getElementById('rareCheckbox').addEventListener('change', () => {
    saveSearchModeState();
    updateCombinedRegex();
});


function updateCombinedRegex() {
    const itemQuantityValue = document.getElementById('itemQuantityInput').value;
    const packSizeValue = document.getElementById('packSizeInput').value;
    const ngModChecked = document.getElementById('ngModCheckbox').checked;

    let combinedResult = '';
    const effectResults = [];

    checkedMods.forEach((key) => {
        const mod = ModList[key];
        effectResults.push(currentLanguage === 'ja' ? mod.Regex : mod.engRegex);
    });

    let ModListResult = effectResults.length > 0 ? effectResults.join('|') : '';

    if (ModListResult && ngModChecked) {
        ModListResult = `"!${ModListResult}"`;
    }
    document.getElementById('ModListResult').textContent = ModListResult;

    if (itemQuantityValue) {
        const itemQuantityRegex = getFixedRangeRegex(itemQuantityValue, currentLanguage === 'ja' ? '量:.*' : 'm q.*');
        combinedResult += ` ${itemQuantityRegex}`;
    }

    if (packSizeValue) {
        const packSizeRegex = getFixedRangeRegex(packSizeValue, currentLanguage === 'ja' ? 'ズ:.*' : 'iz.*');
        combinedResult += ` ${packSizeRegex}`;
    }

    const extraRegex = generateExtraRegex();
    if (extraRegex) {
        combinedResult += ` ${extraRegex}`;
    }

    const rarityRegex = generateRarityRegex();

    if (currentLanguage === 'ja') {
        if (rarityRegex && ModListResult) {
            combinedResult = `${ModListResult}|${rarityRegex}${combinedResult}`.trim();
        } else if (rarityRegex) {
            combinedResult = `${rarityRegex}${combinedResult}`.trim();
        } else if (ModListResult) {
            combinedResult = `${ModListResult}${combinedResult}`.trim();
        }
    } else {
        if (ModListResult) {
            combinedResult = `${ModListResult} ${rarityRegex} ${combinedResult}`.trim();
        } else {
            combinedResult = `${rarityRegex} ${combinedResult}`.trim();
        }
    }

    document.getElementById('combinedRegexOutput').textContent = combinedResult;

    updateCharCount();
}


let searchAllMode = true;

function updateSearchMode() {
    searchAllMode = document.getElementById('searchAllRadio').checked;
    updateCombinedRegex();
}

function toggleSearchMode(mode) {
    searchAllMode = mode === 'all';
    document.getElementById('searchAllButton').classList.toggle('active', searchAllMode);
    document.getElementById('searchAnyButton').classList.toggle('active', !searchAllMode);
    updateCombinedRegex();
}

function generateExtraRegex() {
    const scarabValue = document.getElementById('scarabInput').value;
    const currencyValue = document.getElementById('currencyInput').value;
    const mapValue = document.getElementById('mapInput').value;

    let extraRegex = [];

    if (scarabValue) {
        const scarabRegex = getFixedRangeRegex(scarabValue, currentLanguage === 'ja' ? 'ベ:.*' : 'e s.*');
        extraRegex.push(scarabRegex);
    }

    if (currencyValue) {
        const currencyRegex = getFixedRangeRegex(currencyValue, currentLanguage === 'ja' ? 'ー:.*' : 'y f.*');
        extraRegex.push(currencyRegex);
    }

    if (mapValue) {
        const mapRegex = getFixedRangeRegex(mapValue, currentLanguage === 'ja' ? 'プ:.*' : 'ps f.*');
        extraRegex.push(mapRegex);
    }

    if (extraRegex.length === 0) {
        return '';
    }

    if (searchAllMode) {
        return extraRegex.join(' ');
    } else {
        return extraRegex.join('|').replace(/"/g, '');
    }
}

function updateCharCount() {
    const result = document.getElementById('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = document.getElementById('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;

    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    } else {
        charCountElement.style.color = '';
    }
}

function copyToClipboard() {
    const resultText = document.getElementById('combinedRegexOutput').textContent;
    navigator.clipboard.writeText(resultText)
        .catch(err => console.error('クリップボードへのコピーに失敗しました', err));
}

function resetAll() {
    // Clear input fields
    document.getElementById('itemQuantityInput').value = '';
    document.getElementById('packSizeInput').value = '';
    document.getElementById('scarabInput').value = '';
    document.getElementById('currencyInput').value = '';
    document.getElementById('mapInput').value = '';
    document.getElementById('ngModCheckbox').checked = false;
    document.getElementById('mapTierCheckbox').checked = false;
    document.getElementById('normalCheckbox').checked = false;
    document.getElementById('magicCheckbox').checked = false;
    document.getElementById('rareCheckbox').checked = false;
    document.getElementById('searchAllRadio').checked = false;
    document.getElementById('searchAnyRadio').checked = true;


    // Clear all checked mods
    checkedMods.clear();

    // Clear all checkboxes
    document.querySelectorAll('#ModList input[type=checkbox]').forEach(checkbox => checkbox.checked = false);

    // Clear local storage
    localStorage.removeItem('searchModeState');
    localStorage.removeItem('inputState');
    localStorage.removeItem('modCheckboxState');
    localStorage.removeItem('ngModChecked');
    localStorage.removeItem('mapTierChecked');
    localStorage.removeItem('normalChecked');
    localStorage.removeItem('magicChecked');
    localStorage.removeItem('rareChecked');

    // Reinitialize ModList and Regex
    ModList = {...originalModList};
    checkedMods.clear();
    updateModList();
    updateCombinedRegex();
}

function getFixedRangeRegex(num, basePattern, optimize = false) {
  num = parseInt(num);
  if (isNaN(num) || num < 0) return '';
  const quant = optimize ? Math.floor(num / 10) * 10 : num;
  let numberRegex;
  if (quant === 0) {
    return num === 0 ? `"${basePattern}0%"` : `"${basePattern}[0-${num}]%"`;
  }
  if (quant <= 9) {
    numberRegex = `[${quant}-9]`;
  }
  else if (quant === 100) {
    return `"${basePattern}\\d..%"`;
  }
  else if (quant < 100) {
    const str = quant.toString();
    const d0 = str[0];
    const d1 = str[1];
    if (d1 === '0') {
      numberRegex = `[${d0}-9].|\\d..`;
    } else if (d0 === '9') {
      numberRegex = `${d0}[${d1}-9]|\\d..`;
    } else {
      numberRegex = `${d0}[${d1}-9]|[${Number(d0) + 1}-9].|\\d..`;
    }
  }
  else if (quant < 200) {
    const str = quant.toString().padStart(3, '0');
    const d1 = str[1];
    const d2 = str[2];
    if (d2 === '0') {
      numberRegex = `1[${d1}-9].|[2-9]..`;
    } else if (d1 === '0') {
      numberRegex = `\\d0[${d2}-9]|\\d[1-9].`;
    } else if (d1 === '9' && d2 === '9') {
      numberRegex = `199|[2-9]..`;
    } else {
      numberRegex = d1 === '9'
        ? `19[${d2}-9]|[2-9]..`
        : `1([${d1}-9][${d2}-9]|[${Number(d1) + 1}-9].)|[2-9]..`;
    }
  }
  else {
    numberRegex = `[2-9]..`;
  }
  return `"${basePattern}${quant >= 10 ? '(' + numberRegex + ')' : numberRegex}%"`;
}

function filterEffects() {
    const searchTerm = document.getElementById('effectSearch').value.toLowerCase();
    const ModListDiv = document.getElementById('ModList');

    const effects = ModListDiv.getElementsByClassName('effect-item');
    const terms = searchTerm.split(/\s+/).filter(t => t); // 空白区切りで複数キーワード

    for (let i = 0; i < effects.length; i++) {
        const label = effects[i].getElementsByTagName('label')[0];
        const mod = ModList[label.htmlFor];
        const searchTargets = currentLanguage === 'ja' ? [mod.mod, mod.engMod] : [mod.engMod, mod.mod];

        const match = terms.every(term =>
            searchTargets.some(target =>
                target.toLowerCase().includes(term)
            )
        );

        effects[i].style.display = match ? '' : 'none';
    }
}

    // スクリプトの初期化を修正
    document.addEventListener('DOMContentLoaded', () => {
        // 初期化処理を即時実行
        initializeApplication();
    });

    function initializeApplication() {
        // タブ切り替えの初期化
        const initialTab = window.location.hash.slice(1) || 'map';
        const initialTabId = `${initialTab}Content`;
        
        if (document.getElementById(initialTabId)) {
            switchTab(initialTabId);
        } else {
            switchTab('mapContent');
            history.replaceState(null, '', '#map');
        }

        // イベントリスナーの設定
        window.addEventListener('hashchange', handleHashChange);
        
        document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const tabId = this.dataset.tab;
                switchTab(tabId);
            });
        });

        // その他の初期化処理
        loadInitialData();
        setupEventListeners();
    }

// タブ切り替え関数（ハッシュ対応版）
function switchTab(tabId) {
    // すべてのコンテンツを非表示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // 対象コンテンツを表示
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    // ナビゲーションのアクティブ状態更新
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabId) {
            link.classList.add('active');
        }
    });
    
    // 現在のタブをハッシュとして設定（タブIDから'Content'を除く）
    const tabName = tabId.replace('Content', '');
    if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, '', `#${tabName}`);
    }
}


// ハッシュ変更を監視してタブ切り替え
function handleHashChange() {
    const tabName = window.location.hash.slice(1) || 'map';
    const tabId = `${tabName}Content`;
    
    // タブが存在するか確認
    if (document.getElementById(tabId)) {
        switchTab(tabId);
    } else {
        // 無効なハッシュの場合はデフォルトタブ
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }
}


function initializeTooltips() {
    document.querySelectorAll('.effect-item').forEach(item => {
        const tooltip = item.querySelector('.tooltip');

        if (tooltip) {
            item.addEventListener('mouseover', () => {
                tooltip.classList.add('tooltip-visible');
            });
            item.addEventListener('mouseout', () => {
                tooltip.classList.remove('tooltip-visible');
            });
        }
    });
}
// チェックボックスの状態を保存する関数
function saveCheckboxState() {
    const ngModCheckbox = document.getElementById('ngModCheckbox');
    const mapTierCheckbox = document.getElementById('mapTierCheckbox');

    localStorage.setItem('ngModChecked', ngModCheckbox.checked);
    localStorage.setItem('mapTierChecked', mapTierCheckbox.checked);
}

// チェックボックスの状態を復元する関数
function loadCheckboxState() {
    const ngModChecked = localStorage.getItem('ngModChecked') === 'true';
    const mapTierChecked = localStorage.getItem('mapTierChecked') === 'true';

    document.getElementById('ngModCheckbox').checked = ngModChecked;
    document.getElementById('mapTierCheckbox').checked = mapTierChecked;
}

// MODチェックボックスの状態を保存する関数
function saveModCheckboxState() {
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    const state = {};
    checkboxes.forEach(checkbox => {
        state[checkbox.id] = checkbox.checked;
    });
    localStorage.setItem('modCheckboxState', JSON.stringify(state));
}

function addModCheckboxEventListeners() {
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkedMods.add(checkbox.value);
            } else {
                checkedMods.delete(checkbox.value);
            }
            updateCombinedRegex();
            saveModCheckboxState();
        });
    });
}



// MODリストの更新後にイベントリスナーを追加
function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    // ModListをtierでソート
    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(value.modTier17 && !isT17))
        .sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);

    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });

    // チェックボックスのイベントリスナーを追加
    addModCheckboxEventListeners();
}



function loadModCheckboxState() {
    const state = JSON.parse(localStorage.getItem('modCheckboxState') || '{}');
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = state[checkbox.id] || false;
        checkbox.dispatchEvent(new Event('change')); // チェック状態の変更を即時通知
    });

    // チェックボックスの状態をcheckedModsに反映
    checkedMods.clear(); // 現在の状態をクリア
    Object.keys(state).forEach(id => {
        if (state[id]) {
            checkedMods.add(id);
        }
    });
}

function saveInputState() {
    const state = {
        itemQuantity: document.getElementById('itemQuantityInput').value,
        packSize: document.getElementById('packSizeInput').value,
        scarab: document.getElementById('scarabInput').value,
        currency: document.getElementById('currencyInput').value,
        map: document.getElementById('mapInput').value
    };
    localStorage.setItem('inputState', JSON.stringify(state));
}

function loadInputState() {
    const state = JSON.parse(localStorage.getItem('inputState') || '{}');
    document.getElementById('itemQuantityInput').value = state.itemQuantity || '';
    document.getElementById('packSizeInput').value = state.packSize || '';
    document.getElementById('scarabInput').value = state.scarab || '';
    document.getElementById('currencyInput').value = state.currency || '';
    document.getElementById('mapInput').value = state.map || '';
}


// チェックボックスの状態を保存するイベントリスナーを追加
document.getElementById('ngModCheckbox').addEventListener('change', saveCheckboxState);
document.getElementById('mapTierCheckbox').addEventListener('change', saveCheckboxState);

// ページロード時にチェックボックスの状態を復元
document.addEventListener('DOMContentLoaded', loadCheckboxState);


document.addEventListener('DOMContentLoaded', () => {
document.getElementById('normalCheckbox').addEventListener('change', updateCombinedRegex);
document.getElementById('magicCheckbox').addEventListener('change', updateCombinedRegex);
document.getElementById('rareCheckbox').addEventListener('change', updateCombinedRegex);
document.getElementById('searchAllRadio').addEventListener('change', updateSearchMode);
document.getElementById('searchAnyRadio').addEventListener('change', updateSearchMode);

loadInputState();
//一時的に
function saveSearchModeState() {
    const state = {
        searchMode: searchAllMode ? 'all' : 'any',
        rarityChecked: {
            normal: document.getElementById('normalCheckbox').checked,
            magic: document.getElementById('magicCheckbox').checked,
            rare: document.getElementById('rareCheckbox').checked
        }
    };
    localStorage.setItem('searchModeState', JSON.stringify(state));
}

function loadSearchModeState() {
    const state = JSON.parse(localStorage.getItem('searchModeState') || '{}');
    if (state.searchMode === 'any') {
        document.getElementById('searchAnyRadio').checked = true;
    } else {
        document.getElementById('searchAllRadio').checked = true;
    }
    document.getElementById('normalCheckbox').checked = state.rarityChecked?.normal || false;
    document.getElementById('magicCheckbox').checked = state.rarityChecked?.magic || false;
    document.getElementById('rareCheckbox').checked = state.rarityChecked?.rare || false;
    updateSearchMode();
}
function updateSearchMode() {
    searchAllMode = document.getElementById('searchAllRadio').checked;
    saveSearchModeState();
    updateCombinedRegex();
}
//一時的に


document.getElementById('searchAllRadio').addEventListener('change', updateSearchMode);
document.getElementById('searchAnyRadio').addEventListener('change', updateSearchMode);

document.getElementById('normalCheckbox').addEventListener('change', () => {
    saveSearchModeState();
    updateCombinedRegex();
});
document.getElementById('magicCheckbox').addEventListener('change', () => {
    saveSearchModeState();
    updateCombinedRegex();
});
document.getElementById('rareCheckbox').addEventListener('change', () => {
    saveSearchModeState();
    updateCombinedRegex();
});

const inputFields = [
    'itemQuantityInput',
    'packSizeInput',
    'scarabInput',
    'currencyInput',
    'mapInput'
];

inputFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    field.addEventListener('input', () => {
        saveInputState();
        updateCombinedRegex();
    });
});

    loadModCheckboxState();
    loadSearchModeState();
    updateModList();
    switchFunction('map');
    initializeTooltips();
    updateCombinedRegex();
});

// プロファイル関連の関数群
let profiles = {};
let selectedProfile = null;

// プロファイル保存
function saveProfile() {
  const profileName = document.getElementById('profileName').value.trim();
  if (!profileName) {
    alert('プロファイル名を入力してください');
    return;
  }

  // 重複チェック
  if (profiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  // 入力値バリデーション
  if (!validateInputs()) return;

  // 現在の状態をキャプチャ
  profiles[profileName] = {
    mods: Array.from(checkedMods),
    settings: {
      itemQuantity: document.getElementById('itemQuantityInput').value,
      packSize: document.getElementById('packSizeInput').value,
      scarab: document.getElementById('scarabInput').value,
      currency: document.getElementById('currencyInput').value,
      map: document.getElementById('mapInput').value,
      searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
      ngModChecked: document.getElementById('ngModCheckbox').checked,
      mapTierChecked: document.getElementById('mapTierCheckbox').checked,
      rarities: {
        normal: document.getElementById('normalCheckbox').checked,
        magic: document.getElementById('magicCheckbox').checked,
        rare: document.getElementById('rareCheckbox').checked
      }
    }
  };

  localStorage.setItem('poeProfiles', JSON.stringify(profiles));
  updateProfileList();

  // ローカルストレージ更新
  saveModCheckboxState();
  saveInputState();
  saveCheckboxState();
  saveSearchModeState();

  alert(`"${profileName}" を保存しました`);
  document.getElementById('profileName').value = '';
}

// プロファイル読み込み
function loadProfile() {
  const profileName = document.getElementById('profileList').value;
  if (!profileName || !profiles[profileName]) {
    alert('プロファイルを選択してください');
    return;
  }

  try {
    // 完全リセット
    resetAll();

    const profile = profiles[profileName];

    // 入力値復元
    document.getElementById('itemQuantityInput').value = profile.settings.itemQuantity || '';
    document.getElementById('packSizeInput').value = profile.settings.packSize || '';
    document.getElementById('scarabInput').value = profile.settings.scarab || '';
    document.getElementById('currencyInput').value = profile.settings.currency || '';
    document.getElementById('mapInput').value = profile.settings.map || '';

    // チェックボックス状態復元
    document.getElementById('ngModCheckbox').checked = profile.settings.ngModChecked;
    document.getElementById('mapTierCheckbox').checked = profile.settings.mapTierChecked;
    document.getElementById('normalCheckbox').checked = profile.settings.rarities.normal;
    document.getElementById('magicCheckbox').checked = profile.settings.rarities.magic;
    document.getElementById('rareCheckbox').checked = profile.settings.rarities.rare;

    // 検索モード
    const searchMode = profile.settings.searchMode || 'any';
    document.querySelector(`input[name="searchMode"][value="${searchMode}"]`).checked = true;

    // MODチェックボックス復元
    checkedMods.clear();
    profile.mods.forEach(mod => {
      if (ModList[mod]) checkedMods.add(mod);
    });

    // ローカルストレージ更新
    localStorage.setItem('modCheckboxState', JSON.stringify(
      Object.fromEntries([...checkedMods].map(mod => [mod, true]))
    ));

    // UI強制更新
    updateModList();
    updateCombinedRegex();
    document.getElementById('profileName').value = profileName;

    // イベントトリガー
    ['change', 'input'].forEach(event => {
      document.getElementById('mapTierCheckbox').dispatchEvent(new Event(event));
      document.getElementById('ngModCheckbox').dispatchEvent(new Event(event));
    });

    console.log('プロファイル読み込み成功:', profileName);
  } catch (error) {
    console.error('プロファイル読み込みエラー:', error);
    alert('プロファイルの読み込みに失敗しました');
  }
}

// プロファイル削除
function deleteProfile() {
  const profileName = document.getElementById('profileList').value;
  if (!profileName || !profiles[profileName]) {
    alert('削除するプロファイルを選択してください');
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete profiles[profileName];
    localStorage.setItem('poeProfiles', JSON.stringify(profiles));
    updateProfileList();
    alert(`"${profileName}" を削除しました`);
  }
}

// プロファイルリスト更新
function updateProfileList() {
  const select = document.getElementById('profileList');
  const currentValue = select.value;

  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(profiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

// 入力バリデーション
function validateInputs() {
  const inputs = [
    'itemQuantityInput',
    'packSizeInput',
    'scarabInput',
    'currencyInput',
    'mapInput'
  ];

  for (const id of inputs) {
    const value = document.getElementById(id).value;
    if (value && (isNaN(value) || value < 0)) {
      alert(`${id.replace('Input', '')} には0以上の数値を入力してください`);
      document.getElementById(id).focus();
      return false;
    }
  }
  return true;
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // プロファイルリストのイベントリスナー
  document.getElementById('profileList').addEventListener('change', function() {
    if (this.value) {
      loadProfile();
      document.getElementById('profileName').value = this.value;
    }
  });

});
document.addEventListener('DOMContentLoaded', () => {
  // 既存の初期化処理...

  // プロファイル読み込み後に強制更新を追加
  loadModCheckboxState();
  loadInputState();
  loadCheckboxState();
  loadSearchModeState();
  updateModList();
  updateCombinedRegex();
});

// プロファイル削除
function deleteProfile() {
  const profileName = document.getElementById('profileList').value;
  if (!profileName || !confirm(`${profileName}を削除しますか？`)) return;

  delete profiles[profileName];
  localStorage.setItem('poeProfiles', JSON.stringify(profiles));
  updateProfileList();
}

// プロファイルリスト更新
function updateProfileList() {
  const select = document.getElementById('profileList');
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(profiles).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// 初期化時にプロファイル読み込み
document.addEventListener('DOMContentLoaded', () => {
  const savedProfiles = localStorage.getItem('poeProfiles');
  if (savedProfiles) {
    profiles = JSON.parse(savedProfiles);
    updateProfileList();
  }
});

function exportProfiles() {
  const data = JSON.stringify(profiles);
  const blob = new Blob([data], {type: 'application/json'});
  // ダウンロード処理...
}

function importProfiles(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    profiles = JSON.parse(e.target.result);
    updateProfileList();
  };
  reader.readAsText(file);
}

// ビースト
// ソート状態を管理する変数
let beastSortColumn = null;
let beastSortDirection = 'asc';

// ビーストリストのレンダリング（ソート機能追加）
function renderbeastlist() {
  const container = document.getElementById('beastlistContainer');
  container.innerHTML = '';
  
  // ビーストデータを配列に変換
  let beasts = Object.entries(beastlist);
  
  // ソート処理
  if (beastSortColumn) {
    beasts.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (beastSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = nameA;
          valueB = nameB;
          break;
        case 'family':
          valueA = dataA.family;
          valueB = dataB.family;
          break;
        case 'effect':
          valueA = dataA.effect;
          valueB = dataB.effect;
          break;
        default:
          return 0;
      }
      
      // 数値と文字列で比較方法を変更
      let comparison = 0;
      if (typeof valueA === 'number') {
        comparison = valueA - valueB;
      } else {
        comparison = valueA.localeCompare(valueB);
      }
      
      return beastSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  beasts.forEach(([name, data]) => {
    const beastItem = document.createElement('div');
    beastItem.className = 'beast-item';
    beastItem.dataset.engName = data.engName;
    
    // 行全体クリックイベントを追加
    beastItem.addEventListener('click', function(e) {
      // チェックボックス自体のクリックは除外
      if (e.target.tagName !== 'INPUT') {
        const checkbox = beastItem.querySelector('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    beastItem.innerHTML = `
      <div class="beast-select">
        <input type="checkbox" id="beast-${name}" value="${name}">
      </div>
      <div class="beast-price">${data.chaosValue}</div>
      <div class="beast-name">${name}</div>
      <div class="beast-family">${data.family}</div>
      <div class="beast-effect">${data.effect}</div>
    `;

    const checkbox = beastItem.querySelector('input');
    checkbox.checked = checkedBeasts.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedBeasts.add(name);
      } else {
        checkedBeasts.delete(name);
      }
      updateBeastRegex();
      saveBeastCheckboxState();
    });
    
    container.appendChild(beastItem);
  });
}

// ソート処理関数
function sortBeasts(column) {
  // 同じカラムをクリックした場合は昇順/降順を切り替え
  if (beastSortColumn === column) {
    beastSortDirection = beastSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    beastSortColumn = column;
    beastSortDirection = 'asc';
  }
  
  // ソートアイコンを更新
  updateSortIcons();
  
  // リストを再描画
  renderbeastlist();
}

// ソートアイコンを更新
function updateSortIcons() {
  const headers = document.querySelectorAll('.beast-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === beastSortColumn) {
      // 修正: 昇順は↓、降順は↑（直感的な表示に変更）
      header.innerHTML += beastSortDirection === 'asc' ? ' ↓' : ' ↑';
    }
  });
}

// ビーストRegex更新
function updateBeastRegex() {
  const selectedRegexes = Array.from(checkedBeasts).map(name => beastlist[name].regex);
  const regex = selectedRegexes.join('|');
  
  document.getElementById('beastRegexOutput').textContent = regex;
  
  // 文字数カウント
  const charCount = regex.length;
  const charCountElement = document.getElementById('beastCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

// ビースト選択リセット
function resetBeastSelection() {
  checkedBeasts.clear();
  document.querySelectorAll('#beastlistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateBeastRegex();
  saveBeastCheckboxState();
}

// ビーストRegexコピー
function copyBeastRegex() {
  const regex = document.getElementById('beastRegexOutput').textContent;
  navigator.clipboard.writeText(regex)
    .then(() => alert('クリップボードにコピーしました'))
    .catch(err => console.error('コピー失敗:', err));
}

// ビースト検索
function filterBeasts() {
  const term = document.getElementById('beastSearch').value.toLowerCase();
  
  document.querySelectorAll('.beast-item').forEach(item => {
    const japaneseName = item.querySelector('.beast-name').textContent.toLowerCase();
    const englishName = beastlist[japaneseName]?.engName.toLowerCase() || '';
    const family = item.querySelector('.beast-family').textContent.toLowerCase();
    const effect = item.querySelector('.beast-effect').textContent.toLowerCase();
    
    const match = 
      japaneseName.includes(term) || 
      englishName.includes(term) || 
      family.includes(term) || 
      effect.includes(term);
    
    item.style.display = match ? 'flex' : 'none';
  });
}

// チェックボックス状態保存
function saveBeastCheckboxState() {
  const state = Array.from(checkedBeasts);
  localStorage.setItem('beastCheckboxState', JSON.stringify(state));
}

// チェックボックス状態復元
function loadBeastCheckboxState() {
  const saved = localStorage.getItem('beastCheckboxState');
  if (saved) {
    checkedBeasts = new Set(JSON.parse(saved));
  }
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // ソートヘッダーの設定
  document.querySelectorAll('.beast-header > div[data-column]').forEach(header => {
    header.addEventListener('click', () => {
      sortBeasts(header.dataset.column);
    });
  });
  
  // ビースト関連の初期化
  loadBeastCheckboxState();
  renderbeastlist();
  updateBeastRegex();
});

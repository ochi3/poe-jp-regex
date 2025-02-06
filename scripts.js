let ModList = {...originalModList};

let currentLanguage = 'ja';
let checkedMods = new Set();

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
        rarities.ja.push('ノ');
        rarities.en.push('n');
    }
    if (magicChecked) {
        rarities.ja.push('マ');
        rarities.en.push('m');
    }
    if (rareChecked) {
        rarities.ja.push('レ');
        rarities.en.push('r');
    }

    const currentRarities = rarities[currentLanguage];

    if (currentRarities.length === 0 || currentRarities.length === 3) {
        return '';
    } else if (currentRarities.length === 1) {
        return currentLanguage === 'ja'
            ? `"ィ: ${currentRarities[0]}"`
            : `"y: ${currentRarities[0]}"`;
    } else {
        return currentLanguage === 'ja'
            ? `"ィ: (${currentRarities.join('|')})"`
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

    let ModListResult = '';
    if (effectResults.length > 0) {
        ModListResult = effectResults.join('|');
        if (ngModChecked) {
            ModListResult = `"!${ModListResult}"`;
        }
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
    if (rarityRegex) {
        combinedResult = `${rarityRegex} ${combinedResult}`.trim();
    }

    combinedResult = `${ModListResult} ${combinedResult}`.trim();
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

    if (charCount > 50) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (50文字を超えています)';
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

function getFixedRangeRegex(num, basePattern) {
    num = parseInt(num);
    if (isNaN(num) || num < 0) return '';

    if (num >= 200) {
        return `"${basePattern}2..%"`;
    } else if (num >= 190) {
        return `"${basePattern}19.%"`;
    } else if (num >= 180) {
        return `"${basePattern}1[89].%"`;
    } else if (num >= 170) {
        return `"${basePattern}1[7-9].%"`;
    } else if (num >= 160) {
        return `"${basePattern}1[6-9].%"`;
    } else if (num >= 150) {
        return `"${basePattern}1[5-9].%"`;
    } else if (num >= 140) {
        return `"${basePattern}1[4-9].%"`;
    } else if (num >= 130) {
        return `"${basePattern}1[3-9].%"`;
    } else if (num >= 120) {
        return `"${basePattern}1[2-9].%"`;
    } else if (num >= 110) {
        return `"${basePattern}1[1-9].%"`;
    } else if (num >= 100) {
        return `"${basePattern}\\d{3}%"`;
    } else if (num >= 90) {
        return `"${basePattern}(9.|1..)%"`;
    } else if (num >= 80) {
        return `"${basePattern}([89].|1..)%"`;
    } else if (num >= 70) {
        return `"${basePattern}([7-9].|1..)%"`;
    } else if (num >= 60) {
        return `"${basePattern}([6-9].|1..)%"`;
    } else if (num >= 50) {
        return `"${basePattern}([5-9].|1..)%"`;
    } else if (num >= 40) {
        return `"${basePattern}([4-9].|1..)%"`;
    } else if (num >= 30) {
        return `"${basePattern}([3-9].|1..)%"`;
    } else if (num >= 20) {
        return `"${basePattern}([2-9].|1..)%"`;
    } else if (num >= 10) {
        return `"${basePattern}([1-9].|1..)%"`;
    } else {
        return `"${basePattern}[1-9]%"`;
    }
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

function switchFunction(type) {
  const contents = ['mapContent', 'transContent', 'flaskContent', 'beastContent', 'expeContent'];
  contents.forEach(content => {
    document.getElementById(content).style.display = 'none';
  });
  document.getElementById(`${type}Content`).style.display = 'block';

  updateNavigation(type);

  if (type === 'map') {
    updateModList();
    updateCombinedRegex();
  } else if (type === 'trans') {
    document.getElementById('engRegexInput').value = '';
    document.getElementById('jpRegexOutput').textContent = '';
    document.getElementById('detailsList').innerHTML = '';
  }

  document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
  link.classList.remove('active');
  if (link.getAttribute('href') === `#${type}`) {
    link.classList.add('active');
  }
});

}

function updateNavigation(type) {
  history.pushState(null, '', `#${type}`);
}


// ナビゲーション処理を強化したバージョン
let currentHash = '';

function handleNavigation() {
  const validSections = ['map', 'trans', 'flask', 'beast', 'expe'];
  const newHash = window.location.hash.slice(1).toLowerCase();
  const targetSection = validSections.includes(newHash) ? newHash : 'map';

  // ハッシュが実際に変更された場合のみ処理
  if (currentHash !== targetSection) {
    currentHash = targetSection;
    switchFunction(targetSection);
  }

  // 不正なハッシュを修正
  if (window.location.hash !== `#${targetSection}`) {
    history.replaceState(null, '', `#${targetSection}`);
  }
}

// コンテンツ切り替え関数の改善
function switchFunction(type) {
  const contents = ['mapContent', 'transContent', 'flaskContent', 'beastContent', 'expeContent'];

  // すべてのコンテンツを非表示
  contents.forEach(content => {
    document.getElementById(content).style.display = 'none';
  });

  // 対象コンテンツを表示
  const targetContent = `${type}Content`;
  if (document.getElementById(targetContent)) {
    document.getElementById(targetContent).style.display = 'block';
  }

  // ナビゲーションのアクティブ状態更新
  document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${type}`) {
      link.classList.add('active');
    }
  });

  // ハッシュの整合性を保証
  if (window.location.hash !== `#${type}`) {
    history.replaceState(null, '', `#${type}`);
  }
}

// イベントリスナーの設定
window.addEventListener('hashchange', handleNavigation);
window.addEventListener('load', handleNavigation);
window.addEventListener('popstate', handleNavigation);

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // 最初のハッシュチェックを厳密に行う
  const initialHash = window.location.hash.slice(1).toLowerCase();
  if (!['map', 'trans', 'flask', 'beast', 'expe'].includes(initialHash)) {
    history.replaceState(null, '', '#map');
  }
  handleNavigation();

  // サイドメニューのクリック処理
  document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const type = link.getAttribute('href').slice(1);
      if (currentHash !== type) {
        window.location.hash = type;
      }
    });
  });
});

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



// ページロード時にチェックボックスの状態を復元
document.addEventListener('DOMContentLoaded', () => {
    loadCheckboxState();
    updateModList();
    updateCombinedRegex();
});

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

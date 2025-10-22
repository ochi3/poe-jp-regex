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

    const selectedMods = [];
    const unselectedMods = [];

    Object.entries(ModList)
        .filter(([key, value]) => !(!isT17 && value.modTier17))
        .forEach(([key, value]) => {
            if (checkedMods.has(key)) {
                selectedMods.push([key, value]);
            } else {
                unselectedMods.push([key, value]);
            }
        });

    selectedMods.sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);
    
    unselectedMods.sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);

    const sortedModList = [...selectedMods, ...unselectedMods];

    sortedMods.forEach(([key, value]) => {
        addEffectItem(key, value);
    });

    addModCheckboxEventListeners();
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
        updateModList();
    };

    const labelElem = document.createElement('label');
    labelElem.htmlFor = key;
    labelElem.textContent = currentLanguage === 'ja' ? value.mod : value.engMod;

    const effectItem = document.createElement('div');
    effectItem.classList.add('effect-item');
    
    effectItem.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT') {
            checkbox.checked = !checkbox.checked;
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
        }
    });
    
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
    const rarityValue = document.getElementById('rarityInput').value;
    const ngModChecked = document.getElementById('ngModCheckbox').checked;

    let combinedResult = '';
    const effectResults = [];

    const validCheckedMods = new Set();
    
    checkedMods.forEach((key) => {
        const mod = ModList[key];
        if (mod) {
            effectResults.push(currentLanguage === 'ja' ? mod.Regex : mod.engRegex);
            validCheckedMods.add(key);
        }
    });

    checkedMods = validCheckedMods;

    const uniqueEffectResults = [...new Set(effectResults)];
    
    let ModListResult = uniqueEffectResults.length > 0 ? uniqueEffectResults.join('|') : '';

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

    if (rarityValue) {
        const rarityRegex = getFixedRangeRegex(rarityValue, currentLanguage === 'ja' ? 'ティ:.*' : 'm rar.*');
        combinedResult += ` ${rarityRegex}`;
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
        const scarabRegex = getFixedRangeRegex(scarabValue, currentLanguage === 'ja' ? 'ラベ:.*' : 're s.*');
        extraRegex.push(scarabRegex);
    }

    if (currencyValue) {
        const currencyRegex = getFixedRangeRegex(currencyValue, currentLanguage === 'ja' ? 'シー:.*' : 're cur.*');
        extraRegex.push(currencyRegex);
    }

    if (mapValue) {
        const mapRegex = getFixedRangeRegex(mapValue, currentLanguage === 'ja' ? 'ップ:.*' : 're maps.*');
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
    .then(() => {
      if (typeof showNotification === 'function') {
        showNotification('コピーしました！');
      } else {
        alert('コピーしました！');
      }
    })
    .catch(err => {
      console.error('クリップボードへのコピーに失敗しました', err);
      if (typeof showNotification === 'function') {
        showNotification('❌ コピー失敗', true);
      }
    });
}

function resetAll() {
    document.getElementById('itemQuantityInput').value = '';
    document.getElementById('packSizeInput').value = '';
    document.getElementById('rarityInput').value = '';
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


    checkedMods.clear();

    document.querySelectorAll('#ModList input[type=checkbox]').forEach(checkbox => checkbox.checked = false);

    localStorage.removeItem('searchModeState');
    localStorage.removeItem('inputState');
    localStorage.removeItem('modCheckboxState');
    localStorage.removeItem('ngModChecked');
    localStorage.removeItem('mapTierChecked');
    localStorage.removeItem('normalChecked');
    localStorage.removeItem('magicChecked');
    localStorage.removeItem('rareChecked');

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
  } else if (quant === 100) {
    return `"${basePattern}\\d..%"`;
  } else if (quant < 100) {
    const str = quant.toString();
    const d0 = str[0];
    const d1 = str[1] || '0';
    if (d1 === '0') {
      numberRegex = `[${d0}-9].|\\d..`;
    } else if (d0 === '9') {
      numberRegex = `${d0}[${d1}-9]|\\d..`;
    } else {
      numberRegex = `${d0}[${d1}-9]|[${Number(d0) + 1}-9].|\\d..`;
    }
  } else if (quant < 1000) {
    if (quant % 100 === 0) {
      const d0 = quant / 100;
      numberRegex = `[${d0}-9]..`;
    } else {
      // 非キリのいい数字（例: 500）は詳細なマッチ
      const str = quant.toString();
      const d0 = parseInt(str[0]);
      const d1 = parseInt(str[1] || 0);
      const d2 = parseInt(str[2] || 0);
      let parts = [];

      // d0より大きい（例: 6-9xx for 500）
      if (d0 < 9) {
        parts.push(`[${d0 + 1}-9]\\d\\d`);
      }

      // d0で、d1より大きい（例: 51x-59x for 500）
      if (d1 < 9) {
        parts.push(`${d0}[${d1 + 1}-9]\\d`);
      }

      // d0 d1で、d2以上（例: 500-509 for 500）
      parts.push(`${d0}${d1}[${d2}-9]`);

      numberRegex = parts.join('|');
    }
  } else {
    // 1000以上（稀だが、すべてにマッチ）
    numberRegex = `\\d{4,}%`;
  }

  return `"${basePattern}${quant >= 10 ? '(' + numberRegex + ')' : numberRegex}%"`;
}

let currentSearchTerm = '';

function filterEffects() {
    currentSearchTerm = document.getElementById('effectSearch').value.toLowerCase();
    const ModListDiv = document.getElementById('ModList');

    const effects = ModListDiv.getElementsByClassName('effect-item');
    const terms = currentSearchTerm.split(/\s+/).filter(t => t);

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


function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabId) {
            link.classList.add('active');
        }
    });
    
    const tabName = tabId.replace('Content', '');
    if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, '', `#${tabName}`);
    }
}

function handleHashChange() {
    const tabName = window.location.hash.slice(1) || 'map';
    const tabId = `${tabName}Content`;
    
    if (document.getElementById(tabId)) {
        switchTab(tabId);
    } else {
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }
}

function initializeApplication() {
    console.log('Initializing application...');
    
    const initialTab = window.location.hash.slice(1) || 'map';
    const initialTabId = `${initialTab}Content`;
    
    console.log('Initial tab:', initialTab, 'Tab ID:', initialTabId);
    
    if (document.getElementById(initialTabId)) {
        switchTab(initialTabId);
    } else {
        console.log('Defaulting to map tab');
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }

    window.addEventListener('hashchange', handleHashChange);
    
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            console.log('Tab clicked:', tabId);
            switchTab(tabId);
        });
    });

    loadCheckboxState();
    loadInputState();
    loadModCheckboxState();
    loadSearchModeState();
    
    updateModList();
    updateCombinedRegex();
    
    console.log('Application initialized successfully');
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
function saveCheckboxState() {
    const ngModCheckbox = document.getElementById('ngModCheckbox');
    const mapTierCheckbox = document.getElementById('mapTierCheckbox');

    localStorage.setItem('ngModChecked', ngModCheckbox.checked);
    localStorage.setItem('mapTierChecked', mapTierCheckbox.checked);
}

function loadCheckboxState() {
    const ngModChecked = localStorage.getItem('ngModChecked') === 'true';
    const mapTierChecked = localStorage.getItem('mapTierChecked') === 'true';

    document.getElementById('ngModCheckbox').checked = ngModChecked;
    document.getElementById('mapTierCheckbox').checked = mapTierChecked;
}

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

function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    
    const currentSearchTerm = document.getElementById('effectSearch').value.toLowerCase();
    
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    const selectedMods = [];
    const unselectedMods = [];

    Object.entries(ModList)
        .filter(([key, value]) => !(value.modTier17 && !isT17))
        .forEach(([key, value]) => {
            if (checkedMods.has(key)) {
                selectedMods.push([key, value]);
            } else {
                unselectedMods.push([key, value]);
            }
        });

    selectedMods.sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);
    
    unselectedMods.sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);

    const sortedModList = [...selectedMods, ...unselectedMods];

    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });

    addModCheckboxEventListeners();

    if (currentSearchTerm) {
        document.getElementById('effectSearch').value = currentSearchTerm;
        filterEffects();
    }
}

function loadModCheckboxState() {
    const state = JSON.parse(localStorage.getItem('modCheckboxState') || '{}');
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = state[checkbox.id] || false;
        checkbox.dispatchEvent(new Event('change')); 
    });

    // チェックボックスの状態をcheckedModsに反映
    checkedMods.clear();
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
        rarity: document.getElementById('rarityInput').value,
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
    document.getElementById('rarityInput').value = state.rarity || '';
    document.getElementById('scarabInput').value = state.scarab || '';
    document.getElementById('currencyInput').value = state.currency || '';
    document.getElementById('mapInput').value = state.map || '';
}

document.getElementById('ngModCheckbox').addEventListener('change', saveCheckboxState);
document.getElementById('mapTierCheckbox').addEventListener('change', saveCheckboxState);

function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
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
    
    const searchMode = state.searchMode || 'any';
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
        searchModeRadio.checked = true;
    }
    
    document.getElementById('normalCheckbox').checked = state.rarityChecked?.normal || false;
    document.getElementById('magicCheckbox').checked = state.rarityChecked?.magic || false;
    document.getElementById('rareCheckbox').checked = state.rarityChecked?.rare || false;
    
    searchAllMode = searchMode === 'all';
}

let profiles = {};
let selectedProfile = null;

function saveProfile() {
  const profileName = document.getElementById('profileName').value.trim();
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
    settings: {
      itemQuantity: document.getElementById('itemQuantityInput').value,
      packSize: document.getElementById('packSizeInput').value,
      rarity: document.getElementById('rarityInput').value,
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

  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('profileName').value = '';
}

// プロファイル読み込み
function loadProfile() {
  const profileName = document.getElementById('profileList').value;
  if (!profileName || !profiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    // 完全リセット
    resetAll();

    const profile = profiles[profileName];

    // 入力値復元
    document.getElementById('itemQuantityInput').value = profile.settings?.itemQuantity || '';
    document.getElementById('packSizeInput').value = profile.settings?.packSize || '';
    document.getElementById('rarityInput').value = profile.settings?.rarity || '';
    document.getElementById('scarabInput').value = profile.settings?.scarab || '';
    document.getElementById('currencyInput').value = profile.settings?.currency || '';
    document.getElementById('mapInput').value = profile.settings?.map || '';

    // チェックボックス状態復元（オプショナルチェイニングで安全に）
    document.getElementById('ngModCheckbox').checked = profile.settings?.ngModChecked || false;
    document.getElementById('mapTierCheckbox').checked = profile.settings?.mapTierChecked || false;
    document.getElementById('normalCheckbox').checked = profile.settings?.rarities?.normal || false;
    document.getElementById('magicCheckbox').checked = profile.settings?.rarities?.magic || false;
    document.getElementById('rareCheckbox').checked = profile.settings?.rarities?.rare || false;

    // 検索モード
    const searchMode = profile.settings?.searchMode || 'any';
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
      searchModeRadio.checked = true;
    }

    // MODチェックボックス復元 - 存在するMODのみ
    checkedMods.clear();
    if (Array.isArray(profile.mods)) {
      profile.mods.forEach(mod => {
        if (ModList[mod]) {
          checkedMods.add(mod);
        }
      });
    }

    // プロファイル名を入力欄に表示
    document.getElementById('profileName').value = profileName;

    localStorage.setItem('modCheckboxState', JSON.stringify(
      Object.fromEntries([...checkedMods].map(mod => [mod, true]))
    ));

    updateModList();
    updateCombinedRegex();

    ['change', 'input'].forEach(event => {
      document.getElementById('mapTierCheckbox').dispatchEvent(new Event(event));
      document.getElementById('ngModCheckbox').dispatchEvent(new Event(event));
    });

    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('プロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

// プロファイル削除
function deleteProfile() {
  const profileName = document.getElementById('profileList').value;
  if (!profileName || !profiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete profiles[profileName];
    localStorage.setItem('poeProfiles', JSON.stringify(profiles));
    updateProfileList();
    showNotification(`"${profileName}" を削除しました`);
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
    'rarityInput',
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
  document.getElementById('profileList').addEventListener('change', function() {
    if (this.value) {
      loadProfile();
      document.getElementById('profileName').value = this.value;
    }
  });

  const savedProfiles = localStorage.getItem('poeProfiles');
  if (savedProfiles) {
    profiles = JSON.parse(savedProfiles);
    updateProfileList();
  }

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
    'rarityInput',
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

  initializeApplication();
  
  initializeTooltips();
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
let beastSortColumn = null;
let beastSortDirection = 'asc';

// ビーストリストのレンダリング（ソート機能追加）
function renderbeastlist() {
  const container = document.getElementById('beastlistContainer');
  container.innerHTML = '';
  
  let beasts = Object.entries(beastlist);
  
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
    
    beastItem.addEventListener('click', function(e) {
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
  if (beastSortColumn === column) {
    beastSortDirection = beastSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    beastSortColumn = column;
    beastSortDirection = 'asc';
  }
  
  updateSortIcons();
  
  renderbeastlist();
}

function updateSortIcons() {
  const headers = document.querySelectorAll('.beast-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === beastSortColumn) {
      header.innerHTML += beastSortDirection === 'asc' ? ' ↓' : ' ↑';
    }
  });
}

// ビーストRegex更新
function updateBeastRegex() {
  const selectedRegexes = Array.from(checkedBeasts).map(name => beastlist[name].regex);
  const regex = selectedRegexes.join('|');
  
  document.getElementById('beastRegexOutput').textContent = regex;
  
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
  if (regex) {
    navigator.clipboard.writeText(regex)
      .then(() => {
        if (typeof showNotification === 'function') {
          showNotification('コピーしました！');
        } else {
          alert('コピーしました！');
        }
      })
      .catch(err => {
        console.error('コピー失敗:', err);
        if (typeof showNotification === 'function') {
          showNotification('❌ コピー失敗', true);
        }
      });
  }
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

let beastProfiles = {}

// ビーストプロファイル保存
function saveBeastProfile() {
  const profileName = document.getElementById('beastProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (beastProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  beastProfiles[profileName] = {
    beasts: Array.from(checkedBeasts),
    timestamp: Date.now()
  };

  localStorage.setItem('beastProfiles', JSON.stringify(beastProfiles));
  updateBeastProfileList();
  saveBeastCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('beastProfileName').value = '';
}

// ビーストプロファイル読み込み
function loadBeastProfile() {
  const profileName = document.getElementById('beastProfileList').value;
  if (!profileName || !beastProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = beastProfiles[profileName];

    checkedBeasts.clear();
    profile.beasts.forEach(beast => {
      if (beastlist[beast]) checkedBeasts.add(beast);
    });

    document.getElementById('beastProfileName').value = profileName;

    renderbeastlist();
    updateBeastRegex();
    saveBeastCheckboxState();

    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('ビーストプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

// ビーストプロファイル削除
function deleteBeastProfile() {
  const profileName = document.getElementById('beastProfileList').value;
  if (!profileName || !beastProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete beastProfiles[profileName];
    localStorage.setItem('beastProfiles', JSON.stringify(beastProfiles));
    updateBeastProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

// ビーストプロファイルリスト更新
function updateBeastProfileList() {
  const select = document.getElementById('beastProfileList');
  if (!select) return;
  const currentValue = select.value;

  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(beastProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}
// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.beast-header > div[data-column]').forEach(header => {
    header.addEventListener('click', () => {
      sortBeasts(header.dataset.column);
    });
  });
  
  loadBeastCheckboxState();
  renderbeastlist();
  updateBeastRegex();

  const savedBeastProfiles = localStorage.getItem('beastProfiles');
  if (savedBeastProfiles) {
    try {
      beastProfiles = JSON.parse(savedBeastProfiles);
      updateBeastProfileList();
    } catch (e) {
      console.error('beastProfiles の読み込みエラー:', e);
      beastProfiles = {};
    }
  }

  const beastProfileSelect = document.getElementById('beastProfileList');
  if (beastProfileSelect) {
    beastProfileSelect.addEventListener('change', function() {
      if (this.value) {
        loadBeastProfile();
        const nameInput = document.getElementById('beastProfileName');
        if (nameInput) nameInput.value = this.value;
      }
    });
  }

  const beastSaveBtn = document.getElementById('saveBeastProfileBtn');
  if (beastSaveBtn) beastSaveBtn.addEventListener('click', saveBeastProfile);
  const beastDeleteBtn = document.getElementById('deleteBeastProfileBtn');
  if (beastDeleteBtn) beastDeleteBtn.addEventListener('click', deleteBeastProfile);
});
function showNotification(message, isError = false) {
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(container);
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : ''}`;
  notification.textContent = message;
  notification.style.cssText = `
    background: ${isError ? '#5a2d2d' : '#2d5a2d'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid ${isError ? '#e74c3c' : '#4CAF50'};
    opacity: 0;
    white-space: nowrap;
    transition: all 0.3s ease;
    animation: notificationSlideIn 0.3s ease forwards;
  `;
  
  container.appendChild(notification);
  
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes notificationSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

window.showNotification = showNotification;

function applyConvertedToMapMods() {
    const jpRegexOutput = document.getElementById('jpRegexOutput').textContent;
    
    if (!jpRegexOutput.trim()) {
        showNotification('変換されたRegexがありません', true);
        return;
    }

    switchTab('mapContent');
    
    if (currentLanguage !== 'ja') {
        toggleLanguage();
    }

    checkedMods.clear();
    
    const matchedMods = findModsFromJpRegex(jpRegexOutput);
    
    matchedMods.forEach(modKey => {
        checkedMods.add(modKey);
    });

    updateModList();
    updateCombinedRegex();
    saveModCheckboxState();
    
    showNotification(`変換結果を${matchedMods.length}個のModに適用しました`);
}


function findModsFromJpRegex(jpRegex) {
    const matchedMods = new Set();
    
    const cleanRegex = jpRegex.replace(/^"!?|"$/g, '');
    
    const regexParts = cleanRegex.split('|').filter(part => part.trim());
    
    regexParts.forEach(part => {
        Object.entries(ModList).forEach(([key, value]) => {
            if (value.Regex === part) {
                matchedMods.add(key);
            }
            else if (part.includes(value.Regex) || value.Regex.includes(part)) {
                matchedMods.add(key);
            }
        });
    });
    
    return Array.from(matchedMods);
}

function extractModNamesFromRegex(regex) {
    const modNames = [];
    const cleanRegex = regex.replace(/^"!?|"$/g, '');
    const regexParts = cleanRegex.split('|').filter(part => part.trim());
    
    regexParts.forEach(part => {
        Object.entries(ModList).forEach(([key, value]) => {
            if (value.Regex === part) {
                modNames.push(value.mod);
            }
        });
    });
    
    return modNames;
}

function copyUnidentified() {
    const text = currentLanguage === 'ja' ? '未鑑定' : 'unid';
    copyTextToClipboard(text);
}

function copyNormal() {
    const text = currentLanguage === 'ja' ? 'ル$' : '"y: n"';
    copyTextToClipboard(text);
}

function copyMagic() {
    const text = currentLanguage === 'ja' ? 'ク$' : '"y: m"';
    copyTextToClipboard(text);
}

function copyRare() {
    const text = currentLanguage === 'ja' ? 'ア$' : '"y: r"';
    copyTextToClipboard(text);
}

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            if (typeof showNotification === 'function') {
                showNotification('コピーしました！');
            } else {
                alert('コピーしました！');
            }
        })
        .catch(err => {
            console.error('クリップボードへのコピーに失敗しました', err);
            if (typeof showNotification === 'function') {
                showNotification('❌ コピー失敗', true);
            }
        });
}

// 言語切り替え時にツールチップも更新
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    updateModList();
    updateCombinedRegex();
    updateTooltipContent(); // ツールチップ内容を更新
}

// 初期化時にツールチップを設定
function initializeApplication() {
    console.log('Initializing application...');
    
    const initialTab = window.location.hash.slice(1) || 'map';
    const initialTabId = `${initialTab}Content`;
    
    console.log('Initial tab:', initialTab, 'Tab ID:', initialTabId);
    
    if (document.getElementById(initialTabId)) {
        switchTab(initialTabId);
    } else {
        console.log('Defaulting to map tab');
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }

    window.addEventListener('hashchange', handleHashChange);
    
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            console.log('Tab clicked:', tabId);
            switchTab(tabId);
        });
    });

    loadCheckboxState();
    loadInputState();
    loadModCheckboxState();
    loadSearchModeState();
    
    updateModList();
    updateCombinedRegex();
    
    console.log('Application initialized successfully');
}
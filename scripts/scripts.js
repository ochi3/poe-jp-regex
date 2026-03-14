let ModList = {...mapModList};
let currentLanguage = 'ja';
let checkedMods = new Map(); // id -> 'ng' or 'wanted'
let checkedBeasts = new Set();

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    updateModList();
    updateCombinedRegex();
}

// Mod名の#プレースホルダーを実際の値で置換して表示
function formatModText(text, value) {
    if (!text) return text || '';
    if (!value) return text;

    const textParts = text.split('|');
    const valueParts = value.split('|');

    const result = textParts.map((part, i) => {
        const v = valueParts[i] !== undefined ? valueParts[i] : valueParts[0];
        if (!v || v === '1') return part;
        return part
            .replace(/\(##\)/g, `(${v})`)
            .replace(/##/g, v)
            .replace(/#/g, v);
    });

    return result.join('\n');
}

function addEffectItem(key, value) {
    const ModListDiv = document.getElementById('ModList');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = key;
    checkbox.id = key;
    checkbox.style.display = 'none'; // Will be hidden by CSS too
    checkbox.checked = checkedMods.has(key);

    const textSpan = document.createElement('span');
    textSpan.classList.add('mod-text');
    const rawText = currentLanguage === 'ja' ? value.mod : value.engMod;
    textSpan.textContent = formatModText(rawText, value.value);

    const effectItem = document.createElement('div');
    effectItem.classList.add('effect-item');
    effectItem.dataset.modKey = key;  // キーをdata属性に保持 (htmlForより確実)
    
    // Set initial state class
    if (checkedMods.get(key) === 'ng') {
        effectItem.classList.add('ng');
    } else if (checkedMods.get(key) === 'wanted') {
        effectItem.classList.add('wanted');
    }

    // click -> NG
    effectItem.addEventListener('click', function(e) {
        e.preventDefault();
        const currentState = checkedMods.get(key);
        if (currentState === 'ng') {
            checkedMods.delete(key);
            this.classList.remove('ng');
        } else {
            checkedMods.set(key, 'ng');
            this.classList.remove('wanted');
            this.classList.add('ng');
        }
        saveModCheckboxState();
        updateCombinedRegex();
        updateModList();
    });

    // right click -> Wanted
    effectItem.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const currentState = checkedMods.get(key);
        if (currentState === 'wanted') {
            checkedMods.delete(key);
            this.classList.remove('wanted');
        } else {
            checkedMods.set(key, 'wanted');
            this.classList.remove('ng');
            this.classList.add('wanted');
        }
        saveModCheckboxState();
        updateCombinedRegex();
        updateModList();
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

    const label = document.createElement('label');
    label.classList.add('mod-label');
    label.htmlFor = key;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.width = '100%';
    label.style.cursor = 'pointer';

    label.appendChild(checkbox);
    label.appendChild(textSpan);

    effectItem.appendChild(label);

    // Add metadata badges
    const badgeContainer = document.createElement('div');
    badgeContainer.classList.add('badge-container');

    const typeBadge = document.createElement('span');
    typeBadge.classList.add('badge', 'type-badge');
    if (value.type === 'Prefix') {
        typeBadge.style.backgroundColor = 'var(--accent-red)';
        typeBadge.textContent = 'P';
    } else {
        typeBadge.style.backgroundColor = 'var(--accent-blue)';
        typeBadge.textContent = 'S';
    }
    badgeContainer.appendChild(typeBadge);

    if (value["map_item_drop_quantity_+%"]) {
        const qtyBadge = document.createElement('span');
        qtyBadge.classList.add('badge', 'qty-badge');
        qtyBadge.textContent = `数量 ${value["map_item_drop_quantity_+%"]}`;
        badgeContainer.appendChild(qtyBadge);
    }
    if (value["map_item_drop_rarity_+%"]) {
        const rarityBadge = document.createElement('span');
        rarityBadge.classList.add('badge', 'rarity-badge');
        rarityBadge.textContent = `レア ${value["map_item_drop_rarity_+%"]}`;
        badgeContainer.appendChild(rarityBadge);
    }
    if (value["map_pack_size_+%"]) {
        const packBadge = document.createElement('span');
        packBadge.classList.add('badge', 'pack-badge');
        packBadge.textContent = `パック ${value["map_pack_size_+%"]}`;
        badgeContainer.appendChild(packBadge);
    }
    if (value["map_map_item_drop_chance_+%_final_from_uber_mod"]) {
        const mapBadge = document.createElement('span');
        mapBadge.classList.add('badge', 'map-badge');
        mapBadge.textContent = `マップ ${value["map_map_item_drop_chance_+%_final_from_uber_mod"]}`;
        badgeContainer.appendChild(mapBadge);
    }
    if (value["map_currency_drop_chance_+%_final_from_uber_mod"]) {
        const currBadge = document.createElement('span');
        currBadge.classList.add('badge', 'currency-badge');
        currBadge.textContent = `カレンシー ${value["map_currency_drop_chance_+%_final_from_uber_mod"]}`;
        badgeContainer.appendChild(currBadge);
    }
    if (value["map_scarab_drop_chance_+%_final_from_uber_mod"]) {
        const scarabBadge = document.createElement('span');
        scarabBadge.classList.add('badge', 'scarab-badge');
        scarabBadge.textContent = `スカラベ ${value["map_scarab_drop_chance_+%_final_from_uber_mod"]}`;
        badgeContainer.appendChild(scarabBadge);
    }

    const showDetails = document.getElementById('showModDetailsCheckbox') ? document.getElementById('showModDetailsCheckbox').checked : true;
    if (!showDetails) {
        badgeContainer.classList.add('hidden');
    }

    effectItem.appendChild(badgeContainer);
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
    const ngResults = [];
    const wantedResults = [];

    const validCheckedMods = new Map();
    
    checkedMods.forEach((state, key) => {
        const mod = ModList[key];
        if (mod) {
            const regex = currentLanguage === 'ja' ? mod.Regex : mod.engRegex;
            if (state === 'ng') {
                ngResults.push(regex);
            } else {
                wantedResults.push(regex);
            }
            validCheckedMods.set(key, state);
        }
    });

    checkedMods = validCheckedMods;

    const uniqueNg = [...new Set(ngResults)];
    const uniqueWanted = [...new Set(wantedResults)];
    
    let ngString = uniqueNg.length > 0 ? `"!${uniqueNg.join('|')}"` : '';
    let wantedString = uniqueWanted.length > 0 ? `"${uniqueWanted.join('|')}"` : '';

    let ModListResult = '';
    if (ngString && wantedString) {
        ModListResult = `${ngString} ${wantedString}`;
    } else if (ngString) {
        ModListResult = ngString;
    } else if (wantedString) {
        ModListResult = wantedString;
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
        const scarabRegex = getFixedRangeRegex(scarabValue, currentLanguage === 'ja' ? 'ラベ量.*' : 're s.*');
        extraRegex.push(scarabRegex);
    }

    if (currencyValue) {
        const currencyRegex = getFixedRangeRegex(currencyValue, currentLanguage === 'ja' ? 'シー量.*' : 're cur.*');
        extraRegex.push(currencyRegex);
    }

    if (mapValue) {
        const mapRegex = getFixedRangeRegex(mapValue, currentLanguage === 'ja' ? 'ップ量.*' : 're maps.*');
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

    updateModList();

    localStorage.removeItem('searchModeState');
    localStorage.removeItem('inputState');
    localStorage.removeItem('modCheckboxState');
    localStorage.removeItem('ngModChecked');
    localStorage.removeItem('mapTierChecked');
    localStorage.removeItem('normalChecked');
    localStorage.removeItem('magicChecked');
    localStorage.removeItem('rareChecked');

    ModList = {...mapModList};
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
        if (terms.length === 0) {
            effects[i].classList.remove('hidden');
            continue;
        }

        const textSpan = effects[i].querySelector('.mod-text');
        const displayedText = textSpan ? textSpan.textContent.toLowerCase() : '';

        const modKey = effects[i].dataset.modKey;
        const mod = modKey ? ModList[modKey] : null;
        const rawJa = mod ? (mod.mod || '') : '';
        const rawEn = mod ? (mod.engMod || '') : '';

        const match = terms.every(term =>
            displayedText.includes(term) ||
            rawJa.toLowerCase().includes(term) ||
            rawEn.toLowerCase().includes(term)
        );

        effects[i].classList.toggle('hidden', !match);
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
    if (!checkedMods) return;
    const state = Object.fromEntries(checkedMods);
    localStorage.setItem('modCheckboxState', JSON.stringify(state));
}

function addModCheckboxEventListeners() {
    // No longer using checkbox events, selection is handled via effect-item clicks
}

function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    
    const currentSearchTerm = document.getElementById('effectSearch').value.toLowerCase();
    
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(value.modTier17 && !isT17))
        .sort(([keyA, valueA], [keyB, valueB]) => {
            const stateA = checkedMods.get(keyA) || 'none';
            const stateB = checkedMods.get(keyB) || 'none';

            // 1. Selection State Priority (Checked > None)
            if (stateA !== 'none' && stateB === 'none') return -1;
            if (stateA === 'none' && stateB !== 'none') return 1;

            if (stateA !== 'none' && stateB !== 'none') {
                // 2. Mod State Priority (NG > Wanted)
                if (stateA === 'ng' && stateB === 'wanted') return -1;
                if (stateA === 'wanted' && stateB === 'ng') return 1;
            }

            // 3. Tier (Highest first)
            if (valueB.tier !== valueA.tier) {
                return valueB.tier - valueA.tier;
            }

            // 4. Type (Prefix > Suffix)
            if (valueA.type === 'Prefix' && valueB.type === 'Suffix') return -1;
            if (valueA.type === 'Suffix' && valueB.type === 'Prefix') return 1;

            return 0;
        });

    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });

    addModCheckboxEventListeners();

    if (currentSearchTerm) {
        document.getElementById('effectSearch').value = currentSearchTerm;
        filterEffects();
    }
}

function toggleModDetails() {
    const showDetails = document.getElementById('showModDetailsCheckbox').checked;
    localStorage.setItem('showModDetails', showDetails);
    
    document.querySelectorAll('.badge-container').forEach(container => {
        if (showDetails) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}

function loadModDetailsState() {
    const showDetails = localStorage.getItem('showModDetails') !== 'false'; // Default to true
    document.getElementById('showModDetailsCheckbox').checked = showDetails;
}

function loadModCheckboxState() {
    const saved = localStorage.getItem('modCheckboxState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            checkedMods = new Map(Object.entries(state));
        } catch (e) {
            console.error('Failed to load modCheckboxState', e);
            checkedMods = new Map();
        }
    } else {
        checkedMods = new Map();
    }
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
    mods: Array.from(checkedMods), // Store as [[id, state], ...]
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
      profile.mods.forEach(modData => {
        // Handle both old Set-based profiles ([id, ...]) and new Map-based ([[id, state], ...])
        if (Array.isArray(modData)) {
            const [id, state] = modData;
            if (ModList[id]) checkedMods.set(id, state);
        } else {
            // Backward compatibility for old profiles (treated as 'ng' by default)
            if (ModList[modData]) checkedMods.set(modData, 'ng');
        }
      });
    }

    // プロファイル名を入力欄に表示
    document.getElementById('profileName').value = profileName;

    saveModCheckboxState();

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

// フィルターリセット (例として残す、または削除検討)
function resetFilterSettings() {
    resetAll();
}

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
let beastSortColumn = 'price';
let beastSortDirection = 'desc';

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
  updateSortIcons(); // 初期ソート状態のアイコンを表示
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
        checkedMods.set(modKey, 'ng');
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

// End of file cleanup


// プロファイルをlocalStorageから読み込む
function loadProfiles() {
    const saved = localStorage.getItem('poeProfiles');
    if (saved) {
        try {
            profiles = JSON.parse(saved);
            updateProfileList();
        } catch (e) {
            console.error('プロファイルの読み込みエラー:', e);
            profiles = {};
        }
    }
}

// 初期化時にツールチップを設定
function initializeApplication() {
    const initialTab = window.location.hash.slice(1) || 'map';
    const initialTabId = `${initialTab}Content`;
    
    if (document.getElementById(initialTabId)) {
        switchTab(initialTabId);
    } else {
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }

    window.addEventListener('hashchange', handleHashChange);
    
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });

    // Load states
    loadProfiles();
    loadCheckboxState();
    loadInputState();
    loadModCheckboxState();
    loadSearchModeState();
    loadModDetailsState();
    
    // Wire up metadata toggle
    const detailCheckbox = document.getElementById('showModDetailsCheckbox');
    if (detailCheckbox) {
        detailCheckbox.addEventListener('change', toggleModDetails);
    }
    
    initializeTooltips();
    updateModList();
    updateCombinedRegex();
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApplication);


// セレクトが変わったときの処理
function onLeagueSelectChange() {
    const select = document.getElementById('leagueSelect');
    const customInput = document.getElementById('leagueInput');
    if (select.value === '__custom__') {
        customInput.style.display = '';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
    saveTradeSettings();
}

// 実際に使うリーグ名を取得する
function getLeagueName() {
    const select = document.getElementById('leagueSelect');
    if (select.value === '__custom__') {
        return document.getElementById('leagueInput').value.trim() || 'Mirage';
    }
    return select.value;
}

function saveTradeSettings() {
    const league = getLeagueName();
    const leagueIsCustom = document.getElementById('leagueSelect').value === '__custom__';
    const method = document.getElementById('tradeMethodSelect').value;
    const minModCount = document.getElementById('minModCountInput').value;
    const memoryMap = document.getElementById('memoryMapCheckbox').checked;
    const mapTierMin = document.getElementById('mapTierMinInput').value;
    const mapTierMax = document.getElementById('mapTierMaxInput').value;
    const buyoutPrice = document.getElementById('buyoutPriceSelect').value;
    const buyoutPriceMin = document.getElementById('buyoutPriceMinInput').value;
    const buyoutPriceMax = document.getElementById('buyoutPriceMaxInput').value;
    const wantedMode = document.getElementById('wantedModModeSelect').value;

    localStorage.setItem('poeTradeLeague', league);
    localStorage.setItem('poeTradeLeagueIsCustom', leagueIsCustom);
    localStorage.setItem('poeTradeMethod', method);
    localStorage.setItem('poeTradeMinModCount', minModCount);
    localStorage.setItem('poeTradeMemoryMap', memoryMap);
    localStorage.setItem('poeTradeMapTierMin', mapTierMin);
    localStorage.setItem('poeTradeMapTierMax', mapTierMax);
    localStorage.setItem('poeTradeBuyoutPrice', buyoutPrice);
    localStorage.setItem('poeTradeBuyoutPriceMin', buyoutPriceMin);
    localStorage.setItem('poeTradeBuyoutPriceMax', buyoutPriceMax);
    localStorage.setItem('poeTradeWantedMode', wantedMode);
}

function loadTradeSettings() {
    const league = localStorage.getItem('poeTradeLeague') || "Mirage";
    const leagueIsCustom = localStorage.getItem('poeTradeLeagueIsCustom') === 'true';
    let method = localStorage.getItem('poeTradeMethod');
    if (method === null) method = "securable";
    let minModCount = localStorage.getItem('poeTradeMinModCount');
    if (minModCount === null) minModCount = "8";
    const memoryMap = localStorage.getItem('poeTradeMemoryMap') === 'true';
    const mapTierMin = localStorage.getItem('poeTradeMapTierMin') || "16";
    const mapTierMax = localStorage.getItem('poeTradeMapTierMax') || "16";
    const buyoutPrice = localStorage.getItem('poeTradeBuyoutPrice') || "";
    const buyoutPriceMin = localStorage.getItem('poeTradeBuyoutPriceMin') || "";
    const buyoutPriceMax = localStorage.getItem('poeTradeBuyoutPriceMax') || "";
    const wantedMode = localStorage.getItem('poeTradeWantedMode') || "any";

    const select = document.getElementById('leagueSelect');
    const customInput = document.getElementById('leagueInput');

    if (leagueIsCustom) {
        select.value = '__custom__';
        customInput.style.display = '';
        customInput.value = league;
    } else {
        // 保存されたリーグがセレクトの選択肢にあればそれを選択
        const hasOption = Array.from(select.options).some(opt => opt.value === league);
        if (hasOption) {
            select.value = league;
            customInput.style.display = 'none';
        } else {
            select.value = '__custom__';
            customInput.style.display = '';
            customInput.value = league;
        }
    }

    document.getElementById('tradeMethodSelect').value = method;
    document.getElementById('minModCountInput').value = minModCount;
    document.getElementById('memoryMapCheckbox').checked = memoryMap;
    document.getElementById('mapTierMinInput').value = mapTierMin;
    document.getElementById('mapTierMaxInput').value = mapTierMax;
    document.getElementById('buyoutPriceSelect').value = buyoutPrice;
    document.getElementById('buyoutPriceMinInput').value = buyoutPriceMin;
    document.getElementById('buyoutPriceMaxInput').value = buyoutPriceMax;
    document.getElementById('wantedModModeSelect').value = wantedMode;
}

function toggleTradeSettings() {
    const panel = document.getElementById('tradeSettingsPanel');
    panel.classList.toggle('open');
}

// Ensure loadTradeSettings is called on window load
const originalOnLoad = window.onload;
window.onload = function() {
    if (originalOnLoad) originalOnLoad();
    loadTradeSettings();
};

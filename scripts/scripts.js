let ModList = {...mapModList};
let currentLanguage = localStorage.getItem('poeLanguage') || 'ja';
if (currentLanguage !== 'ja' && currentLanguage !== 'en') currentLanguage = 'ja';

let checkedMods = new Map(); // id -> 'ng' または 'wanted'
let checkedBeasts = new Set();
let checkedScarabs = new Set();
let checkedTattoos = new Set();
let checkedRunegrafts = new Set();

let scarabSortColumn = 'price';
let scarabSortDirection = 'desc';
let tattooSortColumn = 'price';
let tattooSortDirection = 'desc';
let runegraftSortColumn = 'price';
let runegraftSortDirection = 'desc';

let scarabProfiles = {};
let tattooProfiles = {};
let runegraftProfiles = {};

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    localStorage.setItem('poeLanguage', currentLanguage);
    updateLanguageUI();
    
    updateModList();
    updateCombinedRegex();
    renderscarablist();
    rendertattoolist();
    renderrunegraftlist();
    renderbeastlist();
    updateScarabRegex();
    updateBeastRegex();
    updateTattooRegex();
    updateRunegraftRegex();
    // 保存済み一覧が表示中なら再描画
    const savedContent = document.getElementById('savedContent');
    if (savedContent && savedContent.style.display !== 'none') {
        if (typeof updateSavedRegexDisplay === 'function') updateSavedRegexDisplay();
    }
}

/**
 * 言語設定を読み込み、UIを更新する
 */
function loadLanguageState() {
    const savedLanguage = localStorage.getItem('poeLanguage');
    if (savedLanguage === 'ja' || savedLanguage === 'en') {
        currentLanguage = savedLanguage;
    }
    updateLanguageUI();
}

/**
 * 言語切り替えボタンのテキストを現在の言語に合わせて更新
 */
function updateLanguageUI() {
    const btn = document.getElementById('globalLangToggle');
    if (btn) {
        btn.textContent = `Language: ${currentLanguage.toUpperCase()}`;
    }
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
    checkbox.style.display = 'none'; // CSSでも非表示になります
    checkbox.checked = checkedMods.has(key);

    const textSpan = document.createElement('span');
    textSpan.classList.add('mod-text');
    const rawText = currentLanguage === 'ja' ? value.mod : value.engMod;
    textSpan.textContent = formatModText(rawText, value.value);

    const effectItem = document.createElement('div');
    effectItem.classList.add('effect-item');
    effectItem.dataset.modKey = key;  // キーをdata属性に保持
    
    // 初期状態のクラスを設定
    if (checkedMods.get(key) === 'ng') {
        effectItem.classList.add('ng');
    } else if (checkedMods.get(key) === 'wanted') {
        effectItem.classList.add('wanted');
    }

    // 左クリック -> NG
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

    // 右クリック -> Wanted
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
    
    // ティアによる色分け
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

    // メタデータバッジ (数量、パックサイズなど)
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

    if (ModListResult) {
        if (currentLanguage === 'ja') {
            combinedResult = `${ModListResult}${combinedResult}`.trim();
        } else {
            combinedResult = `${ModListResult} ${combinedResult}`.trim();
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
    // 1桁: [x-9]
    numberRegex = `[${quant}-9]`;
  } else if (quant === 100) {
    // ちょうど100: \d.. (先頭\dで制約、後ろ2桁は.)
    return `"${basePattern}\\d..%"`;
  } else if (quant < 100) {
    // 2桁: 末尾桁は . に
    const str = quant.toString();
    const d0 = str[0];
    const d1 = str[1] || '0';
    if (d1 === '0') {
      // 10, 20, 30 など: [d0-9]. | \d.. (d0=9のときは 9. | \d.. → ただし100+の\d..に含まれるので 9. のみ)
      if (d0 === '9') {
        numberRegex = `9.|\\d..`;
      } else {
        numberRegex = `[${d0}-9].|\\d..`;
      }
    } else if (d0 === '9') {
      // 91, 95 など: 9[d1-9] | \d..
      numberRegex = `${d0}[${d1}-9]|\\d..`;
    } else {
      // 一般: d0[d1-9] | [d0+1-9]. | \d..
      numberRegex = `${d0}[${d1}-9]|[${Number(d0) + 1}-9].|\\d..`;
    }
  } else if (quant < 1000) {
    // 3桁
    if (quant % 100 === 0) {
      // 200, 300 など: [d0-9]..
      const d0 = quant / 100;
      numberRegex = `[${d0}-9]..`;
    } else {
      const str = quant.toString();
      const d0 = parseInt(str[0]);
      const d1 = parseInt(str[1] || 0);
      const d2 = parseInt(str[2] || 0);
      let parts = [];

      if (d2 === 0) {
        // 末桁が0: d0[d1-9]. | [d0+1-9]..
        if (d1 < 9) {
          parts.push(`${d0}[${d1}-9].`);
        } else {
          parts.push(`${d0}9.`);
        }
        if (d0 < 9) {
          parts.push(`[${d0 + 1}-9]..`);
        }
      } else {
        // 一般: [d0+1-9].. | d0[d1+1-9]. | d0d1[d2-9]
        if (d0 < 9) {
          parts.push(`[${d0 + 1}-9]..`);
        }
        if (d1 < 9) {
          parts.push(`${d0}[${d1 + 1}-9].`);
        }
        parts.push(`${d0}${d1}[${d2}-9]`);
      }

      numberRegex = parts.join('|');
    }
  } else {
    // 1000以上
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
    // 選択イベントリスナー（現状はeffect-itemのクリックで処理）
}

function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    
    const currentSearchTerm = document.getElementById('effectSearch').value.toLowerCase();
    
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    const sortSelect = document.getElementById('modSortSelect');
    const sortMethod = sortSelect ? sortSelect.value : 'default';

    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(value.modTier17 && !isT17))
        .sort(([keyA, valueA], [keyB, valueB]) => {
            const stateA = checkedMods.get(keyA) || 'none';
            const stateB = checkedMods.get(keyB) || 'none';

            if (stateA !== 'none' && stateB === 'none') return -1;
            if (stateA === 'none' && stateB !== 'none') return 1;

            if (stateA !== 'none' && stateB !== 'none') {
                if (stateA === 'ng' && stateB === 'wanted') return -1;
                if (stateA === 'wanted' && stateB === 'ng') return 1;
            }

            switch (sortMethod) {
                case 'tier_asc':
                    if (valueA.tier !== valueB.tier) return valueA.tier - valueB.tier;
                    break;
                case 'tier_desc':
                    if (valueA.tier !== valueB.tier) return valueB.tier - valueA.tier;
                    break;
                case 'type_asc':
                    if (valueA.type !== valueB.type) return (valueA.type || '').localeCompare(valueB.type || '');
                    break;
                case 'type_desc':
                    if (valueA.type !== valueB.type) return (valueB.type || '').localeCompare(valueA.type || '');
                    break;
                case 'quantity_asc': {
                    const qA = valueA["map_map_item_drop_chance_+%"] || valueA["map_item_drop_quantity_+%"] || 0;
                    const qB = valueB["map_map_item_drop_chance_+%"] || valueB["map_item_drop_quantity_+%"] || 0;
                    if (qA !== qB) return qA - qB;
                    break;
                }
                case 'quantity_desc': {
                    const qA = valueA["map_map_item_drop_chance_+%"] || valueA["map_item_drop_quantity_+%"] || 0;
                    const qB = valueB["map_map_item_drop_chance_+%"] || valueB["map_item_drop_quantity_+%"] || 0;
                    if (qA !== qB) return qB - qA;
                    break;
                }
                case 'packsize_asc': {
                    const pA = valueA["map_pack_size_+%"] || 0;
                    const pB = valueB["map_pack_size_+%"] || 0;
                    if (pA !== pB) return pA - pB;
                    break;
                }
                case 'packsize_desc': {
                    const pA = valueA["map_pack_size_+%"] || 0;
                    const pB = valueB["map_pack_size_+%"] || 0;
                    if (pA !== pB) return pB - pA;
                    break;
                }
                case 'rarity_asc': {
                    const rA = valueA["map_item_drop_rarity_+%"] || 0;
                    const rB = valueB["map_item_drop_rarity_+%"] || 0;
                    if (rA !== rB) return rA - rB;
                    break;
                }
                case 'rarity_desc': {
                    const rA = valueA["map_item_drop_rarity_+%"] || 0;
                    const rB = valueB["map_item_drop_rarity_+%"] || 0;
                    if (rA !== rB) return rB - rA;
                    break;
                }
                case 'scarab_asc': {
                    const vA = valueA["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                    const vB = valueB["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'scarab_desc': {
                    const vA = valueA["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                    const vB = valueB["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                    if (vA !== vB) return vB - vA;
                    break;
                }
                case 'currency_asc': {
                    const vA = valueA["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                    const vB = valueB["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'currency_desc': {
                    const vA = valueA["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                    const vB = valueB["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                    if (vA !== vB) return vB - vA;
                    break;
                }
                case 'map_asc': {
                    const vA = valueA["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                    const vB = valueB["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'map_desc': {
                    const vA = valueA["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                    const vB = valueB["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                    if (vA !== vB) return vB - vA;
                    break;
                }
                case 'default':
                default:
                    if (valueB.tier !== valueA.tier) return valueB.tier - valueA.tier;
                    break;
            }

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
    const showDetails = localStorage.getItem('showModDetails') !== 'false'; // デフォルトは表示
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
        map: document.getElementById('mapInput').value,
        beastBulkThreshold: document.getElementById('beastBulkThreshold').value,
        beastBulkThresholdMax: document.getElementById('beastBulkThresholdMax').value,
        scarabBulkThreshold: document.getElementById('scarabBulkThreshold').value,
        scarabBulkThresholdMax: document.getElementById('scarabBulkThresholdMax').value,
        tattooBulkThreshold: document.getElementById('tattooBulkThreshold').value,
        tattooBulkThresholdMax: document.getElementById('tattooBulkThresholdMax').value,
        runegraftBulkThreshold: document.getElementById('runegraftBulkThreshold').value,
        runegraftBulkThresholdMax: document.getElementById('runegraftBulkThresholdMax').value
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
    document.getElementById('beastBulkThreshold').value = state.beastBulkThreshold || '10';
    document.getElementById('beastBulkThresholdMax').value = state.beastBulkThresholdMax || '';
    document.getElementById('scarabBulkThreshold').value = state.scarabBulkThreshold || '10';
    document.getElementById('scarabBulkThresholdMax').value = state.scarabBulkThresholdMax || '';
    document.getElementById('tattooBulkThreshold').value = state.tattooBulkThreshold || '10';
    document.getElementById('tattooBulkThresholdMax').value = state.tattooBulkThresholdMax || '';
    document.getElementById('runegraftBulkThreshold').value = state.runegraftBulkThreshold || '10';
    document.getElementById('runegraftBulkThresholdMax').value = state.runegraftBulkThresholdMax || '';
}

document.getElementById('ngModCheckbox').addEventListener('change', saveCheckboxState);
document.getElementById('mapTierCheckbox').addEventListener('change', saveCheckboxState);

function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
        rarityChecked: {
            normal: document.getElementById('normalCheckbox')?.checked || false,
            magic: document.getElementById('magicCheckbox')?.checked || false,
            rare: document.getElementById('rareCheckbox')?.checked || false
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
    
    if (document.getElementById('normalCheckbox')) document.getElementById('normalCheckbox').checked = state.rarityChecked?.normal || false;
    if (document.getElementById('magicCheckbox')) document.getElementById('magicCheckbox').checked = state.rarityChecked?.magic || false;
    if (document.getElementById('rareCheckbox')) document.getElementById('rareCheckbox').checked = state.rarityChecked?.rare || false;
    
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
    mods: Array.from(checkedMods), // [[id, state], ...] の形式で保存
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
        normal: document.getElementById('normalCheckbox')?.checked || false,
        magic: document.getElementById('magicCheckbox')?.checked || false,
        rare: document.getElementById('rareCheckbox')?.checked || false
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
    if (document.getElementById('normalCheckbox')) document.getElementById('normalCheckbox').checked = profile.settings?.rarities?.normal || false;
    if (document.getElementById('magicCheckbox')) document.getElementById('magicCheckbox').checked = profile.settings?.rarities?.magic || false;
    if (document.getElementById('rareCheckbox')) document.getElementById('rareCheckbox').checked = profile.settings?.rarities?.rare || false;

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
  if (!container || typeof beastlist === 'undefined') return;
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

  // 0cのアイテムを除外
  beasts = beasts.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

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
    
    const displayName = currentLanguage === 'ja' ? name : data.engName;
    
    beastItem.innerHTML = `
      <div class="beast-select">
        <input type="checkbox" id="beast-${name}" value="${name}">
      </div>
      <div class="beast-price">${data.chaosValue}</div>
      <div class="beast-name">${displayName}</div>
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
      header.innerHTML += beastSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

// ビーストRegex更新
function updateBeastRegex() {
  const selectedRegexes = Array.from(checkedBeasts).map(name => {
    const data = beastlist[name];
    return (currentLanguage === 'en' && data.enRegex) ? data.enRegex : data.regex;
  });
  const regex = selectedRegexes.length > 0 ? selectedRegexes.join('|') : '';
  
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
    
    item.style.display = match ? '' : 'none';
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

function bulkSelectBeasts() {
    const thresholdInput = document.getElementById('beastBulkThreshold');
    const thresholdMaxInput = document.getElementById('beastBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    // 現在の選択をリセット
    checkedBeasts.clear();

    // 指定範囲内の全てのビーストを選択
    Object.entries(beastlist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedBeasts.add(name);
            }
        }
    });

    // UIと状態を更新
    renderbeastlist();
    saveBeastCheckboxState();
    updateBeastRegex();
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

function copyCorrupted() {
    const text = currentLanguage === 'ja' ? 'コラプト' : 'pted';
    copyTextToClipboard(text);
}

function copyNonCorrupted() {
    const text = currentLanguage === 'ja' ? '!コラプト' : '!pted';
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

// ユーティリティ関数


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

// アプリケーションを開始
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
    const maxModCount = document.getElementById('maxModCountInput').value;
    const corruptedStatus = document.getElementById('corruptedStatusSelect').value;
    const memoryMap = document.getElementById('memoryMapCheckbox').checked;
    const nightmareMap = document.getElementById('nightmareMapCheckbox').checked;
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
    localStorage.setItem('poeTradeMaxModCount', maxModCount);
    localStorage.setItem('poeTradeCorruptedStatus', corruptedStatus);
    localStorage.setItem('poeTradeMemoryMap', memoryMap);
    localStorage.setItem('poeTradeNightmareMap', nightmareMap);
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
    let maxModCount = localStorage.getItem('poeTradeMaxModCount');
    if (maxModCount === null) maxModCount = "8";
    let corruptedStatus = localStorage.getItem('poeTradeCorruptedStatus');
    if (corruptedStatus === null) corruptedStatus = "";

    const memoryMap = localStorage.getItem('poeTradeMemoryMap') === 'true';
    const nightmareMap = localStorage.getItem('poeTradeNightmareMap') === 'true';
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
    document.getElementById('maxModCountInput').value = maxModCount;
    document.getElementById('corruptedStatusSelect').value = corruptedStatus;
    document.getElementById('memoryMapCheckbox').checked = memoryMap;
    document.getElementById('nightmareMapCheckbox').checked = nightmareMap;
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

const originalOnLoad = window.onload;
window.onload = function() {
    if (originalOnLoad) originalOnLoad();
    loadTradeSettings();
};

// 要望・不具合報告
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdrlylmOp34bzayRTtuW19QyO9sRhV1BD0y_kUUnL8Mn5vHtQ/formResponse";
const FEEDBACK_ENTRY_ID = "entry.386755920";
let isFeedbackSubmitting = false;

function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    // 状態をリセット
    document.getElementById('feedbackFormContainer').style.display = 'block';
    document.getElementById('feedbackFooterButtons').style.display = 'block';
    document.getElementById('feedbackSuccessMessage').style.display = 'none';
    document.getElementById('feedbackCloseButton').style.display = 'none';
    document.getElementById('feedbackText').value = '';
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    isFeedbackSubmitting = false;
}

function submitFeedback() {
    const text = document.getElementById('feedbackText').value.trim();
    if (!text) {
        alert("内容を入力してください。");
        return;
    }

    if (isFeedbackSubmitting) return;
    isFeedbackSubmitting = true;

    // 直接送信するための隠しフォームを作成
    const form = document.createElement('form');
    form.action = FEEDBACK_FORM_URL;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.name = FEEDBACK_ENTRY_ID;
    input.value = text;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

function onFeedbackSubmitted() {
    if (!isFeedbackSubmitting) return;
    
    // 表示の切り替え
    document.getElementById('feedbackFormContainer').style.display = 'none';
    document.getElementById('feedbackFooterButtons').style.display = 'none';
    document.getElementById('feedbackSuccessMessage').style.display = 'block';
    document.getElementById('feedbackCloseButton').style.display = 'block';
}

// モーダルの外側をクリックして閉じる
window.onclick = function(event) {
    const feedbackModal = document.getElementById('feedbackModal');
    const flaskModal = document.getElementById('flaskModGroupModal');
    const itemModal = document.getElementById('itemModGroupModal');
    
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    } else if (event.target === flaskModal) {
        closeFlaskModal();
    } else if (event.target === itemModal) {
        closeItemModal();
    }
};
// スカラベ関連ロジック
function renderscarablist() {
  const container = document.getElementById('scarablistContainer');
  if (!container || typeof scarablist === 'undefined') return;
  if (!container) return;
  container.innerHTML = '';
  
  let scarabs = Object.entries(scarablist);
  
  if (scarabSortColumn) {
    scarabs.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (scarabSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = nameA;
          valueB = nameB;
          break;
        case 'description':
          valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
          valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
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
      
      return scarabSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  scarabs = scarabs.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  scarabs.forEach(([name, data]) => {
    const scarabItem = document.createElement('div');
    scarabItem.className = 'scarab-item';
    scarabItem.dataset.engName = data.engName;
    
    scarabItem.addEventListener('click', function(e) {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = scarabItem.querySelector('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = currentLanguage === 'ja' ? name : data.engName;
    const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
    
    scarabItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="scarab-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div style="width: 0; padding: 0; visibility: hidden;"></div>
      <div class="scarab-effect">${displayDesc}</div>
    `;

    const checkbox = scarabItem.querySelector('input');
    checkbox.checked = checkedScarabs.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedScarabs.add(name);
      } else {
        checkedScarabs.delete(name);
      }
      updateScarabRegex();
      saveScarabCheckboxState();
    });
    
    container.appendChild(scarabItem);
  });
}

function sortScarabs(column) {
  if (scarabSortColumn === column) {
    scarabSortDirection = scarabSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    scarabSortColumn = column;
    scarabSortDirection = 'asc';
  }
  updateScarabSortIcons();
  renderscarablist();
}

function updateScarabSortIcons() {
  const headers = document.querySelectorAll('#scarabContent .scarab-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === scarabSortColumn) {
      header.innerHTML += scarabSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateScarabRegex() {
  const selectedRegexes = Array.from(checkedScarabs).map(name => {
    const item = scarablist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  document.getElementById('scarabRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = document.getElementById('scarabCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetScarabSelection() {
  checkedScarabs.clear();
  document.querySelectorAll('#scarablistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateScarabRegex();
  saveScarabCheckboxState();
}

function bulkSelectScarabs() {
    const thresholdInput = document.getElementById('scarabBulkThreshold');
    const thresholdMaxInput = document.getElementById('scarabBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedScarabs.clear();
    Object.entries(scarablist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedScarabs.add(name);
            }
        }
    });

    renderscarablist();
    saveScarabCheckboxState();
    updateScarabRegex();
}

function copyScarabRegex() {
  const regex = document.getElementById('scarabRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterScarabs() {
  const term = document.getElementById('scarabSearch').value.toLowerCase();
  
  document.querySelectorAll('#scarablistContainer .scarab-item').forEach(item => {
    const japaneseName = item.querySelector('.scarab-name').textContent.toLowerCase();
    const englishName = scarablist[japaneseName]?.engName.toLowerCase() || '';
    const description = item.querySelector('.scarab-effect').textContent.toLowerCase();
    
    const match = 
      japaneseName.includes(term) || 
      englishName.includes(term) || 
      description.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

function saveScarabCheckboxState() {
  const state = Array.from(checkedScarabs);
  localStorage.setItem('scarabCheckboxState', JSON.stringify(state));
}

function loadScarabCheckboxState() {
  const saved = localStorage.getItem('scarabCheckboxState');
  if (saved) {
    try {
      checkedScarabs = new Set(JSON.parse(saved));
    } catch (e) {
      console.error('scarabCheckboxState 読み込みエラー:', e);
      checkedScarabs = new Set();
    }
  }
}

function saveScarabProfile() {
  const profileName = document.getElementById('scarabProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (scarabProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  scarabProfiles[profileName] = {
    scarabs: Array.from(checkedScarabs),
    timestamp: Date.now()
  };

  localStorage.setItem('scarabProfiles', JSON.stringify(scarabProfiles));
  updateScarabProfileList();
  saveScarabCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('scarabProfileName').value = '';
}

function loadScarabProfile() {
  const profileName = document.getElementById('scarabProfileList').value;
  if (!profileName || !scarabProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = scarabProfiles[profileName];
    checkedScarabs.clear();
    profile.scarabs.forEach(scarab => {
      if (scarablist[scarab]) checkedScarabs.add(scarab);
    });
    document.getElementById('scarabProfileName').value = profileName;
    renderscarablist();
    updateScarabRegex();
    saveScarabCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('スカラベプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteScarabProfile() {
  const profileName = document.getElementById('scarabProfileList').value;
  if (!profileName || !scarabProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete scarabProfiles[profileName];
    localStorage.setItem('scarabProfiles', JSON.stringify(scarabProfiles));
    updateScarabProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateScarabProfileList() {
  const select = document.getElementById('scarabProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(scarabProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

// --- タトゥー関連ロジック ---
function rendertattoolist() {
  const container = document.getElementById('tattoolistContainer');
  if (!container || typeof tattoolist === 'undefined') return;
  if (!container) return;
  container.innerHTML = '';
  
  let Tattoos = Object.entries(tattoolist);
  
  if (tattooSortColumn) {
    Tattoos.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (tattooSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = nameA;
          valueB = nameB;
          break;
        case 'attribute':
          valueA = String(dataA.attribute || '');
          valueB = String(dataB.attribute || '');
          break;
        case 'description':
          valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
          valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
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
      
      return tattooSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  Tattoos = Tattoos.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  Tattoos.forEach(([name, data]) => {
    const tattooItem = document.createElement('div');
    tattooItem.className = 'tattoo-item';
    tattooItem.dataset.jaName = name;
    tattooItem.dataset.engName = data.engName;
    tattooItem.dataset.attribute = data.attribute || '';
    tattooItem.dataset.description = data.description || '';
    tattooItem.dataset.enDescription = data.enDescription || '';
    
    tattooItem.addEventListener('click', function(e) {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = tattooItem.querySelector('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = currentLanguage === 'ja' ? name : data.engName;
    const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
    
    tattooItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="tattoo-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="scarab-attribute ${data.attribute ? data.attribute.toLowerCase() : ''}">${data.attribute || ''}</div>
      <div class="scarab-effect">${displayDesc}</div>
    `;

    const checkbox = tattooItem.querySelector('input');
    checkbox.checked = checkedTattoos.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedTattoos.add(name);
      } else {
        checkedTattoos.delete(name);
      }
      updateTattooRegex();
      saveTattooCheckboxState();
    });
    
    container.appendChild(tattooItem);
  });
}

function sortTattoos(column) {
  if (tattooSortColumn === column) {
    tattooSortDirection = tattooSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    tattooSortColumn = column;
    tattooSortDirection = 'asc';
  }
  updateTattooSortIcons();
  rendertattoolist();
}

function updateTattooSortIcons() {
  const headers = document.querySelectorAll('#tattooContent .tattoo-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === tattooSortColumn) {
      header.innerHTML += tattooSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateTattooRegex() {
  const selectedRegexes = Array.from(checkedTattoos).map(name => {
    const item = tattoolist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  document.getElementById('tattooRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = document.getElementById('tattooCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetTattooSelection() {
  checkedTattoos.clear();
  document.querySelectorAll('#tattoolistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateTattooRegex();
  saveTattooCheckboxState();
}

function bulkSelectTattoos() {
    const thresholdInput = document.getElementById('tattooBulkThreshold');
    const thresholdMaxInput = document.getElementById('tattooBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedTattoos.clear();
    Object.entries(tattoolist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedTattoos.add(name);
            }
        }
    });

    rendertattoolist();
    saveTattooCheckboxState();
    updateTattooRegex();
}

function copyTattooRegex() {
  const regex = document.getElementById('tattooRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterTattoos() {
  const term = document.getElementById('tattooSearch').value.toLowerCase();
  
  document.querySelectorAll('#tattoolistContainer .tattoo-item').forEach(item => {
    const jaName = (item.dataset.jaName || '').toLowerCase();
    const enName = (item.dataset.engName || '').toLowerCase();
    const attribute = (item.dataset.attribute || '').toLowerCase();
    const jaDesc = (item.dataset.description || '').toLowerCase();
    const enDesc = (item.dataset.enDescription || '').toLowerCase();
    
    const match = 
      jaName.includes(term) || 
      enName.includes(term) || 
      attribute.includes(term) ||
      jaDesc.includes(term) ||
      enDesc.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

function saveTattooCheckboxState() {
  const state = Array.from(checkedTattoos);
  localStorage.setItem('tattooCheckboxState', JSON.stringify(state));
}

function loadTattooCheckboxState() {
  const saved = localStorage.getItem('tattooCheckboxState');
  if (saved) {
    try {
      checkedTattoos = new Set(JSON.parse(saved));
    } catch (e) {
      console.error('tattooCheckboxState 読み込みエラー:', e);
      checkedTattoos = new Set();
    }
  }
}

function saveTattooProfile() {
  const profileName = document.getElementById('tattooProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (tattooProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  tattooProfiles[profileName] = {
    tattoos: Array.from(checkedTattoos),
    timestamp: Date.now()
  };

  localStorage.setItem('tattooProfiles', JSON.stringify(tattooProfiles));
  updateTattooProfileList();
  saveTattooCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('tattooProfileName').value = '';
}

function loadTattooProfile() {
  const profileName = document.getElementById('tattooProfileList').value;
  if (!profileName || !tattooProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = tattooProfiles[profileName];
    checkedTattoos.clear();
    profile.tattoos.forEach(tattoo => {
      if (tattoolist[tattoo]) checkedTattoos.add(tattoo);
    });
    document.getElementById('tattooProfileName').value = profileName;
    rendertattoolist();
    updateTattooRegex();
    saveTattooCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('タトゥープロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteTattooProfile() {
  const profileName = document.getElementById('tattooProfileList').value;
  if (!profileName || !tattooProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete tattooProfiles[profileName];
    localStorage.setItem('tattooProfiles', JSON.stringify(tattooProfiles));
    updateTattooProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateTattooProfileList() {
  const select = document.getElementById('tattooProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(tattooProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

// --- ルーングラフト関連ロジック ---
function renderrunegraftlist() {
  const container = document.getElementById('runegraftlistContainer');
  if (!container || typeof runegraftlist === 'undefined') return;
  if (!container) return;
  container.innerHTML = '';
  
  let Runegrafts = Object.entries(runegraftlist);
  
  if (runegraftSortColumn) {
    Runegrafts.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (runegraftSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = nameA;
          valueB = nameB;
          break;
        case 'attribute':
          valueA = String(dataA.attribute || '');
          valueB = String(dataB.attribute || '');
          break;
        case 'description':
          valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
          valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
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
      
      return runegraftSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  Runegrafts = Runegrafts.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  Runegrafts.forEach(([name, data]) => {
    const runegraftItem = document.createElement('div');
    runegraftItem.className = 'runegraft-item';
    runegraftItem.dataset.jaName = name;
    runegraftItem.dataset.engName = data.engName;
    runegraftItem.dataset.attribute = data.attribute || '';
    runegraftItem.dataset.description = data.description || '';
    runegraftItem.dataset.enDescription = data.enDescription || '';
    
    runegraftItem.addEventListener('click', function(e) {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = runegraftItem.querySelector('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = currentLanguage === 'ja' ? name : data.engName;
    const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
    
    runegraftItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="runegraft-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="scarab-attribute ${data.attribute ? data.attribute.toLowerCase() : ''}">${data.attribute || ''}</div>
      <div class="scarab-effect">${displayDesc}</div>
    `;

    const checkbox = runegraftItem.querySelector('input');
    checkbox.checked = checkedRunegrafts.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedRunegrafts.add(name);
      } else {
        checkedRunegrafts.delete(name);
      }
      updateRunegraftRegex();
      saveRunegraftCheckboxState();
    });
    
    container.appendChild(runegraftItem);
  });
}

function sortRunegrafts(column) {
  if (runegraftSortColumn === column) {
    runegraftSortDirection = runegraftSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    runegraftSortColumn = column;
    runegraftSortDirection = 'asc';
  }
  updateRunegraftSortIcons();
  renderrunegraftlist();
}

function updateRunegraftSortIcons() {
  const headers = document.querySelectorAll('#runegraftContent .runegraft-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === runegraftSortColumn) {
      header.innerHTML += runegraftSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateRunegraftRegex() {
  const selectedRegexes = Array.from(checkedRunegrafts).map(name => {
    const item = runegraftlist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  document.getElementById('runegraftRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = document.getElementById('runegraftCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetRunegraftSelection() {
  checkedRunegrafts.clear();
  document.querySelectorAll('#runegraftlistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateRunegraftRegex();
  saveRunegraftCheckboxState();
}

function bulkSelectRunegrafts() {
    const thresholdInput = document.getElementById('runegraftBulkThreshold');
    const thresholdMaxInput = document.getElementById('runegraftBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedRunegrafts.clear();
    Object.entries(runegraftlist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedRunegrafts.add(name);
            }
        }
    });

    renderrunegraftlist();
    saveRunegraftCheckboxState();
    updateRunegraftRegex();
}

function copyRunegraftRegex() {
  const regex = document.getElementById('runegraftRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterRunegrafts() {
  const term = document.getElementById('runegraftSearch').value.toLowerCase();
  
  document.querySelectorAll('#runegraftlistContainer .runegraft-item').forEach(item => {
    const jaName = (item.dataset.jaName || '').toLowerCase();
    const enName = (item.dataset.engName || '').toLowerCase();
    const attribute = (item.dataset.attribute || '').toLowerCase();
    const jaDesc = (item.dataset.description || '').toLowerCase();
    const enDesc = (item.dataset.enDescription || '').toLowerCase();
    
    const match = 
      jaName.includes(term) || 
      enName.includes(term) || 
      attribute.includes(term) ||
      jaDesc.includes(term) ||
      enDesc.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

function saveRunegraftCheckboxState() {
  const state = Array.from(checkedRunegrafts);
  localStorage.setItem('runegraftCheckboxState', JSON.stringify(state));
}

function loadRunegraftCheckboxState() {
  const saved = localStorage.getItem('runegraftCheckboxState');
  if (saved) {
    try {
      checkedRunegrafts = new Set(JSON.parse(saved));
    } catch (e) {
      console.error('runegraftCheckboxState 読み込みエラー:', e);
      checkedRunegrafts = new Set();
    }
  }
}

function saveRunegraftProfile() {
  const profileName = document.getElementById('runegraftProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (runegraftProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  runegraftProfiles[profileName] = {
    runegrafts: Array.from(checkedRunegrafts),
    timestamp: Date.now()
  };

  localStorage.setItem('runegraftProfiles', JSON.stringify(runegraftProfiles));
  updateRunegraftProfileList();
  saveRunegraftCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('runegraftProfileName').value = '';
}

function loadRunegraftProfile() {
  const profileName = document.getElementById('runegraftProfileList').value;
  if (!profileName || !runegraftProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = runegraftProfiles[profileName];
    checkedRunegrafts.clear();
    profile.runegrafts.forEach(runegraft => {
      if (runegraftlist[runegraft]) checkedRunegrafts.add(runegraft);
    });
    document.getElementById('runegraftProfileName').value = profileName;
    renderrunegraftlist();
    updateRunegraftRegex();
    saveRunegraftCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('ルーングラフトプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteRunegraftProfile() {
  const profileName = document.getElementById('runegraftProfileList').value;
  if (!profileName || !runegraftProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete runegraftProfiles[profileName];
    localStorage.setItem('runegraftProfiles', JSON.stringify(runegraftProfiles));
    updateRunegraftProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateRunegraftProfileList() {
  const select = document.getElementById('runegraftProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(runegraftProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

function initializeApplication() {
    loadLanguageState();
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

    // 各種状態を読み込み
    loadProfiles();
    loadCheckboxState();
    loadInputState();
    loadModCheckboxState();
    loadSearchModeState();
    loadModDetailsState();
    
    loadScarabCheckboxState();
    renderscarablist();
    updateScarabSortIcons();
    updateScarabRegex();

    loadTattooCheckboxState();
    rendertattoolist();
    updateTattooSortIcons();
    updateTattooRegex();

    loadRunegraftCheckboxState();
    renderrunegraftlist();
    updateRunegraftSortIcons();
    updateRunegraftRegex();

    // 各カテゴリのプロファイルを読み込み
    const savedScarabProfiles = localStorage.getItem('scarabProfiles');
    if (savedScarabProfiles) scarabProfiles = JSON.parse(savedScarabProfiles) || {};
    updateScarabProfileList();

    const savedTattooProfiles = localStorage.getItem('tattooProfiles');
    if (savedTattooProfiles) tattooProfiles = JSON.parse(savedTattooProfiles) || {};
    updateTattooProfileList();

    const savedRunegraftProfiles = localStorage.getItem('runegraftProfiles');
    if (savedRunegraftProfiles) runegraftProfiles = JSON.parse(savedRunegraftProfiles) || {};
    updateRunegraftProfileList();

    // プロファイル選択時のイベントリスナーを設定
    const scarabProfileSelect = document.getElementById('scarabProfileList');
    if (scarabProfileSelect) scarabProfileSelect.addEventListener('change', function() { if (this.value) loadScarabProfile(); });
    
    const tattooProfileSelect = document.getElementById('tattooProfileList');
    if (tattooProfileSelect) tattooProfileSelect.addEventListener('change', function() { if (this.value) loadTattooProfile(); });

    const runegraftProfileSelect = document.getElementById('runegraftProfileList');
    if (runegraftProfileSelect) runegraftProfileSelect.addEventListener('change', function() { if (this.value) loadRunegraftProfile(); });
    
    // 詳細表示の切り替えイベントを設定
    const detailCheckbox = document.getElementById('showModDetailsCheckbox');
    if (detailCheckbox) {
        detailCheckbox.addEventListener('change', toggleModDetails);
    }
    
    initializeTooltips();
    updateModList();
    updateCombinedRegex();
}

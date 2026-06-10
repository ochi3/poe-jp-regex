let ModList = {...mapModList};
let currentLanguage = localStorage.getItem('poe2_poeLanguage') || 'ja';
if (currentLanguage !== 'ja' && currentLanguage !== 'en') currentLanguage = 'ja';
const CHANGELOG_VERSION = 'poe2-2026-05-25-2';
const CHANGELOG_STORAGE_KEY = 'poe2ChangelogSeenVersion';

let checkedMods = new Map(); // キー -> 'ng' または 'wanted'

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    localStorage.setItem('poe2_poeLanguage', currentLanguage);
    updateLanguageUI();
    
    updateModList();
    updateCombinedRegex();
    if (typeof updateTabletModList === 'function') updateTabletModList();
    if (typeof updateTabletCombinedRegex === 'function') updateTabletCombinedRegex();
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
    const savedLanguage = localStorage.getItem('poe2_poeLanguage');
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

        const mapChance = value["map_map_item_drop_chance_+%"] || value["map_map_item_drop_chance_+%_final_from_uber_mod"];
    if (mapChance) {
        const mapBadge = document.createElement('span');
        mapBadge.classList.add('badge', 'map-badge');
        mapBadge.textContent = `ウェイストーン ${mapChance}`;
        badgeContainer.appendChild(mapBadge);
    }
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
    const currencyChance = value["map_currency_drop_chance_+%"] || value["map_currency_drop_chance_+%_final_from_uber_mod"];
    if (currencyChance) {
        const currBadge = document.createElement('span');
        currBadge.classList.add('badge', 'currency-badge');
        currBadge.textContent = `カレンシー ${currencyChance}`;
        badgeContainer.appendChild(currBadge);
    }
    const scarabChance = value["map_scarab_drop_chance_+%"] || value["map_scarab_drop_chance_+%_final_from_uber_mod"];
    if (scarabChance) {
        const scarabBadge = document.createElement('span');
        scarabBadge.classList.add('badge', 'scarab-badge');
        scarabBadge.textContent = `スカラベ ${scarabChance}`;
        badgeContainer.appendChild(scarabBadge);
    }
    const rareMonsterCount = value["map_number_of_rare_packs_+%"];
    if (rareMonsterCount) {
        const rareBadge = document.createElement('span');
        rareBadge.classList.add('badge', 'qty-badge'); 
        rareBadge.style.backgroundColor = '#a5a744ff'; 
        rareBadge.textContent = `レアモンスター ${rareMonsterCount}`;
        badgeContainer.appendChild(rareBadge);
    }
    const magicMonsterCount = value["map_number_of_magic_packs_+%"];
    if (magicMonsterCount) {
        const magicBadge = document.createElement('span');
        magicBadge.classList.add('badge', 'qty-badge');
        magicBadge.style.backgroundColor = '#5878e0ff';
        magicBadge.textContent = `マジックモンスター ${magicMonsterCount}`;
        badgeContainer.appendChild(magicBadge);
    }

    const showDetails = document.getElementById('showModDetailsCheckbox')?.checked ?? true;
    if (!showDetails) {
        badgeContainer.classList.add('hidden');
    }

    effectItem.appendChild(badgeContainer);
    ModListDiv.appendChild(effectItem);
}

function generateRarityRegex() {
    const normalChecked = document.getElementById('normalCheckbox')?.checked || false;
    const magicChecked = document.getElementById('magicCheckbox')?.checked || false;
    const rareChecked = document.getElementById('rareCheckbox')?.checked || false;

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

function updateCombinedRegex() {
    const itemQuantityValue = document.getElementById('itemQuantityInput').value;
    const packSizeValue = document.getElementById('packSizeInput').value;
    const rarityValue = document.getElementById('rarityInput').value;
    const ngModChecked = document.getElementById('ngModCheckbox').checked;

    let combinedResult = '';
    const ngResults = [];
    const wantedResults = [];

    if (document.getElementById('packAdditionCheckbox')?.checked) {
        wantedResults.push(currentLanguage === 'ja' ? 'が追.*ク出' : 'l pa');
    }

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

    const waystoneValue = document.getElementById('waystoneInput').value;
    if (waystoneValue) {
        const waystoneRegex = getFixedRangeRegex(
            waystoneValue,
            currentLanguage === 'ja' ? 'プ確.*' : 'p c.*'
        );
        combinedResult += ` ${waystoneRegex}`;
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
    const rareValue = document.getElementById('rareMonsterInput').value;
    const magicValue = document.getElementById('magicMonsterInput').value;

    let monsterRegex = [];
    if (rareValue) {
        monsterRegex.push(getFixedRangeRegex(rareValue, currentLanguage === 'ja' ? 'アモ.*数が' : 'e mo .*'));
    }
    if (magicValue) {
        monsterRegex.push(getFixedRangeRegex(magicValue, currentLanguage === 'ja' ? 'ックモ.*数が' : 'c m.*'));
    }

    let combinedMonster = '';
    if (monsterRegex.length > 0) {
        if (searchAllMode) {
            combinedMonster = monsterRegex.join(' ');
        } else {
            combinedMonster = monsterRegex.join('|').replace(/"/g, '');
            if (monsterRegex.length > 1) {
                combinedMonster = `(${combinedMonster})`;
            }
            // "どれか"モードでも個別の条件として認識させるため、""が必要な場合はgetFixedRangeRegexが付けているが、
            // join('|')で消したため、全体を""で囲む必要がある場合がある。
            // しかしPoEの検索バーでは (a|b) 形式で動作するため、そのままにする。
        }
    }

    let finalResult = [];
    if (combinedMonster) finalResult.push(combinedMonster);

    const deliriumValue = document.getElementById('deliriumInput').value;
    if (deliriumValue) {
        // ユーザー指定形式: ( [X-9]\d+%のせ )
        const firstDigit = deliriumValue.toString()[0];
        if (firstDigit >= '1' && firstDigit <= '9') {
            finalResult.push(`([${firstDigit}-9]\\d+%のせ)`);
        }
    }

    return finalResult.join(' ');
}

function updateCharCount() {
    const result = document.getElementById('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = document.getElementById('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;

    if (charCount > POE2_REGEX_CHAR_LIMIT) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ` (${POE2_REGEX_CHAR_LIMIT}文字を超えています)`;
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
    document.getElementById('rareMonsterInput').value = '';
    document.getElementById('magicMonsterInput').value = '';
    document.getElementById('waystoneInput').value = '';
    document.getElementById('deliriumInput').value = '';
    if (document.getElementById('packAdditionCheckbox')) document.getElementById('packAdditionCheckbox').checked = false;
    if (document.getElementById('corruptedCheckbox')) document.getElementById('corruptedCheckbox').checked = false;
    if (document.getElementById('nonCorruptedCheckbox')) document.getElementById('nonCorruptedCheckbox').checked = false;
    document.getElementById('ngModCheckbox').checked = false;
    if (document.getElementById('mapTierCheckbox')) document.getElementById('mapTierCheckbox').checked = false;
    if (document.getElementById('normalCheckbox')) document.getElementById('normalCheckbox').checked = false;
    if (document.getElementById('magicCheckbox')) document.getElementById('magicCheckbox').checked = false;
    if (document.getElementById('rareCheckbox')) document.getElementById('rareCheckbox').checked = false;
    if (document.getElementById('searchAllRadio')) document.getElementById('searchAllRadio').checked = false;
    if (document.getElementById('searchAnyRadio')) document.getElementById('searchAnyRadio').checked = true;


    checkedMods.clear();

    updateModList();

    localStorage.removeItem('poe2_searchModeState');
    localStorage.removeItem('poe2_inputState');
    localStorage.removeItem('poe2_modCheckboxState');
    localStorage.removeItem('poe2_ngModChecked');
    localStorage.removeItem('poe2_mapTierChecked');
    localStorage.removeItem('poe2_normalChecked');
    localStorage.removeItem('poe2_magicChecked');
    localStorage.removeItem('poe2_rareChecked');

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

    if (tabId === 'changelogContent') {
        markChangelogSeen();
    }
    
    const tabName = tabId.replace('Content', '');
    if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, '', `#${tabName}`);
    }
}

function updateChangelogBadge() {
    const badge = document.getElementById('changelogNewBadge');
    if (!badge) return;
    const seenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    badge.style.display = seenVersion === CHANGELOG_VERSION ? 'none' : 'inline-flex';
}

function markChangelogSeen() {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, CHANGELOG_VERSION);
    updateChangelogBadge();
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
    if (ngModCheckbox) {
        localStorage.setItem('poe2_ngModChecked', ngModCheckbox.checked);
    }
    const mapTierCheckbox = document.getElementById('mapTierCheckbox');
    if (mapTierCheckbox) {
        localStorage.setItem('poe2_mapTierChecked', mapTierCheckbox.checked);
    }
}

function loadCheckboxState() {
    const ngModChecked = localStorage.getItem('poe2_ngModChecked') === 'true';
    const mapTierChecked = localStorage.getItem('poe2_mapTierChecked') === 'true';

    const ngModCheckbox = document.getElementById('ngModCheckbox');
    if (ngModCheckbox) ngModCheckbox.checked = ngModChecked;
    const mapTierCheckbox = document.getElementById('mapTierCheckbox');
    if (mapTierCheckbox) mapTierCheckbox.checked = mapTierChecked;
}

function saveModCheckboxState() {
    if (!checkedMods) return;
    const state = Object.fromEntries(checkedMods);
    localStorage.setItem('poe2_modCheckboxState', JSON.stringify(state));
}

function addModCheckboxEventListeners() {
    // 選択イベントリスナー（現状はeffect-itemのクリックで処理）
}

function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    
    const currentSearchTerm = document.getElementById('effectSearch').value.toLowerCase();
    
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox')?.checked || false;

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
                case 'waystone_asc': {
                    const vA = valueA["map_map_item_drop_chance_+%"] || 0;
                    const vB = valueB["map_map_item_drop_chance_+%"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'waystone_desc': {
                    const vA = valueA["map_map_item_drop_chance_+%"] || 0;
                    const vB = valueB["map_map_item_drop_chance_+%"] || 0;
                    if (vA !== vB) return vB - vA;
                    break;
                }
                case 'rare_asc': {
                    const vA = valueA["map_number_of_rare_packs_+%"] || 0;
                    const vB = valueB["map_number_of_rare_packs_+%"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'rare_desc': {
                    const vA = valueA["map_number_of_rare_packs_+%"] || 0;
                    const vB = valueB["map_number_of_rare_packs_+%"] || 0;
                    if (vA !== vB) return vB - vA;
                    break;
                }
                case 'magic_asc': {
                    const vA = valueA["map_number_of_magic_packs_+%"] || 0;
                    const vB = valueB["map_number_of_magic_packs_+%"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'magic_desc': {
                    const vA = valueA["map_number_of_magic_packs_+%"] || 0;
                    const vB = valueB["map_number_of_magic_packs_+%"] || 0;
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
    const showDetails = document.getElementById('showModDetailsCheckbox')?.checked || false;
    localStorage.setItem('poe2_showModDetails', showDetails);
    
    document.querySelectorAll('.badge-container').forEach(container => {
        if (showDetails) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}

function loadModDetailsState() {
    const showDetails = localStorage.getItem('poe2_showModDetails') !== 'false'; // デフォルトは表示
    if (document.getElementById('showModDetailsCheckbox')) {
        document.getElementById('showModDetailsCheckbox').checked = showDetails;
    }
}

function loadModCheckboxState() {
    const saved = localStorage.getItem('poe2_modCheckboxState');
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
    const state = {};
    const ids = [
        'itemQuantityInput', 'packSizeInput', 'rarityInput', 'rareMonsterInput', 'magicMonsterInput',
        'waystoneInput', 'deliriumInput', 'packAdditionCheckbox'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const key = id.replace('Input', '').replace('Checkbox', '');
            state[key] = el.type === 'checkbox' ? el.checked : el.value;
        }
    });
    localStorage.setItem('poe2_inputState', JSON.stringify(state));
}

function loadInputState() {
    const state = JSON.parse(localStorage.getItem('poe2_inputState') || '{}');
    const mapping = {
        'itemQuantityInput': state.itemQuantity || '',
        'packSizeInput': state.packSize || '',
        'rarityInput': state.rarity || '',
        'rareMonsterInput': state.rareMonster || '',
        'magicMonsterInput': state.magicMonster || '',
        'waystoneInput': state.waystone || '',
        'deliriumInput': state.delirium || '',
        'packAdditionCheckbox': state.packAddition || false
    };
    Object.entries(mapping).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = val;
            } else {
                el.value = val;
            }
        }
    });
}

document.getElementById('ngModCheckbox')?.addEventListener('change', saveCheckboxState);
document.getElementById('mapTierCheckbox')?.addEventListener('change', saveCheckboxState);

function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any'
    };
    localStorage.setItem('poe2_searchModeState', JSON.stringify(state));
}

function loadSearchModeState() {
    const state = JSON.parse(localStorage.getItem('poe2_searchModeState') || '{}');
    
    const searchMode = state.searchMode || 'any';
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
        searchModeRadio.checked = true;
    }
    
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
    settings: getPoe2MapProfileSettings(),
    timestamp: Date.now()
  };

  localStorage.setItem('poe2_poeProfiles', JSON.stringify(profiles));
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
  if (!profileName) {
    document.getElementById('profileName').value = '';
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
    document.getElementById('profileName').value = profileName;

    saveModCheckboxState();

    updateModList();
    updateCombinedRegex();

    ['change', 'input'].forEach(event => {
      document.getElementById('mapTierCheckbox')?.dispatchEvent(new Event(event));
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
    localStorage.setItem('poe2_poeProfiles', JSON.stringify(profiles));
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
    'waystoneInput',
    'rareMonsterInput',
    'magicMonsterInput'
  ];

  for (const id of inputs) {
    const el = document.getElementById(id);
    if (!el) continue;
    const value = el.value;
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
  const profileSelect = document.getElementById('profileList');
  if (profileSelect && !profileSelect.hasEventListener) {
    profileSelect.addEventListener('change', function() {
      if (this.value) loadProfile();
      else document.getElementById('profileName').value = '';
    });
    profileSelect.hasEventListener = true;
  }
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
    const saved = localStorage.getItem('poe2_poeProfiles');
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
    const mapTierMin = document.getElementById('mapTierMinInput').value;
    const mapTierMax = document.getElementById('mapTierMaxInput').value;
    const buyoutPrice = document.getElementById('buyoutPriceSelect').value;
    const buyoutPriceMin = document.getElementById('buyoutPriceMinInput').value;
    const buyoutPriceMax = document.getElementById('buyoutPriceMaxInput').value;
    const wantedMode = document.getElementById('wantedModModeSelect').value;
    const deliriumMin = document.getElementById('deliriumMinInput').value;
    const deliriumMax = document.getElementById('deliriumMaxInput').value;

    localStorage.setItem('poe2_poeTradeLeague', league);
    localStorage.setItem('poe2_poeTradeLeagueIsCustom', leagueIsCustom);
    localStorage.setItem('poe2_poeTradeMethod', method);
    localStorage.setItem('poe2_poeTradeMinModCount', minModCount);
    localStorage.setItem('poe2_poeTradeMaxModCount', maxModCount);
    localStorage.setItem('poe2_poeTradeCorruptedStatus', corruptedStatus);
    localStorage.setItem('poe2_poeTradeMapTierMin', mapTierMin);
    localStorage.setItem('poe2_poeTradeMapTierMax', mapTierMax);
    localStorage.setItem('poe2_poeTradeBuyoutPrice', buyoutPrice);
    localStorage.setItem('poe2_poeTradeBuyoutPriceMin', buyoutPriceMin);
    localStorage.setItem('poe2_poeTradeBuyoutPriceMax', buyoutPriceMax);
    localStorage.setItem('poe2_poeTradeWantedMode', wantedMode);
    localStorage.setItem('poe2_poeTradeDeliriumMin', deliriumMin);
    localStorage.setItem('poe2_poeTradeDeliriumMax', deliriumMax);
}

function loadTradeSettings() {
    const league = localStorage.getItem('poe2_poeTradeLeague') || "Fate of the Vaal";
    const leagueIsCustom = localStorage.getItem('poe2_poeTradeLeagueIsCustom') === 'true';
    let method = localStorage.getItem('poe2_poeTradeMethod');
    if (method === null) method = "securable";
    let minModCount = localStorage.getItem('poe2_poeTradeMinModCount');
    if (minModCount === null) minModCount = "6";
    let maxModCount = localStorage.getItem('poe2_poeTradeMaxModCount');
    if (maxModCount === null) maxModCount = "6";
    let corruptedStatus = localStorage.getItem('poe2_poeTradeCorruptedStatus');
    if (corruptedStatus === null) corruptedStatus = "";

    const mapTierMin = localStorage.getItem('poe2_poeTradeMapTierMin') || "16";
    const mapTierMax = localStorage.getItem('poe2_poeTradeMapTierMax') || "16";
    let buyoutPrice = localStorage.getItem('poe2_poeTradeBuyoutPrice');
    if (buyoutPrice === null) buyoutPrice = "";
    const buyoutPriceMin = localStorage.getItem('poe2_poeTradeBuyoutPriceMin') || "";
    const buyoutPriceMax = localStorage.getItem('poe2_poeTradeBuyoutPriceMax') || "";
    const wantedMode = localStorage.getItem('poe2_poeTradeWantedMode') || "any";
    const deliriumMin = localStorage.getItem('poe2_poeTradeDeliriumMin') || "";
    const deliriumMax = localStorage.getItem('poe2_poeTradeDeliriumMax') || "";

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
    document.getElementById('mapTierMinInput').value = mapTierMin;
    document.getElementById('mapTierMaxInput').value = mapTierMax;
    document.getElementById('buyoutPriceSelect').value = buyoutPrice;
    document.getElementById('buyoutPriceMinInput').value = buyoutPriceMin;
    document.getElementById('buyoutPriceMaxInput').value = buyoutPriceMax;
    document.getElementById('wantedModModeSelect').value = wantedMode;
    document.getElementById('deliriumMinInput').value = deliriumMin;
    document.getElementById('deliriumMaxInput').value = deliriumMax;
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
const FEEDBACK_GAME_ENTRY_ID = "entry.2048327629";
const FEEDBACK_PRODUCT_ENTRY_ID = "entry.1137147546";
const FEEDBACK_DEFAULT_GAME = "PoE2";
const FEEDBACK_DEFAULT_PRODUCT = "Regex(サイト)";
let isFeedbackSubmitting = false;

function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    // 状態をリセット
    document.getElementById('feedbackFormContainer').style.display = 'block';
    document.getElementById('feedbackFooterButtons').style.display = 'block';
    document.getElementById('feedbackSuccessMessage').style.display = 'none';
    document.getElementById('feedbackCloseButton').style.display = 'none';
    document.getElementById('feedbackText').value = '';
    const defaultGame = document.querySelector(`input[name="feedbackGame"][value="${FEEDBACK_DEFAULT_GAME}"]`);
    const defaultProduct = document.querySelector(`input[name="feedbackProduct"][value="${FEEDBACK_DEFAULT_PRODUCT}"]`);
    if (defaultGame) defaultGame.checked = true;
    if (defaultProduct) defaultProduct.checked = true;
    
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

    const game = document.querySelector('input[name="feedbackGame"]:checked')?.value || FEEDBACK_DEFAULT_GAME;
    const product = document.querySelector('input[name="feedbackProduct"]:checked')?.value || FEEDBACK_DEFAULT_PRODUCT;

    const appendHiddenInput = (name, value) => {
        const input = document.createElement('input');
        input.name = name;
        input.value = value;
        form.appendChild(input);
    };

    appendHiddenInput(FEEDBACK_GAME_ENTRY_ID, game);
    appendHiddenInput(FEEDBACK_PRODUCT_ENTRY_ID, product);
    appendHiddenInput(FEEDBACK_ENTRY_ID, text);

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
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    }
};
function initializeApplication() {
    loadLanguageState();
    updateChangelogBadge();
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

    // 詳細表示の切り替えイベントを設定
    const detailCheckbox = document.getElementById('showModDetailsCheckbox');
    if (detailCheckbox) {
        detailCheckbox.addEventListener('change', toggleModDetails);
    }
    
    initializeTooltips();
    updateModList();
    updateCombinedRegex();
}

initializeApplication();

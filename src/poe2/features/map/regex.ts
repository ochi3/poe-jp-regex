function addEffectItem(key, value) {
    const ModListDiv = getElement('ModList');
    
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
    const effectiveness = value["map_monster_potency_+%"];
    if (effectiveness) {
        const effBadge = document.createElement('span');
        effBadge.classList.add('badge', 'qty-badge');
        effBadge.style.backgroundColor = '#8e44ad';
        effBadge.textContent = `エフェクティブ ${effectiveness}`;
        badgeContainer.appendChild(effBadge);
    }

    const showDetails = getElement('showModDetailsCheckbox')?.checked ?? true;
    if (!showDetails) {
        badgeContainer.classList.add('hidden');
    }

    effectItem.appendChild(badgeContainer);
    ModListDiv.appendChild(effectItem);
}

function generateRarityRegex() {
    const normalChecked = getElement('normalCheckbox')?.checked || false;
    const magicChecked = getElement('magicCheckbox')?.checked || false;
    const rareChecked = getElement('rareCheckbox')?.checked || false;

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
    const itemQuantityValue = getElement('itemQuantityInput').value;
    const packSizeValue = getElement('packSizeInput').value;
    const rarityValue = getElement('rarityInput').value;
    const ngModChecked = getElement('ngModCheckbox').checked;

    let combinedResult = '';
    const ngResults = [];
    const wantedResults = [];

    if (getElement('packAdditionCheckbox')?.checked) {
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
    
    getElement('ModListResult').textContent = ModListResult;

    if (itemQuantityValue) {
        const itemQuantityRegex = getFixedRangeRegex(itemQuantityValue, currentLanguage === 'ja' ? '量:.*' : 'm q.*');
        combinedResult += ` ${itemQuantityRegex}`;
    }

    if (packSizeValue) {
        const packSizeRegex = getFixedRangeRegex(packSizeValue, currentLanguage === 'ja' ? 'ズ:.*' : 'iz.*');
        combinedResult += ` ${packSizeRegex}`;
    }

    if (rarityValue) {
        const rarityRegex = getFixedRangeRegex(rarityValue, currentLanguage === 'ja' ? 'ムレア.*' : 'm rar.*');
        combinedResult += ` ${rarityRegex}`;
    }

    const waystoneValue = getElement('waystoneInput').value;
    if (waystoneValue) {
        const waystoneRegex = getFixedRangeRegex(
            waystoneValue,
            currentLanguage === 'ja' ? 'プ確.*' : 'p c.*'
        );
        combinedResult += ` ${waystoneRegex}`;
    }

    const effectivenessValue = getElement('effectivenessInput').value;
    if (effectivenessValue) {
        const effectivenessRegex = getFixedRangeRegex(
            effectivenessValue,
            currentLanguage === 'ja' ? 'ィブ:.*' : 'ess:.*'
        );
        combinedResult += ` ${effectivenessRegex}`;
    }

    const mapMonsterRarityValue = getElement('mapMonsterRarityInput').value;
    if (mapMonsterRarityValue) {
        const mapMonsterRarityRegex = getFixedRangeRegex(
            mapMonsterRarityValue,
            currentLanguage === 'ja' ? 'モ.*ティ:.*' : 'ter rar.*'
        );
        combinedResult += ` ${mapMonsterRarityRegex}`;
    }

    const reviveValue = getElement('reviveInput').value;
    if (reviveValue !== '') {
        const reviveRegex = getSingleDigitRangeRegex(
            reviveValue,
            currentLanguage === 'ja' ? '活が利.*' : 's ava.*'
        );
        if (reviveRegex) {
            combinedResult += ` ${reviveRegex}`;
        }
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

    getElement('combinedRegexOutput').textContent = combinedResult;

    updateCharCount();
}

let searchAllMode = true;

function generateExtraRegex() {
    const rareValue = getElement('rareMonsterInput').value;
    const magicValue = getElement('magicMonsterInput').value;

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

    const deliriumValue = getElement('deliriumInput').value;
    if (deliriumValue) {
        const firstDigit = deliriumValue.toString()[0];
        if (firstDigit >= '1' && firstDigit <= '9') {
            const deliriumPattern = currentLanguage === 'ja'
                ? `([${firstDigit}-9]\\d+%のせ)`
                : `([${firstDigit}-9]\\d+% Del)`;
            finalResult.push(deliriumPattern);
        }
    }

    return finalResult.join(' ');
}

function updateCharCount() {
    const result = getElement('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = getElement('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;

    if (charCount > POE2_REGEX_CHAR_LIMIT) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ` (${POE2_REGEX_CHAR_LIMIT}文字を超えています)`;
    } else {
        charCountElement.style.color = '';
    }
}

function resetAll() {
    getElement('itemQuantityInput').value = '';
    getElement('packSizeInput').value = '';
    getElement('rarityInput').value = '';
    getElement('rareMonsterInput').value = '';
    getElement('magicMonsterInput').value = '';
    getElement('waystoneInput').value = '';
    getElement('effectivenessInput').value = '';
    getElement('mapMonsterRarityInput').value = '';
    getElement('reviveInput').value = '';
    getElement('deliriumInput').value = '';
    if (getElement('packAdditionCheckbox')) getElement('packAdditionCheckbox').checked = false;
    if (getElement('corruptedCheckbox')) getElement('corruptedCheckbox').checked = false;
    if (getElement('nonCorruptedCheckbox')) getElement('nonCorruptedCheckbox').checked = false;
    getElement('ngModCheckbox').checked = false;
    if (getElement('mapTierCheckbox')) getElement('mapTierCheckbox').checked = false;
    if (getElement('normalCheckbox')) getElement('normalCheckbox').checked = false;
    if (getElement('magicCheckbox')) getElement('magicCheckbox').checked = false;
    if (getElement('rareCheckbox')) getElement('rareCheckbox').checked = false;
    if (getElement('searchAllRadio')) getElement('searchAllRadio').checked = false;
    if (getElement('searchAnyRadio')) getElement('searchAnyRadio').checked = true;

    checkedMods.clear();

    updateModList();

    removeStoredValue('poe2_searchModeState');
    removeStoredValue('poe2_inputState');
    removeStoredValue('poe2_modCheckboxState');
    removeStoredValue('poe2_ngModChecked');
    removeStoredValue('poe2_mapTierChecked');
    removeStoredValue('poe2_normalChecked');
    removeStoredValue('poe2_magicChecked');
    removeStoredValue('poe2_rareChecked');

    ModList = {...mapModList};
    checkedMods.clear();
    updateModList();
    updateCombinedRegex();
}

/** 0〜9 の1桁数値用（復活回数など、% なし） */
function getSingleDigitRangeRegex(num, basePattern, maxDigit = 9) {
  num = parseInt(num, 10);
  if (isNaN(num) || num < 0 || num > maxDigit) return '';
  if (num === 0) {
    return `"${basePattern}[0-${maxDigit}]"`;
  }
  return `"${basePattern}[${num}-${maxDigit}]"`;
}

let currentSearchTerm = '';

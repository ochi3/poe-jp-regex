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

    const showDetails = getElement('showModDetailsCheckbox') ? getElement('showModDetailsCheckbox').checked : true;
    if (!showDetails) {
        badgeContainer.classList.add('hidden');
    }

    effectItem.appendChild(badgeContainer);
    ModListDiv.appendChild(effectItem);
}

function updateCombinedRegex() {
    const itemQuantityValue = getElement('itemQuantityInput').value;
    const packSizeValue = getElement('packSizeInput').value;
    const rarityValue = getElement('rarityInput').value;
    const ngModChecked = getElement('ngModCheckbox').checked;

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

    getElement('combinedRegexOutput').textContent = combinedResult;

    updateCharCount();
}

let searchAllMode = true;

function generateExtraRegex() {
    const scarabValue = getElement('scarabInput').value;
    const currencyValue = getElement('currencyInput').value;
    const mapValue = getElement('mapInput').value;

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
    const result = getElement('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = getElement('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;

    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    } else {
        charCountElement.style.color = '';
    }
}

function resetAll() {
    if (getElement('itemQuantityInput')) getElement('itemQuantityInput').value = '';
    if (getElement('packSizeInput')) getElement('packSizeInput').value = '';
    if (getElement('rarityInput')) getElement('rarityInput').value = '';
    if (getElement('scarabInput')) getElement('scarabInput').value = '';
    if (getElement('currencyInput')) getElement('currencyInput').value = '';
    if (getElement('mapInput')) getElement('mapInput').value = '';
    if (getElement('ngModCheckbox')) getElement('ngModCheckbox').checked = false;
    if (getElement('mapTierCheckbox')) getElement('mapTierCheckbox').checked = false;
    if (getElement('normalCheckbox')) getElement('normalCheckbox').checked = false;
    if (getElement('magicCheckbox')) getElement('magicCheckbox').checked = false;
    if (getElement('rareCheckbox')) getElement('rareCheckbox').checked = false;
    if (getElement('searchAllRadio')) getElement('searchAllRadio').checked = false;
    if (getElement('searchAnyRadio')) getElement('searchAnyRadio').checked = true;

    checkedMods.clear();

    updateModList();

    removeStoredValue('searchModeState');
    removeStoredValue('inputState');
    removeStoredValue('modCheckboxState');
    removeStoredValue('ngModChecked');
    removeStoredValue('mapTierChecked');
    removeStoredValue('normalChecked');
    removeStoredValue('magicChecked');
    removeStoredValue('rareChecked');

    ModList = {...mapModList};
    checkedMods.clear();
    updateModList();
    updateCombinedRegex();
}

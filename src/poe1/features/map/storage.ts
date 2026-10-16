function saveCheckboxState() {
    const ngModCheckbox = getElement('ngModCheckbox');
    const mapTierCheckbox = getElement('mapTierCheckbox');

    writeStoredText('ngModChecked', String(ngModCheckbox.checked));
    writeStoredText('mapTierChecked', String(mapTierCheckbox.checked));
}

function loadCheckboxState() {
    const ngModChecked = readStoredText('ngModChecked') === 'true';
    const mapTierChecked = readStoredText('mapTierChecked') === 'true';

    const ngModCheckbox = getElement('ngModCheckbox');
    const mapTierCheckbox = getElement('mapTierCheckbox');

    if (ngModCheckbox) ngModCheckbox.checked = ngModChecked;
    if (mapTierCheckbox) mapTierCheckbox.checked = mapTierChecked;
}

function saveModCheckboxState() {
    if (!checkedMods) return;
    const state = Object.fromEntries(checkedMods);
    writeStoredJson('modCheckboxState', state);
}

function updateModList() {
    const ModListDiv = getElement('ModList');
    
    const currentSearchTerm = getElement('effectSearch').value.toLowerCase();
    
    ModListDiv.innerHTML = '';

    const isT17 = getElement('mapTierCheckbox').checked;

    const sortSelect = getElement('modSortSelect');
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
        getElement('effectSearch').value = currentSearchTerm;
        filterEffects();
    }
}

function toggleModDetails() {
    const showDetails = getElement('showModDetailsCheckbox').checked;
    writeStoredText('showModDetails', String(showDetails));
    
    document.querySelectorAll<HTMLElement>('.badge-container, .mod-extra-details').forEach(container => {
        if (showDetails) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}

function loadModDetailsState() {
    const showDetails = readStoredText('showModDetails') !== 'false'; // デフォルトは表示
    getElement('showModDetailsCheckbox').checked = showDetails;
}

function loadModCheckboxState() {
    const saved = readStoredText('modCheckboxState');
    if (saved) {
        try {
            const state = readStoredJson('modCheckboxState');
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
        itemQuantity: getElement('itemQuantityInput')?.value || '',
        packSize: getElement('packSizeInput')?.value || '',
        rarity: getElement('rarityInput')?.value || '',
        scarab: getElement('scarabInput')?.value || '',
        currency: getElement('currencyInput')?.value || '',
        map: getElement('mapInput')?.value || '',
        beastBulkThreshold: getElement('beastBulkThreshold')?.value || '',
        beastBulkThresholdMax: getElement('beastBulkThresholdMax')?.value || '',
        scarabBulkThreshold: getElement('scarabBulkThreshold')?.value || '',
        scarabBulkThresholdMax: getElement('scarabBulkThresholdMax')?.value || '',
        tattooBulkThreshold: getElement('tattooBulkThreshold')?.value || '',
        tattooBulkThresholdMax: getElement('tattooBulkThresholdMax')?.value || '',
        runegraftBulkThreshold: getElement('runegraftBulkThreshold')?.value || '',
        runegraftBulkThresholdMax: getElement('runegraftBulkThresholdMax')?.value || '',
        essenceBulkThreshold: getElement('essenceBulkThreshold')?.value || '',
        essenceBulkThresholdMax: getElement('essenceBulkThresholdMax')?.value || ''
    };
    writeStoredJson('inputState', state);
}

function loadInputState() {
    const state = readStoredJson('inputState');
    if (getElement('itemQuantityInput')) getElement('itemQuantityInput').value = state.itemQuantity || '';
    if (getElement('packSizeInput')) getElement('packSizeInput').value = state.packSize || '';
    if (getElement('rarityInput')) getElement('rarityInput').value = state.rarity || '';
    if (getElement('scarabInput')) getElement('scarabInput').value = state.scarab || '';
    if (getElement('currencyInput')) getElement('currencyInput').value = state.currency || '';
    if (getElement('mapInput')) getElement('mapInput').value = state.map || '';
    if (getElement('beastBulkThreshold')) getElement('beastBulkThreshold').value = state.beastBulkThreshold || '10';
    if (getElement('beastBulkThresholdMax')) getElement('beastBulkThresholdMax').value = state.beastBulkThresholdMax || '';
    if (getElement('scarabBulkThreshold')) getElement('scarabBulkThreshold').value = state.scarabBulkThreshold || '10';
    if (getElement('scarabBulkThresholdMax')) getElement('scarabBulkThresholdMax').value = state.scarabBulkThresholdMax || '';
    if (getElement('tattooBulkThreshold')) getElement('tattooBulkThreshold').value = state.tattooBulkThreshold || '10';
    if (getElement('tattooBulkThresholdMax')) getElement('tattooBulkThresholdMax').value = state.tattooBulkThresholdMax || '';
    if (getElement('runegraftBulkThreshold')) getElement('runegraftBulkThreshold').value = state.runegraftBulkThreshold || '10';
    if (getElement('runegraftBulkThresholdMax')) getElement('runegraftBulkThresholdMax').value = state.runegraftBulkThresholdMax || '';
    if (getElement('essenceBulkThreshold')) getElement('essenceBulkThreshold').value = state.essenceBulkThreshold || '10';
    if (getElement('essenceBulkThresholdMax')) getElement('essenceBulkThresholdMax').value = state.essenceBulkThresholdMax || '';
}

const ngModCheckboxEl = getElement('ngModCheckbox');
if (ngModCheckboxEl) ngModCheckboxEl.addEventListener('change', saveCheckboxState);

const mapTierCheckboxEl = getElement('mapTierCheckbox');
if (mapTierCheckboxEl) mapTierCheckboxEl.addEventListener('change', saveCheckboxState);

function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector<HTMLInputElement>('input[name="searchMode"]:checked')?.value || 'any',
        rarityChecked: {
            normal: getElement('normalCheckbox')?.checked || false,
            magic: getElement('magicCheckbox')?.checked || false,
            rare: getElement('rareCheckbox')?.checked || false
        }
    };
    writeStoredJson('searchModeState', state);
}

function loadSearchModeState() {
    const state = readStoredJson('searchModeState');
    
    const searchMode = state.searchMode || 'any';
    const searchModeRadio = document.querySelector<HTMLInputElement>(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
        searchModeRadio.checked = true;
    }
    
    if (getElement('normalCheckbox')) getElement('normalCheckbox').checked = state.rarityChecked?.normal || false;
    if (getElement('magicCheckbox')) getElement('magicCheckbox').checked = state.rarityChecked?.magic || false;
    if (getElement('rareCheckbox')) getElement('rareCheckbox').checked = state.rarityChecked?.rare || false;
    
    searchAllMode = searchMode === 'all';
}

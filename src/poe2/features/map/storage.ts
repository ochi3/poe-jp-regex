function saveCheckboxState() {
    const ngModCheckbox = getElement('ngModCheckbox');
    if (ngModCheckbox) {
        writeStoredText('poe2_ngModChecked', String(ngModCheckbox.checked));
    }
    const mapTierCheckbox = getElement('mapTierCheckbox');
    if (mapTierCheckbox) {
        writeStoredText('poe2_mapTierChecked', String(mapTierCheckbox.checked));
    }
}

function loadCheckboxState() {
    const ngModChecked = readStoredText('poe2_ngModChecked') === 'true';
    const mapTierChecked = readStoredText('poe2_mapTierChecked') === 'true';

    const ngModCheckbox = getElement('ngModCheckbox');
    if (ngModCheckbox) ngModCheckbox.checked = ngModChecked;
    const mapTierCheckbox = getElement('mapTierCheckbox');
    if (mapTierCheckbox) mapTierCheckbox.checked = mapTierChecked;
}

function saveModCheckboxState() {
    if (!checkedMods) return;
    const state = Object.fromEntries(checkedMods);
    writeStoredJson('poe2_modCheckboxState', state);
}

function updateModList() {
    const ModListDiv = getElement('ModList');
    
    const currentSearchTerm = getElement('effectSearch').value.toLowerCase();
    
    ModListDiv.innerHTML = '';

    const isT17 = getElement('mapTierCheckbox')?.checked || false;

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
                case 'effectiveness_asc': {
                    const vA = valueA["map_monster_potency_+%"] || 0;
                    const vB = valueB["map_monster_potency_+%"] || 0;
                    if (vA !== vB) return vA - vB;
                    break;
                }
                case 'effectiveness_desc': {
                    const vA = valueA["map_monster_potency_+%"] || 0;
                    const vB = valueB["map_monster_potency_+%"] || 0;
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
    const showDetails = getElement('showModDetailsCheckbox')?.checked || false;
    writeStoredText('poe2_showModDetails', String(showDetails));
    
    document.querySelectorAll<HTMLElement>('.badge-container').forEach(container => {
        if (showDetails) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}

function loadModDetailsState() {
    const showDetails = readStoredText('poe2_showModDetails') !== 'false'; // デフォルトは表示
    if (getElement('showModDetailsCheckbox')) {
        getElement('showModDetailsCheckbox').checked = showDetails;
    }
}

function loadModCheckboxState() {
    const saved = readStoredText('poe2_modCheckboxState');
    if (saved) {
        try {
            const state = readStoredJson('poe2_modCheckboxState');
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
        'waystoneInput', 'effectivenessInput', 'mapMonsterRarityInput', 'reviveInput',
        'deliriumInput', 'packAdditionCheckbox'
    ];
    ids.forEach(id => {
        const el = getElement<HTMLInputElement>(id);
        if (el) {
            const key = id.replace('Input', '').replace('Checkbox', '');
            state[key] = el.type === 'checkbox' ? el.checked : el.value;
        }
    });
    writeStoredJson('poe2_inputState', state);
}

function loadInputState() {
    const state = readStoredJson('poe2_inputState');
    const mapping = {
        'itemQuantityInput': state.itemQuantity || '',
        'packSizeInput': state.packSize || '',
        'rarityInput': state.rarity || state.mapItemRarity || '',
        'rareMonsterInput': state.rareMonster || '',
        'magicMonsterInput': state.magicMonster || '',
        'waystoneInput': state.waystone || '',
        'effectivenessInput': state.effectiveness || '',
        'mapMonsterRarityInput': state.mapMonsterRarity || '',
        'reviveInput': state.revive || '',
        'deliriumInput': state.delirium || '',
        'packAdditionCheckbox': state.packAddition || false
    };
    Object.entries(mapping).forEach(([id, val]) => {
        const el = getElement<HTMLInputElement>(id);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = val;
            } else {
                el.value = val;
            }
        }
    });
}

getElement('ngModCheckbox')?.addEventListener('change', saveCheckboxState);
getElement('mapTierCheckbox')?.addEventListener('change', saveCheckboxState);

function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector<HTMLInputElement>('input[name="searchMode"]:checked')?.value || 'any'
    };
    writeStoredJson('poe2_searchModeState', state);
}

function loadSearchModeState() {
    const state = readStoredJson('poe2_searchModeState');
    
    const searchMode = state.searchMode || 'any';
    const searchModeRadio = document.querySelector<HTMLInputElement>(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
        searchModeRadio.checked = true;
    }
    
    searchAllMode = searchMode === 'all';
}

let profiles: ProfileDictionary = {};
let selectedProfile = null;

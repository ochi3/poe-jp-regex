let isDragging = false;
let dragStartIndex = -1;
let dragEndIndex = -1;
let filterControlsAdded = false;

const POE2_PROFILE_STORAGE_KEYS = {
  map: 'poe2_poeProfiles',
  vendor: 'poe2_vendorProfiles',
};

function getPoe2StorageKey(type) {
  return POE2_PROFILE_STORAGE_KEYS[type] || null;
}

function saveFilterState() {
  const filterState = {
    searchTerm: document.getElementById('savedRegexSearch').value,
    typeFilter: document.getElementById('typeFilter').value,
    sortFilter: document.getElementById('sortFilter').value
  };
  localStorage.setItem('poe2_savedRegexFilterState', JSON.stringify(filterState));
}

function loadFilterState() {
  const saved = localStorage.getItem('poe2_savedRegexFilterState');
  if (saved) {
    try {
      const filterState = JSON.parse(saved);
      
      const searchInput = document.getElementById('savedRegexSearch');
      const typeFilter = document.getElementById('typeFilter');
      const sortFilter = document.getElementById('sortFilter');
      
      if (searchInput && filterState.searchTerm !== undefined) {
        searchInput.value = filterState.searchTerm;
      }
      if (typeFilter && filterState.typeFilter) {
        typeFilter.value = filterState.typeFilter;
      }
      if (sortFilter && filterState.sortFilter) {
        sortFilter.value = filterState.sortFilter;
      }
      
      return filterState;
    } catch (e) {
      console.error('フィルター状態の読み込みエラー:', e);
    }
  }
  return null;
}

function updateSavedRegexDisplay() {
  const container = document.getElementById('savedRegexList');
  if (!container) return;

  const allProfiles = getAllProfiles();

  if (allProfiles.length === 0) {
    container.innerHTML = `
      <div style="color: #888; text-align: center; padding: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 10px;">保存されたRegexがありません</p>
        <p style="font-size: 0.85em;">各タブでプロファイルを保存すると、ここに表示されます</p>
      </div>
    `;
    return;
  }

  const sortedProfiles = restoreSortOrder(allProfiles);
  
  // 内容を更新
  container.innerHTML = '';

  const cardsContainer = document.createElement('div');
  cardsContainer.id = 'savedRegexCards';
  
  sortedProfiles.forEach(item => {
    const card = createSortableProfileCard(item.name, item.profile, item.type, item.tabId);
    cardsContainer.appendChild(card);
  });
  
  container.appendChild(cardsContainer);
  makeSortable();

  setTimeout(() => {
    const filterState = loadFilterState();
    if (filterState) {
      const typeFilter = document.getElementById('typeFilter');
      if (typeFilter) {
        applyFilters();
      }
    }
      const contOp = document.getElementById('savedRegexList');
    if (contOp) contOp.style.opacity = '1';
  }, 50);
}

function getAllProfiles() {
  const allProfiles = [];

  Object.entries(POE2_PROFILE_STORAGE_KEYS).forEach(([type, storageKey]) => {
    const profiles = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const tabId = type === 'map' ? 'mapContent' : 'vendorContent';
    Object.entries(profiles).forEach(([name, profile]) => {
      allProfiles.push({ name, profile, type, tabId, timestamp: profile.timestamp || 0 });
    });
  });

  return allProfiles;
}

const typeConfig = {
  map: { label: 'マップ', color: '#E74C3C', icon: '' },
  vendor: { label: 'ベンダー', color: '#F39C12', icon: '' },
};

function generateRegexFromProfile(profile, type) {
  if (type === 'map') {
    return generateMapRegexFromProfile(profile);
  }
  if (type === 'vendor') {
    if (typeof window.generateVendorRegexFromProfile === 'function') {
      const regex = window.generateVendorRegexFromProfile(profile);
      return regex || '(空のRegex)';
    }
    return '(エラー: vendor.jsが読み込まれていません)';
  }
  return '(不明なタイプ)';
}

function generateMapRegexFromProfile(profile) {
  const originalCheckedMods = new Map(checkedMods);
  const originalInputState = {
    itemQuantity: document.getElementById('itemQuantityInput')?.value || '',
    packSize: document.getElementById('packSizeInput')?.value || '',
    rarity: document.getElementById('rarityInput')?.value || '',
    scarab: document.getElementById('scarabInput')?.value || '',
    currency: document.getElementById('currencyInput')?.value || '',
    map: document.getElementById('mapInput')?.value || ''
  };
  const originalCheckboxState = {
    mapTierChecked: document.getElementById('mapTierCheckbox')?.checked || false,
    normalChecked: document.getElementById('normalCheckbox')?.checked || false,
    magicChecked: document.getElementById('magicCheckbox')?.checked || false,
    rareChecked: document.getElementById('rareCheckbox')?.checked || false
  };
  const originalSearchMode = document.querySelector('input[name="searchMode"]:checked')?.value;

  try {
    checkedMods.clear();
    if (profile.mods) {
      if (Array.isArray(profile.mods)) {
        profile.mods.forEach(mod => {
          if (Array.isArray(mod)) {
            const [id, state] = mod;
            if (id) checkedMods.set(id, state || 'ng');
          } else if (typeof mod === 'string') {
            checkedMods.set(mod, 'ng');
          }
        });
      } else if (typeof profile.mods === 'object') {
        Object.entries(profile.mods).forEach(([mod, state]) => checkedMods.set(mod, state));
      }
    }

    if (profile.settings) {
      const settings = profile.settings;
      if (document.getElementById('itemQuantityInput')) document.getElementById('itemQuantityInput').value = settings.itemQuantity || '';
      if (document.getElementById('packSizeInput')) document.getElementById('packSizeInput').value = settings.packSize || '';
      if (document.getElementById('rarityInput')) document.getElementById('rarityInput').value = settings.rarity || '';
      if (document.getElementById('scarabInput')) document.getElementById('scarabInput').value = settings.scarab || '';
      if (document.getElementById('currencyInput')) document.getElementById('currencyInput').value = settings.currency || '';
      if (document.getElementById('mapInput')) document.getElementById('mapInput').value = settings.map || '';

      if (document.getElementById('mapTierCheckbox')) document.getElementById('mapTierCheckbox').checked = settings.mapTierChecked || false;
      if (document.getElementById('normalCheckbox')) document.getElementById('normalCheckbox').checked = settings.rarities?.normal || false;
      if (document.getElementById('magicCheckbox')) document.getElementById('magicCheckbox').checked = settings.rarities?.magic || false;
      if (document.getElementById('rareCheckbox')) document.getElementById('rareCheckbox').checked = settings.rarities?.rare || false;

      const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${settings.searchMode || 'any'}"]`);
      if (searchModeRadio) searchModeRadio.checked = true;
    }

    updateCombinedRegex();
    const regex = document.getElementById('combinedRegexOutput').textContent;
    return regex || '(空のRegex)';

  } finally {
    checkedMods.clear();
    originalCheckedMods.forEach((state, mod) => checkedMods.set(mod, state));

    if (document.getElementById('itemQuantityInput')) document.getElementById('itemQuantityInput').value = originalInputState.itemQuantity;
    if (document.getElementById('packSizeInput')) document.getElementById('packSizeInput').value = originalInputState.packSize;
    if (document.getElementById('rarityInput')) document.getElementById('rarityInput').value = originalInputState.rarity;
    if (document.getElementById('scarabInput')) document.getElementById('scarabInput').value = originalInputState.scarab;
    if (document.getElementById('currencyInput')) document.getElementById('currencyInput').value = originalInputState.currency;
    if (document.getElementById('mapInput')) document.getElementById('mapInput').value = originalInputState.map;

    if (document.getElementById('mapTierCheckbox')) document.getElementById('mapTierCheckbox').checked = originalCheckboxState.mapTierChecked;
    if (document.getElementById('normalCheckbox')) document.getElementById('normalCheckbox').checked = originalCheckboxState.normalChecked;
    if (document.getElementById('magicCheckbox')) document.getElementById('magicCheckbox').checked = originalCheckboxState.magicChecked;
    if (document.getElementById('rareCheckbox')) document.getElementById('rareCheckbox').checked = originalCheckboxState.rareChecked;

    const originalSearchModeRadio = document.querySelector(`input[name="searchMode"][value="${originalSearchMode || 'any'}"]`);
    if (originalSearchModeRadio) originalSearchModeRadio.checked = true;

    updateCombinedRegex();
  }
}

function calcMapModTotals(profile) {
  // profile.modsからmapModListを参照して合計値を計算
  let totalQuantity = 0, totalPackSize = 0, totalRarity = 0, totalRareMonster = 0, totalMagicMonster = 0, totalWaystone = 0;
  
  if (!profile.mods) return { totalQuantity, totalPackSize, totalRarity, totalRareMonster, totalMagicMonster, totalWaystone };
  
  const modsToProcess = [];
  if (Array.isArray(profile.mods)) {
    profile.mods.forEach(mod => {
      if (Array.isArray(mod)) modsToProcess.push(mod[0]); // [id, state] 形式
      else if (typeof mod === 'string') modsToProcess.push(mod);
    });
  } else if (typeof profile.mods === 'object') {
    Object.keys(profile.mods).forEach(key => modsToProcess.push(key));
  }
  
    modsToProcess.forEach(key => {
    const mod = (typeof mapModList !== 'undefined' ? mapModList : {})[key];
    if (!mod) return;
    totalPackSize += Number(mod['map_pack_size_+%'] || 0);
    totalQuantity += Number(mod['map_item_drop_quantity_+%'] || 0);
    totalRarity += Number(mod['map_item_drop_rarity_+%'] || 0);
    // レア/マジックモンスターのキー
    totalRareMonster += Number(mod['map_number_of_rare_packs_+%'] || 0);
    totalMagicMonster += Number(mod['map_number_of_magic_packs_+%'] || 0);
    totalWaystone += Number(mod['map_map_item_drop_chance_+%'] || mod['map_map_item_drop_chance_+%_final_from_uber_mod'] || 0);
  });
  
  return { totalQuantity, totalPackSize, totalRarity, totalRareMonster, totalMagicMonster, totalWaystone };
}

function createSortableProfileCard(name, profile, type, tabId) {
  const card = createProfileCard(name, profile, type, tabId);
  card.draggable = true;
  card.style.cursor = 'grab';
  card.dataset.profileName = name;
  card.dataset.profileType = type;
  card.dataset.timestamp = profile.timestamp || Date.now();

  if (type === 'map') {
    const settings = profile.settings || {};
    card.dataset.totalQuantity = settings.itemQuantity || 0;
    card.dataset.totalPackSize = settings.packSize || 0;
    card.dataset.totalRarity = settings.rarity || 0;
    card.dataset.totalRareMonster = settings.rareMonster || 0;
    card.dataset.totalMagicMonster = settings.magicMonster || 0;
    card.dataset.totalWaystone = settings.waystone || 0;
  } else {
    card.dataset.totalQuantity = 0;
    card.dataset.totalPackSize = 0;
    card.dataset.totalRarity = 0;
    card.dataset.totalRareMonster = 0;
    card.dataset.totalMagicMonster = 0;
    card.dataset.totalWaystone = 0;
  }
  
  const title = card.querySelector('.profile-card-title') || card.querySelector('.title-area span:nth-child(2)');
  if (title) title.classList.add('profile-card-title');
  
  const typeLabel = card.querySelector('.profile-card-type');
  if (!typeLabel) {
    const typeSpan = document.createElement('span');
    typeSpan.className = 'profile-card-type';
    typeSpan.textContent = type;
    typeSpan.style.display = 'none';
    card.appendChild(typeSpan);
  }
  
  card.addEventListener('dragstart', () => {
    card.style.opacity = '0.5';
    card.style.cursor = 'grabbing';
  });
  
  card.addEventListener('dragend', () => {
    card.style.opacity = '1';
    card.style.cursor = 'grab';
  });
  
  return card;
}

function createProfileCard(name, profile, type, tabId) {
  const config = typeConfig[type];
  
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.style.cssText = `
    background: #2a2a2a;
    border: 1px solid #444;
    border-left: 4px solid ${config.color};
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
  `;

  card.addEventListener('mouseenter', () => {
    card.style.background = '#333';
    card.style.borderColor = config.color;
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '#2a2a2a';
    card.style.borderColor = '#444';
    card.style.borderLeftColor = config.color;
  });

  card.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    const regex = generateRegexFromProfile(profile, type);
    if (regex && regex !== '(空のRegex)') {
      navigator.clipboard.writeText(regex).then(() => {
        showNotification('コピーしました！');
        const originalBackground = card.style.background;
        const originalBorderColor = card.style.borderColor;
        card.style.background = '#2d5a2d';
        card.style.borderColor = '#4CAF50';
        setTimeout(() => {
          card.style.background = originalBackground;
          card.style.borderColor = originalBorderColor;
        }, 300);
      }).catch(err => {
        console.error('コピー失敗:', err);
        showNotification('❌ コピー失敗', true);
        const originalBackground = card.style.background;
        const originalBorderColor = card.style.borderColor;
        card.style.background = '#5a2d2d';
        card.style.borderColor = '#e74c3c';
        setTimeout(() => {
          card.style.background = originalBackground;
          card.style.borderColor = originalBorderColor;
        }, 300);
      });
    }
  });

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
  
  const titleArea = document.createElement('div');
  titleArea.className = 'title-area';
  titleArea.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';
  
  const typeLabel = document.createElement('span');
  typeLabel.className = 'profile-card-type';
  typeLabel.style.cssText = `
    background: ${config.color};
    color: white;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.7em;
    font-weight: bold;
    white-space: nowrap;
  `;
  typeLabel.textContent = `${config.icon} ${config.label}`;
  
  const title = document.createElement('span');
  title.className = 'profile-card-title';
  title.style.cssText = 'color: #FFF; font-size: 0.9em; font-weight: 500;';
  title.textContent = name;
  
  const summary = createProfileSummary(profile, type);
  const summarySpan = document.createElement('span');
  summarySpan.style.cssText = 'color: #888; font-size: 0.7em; margin-left: auto;';
  summarySpan.textContent = summary;
  
  titleArea.appendChild(typeLabel);
  titleArea.appendChild(title);
  
  if (type === 'map') {
    const settings = profile.settings || {};
    const badgeContainer = document.createElement('div');
    badgeContainer.style.cssText = 'display: flex; gap: 4px; margin-left: 10px; flex-wrap: wrap;';
    
    const isEn = typeof currentLanguage !== 'undefined' ? currentLanguage === 'en' : false;
    const badgeConfigs = [
      { label: isEn ? 'Quality' : '数量', value: settings.itemQuantity, color: '#a54242' },
      { label: isEn ? 'Pack' : 'パック', value: settings.packSize, color: '#42a5a5' },
      { label: isEn ? 'Rarity' : 'レア', value: settings.rarity, color: '#a58242' },
      { label: isEn ? 'Scarab' : 'スカラベ', value: settings.scarab, color: '#a542a5' },
      { label: isEn ? 'Currency' : 'カレンシー', value: settings.currency, color: '#a5a542' },
      { label: isEn ? 'Map' : 'マップ', value: settings.map, color: '#4264a5' }
    ];
    
    badgeConfigs.forEach(b => {
      if (b.value && b.value > 0) {
        const badge = document.createElement('span');
        badge.style.cssText = `background: ${b.color}; color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.65em; font-weight: bold;`;
        badge.textContent = `${b.label} ${b.value}`;
        badgeContainer.appendChild(badge);
      }
    });
    titleArea.appendChild(badgeContainer);
  } else {
    const summary = createProfileSummary(profile, type);
    if (summary) {
      const summarySpan = document.createElement('span');
      summarySpan.style.cssText = 'color: #888; font-size: 0.7em; margin-left: auto;';
      summarySpan.textContent = summary;
      titleArea.appendChild(summarySpan);
    }
  }
  
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '×';
  deleteBtn.style.cssText = `
    background: transparent;
    color: #e74c3c;
    border: 1px solid #e74c3c;
    padding: 2px 6px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 1.1em;
    line-height: 1;
    transition: all 0.2s;
    margin-left: 8px;
  `;
  deleteBtn.addEventListener('mouseenter', () => {
    deleteBtn.style.background = '#e74c3c';
    deleteBtn.style.color = 'white';
  });
  deleteBtn.addEventListener('mouseleave', () => {
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.color = '#e74c3c';
  });
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteSavedProfile(name, type);
  });
  
  header.appendChild(titleArea);
  header.appendChild(deleteBtn);
  card.appendChild(header);

  const regexRow = document.createElement('div');
  regexRow.style.cssText = 'display: flex; gap: 6px; align-items: center;';

  const regex = generateRegexFromProfile(profile, type);
  const regexDiv = document.createElement('div');
  regexDiv.style.cssText = `
    background: #1e1e1e;
    padding: 6px 8px;
    border-radius: 4px;
    font-family: monospace;
    color: #FFF;
    word-break: break-all;
    max-height: 50px;
    overflow-y: auto;
    font-size: 0.75em;
    line-height: 1.3;
    flex: 1;
  `;
  regexDiv.textContent = regex || '(空のRegex)';

  const actions = document.createElement('div');
  actions.style.cssText = 'display: flex; gap: 4px; flex-shrink: 0;';

  const copyBtn = createActionButton('コピー', '#3498db', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(regex).then(() => {
      showNotification('コピーしました！');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓';
      setTimeout(() => copyBtn.textContent = originalText, 1500);
    });
  }, 'コピー');

  const detailBtn = createActionButton('詳細', '#9b59b6', (e) => {
    e.stopPropagation();
    toggleProfileDetails(card, profile, type, config.color);
  }, '詳細');

  const loadBtn = createActionButton('読み込み', '#4CAF50', (e) => {
    e.stopPropagation();
    loadSavedProfile(name, type, tabId);
  }, '読み込み');

  actions.appendChild(copyBtn);
  actions.appendChild(detailBtn);
  actions.appendChild(loadBtn);

  regexRow.appendChild(regexDiv);
  regexRow.appendChild(actions);
  card.appendChild(regexRow);

  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'details-container';
  detailsContainer.style.cssText = `
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    margin-top: 0;
  `;
  card.appendChild(detailsContainer);

  return card;
}

function createActionButton(text, color, onClick, title) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.title = title;
  btn.style.cssText = `
    background: ${color};
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    transition: opacity 0.2s;
    white-space: nowrap;
  `;
  btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(e);
    if (text === 'コピー') {
      showNotification('コピーしました！');
    }
  });
  return btn;
}

function createProfileSummary(profile, type) {
  const parts = [];

  if (type === 'map') {
    let modCount = 0;
    if (profile.mods) {
      modCount = Array.isArray(profile.mods) ? profile.mods.length : Object.keys(profile.mods).length;
    }
    if (modCount > 0) parts.push(`${modCount}個のMod`);
    const settings = profile.settings || {};
    if (settings.itemQuantity) parts.push(`数量${settings.itemQuantity}%`);
    if (settings.packSize) parts.push(`パック${settings.packSize}%`);
  } else if (type === 'flask') {
    const modCount = (profile.mods || []).length;
    if (modCount > 0) parts.push(`${modCount}個のMod`);
    if (profile.flaskType) {
      const typeNames = { utility: 'ユーティリティ', life: 'ライフ', mana: 'マナ', hybrid: 'ハイブリッド', tincture: 'チンキ' };
      parts.push(typeNames[profile.flaskType] || profile.flaskType);
    }
  } else if (type === 'item') {
    const modCount = (profile.mods || []).length;
    if (modCount > 0) parts.push(`${modCount}個のMod`);
    if (profile.itemType) parts.push(profile.itemType);
  } else if (type === 'vendor') {
    const settings = profile.settings || {};
    const selected = settings.selected || {};
    const selectedIds = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
    if (selectedIds.length > 0) {
      const labels = selectedIds
        .slice(0, 2)
        .map(id => (typeof window.getVendorItemLabel === 'function' ? window.getVendorItemLabel(id) : id));
      let summary = labels.join(', ');
      if (selectedIds.length > 2) summary += ` ...他${selectedIds.length - 2}個`;
      parts.push(summary);
    }
    const weaponCount = Object.values(settings.weapon || {}).filter(Boolean).length;
    if (weaponCount > 0) parts.push(`${weaponCount}武器`);
    const excludeCount = Object.values(settings.excludeWeapons || {}).filter(Boolean).length;
    if (excludeCount > 0) parts.push(`NG${excludeCount}武器`);
  } else if (type === 'beast') {
    const beastCount = (profile.beasts || []).length;
    if (beastCount > 0) parts.push(`${beastCount}個のビースト`);
  } else if (type === 'scarab') {
    const scarabCount = (profile.scarabs || []).length;
    if (scarabCount > 0) parts.push(`${scarabCount}個のスカラベ`);
  }

  return parts.length > 0 ? parts.join(' | ') : '';
}

function toggleProfileDetails(card, profile, type, themeColor) {
  const detailsContainer = card.querySelector('.details-container');
  if (detailsContainer.style.maxHeight && detailsContainer.style.maxHeight !== '0px') {
    detailsContainer.style.maxHeight = '0';
    detailsContainer.style.marginTop = '0';
    return;
  }

  detailsContainer.innerHTML = '';
  const detailsContent = createDetailedView(profile, type);
  detailsContainer.appendChild(detailsContent);
  detailsContainer.style.marginTop = '8px';
  detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
}

function createDetailedView(profile, type) {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 10px; background: #1e1e1e; border-radius: 4px;';

  const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';

  if (type === 'map') {
    const settings = profile.settings || {};

    // MOD合計値サマリーバッジ (6項目対応)
    const totals = calcMapModTotals(profile);
    const summaryRow = document.createElement('div');
    summaryRow.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;';

    const makeSummaryBadge = (label, value, color) => {
      const badge = document.createElement('span');
      badge.style.cssText = `
        background: ${color}22;
        border: 1px solid ${color};
        color: ${color};
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
      `;
      badge.textContent = `${label} ${value}`;
      return badge;
    };

    if (settings.itemQuantity > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Quantity' : '数量', settings.itemQuantity, '#a54242'));
    if (settings.packSize > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Pack' : 'パック', settings.packSize, '#42a5a5'));
    if (settings.rarity > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Rarity' : 'レア', settings.rarity, '#a58242'));
    if (settings.rareMonster > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Rare Mon' : 'レアモン', settings.rareMonster, '#a542a5'));
    if (settings.magicMonster > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Magic Mon' : 'マジモン', settings.magicMonster, '#a5a542'));
    if (settings.waystone > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Waystone' : 'ウェイス', settings.waystone, '#4264a5'));

    if (summaryRow.childNodes.length > 0) {
      container.appendChild(summaryRow);
    }

    if (Object.keys(settings).length > 0) {
      const settingsDiv = document.createElement('div');
      settingsDiv.style.cssText = 'margin-bottom: 12px;';
      const rows = [];
      if (settings.itemQuantity) rows.push(createDetailRow(isEn ? 'Min Quantity' : '数量', `${settings.itemQuantity}%`));
      if (settings.packSize) rows.push(createDetailRow(isEn ? 'Min Pack' : 'パックサイズ', `${settings.packSize}%`));
      if (settings.rarity) rows.push(createDetailRow(isEn ? 'Min Rarity' : 'レアリティ', `${settings.rarity}%`));
      if (settings.rareMonster) rows.push(createDetailRow(isEn ? 'Min Rare' : 'レアモンスター', `${settings.rareMonster}%`));
      if (settings.magicMonster) rows.push(createDetailRow(isEn ? 'Min Magic' : 'マジックモンスター', `${settings.magicMonster}%`));
      if (settings.waystone) rows.push(createDetailRow(isEn ? 'Min Waystone' : 'ウェイストーン', `${settings.waystone}%`));
      
      const rarities = [];
      if (settings.rarities?.normal) rarities.push(isEn ? 'Normal' : 'ノーマル');
      if (settings.rarities?.magic) rarities.push(isEn ? 'Magic' : 'マジック');
      if (settings.rarities?.rare) rarities.push(isEn ? 'Rare' : 'レア');
      if (rarities.length > 0) rows.push(createDetailRow(isEn ? 'Rarity Filter' : 'レアリティフィルタ', rarities.join(', ')));
      
      if (settings.searchMode) {
        rows.push(createDetailRow(isEn ? 'Search Mode' : '検索モード', settings.searchMode === 'all' ? (isEn ? 'All' : '全て値以上') : (isEn ? 'Any' : 'どれか')));
      }
      const options = [];
      if (settings.ngModChecked) options.push(isEn ? 'NG mod' : 'NG mod');
      if (settings.mapTierChecked) options.push(isEn ? 'T17 mod' : 'T17 mod');
      if (options.length > 0) rows.push(createDetailRow(isEn ? 'Options' : 'オプション', options.join(', ')));
      
      rows.forEach(row => settingsDiv.appendChild(row));
      if (rows.length > 0) container.appendChild(settingsDiv);
    }
    
    if (profile.mods) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      
      const modsToProcess = [];
      if (Array.isArray(profile.mods)) {
        profile.mods.forEach(mod => {
          if (Array.isArray(mod)) modsToProcess.push({ id: mod[0], state: mod[1] || 'ng' }); // [id, state] format
          else if (typeof mod === 'string') modsToProcess.push({ id: mod, state: 'ng' });
        });
      } else if (typeof profile.mods === 'object') {
        Object.entries(profile.mods).forEach(([id, state]) => modsToProcess.push({ id, state }));
      }

      modsToProcess.forEach(({ id: modKey, state: modState }) => {
        const mod = (typeof mapModList !== 'undefined' ? mapModList : ModList)[modKey];
        if (mod) {
          const modItem = document.createElement('div');
          modItem.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid ${modState === 'wanted' ? '#4CAF50' : (mod.tier > 750 ? '#ed4c4c' : mod.tier > 500 ? '#F87171' : '#FCA5A5')};
          `;
          const primaryText = isEn ? (mod.engMod || mod.mod) : mod.mod;
          const secondaryText = isEn ? mod.mod : (mod.engMod || '');
          modItem.innerHTML = `
            <div style="color: #FFF; font-size: 0.8em; margin-bottom: 2px;">${typeof formatModText === 'function' ? formatModText(primaryText, mod.value) : primaryText}</div>
            <div style="color: #888; font-size: 0.7em;">${typeof formatModText === 'function' ? formatModText(secondaryText, mod.value) : secondaryText}</div>
          `;
          modList.appendChild(modItem);
        }
      });
      container.appendChild(modList);
    }
  } else if (type === 'flask' || type === 'item') {
    if (profile.flaskType || profile.itemType) {
      const typeRow = createDetailRow(isEn ? 'Type' : 'タイプ', profile.flaskType || profile.itemType);
      container.appendChild(typeRow);
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height: 8px;';
      container.appendChild(spacer);
    }
    if (profile.mods && profile.mods.length > 0) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      
      const modsData = type === 'flask' ? (window.rawFlaskMods || []) : (window.rawItemMods || []);

      profile.mods.forEach(modName => {
        let displayText = modName;
        if (modsData.length > 0) {
          const mod = modsData.find(m => m.name === modName);
          if (mod) displayText = `${mod.name}　${mod.text}`;
        }
        const modItem = document.createElement('div');
        modItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid ${type === 'flask' ? '#9B59B6' : '#3498DB'};
          color: #FFF;
          font-size: 0.8em;
        `;
        modItem.textContent = displayText;
        modList.appendChild(modItem);
      });
      container.appendChild(modList);
    }
  } else if (type === 'vendor') {
    const settings = profile.settings || {};
    const selected = settings.selected || {};
    const selectedIds = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);

    if (selectedIds.length > 0) {
      const groups = window.VENDOR_GROUPS || [];
      const list = document.createElement('div');
      list.style.cssText = 'display: grid; gap: 4px; margin-bottom: 12px;';

      groups.forEach(group => {
        const groupItems = group.items.filter(item => selected[item.id]);
        if (groupItems.length === 0) return;

        const groupTitle = document.createElement('div');
        groupTitle.textContent = group.name;
        groupTitle.style.cssText = 'color: #AAA; font-size: 0.8em; margin: 8px 0 4px;';
        list.appendChild(groupTitle);

        groupItems.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid #F39C12;
            color: #FFF;
            font-size: 0.8em;
            margin-bottom: 4px;
          `;
          itemDiv.textContent = item.label;
          list.appendChild(itemDiv);
        });
      });

      container.appendChild(list);
    }

    const enabledExcludeWeapons = Object.entries(settings.excludeWeapons || {})
      .filter(([, value]) => value)
      .map(([key]) => key);
    if (enabledExcludeWeapons.length > 0) {
      const excludeNames = enabledExcludeWeapons.map(key =>
        typeof window.getWeaponLabel === 'function' ? window.getWeaponLabel(key) : key
      );
      container.appendChild(createDetailRow('NG武器ベース（除外）', excludeNames.join(', ')));
    }

    const enabledWeapons = Object.entries(settings.weapon || {})
      .filter(([, value]) => value)
      .map(([key]) => key);
    if (enabledWeapons.length > 0) {
      const weaponNames = enabledWeapons.map(key =>
        typeof window.getWeaponLabel === 'function' ? window.getWeaponLabel(key) : key
      );
      container.appendChild(createDetailRow('武器ベース', weaponNames.join(', ')));
    }
  } else if (type === 'beast' || type === 'scarab' || type === 'tattoo' || type === 'runegraft') {
    const modItems = profile.beasts || profile.scarabs || profile.tattoos || profile.runegrafts || [];
    if (modItems.length > 0) {
      const list = document.createElement('div');
      list.style.cssText = 'display: grid; gap: 4px;';
      const dataList = type === 'beast' ? beastlist : (type === 'scarab' ? scarablist : (type === 'tattoo' ? tattoolist : runegraftlist));
      const stripeColor = type === 'beast' ? '#1ABC9C' : (type === 'scarab' ? '#D35400' : (type === 'tattoo' ? '#8E44AD' : '#2C3E50'));

      modItems.forEach(name => {
        const item = dataList && dataList[name];
        if (item) {
          const itemDiv = document.createElement('div');
          itemDiv.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid ${stripeColor};
            color: #FFF;
            font-size: 0.8em;
          `;
          const displayName = isEn ? (item.engName || name) : name;
          const displayDesc = isEn ? (item.enDescription || item.description || item.effect || '') : (item.description || item.effect || '');
          itemDiv.innerHTML = `
            <div style="color: #FFF; font-size: 0.8em; margin-bottom: 2px;">${displayName}</div>
            <div style="color: #888; font-size: 0.7em;">${displayDesc}${type === 'beast' && item.family ? ' - ' + item.family : ''}</div>
          `;
          list.appendChild(itemDiv);
        } else {
          const unknownItem = document.createElement('div');
          unknownItem.style.cssText = `background: #2a2a2a; padding: 6px 8px; border-radius: 3px; border-left: 3px solid ${stripeColor}; color: #FFF; font-size: 0.8em;`;
          unknownItem.textContent = name;
          list.appendChild(unknownItem);
        }
      });
      container.appendChild(list);
    }
  }

  return container;
}

function createDetailRow(label, value) {
  const row = document.createElement('div');
  row.style.cssText = 'display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333;';
  const labelSpan = document.createElement('span');
  labelSpan.style.cssText = 'color: #AAA; font-size: 0.75em;';
  labelSpan.textContent = label;
  const valueSpan = document.createElement('span');
  valueSpan.style.cssText = 'color: #FFF; font-size: 0.75em; font-weight: 500;';
  valueSpan.textContent = value;
  row.appendChild(labelSpan);
  row.appendChild(valueSpan);
  return row;
}

function loadSavedProfile(name, type, tabId) {
  switchTab(tabId);
  
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  if (type === 'vendor') {
    setTimeout(() => {
      if (typeof window.loadVendorProfileDirectly === 'function') {
        window.loadVendorProfileDirectly(name);
      } else {
        setTimeout(() => {
          if (typeof window.loadVendorProfileDirectly === 'function') {
            window.loadVendorProfileDirectly(name);
          } else {
            console.error('loadVendorProfileDirectly function not available');
            showNotification('ベンダーモジュールの読み込みに失敗しました', true);
          }
        }, 500);
      }
    }, 500);
    return;
  }
  
  setTimeout(() => {
    try {
      if (type === 'map') {
        document.getElementById('profileList').value = name;
        loadProfile();
      }
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.scrollTop = 0;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('プロファイルの読み込みに失敗しました', true);
    }
  }, 300);
}

function addProfileToTop(profileName, type) {
  const savedOrder = localStorage.getItem('poe2_savedRegexOrder');
  let order = [];
  
  if (savedOrder) {
    try {
      order = JSON.parse(savedOrder);
    } catch (e) {
      console.error('並び順の解析エラー:', e);
    }
  }
  
  order = order.filter(item => !(item.name === profileName && item.type === type));
  order.unshift({ name: profileName, type: type });
  localStorage.setItem('poe2_savedRegexOrder', JSON.stringify(order));
}

function removeProfileFromOrder(profileName, type) {
  const savedOrder = localStorage.getItem('poe2_savedRegexOrder');
  if (!savedOrder) return;
  
  try {
    let order = JSON.parse(savedOrder);
    order = order.filter(item => !(item.name === profileName && item.type === type));
    localStorage.setItem('poe2_savedRegexOrder', JSON.stringify(order));
  } catch (e) {
    console.error('並び順からの削除エラー:', e);
  }
}

function deleteSavedProfile(name, type) {
  if (!confirm(`"${name}" を削除しますか?\nこの操作は元に戻せません。`)) return;

  const storageKey = getPoe2StorageKey(type);
  if (!storageKey) {
    showNotification('不明なプロファイルタイプです', true);
    return;
  }

  try {
    const profiles = JSON.parse(localStorage.getItem(storageKey) || '{}');
    delete profiles[name];
    localStorage.setItem(storageKey, JSON.stringify(profiles));

    removeProfileFromOrder(name, type);

    if (type === 'map') {
      window.profiles = profiles;
      if (typeof updateProfileList === 'function') updateProfileList();
    } else if (type === 'vendor') {
      window.vendorProfiles = profiles;
      if (typeof updateVendorProfileList === 'function') updateVendorProfileList();
    }

    updateSavedRegexDisplay();
    showNotification(`"${name}" を削除しました`);
  } catch (error) {
    console.error('Error deleting profile:', error);
    showNotification('プロファイルの削除に失敗しました', true);
  }
}

function addFilterControls() {
  if (filterControlsAdded) return;
  
  const container = document.getElementById('savedRegexList');
  if (!container) return;

  const searchBox = document.getElementById('savedRegexSearch');
  if (!searchBox) return;

  const parent = searchBox.parentNode;

  const existingFilter = document.getElementById('savedRegexFilterControls');
  if (existingFilter) existingFilter.remove();

  const filterContainer = document.createElement('div');
  filterContainer.id = 'savedRegexFilterControls';
  filterContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
    align-items: center;
  `;

  const typeFilter = document.createElement('select');
  typeFilter.id = 'typeFilter';
  typeFilter.innerHTML = `
    <option value="all">すべてのタイプ</option>
    <option value="map">マップ</option>
    <option value="vendor">ベンダー</option>
  `;
  typeFilter.style.cssText = `
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #2a2a2a;
    color: white;
    min-width: 150px;
  `;

  const sortFilter = document.createElement('select');
  sortFilter.id = 'sortFilter';
  sortFilter.innerHTML = `
    <option value="custom">カスタム順序</option>
    <option value="newest">更新日時（新しい順）</option>
    <option value="oldest">更新日時（古い順）</option>
    <option value="name_asc">名前（昇順）</option>
    <option value="name_desc">名前（降順）</option>
    <option value="quantity_desc">数量（多い順）</option>
    <option value="packsize_desc">パックサイズ（多い順）</option>
    <option value="rarity_desc">レアリティ（多い順）</option>
    <option value="scarab_desc">スカラベ（多い順）</option>
    <option value="currency_desc">カレンシー（多い順）</option>
    <option value="maps_desc">マップ（多い順）</option>
  `;
  sortFilter.style.cssText = `
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #2a2a2a;
    color: white;
    min-width: 180px;
  `;

  const resetButton = document.createElement('button');
  resetButton.textContent = 'フィルターリセット';
  resetButton.style.cssText = `
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #666;
    background: #444;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
  `;
  resetButton.addEventListener('mouseenter', () => {
    resetButton.style.background = '#555';
  });
  resetButton.addEventListener('mouseleave', () => {
    resetButton.style.background = '#444';
  });

  filterContainer.appendChild(typeFilter);
  filterContainer.appendChild(sortFilter);
  filterContainer.appendChild(resetButton);

  parent.insertBefore(filterContainer, searchBox.nextSibling);

  typeFilter.addEventListener('change', function() {
    saveFilterState();
    applyFilters();
  });
  
  sortFilter.addEventListener('change', function() {
    saveFilterState();
    applyFilters();
  });
  
  resetButton.addEventListener('click', resetFilters);

  const searchInput = document.getElementById('savedRegexSearch');
  if (searchInput) {
    searchInput.removeEventListener('input', applyFilters);
    searchInput.addEventListener('input', function() {
      saveFilterState();
      applyFilters();
    });
  }

  filterControlsAdded = true;
  
  // フィルターコントロール追加後に初期フィルターを適用
  setTimeout(() => {
    const filterState = loadFilterState();
    if (filterState) {
      applyFilters();
    }
  }, 100);
}

function applyFilters() {
  const typeFilter = document.getElementById('typeFilter');
  const sortFilter = document.getElementById('sortFilter');
  const searchInput = document.getElementById('savedRegexSearch');
  
  if (!typeFilter || !sortFilter || !searchInput) {
    return;
  }
  
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const sortFilterValue = sortFilter.value;
  
  const cards = document.querySelectorAll('.profile-card');
  let visibleCards = [];

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const cardType = card.dataset.profileType;
    const searchMatch = !searchTerm || text.includes(searchTerm);
    const typeMatch = typeFilterValue === 'all' || cardType === typeFilterValue;
    const isVisible = searchMatch && typeMatch;
    card.style.display = isVisible ? 'block' : 'none';
    if (isVisible) visibleCards.push(card);
  });

  sortCards(visibleCards, sortFilterValue);
  updateFilterResultCount(visibleCards.length);
  
  const container = document.getElementById('savedRegexList');
  if (container) {
    container.style.opacity = '1';
  }
}

function sortCards(cards, sortType) {
  const container = document.getElementById('savedRegexCards');
  if (!container) return;

  const sortedCards = [...cards].sort((a, b) => {
    switch (sortType) {
      case 'newest':
        return (b.dataset.timestamp || 0) - (a.dataset.timestamp || 0);
      case 'oldest':
        return (a.dataset.timestamp || 0) - (b.dataset.timestamp || 0);
      case 'name_asc':
        return (a.dataset.profileName || '').localeCompare(b.dataset.profileName || '');
      case 'name_desc':
        return (b.dataset.profileName || '').localeCompare(a.dataset.profileName || '');
      case 'currency_desc':
        return Number(b.dataset.totalCurrency || 0) - Number(a.dataset.totalCurrency || 0);
      case 'packsize_desc':
        return Number(b.dataset.totalPackSize || 0) - Number(a.dataset.totalPackSize || 0);
      case 'quantity_desc':
        return Number(b.dataset.totalQuantity || 0) - Number(a.dataset.totalQuantity || 0);
      case 'rarity_desc':
        return Number(b.dataset.totalRarity || 0) - Number(a.dataset.totalRarity || 0);
      case 'scarab_desc':
        return Number(b.dataset.totalScarab || 0) - Number(a.dataset.totalScarab || 0);
      case 'maps_desc':
        return Number(b.dataset.totalMap || 0) - Number(a.dataset.totalMap || 0);
      case 'custom':
        return 0;
      default:
        return 0;
    }
  });

  sortedCards.forEach(card => {
    container.appendChild(card);
  });
}

function updateFilterResultCount(count) {
  let countElement = document.getElementById('filterResultCount');
  if (!countElement) {
    countElement = document.createElement('div');
    countElement.id = 'filterResultCount';
    countElement.style.cssText = `
      margin: 10px 0;
      font-size: 0.9em;
      color: #ccc;
      text-align: left;
    `;
    const filterContainer = document.getElementById('typeFilter').parentNode;
    filterContainer.appendChild(countElement);
  }
  
  const totalCount = document.querySelectorAll('.profile-card').length;
  countElement.textContent = `表示: ${count} / 全${totalCount}件`;
}

function resetFilters() {
  document.getElementById('savedRegexSearch').value = '';
  document.getElementById('typeFilter').value = 'all';
  document.getElementById('sortFilter').value = 'custom';
  
  saveFilterState();
  applyFilters();
  
  showNotification('フィルターをリセットしました');
}

function resetFilterControls() {
  filterControlsAdded = false;
}

function filterSavedRegex() {
  const searchTerm = document.getElementById('savedRegexSearch').value.toLowerCase();
  const cards = document.querySelectorAll('.profile-card');

  let visibleCount = 0;
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const match = text.includes(searchTerm);
    card.style.display = match ? 'block' : 'none';
    if (match) visibleCount++;
  });

  const container = document.getElementById('savedRegexList');
  let noResultMsg = container.querySelector('.no-result-message');
  
  if (visibleCount === 0 && searchTerm) {
    if (!noResultMsg) {
      noResultMsg = document.createElement('div');
      noResultMsg.className = 'no-result-message';
      noResultMsg.style.cssText = 'color: #888; text-align: center; padding: 20px;';
      noResultMsg.textContent = `"${searchTerm}" に一致するプロファイルが見つかりません`;
      container.appendChild(noResultMsg);
    }
  } else if (noResultMsg) {
    noResultMsg.remove();
  }
}

function makeSortable() {
  const container = document.getElementById('savedRegexCards');
  if (!container) return;

  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragenter', handleDragEnter);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
  if (!e.target.classList.contains('profile-card')) return;
  isDragging = true;
  dragStartIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  e.preventDefault();
  const card = e.target.closest('.profile-card');
  if (card && card !== document.querySelector('.dragging')) {
    card.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const card = e.target.closest('.profile-card');
  if (card) card.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const container = document.getElementById('savedRegexCards');
  const draggingCard = document.querySelector('.dragging');
  const cards = Array.from(container.querySelectorAll('.profile-card:not(.dragging)'));
  
  let closestCard = null;
  let closestOffset = Number.NEGATIVE_INFINITY;
  
  cards.forEach(card => {
    const box = card.getBoundingClientRect();
    const offset = e.clientY - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closestCard = card;
    }
  });
  
  if (closestCard) container.insertBefore(draggingCard, closestCard);
  else container.appendChild(draggingCard);
  
  dragEndIndex = Array.from(container.children).indexOf(draggingCard);
  saveSortOrder();
  return false;
}

function handleDragEnd(e) {
  const card = e.target.closest('.profile-card');
  if (card) {
    card.classList.remove('dragging');
    document.querySelectorAll('.profile-card').forEach(c => {
      c.classList.remove('drag-over');
    });
  }
  isDragging = false;
}

function saveSortOrder() {
  const container = document.getElementById('savedRegexCards');
  if (!container) return;
  
  const cards = Array.from(container.querySelectorAll('.profile-card'));
  const order = cards.map(card => {
    return { name: card.dataset.profileName, type: card.dataset.profileType };
  });
  
  localStorage.setItem('poe2_savedRegexOrder', JSON.stringify(order));
}

function restoreSortOrder(allProfiles) {
  const savedOrder = localStorage.getItem('poe2_savedRegexOrder');
  if (!savedOrder) return allProfiles;
  
  try {
    const order = JSON.parse(savedOrder);
    const orderedProfiles = [];
    const remainingProfiles = [...allProfiles];
    
    order.forEach(item => {
      const index = remainingProfiles.findIndex(profile => 
        profile.name === item.name && profile.type === item.type
      );
      if (index !== -1) {
        orderedProfiles.push(remainingProfiles[index]);
        remainingProfiles.splice(index, 1);
      }
    });
    
    const result = [...orderedProfiles, ...remainingProfiles];
    return result;
  } catch (e) {
    console.error('並び順の復元エラー:', e);
    return allProfiles;
  }
}

function resetSortOrder() {
  if (confirm('並び順をリセットしますか？')) {
    localStorage.removeItem('poe2_savedRegexOrder');
    updateSavedRegexDisplay();
  }
}

function addSortableStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .profile-card.dragging { opacity: 0.5; cursor: grabbing !important; }
    .profile-card.drag-over { border-top: 2px solid #4CAF50; margin-top: 10px; }
    .profile-card { transition: all 0.2s ease; user-select: none; }
  `;
  document.head.appendChild(style);
}

function hookSaveProfiles() {
  const originalMapSave = window.saveProfile;
  if (originalMapSave && typeof originalMapSave === 'function' && !originalMapSave._hooked) {
    window.saveProfile = function() {
      const profileName = document.getElementById('profileName')?.value.trim() || '';
      originalMapSave.apply(this, arguments);
      setTimeout(() => {
        try {
          const profiles = JSON.parse(localStorage.getItem('poe2_poeProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('poe2_poeProfiles', JSON.stringify(profiles));
          
          if (profileName) addProfileToTop(profileName, 'map');
          updateSavedRegexDisplay();
          
          // フィルターコントロールが存在する場合のみ適用
          setTimeout(() => {
            const typeFilter = document.getElementById('typeFilter');
            if (typeFilter) {
              applyFilters();
            }
          }, 200);
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveProfile._hooked = true;
  }

  const originalVendorSave = window.saveVendorProfile;
  if (originalVendorSave && typeof originalVendorSave === 'function' && !originalVendorSave._hooked) {
    window.saveVendorProfile = function() {
      const profileName = document.getElementById('vendorProfileName')?.value.trim() || '';
      originalVendorSave.apply(this, arguments);
      setTimeout(() => {
        try {
          const profiles = JSON.parse(localStorage.getItem('poe2_vendorProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('poe2_vendorProfiles', JSON.stringify(profiles));
          
          if (profileName) addProfileToTop(profileName, 'vendor');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveVendorProfile._hooked = true;
  }
}

function initSavedRegex() {
  const savedTabLink = document.querySelector('a[data-tab="savedContent"]');
  if (savedTabLink) {
    savedTabLink.addEventListener('click', () => {
      resetFilterControls();

      const container = document.getElementById('savedRegexList');
      if (container) {
        container.style.opacity = '1';
      }
      
      setTimeout(() => {
        updateSavedRegexDisplay();
        addSortableStyles();
        addFilterControls(); // 必ずフィルターコントロールを追加
      }, 100);
    });
  }

  const searchBox = document.getElementById('savedRegexSearch');
  if (searchBox) {
    searchBox.addEventListener('input', function() {
      saveFilterState();
      applyFilters();
    });
  }

  if (window.location.hash === '#saved') {
    // 初期表示時も非表示状態から開始
    const container = document.getElementById('savedRegexList');
    if (container) {
      container.style.opacity = '1';
    }
    
    setTimeout(() => {
      updateSavedRegexDisplay();
      addFilterControls(); // 必ずフィルターコントロールを追加
    }, 200);
  }

  setTimeout(() => {
    hookSaveProfiles();
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSavedRegex);
} else {
  initSavedRegex();
}


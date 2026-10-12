let isDragging = false;
let dragStartIndex = -1;
let dragEndIndex = -1;
let filterControlsAdded = false;

function saveFilterState() {
  const filterState = {
    searchTerm: getElement('savedRegexSearch').value,
    typeFilter: getElement('typeFilter').value,
    sortFilter: getElement('sortFilter').value
  };
  writeStoredJson('savedRegexFilterState', filterState);
}

function loadFilterState() {
  const saved = readStoredText('savedRegexFilterState');
  if (saved) {
    try {
      const filterState = readStoredJson('savedRegexFilterState');
      
      const searchInput = getElement('savedRegexSearch');
      const typeFilter = getElement('typeFilter');
      const sortFilter = getElement('sortFilter');
      
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

function getAllProfiles() {
  const allProfiles = [];
  
  const mapProfiles: ProfileDictionary = readStoredJson('poeProfiles');
  Object.entries(mapProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'map', tabId: 'mapContent', timestamp: profile.timestamp || 0 });
  });
  
  const flaskProfiles: ProfileDictionary = readStoredJson('flaskProfiles');
  Object.entries(flaskProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'flask', tabId: 'flaskContent', timestamp: profile.timestamp || 0 });
  });
  
  const itemProfiles: ProfileDictionary = readStoredJson('itemProfiles');
  Object.entries(itemProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'item', tabId: 'itemContent', timestamp: profile.timestamp || 0 });
  });

  const vendorProfiles: ProfileDictionary = readStoredJson('vendorProfiles');
  Object.entries(vendorProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'vendor', tabId: 'vendorContent', timestamp: profile.timestamp || 0 });
  });

  const beastProfiles: ProfileDictionary = readStoredJson('beastProfiles');
  Object.entries(beastProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'beast', tabId: 'beastContent', timestamp: profile.timestamp || 0 });
  });

  const scarabProfiles: ProfileDictionary = readStoredJson('scarabProfiles');
  Object.entries(scarabProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'scarab', tabId: 'scarabContent', timestamp: profile.timestamp || 0 });
  });

  const tattooProfiles: ProfileDictionary = readStoredJson('tattooProfiles');
  Object.entries(tattooProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'tattoo', tabId: 'tattooContent', timestamp: profile.timestamp || 0 });
  });

  const runegraftProfiles: ProfileDictionary = readStoredJson('runegraftProfiles');
  Object.entries(runegraftProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'runegraft', tabId: 'runegraftContent', timestamp: profile.timestamp || 0 });
  });

  return allProfiles;
}

const typeConfig = {
  map: { label: 'マップ', color: '#E74C3C', icon: '' },
  flask: { label: 'フラスコ', color: '#9B59B6', icon: '' },
  item: { label: 'アイテム', color: '#3498DB', icon: '' },
  vendor: { label: 'ベンダー', color: '#F39C12', icon: '' },
  beast: { label: 'ビースト', color: '#1ABC9C', icon: '' },
  scarab: { label: 'スカラベ', color: '#D35400', icon: '' },
  tattoo: { label: 'タトゥー', color: '#8E44AD', icon: '' },
  runegraft: { label: 'ルーングラフト', color: '#2C3E50', icon: '' }
};

function generateRegexFromProfile(profile: SavedProfile, type: string) {
  if (type === 'map') {
    return generateMapRegexFromProfile(profile);
  } else if (type === 'flask' || type === 'item') {
    const mods = ((profile as AffixProfile).mods || []).join('|');
    return mods || '(空のRegex)';
  } else if (type === 'vendor') {
    if (typeof window.generateVendorRegexFromProfile === 'function') {
      const regex = window.generateVendorRegexFromProfile(profile);
      return regex || '(空のRegex)';
    } else {
      return '(エラー: vendor.jsが読み込まれていません)';
    }
  } else if (type === 'beast') {
    const beasts = (profile.beasts || []);
    if (beasts.length === 0) return '(空のRegex)';
    
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const regexes = beasts.map(beastName => {
      const beast = beastlist[beastName];
      if (!beast) return null;
      return isEn ? (beast.enRegex || beast.regex) : beast.regex;
    }).filter(regex => regex !== null);
    
    return regexes.join('|') || '(空のRegex)';
  } else if (type === 'scarab') {
    const scarabNames = (profile.scarabs || []);
    if (scarabNames.length === 0) return '(空のRegex)';
    
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const regexes = scarabNames.map(name => {
      const item = scarablist[name];
      if (!item) return null;
      return isEn ? (item.enRegex || item.regex) : item.regex;
    }).filter(regex => regex !== null);
    
    return regexes.join('|') || '(空のRegex)';
  } else if (type === 'tattoo') {
    const tattooNames = (profile.tattoos || []);
    if (tattooNames.length === 0) return '(空のRegex)';
    
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const regexes = tattooNames.map(name => {
      const item = tattoolist[name];
      if (!item) return null;
      return isEn ? (item.enRegex || item.regex) : item.regex;
    }).filter(regex => regex !== null);
    
    return regexes.join('|') || '(空のRegex)';
  } else if (type === 'runegraft') {
    const runegraftNames = (profile.runegrafts || []);
    if (runegraftNames.length === 0) return '(空のRegex)';
    
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const regexes = runegraftNames.map(name => {
      const item = runegraftlist[name];
      if (!item) return null;
      return isEn ? (item.enRegex || item.regex) : item.regex;
    }).filter(regex => regex !== null);
    
    return regexes.join('|') || '(空のRegex)';
  }
  return '(不明なタイプ)';
} 

function generateMapRegexFromProfile(profile: SavedProfile) {
  const originalCheckedMods = new Map(checkedMods);
  const originalInputState = {
    itemQuantity: getElement('itemQuantityInput')?.value || '',
    packSize: getElement('packSizeInput')?.value || '',
    rarity: getElement('rarityInput')?.value || '',
    scarab: getElement('scarabInput')?.value || '',
    currency: getElement('currencyInput')?.value || '',
    map: getElement('mapInput')?.value || ''
  };
  const originalCheckboxState = {
    mapTierChecked: getElement('mapTierCheckbox')?.checked || false,
    normalChecked: getElement('normalCheckbox')?.checked || false,
    magicChecked: getElement('magicCheckbox')?.checked || false,
    rareChecked: getElement('rareCheckbox')?.checked || false
  };
  const originalSearchMode = document.querySelector<HTMLInputElement>('input[name="searchMode"]:checked')?.value;

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
      if (getElement('itemQuantityInput')) getElement('itemQuantityInput').value = settings.itemQuantity || '';
      if (getElement('packSizeInput')) getElement('packSizeInput').value = settings.packSize || '';
      if (getElement('rarityInput')) getElement('rarityInput').value = settings.rarity || '';
      if (getElement('scarabInput')) getElement('scarabInput').value = settings.scarab || '';
      if (getElement('currencyInput')) getElement('currencyInput').value = settings.currency || '';
      if (getElement('mapInput')) getElement('mapInput').value = settings.map || '';

      if (getElement('mapTierCheckbox')) getElement('mapTierCheckbox').checked = settings.mapTierChecked || false;
      if (getElement('normalCheckbox')) getElement('normalCheckbox').checked = settings.rarities?.normal || false;
      if (getElement('magicCheckbox')) getElement('magicCheckbox').checked = settings.rarities?.magic || false;
      if (getElement('rareCheckbox')) getElement('rareCheckbox').checked = settings.rarities?.rare || false;

      const searchModeRadio = document.querySelector<HTMLInputElement>(`input[name="searchMode"][value="${settings.searchMode || 'any'}"]`);
      if (searchModeRadio) searchModeRadio.checked = true;
    }

    updateCombinedRegex();
    const regex = getElement('combinedRegexOutput').textContent;
    return regex || '(空のRegex)';

  } finally {
    checkedMods.clear();
    originalCheckedMods.forEach((state, mod) => checkedMods.set(mod, state));

    if (getElement('itemQuantityInput')) getElement('itemQuantityInput').value = originalInputState.itemQuantity;
    if (getElement('packSizeInput')) getElement('packSizeInput').value = originalInputState.packSize;
    if (getElement('rarityInput')) getElement('rarityInput').value = originalInputState.rarity;
    if (getElement('scarabInput')) getElement('scarabInput').value = originalInputState.scarab;
    if (getElement('currencyInput')) getElement('currencyInput').value = originalInputState.currency;
    if (getElement('mapInput')) getElement('mapInput').value = originalInputState.map;

    if (getElement('mapTierCheckbox')) getElement('mapTierCheckbox').checked = originalCheckboxState.mapTierChecked;
    if (getElement('normalCheckbox')) getElement('normalCheckbox').checked = originalCheckboxState.normalChecked;
    if (getElement('magicCheckbox')) getElement('magicCheckbox').checked = originalCheckboxState.magicChecked;
    if (getElement('rareCheckbox')) getElement('rareCheckbox').checked = originalCheckboxState.rareChecked;

    const originalSearchModeRadio = document.querySelector<HTMLInputElement>(`input[name="searchMode"][value="${originalSearchMode || 'any'}"]`);
    if (originalSearchModeRadio) originalSearchModeRadio.checked = true;

    updateCombinedRegex();
  }
}

function calcMapModTotals(profile) {
  // profile.modsからmapModListを参照して合計値を計算
  let totalCurrency = 0, totalPackSize = 0, totalQuantity = 0;
  let totalRarity = 0, totalScarab = 0, totalMap = 0;
  
  if (!profile.mods) return { totalCurrency, totalPackSize, totalQuantity, totalRarity, totalScarab, totalMap };
  
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
    totalCurrency += Number(mod['map_currency_drop_chance_+%_final_from_uber_mod'] || 0);
    totalPackSize += Number(mod['map_pack_size_+%'] || 0);
    totalQuantity += Number(mod['map_item_drop_quantity_+%'] || 0);
    totalRarity += Number(mod['map_item_drop_rarity_+%'] || 0);
    totalScarab += Number(mod['map_scarab_drop_chance_+%_final_from_uber_mod'] || 0);
    totalMap += Number(mod['map_map_item_drop_chance_+%_final_from_uber_mod'] || 0);
  });
  
  return { totalCurrency, totalPackSize, totalQuantity, totalRarity, totalScarab, totalMap };
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
    card.dataset.totalScarab = settings.scarab || 0;
    card.dataset.totalCurrency = settings.currency || 0;
    card.dataset.totalMap = settings.map || 0;
  } else {
    card.dataset.totalQuantity = '0';
    card.dataset.totalPackSize = '0';
    card.dataset.totalRarity = '0';
    card.dataset.totalScarab = '0';
    card.dataset.totalCurrency = '0';
    card.dataset.totalMap = '0';
  }
  
  const title = (card as HTMLElement).querySelector<HTMLElement>('.profile-card-title') || (card as HTMLElement).querySelector<HTMLElement>('.title-area span:nth-child(2)');
  if (title) title.classList.add('profile-card-title');
  
  const typeLabel = (card as HTMLElement).querySelector<HTMLElement>('.profile-card-type');
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
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest<HTMLElement>('button')) return;
    
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
    const colorCount = Object.values(settings.colors || {}).filter(Boolean).length;
    if (colorCount > 0) parts.push(`${colorCount}色`);
    const linkSettings = [];
    if (settings.anyThreeLink) linkSettings.push('3L');
    if (settings.anyFourLink) linkSettings.push('4L');
    if (settings.anyFiveLink) linkSettings.push('5L');
    if (settings.anySixLink) linkSettings.push('6L');
    if (settings.anySixSocket) linkSettings.push('6S');
    if (linkSettings.length > 0) parts.push(linkSettings.join(','));
    const weaponCount = Object.values(settings.weapon || {}).filter(Boolean).length;
    if (weaponCount > 0) parts.push(`${weaponCount}武器`);
    const gemCount = (settings.selectedGems || []).length;
    if (gemCount > 0) {
      const gemNames = [];
      const maxDisplay = 2;
      for (let i = 0; i < Math.min(gemCount, maxDisplay); i++) {
       // 保存されたRegex内の現在の言語は異なる可能性がありますが、
      // 混合クライアントの場合はデフォルトとして日本語を使用するか、
      // または enRegex を使用すべきか判断を試みます。;
        const gemRegex = settings.selectedGems[i];
        let displayName = gemRegex;
        if (profile.gemInfo) {
          const gemInfo = profile.gemInfo.find(g => g.regex === gemRegex);
          if (gemInfo && gemInfo.display_name) displayName = gemInfo.display_name;
        }
        if (typeof window.getGemDisplayName === 'function') {
          displayName = window.getGemDisplayName(gemRegex);
        }
        gemNames.push(displayName);
      }
      let gemSummary = gemNames.join(', ');
      if (gemCount > maxDisplay) gemSummary += ` ...他${gemCount - maxDisplay}個`;
      parts.push(gemSummary);
    }
  } else if (type === 'beast') {
    const beastCount = (profile.beasts || []).length;
    if (beastCount > 0) parts.push(`${beastCount}個のビースト`);
  } else if (type === 'scarab') {
    const scarabCount = (profile.scarabs || []).length;
    if (scarabCount > 0) parts.push(`${scarabCount}個のスカラベ`);
  }

  return parts.length > 0 ? parts.join(' | ') : '';
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

    if (settings.itemQuantity > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Quality' : '数量', settings.itemQuantity, '#a54242'));
    if (settings.packSize > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Pack' : 'パック', settings.packSize, '#42a5a5'));
    if (settings.rarity > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Rarity' : 'レア', settings.rarity, '#a58242'));
    if (settings.scarab > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Scarab' : 'スカラベ', settings.scarab, '#a542a5'));
    if (settings.currency > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Currency' : 'カレンシー', settings.currency, '#a5a542'));
    if (settings.map > 0) summaryRow.appendChild(makeSummaryBadge(isEn ? 'Map' : 'マップ', settings.map, '#4264a5'));

    if (summaryRow.childNodes.length > 0) {
      container.appendChild(summaryRow);
    }

    if (Object.keys(settings).length > 0) {
      const settingsDiv = document.createElement('div');
      settingsDiv.style.cssText = 'margin-bottom: 12px;';
      const rows = [];
      if (settings.itemQuantity) rows.push(createDetailRow(isEn ? 'Min Quality' : '数量', `${settings.itemQuantity}%`));
      if (settings.packSize) rows.push(createDetailRow(isEn ? 'Min Pack' : 'パックサイズ', `${settings.packSize}%`));
      if (settings.rarity) rows.push(createDetailRow(isEn ? 'Min Rarity' : 'レアリティ', `${settings.rarity}%`));
      if (settings.scarab) rows.push(createDetailRow(isEn ? 'Min Scarab' : 'スカラベ', `${settings.scarab}%`));
      if (settings.currency) rows.push(createDetailRow(isEn ? 'Min Currency' : 'カレンシー', `${settings.currency}%`));
      if (settings.map) rows.push(createDetailRow(isEn ? 'Min Map' : 'マップ', `${settings.map}%`));
      
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
    const enabledColors = Object.entries(settings.colors || {})
      .filter(([key, value]) => value)
      .map(([key]) => key);
    if (enabledColors.length > 0) {
      const colorsDiv = document.createElement('div');
      colorsDiv.style.cssText = 'margin-bottom: 12px;';
      const colorTitle = document.createElement('div');
      colorTitle.textContent = isEn ? 'Color Settings:' : 'カラー設定:';
      colorTitle.style.cssText = 'color: #AAA; font-size: 0.8em; margin-bottom: 8px;';
      colorsDiv.appendChild(colorTitle);
      enabledColors.forEach(colorKey => {
        const colorItem = document.createElement('div');
        colorItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid #F39C12;
          color: #FFF;
          font-size: 0.8em;
          margin-bottom: 4px;
        `;
        const colorNames = {
          rrr: '🔴-🔴-🔴', ggg: '🟢-🟢-🟢', bbb: '🔵-🔵-🔵',
          rrA: '🔴-🔴-⚪', ggA: '🟢-🟢-⚪', bbA: '🔵-🔵-⚪',
          rrg: '🔴-🔴-🟢', rrb: '🔴-🔴-🔵', ggr: '🟢-🟢-🔴',
          ggb: '🟢-🟢-🔵', bbr: '🔵-🔵-🔴', bbg: '🔵-🔵-🟢',
          rgb: '🔴-🟢-🔵', raa: '🔴-⚪-⚪', gaa: '🟢-⚪-⚪', baa: '🔵-⚪-⚪',
          rr: '🔴-🔴', gg: '🟢-🟢', bb: '🔵-🔵',
          rb: '🔴-🔵', gr: '🟢-🔴', bg: '🔵-🟢'
        };
        colorItem.textContent = colorNames[colorKey] || colorKey;
        colorsDiv.appendChild(colorItem);
      });
      container.appendChild(colorsDiv);
    }

    const enabledExcludeWeapons = Object.entries(settings.excludeWeapons || {})
      .filter(([key, value]) => value)
      .map(([key]) => key);
    if (enabledExcludeWeapons.length > 0) {
      const weaponNames = isEn ? {
        claw: 'Claw', dagger: 'Dagger', wand: 'Wand', oneHandSword: '1H Sword',
        thrustingSword: 'Thrusting Sword', oneHandAxe: '1H Axe', oneHandMace: '1H Mace',
        sceptre: 'Sceptre', runeDagger: 'Rune Dagger', bow: 'Bow', staff: 'Staff',
        twoHandSword: '2H Sword', twoHandAxe: '2H Axe', twoHandMace: '2H Mace',
        warstaff: 'Warstaff', shield: 'Shield'
      } : {
        claw: '鉤爪', dagger: '短剣', wand: 'ワンド', oneHandSword: '片手剣',
        thrustingSword: '刺突剣', oneHandAxe: '片手斧', oneHandMace: '片手メイス',
        sceptre: 'セプター', runeDagger: 'ルーンの短剣', bow: '弓', staff: 'スタッフ',
        twoHandSword: '両手剣', twoHandAxe: '両手斧', twoHandMace: '両手メイス',
        warstaff: 'ウォースタッフ', shield: '盾'
      };
      const excludeWeaponDisplayNames = enabledExcludeWeapons.map(weapon => weaponNames[weapon] || weapon);
      container.appendChild(createDetailRow(isEn ? 'Excluded Weapons' : '除外武器ベース', excludeWeaponDisplayNames.join(', ')));
    }

    const linkSettings = [];
    if (settings.anyThreeLink) linkSettings.push(isEn ? '3-Link' : '3リンク');
    if (settings.anyFourLink) linkSettings.push(isEn ? '4-Link' : '4リンク');
    if (settings.anyFiveLink) linkSettings.push(isEn ? '5-Link' : '5リンク');
    if (settings.anySixLink) linkSettings.push(isEn ? '6-Link' : '6リンク');
    if (settings.anySixSocket) linkSettings.push(isEn ? '6-Socket' : '6ソケット');
    if (linkSettings.length > 0) container.appendChild(createDetailRow(isEn ? 'Links' : 'リンク設定', linkSettings.join(', ')));
    const movementSettings = [];
    if (settings.movement?.ten) movementSettings.push('10%');
    if (settings.movement?.fifteen) movementSettings.push('15%');
    if (settings.movement?.twenty) movementSettings.push('20%');
    if (settings.movement?.twentyfive) movementSettings.push('25%');
    if (settings.movement?.thirty) movementSettings.push('30%');
    if (movementSettings.length > 0) container.appendChild(createDetailRow(isEn ? 'MS' : '移動速度', movementSettings.join(', ')));
    const enabledWeapons = Object.entries(settings.weapon || {})
      .filter(([key, value]) => value)
      .map(([key]) => key);
    if (enabledWeapons.length > 0) {
      const weaponNames = isEn ? {
        claw: 'Claw', dagger: 'Dagger', wand: 'Wand', oneHandSword: '1H Sword',
        thrustingSword: 'Thrusting Sword', oneHandAxe: '1H Axe', oneHandMace: '1H Mace',
        sceptre: 'Sceptre', runeDagger: 'Rune Dagger', bow: 'Bow', staff: 'Staff',
        twoHandSword: '2H Sword', twoHandAxe: '2H Axe', twoHandMace: '2H Mace', warstaff: 'Warstaff'
      } : {
        claw: '鉤爪', dagger: '短剣', wand: 'ワンド', oneHandSword: '片手剣',
        thrustingSword: '刺突剣', oneHandAxe: '片手斧', oneHandMace: '片手メイス',
        sceptre: 'セプター', runeDagger: 'ルーンの短剣', bow: '弓', staff: 'スタッフ',
        twoHandSword: '両手剣', twoHandAxe: '両手斧', twoHandMace: '両手メイス', warstaff: 'ウォースタッフ'
      };
      const weaponDisplayNames = enabledWeapons.map(weapon => weaponNames[weapon] || weapon);
      container.appendChild(createDetailRow(isEn ? 'Weapon Bases' : '武器ベース', weaponDisplayNames.join(', ')));
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
        getElement('profileList').value = name;
        loadProfile();
      } else if (type === 'flask') {
        getElement('flaskProfileList').value = name;
        loadFlaskProfile();
      } else if (type === 'item') {
        getElement('itemProfileList').value = name;
        loadItemProfile();
      } else if (type === 'beast') {
        getElement('beastProfileList').value = name;
        loadBeastProfile();
      } else if (type === 'scarab') {
        getElement('scarabProfileList').value = name;
        loadScarabProfile();
      } else if (type === 'tattoo') {
        getElement('tattooProfileList').value = name;
        loadTattooProfile();
      } else if (type === 'runegraft') {
        getElement('runegraftProfileList').value = name;
        loadRunegraftProfile();
      }
      const tabContent = getElement(tabId);
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
  const savedOrder = readStoredText('savedRegexOrder');
  let order = [];
  
  if (savedOrder) {
    try {
      order = readStoredJson('savedRegexOrder');
    } catch (e) {
      console.error('並び順の解析エラー:', e);
    }
  }
  
  order = order.filter(item => !(item.name === profileName && item.type === type));
  order.unshift({ name: profileName, type: type });
  writeStoredJson('savedRegexOrder', order);
}

function removeProfileFromOrder(profileName, type) {
  const savedOrder = readStoredText('savedRegexOrder');
  if (!savedOrder) return;
  
  try {
    let order = readStoredJson('savedRegexOrder');
    order = order.filter(item => !(item.name === profileName && item.type === type));
    writeStoredJson('savedRegexOrder', order);
  } catch (e) {
    console.error('並び順からの削除エラー:', e);
  }
}

function deleteSavedProfile(name, type) {
  if (!confirm(`"${name}" を削除しますか?\nこの操作は元に戻せません。`)) return;

  let storageKey = '';
  if (type === 'map') storageKey = 'poeProfiles';
  else if (type === 'flask') storageKey = 'flaskProfiles';
  else if (type === 'item') storageKey = 'itemProfiles';
  else if (type === 'vendor') storageKey = 'vendorProfiles';
  else if (type === 'beast') storageKey = 'beastProfiles';
  else if (type === 'scarab') storageKey = 'scarabProfiles';
  else if (type === 'tattoo') storageKey = 'tattooProfiles';
  else if (type === 'runegraft') storageKey = 'runegraftProfiles';

  try {
    const profiles: ProfileDictionary = readStoredJson(storageKey);
    delete profiles[name];
    if (!writeStoredJson(storageKey, profiles)) return false;

    removeProfileFromOrder(name, type);

    if (type === 'map') {
      window.profiles = profiles;
      if (typeof updateProfileList === 'function') updateProfileList();
    } else if (type === 'flask') {
      window.flaskProfiles = profiles;
      if (typeof updateFlaskProfileList === 'function') updateFlaskProfileList();
    } else if (type === 'item') {
      window.itemProfiles = profiles;
      if (typeof updateItemProfileList === 'function') updateItemProfileList();
    } else if (type === 'vendor') {
      window.vendorProfiles = profiles;
      if (typeof updateVendorProfileList === 'function') updateVendorProfileList();
    } else if (type === 'beast') {
      window.beastProfiles = profiles;
      if (typeof updateBeastProfileList === 'function') updateBeastProfileList();
    } else if (type === 'scarab') {
      window.scarabProfiles = profiles;
      if (typeof updateScarabProfileList === 'function') updateScarabProfileList();
    } else if (type === 'tattoo') {
      window.tattooProfiles = profiles;
      if (typeof updateTattooProfileList === 'function') updateTattooProfileList();
    } else if (type === 'runegraft') {
      window.runegraftProfiles = profiles;
      if (typeof updateRunegraftProfileList === 'function') updateRunegraftProfileList();
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
  
  const container = getElement('savedRegexList');
  if (!container) return;

  const searchBox = getElement('savedRegexSearch');
  if (!searchBox) return;

  const parent = searchBox.parentNode;

  const existingFilter = getElement('savedRegexFilterControls');
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
    <option value="flask">フラスコ</option>
    <option value="item">アイテム</option>
    <option value="vendor">ベンダー</option>
    <option value="beast">ビースト</option>
    <option value="scarab">スカラベ</option>
    <option value="tattoo">タトゥー</option>
    <option value="runegraft">ルーングラフト</option>
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

  const searchInput = getElement('savedRegexSearch');
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

function sortCards(cards, sortType) {
  const container = getElement('savedRegexCards');
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

function saveSortOrder() {
  const container = getElement('savedRegexCards');
  if (!container) return;
  
  const cards = Array.from(container.querySelectorAll<HTMLElement>('.profile-card'));
  const order = cards.map(card => {
    return { name: card.dataset.profileName, type: card.dataset.profileType };
  });
  
  writeStoredJson('savedRegexOrder', order);
}

function restoreSortOrder(allProfiles) {
  const savedOrder = readStoredText('savedRegexOrder');
  if (!savedOrder) return allProfiles;
  
  try {
    const order = readStoredJson('savedRegexOrder');
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
    removeStoredValue('savedRegexOrder');
    updateSavedRegexDisplay();
  }
}

function hookSaveProfiles() {
  const originalMapSave = window.saveProfile;
  if (originalMapSave && typeof originalMapSave === 'function' && !originalMapSave._hooked) {
    window.saveProfile = function() {
      const profileName = getElement('profileName')?.value.trim() || '';
      if (originalMapSave.apply(this, arguments) === false) return false;
      setTimeout(() => {
        try {
          const profiles: ProfileDictionary = readStoredJson('poeProfiles');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          if (!writeStoredJson('poeProfiles', profiles)) return false;
          
          if (profileName) addProfileToTop(profileName, 'map');
          updateSavedRegexDisplay();
          
          // フィルターコントロールが存在する場合のみ適用
          setTimeout(() => {
            const typeFilter = getElement('typeFilter');
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

  const originalFlaskSave = window.saveFlaskProfile;
  if (originalFlaskSave && typeof originalFlaskSave === 'function' && !originalFlaskSave._hooked) {
    window.saveFlaskProfile = function() {
      const profileName = getElement('flaskProfileName')?.value.trim() || '';
      if (originalFlaskSave.apply(this, arguments) === false) return false;
      setTimeout(() => {
        try {
          const profiles: ProfileDictionary = readStoredJson('flaskProfiles');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          if (!writeStoredJson('flaskProfiles', profiles)) return false;
          
          if (profileName) addProfileToTop(profileName, 'flask');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveFlaskProfile._hooked = true;
  }

  const originalItemSave = window.saveItemProfile;
  if (originalItemSave && typeof originalItemSave === 'function' && !originalItemSave._hooked) {
    window.saveItemProfile = function() {
      const profileName = getElement('itemProfileName')?.value.trim() || '';
      if (originalItemSave.apply(this, arguments) === false) return false;
      setTimeout(() => {
        try {
          const profiles: ProfileDictionary = readStoredJson('itemProfiles');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          if (!writeStoredJson('itemProfiles', profiles)) return false;
          
          if (profileName) addProfileToTop(profileName, 'item');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveItemProfile._hooked = true;
  }

  const originalVendorSave = window.saveVendorProfile;
  if (originalVendorSave && typeof originalVendorSave === 'function' && !originalVendorSave._hooked) {
    window.saveVendorProfile = function() {
      const profileName = getElement('vendorProfileName')?.value.trim() || '';
      if (originalVendorSave.apply(this, arguments) === false) return false;
      setTimeout(() => {
        try {
          const profiles: ProfileDictionary = readStoredJson('vendorProfiles');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          if (!writeStoredJson('vendorProfiles', profiles)) return false;
          
          if (profileName) addProfileToTop(profileName, 'vendor');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveVendorProfile._hooked = true;
  }

  const originalBeastSave = window.saveBeastProfile;
  if (originalBeastSave && typeof originalBeastSave === 'function' && !originalBeastSave._hooked) {
    window.saveBeastProfile = function() {
      const profileName = getElement('beastProfileName')?.value.trim() || '';
      if (originalBeastSave.apply(this, arguments) === false) return false;
      setTimeout(() => {
        try {
          const profiles: ProfileDictionary = readStoredJson('beastProfiles');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          if (!writeStoredJson('beastProfiles', profiles)) return false;
          
          if (profileName) addProfileToTop(profileName, 'beast');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveBeastProfile._hooked = true;
  }

  const originalScarabSave = window.saveScarabProfile;
  if (originalScarabSave && typeof originalScarabSave === 'function' && !originalScarabSave._hooked) {
    window.saveScarabProfile = function() {
      const profileName = getElement('scarabProfileName')?.value.trim() || '';
      if (originalScarabSave.apply(this, arguments) === false) return false;
      setTimeout(() => {
        try {
          const profiles: ProfileDictionary = readStoredJson('scarabProfiles');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          if (!writeStoredJson('scarabProfiles', profiles)) return false;
          
          if (profileName) addProfileToTop(profileName, 'scarab');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveScarabProfile._hooked = true;
  }
}

function initSavedRegex() {
  const savedTabLink = document.querySelector<HTMLElement>('a[data-tab="savedContent"]');
  if (savedTabLink) {
    savedTabLink.addEventListener('click', () => {
      resetFilterControls();
      try {
        const flaskData = readStoredText('flaskModsData');
        if (flaskData) window.rawFlaskMods = readStoredJson('flaskModsData');
        const itemData = readStoredText('itemModsData');
        if (itemData) window.rawItemMods = readStoredJson('itemModsData');
      } catch (e) {
        console.error('MODデータ復元エラー:', e);
      }
      
      // コンテナを非表示にしてから更新
      const container = getElement('savedRegexList');
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

  const searchBox = getElement('savedRegexSearch');
  if (searchBox) {
    searchBox.addEventListener('input', function() {
      saveFilterState();
      applyFilters();
    });
  }

  if (window.location.hash === '#saved') {
    // 初期表示時も非表示状態から開始
    const container = getElement('savedRegexList');
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

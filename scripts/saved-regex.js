let isDragging = false;
let dragStartIndex = -1;
let dragEndIndex = -1;
let filterControlsAdded = false;

function saveFilterState() {
  const filterState = {
    searchTerm: document.getElementById('savedRegexSearch').value,
    typeFilter: document.getElementById('typeFilter').value,
    sortFilter: document.getElementById('sortFilter').value
  };
  localStorage.setItem('savedRegexFilterState', JSON.stringify(filterState));
}

function loadFilterState() {
  const saved = localStorage.getItem('savedRegexFilterState');
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
  
  // コンテナを非表示にしてから内容を更新
  container.style.opacity = '0';
  container.style.transition = 'opacity 0.2s ease';
  
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
      } else {
        container.style.opacity = '1';
      }
    } else {
      container.style.opacity = '1';
    }
  }, 50);
}

function getAllProfiles() {
  const allProfiles = [];
  
  const mapProfiles = JSON.parse(localStorage.getItem('poeProfiles') || '{}');
  Object.entries(mapProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'map', tabId: 'mapContent', timestamp: profile.timestamp || 0 });
  });
  
  const flaskProfiles = JSON.parse(localStorage.getItem('flaskProfiles') || '{}');
  Object.entries(flaskProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'flask', tabId: 'flaskContent', timestamp: profile.timestamp || 0 });
  });
  
  const itemProfiles = JSON.parse(localStorage.getItem('itemProfiles') || '{}');
  Object.entries(itemProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'item', tabId: 'itemContent', timestamp: profile.timestamp || 0 });
  });

  const vendorProfiles = JSON.parse(localStorage.getItem('vendorProfiles') || '{}');
  Object.entries(vendorProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'vendor', tabId: 'vendorContent', timestamp: profile.timestamp || 0 });
  });

  const beastProfiles = JSON.parse(localStorage.getItem('beastProfiles') || '{}');
  Object.entries(beastProfiles).forEach(([name, profile]) => {
    allProfiles.push({ name, profile, type: 'beast', tabId: 'beastContent', timestamp: profile.timestamp || 0 });
  });

  return allProfiles;
}

const typeConfig = {
  map: { label: 'マップ', color: '#E74C3C', icon: '' },
  flask: { label: 'フラスコ', color: '#9B59B6', icon: '' },
  item: { label: 'アイテム', color: '#3498DB', icon: '' },
  vendor: { label: 'ベンダー', color: '#F39C12', icon: '' },
  beast: { label: 'ビースト', color: '#1ABC9C', icon: '' }
};

function generateRegexFromProfile(profile, type) {
  if (type === 'map') {
    return generateMapRegexFromProfile(profile);
  } else if (type === 'flask' || type === 'item') {
    const mods = (profile.mods || []).join('|');
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
    
    const regexes = beasts.map(beastName => {
      const beast = beastlist[beastName];
      return beast ? beast.regex : null;
    }).filter(regex => regex !== null);
    
    return regexes.join('|') || '(空のRegex)';
  }
  return '(不明なタイプ)';
} 

function generateMapRegexFromProfile(profile) {
  const originalCheckedMods = new Set(checkedMods);
  const originalInputState = {
    itemQuantity: document.getElementById('itemQuantityInput').value,
    packSize: document.getElementById('packSizeInput').value,
    rarity: document.getElementById('rarityInput').value,
    scarab: document.getElementById('scarabInput').value,
    currency: document.getElementById('currencyInput').value,
    map: document.getElementById('mapInput').value
  };
  const originalCheckboxState = {
    ngModChecked: document.getElementById('ngModCheckbox').checked,
    mapTierChecked: document.getElementById('mapTierCheckbox').checked,
    normalChecked: document.getElementById('normalCheckbox').checked,
    magicChecked: document.getElementById('magicCheckbox').checked,
    rareChecked: document.getElementById('rareCheckbox').checked
  };
  const originalSearchMode = document.querySelector('input[name="searchMode"]:checked')?.value;

  try {
    checkedMods.clear();
    (profile.mods || []).forEach(mod => checkedMods.add(mod));

    document.getElementById('itemQuantityInput').value = profile.settings.itemQuantity || '';
    document.getElementById('packSizeInput').value = profile.settings.packSize || '';
    document.getElementById('rarityInput').value = profile.settings.rarity || '';
    document.getElementById('scarabInput').value = profile.settings.scarab || '';
    document.getElementById('currencyInput').value = profile.settings.currency || '';
    document.getElementById('mapInput').value = profile.settings.map || '';

    document.getElementById('ngModCheckbox').checked = profile.settings.ngModChecked || false;
    document.getElementById('mapTierCheckbox').checked = profile.settings.mapTierChecked || false;
    document.getElementById('normalCheckbox').checked = profile.settings.rarities?.normal || false;
    document.getElementById('magicCheckbox').checked = profile.settings.rarities?.magic || false;
    document.getElementById('rareCheckbox').checked = profile.settings.rarities?.rare || false;

    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${profile.settings.searchMode || 'any'}"]`);
    if (searchModeRadio) searchModeRadio.checked = true;

    updateCombinedRegex();
    const regex = document.getElementById('combinedRegexOutput').textContent;
    return regex || '(空のRegex)';

  } finally {
    checkedMods.clear();
    originalCheckedMods.forEach(mod => checkedMods.add(mod));

    document.getElementById('itemQuantityInput').value = originalInputState.itemQuantity;
    document.getElementById('packSizeInput').value = originalInputState.packSize;
    document.getElementById('rarityInput').value = originalInputState.rarity;
    document.getElementById('scarabInput').value = originalInputState.scarab;
    document.getElementById('currencyInput').value = originalInputState.currency;
    document.getElementById('mapInput').value = originalInputState.map;

    document.getElementById('ngModCheckbox').checked = originalCheckboxState.ngModChecked;
    document.getElementById('mapTierCheckbox').checked = originalCheckboxState.mapTierChecked;
    document.getElementById('normalCheckbox').checked = originalCheckboxState.normalChecked;
    document.getElementById('magicCheckbox').checked = originalCheckboxState.magicChecked;
    document.getElementById('rareCheckbox').checked = originalCheckboxState.rareChecked;

    const originalSearchModeRadio = document.querySelector(`input[name="searchMode"][value="${originalSearchMode || 'any'}"]`);
    if (originalSearchModeRadio) originalSearchModeRadio.checked = true;

    updateCombinedRegex();
  }
}

function createSortableProfileCard(name, profile, type, tabId) {
  const card = createProfileCard(name, profile, type, tabId);
  card.draggable = true;
  card.style.cursor = 'grab';
  card.dataset.profileName = name;
  card.dataset.profileType = type;
  card.dataset.timestamp = profile.timestamp || Date.now();
  
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
  if (summary) titleArea.appendChild(summarySpan);
  
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
    const modCount = (profile.mods || []).length;
    if (modCount > 0) parts.push(`${modCount}個のMod`);
    const settings = profile.settings || {};
    if (settings.itemQuantity) parts.push(`数量${settings.itemQuantity}%`);
    if (settings.packSize) parts.push(`パック${settings.packSize}%`);
  } else if (type === 'flask') {
    const modCount = (profile.mods || []).length;
    if (modCount > 0) parts.push(`${modCount}個のMod`);
    if (profile.flaskType) {
      const typeNames = { utility: 'ユーティリティ', life: 'ライフ', mana: 'マナ', hybrid: 'ハイブリッド' };
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

  if (type === 'map') {
    const settings = profile.settings || {};
    if (Object.keys(settings).length > 0) {
      const settingsDiv = document.createElement('div');
      settingsDiv.style.cssText = 'margin-bottom: 12px;';
      const rows = [];
      if (settings.itemQuantity) rows.push(createDetailRow('数量', `${settings.itemQuantity}%`));
      if (settings.packSize) rows.push(createDetailRow('パックサイズ', `${settings.packSize}%`));
      if (settings.rarity) rows.push(createDetailRow('レアリティ', `${settings.rarity}%`));
      if (settings.scarab) rows.push(createDetailRow('スカラベ', `${settings.scarab}%`));
      if (settings.currency) rows.push(createDetailRow('カレンシー', `${settings.currency}%`));
      if (settings.map) rows.push(createDetailRow('マップ', `${settings.map}%`));
      const rarities = [];
      if (settings.rarities?.normal) rarities.push('ノーマル');
      if (settings.rarities?.magic) rarities.push('マジック');
      if (settings.rarities?.rare) rarities.push('レア');
      if (rarities.length > 0) rows.push(createDetailRow('レアリティフィルタ', rarities.join(', ')));
      if (settings.searchMode) {
        rows.push(createDetailRow('検索モード', settings.searchMode === 'all' ? '全て値以上' : 'どれか'));
      }
      const options = [];
      if (settings.ngModChecked) options.push('NG mod');
      if (settings.mapTierChecked) options.push('T17 mod');
      if (options.length > 0) rows.push(createDetailRow('オプション', options.join(', ')));
      rows.forEach(row => settingsDiv.appendChild(row));
      if (rows.length > 0) container.appendChild(settingsDiv);
    }
    if (profile.mods && profile.mods.length > 0) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      profile.mods.forEach(modKey => {
        const mod = ModList[modKey];
        if (mod) {
          const modItem = document.createElement('div');
          modItem.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid ${mod.tier > 750 ? '#ed4c4c' : mod.tier > 500 ? '#F87171' : '#FCA5A5'};
          `;
          modItem.innerHTML = `
            <div style="color: #FFF; font-size: 0.8em; margin-bottom: 2px;">${mod.mod}</div>
            <div style="color: #888; font-size: 0.7em;">${mod.engMod}</div>
          `;
          modList.appendChild(modItem);
        }
      });
      container.appendChild(modList);
    }
  } else if (type === 'flask') {
    if (profile.flaskType) {
      const typeNames = { utility: 'ユーティリティフラスコ', life: 'ライフフラスコ', mana: 'マナフラスコ', hybrid: 'ハイブリッドフラスコ' };
      const typeRow = createDetailRow('タイプ', typeNames[profile.flaskType] || profile.flaskType);
      container.appendChild(typeRow);
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height: 8px;';
      container.appendChild(spacer);
    }
    if (profile.mods && profile.mods.length > 0) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      let flaskModsData = [];
      try {
        if (window.rawFlaskMods && window.rawFlaskMods.length > 0) {
          flaskModsData = window.rawFlaskMods;
        } else if (window.flaskModsData) {
          flaskModsData = window.flaskModsData;
        } else {
          const flaskData = localStorage.getItem('flaskModsData');
          if (flaskData) flaskModsData = JSON.parse(flaskData);
        }
      } catch (e) {
        console.error('フラスコMODデータの取得エラー:', e);
      }
      profile.mods.forEach(modName => {
        let displayText = modName;
        if (flaskModsData.length > 0) {
          const mod = flaskModsData.find(m => m.name === modName);
          if (mod) displayText = `${mod.name}　${mod.text}`;
        }
        const modItem = document.createElement('div');
        modItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid #9B59B6;
          color: #FFF;
          font-size: 0.8em;
        `;
        modItem.textContent = displayText;
        modList.appendChild(modItem);
      });
      container.appendChild(modList);
    }
  } else if (type === 'item') {
    if (profile.itemType) {
      const typeRow = createDetailRow('タイプ', profile.itemType);
      container.appendChild(typeRow);
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height: 8px;';
      container.appendChild(spacer);
    }
    if (profile.mods && profile.mods.length > 0) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      let itemModsData = [];
      try {
        if (window.rawItemMods && window.rawItemMods.length > 0) {
          itemModsData = window.rawItemMods;
        } else if (window.itemModsData) {
          itemModsData = window.itemModsData;
        } else {
          const itemData = localStorage.getItem('itemModsData');
          if (itemData) itemModsData = JSON.parse(itemData);
        }
      } catch (e) {
        console.error('アイテムMODデータの取得エラー:', e);
      }
      profile.mods.forEach(modName => {
        let displayText = modName;
        if (itemModsData.length > 0) {
          const mod = itemModsData.find(m => m.name === modName);
          if (mod) displayText = `${mod.name}　${mod.text}`;
        }
        const modItem = document.createElement('div');
        modItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid #3498DB;
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
      colorTitle.textContent = 'カラー設定:';
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

    // 除外武器種の表示を追加
    const enabledExcludeWeapons = Object.entries(settings.excludeWeapons || {})
      .filter(([key, value]) => value)
      .map(([key]) => key);
    if (enabledExcludeWeapons.length > 0) {
      const weaponNames = {
        claw: '鉤爪', dagger: '短剣', wand: 'ワンド', oneHandSword: '片手剣',
        thrustingSword: '刺突剣', oneHandAxe: '片手斧', oneHandMace: '片手メイス',
        sceptre: 'セプター', runeDagger: 'ルーンの短剣', bow: '弓', staff: 'スタッフ',
        twoHandSword: '両手剣', twoHandAxe: '両手斧', twoHandMace: '両手メイス',
        warstaff: 'ウォースタッフ', shield: '盾'
      };
      const excludeWeaponDisplayNames = enabledExcludeWeapons.map(weapon => weaponNames[weapon] || weapon);
      container.appendChild(createDetailRow('除外武器ベース', excludeWeaponDisplayNames.join(', ')));
    }

    const linkSettings = [];
    if (settings.anyThreeLink) linkSettings.push('3リンク');
    if (settings.anyFourLink) linkSettings.push('4リンク');
    if (settings.anyFiveLink) linkSettings.push('5リンク');
    if (settings.anySixLink) linkSettings.push('6リンク');
    if (settings.anySixSocket) linkSettings.push('6ソケット');
    if (linkSettings.length > 0) container.appendChild(createDetailRow('リンク設定', linkSettings.join(', ')));
    const movementSettings = [];
    if (settings.movement?.ten) movementSettings.push('10%');
    if (settings.movement?.fifteen) movementSettings.push('15%');
    if (settings.movement?.twenty) movementSettings.push('20%');
    if (settings.movement?.twentyfive) movementSettings.push('25%');
    if (settings.movement?.thirty) movementSettings.push('30%');
    if (movementSettings.length > 0) container.appendChild(createDetailRow('移動速度', movementSettings.join(', ')));
    const enabledWeapons = Object.entries(settings.weapon || {})
      .filter(([key, value]) => value)
      .map(([key]) => key);
    if (enabledWeapons.length > 0) {
      const weaponNames = {
        claw: '鉤爪', dagger: '短剣', wand: 'ワンド', oneHandSword: '片手剣',
        thrustingSword: '刺突剣', oneHandAxe: '片手斧', oneHandMace: '片手メイス',
        sceptre: 'セプター', runeDagger: 'ルーンの短剣', bow: '弓', staff: 'スタッフ',
        twoHandSword: '両手剣', twoHandAxe: '両手斧', twoHandMace: '両手メイス', warstaff: 'ウォースタッフ'
      };
      const weaponDisplayNames = enabledWeapons.map(weapon => weaponNames[weapon] || weapon);
      container.appendChild(createDetailRow('武器ベース', weaponDisplayNames.join(', ')));
    }
    const selectedGems = settings.selectedGems || [];
    if (selectedGems.length > 0) {
      const gemList = document.createElement('div');
      gemList.style.cssText = 'margin-top: 12px;';
      const gemTitle = document.createElement('div');
      gemTitle.textContent = '選択されたジェム:';
      gemTitle.style.cssText = 'color: #AAA; font-size: 0.8em; margin-bottom: 8px;';
      gemList.appendChild(gemTitle);
      selectedGems.forEach(gemRegex => {
        const gemItem = document.createElement('div');
        gemItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid #F39C12;
          color: #FFF;
          font-size: 0.8em;
          margin-bottom: 4px;
          word-break: break-word;
        `;
        let displayName = gemRegex;
        if (profile.gemInfo) {
          const gemInfo = profile.gemInfo.find(g => g.regex === gemRegex);
          if (gemInfo && gemInfo.display_name) displayName = gemInfo.display_name;
        }
        if (displayName === gemRegex && profile.gemDisplayNames) {
          const gemDisplayInfo = profile.gemDisplayNames.find(g => g.regex === gemRegex);
          if (gemDisplayInfo && gemDisplayInfo.displayName) displayName = gemDisplayInfo.displayName;
        }
        if (displayName === gemRegex && typeof window.getGemDisplayName === 'function') {
          displayName = window.getGemDisplayName(gemRegex);
        }
        gemItem.textContent = displayName;
        if (displayName !== gemRegex) gemItem.title = `Regex: ${gemRegex}`;
        gemList.appendChild(gemItem);
      });
      container.appendChild(gemList);
    }
  } else if (type === 'beast') {
    if (profile.beasts && profile.beasts.length > 0) {
      const beastList = document.createElement('div');
      beastList.style.cssText = 'display: grid; gap: 4px;';
      profile.beasts.forEach(beastName => {
        const beast = beastlist && beastlist[beastName];
        if (beast) {
          const beastItem = document.createElement('div');
          beastItem.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid #1ABC9C;
            color: #FFF;
            font-size: 0.8em;
          `;
          beastItem.innerHTML = `
            <div style="color: #FFF; font-size: 0.8em; margin-bottom: 2px;">${beastName}</div>
            <div style="color: #888; font-size: 0.7em;">${beast.family || ''} - ${beast.effect || ''}</div>
          `;
          beastList.appendChild(beastItem);
        } else {
          const unknownItem = document.createElement('div');
          unknownItem.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid #1ABC9C;
            color: #FFF;
            font-size: 0.8em;
          `;
          unknownItem.textContent = beastName;
          beastList.appendChild(unknownItem);
        }
      });
      container.appendChild(beastList);
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
  console.log(`Loading saved profile: ${name}, type: ${type}, tab: ${tabId}`);
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
      } else if (type === 'flask') {
        document.getElementById('flaskProfileList').value = name;
        loadFlaskProfile();
      } else if (type === 'item') {
        document.getElementById('itemProfileList').value = name;
        loadItemProfile();
      } else if (type === 'beast') {
        document.getElementById('beastProfileList').value = name;
        loadBeastProfile();
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
  const savedOrder = localStorage.getItem('savedRegexOrder');
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
  localStorage.setItem('savedRegexOrder', JSON.stringify(order));
}

function removeProfileFromOrder(profileName, type) {
  const savedOrder = localStorage.getItem('savedRegexOrder');
  if (!savedOrder) return;
  
  try {
    let order = JSON.parse(savedOrder);
    order = order.filter(item => !(item.name === profileName && item.type === type));
    localStorage.setItem('savedRegexOrder', JSON.stringify(order));
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

  try {
    const profiles = JSON.parse(localStorage.getItem(storageKey) || '{}');
    delete profiles[name];
    localStorage.setItem(storageKey, JSON.stringify(profiles));

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
    <option value="flask">フラスコ</option>
    <option value="item">アイテム</option>
    <option value="vendor">ベンダー</option>
    <option value="beast">ビースト</option>
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
  
  localStorage.setItem('savedRegexOrder', JSON.stringify(order));
}

function restoreSortOrder(allProfiles) {
  const savedOrder = localStorage.getItem('savedRegexOrder');
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
    localStorage.removeItem('savedRegexOrder');
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
          const profiles = JSON.parse(localStorage.getItem('poeProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('poeProfiles', JSON.stringify(profiles));
          
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

  const originalFlaskSave = window.saveFlaskProfile;
  if (originalFlaskSave && typeof originalFlaskSave === 'function' && !originalFlaskSave._hooked) {
    window.saveFlaskProfile = function() {
      const profileName = document.getElementById('flaskProfileName')?.value.trim() || '';
      originalFlaskSave.apply(this, arguments);
      setTimeout(() => {
        try {
          const profiles = JSON.parse(localStorage.getItem('flaskProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('flaskProfiles', JSON.stringify(profiles));
          
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
      const profileName = document.getElementById('itemProfileName')?.value.trim() || '';
      originalItemSave.apply(this, arguments);
      setTimeout(() => {
        try {
          const profiles = JSON.parse(localStorage.getItem('itemProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('itemProfiles', JSON.stringify(profiles));
          
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
      const profileName = document.getElementById('vendorProfileName')?.value.trim() || '';
      originalVendorSave.apply(this, arguments);
      setTimeout(() => {
        try {
          const profiles = JSON.parse(localStorage.getItem('vendorProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('vendorProfiles', JSON.stringify(profiles));
          
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
      const profileName = document.getElementById('beastProfileName')?.value.trim() || '';
      originalBeastSave.apply(this, arguments);
      setTimeout(() => {
        try {
          const profiles = JSON.parse(localStorage.getItem('beastProfiles') || '{}');
          Object.keys(profiles).forEach(key => {
            if (!profiles[key].timestamp) profiles[key].timestamp = Date.now();
          });
          localStorage.setItem('beastProfiles', JSON.stringify(profiles));
          
          if (profileName) addProfileToTop(profileName, 'beast');
          updateSavedRegexDisplay();
        } catch (e) {
          console.error('タイムスタンプ追加エラー:', e);
        }
      }, 100);
    };
    window.saveBeastProfile._hooked = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTabLink = document.querySelector('a[data-tab="savedContent"]');
  if (savedTabLink) {
    savedTabLink.addEventListener('click', () => {
      resetFilterControls();
      try {
        const flaskData = localStorage.getItem('flaskModsData');
        if (flaskData) window.rawFlaskMods = JSON.parse(flaskData);
        const itemData = localStorage.getItem('itemModsData');
        if (itemData) window.rawItemMods = JSON.parse(itemData);
      } catch (e) {
        console.error('MODデータ復元エラー:', e);
      }
      
      // コンテナを非表示にしてから更新
      const container = document.getElementById('savedRegexList');
      if (container) {
        container.style.opacity = '0';
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
      container.style.opacity = '0';
    }
    
    setTimeout(() => {
      updateSavedRegexDisplay();
      addFilterControls(); // 必ずフィルターコントロールを追加
    }, 200);
  }

  setTimeout(() => {
    hookSaveProfiles();
  }, 1000);
});

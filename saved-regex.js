// 並び替え機能の変数
let isDragging = false;
let dragStartIndex = -1;
let dragEndIndex = -1;

// 保存済みRegexの表示を更新
function updateSavedRegexDisplay() {
  const container = document.getElementById('savedRegexList');
  if (!container) return;

  // 全プロファイルを取得
  const allProfiles = getAllProfiles();

  // プロファイルが1つもない場合
  if (allProfiles.length === 0) {
    container.innerHTML = `
      <div style="color: #888; text-align: center; padding: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 10px;">保存されたRegexがありません</p>
        <p style="font-size: 0.85em;">各タブでプロファイルを保存すると、ここに表示されます</p>
      </div>
    `;
    return;
  }

  // 並び順を復元
  const sortedProfiles = restoreSortOrder(allProfiles);

  container.innerHTML = '';

  // プロファイルカードを作成
  const cardsContainer = document.createElement('div');
  cardsContainer.id = 'savedRegexCards';
  
  sortedProfiles.forEach(item => {
    const card = createSortableProfileCard(item.name, item.profile, item.type, item.tabId);
    cardsContainer.appendChild(card);
  });
  
  container.appendChild(cardsContainer);

  // ドラッグ＆ドロップを有効化
  makeSortable();
}

// 全プロファイルを取得
function getAllProfiles() {
  const allProfiles = [];
  
  // マップ
  const mapProfiles = JSON.parse(localStorage.getItem('poeProfiles') || '{}');
  Object.entries(mapProfiles).forEach(([name, profile]) => {
    allProfiles.push({
      name,
      profile,
      type: 'map',
      tabId: 'mapContent',
      timestamp: profile.timestamp || 0
    });
  });
  
  // フラスコ
  const flaskProfiles = JSON.parse(localStorage.getItem('flaskProfiles') || '{}');
  Object.entries(flaskProfiles).forEach(([name, profile]) => {
    allProfiles.push({
      name,
      profile,
      type: 'flask',
      tabId: 'flaskContent',
      timestamp: profile.timestamp || 0
    });
  });
  
  // アイテム
  const itemProfiles = JSON.parse(localStorage.getItem('itemProfiles') || '{}');
  Object.entries(itemProfiles).forEach(([name, profile]) => {
    allProfiles.push({
      name,
      profile,
      type: 'item',
      tabId: 'itemContent',
      timestamp: profile.timestamp || 0
    });
  });

  return allProfiles;
}

// タイプ別の設定
const typeConfig = {
  map: {
    label: 'マップ',
    color: '#E74C3C',
    icon: ''
  },
  flask: {
    label: 'フラスコ',
    color: '#9B59B6',
    icon: ''
  },
  item: {
    label: 'アイテム',
    color: '#3498DB',
    icon: ''
  }
};

// 並び替え可能なプロファイルカードを作成
function createSortableProfileCard(name, profile, type, tabId) {
  const card = createProfileCard(name, profile, type, tabId);
  
  // ドラッグ可能にする
  card.draggable = true;
  card.style.cursor = 'grab';
  
  // 並び順の保存に必要なデータ属性を追加
  card.dataset.profileName = name;
  card.dataset.profileType = type;
  
  const title = card.querySelector('.profile-card-title') || card.querySelector('.title-area span:nth-child(2)');
  if (title) {
    title.classList.add('profile-card-title');
  }
  
  const typeLabel = card.querySelector('.profile-card-type');
  if (!typeLabel) {
    // タイプリベルがなければ作成
    const typeSpan = document.createElement('span');
    typeSpan.className = 'profile-card-type';
    typeSpan.textContent = type;
    typeSpan.style.display = 'none'; // 非表示
    card.appendChild(typeSpan);
  }
  
  // ドラッグ中のスタイル
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

// プロファイルカードを作成
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

  // ホバーエフェクト
  card.addEventListener('mouseenter', () => {
    card.style.background = '#333';
    card.style.borderColor = config.color;
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '#2a2a2a';
    card.style.borderColor = '#444';
    card.style.borderLeftColor = config.color;
  });

  // カード全体のクリックイベント - コピー機能
  card.addEventListener('click', (e) => {
    // ボタンがクリックされた場合はコピーしない
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    
    const regex = generateRegexFromProfile(profile, type);
    if (regex && regex !== '(空のRegex)') {
      navigator.clipboard.writeText(regex).then(() => {
        // コピー成功時のフィードバック（ポップアップ通知）
        showNotification('コピーしました！');
        
        // カードにも軽いフィードバック（背景色の変化のみ）
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
        // コピー失敗時のフィードバック
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

  // カードヘッダー
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
  
  // 詳細情報(簡易版)をタイトル横に配置
  const summary = createProfileSummary(profile, type);
  const summarySpan = document.createElement('span');
  summarySpan.style.cssText = 'color: #888; font-size: 0.7em; margin-left: auto;';
  summarySpan.textContent = summary;
  
  titleArea.appendChild(typeLabel);
  titleArea.appendChild(title);
  if (summary) {
    titleArea.appendChild(summarySpan);
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
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    deleteSavedProfile(name, type);
  });
  
  header.appendChild(titleArea);
  header.appendChild(deleteBtn);
  card.appendChild(header);

  // Regexとボタンを横並び
  const regexRow = document.createElement('div');
  regexRow.style.cssText = 'display: flex; gap: 6px; align-items: center;';

  // Regex表示
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

  // アクションボタン
  const actions = document.createElement('div');
  actions.style.cssText = 'display: flex; gap: 4px; flex-shrink: 0;';

  const copyBtn = createActionButton('コピー', '#3498db', (e) => {
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    navigator.clipboard.writeText(regex).then(() => {
      showNotification('コピーしました！');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓';
      setTimeout(() => copyBtn.textContent = originalText, 1500);
    });
  }, 'コピー');

  const detailBtn = createActionButton('詳細', '#9b59b6', (e) => {
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    toggleProfileDetails(card, profile, type, config.color);
  }, '詳細');

  const loadBtn = createActionButton('読み込み', '#4CAF50', (e) => {
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    loadSavedProfile(name, type, tabId);
  }, '読み込み');

  actions.appendChild(copyBtn);
  actions.appendChild(detailBtn);
  actions.appendChild(loadBtn);

  regexRow.appendChild(regexDiv);
  regexRow.appendChild(actions);
  card.appendChild(regexRow);

  // 詳細表示用の隠しコンテナを作成
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

// アクションボタンを作成
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
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    onClick(e);
  });
  return btn;
}

// プロファイル概要を作成
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
  }

  return parts.length > 0 ? parts.join(' | ') : '';
}

// 詳細表示をトグル(アコーディオン形式)
function toggleProfileDetails(card, profile, type, themeColor) {
  const detailsContainer = card.querySelector('.details-container');
  
  // 既に展開されている場合は閉じる
  if (detailsContainer.style.maxHeight && detailsContainer.style.maxHeight !== '0px') {
    detailsContainer.style.maxHeight = '0';
    detailsContainer.style.marginTop = '0';
    return;
  }

  // 詳細コンテンツを生成
  detailsContainer.innerHTML = '';
  const detailsContent = createDetailedView(profile, type);
  detailsContainer.appendChild(detailsContent);

  // 展開アニメーション
  detailsContainer.style.marginTop = '8px';
  detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
}

// 詳細ビューを作成(修正版)
function createDetailedView(profile, type) {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 10px; background: #1e1e1e; border-radius: 4px;';

  if (type === 'map') {
    // 設定値
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
      if (rarities.length > 0) {
        rows.push(createDetailRow('レアリティフィルタ', rarities.join(', ')));
      }
      
      if (settings.searchMode) {
        rows.push(createDetailRow('検索モード', settings.searchMode === 'all' ? '全て値以上' : 'どれか'));
      }
      
      const options = [];
      if (settings.ngModChecked) options.push('NG mod');
      if (settings.mapTierChecked) options.push('T17 mod');
      if (options.length > 0) {
        rows.push(createDetailRow('オプション', options.join(', ')));
      }
      
      rows.forEach(row => settingsDiv.appendChild(row));
      if (rows.length > 0) container.appendChild(settingsDiv);
    }
    
    // 選択されたMod
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
    // フラスコタイプ
    if (profile.flaskType) {
      const typeNames = {
        utility: 'ユーティリティフラスコ',
        life: 'ライフフラスコ',
        mana: 'マナフラスコ',
        hybrid: 'ハイブリッドフラスコ'
      };
      const typeRow = createDetailRow('タイプ', typeNames[profile.flaskType] || profile.flaskType);
      container.appendChild(typeRow);
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height: 8px;';
      container.appendChild(spacer);
    }
    
    // 選択されたMod - 修正箇所
    if (profile.mods && profile.mods.length > 0) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      
      // フラスコのMODデータを取得（flask.jsから直接取得を試みる）
      let flaskModsData = [];
      try {
        // 複数の可能性のあるソースからMODデータを取得
        if (window.rawFlaskMods && window.rawFlaskMods.length > 0) {
          flaskModsData = window.rawFlaskMods;
        } else if (window.flaskModsData) {
          flaskModsData = window.flaskModsData;
        } else {
          // ローカルストレージから読み込む
          const flaskData = localStorage.getItem('flaskModsData');
          if (flaskData) {
            flaskModsData = JSON.parse(flaskData);
          }
        }
      } catch (e) {
        console.error('フラスコMODデータの取得エラー:', e);
      }
      
      profile.mods.forEach(modName => {
        // MODデータから該当するMODを検索
        let displayText = modName;
        if (flaskModsData.length > 0) {
          const mod = flaskModsData.find(m => m.name === modName);
          if (mod) {
            displayText = `${mod.name}　${mod.text}`;
          }
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
    // アイテムタイプ
    if (profile.itemType) {
      const typeRow = createDetailRow('タイプ', profile.itemType);
      container.appendChild(typeRow);
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height: 8px;';
      container.appendChild(spacer);
    }
    
    // 選択されたMod - 修正箇所
    if (profile.mods && profile.mods.length > 0) {
      const modList = document.createElement('div');
      modList.style.cssText = 'display: grid; gap: 4px;';
      
      // アイテムのMODデータを取得（item.jsから直接取得を試みる）
      let itemModsData = [];
      try {
        // 複数の可能性のあるソースからMODデータを取得
        if (window.rawItemMods && window.rawItemMods.length > 0) {
          itemModsData = window.rawItemMods;
        } else if (window.itemModsData) {
          itemModsData = window.itemModsData;
        } else {
          // ローカルストレージから読み込む
          const itemData = localStorage.getItem('itemModsData');
          if (itemData) {
            itemModsData = JSON.parse(itemData);
          }
        }
      } catch (e) {
        console.error('アイテムMODデータの取得エラー:', e);
      }
      
      profile.mods.forEach(modName => {
        // MODデータから該当するMODを検索
        let displayText = modName;
        if (itemModsData.length > 0) {
          const mod = itemModsData.find(m => m.name === modName);
          if (mod) {
            displayText = `${mod.name}　${mod.text}`;
          }
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
  }

  return container;
}

// 詳細行を作成
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

// プロファイルからRegexを生成（修正版 - scripts.jsの関数を直接使用）
function generateRegexFromProfile(profile, type) {
  if (type === 'map') {
    return generateMapRegexFromProfile(profile);
  } else if (type === 'flask' || type === 'item') {
    return (profile.mods || []).join('|');
  }
  return '';
}

// マッププロファイルから完全なRegexを生成（scripts.jsの関数を直接使用）
function generateMapRegexFromProfile(profile) {
  // 現在の状態を一時保存
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
    // プロファイルの状態を一時的に設定
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

    // 検索モードを設定
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${profile.settings.searchMode || 'any'}"]`);
    if (searchModeRadio) {
      searchModeRadio.checked = true;
    }

    // scripts.jsのupdateCombinedRegex関数を呼び出してRegexを生成
    updateCombinedRegex();
    
    // 生成されたRegexを取得
    const regex = document.getElementById('combinedRegexOutput').textContent;
    return regex || '(空のRegex)';

  } finally {
    // 元の状態に復元
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

    // 検索モードを復元
    const originalSearchModeRadio = document.querySelector(`input[name="searchMode"][value="${originalSearchMode || 'any'}"]`);
    if (originalSearchModeRadio) {
      originalSearchModeRadio.checked = true;
    }

    // UIを更新
    updateCombinedRegex();
  }
}

// 保存済みプロファイルを読み込み
function loadSavedProfile(name, type, tabId) {
  switchTab(tabId);
  
  setTimeout(() => {
    if (type === 'map') {
      document.getElementById('profileList').value = name;
      loadProfile();
    } else if (type === 'flask') {
      document.getElementById('flaskProfileList').value = name;
      loadFlaskProfile();
    } else if (type === 'item') {
      document.getElementById('itemProfileList').value = name;
      loadItemProfile();
    }
    
    alert(`"${name}" を読み込みました`);
  }, 300);
}

// 保存済みプロファイルを削除
function deleteSavedProfile(name, type) {
  if (!confirm(`"${name}" を削除しますか?\nこの操作は元に戻せません。`)) return;

  let storageKey = '';
  if (type === 'map') storageKey = 'poeProfiles';
  else if (type === 'flask') storageKey = 'flaskProfiles';
  else if (type === 'item') storageKey = 'itemProfiles';

  const profiles = JSON.parse(localStorage.getItem(storageKey) || '{}');
  delete profiles[name];
  localStorage.setItem(storageKey, JSON.stringify(profiles));

  if (type === 'map') {
    window.profiles = profiles;
    updateProfileList();
  } else if (type === 'flask') {
    window.flaskProfiles = profiles;
    updateFlaskProfileList();
  } else if (type === 'item') {
    window.itemProfiles = profiles;
    updateItemProfileList();
  }

  updateSavedRegexDisplay();
  alert(`"${name}" を削除しました`);
}

// 検索機能
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

  // 検索結果なしメッセージ
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

// 通知用のスタイルと要素を作成
function createNotificationSystem() {
  // 通知コンテナのスタイルを追加
  const style = document.createElement('style');
  style.textContent = `
    .notification-container {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .notification {
      background: #2d5a2d;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 1px solid #4CAF50;
      animation: slideUp 0.3s ease forwards;
      opacity: 0;
      white-space: nowrap;
      transition: opacity 0.3s ease;
    }
    
    .notification.error {
      background: #5a2d2d;
      border-color: #e74c3c;
    }
    
    .notification.fade-out {
      opacity: 0;
    }
    
    @keyframes slideUp {
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
  
  // 通知コンテナを作成
  const container = document.createElement('div');
  container.className = 'notification-container';
  document.body.appendChild(container);
  
  return container;
}

// 通知を表示する関数
function showNotification(message, isError = false) {
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = createNotificationSystem();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : ''}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // 表示時間を3秒に延長
  setTimeout(() => {
    notification.classList.add('fade-out');
    
    // フェードアウト後に要素を削除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000); // 3秒間表示
}

// 並び替え機能
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

// ドラッグ開始
function handleDragStart(e) {
  if (!e.target.classList.contains('profile-card')) return;
  
  isDragging = true;
  dragStartIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
}

// ドラッグオーバー
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

// ドラッグエンター
function handleDragEnter(e) {
  e.preventDefault();
  const card = e.target.closest('.profile-card');
  if (card && card !== document.querySelector('.dragging')) {
    card.classList.add('drag-over');
  }
}

// ドラッグリーブ
function handleDragLeave(e) {
  const card = e.target.closest('.profile-card');
  if (card) {
    card.classList.remove('drag-over');
  }
}

// ドロップ
function handleDrop(e) {
  e.preventDefault();
  const container = document.getElementById('savedRegexCards');
  const draggingCard = document.querySelector('.dragging');
  const cards = Array.from(container.querySelectorAll('.profile-card:not(.dragging)'));
  
  let closestCard = null;
  let closestOffset = Number.NEGATIVE_INFINITY;
  
  // 最も近いカードを探す
  cards.forEach(card => {
    const box = card.getBoundingClientRect();
    const offset = e.clientY - box.top - box.height / 2;
    
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closestCard = card;
    }
  });
  
  if (closestCard) {
    container.insertBefore(draggingCard, closestCard);
  } else {
    container.appendChild(draggingCard);
  }
  
  dragEndIndex = Array.from(container.children).indexOf(draggingCard);
  
  // 並び順を保存
  saveSortOrder();
  
  return false;
}

// ドラッグ終了
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

// 並び順を保存 - 修正版
function saveSortOrder() {
  const container = document.getElementById('savedRegexCards');
  if (!container) return;
  
  const cards = Array.from(container.querySelectorAll('.profile-card'));
  const order = cards.map(card => {
    return {
      name: card.dataset.profileName,
      type: card.dataset.profileType
    };
  });
  
  localStorage.setItem('savedRegexOrder', JSON.stringify(order));
  console.log('並び順を保存しました:', order);
}

// 並び順を復元 - 修正版
function restoreSortOrder(allProfiles) {
  const savedOrder = localStorage.getItem('savedRegexOrder');
  if (!savedOrder) return allProfiles;
  
  try {
    const order = JSON.parse(savedOrder);
    const orderedProfiles = [];
    const remainingProfiles = [...allProfiles];
    
    // 保存された順序に従って並び替え
    order.forEach(item => {
      const index = remainingProfiles.findIndex(profile => 
        profile.name === item.name && profile.type === item.type
      );
      if (index !== -1) {
        orderedProfiles.push(remainingProfiles[index]);
        remainingProfiles.splice(index, 1);
      }
    });
    
    // 残ったプロファイル（新規追加など）を末尾に追加
    const result = [...orderedProfiles, ...remainingProfiles];
    console.log('並び順を復元しました:', result);
    return result;
  } catch (e) {
    console.error('並び順の復元エラー:', e);
    return allProfiles;
  }
}

// 並び順をリセット
function resetSortOrder() {
  if (confirm('並び順をリセットしますか？')) {
    localStorage.removeItem('savedRegexOrder');
    updateSavedRegexDisplay();
  }
}

// 並び替え用のスタイルを追加
function addSortableStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .profile-card.dragging {
      opacity: 0.5;
      cursor: grabbing !important;
    }
    
    .profile-card.drag-over {
      border-top: 2px solid #4CAF50;
      margin-top: 10px;
    }
    
    .profile-card {
      transition: all 0.2s ease;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// 既存の保存関数にタイムスタンプを追加するためのフック
function hookSaveProfiles() {
  // マップ用の保存後フック
  const originalMapSave = window.saveProfile;
  if (originalMapSave && typeof originalMapSave === 'function') {
    if (!originalMapSave._hooked) {
      window.saveProfile = function() {
        originalMapSave.apply(this, arguments);
        
        setTimeout(() => {
          try {
            const profiles = JSON.parse(localStorage.getItem('poeProfiles') || '{}');
            Object.keys(profiles).forEach(key => {
              if (!profiles[key].timestamp) {
                profiles[key].timestamp = Date.now();
              }
            });
            localStorage.setItem('poeProfiles', JSON.stringify(profiles));
            updateSavedRegexDisplay();
          } catch (e) {
            console.error('タイムスタンプ追加エラー:', e);
          }
        }, 100);
      };
      window.saveProfile._hooked = true;
    }
  }

  // フラスコ用の保存後フック
  const originalFlaskSave = window.saveFlaskProfile;
  if (originalFlaskSave && typeof originalFlaskSave === 'function') {
    if (!originalFlaskSave._hooked) {
      window.saveFlaskProfile = function() {
        originalFlaskSave.apply(this, arguments);
        
        setTimeout(() => {
          try {
            const profiles = JSON.parse(localStorage.getItem('flaskProfiles') || '{}');
            Object.keys(profiles).forEach(key => {
              if (!profiles[key].timestamp) {
                profiles[key].timestamp = Date.now();
              }
            });
            localStorage.setItem('flaskProfiles', JSON.stringify(profiles));
            updateSavedRegexDisplay();
          } catch (e) {
            console.error('タイムスタンプ追加エラー:', e);
          }
        }, 100);
      };
      window.saveFlaskProfile._hooked = true;
    }
  }

  // アイテム用の保存後フック
  const originalItemSave = window.saveItemProfile;
  if (originalItemSave && typeof originalItemSave === 'function') {
    if (!originalItemSave._hooked) {
      window.saveItemProfile = function() {
        originalItemSave.apply(this, arguments);
        
        setTimeout(() => {
          try {
            const profiles = JSON.parse(localStorage.getItem('itemProfiles') || '{}');
            Object.keys(profiles).forEach(key => {
              if (!profiles[key].timestamp) {
                profiles[key].timestamp = Date.now();
              }
            });
            localStorage.setItem('itemProfiles', JSON.stringify(profiles));
            updateSavedRegexDisplay();
          } catch (e) {
            console.error('タイムスタンプ追加エラー:', e);
          }
        }, 100);
      };
      window.saveItemProfile._hooked = true;
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  const savedTabLink = document.querySelector('a[data-tab="savedContent"]');
  if (savedTabLink) {
    savedTabLink.addEventListener('click', () => {
      // MODデータを復元
      try {
        const flaskData = localStorage.getItem('flaskModsData');
        if (flaskData) {
          window.rawFlaskMods = JSON.parse(flaskData);
        }
        const itemData = localStorage.getItem('itemModsData');
        if (itemData) {
          window.rawItemMods = JSON.parse(itemData);
        }
      } catch (e) {
        console.error('MODデータ復元エラー:', e);
      }
      
      setTimeout(() => {
        updateSavedRegexDisplay();
        addSortableStyles(); // 並び替えスタイルを追加
      }, 100);
    });
  }

  const searchBox = document.getElementById('savedRegexSearch');
  if (searchBox) {
    searchBox.addEventListener('input', filterSavedRegex);
  }

  if (window.location.hash === '#saved') {
    updateSavedRegexDisplay();
  }

  // 保存関数にフックを追加(遅延実行で確実に上書き)
  setTimeout(() => {
    hookSaveProfiles();
  }, 1000);
});
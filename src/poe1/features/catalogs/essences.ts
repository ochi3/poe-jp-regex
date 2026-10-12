const ESSENCE_TIERS = [
  { en: 'Deafening', ja: '慟哭', level: 1 },
  { en: 'Shrieking', ja: '喚き', level: 2 },
  { en: 'Screaming', ja: '叫び', level: 3 },
  { en: 'Wailing', ja: '呻き', level: 4 },
  { en: 'Weeping', ja: '嘆き', level: 5 },
  { en: 'Muttering', ja: '呟き', level: 6 },
  { en: 'Whispering', ja: '囁き', level: 7 },
];

function getEssenceTierInfo(data) {
  const engName = data?.engName || '';
  for (const tier of ESSENCE_TIERS) {
    if (engName.startsWith(tier.en + ' ')) {
      return { ...tier, label: String(tier.level), isSpecial: false };
    }
  }
  // ヒステリー等の上位エッセンス
  return { en: 'Special', ja: '特殊', level: 0, label: '特殊', isSpecial: true };
}

function getEssenceTierLabel(data) {
  return getEssenceTierInfo(data).label;
}

function renderessencelist() {
  const container = getElement('essencelistContainer');
  if (!container || typeof essencelist === 'undefined') return;
  container.innerHTML = '';
  
  let essences = Object.entries(essencelist);
  
  if (essenceSortColumn) {
    essences.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (essenceSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = getCatalogDisplayName(nameA, dataA);
          valueB = getCatalogDisplayName(nameB, dataB);
          break;
        case 'tier':
          valueA = getEssenceTierInfo(dataA).level;
          valueB = getEssenceTierInfo(dataB).level;
          break;
        default:
          return 0;
      }
      
      let comparison = 0;
      if (typeof valueA === 'number') {
        comparison = valueA - valueB;
      } else {
        comparison = valueA.localeCompare(valueB, currentLanguage === 'en' ? 'en' : 'ja');
      }
      
      return essenceSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  essences = essences.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  essences.forEach(([name, data]) => {
    const essenceItem = document.createElement('div');
    essenceItem.className = 'essence-item';
    essenceItem.dataset.jpName = name;
    essenceItem.dataset.engName = data.engName;
    const tierInfo = getEssenceTierInfo(data);
    essenceItem.dataset.tierJa = tierInfo.ja;
    essenceItem.dataset.tierEn = tierInfo.en;
    essenceItem.dataset.tierLabel = tierInfo.label;
    
    essenceItem.addEventListener('click', function(e) {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        const checkbox = essenceItem.querySelector<HTMLInputElement>('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = getCatalogDisplayName(name, data);
    const displayTier = getEssenceTierLabel(data);
    
    essenceItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="essence-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="beast-family essence-tier">${displayTier}</div>
    `;

    const checkbox = essenceItem.querySelector<HTMLInputElement>('input');
    checkbox.checked = checkedEssences.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedEssences.add(name);
      } else {
        checkedEssences.delete(name);
      }
      updateEssenceRegex();
      saveEssenceCheckboxState();
    });
    
    container.appendChild(essenceItem);
  });

  // 一番長い名前の幅に合わせて Tier をすぐ横に揃える
  syncEssenceNameColumnWidth();
}

function syncEssenceNameColumnWidth() {
  const table = document.querySelector<HTMLElement>('#essenceContent .essence-table-container');
  const container = getElement('essencelistContainer');
  // Hidden tabs cannot provide a meaningful name width; measure after opening.
  if (!table || !container || table.getClientRects().length === 0) return;

  table.style.removeProperty('--essence-name-width');

  const nameEls = container.querySelectorAll<HTMLElement>('.scarab-name');
  let maxWidth = 0;
  nameEls.forEach(el => {
    maxWidth = Math.max(maxWidth, el.scrollWidth);
  });

  const headerName = document.querySelector<HTMLElement>('#essenceContent .essence-header .beast-col-name');
  if (headerName) {
    maxWidth = Math.max(maxWidth, headerName.scrollWidth);
  }

  if (maxWidth > 0) {
    table.style.setProperty('--essence-name-width', `${Math.ceil(maxWidth)}px`);
  }
}

function sortEssences(column) {
  if (essenceSortColumn === column) {
    essenceSortDirection = essenceSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    essenceSortColumn = column;
    essenceSortDirection = 'asc';
  }
  updateEssenceSortIcons();
  renderessencelist();
}

function updateEssenceSortIcons() {
  const headers = document.querySelectorAll<HTMLElement>('#essenceContent .essence-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === essenceSortColumn) {
      header.innerHTML += essenceSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateEssenceRegex() {
  const selectedRegexes = Array.from(checkedEssences).map(name => {
    const item = essencelist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  getElement('essenceRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = getElement('essenceCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetEssenceSelection() {
  checkedEssences.clear();
  document.querySelectorAll<HTMLInputElement>('#essencelistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateEssenceRegex();
  saveEssenceCheckboxState();
}

function bulkSelectEssences() {
    const thresholdInput = getElement('essenceBulkThreshold');
    const thresholdMaxInput = getElement('essenceBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedEssences.clear();
    Object.entries(essencelist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedEssences.add(name);
            }
        }
    });

    renderessencelist();
    saveEssenceCheckboxState();
    updateEssenceRegex();
}

function copyEssenceRegex() {
  const regex = getElement('essenceRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterEssences() {
  const term = getElement('essenceSearch').value.toLowerCase();
  
  document.querySelectorAll<HTMLElement>('#essencelistContainer .essence-item').forEach(item => {
    const jpName = (item.dataset.jpName || '').toLowerCase();
    const engName = (item.dataset.engName || '').toLowerCase();
    const tierJa = (item.dataset.tierJa || '').toLowerCase();
    const tierEn = (item.dataset.tierEn || '').toLowerCase();
    const tierLabel = (item.dataset.tierLabel || '').toLowerCase();
    
    const match = 
      jpName.includes(term) || 
      engName.includes(term) || 
      tierJa.includes(term) ||
      tierEn.includes(term) ||
      tierLabel.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

function saveEssenceCheckboxState() {
  const state = Array.from(checkedEssences);
  writeStoredJson('essenceCheckboxState', state);
}

function loadEssenceCheckboxState() {
  const saved = readStoredText('essenceCheckboxState');
  if (saved) {
    try {
      checkedEssences = new Set(readStoredJson('essenceCheckboxState'));
    } catch (e) {
      console.error('essenceCheckboxState 読み込みエラー:', e);
      checkedEssences = new Set<string>();
    }
  }
}

function saveEssenceProfile() {
  const profileName = getElement('essenceProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (essenceProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  essenceProfiles[profileName] = {
    essences: Array.from(checkedEssences),
    timestamp: Date.now()
  };

  if (!writeStoredJson('essenceProfiles', essenceProfiles)) return false;
  updateEssenceProfileList();
  saveEssenceCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  getElement('essenceProfileName').value = '';
}

function loadEssenceProfile() {
  const profileName = getElement('essenceProfileList').value;
  if (!profileName || !essenceProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = essenceProfiles[profileName];
    checkedEssences.clear();
    profile.essences.forEach(essence => {
      if (essencelist[essence]) checkedEssences.add(essence);
    });
    getElement('essenceProfileName').value = profileName;
    renderessencelist();
    updateEssenceRegex();
    saveEssenceCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('エッセンスプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteEssenceProfile() {
  const profileName = getElement('essenceProfileList').value;
  if (!profileName || !essenceProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete essenceProfiles[profileName];
    if (!writeStoredJson('essenceProfiles', essenceProfiles)) return false;
    updateEssenceProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateEssenceProfileList() {
  const select = getElement('essenceProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(essenceProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

// --- タトゥー関連ロジック ---

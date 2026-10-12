function renderscarablist() {
  const container = getElement('scarablistContainer');
  if (!container || typeof scarablist === 'undefined') return;
  if (!container) return;
  container.innerHTML = '';
  
  let scarabs = Object.entries(scarablist);
  
  if (scarabSortColumn) {
    scarabs.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (scarabSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = getCatalogDisplayName(nameA, dataA);
          valueB = getCatalogDisplayName(nameB, dataB);
          break;
        case 'description':
          valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
          valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
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
      
      return scarabSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  scarabs = scarabs.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  scarabs.forEach(([name, data]) => {
    const scarabItem = document.createElement('div');
    scarabItem.className = 'scarab-item';
    scarabItem.dataset.engName = data.engName;
    
    scarabItem.addEventListener('click', function(e) {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        const checkbox = scarabItem.querySelector<HTMLInputElement>('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = getCatalogDisplayName(name, data);
    const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
    
    scarabItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="scarab-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div style="width: 0; padding: 0; visibility: hidden;"></div>
      <div class="scarab-effect">${displayDesc}</div>
    `;

    const checkbox = scarabItem.querySelector<HTMLInputElement>('input');
    checkbox.checked = checkedScarabs.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedScarabs.add(name);
      } else {
        checkedScarabs.delete(name);
      }
      updateScarabRegex();
      saveScarabCheckboxState();
    });
    
    container.appendChild(scarabItem);
  });
}

function sortScarabs(column) {
  if (scarabSortColumn === column) {
    scarabSortDirection = scarabSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    scarabSortColumn = column;
    scarabSortDirection = 'asc';
  }
  updateScarabSortIcons();
  renderscarablist();
}

function updateScarabSortIcons() {
  const headers = document.querySelectorAll<HTMLElement>('#scarabContent .scarab-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === scarabSortColumn) {
      header.innerHTML += scarabSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateScarabRegex() {
  const selectedRegexes = Array.from(checkedScarabs).map(name => {
    const item = scarablist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  getElement('scarabRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = getElement('scarabCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetScarabSelection() {
  checkedScarabs.clear();
  document.querySelectorAll<HTMLInputElement>('#scarablistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateScarabRegex();
  saveScarabCheckboxState();
}

function bulkSelectScarabs() {
    const thresholdInput = getElement('scarabBulkThreshold');
    const thresholdMaxInput = getElement('scarabBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedScarabs.clear();
    Object.entries(scarablist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedScarabs.add(name);
            }
        }
    });

    renderscarablist();
    saveScarabCheckboxState();
    updateScarabRegex();
}

function copyScarabRegex() {
  const regex = getElement('scarabRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterScarabs() {
  const term = getElement('scarabSearch').value.toLowerCase();
  
  document.querySelectorAll<HTMLElement>('#scarablistContainer .scarab-item').forEach(item => {
    const japaneseName = item.querySelector<HTMLElement>('.scarab-name').textContent.toLowerCase();
    const englishName = scarablist[japaneseName]?.engName.toLowerCase() || '';
    const description = item.querySelector<HTMLElement>('.scarab-effect').textContent.toLowerCase();
    
    const match = 
      japaneseName.includes(term) || 
      englishName.includes(term) || 
      description.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

function saveScarabCheckboxState() {
  const state = Array.from(checkedScarabs);
  writeStoredJson('scarabCheckboxState', state);
}

function loadScarabCheckboxState() {
  const saved = readStoredText('scarabCheckboxState');
  if (saved) {
    try {
      checkedScarabs = new Set(readStoredJson('scarabCheckboxState'));
    } catch (e) {
      console.error('scarabCheckboxState 読み込みエラー:', e);
      checkedScarabs = new Set<string>();
    }
  }
}

function saveScarabProfile() {
  const profileName = getElement('scarabProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (scarabProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  scarabProfiles[profileName] = {
    scarabs: Array.from(checkedScarabs),
    timestamp: Date.now()
  };

  if (!writeStoredJson('scarabProfiles', scarabProfiles)) return false;
  updateScarabProfileList();
  saveScarabCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  getElement('scarabProfileName').value = '';
}

function loadScarabProfile() {
  const profileName = getElement('scarabProfileList').value;
  if (!profileName || !scarabProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = scarabProfiles[profileName];
    checkedScarabs.clear();
    profile.scarabs.forEach(scarab => {
      if (scarablist[scarab]) checkedScarabs.add(scarab);
    });
    getElement('scarabProfileName').value = profileName;
    renderscarablist();
    updateScarabRegex();
    saveScarabCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('スカラベプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteScarabProfile() {
  const profileName = getElement('scarabProfileList').value;
  if (!profileName || !scarabProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete scarabProfiles[profileName];
    if (!writeStoredJson('scarabProfiles', scarabProfiles)) return false;
    updateScarabProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateScarabProfileList() {
  const select = getElement('scarabProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(scarabProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

// --- エッセンス関連ロジック ---
// 表示番号は慟哭=1、下位ほど大きく（特殊は「特殊」）

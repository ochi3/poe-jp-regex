function rendertattoolist() {
  const container = getElement('tattoolistContainer');
  if (!container || typeof tattoolist === 'undefined') return;
  if (!container) return;
  container.innerHTML = '';
  
  let Tattoos = Object.entries(tattoolist);
  
  if (tattooSortColumn) {
    Tattoos.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (tattooSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = getCatalogDisplayName(nameA, dataA);
          valueB = getCatalogDisplayName(nameB, dataB);
          break;
        case 'attribute':
          valueA = String(dataA.attribute || '');
          valueB = String(dataB.attribute || '');
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
      
      return tattooSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  Tattoos = Tattoos.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  Tattoos.forEach(([name, data]) => {
    const tattooItem = document.createElement('div');
    tattooItem.className = 'tattoo-item';
    tattooItem.dataset.jaName = name;
    tattooItem.dataset.engName = data.engName;
    tattooItem.dataset.attribute = data.attribute || '';
    tattooItem.dataset.description = data.description || '';
    tattooItem.dataset.enDescription = data.enDescription || '';
    
    tattooItem.addEventListener('click', function(e) {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        const checkbox = tattooItem.querySelector<HTMLInputElement>('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = getCatalogDisplayName(name, data);
    const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
    
    tattooItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="tattoo-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="scarab-attribute ${data.attribute ? data.attribute.toLowerCase() : ''}">${data.attribute || ''}</div>
      <div class="scarab-effect">${displayDesc}</div>
    `;

    const checkbox = tattooItem.querySelector<HTMLInputElement>('input');
    checkbox.checked = checkedTattoos.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedTattoos.add(name);
      } else {
        checkedTattoos.delete(name);
      }
      updateTattooRegex();
      saveTattooCheckboxState();
    });
    
    container.appendChild(tattooItem);
  });
}

function sortTattoos(column) {
  if (tattooSortColumn === column) {
    tattooSortDirection = tattooSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    tattooSortColumn = column;
    tattooSortDirection = 'asc';
  }
  updateTattooSortIcons();
  rendertattoolist();
}

function updateTattooSortIcons() {
  const headers = document.querySelectorAll<HTMLElement>('#tattooContent .tattoo-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === tattooSortColumn) {
      header.innerHTML += tattooSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateTattooRegex() {
  const selectedRegexes = Array.from(checkedTattoos).map(name => {
    const item = tattoolist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  getElement('tattooRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = getElement('tattooCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetTattooSelection() {
  checkedTattoos.clear();
  document.querySelectorAll<HTMLInputElement>('#tattoolistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateTattooRegex();
  saveTattooCheckboxState();
}

function bulkSelectTattoos() {
    const thresholdInput = getElement('tattooBulkThreshold');
    const thresholdMaxInput = getElement('tattooBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedTattoos.clear();
    Object.entries(tattoolist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedTattoos.add(name);
            }
        }
    });

    rendertattoolist();
    saveTattooCheckboxState();
    updateTattooRegex();
}

function copyTattooRegex() {
  const regex = getElement('tattooRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterTattoos() {
  const term = getElement('tattooSearch').value.toLowerCase();
  
  document.querySelectorAll<HTMLElement>('#tattoolistContainer .tattoo-item').forEach(item => {
    const jaName = (item.dataset.jaName || '').toLowerCase();
    const enName = (item.dataset.engName || '').toLowerCase();
    const attribute = (item.dataset.attribute || '').toLowerCase();
    const jaDesc = (item.dataset.description || '').toLowerCase();
    const enDesc = (item.dataset.enDescription || '').toLowerCase();
    
    const match = 
      jaName.includes(term) || 
      enName.includes(term) || 
      attribute.includes(term) ||
      jaDesc.includes(term) ||
      enDesc.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

function saveTattooCheckboxState() {
  const state = Array.from(checkedTattoos);
  writeStoredJson('tattooCheckboxState', state);
}

function loadTattooCheckboxState() {
  const saved = readStoredText('tattooCheckboxState');
  if (saved) {
    try {
      checkedTattoos = new Set(readStoredJson('tattooCheckboxState'));
    } catch (e) {
      console.error('tattooCheckboxState 読み込みエラー:', e);
      checkedTattoos = new Set<string>();
    }
  }
}

function saveTattooProfile() {
  const profileName = getElement('tattooProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (tattooProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  tattooProfiles[profileName] = {
    tattoos: Array.from(checkedTattoos),
    timestamp: Date.now()
  };

  if (!writeStoredJson('tattooProfiles', tattooProfiles)) return false;
  updateTattooProfileList();
  saveTattooCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  getElement('tattooProfileName').value = '';
}

function loadTattooProfile() {
  const profileName = getElement('tattooProfileList').value;
  if (!profileName || !tattooProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = tattooProfiles[profileName];
    checkedTattoos.clear();
    profile.tattoos.forEach(tattoo => {
      if (tattoolist[tattoo]) checkedTattoos.add(tattoo);
    });
    getElement('tattooProfileName').value = profileName;
    rendertattoolist();
    updateTattooRegex();
    saveTattooCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('タトゥープロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteTattooProfile() {
  const profileName = getElement('tattooProfileList').value;
  if (!profileName || !tattooProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete tattooProfiles[profileName];
    if (!writeStoredJson('tattooProfiles', tattooProfiles)) return false;
    updateTattooProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateTattooProfileList() {
  const select = getElement('tattooProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(tattooProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

// --- ルーングラフト関連ロジック ---

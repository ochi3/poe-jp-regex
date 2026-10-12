function renderrunegraftlist() {
  const container = getElement('runegraftlistContainer');
  if (!container || typeof runegraftlist === 'undefined') return;
  if (!container) return;
  container.innerHTML = '';
  
  let Runegrafts = Object.entries(runegraftlist);
  
  if (runegraftSortColumn) {
    Runegrafts.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (runegraftSortColumn) {
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
      
      return runegraftSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  Runegrafts = Runegrafts.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  Runegrafts.forEach(([name, data]) => {
    const runegraftItem = document.createElement('div');
    runegraftItem.className = 'runegraft-item';
    runegraftItem.dataset.jaName = name;
    runegraftItem.dataset.engName = data.engName;
    runegraftItem.dataset.attribute = data.attribute || '';
    runegraftItem.dataset.description = data.description || '';
    runegraftItem.dataset.enDescription = data.enDescription || '';
    
    runegraftItem.addEventListener('click', function(e) {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        const checkbox = runegraftItem.querySelector<HTMLInputElement>('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = getCatalogDisplayName(name, data);
    const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
    
    runegraftItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="runegraft-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="scarab-attribute ${data.attribute ? data.attribute.toLowerCase() : ''}">${data.attribute || ''}</div>
      <div class="scarab-effect">${displayDesc}</div>
    `;

    const checkbox = runegraftItem.querySelector<HTMLInputElement>('input');
    checkbox.checked = checkedRunegrafts.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedRunegrafts.add(name);
      } else {
        checkedRunegrafts.delete(name);
      }
      updateRunegraftRegex();
      saveRunegraftCheckboxState();
    });
    
    container.appendChild(runegraftItem);
  });
}

function sortRunegrafts(column) {
  if (runegraftSortColumn === column) {
    runegraftSortDirection = runegraftSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    runegraftSortColumn = column;
    runegraftSortDirection = 'asc';
  }
  updateRunegraftSortIcons();
  renderrunegraftlist();
}

function updateRunegraftSortIcons() {
  const headers = document.querySelectorAll<HTMLElement>('#runegraftContent .runegraft-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === runegraftSortColumn) {
      header.innerHTML += runegraftSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

function updateRunegraftRegex() {
  const selectedRegexes = Array.from(checkedRunegrafts).map(name => {
    const item = runegraftlist[name];
    return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
  });
  const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
  
  getElement('runegraftRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = getElement('runegraftCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

function resetRunegraftSelection() {
  checkedRunegrafts.clear();
  document.querySelectorAll<HTMLInputElement>('#runegraftlistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateRunegraftRegex();
  saveRunegraftCheckboxState();
}

function bulkSelectRunegrafts() {
    const thresholdInput = getElement('runegraftBulkThreshold');
    const thresholdMaxInput = getElement('runegraftBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    checkedRunegrafts.clear();
    Object.entries(runegraftlist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedRunegrafts.add(name);
            }
        }
    });

    renderrunegraftlist();
    saveRunegraftCheckboxState();
    updateRunegraftRegex();
}

function copyRunegraftRegex() {
  const regex = getElement('runegraftRegexOutput').textContent;
  if (regex) {
    copyTextToClipboard(regex);
  }
}

function filterRunegrafts() {
  const term = getElement('runegraftSearch').value.toLowerCase();
  
  document.querySelectorAll<HTMLElement>('#runegraftlistContainer .runegraft-item').forEach(item => {
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

function saveRunegraftCheckboxState() {
  const state = Array.from(checkedRunegrafts);
  writeStoredJson('runegraftCheckboxState', state);
}

function loadRunegraftCheckboxState() {
  const saved = readStoredText('runegraftCheckboxState');
  if (saved) {
    try {
      checkedRunegrafts = new Set(readStoredJson('runegraftCheckboxState'));
    } catch (e) {
      console.error('runegraftCheckboxState 読み込みエラー:', e);
      checkedRunegrafts = new Set<string>();
    }
  }
}

function saveRunegraftProfile() {
  const profileName = getElement('runegraftProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (runegraftProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  runegraftProfiles[profileName] = {
    runegrafts: Array.from(checkedRunegrafts),
    timestamp: Date.now()
  };

  if (!writeStoredJson('runegraftProfiles', runegraftProfiles)) return false;
  updateRunegraftProfileList();
  saveRunegraftCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  getElement('runegraftProfileName').value = '';
}

function loadRunegraftProfile() {
  const profileName = getElement('runegraftProfileList').value;
  if (!profileName || !runegraftProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = runegraftProfiles[profileName];
    checkedRunegrafts.clear();
    profile.runegrafts.forEach(runegraft => {
      if (runegraftlist[runegraft]) checkedRunegrafts.add(runegraft);
    });
    getElement('runegraftProfileName').value = profileName;
    renderrunegraftlist();
    updateRunegraftRegex();
    saveRunegraftCheckboxState();
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('ルーングラフトプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteRunegraftProfile() {
  const profileName = getElement('runegraftProfileList').value;
  if (!profileName || !runegraftProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete runegraftProfiles[profileName];
    if (!writeStoredJson('runegraftProfiles', runegraftProfiles)) return false;
    updateRunegraftProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

function updateRunegraftProfileList() {
  const select = getElement('runegraftProfileList');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(runegraftProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

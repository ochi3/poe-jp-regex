let beastSortColumn = 'price';
let beastSortDirection = 'desc';

// ビーストリストのレンダリング（ソート機能追加）
function renderbeastlist() {
  const container = getElement('beastlistContainer');
  if (!container || typeof beastlist === 'undefined') return;
  container.innerHTML = '';
  
  let beasts = Object.entries(beastlist);
  
  if (beastSortColumn) {
    beasts.sort((a, b) => {
      const [nameA, dataA] = a;
      const [nameB, dataB] = b;
      let valueA, valueB;
      
      switch (beastSortColumn) {
        case 'price':
          valueA = parseFloat(dataA.chaosValue);
          valueB = parseFloat(dataB.chaosValue);
          break;
        case 'name':
          valueA = getCatalogDisplayName(nameA, dataA);
          valueB = getCatalogDisplayName(nameB, dataB);
          break;
        case 'family':
          valueA = dataA.family;
          valueB = dataB.family;
          break;
        case 'effect':
          valueA = dataA.effect;
          valueB = dataB.effect;
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
      
      return beastSortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // 0cのアイテムを除外
  beasts = beasts.filter(([name, data]) => parseFloat(data.chaosValue) > 0);

  beasts.forEach(([name, data]) => {
    const beastItem = document.createElement('div');
    beastItem.className = 'beast-item';
    beastItem.dataset.engName = data.engName;
    
    beastItem.addEventListener('click', function(e) {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        const checkbox = beastItem.querySelector<HTMLInputElement>('input');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    });
    
    const displayName = getCatalogDisplayName(name, data);
    
    beastItem.innerHTML = `
      <div class="beast-select">
        <input type="checkbox" id="beast-${name}" value="${name}">
      </div>
      <div class="beast-price">${data.chaosValue}</div>
      <div class="beast-name">${displayName}</div>
      <div class="beast-family">${data.family}</div>
      <div class="beast-effect">${data.effect}</div>
    `;

    const checkbox = beastItem.querySelector<HTMLInputElement>('input');
    checkbox.checked = checkedBeasts.has(name);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedBeasts.add(name);
      } else {
        checkedBeasts.delete(name);
      }
      updateBeastRegex();
      saveBeastCheckboxState();
    });
    
    container.appendChild(beastItem);
  });
}

// ソート処理関数
function sortBeasts(column) {
  if (beastSortColumn === column) {
    beastSortDirection = beastSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    beastSortColumn = column;
    beastSortDirection = 'asc';
  }
  
  updateSortIcons();
  
  renderbeastlist();
}

function updateSortIcons() {
  const headers = document.querySelectorAll<HTMLElement>('.beast-header > div');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
    if (header.dataset.column === beastSortColumn) {
      header.innerHTML += beastSortDirection === 'asc' ? ' ↑' : ' ↓';
    }
  });
}

// ビーストRegex更新
function updateBeastRegex() {
  const selectedRegexes = Array.from(checkedBeasts).map(name => {
    const data = beastlist[name];
    return (currentLanguage === 'en' && data.enRegex) ? data.enRegex : data.regex;
  });
  const regex = selectedRegexes.length > 0 ? selectedRegexes.join('|') : '';
  
  getElement('beastRegexOutput').textContent = regex;
  
  const charCount = regex.length;
  const charCountElement = getElement('beastCharCount');
  charCountElement.textContent = `文字数: ${charCount}`;
  
  if (charCount > 250) {
    charCountElement.style.color = 'red';
    charCountElement.textContent += ' (250文字を超えています)';
  } else {
    charCountElement.style.color = '';
  }
}

// ビースト選択リセット
function resetBeastSelection() {
  checkedBeasts.clear();
  document.querySelectorAll<HTMLInputElement>('#beastlistContainer input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateBeastRegex();
  saveBeastCheckboxState();
}

// ビーストRegexコピー
function copyBeastRegex() {
  const regex = getElement('beastRegexOutput').textContent;
  if (regex) {
    navigator.clipboard.writeText(regex)
      .then(() => {
        if (typeof showNotification === 'function') {
          showNotification('コピーしました！');
        } else {
          alert('コピーしました！');
        }
      })
      .catch(err => {
        console.error('コピー失敗:', err);
        if (typeof showNotification === 'function') {
          showNotification('❌ コピー失敗', true);
        }
      });
  }
}

// ビースト検索
function filterBeasts() {
  const term = getElement('beastSearch').value.toLowerCase();
  
  document.querySelectorAll<HTMLElement>('.beast-item').forEach(item => {
    const japaneseName = item.querySelector<HTMLElement>('.beast-name').textContent.toLowerCase();
    const englishName = beastlist[japaneseName]?.engName.toLowerCase() || '';
    const family = item.querySelector<HTMLElement>('.beast-family').textContent.toLowerCase();
    const effect = item.querySelector<HTMLElement>('.beast-effect').textContent.toLowerCase();
    
    const match = 
      japaneseName.includes(term) || 
      englishName.includes(term) || 
      family.includes(term) || 
      effect.includes(term);
    
    item.style.display = match ? '' : 'none';
  });
}

// チェックボックス状態保存
function saveBeastCheckboxState() {
  const state = Array.from(checkedBeasts);
  writeStoredJson('beastCheckboxState', state);
}

// チェックボックス状態復元
function loadBeastCheckboxState() {
  const saved = readStoredText('beastCheckboxState');
  if (saved) {
    checkedBeasts = new Set(readStoredJson('beastCheckboxState'));
  }
}

function bulkSelectBeasts() {
    const thresholdInput = getElement('beastBulkThreshold');
    const thresholdMaxInput = getElement('beastBulkThresholdMax');
    if (!thresholdInput) return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax)) return;

    // 現在の選択をリセット
    checkedBeasts.clear();

    // 指定範囲内の全てのビーストを選択
    Object.entries(beastlist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedBeasts.add(name);
            }
        }
    });

    // UIと状態を更新
    renderbeastlist();
    saveBeastCheckboxState();
    updateBeastRegex();
}

let beastProfiles: ProfileDictionary = {}

// ビーストプロファイル保存
function saveBeastProfile() {
  const profileName = getElement('beastProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (beastProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
    return;
  }

  beastProfiles[profileName] = {
    beasts: Array.from(checkedBeasts),
    timestamp: Date.now()
  };

  if (!writeStoredJson('beastProfiles', beastProfiles)) return false;
  updateBeastProfileList();
  saveBeastCheckboxState();

  showNotification(`"${profileName}" を保存しました`);
  getElement('beastProfileName').value = '';
}

// ビーストプロファイル読み込み
function loadBeastProfile() {
  const profileName = getElement('beastProfileList').value;
  if (!profileName || !beastProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = beastProfiles[profileName];

    checkedBeasts.clear();
    profile.beasts.forEach(beast => {
      if (beastlist[beast]) checkedBeasts.add(beast);
    });

    getElement('beastProfileName').value = profileName;

    renderbeastlist();
    updateBeastRegex();
    saveBeastCheckboxState();

    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('ビーストプロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

// ビーストプロファイル削除
function deleteBeastProfile() {
  const profileName = getElement('beastProfileList').value;
  if (!profileName || !beastProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
    delete beastProfiles[profileName];
    if (!writeStoredJson('beastProfiles', beastProfiles)) return false;
    updateBeastProfileList();
    showNotification(`"${profileName}" を削除しました`);
  }
}

// ビーストプロファイルリスト更新
function updateBeastProfileList() {
  const select = getElement('beastProfileList');
  if (!select) return;
  const currentValue = select.value;

  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(beastProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}
// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLElement>('.beast-header > div[data-column]').forEach(header => {
    header.addEventListener('click', () => {
      sortBeasts(header.dataset.column);
    });
  });
  
  loadBeastCheckboxState();
  renderbeastlist();
  updateSortIcons(); // 初期ソート状態のアイコンを表示
  updateBeastRegex();

  const savedBeastProfiles = readStoredText('beastProfiles');
  if (savedBeastProfiles) {
    try {
      beastProfiles = readStoredJson('beastProfiles');
      updateBeastProfileList();
    } catch (e) {
      console.error('beastProfiles の読み込みエラー:', e);
      beastProfiles = {};
    }
  }

  const beastProfileSelect = getElement('beastProfileList');
  if (beastProfileSelect && !beastProfileSelect.hasEventListener) {
    beastProfileSelect.addEventListener('change', function() {
      if (this.value) {
        loadBeastProfile();
      } else {
        const nameInput = getElement('beastProfileName');
        if (nameInput) nameInput.value = '';
      }
    });
    beastProfileSelect.hasEventListener = true;
  }

  const beastSaveBtn = getElement('saveBeastProfileBtn');
  if (beastSaveBtn) beastSaveBtn.addEventListener('click', saveBeastProfile);
  const beastDeleteBtn = getElement('deleteBeastProfileBtn');
  if (beastDeleteBtn) beastDeleteBtn.addEventListener('click', deleteBeastProfile);
});

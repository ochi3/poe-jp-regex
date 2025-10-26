
let flaskEventListenersInitialized = false;

let rawFlaskMods = [];
let flaskCheckedMods = new Set();
let flaskProfiles = {};
let currentFlaskModalGroup = null;
let flaskModalSelectedMods = new Set();
window.rawFlaskMods = [];

const flaskFileMapping = {
  'utility': 'flask/utility_flask,flask,default.json',
  'life': 'flask/life_flask,flask,default.json', 
  'mana': 'flask/mana_flask,flask,default.json', 
  'hybrid': 'flask/hybrid_flask,flask,default.json', 
  'tincture': 'flask/tincture.json'
};

// フラスコプロファイルリストの変更イベントを追加
function setupFlaskProfileEventListeners() {
  if (flaskEventListenersInitialized) return;
  
  const flaskProfileList = document.getElementById('flaskProfileList');
  if (flaskProfileList) {
    flaskProfileList.addEventListener('change', function() {
      if (this.value) {
        loadFlaskProfile();
      } else {
        document.getElementById('flaskProfileName').value = '';
      }
    });
  }
  
  flaskEventListenersInitialized = true;
}

// フラスコMod読み込み
async function loadFlaskMods() {
  const flaskTypeSelect = document.getElementById('flaskTypeSelect');
  const statusElement = document.getElementById('flaskModLoadingStatus');
  
  if (!flaskTypeSelect || !statusElement) {
    console.error('フラスコModの要素が見つかりません');
    return;
  }
  
  const flaskType = flaskTypeSelect.value;
  
  try {
    statusElement.textContent = `${flaskType} フラスコModデータを読み込み中...`;
    statusElement.style.color = "#FFA500";
    
    console.log(`Loading ${flaskType} flask mods...`);
    
    const fileName = flaskFileMapping[flaskType] || `${flaskType}_flask,flask,default.json`;
    const response = await fetch(fileName);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    const processedData = {
      prefix: [],
      suffix: []
    };
    
    if (rawData.mods && rawData.mods.prefix) {
      Object.entries(rawData.mods.prefix).forEach(([familyName, mods]) => {
        mods.forEach(mod => {
          processedData.prefix.push({
            ...mod,
            generation_type: 'prefix',
            family: familyName
          });
        });
      });
    }
    
    if (rawData.mods && rawData.mods.suffix) {
      Object.entries(rawData.mods.suffix).forEach(([familyName, mods]) => {
        mods.forEach(mod => {
          processedData.suffix.push({
            ...mod,
            generation_type: 'suffix',
            family: familyName
          });
        });
      });
    }
    
    rawFlaskMods = [...processedData.prefix, ...processedData.suffix];
    
    console.log(`Loaded ${rawFlaskMods.length} mods for ${flaskType}`, rawFlaskMods);
    
    statusElement.textContent = `${flaskType} フラスコModデータ (${rawFlaskMods.length}件) 読み込み完了`;
    statusElement.style.color = "#4CAF50";
    
    updateSeparatedFlaskModLists();
    updateCombinedFlaskRegex();

    window.rawFlaskMods = rawFlaskMods;
    try {
      localStorage.setItem('flaskModsData', JSON.stringify(rawFlaskMods));
    } catch (e) {
      console.error('フラスコMODデータの保存エラー:', e);
    }
    
  } catch (error) {
    console.error("フラスコModの読み込みエラー:", error);
    statusElement.textContent = `エラー: ${error.message}`;
    statusElement.style.color = "#FF0000";
  }
}

function restoreFlaskTypeState(flaskType) {
  const savedStates = JSON.parse(localStorage.getItem('flaskTypeStates') || '{}');
  if (savedStates[flaskType]) {
    flaskCheckedMods = new Set(savedStates[flaskType]);
    updateSeparatedFlaskModLists();
    updateCombinedFlaskRegex();
  }
}

function saveFlaskTypeState(flaskType) {
  const savedStates = JSON.parse(localStorage.getItem('flaskTypeStates') || '{}');
  savedStates[flaskType] = Array.from(flaskCheckedMods);
  localStorage.setItem('flaskTypeStates', JSON.stringify(savedStates));
}

function updateSeparatedFlaskModLists() {
  const prefixListDiv = document.getElementById('flaskPrefixModList');
  const suffixListDiv = document.getElementById('flaskSuffixModList');
  
  if (!prefixListDiv || !suffixListDiv) {
    console.error('フラスコPrefix/Suffixリスト要素が見つかりません');
    return;
  }
  
  const currentSearchTerm = document.getElementById('flaskModSearch').value.toLowerCase();
  
  prefixListDiv.innerHTML = '';
  suffixListDiv.innerHTML = '';

  if (!rawFlaskMods || rawFlaskMods.length === 0) {
    const message = '<div style="color: #888; text-align: center; padding: 20px;">Modデータが読み込まれていません</div>';
    prefixListDiv.innerHTML = message;
    suffixListDiv.innerHTML = message;
    return;
  }

  console.log(`Updating separated flask mod lists with ${rawFlaskMods.length} mods`);

  const { prefixGroups, suffixGroups } = groupAndSeparateFlaskMods(rawFlaskMods);
  
  const sortGroups = (groups) => {
    return Object.values(groups).sort((a, b) => {
      const selectedA = a.mods.filter(mod => flaskCheckedMods.has(mod.name)).length > 0 ? 1 : 0;
      const selectedB = b.mods.filter(mod => flaskCheckedMods.has(mod.name)).length > 0 ? 1 : 0;
      return selectedB - selectedA;
    });
  };
  
  sortGroups(prefixGroups).forEach(group => addFlaskGroupToColumn(group, prefixListDiv));
  sortGroups(suffixGroups).forEach(group => addFlaskGroupToColumn(group, suffixListDiv));
  
  if (Object.keys(prefixGroups).length === 0) {
    prefixListDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Prefix Modがありません</div>';
  }
  
  if (Object.keys(suffixGroups).length === 0) {
    suffixListDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Suffix Modがありません</div>';
  }

  if (currentSearchTerm) {
    document.getElementById('flaskModSearch').value = currentSearchTerm;
    filterFlaskMods();
  }
}

function groupAndSeparateFlaskMods(mods) {
  const prefixGroups = {};
  const suffixGroups = {};
  
  mods.forEach(mod => {
    const familyName = mod.family;
    const targetGroups = mod.generation_type === 'prefix' ? prefixGroups : suffixGroups;
    
    if (!targetGroups[familyName]) {
      const familyMods = mods.filter(m => m.family === familyName && m.generation_type === mod.generation_type);
      const highestLevelMod = familyMods.reduce((highest, current) => {
        return (current.required_level || 0) > (highest.required_level || 0) ? current : highest;
      }, familyMods[0]);
      
      targetGroups[familyName] = {
        displayName: highestLevelMod.text || highestLevelMod.name,
        baseKey: familyName,
        mods: [],
        generationType: mod.generation_type,
        highestTierMod: highestLevelMod,
        familyName: familyName
      };
    }
    
    targetGroups[familyName].mods.push(mod);
  });
  
  return { prefixGroups, suffixGroups };
}

function addFlaskGroupToColumn(group, container) {
  const groupItem = document.createElement('div');
  groupItem.className = `mod-group-item ${group.generationType}`;
  groupItem.dataset.groupKey = group.baseKey;
  groupItem.dataset.generationType = group.generationType;
  
  const selectedCount = group.mods.filter(mod => flaskCheckedMods.has(mod.name)).length;
  const isSelected = selectedCount > 0;
  
  if (isSelected) {
    groupItem.classList.add('selected');
  }
  
  const groupHeader = document.createElement('div');
  groupHeader.className = 'mod-group-header';
  
  const groupTitle = document.createElement('span');
  groupTitle.textContent = group.displayName;
  
  const groupCount = document.createElement('span');
  groupCount.className = 'mod-group-count';
  groupCount.textContent = `${selectedCount}/${group.mods.length}`;
  
  groupHeader.appendChild(groupTitle);
  groupHeader.appendChild(groupCount);
  
  const groupDesc = document.createElement('div');
  groupDesc.className = 'mod-group-desc';
  
  groupDesc.textContent = group.baseKey;
  
  groupItem.appendChild(groupHeader);
  groupItem.appendChild(groupDesc);
  
  groupItem.addEventListener('click', () => {
    openFlaskGroupModal(group);
  });
  
  container.appendChild(groupItem);
}

function openFlaskGroupModal(group) {
  currentFlaskModalGroup = group;
  flaskModalSelectedMods.clear();
  
  group.mods.forEach(mod => {
    if (flaskCheckedMods.has(mod.name)) {
      flaskModalSelectedMods.add(mod.name);
    }
  });
  
  const modal = document.getElementById('flaskModGroupModal');
  const modalTitle = document.getElementById('flaskModalTitle');
  const modalModList = document.getElementById('flaskModalModList');
  
  const titleColor = group.generationType === 'prefix' ? '#E74C3C' : '#3498DB';
  modalTitle.innerHTML = `<span style="color: ${titleColor}">${group.displayName}</span> (${group.generationType === 'prefix' ? 'Prefix' : 'Suffix'})`;
  modalModList.innerHTML = '';
  
  const sortedMods = group.mods.sort((a, b) => {
    const levelA = a.required_level || 0;
    const levelB = b.required_level || 0;
    return levelB - levelA;
  });
  
  sortedMods.forEach(mod => {
    addFlaskModToModal(mod, modalModList, group);
  });
  
  modal.style.display = 'flex';
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeFlaskModal();
    }
  });
  
  document.getElementById('closeFlaskModal').onclick = closeFlaskModal;
}

function addFlaskModToModal(mod, container, group) {
  const modItem = document.createElement('div');
  modItem.className = 'modal-mod-item';
  modItem.style.cursor = 'pointer';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = mod.name;
  checkbox.checked = flaskModalSelectedMods.has(mod.name);
  checkbox.style.marginRight = '10px';
  
  checkbox.onchange = function() {
    if (this.checked) {
      flaskModalSelectedMods.add(this.value);
    } else {
      flaskModalSelectedMods.delete(this.value);
    }
    updateFlaskModalSelectionState();
  };
  
  const modInfo = document.createElement('div');
  modInfo.className = 'modal-mod-info';
  modInfo.style.flexGrow = '1';
  
  const modName = document.createElement('div');
  modName.className = 'modal-mod-name';
  modName.textContent = mod.name;
  
  const modDesc = document.createElement('div');
  modDesc.className = 'modal-mod-desc';
  modDesc.textContent = mod.text;
  
  modInfo.appendChild(modName);
  modInfo.appendChild(modDesc);
  
  const modLevel = document.createElement('div');
  modLevel.className = 'modal-mod-tier';
  
  if (mod.required_level) {
    modLevel.textContent = `Lv${mod.required_level}`;
    modLevel.style.background = '#8B4513';
    modLevel.style.color = '#FFF';
    modLevel.style.padding = '2px 6px';
    modLevel.style.borderRadius = '3px';
    modLevel.style.fontSize = '0.8em';
    modLevel.style.fontWeight = 'bold';
    modLevel.style.marginLeft = '10px';
  } else {
    modLevel.style.display = 'none';
  }
  
  modItem.appendChild(checkbox);
  modItem.appendChild(modInfo);
  modItem.appendChild(modLevel);
  
  modItem.addEventListener('click', (e) => {
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        flaskModalSelectedMods.add(mod.name);
      } else {
        flaskModalSelectedMods.delete(mod.name);
      }
      updateFlaskModalSelectionState();
    }
  });
  
  container.appendChild(modItem);
}

function updateFlaskModalSelectionState() {
  console.log('Flask Modal selection updated:', Array.from(flaskModalSelectedMods));
}

function applyFlaskModalSelection() {
  if (!currentFlaskModalGroup) return;
  
  currentFlaskModalGroup.mods.forEach(mod => {
    flaskCheckedMods.delete(mod.name);
  });
  
  flaskModalSelectedMods.forEach(modName => {
    flaskCheckedMods.add(modName);
  });
  
  updateSeparatedFlaskModLists();
  updateCombinedFlaskRegex();
  saveFlaskModCheckboxState();
  const flaskType = document.getElementById('flaskTypeSelect').value;
  saveFlaskTypeState(flaskType);
  
  closeFlaskModal();
}

function closeFlaskModal() {
  const modal = document.getElementById('flaskModGroupModal');
  modal.style.display = 'none';
  currentFlaskModalGroup = null;
  flaskModalSelectedMods.clear();
}

function updateCombinedFlaskRegex() {
  const selectedMods = Array.from(flaskCheckedMods);
  const regex = selectedMods.join('|');
  
  const outputElement = document.getElementById('combinedFlaskRegexOutput');
  if (outputElement) {
    outputElement.textContent = regex || '選択されたModがありません';
    
    const charCount = regex.length;
    const charCountElement = document.getElementById('flaskCharCount');
    if (charCountElement) {
      let maxLevel = 0;
      selectedMods.forEach(modName => {
        const mod = rawFlaskMods.find(m => m.name === modName);
        if (mod && mod.required_level > maxLevel) {
          maxLevel = mod.required_level;
        }
      });
      
      charCountElement.innerHTML = `文字数: ${charCount}`;
      if (maxLevel > 0) {
        charCountElement.innerHTML += ` | 必要Lv: ${maxLevel}`;
      }
      
      if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.innerHTML += ' (250文字を超えています)';
      } else {
        charCountElement.style.color = '';
      }
    }
  }
}

let currentFlaskSearchTerm = '';

function filterFlaskMods() {
  currentFlaskSearchTerm = document.getElementById('flaskModSearch').value.toLowerCase();
  const prefixGroups = document.querySelectorAll('#flaskPrefixModList .mod-group-item');
  const suffixGroups = document.querySelectorAll('#flaskSuffixModList .mod-group-item');
  
  let anyVisible = false;
  
  prefixGroups.forEach(group => {
    const groupTitle = group.querySelector('.mod-group-header span:first-child').textContent.toLowerCase();
    const groupDesc = group.querySelector('.mod-group-desc').textContent.toLowerCase();
    
    const isVisible = groupTitle.includes(currentFlaskSearchTerm) || groupDesc.includes(currentFlaskSearchTerm);
    group.style.display = isVisible ? 'block' : 'none';
    if (isVisible) anyVisible = true;
  });
  
  suffixGroups.forEach(group => {
    const groupTitle = group.querySelector('.mod-group-header span:first-child').textContent.toLowerCase();
    const groupDesc = group.querySelector('.mod-group-desc').textContent.toLowerCase();
    
    const isVisible = groupTitle.includes(currentFlaskSearchTerm) || groupDesc.includes(currentFlaskSearchTerm);
    group.style.display = isVisible ? 'block' : 'none';
    if (isVisible) anyVisible = true;
  });
  
  const prefixContainer = document.getElementById('flaskPrefixModList');
  const suffixContainer = document.getElementById('flaskSuffixModList');
  
  const showNoResults = (container, type) => {
    const existingMsg = container.querySelector('.no-results-message');
    if (!existingMsg && currentFlaskSearchTerm !== '') {
      const message = document.createElement('div');
      message.className = 'no-results-message';
      message.style.cssText = 'color: #888; text-align: center; padding: 20px;';
      message.textContent = `"${currentFlaskSearchTerm}" に一致する${type}Modが見つかりません`;
      container.appendChild(message);
    } else if (existingMsg && currentFlaskSearchTerm === '') {
      existingMsg.remove();
    }
  };
  
  if (!anyVisible && currentFlaskSearchTerm !== '') {
    showNoResults(prefixContainer, 'Prefix');
    showNoResults(suffixContainer, 'Suffix');
  } else {
    const messages = document.querySelectorAll('.no-results-message');
    messages.forEach(msg => msg.remove());
  }
}

function resetFlaskMods() {
  flaskCheckedMods.clear();
  flaskModalSelectedMods.clear();
  updateSeparatedFlaskModLists();
  updateCombinedFlaskRegex();
  saveFlaskModCheckboxState();
  const flaskType = document.getElementById('flaskTypeSelect').value;
  saveFlaskTypeState(flaskType);
}

function copyFlaskRegex() {
  const regex = document.getElementById('combinedFlaskRegexOutput').textContent;
  if (regex && regex !== '選択されたModがありません') {
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

function saveFlaskModCheckboxState() {
  const state = Array.from(flaskCheckedMods);
  localStorage.setItem('flaskModCheckboxState', JSON.stringify(state));
}

function loadFlaskModCheckboxState() {
  const saved = localStorage.getItem('flaskModCheckboxState');
  if (saved) {
    try {
      flaskCheckedMods = new Set(JSON.parse(saved));
    } catch (e) {
      console.error('フラスコMod状態の読み込みエラー:', e);
      flaskCheckedMods = new Set();
    }
  }
}

function saveFlaskProfile() {
  const profileName = document.getElementById('flaskProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  flaskProfiles[profileName] = {
    mods: Array.from(flaskCheckedMods),
    flaskType: document.getElementById('flaskTypeSelect').value,
    timestamp: Date.now()
  };

  localStorage.setItem('flaskProfiles', JSON.stringify(flaskProfiles));
  updateFlaskProfileList();
  showNotification(`"${profileName}" を保存しました`);
  
  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function loadFlaskProfile() {
  const profileName = document.getElementById('flaskProfileList').value;
  if (!profileName || !flaskProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  const profile = flaskProfiles[profileName];
  
  document.getElementById('flaskTypeSelect').value = profile.flaskType;
  document.getElementById('flaskProfileName').value = profileName;
  
  loadFlaskMods().then(() => {
    flaskCheckedMods.clear();
    profile.mods.forEach(mod => flaskCheckedMods.add(mod));
    
    updateSeparatedFlaskModLists();
    updateCombinedFlaskRegex();
    showNotification(`"${profileName}" を読み込みました`);
  });
}

function deleteFlaskProfile() {
  const profileName = document.getElementById('flaskProfileList').value;
  if (!profileName || !confirm(`${profileName}を削除しますか？`)) return;

  delete flaskProfiles[profileName];
  localStorage.setItem('flaskProfiles', JSON.stringify(flaskProfiles));
  updateFlaskProfileList();
  document.getElementById('flaskProfileName').value = '';
  showNotification(`"${profileName}" を削除しました`);
  
  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function updateFlaskProfileList() {
  const select = document.getElementById('flaskProfileList');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(flaskProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function initializeFlaskMods() {
  const savedProfiles = localStorage.getItem('flaskProfiles');
  if (savedProfiles) {
    try {
      flaskProfiles = JSON.parse(savedProfiles);
      updateFlaskProfileList();
    } catch (e) {
      console.error('フラスコプロファイルの読み込みエラー:', e);
      flaskProfiles = {};
    }
  }
  
  loadFlaskModCheckboxState();
  
  const savedType = localStorage.getItem('flaskSelectedType');
  const flaskTypeSelect = document.getElementById('flaskTypeSelect');
  if (savedType && flaskTypeSelect) {
    flaskTypeSelect.value = savedType;
  }
  
  const flaskType = flaskTypeSelect.value;
  saveFlaskTypeState(flaskType);
  
  setTimeout(() => {
    console.log('Initializing flask mods...');
    loadFlaskMods().then(() => {
      restoreFlaskTypeState(flaskType);
    });
  }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
  initializeFlaskMods();
  setupFlaskProfileEventListeners();
  
  const flaskTypeSelect = document.getElementById('flaskTypeSelect');
  if (flaskTypeSelect) {
    flaskTypeSelect.addEventListener('change', function() {
      const newType = this.value;
      localStorage.setItem('flaskSelectedType', newType);
      flaskCheckedMods.clear();
      loadFlaskMods().then(() => {
        restoreFlaskTypeState(newType);
      });
    });
  }
  
  const flaskTabLink = document.querySelector('a[data-tab="flaskContent"]');
  if (flaskTabLink) {
    flaskTabLink.addEventListener('click', function() {
      initializeFlaskMods();
    });
  }

});

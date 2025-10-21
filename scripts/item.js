// item.js - アイテムMod管理

// アイテムMod用の変数
let rawItemMods = [];
let itemCheckedMods = new Set();
let itemProfiles = {};
let currentItemModalGroup = null;
let itemModalSelectedMods = new Set();
window.rawItemMods = [];

// アイテムデータ
const itemData = {
  "oneHanded": [
    { value: "claw", text: "鉤爪" },
    { value: "dagger", text: "短剣" },
    { value: "wand", text: "ワンド" },
    { value: "minionwand", text: "ミニオンワンド" },
    { value: "one_hand_sword", text: "片手剣" },
    { value: "thrusting_sword", text: "刺突剣" },
    { value: "one_hand_axe", text: "片手斧" },
    { value: "one_hand_mace", text: "片手メイス" },
    { value: "sceptre", text: "セプター" },
    { value: "runic_dagger", text: "ルーンの短剣" }
  ],
  "twoHanded": [
    { value: "bow", text: "弓" },
    { value: "staff", text: "スタッフ" },
    { value: "two_hand_sword", text: "両手剣" },
    { value: "two_hand_axe", text: "両手斧" },
    { value: "two_hand_mace", text: "両手メイス" },
    { value: "warstaff", text: "ウォースタッフ" },
    { value: "fishing_rod", text: "釣り竿" }
  ],
  "accessory": [
    { value: "amulet", text: "アミュレット" },
    { value: "ring", text: "指輪" },
    { value: "belt", text: "ベルト" }
  ],
  "gloves": [
    { value: "gloves_str", text: "手袋(str)" },
    { value: "gloves_dex", text: "手袋(dex)" },
    { value: "gloves_int", text: "手袋(int)" },
    { value: "gloves_str_dex", text: "手袋(str_dex)" },
    { value: "gloves_str_int", text: "手袋(str_int)" },
    { value: "gloves_dex_int", text: "手袋(dex_int)" }
  ],
  "boots": [
    { value: "boots_str", text: "靴(str)" },
    { value: "boots_dex", text: "靴(dex)" },
    { value: "boots_int", text: "靴(int)" },
    { value: "boots_str_dex", text: "靴(str_dex)" },
    { value: "boots_str_int", text: "靴(str_int)" },
    { value: "boots_dex_int", text: "靴(dex_int)" }
  ],
  "body": [
    { value: "body_armour_str", text: "鎧(str)" },
    { value: "body_armour_dex", text: "鎧(dex)" },
    { value: "body_armour_int", text: "鎧(int)" },
    { value: "body_armour_str_dex", text: "鎧(str_dex)" },
    { value: "body_armour_str_int", text: "鎧(str_int)" },
    { value: "body_armour_dex_int", text: "鎧(dex_int)" },
    { value: "body_armour_str_dex_int", text: "鎧(str_dex_int)" }
  ],
  "helmet": [
    { value: "helmet_str", text: "兜(str)" },
    { value: "helmet_dex", text: "兜(dex)" },
    { value: "helmet_int", text: "兜(int)" },
    { value: "helmet_str_dex", text: "兜(str_dex)" },
    { value: "helmet_str_int", text: "兜(str_int)" },
    { value: "helmet_dex_int", text: "兜(dex_int)" }
  ],
  "offhand": [
    { value: "quiver", text: "矢筒" },
    { value: "shield_str", text: "盾(str)" },
    { value: "shield_dex", text: "盾(dex)" },
    { value: "shield_int", text: "盾(int)" },
    { value: "shield_str_dex", text: "盾(str_dex)" },
    { value: "shield_str_int", text: "盾(str_int)" },
    { value: "shield_dex_int", text: "盾(dex_int)" }
  ]
};

// ファイルマッピング
const itemFileMapping = {
  // 片手武器
  'claw': 'item/top_tier_base_item_type,claw,one_hand_weapon,onehand,weapon,default.json',
  'dagger': 'item/dagger,attack_dagger,one_hand_weapon,onehand,weapon,default.json',
  'wand': 'item/wand,ranged,one_hand_weapon,onehand,weapon,default.json',
  'minionwand': 'item/weapon_can_roll_minion_modifiers,wand,ranged,one_hand_weapon,onehand,weapon,default.json',
  'one_hand_sword': 'item/sword,one_hand_weapon,onehand,weapon,default.json',
  'thrusting_sword': 'item/rapier,sword,one_hand_weapon,onehand,weapon,default.json',
  'one_hand_axe': 'item/axe,one_hand_weapon,onehand,weapon,default.json',
  'one_hand_mace': 'item/mace,one_hand_weapon,onehand,weapon,default.json',
  'sceptre': 'item/sceptre,sceptre,one_hand_weapon,onehand,weapon,default.json',
  'runic_dagger': 'item/dagger,one_hand_weapon,onehand,weapon,default.json',

  // 両手武器
  'bow': 'item/bow,ranged,two_hand_weapon,twohand,weapon,default.json',
  'staff': 'item/staff,two_hand_weapon,twohand,weapon,default.json',
  'two_hand_sword': 'item/sword,two_hand_weapon,twohand,weapon,default.json',
  'two_hand_axe': 'item/axe,two_hand_weapon,twohand,weapon,default.json',
  'two_hand_mace': 'item/mace,two_hand_weapon,twohand,weapon,default.json',
  'warstaff': 'item/warstaff,staff,attack_staff,two_hand_weapon,twohand,weapon,default.json',
  'fishing_rod': 'item/not_for_sale,fishing_rod,twohand,weapon,default.json',

  // 宝飾品
  'amulet': 'item/amulet,default.json',
  'ring': 'item/ring,default.json',
  'belt': 'item/belt,default.json',

  // 手袋
  'gloves_str': 'item/str_armour,gloves,armour,default.json',
  'gloves_dex': 'item/dex_armour,gloves,armour,default.json',
  'gloves_int': 'item/int_armour,gloves,armour,default.json',
  'gloves_str_dex': 'item/str_dex_armour,gloves,armour,default.json',
  'gloves_str_int': 'item/str_int_armour,gloves,armour,default.json',
  'gloves_dex_int': 'item/dex_int_armour,gloves,armour,default.json',

// 靴
  'boots_str': 'item/str_armour,boots,armour,default.json',
  'boots_dex': 'item/dex_armour,boots,armour,default.json',
  'boots_int': 'item/int_armour,boots,armour,default.json',
  'boots_str_dex': 'item/str_dex_armour,boots,armour,default.json',
  'boots_str_int': 'item/str_int_armour,boots,armour,default.json',
  'boots_dex_int': 'item/dex_int_armour,boots,armour,default.json',

  // 鎧
  'body_armour_str': 'item/str_armour,body_armour,armour,default.json',
  'body_armour_dex': 'item/dex_armour,body_armour,armour,default.json',
  'body_armour_int': 'item/int_armour,body_armour,armour,default.json',
  'body_armour_str_dex': 'item/str_dex_armour,body_armour,armour,default.json',
  'body_armour_str_int': 'item/str_int_armour,body_armour,armour,default.json',
  'body_armour_dex_int': 'item/dex_int_armour,body_armour,armour,default.json',
  'body_armour_str_dex_int': 'item/str_dex_int_armour,body_armour,armour,default.json',

// 兜
  'helmet_str': 'item/str_armour,helmet,armour,default.json',
  'helmet_dex': 'item/dex_armour,helmet,armour,default.json',
  'helmet_int': 'item/int_armour,helmet,armour,default.json',
  'helmet_str_dex': 'item/str_dex_armour,helmet,armour,default.json',
  'helmet_str_int': 'item/str_int_armour,helmet,armour,default.json',
  'helmet_dex_int': 'item/dex_int_armour,helmet,armour,default.json',

  // オフハンド
  'quiver': 'item/quiver,default.json',
  'shield_str': 'item/str_armour,str_shield,shield,armour,default',
  'shield_dex': 'item/dex_armour,dex_shield,shield,armour,default.json',
  'shield_int': 'item/int_armour,focus,shield,armour,default.json',
  'shield_str_dex': 'item/str_dex_armour,str_dex_shield,shield,armour,default.json',
  'shield_str_int': 'item/str_int_armour,str_int_shield,shield,armour,default.json',
  'shield_dex_int': 'item/dex_int_armour,dex_int_shield,shield,armour,default.json'
};

// アイテムMod読み込み
async function loadItemMods() {
  const itemTypeSelect = document.getElementById('itemTypeSelect');
  const statusElement = document.getElementById('itemModLoadingStatus');
  
  if (!itemTypeSelect || !statusElement) {
    console.error('アイテムModの要素が見つかりません');
    return;
  }
  
  const itemType = itemTypeSelect.value;
  const fileName = itemFileMapping[itemType] || `${itemType}_item_mods.json`;
  
  try {
    statusElement.textContent = `${itemType} アイテムModデータを読み込み中...`;
    statusElement.style.color = "#FFA500";
    
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const rawData = await response.json();
    
    const processedData = { prefix: [], suffix: [] };
    
    if (rawData.mods && rawData.mods.prefix) {
      Object.entries(rawData.mods.prefix).forEach(([familyName, mods]) => {
        mods.forEach(mod => processedData.prefix.push({ ...mod, generation_type: 'prefix', family: familyName }));
      });
    }
    if (rawData.mods && rawData.mods.suffix) {
      Object.entries(rawData.mods.suffix).forEach(([familyName, mods]) => {
        mods.forEach(mod => processedData.suffix.push({ ...mod, generation_type: 'suffix', family: familyName }));
      });
    }
    
    rawItemMods = [...processedData.prefix, ...processedData.suffix];
    
    statusElement.textContent = `${itemType} アイテムModデータ (${rawItemMods.length}件) 読み込み完了`;
    statusElement.style.color = "#4CAF50";
    
    updateSeparatedItemModLists();
    updateCombinedItemRegex();

    window.rawItemMods = rawItemMods;
    try {
      localStorage.setItem('itemModsData', JSON.stringify(rawItemMods));
    } catch (e) {
      console.error('アイテムMODデータの保存エラー:', e);
    }
    
  } catch (error) {
    console.error("アイテムModの読み込みエラー:", error);
    statusElement.textContent = `エラー: ${error.message}`;
    statusElement.style.color = "#FF0000";
  }
}

function restoreItemTypeState(itemType) {
  const savedStates = JSON.parse(localStorage.getItem('itemTypeStates') || '{}');
  if (savedStates[itemType]) {
    itemCheckedMods = new Set(savedStates[itemType]);
    updateSeparatedItemModLists();
    updateCombinedItemRegex();
  }
}

function saveItemTypeState(itemType) {
  const savedStates = JSON.parse(localStorage.getItem('itemTypeStates') || '{}');
  savedStates[itemType] = Array.from(itemCheckedMods);
  localStorage.setItem('itemTypeStates', JSON.stringify(savedStates));
}

function updateSeparatedItemModLists() {
  const prefixListDiv = document.getElementById('prefixModList');
  const suffixListDiv = document.getElementById('suffixModList');
  
  if (!prefixListDiv || !suffixListDiv) {
    console.error('アイテムPrefix/Suffixリスト要素が見つかりません');
    return;
  }
  
  prefixListDiv.innerHTML = '';
  suffixListDiv.innerHTML = '';

  if (!rawItemMods || rawItemMods.length === 0) {
    const message = '<div style="color: #888; text-align: center; padding: 20px;">Modデータが読み込まれていません</div>';
    prefixListDiv.innerHTML = message;
    suffixListDiv.innerHTML = message;
    return;
  }

  const { prefixGroups, suffixGroups } = groupAndSeparateMods(rawItemMods);
  
  const sortGroups = (groups) => {
    return Object.values(groups).sort((a, b) => {
      const selectedA = a.mods.filter(mod => itemCheckedMods.has(mod.name)).length > 0 ? 1 : 0;
      const selectedB = b.mods.filter(mod => itemCheckedMods.has(mod.name)).length > 0 ? 1 : 0;
      return selectedB - selectedA;
    });
  };
  
  sortGroups(prefixGroups).forEach(group => addGroupToColumn(group, prefixListDiv, 'item'));
  sortGroups(suffixGroups).forEach(group => addGroupToColumn(group, suffixListDiv, 'item'));
  
  if (Object.keys(prefixGroups).length === 0) {
    prefixListDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Prefix Modがありません</div>';
  }
  if (Object.keys(suffixGroups).length === 0) {
    suffixListDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Suffix Modがありません</div>';
  }
}

function groupAndSeparateMods(mods) {
  const prefixGroups = {};
  const suffixGroups = {};
  
  mods.forEach(mod => {
    const familyName = mod.family;
    const targetGroups = mod.generation_type === 'prefix' ? prefixGroups : suffixGroups;
    
    if (!targetGroups[familyName]) {
      const familyMods = mods.filter(m => m.family === familyName && m.generation_type === mod.generation_type);
      const highestLevelMod = familyMods.reduce((highest, current) => 
        (current.required_level || 0) > (highest.required_level || 0) ? current : highest, familyMods[0]);
      
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

function addGroupToColumn(group, container, type) {
  const checkedModsSet = type === 'flask' ? flaskCheckedMods : itemCheckedMods;
  const groupItem = document.createElement('div');
  groupItem.className = `mod-group-item ${group.generationType}`;
  groupItem.dataset.groupKey = group.baseKey;
  groupItem.dataset.generationType = group.generationType;
  
  const selectedCount = group.mods.filter(mod => checkedModsSet.has(mod.name)).length;
  if (selectedCount > 0) groupItem.classList.add('selected');
  
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
    type === 'flask' ? openFlaskGroupModal(group) : openItemGroupModal(group);
  });
  
  container.appendChild(groupItem);
}

function openItemGroupModal(group) {
  currentItemModalGroup = group;
  itemModalSelectedMods.clear();
  
  group.mods.forEach(mod => {
    if (itemCheckedMods.has(mod.name)) itemModalSelectedMods.add(mod.name);
  });
  
  const modal = document.getElementById('itemModGroupModal');
  const modalTitle = document.getElementById('itemModalTitle');
  const modalModList = document.getElementById('itemModalModList');
  
  const titleColor = group.generationType === 'prefix' ? '#E74C3C' : '#3498DB';
  modalTitle.innerHTML = `<span style="color: ${titleColor}">${group.displayName}</span> (${group.generationType === 'prefix' ? 'Prefix' : '接尾辞'})`;
  modalModList.innerHTML = '';
  
  const sortedMods = group.mods.sort((a, b) => (b.required_level || 0) - (a.required_level || 0));
  
  sortedMods.forEach(mod => addModToModal(mod, modalModList, 'item'));
  
  modal.style.display = 'flex';
  
  modal.addEventListener('click', (e) => { if (e.target === modal) closeItemModal(); });
  document.getElementById('closeItemModal').onclick = closeItemModal;
}

function addModToModal(mod, container, type) {
  const selectedModsSet = type === 'flask' ? flaskModalSelectedMods : itemModalSelectedMods;
  const modItem = document.createElement('div');
  modItem.className = 'modal-mod-item';
  modItem.style.cursor = 'pointer';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = mod.name;
  checkbox.checked = selectedModsSet.has(mod.name);
  checkbox.style.marginRight = '10px';
  
  checkbox.onchange = function() {
    if (this.checked) selectedModsSet.add(this.value);
    else selectedModsSet.delete(this.value);
  };
  
  const modInfo = document.createElement('div');
  modInfo.className = 'modal-mod-info';
  modInfo.style.cssText = 'flex-grow: 1; display: flex; justify-content: space-between; align-items: center;';
  
  const modNameAndDesc = document.createElement('div');
  modNameAndDesc.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';
  
  const modName = document.createElement('div');
  modName.className = 'modal-mod-name';
  modName.textContent = mod.name;
  modName.style.cssText = 'font-weight: bold; min-width: 80px;';
  
  const modDesc = document.createElement('div');
  modDesc.className = 'modal-mod-desc';
  modDesc.textContent = mod.text;
  modDesc.style.cssText = 'color: #aaa; flex: 1;';
  
  modNameAndDesc.appendChild(modName);
  modNameAndDesc.appendChild(modDesc);
  
  const modLevel = document.createElement('div');
  modLevel.className = 'modal-mod-tier';
  if (mod.required_level) {
    modLevel.textContent = `Lv${mod.required_level}`;
    modLevel.style.cssText = 'background: #8B4513; color: #FFF; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; font-weight: bold; margin-left: 10px; min-width: 40px; text-align: center;';
  } else {
    modLevel.style.display = 'none';
  }
  
  modInfo.appendChild(modNameAndDesc);
  modInfo.appendChild(modLevel);
  
  modItem.appendChild(checkbox);
  modItem.appendChild(modInfo);
  
  modItem.addEventListener('click', (e) => {
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) selectedModsSet.add(mod.name);
      else selectedModsSet.delete(mod.name);
    }
  });
  
  container.appendChild(modItem);
}

function applyItemModalSelection() {
  if (!currentItemModalGroup) return;
  
  currentItemModalGroup.mods.forEach(mod => itemCheckedMods.delete(mod.name));
  itemModalSelectedMods.forEach(modName => itemCheckedMods.add(modName));
  
  updateSeparatedItemModLists();
  updateCombinedItemRegex();
  saveItemModCheckboxState();
  
  const itemType = document.getElementById('itemTypeSelect').value;
  if (itemType) {
    saveItemTypeState(itemType);
  }
  
  closeItemModal();
}

function closeItemModal() {
  const modal = document.getElementById('itemModGroupModal');
  modal.style.display = 'none';
  currentItemModalGroup = null;
  itemModalSelectedMods.clear();
}

function updateCombinedItemRegex() {
  const selectedMods = Array.from(itemCheckedMods);
  const regex = selectedMods.join('|');
  
  const outputElement = document.getElementById('combinedItemRegexOutput');
  if (outputElement) {
    outputElement.textContent = regex || '選択されたModがありません';
    
    const charCount = regex.length;
    const charCountElement = document.getElementById('itemCharCount');
    if (charCountElement) {
      let maxLevel = 0;
      selectedMods.forEach(modName => {
        const mod = rawItemMods.find(m => m.name === modName);
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

function filterItemMods() {
  const term = document.getElementById('itemModSearch').value.toLowerCase();
  const prefixGroups = document.querySelectorAll('#prefixModList .mod-group-item');
  const suffixGroups = document.querySelectorAll('#suffixModList .mod-group-item');
  
  let anyVisible = false;
  
  [prefixGroups, suffixGroups].forEach(groups => {
    groups.forEach(group => {
      const groupTitle = group.querySelector('.mod-group-header span:first-child').textContent.toLowerCase();
      const groupDesc = group.querySelector('.mod-group-desc').textContent.toLowerCase();
      
      const isVisible = groupTitle.includes(term) || groupDesc.includes(term);
      group.style.display = isVisible ? 'block' : 'none';
      if (isVisible) anyVisible = true;
    });
  });
  
  const containers = [document.getElementById('prefixModList'), document.getElementById('suffixModList')];
  if (!anyVisible && term !== '') {
    containers.forEach(container => {
      const existingMsg = container.querySelector('.no-results-message');
      if (!existingMsg) {
        const message = document.createElement('div');
        message.className = 'no-results-message';
        message.style.cssText = 'color: #888; text-align: center; padding: 20px;';
        message.textContent = `"${term}" に一致するModが見つかりません`;
        container.appendChild(message);
      }
    });
  } else {
    document.querySelectorAll('.no-results-message').forEach(msg => msg.remove());
  }
}

function resetItemMods() {
  itemCheckedMods.clear();
  itemModalSelectedMods.clear();
  updateSeparatedItemModLists();
  updateCombinedItemRegex();
  saveItemModCheckboxState();
  
  const itemType = document.getElementById('itemTypeSelect').value;
  if (itemType) {
    saveItemTypeState(itemType);
  }
}

function copyItemRegex() {
  const regex = document.getElementById('combinedItemRegexOutput').textContent;
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

function saveItemModCheckboxState() {
  localStorage.setItem('itemModCheckboxState', JSON.stringify(Array.from(itemCheckedMods)));
}

function loadItemModCheckboxState() {
  const saved = localStorage.getItem('itemModCheckboxState');
  if (saved) itemCheckedMods = new Set(JSON.parse(saved));
}

function saveItemProfile() {
  const profileName = document.getElementById('itemProfileName').value.trim();
  if (!profileName) { 
    showNotification('プロファイル名を入力してください', true);
    return; 
  }

  itemProfiles[profileName] = {
    mods: Array.from(itemCheckedMods),
    itemType: document.getElementById('itemTypeSelect').value,
    category: document.getElementById('categorySelect').value,
    timestamp: Date.now()
  };

  localStorage.setItem('itemProfiles', JSON.stringify(itemProfiles));
  updateItemProfileList();
  showNotification(`"${profileName}" を保存しました`);
  
  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function loadItemProfile() {
  const profileName = document.getElementById('itemProfileList').value;
  if (!profileName || !itemProfiles[profileName]) { 
    showNotification('プロファイルを選択してください', true);
    return; 
  }

  const profile = itemProfiles[profileName];
  
  const categorySelect = document.getElementById('categorySelect');
  categorySelect.value = profile.category;
  
  updateTypeOptions(profile.category);
  
  const itemTypeSelect = document.getElementById('itemTypeSelect');
  itemTypeSelect.value = profile.itemType;
  
  document.getElementById('itemProfileName').value = profileName;
  
  loadItemMods().then(() => {
    itemCheckedMods.clear();
    profile.mods.forEach(mod => itemCheckedMods.add(mod));
    updateSeparatedItemModLists();
    updateCombinedItemRegex();
    showNotification(`"${profileName}" を読み込みました`);
  });
}

function deleteItemProfile() {
  const profileName = document.getElementById('itemProfileList').value;
  if (!profileName || !confirm(`${profileName}を削除しますか？`)) return;

  delete itemProfiles[profileName];
  localStorage.setItem('itemProfiles', JSON.stringify(itemProfiles));
  updateItemProfileList();
  document.getElementById('itemProfileName').value = '';
  showNotification(`"${profileName}" を削除しました`);
  
  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function updateItemProfileList() {
  const select = document.getElementById('itemProfileList');
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(itemProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function initializeItemMods() {
  const savedProfiles = localStorage.getItem('itemProfiles');
  if (savedProfiles) {
    itemProfiles = JSON.parse(savedProfiles);
    updateItemProfileList();
  }
  
  loadItemModCheckboxState();
  
  const savedCategory = localStorage.getItem('itemSelectedCategory');
  const savedType = localStorage.getItem('itemSelectedType');
  const categorySelect = document.getElementById('categorySelect');
  const itemTypeSelect = document.getElementById('itemTypeSelect');
  
  if (savedCategory && categorySelect) {
    categorySelect.value = savedCategory;
    
    updateTypeOptions(savedCategory);
    
    if (savedType && itemTypeSelect) {
      setTimeout(() => {
        if (Array.from(itemTypeSelect.options).some(opt => opt.value === savedType)) {
          itemTypeSelect.value = savedType;
          loadItemMods().then(() => {
            restoreItemTypeState(savedType);
          });
        }
      }, 100);
    }
  }
}

function updateTypeOptions(category) {
  const itemTypeSelect = document.getElementById('itemTypeSelect');
  const types = itemData[category] || [];
  itemTypeSelect.innerHTML = '<option value="">-- タイプを選択 --</option>';
  
  types.forEach(type => {
    const option = document.createElement("option");
    option.value = type.value;
    option.textContent = type.text;
    itemTypeSelect.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById("categorySelect");
  const itemTypeSelect = document.getElementById("itemTypeSelect");

  if (!categorySelect || !itemTypeSelect) return;

  const savedCategory = localStorage.getItem('itemSelectedCategory');
  const savedType = localStorage.getItem('itemSelectedType');
  
  if (savedCategory && itemData[savedCategory]) {
    categorySelect.value = savedCategory;
    
    updateTypeOptions(savedCategory);
    
    if (savedType) {
      setTimeout(() => {
        if (Array.from(itemTypeSelect.options).some(opt => opt.value === savedType)) {
          itemTypeSelect.value = savedType;
          loadItemMods().then(() => {
            restoreItemTypeState(savedType);
          });
        }
      }, 100);
    }
  }

  categorySelect.addEventListener("change", () => {
    const selectedCategory = categorySelect.value;
    if (!selectedCategory) return;
    
    localStorage.setItem('itemSelectedCategory', selectedCategory);
    
    const currentType = itemTypeSelect.value;
    if (currentType) {
      saveItemTypeState(currentType);
    }
    
    updateTypeOptions(selectedCategory);
    
    itemCheckedMods.clear();
    updateSeparatedItemModLists();
    updateCombinedItemRegex();
  });

  itemTypeSelect.addEventListener("change", function() {
    const newType = this.value;
    if (!newType) return;
    
    const previousType = this.previousValue;
    if (previousType) {
      saveItemTypeState(previousType);
    }
    
    localStorage.setItem('itemSelectedType', newType);
    
    loadItemMods().then(() => {
      restoreItemTypeState(newType);
    });
    
    this.previousValue = newType;
  });

  const itemTabLink = document.querySelector('a[data-tab="itemContent"]');
  if (itemTabLink) {
    itemTabLink.addEventListener('click', initializeItemMods);
  }
  
  document.getElementById('itemProfileList').addEventListener('change', function() {
    if (this.value) loadItemProfile();
  });
  
  initializeItemMods();
});
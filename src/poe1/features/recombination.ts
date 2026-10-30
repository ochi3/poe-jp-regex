let rawItemMods: AffixMod[] = [];
let itemCheckedMods: Set<string> = new Set<string>();
let itemProfiles: ProfileDictionary<AffixProfile> = {};
let currentItemModalGroup = null;
let itemModalSelectedMods: Set<string> = new Set<string>();
window.rawItemMods = [];

/** リコンビModの表示用テキスト（効果文） */
function getRecombModDisplayText(mod: AffixMod) {
  if (!mod) return '';
  if (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
    return mod.engText || mod.text || mod.engName || mod.name || '';
  }
  return mod.text || mod.name || '';
}

/** リコンビModの表示用・Regex用接辞名 */
function getRecombModDisplayName(mod: AffixMod) {
  if (!mod) return '';
  if (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
    return mod.engName || mod.name || '';
  }
  return mod.name || '';
}

/** グループ検索用（日英両方を対象） */
function getRecombGroupSearchText(group: AffixGroup) {
  const parts = [group.baseKey, group.familyName];
  (group.mods || []).forEach(mod => {
    parts.push(mod.name, mod.text, mod.engName, mod.engText, mod.family);
  });
  return parts.filter(Boolean).join(' ').toLowerCase();
}

// アイテムデータ
const itemData = {
  jewel: [
  {
    "value": "jewel_str",
    "text": "クリムゾンジュエル"
  },
  {
    "value": "jewel_dex",
    "text": "ビリジアンジュエル"
  },
  {
    "value": "jewel_int",
    "text": "コバルトジュエル"
  },
  {
    "value": "jewel_abyssmelee",
    "text": "凶暴な眼のジュエル"
  },
  {
    "value": "jewel_abyssranged",
    "text": "探索する眼のジュエル"
  },
  {
    "value": "jewel_abysscaster",
    "text": "催眠の眼のジュエル"
  },
  {
    "value": "jewel_abysssummoner",
    "text": "恐怖の眼のジュエル"
  },
  {
    "value": "jewel_abyssconglomerate",
    "text": "集合体の眼のジュエル"
  },
  {
    "value": "jewel_passivetreeexpansionlarge",
    "text": "クラスタージュエル (大)"
  },
  {
    "value": "jewel_passivetreeexpansionmedium",
    "text": "クラスタージュエル (中)"
  },
  {
    "value": "jewel_passivetreeexpansionsmall",
    "text": "クラスタージュエル (小)"
  }
],
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
  "jewel_str": "data/poe1/items/jewel_str.json",
  "jewel_dex": "data/poe1/items/jewel_dex.json",
  "jewel_int": "data/poe1/items/jewel_int.json",
  "jewel_abyssmelee": "data/poe1/items/jewel_abyssmelee.json",
  "jewel_abyssranged": "data/poe1/items/jewel_abyssranged.json",
  "jewel_abysscaster": "data/poe1/items/jewel_abysscaster.json",
  "jewel_abysssummoner": "data/poe1/items/jewel_abysssummoner.json",
  "jewel_abyssconglomerate": "data/poe1/items/jewel_abyssconglomerate.json",
  "jewel_passivetreeexpansionlarge": "data/poe1/items/jewel_passivetreeexpansionlarge.json",
  "jewel_passivetreeexpansionmedium": "data/poe1/items/jewel_passivetreeexpansionmedium.json",
  "jewel_passivetreeexpansionsmall": "data/poe1/items/jewel_passivetreeexpansionsmall.json",
  // 片手武器
  'claw': 'data/poe1/items/top_tier_base_item_type,claw,one_hand_weapon,onehand,weapon,default.json',
  'dagger': 'data/poe1/items/dagger,attack_dagger,one_hand_weapon,onehand,weapon,default.json',
  'wand': 'data/poe1/items/wand,ranged,one_hand_weapon,onehand,weapon,default.json',
  'minionwand': 'data/poe1/items/weapon_can_roll_minion_modifiers,wand,ranged,one_hand_weapon,onehand,weapon,default.json',
  'one_hand_sword': 'data/poe1/items/sword,one_hand_weapon,onehand,weapon,default.json',
  'thrusting_sword': 'data/poe1/items/rapier,sword,one_hand_weapon,onehand,weapon,default.json',
  'one_hand_axe': 'data/poe1/items/axe,one_hand_weapon,onehand,weapon,default.json',
  'one_hand_mace': 'data/poe1/items/mace,one_hand_weapon,onehand,weapon,default.json',
  'sceptre': 'data/poe1/items/sceptre,sceptre,one_hand_weapon,onehand,weapon,default.json',
  'runic_dagger': 'data/poe1/items/dagger,one_hand_weapon,onehand,weapon,default.json',

  // 両手武器
  'bow': 'data/poe1/items/bow,ranged,two_hand_weapon,twohand,weapon,default.json',
  'staff': 'data/poe1/items/staff,two_hand_weapon,twohand,weapon,default.json',
  'two_hand_sword': 'data/poe1/items/sword,two_hand_weapon,twohand,weapon,default.json',
  'two_hand_axe': 'data/poe1/items/axe,two_hand_weapon,twohand,weapon,default.json',
  'two_hand_mace': 'data/poe1/items/mace,two_hand_weapon,twohand,weapon,default.json',
  'warstaff': 'data/poe1/items/warstaff,staff,attack_staff,two_hand_weapon,twohand,weapon,default.json',
  'fishing_rod': 'data/poe1/items/not_for_sale,fishing_rod,twohand,weapon,default.json',

  // 宝飾品
  'amulet': 'data/poe1/items/amulet,default.json',
  'ring': 'data/poe1/items/ring,default.json',
  'belt': 'data/poe1/items/belt,default.json',

  // 手袋
  'gloves_str': 'data/poe1/items/str_armour,gloves,armour,default.json',
  'gloves_dex': 'data/poe1/items/dex_armour,gloves,armour,default.json',
  'gloves_int': 'data/poe1/items/int_armour,gloves,armour,default.json',
  'gloves_str_dex': 'data/poe1/items/str_dex_armour,gloves,armour,default.json',
  'gloves_str_int': 'data/poe1/items/str_int_armour,gloves,armour,default.json',
  'gloves_dex_int': 'data/poe1/items/dex_int_armour,gloves,armour,default.json',

// 靴
  'boots_str': 'data/poe1/items/str_armour,boots,armour,default.json',
  'boots_dex': 'data/poe1/items/dex_armour,boots,armour,default.json',
  'boots_int': 'data/poe1/items/int_armour,boots,armour,default.json',
  'boots_str_dex': 'data/poe1/items/str_dex_armour,boots,armour,default.json',
  'boots_str_int': 'data/poe1/items/str_int_armour,boots,armour,default.json',
  'boots_dex_int': 'data/poe1/items/dex_int_armour,boots,armour,default.json',

  // 鎧
  'body_armour_str': 'data/poe1/items/str_armour,body_armour,armour,default.json',
  'body_armour_dex': 'data/poe1/items/dex_armour,body_armour,armour,default.json',
  'body_armour_int': 'data/poe1/items/int_armour,body_armour,armour,default.json',
  'body_armour_str_dex': 'data/poe1/items/str_dex_armour,body_armour,armour,default.json',
  'body_armour_str_int': 'data/poe1/items/str_int_armour,body_armour,armour,default.json',
  'body_armour_dex_int': 'data/poe1/items/dex_int_armour,body_armour,armour,default.json',
  'body_armour_str_dex_int': 'data/poe1/items/str_dex_int_armour,body_armour,armour,default.json',

// 兜
  'helmet_str': 'data/poe1/items/str_armour,helmet,armour,default.json',
  'helmet_dex': 'data/poe1/items/dex_armour,helmet,armour,default.json',
  'helmet_int': 'data/poe1/items/int_armour,helmet,armour,default.json',
  'helmet_str_dex': 'data/poe1/items/str_dex_armour,helmet,armour,default.json',
  'helmet_str_int': 'data/poe1/items/str_int_armour,helmet,armour,default.json',
  'helmet_dex_int': 'data/poe1/items/dex_int_armour,helmet,armour,default.json',

  // オフハンド
  'quiver': 'data/poe1/items/quiver,default.json',
  'shield_str': 'data/poe1/items/str_armour,str_shield,shield,armour,default.json',
  'shield_dex': 'data/poe1/items/dex_armour,dex_shield,shield,armour,default.json',
  'shield_int': 'data/poe1/items/int_armour,focus,shield,armour,default.json',
  'shield_str_dex': 'data/poe1/items/str_dex_armour,str_dex_shield,shield,armour,default.json',
  'shield_str_int': 'data/poe1/items/str_int_armour,str_int_shield,shield,armour,default.json',
  'shield_dex_int': 'data/poe1/items/dex_int_armour,dex_int_shield,shield,armour,default.json'
};

// アイテムMod読み込み
async function loadItemMods() {
  const itemTypeSelect = getElement('itemTypeSelect');
  const statusElement = getElement('itemModLoadingStatus');
  
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
    
    const rawData: AffixData = await response.json();
    
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
    if (rawData.scopeNote) statusElement.textContent += ' ' + rawData.scopeNote;
    statusElement.style.color = "#4CAF50";
    
    updateSeparatedItemModLists();
    updateCombinedItemRegex();

    window.rawItemMods = rawItemMods;
    try {
      writeStoredJson('itemModsData', rawItemMods);
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
  const savedStates = readStoredJson('itemTypeStates');
  if (savedStates[itemType]) {
    itemCheckedMods = new Set(savedStates[itemType]);
    updateSeparatedItemModLists();
    updateCombinedItemRegex();
  }
}

function saveItemTypeState(itemType) {
  const savedStates = readStoredJson('itemTypeStates');
  savedStates[itemType] = Array.from(itemCheckedMods);
  writeStoredJson('itemTypeStates', savedStates);
}

function updateSeparatedItemModLists() {
  const prefixListDiv = getElement('prefixModList');
  const suffixListDiv = getElement('suffixModList');
  
  if (!prefixListDiv || !suffixListDiv) {
    console.error('アイテムPrefix/Suffixリスト要素が見つかりません');
    return;
  }
  
  const currentSearchTerm = getElement('itemModSearch').value.toLowerCase();
  
  prefixListDiv.innerHTML = '';
  suffixListDiv.innerHTML = '';

  if (!rawItemMods || rawItemMods.length === 0) {
    const message = '<div style="color: #888; text-align: center; padding: 20px;">Modデータが読み込まれていません</div>';
    prefixListDiv.innerHTML = message;
    suffixListDiv.innerHTML = message;
    return;
  }

  const { prefixGroups, suffixGroups } = groupAndSeparateMods(rawItemMods);
  
  const sortGroups = (groups: Record<string, AffixGroup>) => {
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

  if (currentSearchTerm) {
    getElement('itemModSearch').value = currentSearchTerm;
    filterItemMods();
  }
}

function groupAndSeparateMods(mods: AffixMod[]) {
  const prefixGroups: Record<string, AffixGroup> = {};
  const suffixGroups: Record<string, AffixGroup> = {};
  
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

function addGroupToColumn(group: AffixGroup, container: HTMLElement, type: string) {
  const checkedModsSet = type === 'flask' ? flaskCheckedMods : itemCheckedMods;
  const groupItem = document.createElement('div');
  groupItem.className = `mod-group-item ${group.generationType}`;
  groupItem.dataset.groupKey = group.baseKey;
  groupItem.dataset.generationType = group.generationType;
  groupItem.dataset.searchText = getRecombGroupSearchText(group);
  
  const selectedCount = group.mods.filter(mod => checkedModsSet.has(mod.name)).length;
  if (selectedCount > 0) groupItem.classList.add('selected');
  
  const groupHeader = document.createElement('div');
  groupHeader.className = 'mod-group-header';
  
  const groupTitle = document.createElement('span');
  groupTitle.textContent = getRecombModDisplayText(group.highestTierMod);
  
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

function openItemGroupModal(group: AffixGroup) {
  currentItemModalGroup = group;
  itemModalSelectedMods.clear();
  
  group.mods.forEach(mod => {
    if (itemCheckedMods.has(mod.name)) itemModalSelectedMods.add(mod.name);
  });
  
  const modal = getElement('itemModGroupModal');
  const modalTitle = getElement('itemModalTitle');
  const modalModList = getElement('itemModalModList');
  
  const titleColor = group.generationType === 'prefix' ? '#E74C3C' : '#3498DB';
  const titleText = getRecombModDisplayText(group.highestTierMod);
  const affixLabel = group.generationType === 'prefix'
    ? 'Prefix'
    : (typeof currentLanguage !== 'undefined' && currentLanguage === 'en' ? 'Suffix' : '接尾辞');
  modalTitle.innerHTML = `<span style="color: ${titleColor}">${titleText}</span> (${affixLabel})`;
  modalModList.innerHTML = '';
  
  const sortedMods = group.mods.sort((a, b) => (b.required_level || 0) - (a.required_level || 0));
  
  sortedMods.forEach(mod => addModToModal(mod, modalModList, 'item'));
  
  modal.style.display = 'flex';
  
  modal.addEventListener('click', (e) => { if (e.target === modal) closeItemModal(); });
  getElement('closeItemModal').onclick = closeItemModal;
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
  
  checkbox.onchange = function(this: HTMLInputElement) {
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
  modName.textContent = getRecombModDisplayName(mod);
  modName.style.cssText = 'font-weight: bold; min-width: 80px;';
  
  const modDesc = document.createElement('div');
  modDesc.className = 'modal-mod-desc';
  modDesc.textContent = getRecombModDisplayText(mod);
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
  
  const itemType = getElement('itemTypeSelect').value;
  if (itemType) {
    saveItemTypeState(itemType);
  }
  
  closeItemModal();
}

function closeItemModal() {
  const modal = getElement('itemModGroupModal');
  modal.style.display = 'none';
  currentItemModalGroup = null;
  itemModalSelectedMods.clear();
}

function updateCombinedItemRegex() {
  const selectedMods = Array.from(itemCheckedMods);
  const regex = selectedMods.map(modName => {
    const mod = rawItemMods.find(m => m.name === modName);
    return mod ? getRecombModDisplayName(mod) : modName;
  }).join('|');
  const emptyMsg = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en')
    ? 'No mods selected'
    : '選択されたModがありません';
  
  const outputElement = getElement('combinedItemRegexOutput');
  if (outputElement) {
    outputElement.textContent = regex || emptyMsg;
    
    const charCount = regex.length;
    const charCountElement = getElement('itemCharCount');
    if (charCountElement) {
      let maxLevel = 0;
      selectedMods.forEach(modName => {
        const mod = rawItemMods.find(m => m.name === modName);
        if (mod && mod.required_level > maxLevel) {
          maxLevel = mod.required_level;
        }
      });
      
      const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
      charCountElement.innerHTML = isEn ? `Chars: ${charCount}` : `文字数: ${charCount}`;
      if (maxLevel > 0) {
        charCountElement.innerHTML += isEn ? ` | Req Lv: ${maxLevel}` : ` | 必要Lv: ${maxLevel}`;
      }
      
      if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.innerHTML += isEn ? ' (over 250 characters)' : ' (250文字を超えています)';
      } else {
        charCountElement.style.color = '';
      }
    }
  }
}

let currentItemSearchTerm = '';

function filterItemMods() {
  currentItemSearchTerm = getElement('itemModSearch').value.toLowerCase();
  const prefixGroups = document.querySelectorAll<HTMLElement>('#prefixModList .mod-group-item');
  const suffixGroups = document.querySelectorAll<HTMLElement>('#suffixModList .mod-group-item');
  
  let anyVisible = false;
  
  [prefixGroups, suffixGroups].forEach(groups => {
    groups.forEach(group => {
      const searchText = (group.dataset.searchText || '').toLowerCase();
      const groupTitle = group.querySelector<HTMLElement>('.mod-group-header span:first-child').textContent.toLowerCase();
      const groupDesc = group.querySelector<HTMLElement>('.mod-group-desc').textContent.toLowerCase();
      
      const isVisible = !currentItemSearchTerm
        || searchText.includes(currentItemSearchTerm)
        || groupTitle.includes(currentItemSearchTerm)
        || groupDesc.includes(currentItemSearchTerm);
      group.style.display = isVisible ? 'block' : 'none';
      if (isVisible) anyVisible = true;
    });
  });
  
  const containers = [getElement('prefixModList'), getElement('suffixModList')];
  if (!anyVisible && currentItemSearchTerm !== '') {
    containers.forEach(container => {
      const existingMsg = container.querySelector<HTMLElement>('.no-results-message');
      if (!existingMsg) {
        const message = document.createElement('div');
        message.className = 'no-results-message';
        message.style.cssText = 'color: #888; text-align: center; padding: 20px;';
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        message.textContent = isEn
          ? `No mods matching "${currentItemSearchTerm}"`
          : `"${currentItemSearchTerm}" に一致するModが見つかりません`;
        container.appendChild(message);
      }
    });
  } else {
    document.querySelectorAll<HTMLElement>('.no-results-message').forEach(msg => msg.remove());
  }
}

function resetItemMods() {
  itemCheckedMods.clear();
  itemModalSelectedMods.clear();
  updateSeparatedItemModLists();
  updateCombinedItemRegex();
  saveItemModCheckboxState();
  
  const itemType = getElement('itemTypeSelect').value;
  if (itemType) {
    saveItemTypeState(itemType);
  }
}

function copyItemRegex() {
  const regex = getElement('combinedItemRegexOutput').textContent;
  const emptyMsgs = ['選択されたModがありません', 'No mods selected'];
  if (regex && !emptyMsgs.includes(regex)) {
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
  writeStoredJson('itemModCheckboxState', Array.from(itemCheckedMods));
}

function loadItemModCheckboxState() {
  const saved = readStoredText('itemModCheckboxState');
  if (saved) itemCheckedMods = new Set(readStoredJson('itemModCheckboxState'));
}

function saveItemProfile() {
  const profileName = getElement('itemProfileName').value.trim();
  if (!profileName) { 
    showNotification('プロファイル名を入力してください', true);
    return; 
  }

  itemProfiles[profileName] = {
    mods: Array.from(itemCheckedMods),
    itemType: getElement('itemTypeSelect').value,
    category: getElement('categorySelect').value,
    timestamp: Date.now()
  };

  if (!writeStoredJson('itemProfiles', itemProfiles)) return false;
  updateItemProfileList();
  showNotification(`"${profileName}" を保存しました`);
  
  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function loadItemProfile() {
  const profileName = getElement('itemProfileList').value;
  if (!profileName || !itemProfiles[profileName]) { 
    showNotification('プロファイルを選択してください', true);
    return; 
  }

  const profile = itemProfiles[profileName];
  
  const categorySelect = getElement('categorySelect');
  categorySelect.value = profile.category;
  
  updateTypeOptions(profile.category);
  
  const itemTypeSelect = getElement('itemTypeSelect');
  itemTypeSelect.value = profile.itemType;
  
  getElement('itemProfileName').value = profileName;
  
  loadItemMods().then(() => {
    itemCheckedMods.clear();
    profile.mods.forEach(mod => itemCheckedMods.add(mod));
    updateSeparatedItemModLists();
    updateCombinedItemRegex();
    showNotification(`"${profileName}" を読み込みました`);
  });
}

function deleteItemProfile() {
  const profileName = getElement('itemProfileList').value;
  if (!profileName || !confirm(`${profileName}を削除しますか？`)) return;

  delete itemProfiles[profileName];
  if (!writeStoredJson('itemProfiles', itemProfiles)) return false;
  updateItemProfileList();
  getElement('itemProfileName').value = '';
  showNotification(`"${profileName}" を削除しました`);
  
  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function updateItemProfileList() {
  const select = getElement('itemProfileList');
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(itemProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function initializeItemMods() {
  const savedProfiles = readStoredText('itemProfiles');
  if (savedProfiles) {
    itemProfiles = readStoredJson('itemProfiles');
    updateItemProfileList();
  }
  
  loadItemModCheckboxState();
  
  const savedCategory = readStoredText('itemSelectedCategory');
  const savedType = readStoredText('itemSelectedType');
  const categorySelect = getElement('categorySelect');
  const itemTypeSelect = getElement('itemTypeSelect');
  
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
  const itemTypeSelect = getElement('itemTypeSelect');
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
  const categorySelect = getElement("categorySelect");
  const itemTypeSelect = getElement("itemTypeSelect");

  if (!categorySelect || !itemTypeSelect) return;

  const savedCategory = readStoredText('itemSelectedCategory');
  const savedType = readStoredText('itemSelectedType');
  
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
    
    writeStoredText('itemSelectedCategory', String(selectedCategory));
    
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
    
    writeStoredText('itemSelectedType', String(newType));
    
    loadItemMods().then(() => {
      restoreItemTypeState(newType);
    });
    
    this.previousValue = newType;
  });

  const itemTabLink = document.querySelector<HTMLElement>('a[data-tab="itemContent"]');
  if (itemTabLink) {
    itemTabLink.addEventListener('click', initializeItemMods);
  }
  
  getElement('itemProfileList').addEventListener('change', function() {
    if (this.value) loadItemProfile();
  });
  
  initializeItemMods();
});

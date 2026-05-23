let vendorInitialized = false;
let vendorInitPromise = null;

function labelToRegexPart(label) {
  return label.replace(/\+$/, '').replace(/#/g, '.*');
}

function toWeaponRegexPart(label) {
  return `: ${String(label).replace(/^: /, '')}`;
}

const WEAPON_GROUPS = [
  {
    name: '片手武器',
    items: [
      { key: 'claw', label: '鉤爪' },
      { key: 'dagger', label: '短剣' },
      { key: 'wand', label: 'ワンド' },
      { key: 'oneHandSword', label: '片手剣' },
      { key: 'oneHandAxe', label: '片手斧' },
      { key: 'oneHandMace', label: '片手メイス' },
      { key: 'sceptre', label: 'セプター' },
      { key: 'spear', label: 'スピア' },
      { key: 'flail', label: 'フレイル' },
    ]
  },
  {
    name: '両手武器',
    items: [
      { key: 'bow', label: '弓' },
      { key: 'staff', label: 'スタッフ' },
      { key: 'twoHandSword', label: '両手剣' },
      { key: 'twoHandAxe', label: '両手斧' },
      { key: 'twoHandMace', label: '両手メイス' },
      { key: 'quarterstaff', label: 'クォータースタッフ' },
      { key: 'fishingRod', label: '釣り竿' },
      { key: 'crossbow', label: 'クロスボウ' },
      { key: 'trap', label: 'トラップ' },
      { key: 'talisman', label: 'タリスマン' },
    ]
  },
  {
    name: 'オフハンド',
    items: [
      { key: 'quiver', label: '矢筒' },
      { key: 'shield', label: '盾' },
      { key: 'buckler', label: 'バックラー' },
      { key: 'focus', label: 'フォーカス' },
    ]
  },
];

const WEAPON_OPTIONS = WEAPON_GROUPS.flatMap(group => group.items);

const weaponMapping = Object.fromEntries(
  WEAPON_OPTIONS.map(({ key, label }) => [key, toWeaponRegexPart(label)])
);

function createDefaultWeaponSettings() {
  const weapon = {};
  const excludeWeapons = {};
  WEAPON_OPTIONS.forEach(({ key }) => {
    weapon[key] = false;
    excludeWeapons[key] = false;
  });
  return { weapon, excludeWeapons };
}

let vendorSettings = {
  selected: {},
  ...createDefaultWeaponSettings()
};

let vendorProfiles = {};

function createMovementSpeedItems() {
  const items = [
    { id: 'move_all', label: 'ALL', regex: '移動スピ' },
  ];
  for (let pct = 10; pct <= 30; pct += 5) {
    items.push({
      id: `move_${pct}`,
      label: `${pct}%`,
      regex: `移動スピードが${pct}%増加する`,
    });
  }
  return items;
}

const VENDOR_GROUPS = [
  {
    name: '性質',
    items: [
      { id: 'prop_quality', label: '品質', regex: '品質:' },
      { id: 'prop_sockets', label: 'ソケット', regex: 'ソケット:' },
    ]
  },
  {
    name: 'スピード',
    items: [
      { id: 'speed_attack', label: 'アタックスピード', regex: 'ックスピ' },
      { id: 'speed_cast', label: 'キャストスピード', regex: 'ストスピ' },
    ]
  },
  {
    name: '移動速度',
    items: createMovementSpeedItems(),
  },
  {
    name: '共通',
    items: [
      { id: 'common_str', label: '筋力', regex: '筋力 +' },
      { id: 'common_dex', label: '器用さ', regex: '器用さ +' },
      { id: 'common_int', label: '知性', regex: '知性 +' },
      { id: 'common_max_life', label: '最大ライフ', regex: '大ライ' },
      { id: 'common_resist', label: '耐性', regex: '耐性' },
      { id: 'common_spirit', label: 'スピリット', regex: 'リット +' },
    ]
  },
  {
    name: 'ダメージMOD',
    items: [
      { id: 'build_phys_pct', label: '物理ダメージが#%増加する', regex: '理ダ.*増' },
      { id: 'build_phys_add', label: '物理ダメージを追加する', regex: '理.*ジを追' },
      { id: 'build_fire_add', label: '火ダメージを追加する', regex: '火.*ジを追' },
      { id: 'build_cold_add', label: '冷気ダメージを追加する', regex: '気.*ジを追' },
      { id: 'build_lightning_add', label: '雷ダメージを追加する', regex: '雷.*ジを追' },
      { id: 'build_phys_attack_add', label: '物理ダメージをアタックに追加', regex: '理ダ.*をア' },
      { id: 'build_fire_attack_add', label: '火ダメージをアタックに追加', regex: '火ダ.*をア' },
      { id: 'build_cold_attack_add', label: '冷気ダメージをアタックに追加', regex: '気ダ.*をア' },
      { id: 'build_lightning_attack_add', label: '雷ダメージをアタックに追加', regex: '雷ダ.*をア' },
    ]
  },
  {
    name: 'ジェムレベル',
    items: [
      { id: 'build_melee_level', label: '全ての近接スキルのレベル+', regex: 'の近接ス' },
      { id: 'build_projectile_level', label: '全ての投射物スキルのレベル+', regex: 'の投射物ス' },
      { id: 'build_spell_level', label: '全てのスペルスキル+', regex: '全てのス' },
      { id: 'build_fire_spell', label: '火スペルスキル+', regex: 'の火スペ' },
      { id: 'build_cold_spell', label: '冷気スペルスキル+', regex: 'の冷気スペ' },
      { id: 'build_lightning_spell', label: '雷スペルスキル+', regex: 'の雷スペ' },
      { id: 'build_chaos_spell', label: '混沌スペルスキル+', regex: 'の混沌スペ' },
      { id: 'build_physical_spell', label: '物理スペルスキル+', regex: 'の物理スペ' },
      { id: 'build_minion_skill', label: 'ミニオンスキル+', regex: '全てのミニ' },
    ]
  },
];

const VENDOR_COLUMNS = [
  { className: 'half-width', groupNames: ['性質', 'スピード', '移動速度', '共通'] },
  { className: 'half-width', groupNames: ['ダメージMOD', 'ジェムレベル'] },
  { className: 'vendor-weapon-column', groupNames: ['武器', 'NG武器'] }
];

const vendorItemMap = {};
VENDOR_GROUPS.forEach(group => {
  group.items.forEach(item => {
    vendorItemMap[item.id] = { ...item, group: group.name };
  });
});

function getItemRegexPart(item) {
  return item.regex ?? labelToRegexPart(item.label);
}

function getSelectedItems(settings = vendorSettings) {
  const selected = settings?.selected || {};
  return Object.entries(selected)
    .filter(([, value]) => value)
    .map(([id]) => vendorItemMap[id])
    .filter(Boolean);
}

function generateVendorRegex() {
  const settings = vendorSettings;
  const parts = getSelectedItems(settings).map(item => getItemRegexPart(item));

  const weapons = [];
  Object.entries(settings.weapon || {}).forEach(([key, value]) => {
    if (value && weaponMapping[key]) weapons.push(weaponMapping[key]);
  });
  if (weapons.length > 0) parts.push(weapons.join('|'));

  const mainRegex = parts.join('|');
  const excludeWeapons = [];
  Object.entries(settings.excludeWeapons || {}).forEach(([key, value]) => {
    if (value && weaponMapping[key]) excludeWeapons.push(weaponMapping[key]);
  });

  if (mainRegex && excludeWeapons.length > 0) {
    return `"${mainRegex}" "!.*(?:${excludeWeapons.join('|')})"`;
  }
  if (mainRegex) return `"${mainRegex}"`;
  if (excludeWeapons.length > 0) return `"!.*(?:${excludeWeapons.join('|')})"`;
  return '';
}

function updateVendorRegex() {
  const regex = generateVendorRegex();
  const output = document.getElementById('vendorRegexOutput');
  if (output) output.textContent = regex || '';
  updateVendorCharCount();
  saveVendorSettings();
}

function updateVendorCharCount() {
  const result = document.getElementById('vendorRegexOutput')?.textContent || '';
  const charCount = result.length;
  const charCountElement = document.getElementById('vendorCharCount');

  if (charCountElement) {
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
      charCountElement.style.color = 'red';
      charCountElement.textContent += ' (250文字を超えています)';
    } else {
      charCountElement.style.color = '';
    }
  }
}

function copyVendorRegex() {
  const regex = document.getElementById('vendorRegexOutput')?.textContent || '';
  if (regex) {
    navigator.clipboard.writeText(regex)
      .then(() => showNotification('コピーしました！'))
      .catch(err => {
        console.error('コピー失敗:', err);
        showNotification('❌ コピー失敗', true);
      });
  } else {
    showNotification('コピーする内容がありません', true);
  }
}

function resetVendorSettings() {
  vendorSettings = {
    selected: {},
    ...createDefaultWeaponSettings()
  };
  document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  updateVendorRegex();
  localStorage.removeItem('poe2_vendorSettings');
  showNotification('ベンダー設定をリセットしました');
}

function saveVendorSettings() {
  localStorage.setItem('poe2_vendorSettings', JSON.stringify(vendorSettings));
}

function loadVendorSettings() {
  const saved = localStorage.getItem('poe2_vendorSettings');
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    const defaults = createDefaultWeaponSettings();
    vendorSettings = {
      selected: parsed.selected || {},
      weapon: { ...defaults.weapon, ...parsed.weapon },
      excludeWeapons: { ...defaults.excludeWeapons, ...parsed.excludeWeapons }
    };
    applyVendorSettings();
  } catch (e) {
    console.error('設定の読み込みエラー:', e);
  }
}

function applyVendorSettings() {
  document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(checkbox => {
    const vendorId = checkbox.dataset.vendorId;
    if (vendorId) {
      checkbox.checked = !!vendorSettings.selected[vendorId];
      return;
    }

    const id = checkbox.id.replace('vendor-', '');
    if (id.startsWith('weapon-')) {
      const weaponKey = id.replace('weapon-', '');
      checkbox.checked = vendorSettings.weapon?.[weaponKey] || false;
    } else if (id.startsWith('exclude-')) {
      const excludeKey = id.replace('exclude-', '');
      checkbox.checked = vendorSettings.excludeWeapons?.[excludeKey] || false;
    }
  });
  updateVendorRegex();
}

function handleVendorCheckboxChange(checkbox) {
  const vendorId = checkbox.dataset.vendorId;
  if (vendorId) {
    vendorSettings.selected[vendorId] = checkbox.checked;
  } else {
    const id = checkbox.id.replace('vendor-', '');
    if (id.startsWith('weapon-')) {
      vendorSettings.weapon[id.replace('weapon-', '')] = checkbox.checked;
    } else if (id.startsWith('exclude-')) {
      vendorSettings.excludeWeapons[id.replace('exclude-', '')] = checkbox.checked;
    }
  }
  updateVendorRegex();
}

function setupVendorEventListeners() {
  document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(checkbox => {
    if (checkbox.hasEventListener) return;
    checkbox.addEventListener('change', function() {
      handleVendorCheckboxChange(this);
    });
    checkbox.hasEventListener = true;
  });
}

function createVendorCheckboxRow(labelText, checkbox) {
  const row = document.createElement('div');
  row.style.marginBottom = '8px';

  const label = document.createElement('label');
  label.className = 'input-label';
  label.style.fontSize = '0.9em';
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(` ${labelText}`));
  row.appendChild(label);
  return row;
}

function createVendorItemCheckbox(item) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `vendor-item-${item.id}`;
  checkbox.dataset.vendorId = item.id;
  checkbox.checked = !!vendorSettings.selected[item.id];
  return checkbox;
}

function createWeaponCheckbox(weapon, isExclude) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = isExclude ? `vendor-exclude-${weapon.key}` : `vendor-weapon-${weapon.key}`;
  if (isExclude) {
    checkbox.checked = vendorSettings.excludeWeapons?.[weapon.key] || false;
  } else {
    checkbox.checked = vendorSettings.weapon?.[weapon.key] || false;
  }
  return checkbox;
}

function createVendorPercentGrid(group) {
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px;';

  group.items.forEach(item => {
    const label = document.createElement('label');
    label.className = 'input-label';
    label.style.fontSize = '0.9em';
    label.appendChild(createVendorItemCheckbox(item));
    label.appendChild(document.createTextNode(` ${item.label}`));
    grid.appendChild(label);
  });

  return grid;
}

function buildWeaponGroupsUI(isExclude) {
  const container = document.createDocumentFragment();

  WEAPON_GROUPS.forEach((group, groupIndex) => {
    const subTitle = document.createElement('h4');
    subTitle.textContent = group.name;
    subTitle.style.cssText = groupIndex === 0
      ? 'color: var(--accent-primary); font-size: 0.85em; margin: 0 0 8px; font-weight: 600;'
      : 'color: var(--accent-primary); font-size: 0.85em; margin: 12px 0 8px; font-weight: 600;';
    container.appendChild(subTitle);

    const grid = document.createElement('div');
    grid.className = 'vendor-weapon-grid';
    group.items.forEach(weapon => {
      const label = document.createElement('label');
      label.className = 'input-label';
      label.appendChild(createWeaponCheckbox(weapon, isExclude));
      label.appendChild(document.createTextNode(` ${weapon.label}`));
      grid.appendChild(label);
    });
    container.appendChild(grid);
  });

  return container;
}

function buildCategorySection(groupName, isFirstInColumn) {
  if (groupName === '武器') {
    const section = document.createElement('div');
    section.className = 'vendor-weapon-section';

    const title = document.createElement('h3');
    title.textContent = '武器ベース';
    title.style.cssText = 'color: var(--accent-primary); border-bottom: 2px solid var(--accent-primary);';
    section.appendChild(title);

    const note = document.createElement('p');
    note.textContent = '選択した武器タイプは、ソケットやリンクに関係なく常にハイライトされます';
    note.style.cssText = 'color: #FCA5A5;';
    section.appendChild(note);

    section.appendChild(buildWeaponGroupsUI(false));
    return section;
  }

  if (groupName === 'NG武器') {
    const section = document.createElement('div');
    section.className = 'vendor-weapon-section';

    const title = document.createElement('h3');
    title.textContent = 'NG武器ベース（除外）';
    title.className = 'vendor-ng-title';
    title.style.cssText = 'color: #FCA5A5; border-bottom: 2px solid #FCA5A5;';
    section.appendChild(title);

    const note = document.createElement('p');
    note.textContent = '選択した武器タイプを除外します（これらの武器はハイライトされません）';
    note.style.cssText = 'color: #FCA5A5;';
    section.appendChild(note);

    section.appendChild(buildWeaponGroupsUI(true));
    return section;
  }

  const group = VENDOR_GROUPS.find(entry => entry.name === groupName);
  if (!group) return null;

  const section = document.createElement('div');

  const title = document.createElement('h3');
  title.textContent = group.name;
  title.style.cssText = 'color: var(--accent-primary); margin-bottom: 16px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 8px;';
  if (!isFirstInColumn) {
    title.style.marginTop = '24px';
  }
  section.appendChild(title);

  if (groupName === '移動速度') {
    section.appendChild(createVendorPercentGrid(group));
  } else {
    group.items.forEach(item => {
      section.appendChild(createVendorCheckboxRow(item.label, createVendorItemCheckbox(item)));
    });
  }

  return section;
}

function buildVendorGroupsUI() {
  const container = document.getElementById('vendorGroupsContainer');
  if (!container) return;

  container.innerHTML = '';

  const columnsWrapper = document.createElement('div');
  columnsWrapper.className = 'three-columns';

  VENDOR_COLUMNS.forEach(column => {
    const columnEl = document.createElement('div');
    if (column.className) columnEl.className = column.className;

    column.groupNames.forEach((groupName, index) => {
      const section = buildCategorySection(groupName, index === 0);
      if (section) columnEl.appendChild(section);
    });

    columnsWrapper.appendChild(columnEl);
  });

  container.appendChild(columnsWrapper);
}

function saveVendorProfile() {
  const profileName = document.getElementById('vendorProfileName').value.trim();
  if (!profileName) {
    showNotification('プロファイル名を入力してください', true);
    return;
  }

  if (vendorProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか?`)) {
    return;
  }

  vendorProfiles[profileName] = {
    settings: JSON.parse(JSON.stringify(vendorSettings)),
    timestamp: Date.now()
  };

  localStorage.setItem('poe2_vendorProfiles', JSON.stringify(vendorProfiles));
  updateVendorProfileList();
  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('vendorProfileName').value = '';

  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function loadVendorProfile() {
  const profileName = document.getElementById('vendorProfileList').value;
  if (!profileName) {
    document.getElementById('vendorProfileName').value = '';
    return;
  }
  if (!vendorProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const defaults = createDefaultWeaponSettings();
    const profileSettings = vendorProfiles[profileName].settings;
    vendorSettings = {
      selected: profileSettings.selected || {},
      weapon: { ...defaults.weapon, ...profileSettings.weapon },
      excludeWeapons: { ...defaults.excludeWeapons, ...profileSettings.excludeWeapons }
    };
    applyVendorSettings();
    document.getElementById('vendorProfileName').value = profileName;
    showNotification(`"${profileName}" を読み込みました`);
  } catch (error) {
    console.error('プロファイル読み込みエラー:', error);
    showNotification('プロファイルの読み込みに失敗しました', true);
  }
}

function deleteVendorProfile() {
  const profileName = document.getElementById('vendorProfileList').value;
  if (!profileName || !vendorProfiles[profileName]) {
    showNotification('削除するプロファイルを選択してください', true);
    return;
  }

  if (confirm(`本当に "${profileName}" を削除しますか?`)) {
    delete vendorProfiles[profileName];
    localStorage.setItem('poe2_vendorProfiles', JSON.stringify(vendorProfiles));
    updateVendorProfileList();
    document.getElementById('vendorProfileName').value = '';
    showNotification(`"${profileName}" を削除しました`);

    if (typeof updateSavedRegexDisplay === 'function') {
      updateSavedRegexDisplay();
    }
  }
}

function updateVendorProfileList() {
  const select = document.getElementById('vendorProfileList');
  if (!select) return;

  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(vendorProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function loadVendorProfileDirectly(profileName) {
  initializeVendor().then(() => {
    const profile = vendorProfiles[profileName];
    if (!profile) {
      showNotification('プロファイルが見つかりません', true);
      return;
    }

    const defaults = createDefaultWeaponSettings();
    const profileSettings = profile.settings;
    vendorSettings = {
      selected: profileSettings.selected || {},
      weapon: { ...defaults.weapon, ...profileSettings.weapon },
      excludeWeapons: { ...defaults.excludeWeapons, ...profileSettings.excludeWeapons }
    };
    applyVendorSettings();

    const profileNameInput = document.getElementById('vendorProfileName');
    const profileList = document.getElementById('vendorProfileList');
    if (profileNameInput) profileNameInput.value = profileName;
    if (profileList) profileList.value = profileName;

    showNotification(`"${profileName}" を読み込みました`);
  });
}

function generateVendorRegexFromProfile(profile) {
  if (!profile || !profile.settings) return '(無効なプロファイル)';

  const originalSettings = JSON.parse(JSON.stringify(vendorSettings));
  try {
    const defaults = createDefaultWeaponSettings();
    const profileSettings = profile.settings;
    vendorSettings = {
      selected: profileSettings.selected || {},
      weapon: { ...defaults.weapon, ...profileSettings.weapon },
      excludeWeapons: { ...defaults.excludeWeapons, ...profileSettings.excludeWeapons }
    };
    return generateVendorRegex() || '(空のRegex)';
  } catch (error) {
    console.error('Error generating vendor regex from profile:', error);
    return '(エラー: Regex生成失敗)';
  } finally {
    vendorSettings = originalSettings;
  }
}

function getVendorItemLabel(itemId) {
  return vendorItemMap[itemId]?.label || itemId;
}

function getWeaponLabel(weaponKey) {
  const weapon = WEAPON_OPTIONS.find(item => item.key === weaponKey);
  return weapon ? weapon.label : weaponKey;
}

function initializeVendor() {
  if (vendorInitialized) {
    return Promise.resolve();
  }

  if (vendorInitPromise) {
    return vendorInitPromise;
  }

  vendorInitPromise = new Promise((resolve) => {
    const savedProfiles = localStorage.getItem('poe2_vendorProfiles');
    if (savedProfiles) {
      try {
        vendorProfiles = JSON.parse(savedProfiles);
        updateVendorProfileList();
      } catch (e) {
        console.error('プロファイル読み込みエラー:', e);
        vendorProfiles = {};
      }
    }

    const profileList = document.getElementById('vendorProfileList');
    if (profileList && !profileList.hasEventListener) {
      profileList.addEventListener('change', function() {
        if (this.value) loadVendorProfile();
        else document.getElementById('vendorProfileName').value = '';
      });
      profileList.hasEventListener = true;
    }

    buildVendorGroupsUI();
    setupVendorEventListeners();
    loadVendorSettings();
    updateVendorRegex();

    window.applyVendorSettings = applyVendorSettings;
    window.updateVendorRegex = updateVendorRegex;
    window.loadVendorProfileDirectly = loadVendorProfileDirectly;
    window.generateVendorRegexFromProfile = generateVendorRegexFromProfile;
    window.getVendorItemLabel = getVendorItemLabel;
    window.getWeaponLabel = getWeaponLabel;
    window.vendorSettings = vendorSettings;
    window.VENDOR_GROUPS = VENDOR_GROUPS;
    window.VENDOR_COLUMNS = VENDOR_COLUMNS;
    window.WEAPON_OPTIONS = WEAPON_OPTIONS;
    window.WEAPON_GROUPS = WEAPON_GROUPS;

    vendorInitialized = true;
    resolve();
  });

  return vendorInitPromise;
}

function handleVendorTabActivation() {
  initializeVendor().catch(error => {
    console.error('Vendor initialization error:', error);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const vendorTab = document.querySelector('a[data-tab="vendorContent"]');
  if (vendorTab && !vendorTab.hasEventListener) {
    vendorTab.addEventListener('click', function() {
      setTimeout(handleVendorTabActivation, 100);
    });
    vendorTab.hasEventListener = true;
  }

  const vendorContentElem = document.getElementById('vendorContent');
  if (window.location.hash === '#vendor' ||
      (vendorContentElem && vendorContentElem.style.display === 'block')) {
    setTimeout(handleVendorTabActivation, 200);
  }

  if (!window.vendorHashChangeHandler) {
    window.vendorHashChangeHandler = function() {
      if (window.location.hash === '#vendor') {
        setTimeout(handleVendorTabActivation, 100);
      }
    };
    window.addEventListener('hashchange', window.vendorHashChangeHandler);
  }
});

window.copyVendorRegex = copyVendorRegex;
window.resetVendorSettings = resetVendorSettings;
window.initializeVendor = initializeVendor;
window.saveVendorProfile = saveVendorProfile;
window.loadVendorProfile = loadVendorProfile;
window.deleteVendorProfile = deleteVendorProfile;
window.generateVendorRegex = generateVendorRegex;
window.generateVendorRegexFromProfile = generateVendorRegexFromProfile;
window.vendorSettings = vendorSettings;

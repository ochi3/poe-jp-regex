let vendorInitialized = false;
let vendorInitPromise = null;
let vendorInitResolve = null;

let vendorSettings = {
  colors: {
    rrr: false, ggg: false, bbb: false,
    rrA: false, ggA: false, bbA: false,
    rrg: false, rrb: false, ggr: false, ggb: false, bbr: false, bbg: false,
    rgb: false, raa: false, gaa: false, baa: false,
    rr: false, gg: false, bb: false, rb: false, gr: false, bg: false
  },
  anyThreeLink: false,
  anyFourLink: false,
  anyFiveLink: false,
  anySixLink: false,
  anySixSocket: false,
  movement: { ten: false, fifteen: false, twenty: false, twentyfive: false, thirty: false },
  weapon: {
    sceptre: false, mace: false, axe: false, sword: false, bow: false,
    claw: false, dagger: false, staff: false, wand: false,
    oneHandSword: false, thrustingSword: false, oneHandAxe: false, 
    oneHandMace: false, runeDagger: false, twoHandSword: false, 
    twoHandAxe: false, twoHandMace: false, warstaff: false, shield: false
  },
  excludeWeapons: {
    bow: false,
    dagger: false,
    claw: false,
    wand: false,
    oneHandSword: false,
    thrustingSword: false,
    oneHandAxe: false,
    oneHandMace: false,
    sceptre: false,
    runeDagger: false,
    twoHandSword: false,
    twoHandAxe: false,
    twoHandMace: false,
    staff: false,
    warstaff: false,
    shield: false
  },
  selectedGems: []
};

let vendorProfiles = {};
let gemData = [];
let selectedGems = [];

const weaponMapping = {
  claw: '^鉤爪',
  dagger: '^短剣',
  wand: 'wand|horn',
  oneHandSword: '^片手剣',
  thrustingSword: '^刺突剣',
  oneHandAxe: '^片手斧',
  oneHandMace: '^片手メイス',
  sceptre: '^セプター',
  runeDagger: '^ルーンの短剣',
  bow: 'bow',
  staff: '^スタッフ',
  twoHandSword: '^両手剣',
  twoHandAxe: '^両手斧',
  twoHandMace: '^両手メイス',
  warstaff: '^ウォースタッフ',
  shield: '^ブロック率'
};

function generateVendorRegex() {
  const parts = [];
  const settings = vendorSettings;

  const color3L = [];
  if (settings.colors.rrA) color3L.push('r-r-|-r-r|r-.-r');
  if (settings.colors.ggA) color3L.push('g-g-|-g-g|g-.-g');
  if (settings.colors.bbA) color3L.push('b-b-|-b-b|b-.-b');
  if (settings.colors.rrr) color3L.push('r-r-r');
  if (settings.colors.ggg) color3L.push('g-g-g');
  if (settings.colors.bbb) color3L.push('b-b-b');

  if (settings.colors.rrg && settings.colors.rrb) {
    color3L.push('r-r-[gb]|r-[gb]-r|[gb]-r-r');
  } else {
    if (settings.colors.rrg) color3L.push('r-r-g|r-g-r|g-r-r');
    if (settings.colors.rrb) color3L.push('r-r-b|r-b-r|b-r-r');
  }

  if (settings.colors.ggr && settings.colors.ggb) {
    color3L.push('g-g-[rb]|g-[rb]-g|[rb]-g-g');
  } else {
    if (settings.colors.ggr) color3L.push('g-g-r|g-r-g|r-g-g');
    if (settings.colors.ggb) color3L.push('g-g-b|g-b-g|b-g-g');
  }

  if (settings.colors.bbr && settings.colors.bbg) {
    color3L.push('b-b-[rg]|b-[rg]-b|[rg]-b-b');
  } else {
    if (settings.colors.bbr) color3L.push('b-b-r|b-r-b|r-b-b');
    if (settings.colors.bbg) color3L.push('b-b-g|b-g-b|g-b-b');
  }

  if (settings.colors.rgb) color3L.push(':.*(?=\\S*r)(?=\\S*g)(?=\\S*b)');
  if (settings.colors.raa) color3L.push('.-.-r|.-r-.|r-.-.');
  if (settings.colors.gaa) color3L.push('.-.-g|.-g-.|g-.-.');
  if (settings.colors.baa) color3L.push('.-.-b|.-b-.|b-.-.');

  if (color3L.length > 0) parts.push(color3L.join('|'));

  const color2L = [];
  if (settings.colors.rr) color2L.push('r-r');
  if (settings.colors.gg) color2L.push('g-g');
  if (settings.colors.bb) color2L.push('b-b');
  if (settings.colors.rb) color2L.push('r-b|b-r');
  if (settings.colors.gr) color2L.push('g-r|r-g');
  if (settings.colors.bg) color2L.push('b-g|g-b');
  if (color2L.length > 0) parts.push(color2L.join('|'));

  if (settings.anyThreeLink) parts.push('-\\w-');
  if (settings.anyFourLink) parts.push('-\\w-.-');
  if (settings.anyFiveLink) parts.push('(-\\w){4}');
  if (settings.anySixLink) parts.push('(-\\w){5}');
  if (settings.anySixSocket) parts.push('(\\w\\W){5}');

  if (settings.movement.ten) parts.push('走者の');
  if (settings.movement.fifteen) parts.push('競走者の');
  if (settings.movement.twenty) parts.push('牡馬の');
  if (settings.movement.twentyfive) parts.push('ガゼルの');
  if (settings.movement.thirty) parts.push('チーターの');

  const weapons = [];
  Object.entries(settings.weapon).forEach(([key, value]) => {
    if (value && weaponMapping[key]) weapons.push(weaponMapping[key]);
  });
  if (weapons.length > 0) parts.push(weapons.join('|'));

  if (settings.selectedGems && settings.selectedGems.length > 0) {
    parts.push(settings.selectedGems.join('|'));
  }

  let regex = parts.join('|');

  const excludeWeapons = [];
  Object.entries(settings.excludeWeapons).forEach(([key, value]) => {
    if (value && weaponMapping[key]) excludeWeapons.push(weaponMapping[key]);
  });

  if (excludeWeapons.length > 0) {
    regex += ` !.*(?:${excludeWeapons.join('|')})`;
  }

  return regex;
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
  if (regex && regex !== '(空のRegex)') {
    navigator.clipboard.writeText(regex)
      .then(() => {
        showNotification('コピーしました！');
      })
      .catch(err => {
        console.error('コピー失敗:', err);
        showNotification('❌ コピー失敗', true);
      });
  } else {
    showNotification('コピーする内容がありません', true);
  }
}

function resetVendorSettings() {
  document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  vendorSettings = {
    colors: {
      rrr: false, ggg: false, bbb: false,
      rrA: false, ggA: false, bbA: false,
      rrg: false, rrb: false, ggr: false, ggb: false, bbr: false, bbg: false,
      rgb: false, raa: false, gaa: false, baa: false,
      rr: false, gg: false, bb: false, rb: false, gr: false, bg: false
    },
    anyThreeLink: false,
    anyFourLink: false,
    anyFiveLink: false,
    anySixLink: false,
    anySixSocket: false,
    movement: { ten: false, fifteen: false, twenty: false, twentyfive: false, thirty: false },
    weapon: {
      sceptre: false, mace: false, axe: false, sword: false, bow: false,
      claw: false, dagger: false, staff: false, wand: false,
      oneHandSword: false, thrustingSword: false, oneHandAxe: false,
      oneHandMace: false, runeDagger: false, twoHandSword: false,
      twoHandAxe: false, twoHandMace: false, warstaff: false,
      shield: false
    },
    excludeWeapons: {
      bow: false,
      dagger: false,
      claw: false,
      wand: false,
      oneHandSword: false,
      thrustingSword: false,
      oneHandAxe: false,
      oneHandMace: false,
      sceptre: false,
      runeDagger: false,
      twoHandSword: false,
      twoHandAxe: false,
      twoHandMace: false,
      staff: false,
      warstaff: false,
      shield: false
    },
    selectedGems: []
  };

  resetGemSelection();
  updateVendorRegex();
  localStorage.removeItem('vendorSettings');

  showNotification('ベンダー設定をリセットしました');
}

function saveVendorSettings() {
  localStorage.setItem('vendorSettings', JSON.stringify(vendorSettings));
}

function loadVendorSettings() {
  const saved = localStorage.getItem('vendorSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      vendorSettings = { 
        colors: { ...vendorSettings.colors, ...parsed.colors },
        anyThreeLink: parsed.anyThreeLink || false,
        anyFourLink: parsed.anyFourLink || false,
        anyFiveLink: parsed.anyFiveLink || false,
        anySixLink: parsed.anySixLink || false,
        anySixSocket: parsed.anySixSocket || false,
        movement: { 
          ten: parsed.movement?.ten || false,
          fifteen: parsed.movement?.fifteen || false,
          twenty: parsed.movement?.twenty || false,
          twentyfive: parsed.movement?.twentyfive || false,
          thirty: parsed.movement?.thirty || false
        },
        weapon: { ...vendorSettings.weapon, ...parsed.weapon },
        excludeWeapons: { ...vendorSettings.excludeWeapons, ...parsed.excludeWeapons },
        selectedGems: parsed.selectedGems || []
      };
      applyVendorSettings();
    } catch (e) {
      console.error('設定の読み込みエラー:', e);
    }
  }
}

function applyVendorSettings() {
  Object.entries(vendorSettings.colors).forEach(([key, value]) => {
    const checkbox = document.getElementById(`vendor-color-${key}`);
    if (checkbox) checkbox.checked = value;
  });

  ['anyThreeLink', 'anyFourLink', 'anyFiveLink', 'anySixLink', 'anySixSocket'].forEach(key => {
    const checkbox = document.getElementById(`vendor-${key}`);
    if (checkbox) checkbox.checked = vendorSettings[key];
  });

  const moveTen = document.getElementById('vendor-movement-ten');
  const moveFifteen = document.getElementById('vendor-movement-fifteen');
  const moveTwenty = document.getElementById('vendor-movement-twenty');
  const moveTwentyfive = document.getElementById('vendor-movement-twentyfive');
  const moveThirty = document.getElementById('vendor-movement-thirty');
  
  if (moveTen) moveTen.checked = vendorSettings.movement?.ten || false;
  if (moveFifteen) moveFifteen.checked = vendorSettings.movement?.fifteen || false;
  if (moveTwenty) moveTwenty.checked = vendorSettings.movement?.twenty || false;
  if (moveTwentyfive) moveTwentyfive.checked = vendorSettings.movement?.twentyfive || false;
  if (moveThirty) moveThirty.checked = vendorSettings.movement?.thirty || false;

  Object.entries(vendorSettings.weapon).forEach(([key, value]) => {
    const checkbox = document.getElementById(`vendor-weapon-${key}`);
    if (checkbox) checkbox.checked = value;
  });

  Object.entries(vendorSettings.excludeWeapons).forEach(([key, value]) => {
    const checkbox = document.getElementById(`vendor-exclude-${key}`);
    if (checkbox) checkbox.checked = value;
  });

  selectedGems = vendorSettings.selectedGems || [];
  updateGemButtons();
  updateVendorRegex();
}

function handleVendorCheckboxChange(checkbox) {
  const id = checkbox.id.replace('vendor-', '');
  
  if (id.startsWith('color-')) {
    const colorKey = id.replace('color-', '');
    vendorSettings.colors[colorKey] = checkbox.checked;
  } else if (id.startsWith('weapon-')) {
    const weaponKey = id.replace('weapon-', '');
    vendorSettings.weapon[weaponKey] = checkbox.checked;
  } else if (id.startsWith('exclude-')) {
    const excludeKey = id.replace('exclude-', '');
    vendorSettings.excludeWeapons[excludeKey] = checkbox.checked;
  } else if (id.startsWith('movement-')) {
    const moveKey = id.replace('movement-', '');
    vendorSettings.movement = vendorSettings.movement || {};
    const moveMapping = {
      'ten': 'ten', 'fifteen': 'fifteen', 'twenty': 'twenty', 
      'twentyfive': 'twentyfive', 'thirty': 'thirty'
    };
    if (moveMapping[moveKey]) {
      vendorSettings.movement[moveMapping[moveKey]] = checkbox.checked;
    }
  } else {
    vendorSettings[id] = checkbox.checked;
  }
  
  updateVendorRegex();
}

function setupVendorEventListeners() {
  document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      handleVendorCheckboxChange(this);
    });
  });
  setupGemSearch();
}

function loadGemData() {
  return new Promise((resolve, reject) => {
    if (gemData && gemData.length > 0) {
      resolve(gemData);
      return;
    }

    fetch('gems/gems_regex.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        gemData = data;
        displayGems();
        resolve(data);
      })
      .catch(error => {
        console.error('ジェムデータの読み込みエラー:', error);
        showNotification('ジェムデータの読み込みに失敗しました', true);
        reject(error);
      });
  });
}

function displayGems() {
  const container = document.getElementById('gemListContainer');
  if (!container) return;

  const gemsByColor = { r: [], g: [], b: [], other: [] };

  gemData.forEach(gem => {
    const color = gem.color || 'other';
    if (gemsByColor[color]) gemsByColor[color].push(gem);
    else gemsByColor.other.push(gem);
  });

  container.innerHTML = '';

  Object.entries(gemsByColor).forEach(([color, gems]) => {
    if (gems.length === 0) return;

    const section = document.createElement('div');
    section.className = 'gem-section';
    section.style.marginBottom = '30px';
    
    const title = document.createElement('h4');
    title.textContent = getColorName(color);
    title.style.color = getColorCode(color);
    title.style.marginBottom = '15px';
    title.style.borderBottom = `2px solid ${getColorCode(color)}`;
    title.style.paddingBottom = '8px';
    title.style.textAlign = 'left';
    title.style.fontSize = '1.1em';
    
    section.appendChild(title);

    const gemGrid = document.createElement('div');
    gemGrid.className = 'gem-grid';
    gemGrid.style.display = 'grid';
    gemGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
    gemGrid.style.gap = '12px';
    gemGrid.style.marginBottom = '20px';
    gemGrid.style.justifyItems = 'start';

    gems.forEach(gem => {
      const gemButton = createGemButton(gem);
      gemGrid.appendChild(gemButton);
    });

    section.appendChild(gemGrid);
    container.appendChild(section);
  });
  
  if (vendorSettings.selectedGems && vendorSettings.selectedGems.length > 0) {
    selectedGems = [...vendorSettings.selectedGems];
    updateGemButtons();
  }
}

function getColorName(color) {
  const colorNames = { r: '🔴 赤ジェム', g: '🟢 緑ジェム', b: '🔵 青ジェム', other: '⚪ その他' };
  return colorNames[color] || 'その他';
}

function getColorCode(color) {
  const colorCodes = { r: '#FF6B6B', g: '#51CF66', b: '#339AF0', other: '#ADB5BD' };
  return colorCodes[color] || '#ADB5BD';
}

function createGemButton(gem) {
  const button = document.createElement('button');
  button.className = 'gem-button';
  button.textContent = gem.display_name;
  button.title = gem.regex;
  button.dataset.regex = gem.regex;
  button.dataset.color = gem.color || 'other';
  button.dataset.eng = gem.eng || '';
  button.dataset.name = gem.display_name;
  
  updateGemButtonStyle(button);
  
  button.style.cssText = `
    color: white;
    border: 2px solid;
    padding: 12px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s ease;
    text-align: left;
    word-break: break-word;
    white-space: normal;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    line-height: 1.3;
    background: #2a2a2a;
    border-color: ${getColorCode(gem.color || 'other')};
  `;

  button.addEventListener('click', () => {
    toggleGemSelection(gem, button);
  });

  button.addEventListener('mouseenter', () => {
    if (!selectedGems.includes(gem.regex)) {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    }
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = '';
    button.style.boxShadow = '';
  });

  return button;
}

function updateGemButtonStyle(button) {
  const isSelected = selectedGems.includes(button.dataset.regex);
  const color = button.dataset.color;
  
  if (isSelected) {
    button.style.background = '#2d5a2d';
    button.style.borderColor = '#4CAF50';
    button.style.color = '#FFFFFF';
    button.style.fontWeight = 'bold';
  } else {
    button.style.background = '#2a2a2a';
    button.style.borderColor = getColorCode(color);
    button.style.color = '#FFFFFF';
    button.style.fontWeight = 'normal';
  }
}

function updateGemButtons() {
  document.querySelectorAll('.gem-button').forEach(button => {
    updateGemButtonStyle(button);
  });
}

function toggleGemSelection(gem, button) {
  const regex = gem.regex;
  const index = selectedGems.indexOf(regex);
  
  if (index === -1) {
    selectedGems.push(regex);
  } else {
    selectedGems.splice(index, 1);
  }
  
  vendorSettings.selectedGems = selectedGems;
  updateGemButtonStyle(button);
  updateVendorRegex();
  saveVendorSettings();
}

function filterGems() {
  const searchInput = document.getElementById('gemSearch');
  if (!searchInput) return;
  
  const searchText = searchInput.value;
  const keywords = searchText.split(/[\n,;]+/)
    .map(keyword => keyword.trim().toLowerCase())
    .filter(keyword => keyword.length > 0);
  
  const buttons = document.querySelectorAll('.gem-button');
  let matchCount = 0;
  
  buttons.forEach(button => {
    const gemName = button.textContent.toLowerCase();
    const gemRegex = button.dataset.regex || '';
    const gemEng = button.dataset.eng || '';
    const gemDisplayName = button.dataset.name || '';
    
    let match = false;
    
    if (keywords.length === 0) {
      match = true;
    } else {
      match = keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        return gemName.includes(keywordLower) || 
               gemRegex.toLowerCase().includes(keywordLower) ||
               (gemEng && gemEng.toLowerCase().includes(keywordLower)) ||
               (gemDisplayName && gemDisplayName.toLowerCase().includes(keywordLower));
      });
    }
    
    if (match) {
      button.style.display = 'flex';
      matchCount++;
    } else {
      button.style.display = 'none';
    }
  });
  
  updateSearchResultCount(matchCount);
}

function updateSearchResultCount(count) {
  let countElement = document.getElementById('gemSearchResultCount');
  if (!countElement) {
    countElement = document.createElement('div');
    countElement.id = 'gemSearchResultCount';
    countElement.style.cssText = `
      margin-top: 8px;
      font-size: 0.9em;
      color: #ccc;
      text-align: left;
    `;
    const searchContainer = document.getElementById('gemSearch').parentNode;
    searchContainer.appendChild(countElement);
  }
  countElement.textContent = `検索結果: ${count}件`;
}

function setupGemSearch() {
  const searchInput = document.getElementById('gemSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterGems);
    searchInput.addEventListener('paste', function() {
      setTimeout(filterGems, 10);
    });
    searchInput.addEventListener('keyup', filterGems);
  }
}

function clearGemSearch() {
  const searchInput = document.getElementById('gemSearch');
  if (searchInput) {
    searchInput.value = '';
    filterGems();
  }
}

function resetGemSelection() {
  selectedGems = [];
  vendorSettings.selectedGems = [];
  updateGemButtons();
  updateVendorRegex();
  saveVendorSettings();
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

  const gemInfo = selectedGems.map(regex => {
    const gem = gemData.find(g => g.regex === regex);
    return gem ? {
      regex: gem.regex,
      display_name: gem.display_name,
      color: gem.color,
      eng: gem.eng
    } : { regex: regex, display_name: regex };
  });

  vendorProfiles[profileName] = {
    settings: JSON.parse(JSON.stringify(vendorSettings)),
    gemInfo: gemInfo,
    timestamp: Date.now()
  };

  vendorProfiles[profileName].settings.gemInfo = gemInfo;

  localStorage.setItem('vendorProfiles', JSON.stringify(vendorProfiles));
  updateVendorProfileList();
  showNotification(`"${profileName}" を保存しました`);
  document.getElementById('vendorProfileName').value = '';

  if (typeof updateSavedRegexDisplay === 'function') {
    updateSavedRegexDisplay();
  }
}

function loadVendorProfile() {
  const profileName = document.getElementById('vendorProfileList').value;
  if (!profileName || !vendorProfiles[profileName]) {
    showNotification('プロファイルを選択してください', true);
    return;
  }

  try {
    const profile = vendorProfiles[profileName];
    vendorSettings = JSON.parse(JSON.stringify(profile.settings));
    
    if (!vendorSettings.selectedGems && profile.gemInfo) {
      vendorSettings.selectedGems = profile.gemInfo.map(g => g.regex);
    }
    
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
    localStorage.setItem('vendorProfiles', JSON.stringify(vendorProfiles));
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

function getGemDisplayName(gemRegex) {
  if (!gemData || gemData.length === 0) return gemRegex;
  const gem = gemData.find(g => g.regex === gemRegex);
  if (gem) return gem.display_name;
  const partialMatch = gemData.find(g => gemRegex.includes(g.regex) || g.regex.includes(gemRegex));
  return partialMatch ? partialMatch.display_name : gemRegex;
}

function loadVendorProfileDirectly(profileName) {
  initializeVendor().then(() => {
    const profile = vendorProfiles[profileName];
    if (!profile) {
      showNotification('プロファイルが見つかりません', true);
      return;
    }

    try {
      vendorSettings = JSON.parse(JSON.stringify(profile.settings));
      
      selectedGems = vendorSettings.selectedGems || [];
      if (profile.gemInfo) {
        selectedGems = profile.gemInfo.map(gem => gem.regex);
        vendorSettings.selectedGems = selectedGems;
      }
      
      applyVendorSettings();
      
      const profileNameInput = document.getElementById('vendorProfileName');
      const profileList = document.getElementById('vendorProfileList');
      
      if (profileNameInput) {
        profileNameInput.value = profileName;
      }
      
      if (profileList) {
        profileList.value = profileName;
      }
      
      showNotification(`"${profileName}" を読み込みました`);
    } catch (error) {
      console.error('ベンダープロファイル読み込みエラー:', error);
      showNotification('ベンダープロファイルの読み込みに失敗しました', true);
    }
  });
}

// プロファイルからベンダーRegexを生成する関数
function generateVendorRegexFromProfile(profile) {
  console.log('Generating vendor regex from profile:', profile);
  
  if (!profile || !profile.settings) {
    console.error('Invalid vendor profile:', profile);
    return '(無効なプロファイル)';
  }

  const originalSettings = JSON.parse(JSON.stringify(vendorSettings));
  const originalSelectedGems = [...selectedGems];
  
  try {
    vendorSettings = JSON.parse(JSON.stringify(profile.settings));
    
    selectedGems = vendorSettings.selectedGems || [];
    
    const regex = generateVendorRegex();
    console.log('Generated vendor regex from profile:', regex);
    return regex;
  } catch (error) {
    console.error('Error generating vendor regex from profile:', error);
    return '(エラー: Regex生成失敗)';
  } finally {
    vendorSettings = originalSettings;
    selectedGems = originalSelectedGems;
  }
}

function initializeVendor() {
  if (vendorInitialized) {
    return Promise.resolve();
  }
  
  if (vendorInitPromise) {
    return vendorInitPromise;
  }
  
  console.log('Initializing vendor...');
  
  vendorInitPromise = new Promise((resolve) => {
    vendorInitResolve = resolve;
  });
  
  const savedProfiles = localStorage.getItem('vendorProfiles');
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
      if (this.value) {
        loadVendorProfile();
      } else {
        const input = document.getElementById('vendorProfileName');
        if (input) input.value = '';
      }
    });
    profileList.hasEventListener = true;
  }

  const saveBtn = document.getElementById('saveVendorProfileBtn');
  if (saveBtn && !saveBtn.hasEventListener) {
    saveBtn.addEventListener('click', saveVendorProfile);
    saveBtn.hasEventListener = true;
  }

  const deleteBtn = document.getElementById('deleteVendorProfileBtn');
  if (deleteBtn && !deleteBtn.hasEventListener) {
    deleteBtn.addEventListener('click', deleteVendorProfile);
    deleteBtn.hasEventListener = true;
  }

  window.getGemDisplayName = getGemDisplayName;
  window.vendorSettings = vendorSettings;
  window.applyVendorSettings = applyVendorSettings;
  window.updateVendorRegex = updateVendorRegex;
  window.loadVendorProfileDirectly = loadVendorProfileDirectly;
  window.generateVendorRegexFromProfile = generateVendorRegexFromProfile;

  loadVendorSettings();
  setupVendorEventListeners();

  loadGemData().then(() => {
    updateVendorRegex();

    vendorInitialized = true;
    console.log('Vendor initialized successfully');

    if (vendorInitResolve) {
      vendorInitResolve();
      vendorInitResolve = null;
    }
  }).catch(error => {
    console.error('Vendor initialization failed:', error);
    vendorInitialized = true;
    if (vendorInitResolve) {
      vendorInitResolve();
      vendorInitResolve = null;
    }
  });

  return vendorInitPromise;
}

function handleVendorTabActivation() {
  console.log('Vendor tab activated');
  initializeVendor().catch(error => {
    console.error('Vendor initialization error:', error);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, setting up vendor tab listeners');
  
  const vendorTab = document.querySelector('a[data-tab="vendorContent"]');
  if (vendorTab && !vendorTab.hasEventListener) {
    vendorTab.addEventListener('click', function(e) {
      console.log('Vendor tab clicked');
      setTimeout(handleVendorTabActivation, 100);
    });
    vendorTab.hasEventListener = true;
  }
  
  const vendorContentElem = document.getElementById('vendorContent');
  if (window.location.hash === '#vendor' || 
      (vendorContentElem && vendorContentElem.style.display === 'block') ||
      (vendorContentElem && vendorContentElem.classList.contains('active'))) {
    console.log('Vendor tab is active on load');
    setTimeout(handleVendorTabActivation, 200);
  }
  
  if (!window.vendorHashChangeHandler) {
    window.vendorHashChangeHandler = function() {
      if (window.location.hash === '#vendor') {
        console.log('Hash changed to vendor');
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
window.filterGems = filterGems;
window.clearGemSearch = clearGemSearch;
window.resetGemSelection = resetGemSelection;
window.generateVendorRegex = generateVendorRegex;
window.generateVendorRegexFromProfile = generateVendorRegexFromProfile;
window.vendorSettings = vendorSettings;
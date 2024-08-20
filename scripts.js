let ModList = {...originalModList};

let currentLanguage = 'ja';
let checkedMods = new Set();

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    updateModList();
    updateCombinedRegex();
}

function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    // ModListをtierでソート
    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(!isT17 && value.modTier17))
        .sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);

    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });
}


function addEffectItem(key, value) {
    const ModListDiv = document.getElementById('ModList');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = key;
    checkbox.id = key;
    checkbox.checked = checkedMods.has(key);
    checkbox.onchange = function() {
        if (this.checked) {
            checkedMods.add(key);
        } else {
            checkedMods.delete(key);
        }
        saveModCheckboxState();
        updateCombinedRegex();
    };

    const labelElem = document.createElement('label');
    labelElem.htmlFor = key;
    labelElem.textContent = currentLanguage === 'ja' ? value.mod : value.engMod;

    const effectItem = document.createElement('div');
    effectItem.classList.add('effect-item');
    if (value.tier > 1001) {
        effectItem.style.color = '#e0b8ee';
        effectItem.classList.add('t17-effect');
    } else if (value.tier > 750) {
        effectItem.style.color = '#ed4c4c';
    } else if (value.tier > 500) {
        effectItem.style.color = '#F87171';
    } else if (value.tier > 250) {
        effectItem.style.color = '#FCA5A5';
    } else if (value.tier > 100) {
        effectItem.style.color = '#f2d5d5';
    } else {
        effectItem.style.color = 'white';
    }

    effectItem.appendChild(checkbox);
    effectItem.appendChild(labelElem);

    ModListDiv.appendChild(effectItem);
}


function updateCombinedRegex() {
    const itemQuantityValue = document.getElementById('itemQuantityInput').value;
    const packSizeValue = document.getElementById('packSizeInput').value;
    const ngModChecked = document.getElementById('ngModCheckbox').checked;

    let combinedResult = '';
    const effectResults = [];

    checkedMods.forEach((key) => {
        const mod = ModList[key];
        effectResults.push(currentLanguage === 'ja' ? mod.Regex : mod.engRegex);
    });

    let ModListResult = '';
    if (effectResults.length > 0) {
        ModListResult = effectResults.join('|');
        if (ngModChecked) {
            ModListResult = `"!${ModListResult}"`;
        }
    }
    document.getElementById('ModListResult').textContent = ModListResult;

    if (itemQuantityValue) {
        const itemQuantityRegex = getFixedRangeRegex(itemQuantityValue, currentLanguage === 'ja' ? 'ム数.*' : 'm q.*');
        combinedResult += ` ${itemQuantityRegex}`;
    }

    if (packSizeValue) {
        const packSizeRegex = getFixedRangeRegex(packSizeValue, currentLanguage === 'ja' ? 'クサ.*' : 'iz.*');
        combinedResult += ` ${packSizeRegex}`;
    }

    combinedResult = `${ModListResult} ${combinedResult}`.trim();
    document.getElementById('combinedRegexOutput').textContent = combinedResult;

    updateCharCount();
}

function updateCharCount() {
    const result = document.getElementById('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = document.getElementById('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;

    if (charCount > 50) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (50文字を超えています)';
    } else {
        charCountElement.style.color = '';
    }
}

function copyToClipboard() {
    const resultText = document.getElementById('combinedRegexOutput').textContent;
    navigator.clipboard.writeText(resultText)
        .catch(err => console.error('クリップボードへのコピーに失敗しました', err));
}

function resetAll() {
    // Clear input fields
    document.getElementById('itemQuantityInput').value = '';
    document.getElementById('packSizeInput').value = '';
    document.getElementById('ngModCheckbox').checked = false;
    document.getElementById('mapTierCheckbox').checked = false;
    checkedMods.clear();
    document.querySelectorAll('#ModList input[type=checkbox]').forEach(checkbox => checkbox.checked = false);

    ModList = {...originalModList};
    updateModList();
    updateCombinedRegex();
}

function getFixedRangeRegex(num, basePattern) {
    num = parseInt(num);
    if (isNaN(num) || num < 0) return '';

    if (num >= 200) {
        return `"${basePattern}2..%"`;
    } else if (num >= 190) {
        return `"${basePattern}19.%"`;
    } else if (num >= 180) {
        return `"${basePattern}1[89].%"`;
    } else if (num >= 170) {
        return `"${basePattern}1[7-9].%"`;
    } else if (num >= 160) {
        return `"${basePattern}1[6-9].%"`;
    } else if (num >= 150) {
        return `"${basePattern}1[5-9].%"`;
    } else if (num >= 140) {
        return `"${basePattern}1[4-9].%"`;
    } else if (num >= 130) {
        return `"${basePattern}1[3-9].%"`;
    } else if (num >= 120) {
        return `"${basePattern}1[2-9].%"`;
    } else if (num >= 110) {
        return `"${basePattern}1[1-9].%"`;
    } else if (num >= 100) {
        return `"${basePattern}\\d{3}%"`;
    } else if (num >= 90) {
        return `"${basePattern}(9.|1..)%"`;
    } else if (num >= 80) {
        return `"${basePattern}([89].|1..)%"`;
    } else if (num >= 70) {
        return `"${basePattern}([7-9].|1..)%"`;
    } else if (num >= 60) {
        return `"${basePattern}([6-9].|1..)%"`;
    } else if (num >= 50) {
        return `"${basePattern}([5-9].|1..)%"`;
    } else if (num >= 40) {
        return `"${basePattern}([4-9].|1..)%"`;
    } else if (num >= 30) {
        return `"${basePattern}([3-9].|1..)%"`;
    } else if (num >= 20) {
        return `"${basePattern}([2-9].|1..)%"`;
    } else if (num >= 10) {
        return `"${basePattern}([1-9].|1..)%"`;
    } else {
        return `"${basePattern}[1-9]%"`;
    }
}

function filterEffects() {
    const searchTerm = document.getElementById('effectSearch').value.toLowerCase();
    const ModListDiv = document.getElementById('ModList');

    const effects = ModListDiv.getElementsByClassName('effect-item');
    for (let i = 0; i < effects.length; i++) {
        const label = effects[i].getElementsByTagName('label')[0];
        const modName = label.textContent.toLowerCase();

        if (modName.includes(searchTerm)) {
            effects[i].style.display = '';
        } else {
            effects[i].style.display = 'none';
        }
    }
}

function switchFunction(type) {
    const contents = ['mapContent', 'transContent', 'flaskContent', 'beastContent', 'expeContent'];
    contents.forEach(content => {
        document.getElementById(content).style.display = 'none';
    });
    document.getElementById(`${type}Content`).style.display = 'block';

    if (type === 'map') {
        updateModList();
        updateCombinedRegex();
    }
}



function initializeTooltips() {
    document.querySelectorAll('.effect-item').forEach(item => {
        const tooltip = item.querySelector('.tooltip');

        if (tooltip) {
            item.addEventListener('mouseover', () => {
                tooltip.classList.add('tooltip-visible');
            });
            item.addEventListener('mouseout', () => {
                tooltip.classList.remove('tooltip-visible');
            });
        }
    });
}
// チェックボックスの状態を保存する関数
function saveCheckboxState() {
    const ngModCheckbox = document.getElementById('ngModCheckbox');
    const mapTierCheckbox = document.getElementById('mapTierCheckbox');

    localStorage.setItem('ngModChecked', ngModCheckbox.checked);
    localStorage.setItem('mapTierChecked', mapTierCheckbox.checked);
}

// チェックボックスの状態を復元する関数
function loadCheckboxState() {
    const ngModChecked = localStorage.getItem('ngModChecked') === 'true';
    const mapTierChecked = localStorage.getItem('mapTierChecked') === 'true';

    document.getElementById('ngModCheckbox').checked = ngModChecked;
    document.getElementById('mapTierCheckbox').checked = mapTierChecked;
}

// MODチェックボックスの状態を保存する関数
function saveModCheckboxState() {
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    const state = {};
    checkboxes.forEach(checkbox => {
        state[checkbox.id] = checkbox.checked;
    });
    localStorage.setItem('modCheckboxState', JSON.stringify(state));
}

function addModCheckboxEventListeners() {
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkedMods.add(checkbox.value);
            } else {
                checkedMods.delete(checkbox.value);
            }
            updateCombinedRegex();
            saveModCheckboxState();
        });
    });
}



// MODリストの更新後にイベントリスナーを追加
function updateModList() {
    const ModListDiv = document.getElementById('ModList');
    ModListDiv.innerHTML = '';

    const isT17 = document.getElementById('mapTierCheckbox').checked;

    // ModListをtierでソート
    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(value.modTier17 && !isT17))
        .sort(([keyA, valueA], [keyB, valueB]) => valueB.tier - valueA.tier);

    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });

    // チェックボックスのイベントリスナーを追加
    addModCheckboxEventListeners();
}



// ページロード時にチェックボックスの状態を復元
document.addEventListener('DOMContentLoaded', () => {
    loadModCheckboxState();
    updateModList();
});

function loadModCheckboxState() {
    const state = JSON.parse(localStorage.getItem('modCheckboxState') || '{}');
    const checkboxes = document.querySelectorAll('#ModList input[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = state[checkbox.id] || false;
        checkbox.dispatchEvent(new Event('change')); // チェック状態の変更を即時通知
    });

    // チェックボックスの状態をcheckedModsに反映
    checkedMods.clear(); // 現在の状態をクリア
    Object.keys(state).forEach(id => {
        if (state[id]) {
            checkedMods.add(id);
        }
    });
}
// チェックボックスの状態を保存するイベントリスナーを追加
document.getElementById('ngModCheckbox').addEventListener('change', saveCheckboxState);
document.getElementById('mapTierCheckbox').addEventListener('change', saveCheckboxState);

// ページロード時にチェックボックスの状態を復元
document.addEventListener('DOMContentLoaded', loadCheckboxState);

document.addEventListener('DOMContentLoaded', () => {
    loadModCheckboxState();
    updateModList();
    switchFunction('map');
    initializeTooltips();
    updateCombinedRegex();
});

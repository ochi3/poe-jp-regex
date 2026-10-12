function getConvertTarget() {
    return document.querySelector<HTMLInputElement>('input[name="convertTarget"]:checked')?.value || 'waystone';
}

function getPoe2ConvertModList() {
    if (getConvertTarget() === 'tablet' && typeof tabletModList !== 'undefined') {
        return tabletModList;
    }
    return typeof mapModList !== 'undefined' ? mapModList : (typeof ModList !== 'undefined' ? ModList : {});
}
window.getPoe2ConvertModList = getPoe2ConvertModList;

function onConvertTargetChange() {
    const target = getConvertTarget();
    const btn = getElement('applyConvertedBtn');
    if (btn) {
        btn.textContent = target === 'tablet' ? '石板に適用' : 'ウェイストーンに適用';
    }
    const input = getElement('engRegexInput');
    if (input) {
        input.placeholder = target === 'tablet' ? '例: eness$|Ra.*fou' : '例: Unde|Bea';
    }
    // 対象切替時は前回の変換結果をクリア
    const output = getElement('jpRegexOutput');
    if (output) output.textContent = '';
    const detailsList = getElement('detailsList');
    if (detailsList) detailsList.innerHTML = '';
}

function applyConvertedMods() {
    if (getConvertTarget() === 'tablet') {
        applyConvertedToTabletMods();
    } else {
        applyConvertedToMapMods();
    }
}

function applyConvertedToMapMods() {
    const jpRegexOutput = getElement('jpRegexOutput').textContent;
    
    if (!jpRegexOutput.trim()) {
        showNotification('変換されたRegexがありません', true);
        return;
    }

    switchTab('mapContent');
    
    if (currentLanguage !== 'ja') {
        toggleLanguage();
    }

    checkedMods.clear();
    
    const matchedMods = findModsFromJpRegex(jpRegexOutput, mapModList);
    
    matchedMods.forEach(modKey => {
        checkedMods.set(modKey, 'ng');
    });

    updateModList();
    updateCombinedRegex();
    saveModCheckboxState();
    
    showNotification(`変換結果をウェイストーンの${matchedMods.length}個のModに適用しました`);
}

function applyConvertedToTabletMods() {
    const jpRegexOutput = getElement('jpRegexOutput').textContent;

    if (!jpRegexOutput.trim()) {
        showNotification('変換されたRegexがありません', true);
        return;
    }

    if (typeof tabletModList === 'undefined') {
        showNotification('石板Modデータが読み込まれていません', true);
        return;
    }

    switchTab('tabletContent');

    if (currentLanguage !== 'ja') {
        toggleLanguage();
    }

    tabletCheckedMods.clear();

    const matchedMods = findModsFromJpRegex(jpRegexOutput, tabletModList);
    matchedMods.forEach(modKey => {
        tabletCheckedMods.add(modKey);
    });

    if (typeof updateTabletModList === 'function') updateTabletModList();
    if (typeof updateTabletCombinedRegex === 'function') updateTabletCombinedRegex();
    if (typeof saveTabletState === 'function') saveTabletState();

    showNotification(`変換結果を石板の${matchedMods.length}個のModに適用しました`);
}

function findModsFromJpRegex(jpRegex: string, sourceList?: Record<string, ModDefinition>): string[] {
    const matchedMods = new Set<string>();
    const list = sourceList || ModList;
    
    const cleanRegex = jpRegex.replace(/^"!?|"$/g, '');
    
    const regexParts = cleanRegex.split('|').filter(part => part.trim());
    
    regexParts.forEach(part => {
        Object.entries(list).forEach(([key, value]) => {
            if (value.Regex === part) {
                matchedMods.add(key);
            }
            else if (part.includes(value.Regex) || value.Regex.includes(part)) {
                matchedMods.add(key);
            }
        });
    });
    
    return Array.from(matchedMods);
}

// ユーティリティ関数

// プロファイルをlocalStorageから読み込む

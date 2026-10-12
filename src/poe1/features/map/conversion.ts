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
    
    const matchedMods = findModsFromJpRegex(jpRegexOutput);
    
    matchedMods.forEach(modKey => {
        checkedMods.set(modKey, 'ng');
    });

    updateModList();
    updateCombinedRegex();
    saveModCheckboxState();
    
    showNotification(`変換結果を${matchedMods.length}個のModに適用しました`);
}

function findModsFromJpRegex(jpRegex: string): string[] {
    const matchedMods = new Set<string>();
    
    const cleanRegex = jpRegex.replace(/^"!?|"$/g, '');
    
    const regexParts = cleanRegex.split('|').filter(part => part.trim());
    
    regexParts.forEach(part => {
        Object.entries(ModList).forEach(([key, value]) => {
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

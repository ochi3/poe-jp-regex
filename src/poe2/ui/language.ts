function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    writeStoredText('poe2_poeLanguage', String(currentLanguage));
    updateLanguageUI();
    
    updateModList();
    updateCombinedRegex();
    if (typeof updateTabletModList === 'function') updateTabletModList();
    if (typeof updateTabletCombinedRegex === 'function') updateTabletCombinedRegex();
    // 保存済み一覧が表示中なら再描画
    const savedContent = getElement('savedContent');
    if (savedContent && savedContent.style.display !== 'none') {
        if (typeof updateSavedRegexDisplay === 'function') updateSavedRegexDisplay();
    }
}

/**
 * 言語設定を読み込み、UIを更新する
 */
function loadLanguageState() {
    const savedLanguage = readStoredText('poe2_poeLanguage');
    if (savedLanguage === 'ja' || savedLanguage === 'en') {
        currentLanguage = savedLanguage;
    }
    updateLanguageUI();
}

/**
 * 言語切り替えボタンのテキストを現在の言語に合わせて更新
 */
function updateLanguageUI() {
    const btn = getElement('globalLangToggle');
    if (btn) {
        btn.textContent = `Language: ${currentLanguage.toUpperCase()}`;
    }
}

// Mod名の#プレースホルダーを実際の値で置換して表示
function formatModText(text: string, value: string): string {
    if (!text) return text || '';
    const textParts = text.split('|');
    const valueParts = value ? value.split('|') : [];

    const result = textParts.map((part, i) => {
        const v = valueParts[i] !== undefined ? valueParts[i] : valueParts[0];
        if (!v || v === '1') return part;
        return part
            .replace(/\(##\)/g, `(${v})`)
            .replace(/##/g, v)
            .replace(/#/g, v);
    });

    return result.join('\n');
}

function toggleLanguage() {
    setLanguage(currentLanguage === 'ja' ? 'en' : 'ja');
}

/** 指定言語に切り替え（同じ言語なら何もしない） */
function setLanguage(lang: string) {
    if (lang !== 'ja' && lang !== 'en') return;
    if (currentLanguage === lang) return;

    currentLanguage = lang;
    writeStoredText('poeLanguage', String(currentLanguage));
    updateLanguageUI();

    updateModList();
    updateCombinedRegex();
    renderscarablist();
    renderessencelist();
    rendertattoolist();
    renderrunegraftlist();
    renderbeastlist();
    updateScarabRegex();
    updateEssenceRegex();
    updateBeastRegex();
    updateTattooRegex();
    updateRunegraftRegex();
    // リコンビ / フラスコ Mod の表示と Regex を切替
    if (typeof updateSeparatedItemModLists === 'function' && typeof rawItemMods !== 'undefined' && rawItemMods.length) {
        updateSeparatedItemModLists();
        updateCombinedItemRegex();
    }
    if (typeof updateSeparatedFlaskModLists === 'function' && typeof rawFlaskMods !== 'undefined' && rawFlaskMods.length) {
        updateSeparatedFlaskModLists();
        updateCombinedFlaskRegex();
    }
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
    const savedLanguage = readStoredText('poeLanguage');
    if (savedLanguage === 'ja' || savedLanguage === 'en') {
        currentLanguage = savedLanguage;
    }
    initLangSupportBadges();
    bindLangBadgeClicks();
    updateLanguageUI();
}

/**
 * data-lang-support 付き見出しに JA/EN バッジを挿入する
 */
function initLangSupportBadges() {
    document.querySelectorAll<HTMLElement>('[data-lang-support]').forEach(el => {
        if (el.querySelector<HTMLElement>('.lang-support')) return;
        const langs = el.getAttribute('data-lang-support').trim().split(/\s+/).filter(Boolean);
        if (!langs.length) return;

        const wrap = document.createElement('span');
        wrap.className = 'lang-support';
        const hasJa = langs.includes('ja');
        const hasEn = langs.includes('en');
        if (hasJa && hasEn) {
            wrap.title = 'クリックで言語切替（明るい方が現在の言語）';
        } else if (hasJa) {
            wrap.title = '日本語のみ対応';
        } else if (hasEn) {
            wrap.title = '英語のみ対応';
        }

        langs.forEach(lang => {
            const badge = document.createElement('span');
            badge.className = 'lang-badge';
            badge.dataset.lang = lang;
            badge.textContent = lang.toUpperCase();
            if (langs.length === 1) {
                badge.classList.add('is-disabled', 'is-active');
                badge.title = lang === 'ja' ? '日本語のみ対応' : '英語のみ対応';
            } else {
                badge.title = lang === 'ja' ? '日本語に切替' : 'Switch to English';
            }
            wrap.appendChild(badge);
        });
        el.appendChild(wrap);
    });
}

/**
 * バッジクリックで言語切替（右上・見出しの両方）
 */
function bindLangBadgeClicks() {
    document.querySelectorAll<HTMLElement>('.lang-badge[data-lang]').forEach(badge => {
        if (badge.dataset.langClickBound === '1') return;
        badge.dataset.langClickBound = '1';
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (badge.classList.contains('is-disabled')) return;
            const lang = badge.dataset.lang;
            if (lang === 'ja' || lang === 'en') {
                setLanguage(lang);
            }
        });
    });
}

/**
 * 言語切り替えボタンと対応バッジのアクティブ表示を更新
 */
function updateLanguageUI() {
    document.querySelectorAll<HTMLElement>('.lang-badge[data-lang]').forEach(badge => {
        const toggle = badge.closest<HTMLElement>('#globalLangToggle');
        const support = badge.closest<HTMLElement>('.lang-support');
        if (!toggle && !support) return;

        // 右上トグル: 現在言語のみアクティブ
        if (toggle) {
            badge.classList.toggle('is-active', badge.dataset.lang === currentLanguage);
            return;
        }

        // 見出しバッジ: 単一言語対応なら常に明るく（対応言語が分かるように）
        const siblings = support.querySelectorAll<HTMLElement>('.lang-badge[data-lang]');
        if (siblings.length === 1) {
            badge.classList.add('is-active');
            return;
        }

        badge.classList.toggle('is-active', badge.dataset.lang === currentLanguage);
    });
}

// Mod名の#プレースホルダーを実際の値で置換して表示
function formatModText(text: string, value: string): string {
    if (!text) return text || '';
    if (!value) return text;

    const textParts = text.split('|');
    const valueParts = value.split('|');

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

/** Use exactly the same name for display and sorting. */
function getCatalogDisplayName(name: string, data: CatalogEntry): string {
  return currentLanguage === 'en' ? data.engName || name : name;
}

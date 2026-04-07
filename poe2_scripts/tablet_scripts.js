// tablet_mods.js が先に読み込まれている必要がある
// tabletModList は tablet_mods.js で定義済み

let tabletCheckedMods = new Set(); // 選択されたModのキー（modテキスト）

function formatTabletModText(text, value) {
    if (!text) return text || '';
    if (!value) return text;
    const textParts = text.split('|');
    const valueParts = value.split('|');
    const result = textParts.map((part, i) => {
        const v = valueParts[i] !== undefined ? valueParts[i] : valueParts[0];
        if (!v || v === '1') return part;
        return part.replace(/#+/, v);
    });
    return result.join('\n');
}

function updateTabletModList() {
    const listDiv = document.getElementById('TabletModList');
    if (!listDiv) return;
    
    // 初回のみソートオプションを初期化
    const sortSelect = document.getElementById('tabletSortSelect');
    if (sortSelect && sortSelect.options.length <= 5) { // デフォルト、Unique, Pre, Suf, League の5つの初期状態
        const categories = new Set();
        Object.values(tabletModList).forEach(m => {
            if (m.subGroups) m.subGroups.forEach(g => categories.add(g));
        });
        
        // カテゴリー順オプションを消して個別のカテゴリーを追加
        const leagueOpt = Array.from(sortSelect.options).find(o => o.value === 'league');
        if (leagueOpt) leagueOpt.remove();
        
        // カテゴリーを五十音順に追加
        Array.from(categories).sort().forEach(cat => {
            if (cat === 'Map') return; // Mapは一般的すぎるので除外
            const opt = document.createElement('option');
            opt.value = `cat_${cat}`;
            opt.textContent = `${cat} `;
            sortSelect.appendChild(opt);
        });
    }

    listDiv.innerHTML = '';
    
    // デフォルト並び順のウェイト
    const tabletSortMode = sortSelect?.value || 'default';
    const getTypeWeight = (key) => {
        const mod = tabletModList[key];
        
        if (tabletSortMode.startsWith('cat_')) {
            const targetCat = tabletSortMode.replace('cat_', '');
            if (mod.subGroups && mod.subGroups.includes(targetCat)) return 0;
        }

        switch (tabletSortMode) {
            case 'unique':
                if (mod.type === 'Unique') return 0;
                break;
            case 'prefix':
                if (mod.type === 'Prefix') return 0;
                break;
            case 'suffix':
                if (mod.type === 'Suffix') return 0;
                break;
            case 'league':
                if (mod.subGroups && mod.subGroups.length > 0 && mod.subGroups[0] !== 'Map') return 0;
                break;
        }

        // デフォルトの度
        if (mod.groups.includes('TowerAddContent')) return 1;
        if (mod.type === 'Unique') return 2;
        if (mod.type === 'Prefix') return 3;
        if (mod.type === 'Suffix') return 4;
        return 5;
    };

    // 選択中のものを上に、それ以外をタイプ別にソート
    const sortedKeys = Object.keys(tabletModList).sort((a, b) => {
        const aChecked = tabletCheckedMods.has(a);
        const bChecked = tabletCheckedMods.has(b);
        if (aChecked && !bChecked) return -1;
        if (!aChecked && bChecked) return 1;
        
        const aWeight = getTypeWeight(a);
        const bWeight = getTypeWeight(b);
        if (aWeight !== bWeight) return aWeight - bWeight;
        
        return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
        const value = tabletModList[key];
        const effectItem = document.createElement('div');
        effectItem.classList.add('effect-item');
        if (tabletCheckedMods.has(key)) {
            effectItem.classList.add('wanted');
        }

        const textSpan = document.createElement('span');
        textSpan.classList.add('mod-text');
        textSpan.style.paddingRight = '80px'; // バッジ用の余白
        textSpan.textContent = formatTabletModText(value.mod, value.value);
        
        effectItem.appendChild(textSpan);

        // バッジコンテナ
        const badgeContainer = document.createElement('div');
        badgeContainer.classList.add('badge-container');
        badgeContainer.style.position = 'absolute';
        badgeContainer.style.right = '12px';
        badgeContainer.style.top = '50%';
        badgeContainer.style.transform = 'translateY(-50%)';
        badgeContainer.style.display = 'flex';
        badgeContainer.style.gap = '6px';
        badgeContainer.style.pointerEvents = 'none';

        const colorMap = {
            'Ritual': '#cf3c3c',
            'Delirium': '#607d8b',
            'Breach': '#9c27b0',
            'Abyss': '#212121',
            'Expedition': '#bf9b30',
            'Irradiated': '#4caf50',
            'Map': '#1976d2',
            'Tower': 'var(--accent-gold)',
            'Monster': '#d32f2f'
        };

        // バッジ表示順: Unique > Prefix > Suffix > Tower > others
        
        // 1. Unique
        if (value.type === 'Unique') {
            const uniqueBadge = document.createElement('span');
            uniqueBadge.classList.add('badge');
            uniqueBadge.style.backgroundColor = '#af3ea3';
            uniqueBadge.textContent = 'Unique';
            badgeContainer.appendChild(uniqueBadge);
        }
        
        // 2. Prefix
        if (value.type === 'Prefix') {
            const prefixBadge = document.createElement('span');
            prefixBadge.classList.add('badge');
            prefixBadge.style.backgroundColor = 'var(--accent-red)';
            prefixBadge.textContent = 'Prefix';
            badgeContainer.appendChild(prefixBadge);
        }
        
        // 3. Suffix
        if (value.type === 'Suffix') {
            const suffixBadge = document.createElement('span');
            suffixBadge.classList.add('badge');
            suffixBadge.style.backgroundColor = 'var(--accent-blue)';
            suffixBadge.textContent = 'Suffix';
            badgeContainer.appendChild(suffixBadge);
        }

        // 4. Mechanic (SubGroups)
        if (value.subGroups) {
            value.subGroups.forEach(cat => {
                const exists = Array.from(badgeContainer.children).some(b => b.textContent === cat);
                if (!exists) {
                    const badge = document.createElement('span');
                    badge.classList.add('badge');
                    badge.style.backgroundColor = colorMap[cat] || '#555';
                    if (cat === 'Tower') badge.style.color = '#000';
                    badge.textContent = cat;
                    badgeContainer.appendChild(badge);
                }
            });
        }

        effectItem.appendChild(badgeContainer);

        effectItem.addEventListener('click', () => {
            if (tabletCheckedMods.has(key)) {
                tabletCheckedMods.delete(key);
                effectItem.classList.remove('wanted');
            } else {
                tabletCheckedMods.add(key);
                effectItem.classList.add('wanted');
            }
            updateTabletCombinedRegex();
            saveTabletState();
        });

        listDiv.appendChild(effectItem);
    });
    filterTabletEffects();
}

function updateTabletCombinedRegex() {
    const results = [];
    tabletCheckedMods.forEach(key => {
        const modData = tabletModList[key];
        const reg = modData.Regex || modData.mod.split('|')[0].substring(0, 8);
        results.push(reg);
    });

    const combined = results.length > 0 ? `"${results.join('|')}"` : '';
    const outputElem = document.getElementById('tabletRegexOutput');
    if (outputElem) outputElem.textContent = combined;
    
    const charCount = combined.length;
    const charCountElement = document.getElementById('tabletCharCount');
    if (charCountElement) {
        charCountElement.textContent = `文字数: ${charCount}`;
        charCountElement.style.color = charCount > 50 ? 'red' : '';
    }
}

function filterTabletEffects() {
    const searchInput = document.getElementById('tabletSearch');
    if (!searchInput) return;
    const term = searchInput.value.toLowerCase();
    const items = document.querySelectorAll('#TabletModList .effect-item');
    items.forEach(item => {
        // 全体のテキスト（モッド文 + バッジテキスト）を検索対象にする
        const text = item.textContent.toLowerCase();
        if (text.includes(term)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

function copyTabletToClipboard() {
    const outputElem = document.getElementById('tabletRegexOutput');
    if (!outputElem) return;
    const text = outputElem.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showNotification ? showNotification('コピーしました！') : alert('コピーしました！');
    });
}

function resetTabletAll() {
    tabletCheckedMods.clear();
    const searchInput = document.getElementById('tabletSearch');
    if (searchInput) searchInput.value = '';
    updateTabletModList();
    updateTabletCombinedRegex();
    saveTabletState();
}

function saveTabletState() {
    localStorage.setItem('poe2_tablet_checked_v2', JSON.stringify([...tabletCheckedMods]));
}

function loadTabletState() {
    const saved = localStorage.getItem('poe2_tablet_checked_v2');
    if (saved) {
        const keys = JSON.parse(saved);
        keys.forEach(k => {
            if (tabletModList[k]) tabletCheckedMods.add(k);
        });
    }
}

// 初期化
// 注意: scripts.js と共存するため、重複して window.onload 等を使わないよう検討
// ここでは poe2.html から直接初期化関数として呼び出すか、DOMContentLoaded を使う
window.addEventListener('DOMContentLoaded', () => {
    // ページ内に Tablet 用の要素がある場合のみ初期化
    if (document.getElementById('tabletContent')) {
        loadTabletState();
        updateTabletModList();
        updateTabletCombinedRegex();
    }
});

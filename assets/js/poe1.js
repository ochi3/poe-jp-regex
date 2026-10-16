function getElement(id) {
    return document.getElementById(id);
}
/** Persistent values retain their original keys and legacy formats. */
const invalidStorageValues = new Map();
function readStoredText(key) {
    try {
        return localStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function storageRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function storageStrings(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}
function storageSelections(value) {
    return storageStrings(value) || (Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && ['ng', 'wanted'].includes(item[1]))) ||
        (storageRecord(value) && Object.values(value).every(item => ['ng', 'wanted'].includes(item)));
}
function validStoredSettings(value) {
    if (!storageRecord(value))
        return false;
    return Object.entries(value).every(([key, item]) => {
        if (key === 'searchMode' && !['any', 'all'].includes(item))
            return false;
        if (/^(?:anyThreeLink|anyFourLink|anyFiveLink|anySixLink|anySixSocket|ngModChecked|mapTierChecked)$/.test(key))
            return typeof item === 'boolean';
        if (['colors', 'movement', 'weapon', 'excludeWeapons', 'selected', 'rarities', 'rarityChecked'].includes(key))
            return storageRecord(item) && Object.values(item).every(flag => typeof flag === 'boolean');
        if (key === 'selectedGems')
            return storageStrings(item);
        if (key === 'gemInfo')
            return Array.isArray(item) && item.every(gem => storageRecord(gem) && typeof gem.regex === 'string');
        return typeof item === 'string' || typeof item === 'boolean' || typeof item === 'number' ||
            (storageRecord(item) && Object.values(item).every(flag => typeof flag === 'boolean'));
    });
}
function validStoredProfile(value) {
    if (!storageRecord(value))
        return false;
    if ('settings' in value && !validStoredSettings(value.settings))
        return false;
    if ('mods' in value && !storageSelections(value.mods))
        return false;
    for (const key of ['checkedMods', 'selectedMods', 'beasts', 'scarabs', 'essences', 'tattoos', 'runegrafts']) {
        if (key in value && !(key === 'checkedMods' ? storageSelections(value[key]) : storageStrings(value[key])))
            return false;
    }
    if ('timestamp' in value && (typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)))
        return false;
    if ('gemInfo' in value && !(Array.isArray(value.gemInfo) && value.gemInfo.every(gem => storageRecord(gem) && typeof gem.regex === 'string')))
        return false;
    return true;
}
function validProfileForStorage(key, value) {
    if (!validStoredProfile(value))
        return false;
    if (/poeProfiles$/.test(key))
        return 'mods' in value && storageSelections(value.mods);
    if (/(?:flask|item|tablet)Profiles$/.test(key))
        return storageStrings(value.mods);
    if (/vendorProfiles$/.test(key))
        return validStoredSettings(value.settings);
    const catalog = key.replace(/Profiles$/, '') + 's';
    return storageStrings(value[catalog]);
}
function storedJsonFallback(key) {
    return /(?:CheckboxState$|tablet_checked|chart_checked|savedRegexOrder$|ModsData$)/.test(key) && !/modCheckboxState$/.test(key) ? [] : {};
}
function validStoredJson(key, value) {
    if (/Profiles$/.test(key))
        return storageRecord(value) && Object.values(value).every(profile => validProfileForStorage(key, profile));
    if (/savedRegexOrder$/.test(key))
        return Array.isArray(value) && value.every(item => storageRecord(item) && typeof item.name === 'string' && typeof item.type === 'string');
    if (/chart_checked/.test(key))
        return Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && ['ng', 'wanted'].includes(item[1]));
    if (/tablet_checked|(?:beast|scarab|essence|tattoo|runegraft|flaskMod|itemMod)CheckboxState$/.test(key))
        return storageStrings(value);
    if (/modCheckboxState$/.test(key))
        return storageRecord(value) && Object.values(value).every(item => ['ng', 'wanted'].includes(item));
    if (/TypeStates$/.test(key))
        return storageRecord(value) && Object.values(value).every(storageStrings);
    if (/ModsData$/.test(key))
        return Array.isArray(value) && value.every(storageRecord);
    if (/vendorSettings$|inputState$|searchModeState$|FilterState$/.test(key))
        return validStoredSettings(value);
    return storageRecord(value);
}
function readStoredJson(key) {
    const raw = readStoredText(key);
    if (raw === null)
        return storedJsonFallback(key);
    try {
        const value = JSON.parse(raw);
        if (validStoredJson(key, value))
            return value;
        // Keep usable profiles even when another entry is damaged.
        if (/Profiles$/.test(key) && storageRecord(value)) {
            invalidStorageValues.set(key, raw);
            return Object.fromEntries(Object.entries(value).filter(([, profile]) => validProfileForStorage(key, profile)));
        }
    }
    catch { /* Retain the original text for recovery before a later write. */ }
    invalidStorageValues.set(key, raw);
    return storedJsonFallback(key);
}
function writeStoredText(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    }
    catch {
        showNotification('設定を保存できませんでした。ブラウザの保存領域を確認してください。', true);
        return false;
    }
}
function writeStoredJson(key, value) {
    if (!validStoredJson(key, value)) {
        restoreStoredProfiles(key, value);
        showNotification('保存データの形式が正しくありません。', true);
        return false;
    }
    try {
        const raw = invalidStorageValues.get(key);
        if (raw !== undefined)
            localStorage.setItem(key + '__invalid_backup', raw);
        localStorage.setItem(key, JSON.stringify(value));
        invalidStorageValues.delete(key);
        return true;
    }
    catch {
        restoreStoredProfiles(key, value);
        showNotification('設定を保存できませんでした。ブラウザの保存領域を確認してください。', true);
        return false;
    }
}
/** Profile editors mutate their dictionaries before saving; undo that mutation on failure. */
function restoreStoredProfiles(key, value) {
    if (!/Profiles$/.test(key) || !storageRecord(value))
        return;
    const previous = readStoredJson(key);
    Object.keys(value).forEach(name => delete value[name]);
    Object.defineProperties(value, Object.getOwnPropertyDescriptors(previous));
}
function removeStoredValue(key) {
    try {
        localStorage.removeItem(key);
        invalidStorageValues.delete(key);
        return true;
    }
    catch {
        showNotification('設定を削除できませんでした。', true);
        return false;
    }
}
function readLanguagePreference(key) {
    return readStoredText(key) === 'en' ? 'en' : 'ja';
}
function getFixedRangeRegex(num, basePattern, optimize = false) {
    const parsedNumber = parseInt(String(num));
    num = parsedNumber;
    if (isNaN(num) || num < 0)
        return '';
    const quant = optimize ? Math.floor(num / 10) * 10 : num;
    let numberRegex;
    if (quant === 0) {
        return num === 0 ? `"${basePattern}0%"` : `"${basePattern}[0-${num}]%"`;
    }
    if (quant <= 9) {
        // 1桁: [x-9]
        numberRegex = `[${quant}-9]`;
    }
    else if (quant === 100) {
        // ちょうど100: \d.. (先頭\dで制約、後ろ2桁は.)
        return `"${basePattern}\\d..%"`;
    }
    else if (quant < 100) {
        // 2桁: 末尾桁は . に
        const str = quant.toString();
        const d0 = str[0];
        const d1 = str[1] || '0';
        if (d1 === '0') {
            // 10, 20, 30 など: [d0-9]. | \d.. (d0=9のときは 9. | \d.. → ただし100+の\d..に含まれるので 9. のみ)
            if (d0 === '9') {
                numberRegex = `9.|\\d..`;
            }
            else {
                numberRegex = `[${d0}-9].|\\d..`;
            }
        }
        else if (d0 === '9') {
            // 91, 95 など: 9[d1-9] | \d..
            numberRegex = `${d0}[${d1}-9]|\\d..`;
        }
        else {
            // 一般: d0[d1-9] | [d0+1-9]. | \d..
            numberRegex = `${d0}[${d1}-9]|[${Number(d0) + 1}-9].|\\d..`;
        }
    }
    else if (quant < 1000) {
        // 3桁
        if (quant % 100 === 0) {
            // 200, 300 など: [d0-9]..
            const d0 = quant / 100;
            numberRegex = `[${d0}-9]..`;
        }
        else {
            const str = quant.toString();
            const d0 = parseInt(str[0]);
            const d1 = parseInt(str[1] || '0');
            const d2 = parseInt(str[2] || '0');
            let parts = [];
            if (d2 === 0) {
                // 末桁が0: d0[d1-9]. | [d0+1-9]..
                if (d1 < 9) {
                    parts.push(`${d0}[${d1}-9].`);
                }
                else {
                    parts.push(`${d0}9.`);
                }
                if (d0 < 9) {
                    parts.push(`[${d0 + 1}-9]..`);
                }
            }
            else {
                // 一般: [d0+1-9].. | d0[d1+1-9]. | d0d1[d2-9]
                if (d0 < 9) {
                    parts.push(`[${d0 + 1}-9]..`);
                }
                if (d1 < 9) {
                    parts.push(`${d0}[${d1 + 1}-9].`);
                }
                parts.push(`${d0}${d1}[${d2}-9]`);
            }
            numberRegex = parts.join('|');
        }
    }
    else {
        // 1000以上
        numberRegex = `\\d{4,}%`;
    }
    return `"${basePattern}${quant >= 10 ? '(' + numberRegex + ')' : numberRegex}%"`;
}
function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
        if (typeof showNotification === 'function') {
            showNotification('コピーしました！');
        }
        else {
            alert('コピーしました！');
        }
    })
        .catch(err => {
        console.error('クリップボードへのコピーに失敗しました', err);
        if (typeof showNotification === 'function') {
            showNotification('❌ コピー失敗', true);
        }
    });
}
function generateTradeLink() {
    const url = buildTradeUrl();
    if (url) {
        window.open(url, '_blank');
    }
}
function copyTradeLink() {
    const url = buildTradeUrl();
    if (url) {
        navigator.clipboard.writeText(url)
            .then(() => {
            alert("トレードリンクをクリップボードにコピーしました");
        })
            .catch(err => {
            console.error("リンクのコピーに失敗しました:", err);
            alert("リンクのコピーに失敗しました。コンソールを確認してください。");
        });
    }
}
function onLeagueSelectChange() {
    const select = getElement('leagueSelect');
    const customInput = getElement('leagueInput');
    if (select.value === '__custom__') {
        customInput.style.display = '';
        customInput.focus();
    }
    else {
        customInput.style.display = 'none';
    }
    saveTradeSettings();
}
function toggleTradeSettings() {
    const panel = getElement('tradeSettingsPanel');
    panel.classList.toggle('open');
}
function updateSearchMode() {
    searchAllMode = getElement('searchAllRadio').checked;
    updateCombinedRegex();
}
function toggleSearchMode(mode) {
    searchAllMode = mode === 'all';
    getElement('searchAllButton').classList.toggle('active', searchAllMode);
    getElement('searchAnyButton').classList.toggle('active', !searchAllMode);
    updateCombinedRegex();
}
function copyToClipboard() {
    const resultText = getElement('combinedRegexOutput').textContent;
    navigator.clipboard.writeText(resultText)
        .then(() => {
        if (typeof showNotification === 'function') {
            showNotification('コピーしました！');
        }
        else {
            alert('コピーしました！');
        }
    })
        .catch(err => {
        console.error('クリップボードへのコピーに失敗しました', err);
        if (typeof showNotification === 'function') {
            showNotification('❌ コピー失敗', true);
        }
    });
}
function filterEffects() {
    currentSearchTerm = getElement('effectSearch').value.toLowerCase();
    const ModListDiv = getElement('ModList');
    const effects = ModListDiv.getElementsByClassName('effect-item');
    const terms = currentSearchTerm.split(/\s+/).filter(t => t);
    for (let i = 0; i < effects.length; i++) {
        if (terms.length === 0) {
            effects[i].classList.remove('hidden');
            continue;
        }
        const textSpan = effects[i].querySelector('.mod-text');
        const displayedText = textSpan ? textSpan.textContent.toLowerCase() : '';
        const modKey = effects[i].dataset.modKey;
        const mod = modKey ? ModList[modKey] : null;
        const rawJa = mod ? [mod.mod || '', ...(mod.modTags || []).map(tag => tag.ja), ...(mod.reminderText?.ja || [])].join(' ') : '';
        const rawEn = mod ? [mod.engMod || '', ...(mod.modTags || []).map(tag => tag.en), ...(mod.reminderText?.en || [])].join(' ') : '';
        const match = terms.every(term => displayedText.includes(term) ||
            rawJa.toLowerCase().includes(term) ||
            rawEn.toLowerCase().includes(term));
        effects[i].classList.toggle('hidden', !match);
    }
}
function addModCheckboxEventListeners() {
    // 選択イベントリスナー（現状はeffect-itemのクリックで処理）
}
function updateProfileList() {
    const select = getElement('profileList');
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(profiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = (name === currentValue);
        select.appendChild(option);
    });
}
function extractModNamesFromRegex(regex) {
    const modNames = [];
    const cleanRegex = regex.replace(/^"!?|"$/g, '');
    const regexParts = cleanRegex.split('|').filter(part => part.trim());
    regexParts.forEach(part => {
        Object.entries(ModList).forEach(([key, value]) => {
            if (value.Regex === part) {
                modNames.push(value.mod);
            }
        });
    });
    return modNames;
}
function copyUnidentified() {
    const text = currentLanguage === 'ja' ? '未鑑定' : 'unid';
    copyTextToClipboard(text);
}
function copyNormal() {
    const text = currentLanguage === 'ja' ? 'ル$' : '"y: n"';
    copyTextToClipboard(text);
}
function copyMagic() {
    const text = currentLanguage === 'ja' ? 'ク$' : '"y: m"';
    copyTextToClipboard(text);
}
function copyRare() {
    const text = currentLanguage === 'ja' ? 'ア$' : '"y: r"';
    copyTextToClipboard(text);
}
function copyCorrupted() {
    const text = currentLanguage === 'ja' ? 'コラプト' : 'pted';
    copyTextToClipboard(text);
}
function copyNonCorrupted() {
    const text = currentLanguage === 'ja' ? '!コラプト' : '!pted';
    copyTextToClipboard(text);
}
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    const targetContent = getElement(tabId);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    if (tabId === 'essenceContent' && typeof window.syncEssenceNameColumnWidth === 'function') {
        window.syncEssenceNameColumnWidth();
    }
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabId) {
            link.classList.add('active');
        }
    });
    if (tabId === 'changelogContent') {
        markChangelogSeen();
    }
    const tabName = tabId.replace('Content', '');
    if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, '', `#${tabName}`);
    }
}
function updateChangelogBadge() {
    const badge = getElement('changelogNewBadge');
    if (!badge)
        return;
    const seenVersion = readStoredText(CHANGELOG_STORAGE_KEY);
    badge.style.display = seenVersion === CHANGELOG_VERSION ? 'none' : 'inline-flex';
}
function markChangelogSeen() {
    writeStoredText(CHANGELOG_STORAGE_KEY, String(CHANGELOG_VERSION));
    updateChangelogBadge();
}
function handleHashChange() {
    const tabName = window.location.hash.slice(1) || 'map';
    const tabId = `${tabName}Content`;
    if (getElement(tabId)) {
        switchTab(tabId);
    }
    else {
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
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
function showNotification(message, isError = false) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
        document.body.appendChild(container);
    }
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    notification.style.cssText = `
    background: ${isError ? '#5a2d2d' : '#2d5a2d'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid ${isError ? '#e74c3c' : '#4CAF50'};
    opacity: 0;
    white-space: nowrap;
    transition: all 0.3s ease;
    animation: notificationSlideIn 0.3s ease forwards;
  `;
    container.appendChild(notification);
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
      @keyframes notificationSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
        document.head.appendChild(style);
    }
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
function openFeedbackModal() {
    const modal = getElement('feedbackModal');
    // 状態をリセット
    getElement('feedbackFormContainer').style.display = 'block';
    getElement('feedbackFooterButtons').style.display = 'block';
    getElement('feedbackSuccessMessage').style.display = 'none';
    getElement('feedbackCloseButton').style.display = 'none';
    getElement('feedbackText').value = '';
    const defaultGame = document.querySelector(`input[name="feedbackGame"][value="${FEEDBACK_DEFAULT_GAME}"]`);
    const defaultProduct = document.querySelector(`input[name="feedbackProduct"][value="${FEEDBACK_DEFAULT_PRODUCT}"]`);
    if (defaultGame)
        defaultGame.checked = true;
    if (defaultProduct)
        defaultProduct.checked = true;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeFeedbackModal() {
    const modal = getElement('feedbackModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    isFeedbackSubmitting = false;
}
function submitFeedback() {
    const text = getElement('feedbackText').value.trim();
    if (!text) {
        alert("内容を入力してください。");
        return;
    }
    if (isFeedbackSubmitting)
        return;
    isFeedbackSubmitting = true;
    // 直接送信するための隠しフォームを作成
    const form = document.createElement('form');
    form.action = FEEDBACK_FORM_URL;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    form.style.display = 'none';
    const game = document.querySelector('input[name="feedbackGame"]:checked')?.value || FEEDBACK_DEFAULT_GAME;
    const product = document.querySelector('input[name="feedbackProduct"]:checked')?.value || FEEDBACK_DEFAULT_PRODUCT;
    const appendHiddenInput = (name, value) => {
        const input = document.createElement('input');
        input.name = name;
        input.value = value;
        form.appendChild(input);
    };
    appendHiddenInput(FEEDBACK_GAME_ENTRY_ID, game);
    appendHiddenInput(FEEDBACK_PRODUCT_ENTRY_ID, product);
    appendHiddenInput(FEEDBACK_ENTRY_ID, text);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
function onFeedbackSubmitted() {
    if (!isFeedbackSubmitting)
        return;
    // 表示の切り替え
    getElement('feedbackFormContainer').style.display = 'none';
    getElement('feedbackFooterButtons').style.display = 'none';
    getElement('feedbackSuccessMessage').style.display = 'block';
    getElement('feedbackCloseButton').style.display = 'block';
}
function updateSavedRegexDisplay() {
    const container = getElement('savedRegexList');
    if (!container)
        return;
    const allProfiles = getAllProfiles();
    if (allProfiles.length === 0) {
        container.innerHTML = `
      <div style="color: #888; text-align: center; padding: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 10px;">保存されたRegexがありません</p>
        <p style="font-size: 0.85em;">各タブでプロファイルを保存すると、ここに表示されます</p>
      </div>
    `;
        return;
    }
    const sortedProfiles = restoreSortOrder(allProfiles);
    // 内容を更新
    container.innerHTML = '';
    const cardsContainer = document.createElement('div');
    cardsContainer.id = 'savedRegexCards';
    sortedProfiles.forEach(item => {
        const card = createSortableProfileCard(item.name, item.profile, item.type, item.tabId);
        cardsContainer.appendChild(card);
    });
    container.appendChild(cardsContainer);
    makeSortable();
    setTimeout(() => {
        const filterState = loadFilterState();
        if (filterState) {
            const typeFilter = getElement('typeFilter');
            if (typeFilter) {
                applyFilters();
            }
        }
        const contOp = getElement('savedRegexList');
        if (contOp)
            contOp.style.opacity = '1';
    }, 50);
}
function createActionButton(text, color, onClick, title) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
    background: ${color};
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    transition: opacity 0.2s;
    white-space: nowrap;
  `;
    btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
    btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(e);
    });
    return btn;
}
function toggleProfileDetails(card, profile, type, themeColor) {
    const detailsContainer = card.querySelector('.details-container');
    if (detailsContainer.style.maxHeight && detailsContainer.style.maxHeight !== '0px') {
        detailsContainer.style.maxHeight = '0';
        detailsContainer.style.marginTop = '0';
        return;
    }
    detailsContainer.innerHTML = '';
    const detailsContent = createDetailedView(profile, type);
    detailsContainer.appendChild(detailsContent);
    detailsContainer.style.marginTop = '8px';
    detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
}
function createDetailRow(label, value) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333;';
    const labelSpan = document.createElement('span');
    labelSpan.style.cssText = 'color: #AAA; font-size: 0.75em;';
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.style.cssText = 'color: #FFF; font-size: 0.75em; font-weight: 500;';
    valueSpan.textContent = value;
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
}
function applyFilters() {
    const typeFilter = getElement('typeFilter');
    const sortFilter = getElement('sortFilter');
    const searchInput = getElement('savedRegexSearch');
    if (!typeFilter || !sortFilter || !searchInput) {
        return;
    }
    const searchTerm = searchInput.value.toLowerCase();
    const typeFilterValue = typeFilter.value;
    const sortFilterValue = sortFilter.value;
    const cards = document.querySelectorAll('.profile-card');
    let visibleCards = [];
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const cardType = card.dataset.profileType;
        const searchMatch = !searchTerm || text.includes(searchTerm);
        const typeMatch = typeFilterValue === 'all' || cardType === typeFilterValue;
        const isVisible = searchMatch && typeMatch;
        card.style.display = isVisible ? 'block' : 'none';
        if (isVisible)
            visibleCards.push(card);
    });
    sortCards(visibleCards, sortFilterValue);
    updateFilterResultCount(visibleCards.length);
    const container = getElement('savedRegexList');
    if (container) {
        container.style.opacity = '1';
    }
}
function updateFilterResultCount(count) {
    let countElement = getElement('filterResultCount');
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.id = 'filterResultCount';
        countElement.style.cssText = `
      margin: 10px 0;
      font-size: 0.9em;
      color: #ccc;
      text-align: left;
    `;
        const filterContainer = getElement('typeFilter').parentNode;
        filterContainer.appendChild(countElement);
    }
    const totalCount = document.querySelectorAll('.profile-card').length;
    countElement.textContent = `表示: ${count} / 全${totalCount}件`;
}
function resetFilters() {
    getElement('savedRegexSearch').value = '';
    getElement('typeFilter').value = 'all';
    getElement('sortFilter').value = 'custom';
    saveFilterState();
    applyFilters();
    showNotification('フィルターをリセットしました');
}
function resetFilterControls() {
    filterControlsAdded = false;
}
function filterSavedRegex() {
    const searchTerm = getElement('savedRegexSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.profile-card');
    let visibleCount = 0;
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const match = text.includes(searchTerm);
        card.style.display = match ? 'block' : 'none';
        if (match)
            visibleCount++;
    });
    const container = getElement('savedRegexList');
    let noResultMsg = container.querySelector('.no-result-message');
    if (visibleCount === 0 && searchTerm) {
        if (!noResultMsg) {
            noResultMsg = document.createElement('div');
            noResultMsg.className = 'no-result-message';
            noResultMsg.style.cssText = 'color: #888; text-align: center; padding: 20px;';
            noResultMsg.textContent = `"${searchTerm}" に一致するプロファイルが見つかりません`;
            container.appendChild(noResultMsg);
        }
    }
    else if (noResultMsg) {
        noResultMsg.remove();
    }
}
function makeSortable() {
    const container = getElement('savedRegexCards');
    if (!container)
        return;
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragend', handleDragEnd);
}
function handleDragStart(e) {
    if (!e.target.classList.contains('profile-card'))
        return;
    isDragging = true;
    dragStartIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}
function handleDragEnter(e) {
    e.preventDefault();
    const card = e.target.closest('.profile-card');
    if (card && card !== document.querySelector('.dragging')) {
        card.classList.add('drag-over');
    }
}
function handleDragLeave(e) {
    const card = e.target.closest('.profile-card');
    if (card)
        card.classList.remove('drag-over');
}
function handleDrop(e) {
    e.preventDefault();
    const container = getElement('savedRegexCards');
    const draggingCard = document.querySelector('.dragging');
    const cards = Array.from(container.querySelectorAll('.profile-card:not(.dragging)'));
    let closestCard = null;
    let closestOffset = Number.NEGATIVE_INFINITY;
    cards.forEach(card => {
        const box = card.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestCard = card;
        }
    });
    if (closestCard)
        container.insertBefore(draggingCard, closestCard);
    else
        container.appendChild(draggingCard);
    dragEndIndex = Array.from(container.children).indexOf(draggingCard);
    saveSortOrder();
    return false;
}
function handleDragEnd(e) {
    const card = e.target.closest('.profile-card');
    if (card) {
        card.classList.remove('dragging');
        document.querySelectorAll('.profile-card').forEach(c => {
            c.classList.remove('drag-over');
        });
    }
    isDragging = false;
}
function addSortableStyles() {
    const style = document.createElement('style');
    style.textContent = `
    .profile-card.dragging { opacity: 0.5; cursor: grabbing !important; }
    .profile-card.drag-over { border-top: 2px solid #4CAF50; margin-top: 10px; }
    .profile-card { transition: all 0.2s ease; user-select: none; }
  `;
    document.head.appendChild(style);
}
function updateVendorRegex() {
    const regex = generateVendorRegex();
    const output = getElement('vendorRegexOutput');
    if (output)
        output.textContent = regex || '';
    updateVendorCharCount();
    saveVendorSettings();
}
function updateVendorProfileList() {
    const select = getElement('vendorProfileList');
    if (!select)
        return;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(vendorProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}
/**
 * 選択されたマップMod用のPoEトレードサイトリンクを生成
 */
function buildTradeUrl() {
    // UIから設定を取得
    const league = (typeof getLeagueName === 'function' ? getLeagueName() : null)
        || getElement('leagueInput')?.value
        || "Allflame";
    let tradeMethod = getElement('tradeMethodSelect').value || "any";
    let minModCount = parseInt(getElement('minModCountInput').value) || 0;
    const notStats = [];
    const wantedStats = [];
    // checkedModsから選択されたModを取得
    if ((!checkedMods || checkedMods.size === 0) && notStats.length === 0 && !getElement('memoryMapCheckbox').checked && !getElement('nightmareMapCheckbox').checked && !parseInt(getElement('minModCountInput').value) && !getElement('itemQuantityInput').value && !getElement('packSizeInput').value && !getElement('rarityInput').value && !getElement('scarabInput').value && !getElement('currencyInput').value && !getElement('mapInput').value) {
        alert("検索条件を一つ以上指定してください。");
        return null;
    }
    // デフォルトで否定するステータスを追加 (T17/Guardian/Conqueror mods)
    const defaultNotStatIds = [
        "implicit.stat_2563183002", // Map contains #'s Citadel
        "implicit.stat_3624393862", // Map is occupied by #
        "implicit.stat_1792283443" // Area is influenced by #
    ];
    defaultNotStatIds.forEach(id => {
        notStats.push({ id, disabled: false });
    });
    checkedMods.forEach((state, jpModName) => {
        const modInfo = mapModList[jpModName];
        if (!modInfo)
            return;
        // tradeStatIds（配列）を使用
        const ids = modInfo.tradeStatIds || [];
        if (ids.length === 0) {
            console.warn(`No tradeStatIds found for: ${jpModName}`);
            return;
        }
        ids.forEach(id => {
            if (!id)
                return; // 空文字のIDは無視
            const statObj = { id, disabled: false };
            if (state === 'ng') {
                notStats.push(statObj);
            }
            else {
                wantedStats.push(statObj);
            }
        });
    });
    const stats = []; // 一般的なAND条件（Mod数、メモリーマップなど）
    // クエリィオブジェクトを構築
    const query = {
        status: {
            option: tradeMethod
        },
        stats: []
    };
    // ナイトメアマップの条件を追加
    if (getElement('nightmareMapCheckbox').checked) {
        query.type = currentLanguage === 'en' ? "Nightmare Map" : "ナイトメアマップ";
    }
    // Mod数の条件を追加
    const maxModCount = parseInt(getElement('maxModCountInput').value);
    if (minModCount > 0 || maxModCount > 0) {
        const modCountFilter = {
            id: "pseudo.pseudo_number_of_affix_mods",
            value: {},
            disabled: false
        };
        if (minModCount > 0)
            modCountFilter.value.min = minModCount;
        if (maxModCount > 0)
            modCountFilter.value.max = maxModCount;
        stats.push(modCountFilter);
    }
    // メモリーマップの条件を追加
    if (getElement('memoryMapCheckbox').checked) {
        stats.push({
            id: "implicit.stat_2696470877",
            disabled: false
        });
    }
    // 入力値から一般的なマップの擬似ステータスを追加（数量、パックサイズなど）
    const scarabInput = parseInt(getElement('scarabInput').value);
    const currencyInput = parseInt(getElement('currencyInput').value);
    const mapDropInput = parseInt(getElement('mapInput').value);
    const isSearchAny = getElement('searchAnyRadio').checked;
    if (isSearchAny && (scarabInput > 0 || currencyInput > 0 || mapDropInput > 0)) {
        // count検索としてグループ化（最小 1）
        const anyStats = [];
        if (scarabInput > 0)
            anyStats.push({ id: "pseudo.pseudo_map_more_scarab_drops", value: { min: scarabInput }, disabled: false });
        if (currencyInput > 0)
            anyStats.push({ id: "pseudo.pseudo_map_more_currency_drops", value: { min: currencyInput }, disabled: false });
        if (mapDropInput > 0)
            anyStats.push({ id: "pseudo.pseudo_map_more_map_drops", value: { min: mapDropInput }, disabled: false });
        query.stats.push({
            type: "count",
            value: { min: 1 },
            filters: anyStats
        });
    }
    else {
        // 通常のAND検索動作
        if (scarabInput > 0)
            stats.push({ id: "pseudo.pseudo_map_more_scarab_drops", value: { min: scarabInput }, disabled: false });
        if (currencyInput > 0)
            stats.push({ id: "pseudo.pseudo_map_more_currency_drops", value: { min: currencyInput }, disabled: false });
        if (mapDropInput > 0)
            stats.push({ id: "pseudo.pseudo_map_more_map_drops", value: { min: mapDropInput }, disabled: false });
    }
    // 空でなければ結合された統計グループを追加
    if (stats.length > 0) {
        // 標準的なAND検索
        query.stats.push({
            type: "and",
            filters: stats
        });
    }
    // NOT統計グループを追加（NG Mod）
    if (notStats.length > 0) {
        query.stats.push({
            type: "not",
            filters: notStats
        });
    }
    // Wanted（希望）統計グループを追加
    if (wantedStats.length > 0) {
        const wantedMode = getElement('wantedModModeSelect').value;
        if (wantedMode === 'all') {
            // 全てに一致 (AND検索)
            query.stats.push({
                type: "and",
                filters: wantedStats
            });
        }
        else {
            // いずれかに一致 (RegexのようなOR検索)
            query.stats.push({
                type: "count",
                value: { min: 1 },
                filters: wantedStats
            });
        }
    }
    // デリリウムの条件を追加
    const deliriumMin = parseInt(getElement('deliriumMinInput').value);
    const deliriumMax = parseInt(getElement('deliriumMaxInput').value);
    if (deliriumMin > 0 || deliriumMax > 0) {
        const deliriumFilter = {
            id: "enchant.stat_1715784068",
            value: {},
            disabled: false
        };
        if (deliriumMin > 0)
            deliriumFilter.value.min = deliriumMin;
        if (deliriumMax > 0)
            deliriumFilter.value.max = deliriumMax;
        query.stats.push({
            type: "and",
            filters: [deliriumFilter]
        });
    }
    const mapTierMin = getElement('mapTierMinInput').value;
    const mapTierMax = getElement('mapTierMaxInput').value;
    const buyoutPrice = getElement('buyoutPriceSelect').value;
    const buyoutPriceMin = parseInt(getElement('buyoutPriceMinInput').value);
    const buyoutPriceMax = parseInt(getElement('buyoutPriceMaxInput').value);
    const filters = {};
    // 詳細フィルタ（価格）
    if (buyoutPrice || buyoutPriceMin > 0 || buyoutPriceMax > 0) {
        const priceObj = {};
        if (buyoutPrice)
            priceObj.option = buyoutPrice;
        if (buyoutPriceMin > 0)
            priceObj.min = buyoutPriceMin;
        if (buyoutPriceMax > 0)
            priceObj.max = buyoutPriceMax;
        filters.trade_filters = {
            filters: {
                price: priceObj
            }
        };
    }
    // アイテムカテゴリ（マップ）とデフォルトフィルタ（レアリティ、フォイル、コラプト）
    const corruptedStatus = getElement('corruptedStatusSelect').value;
    filters.type_filters = {
        filters: {
            category: { option: "map" },
            rarity: { option: "nonunique" }
        }
    };
    filters.misc_filters = {
        filters: {
            foil_variation: { option: "none" }
        }
    };
    if (corruptedStatus !== "") {
        filters.misc_filters.filters.corrupted = { option: corruptedStatus };
    }
    // マップ層と値のフィルタ
    const iiq = parseInt(getElement('itemQuantityInput').value);
    const packsize = parseInt(getElement('packSizeInput').value);
    const iir = parseInt(getElement('rarityInput').value);
    if (mapTierMin || mapTierMax || iiq || packsize || iir) {
        filters.map_filters = {
            filters: {}
        };
        if (mapTierMin || mapTierMax) {
            const tierFilter = {};
            if (mapTierMin)
                tierFilter.min = parseInt(mapTierMin);
            if (mapTierMax)
                tierFilter.max = parseInt(mapTierMax);
            filters.map_filters.filters.map_tier = tierFilter;
        }
        if (iiq > 0)
            filters.map_filters.filters.map_iiq = { min: iiq };
        if (packsize > 0)
            filters.map_filters.filters.map_packsize = { min: packsize };
        if (iir > 0)
            filters.map_filters.filters.map_iir = { min: iir };
    }
    // フィルタをクエリオブジェクトに割り当て
    Object.assign(query, { filters: filters });
    const queryJson = JSON.stringify({ query: query, sort: { price: "asc" } });
    const encodedQuery = encodeURIComponent(queryJson);
    const baseUrl = currentLanguage === 'en' ? 'www.pathofexile.com' : 'jp.pathofexile.com';
    return `https://${baseUrl}/trade/search/${encodeURIComponent(league)}?q=${encodedQuery}`;
}
/** 変換対象のMod一覧を取得（PoE2ではウェイストーン/石板を切替） */
function getConvertModList() {
    if (typeof window.getPoe2ConvertModList === 'function') {
        return window.getPoe2ConvertModList() || {};
    }
    return typeof ModList !== 'undefined' ? ModList : {};
}
function convertRegex() {
    const engRegex = getElement('engRegexInput').value;
    let jpRegexParts = new Set();
    let details = [];
    const sourceList = getConvertModList();
    // !確認
    const isNegated = engRegex.startsWith('"!');
    const cleanEngRegex = engRegex.replace(/^"|"$/g, '').replace(/^!/, '');
    const engParts = cleanEngRegex.split('|');
    engParts.forEach(part => {
        const trimmedPart = part.trim();
        // 空文字列はスキップ
        if (!trimmedPart)
            return;
        // 完全一致を優先して検索
        let foundExact = false;
        for (const [key, value] of Object.entries(sourceList)) {
            if (value.engRegex === trimmedPart) {
                jpRegexParts.add(value.Regex);
                details.push(value.mod);
                foundExact = true;
                break;
            }
        }
        // 完全一致が見つからなかった場合、パターンマッチングを実行
        if (!foundExact) {
            const matches = findMatchingMods(trimmedPart);
            matches.forEach(match => {
                jpRegexParts.add(match.Regex);
                details.push(match.mod);
            });
            // マッチが見つからなかった場合は警告を表示
            if (matches.length === 0) {
                console.warn(`パターン "${trimmedPart}" に一致するModが見つかりませんでした`);
            }
        }
    });
    let jpRegex = Array.from(jpRegexParts).join('|');
    if (isNegated) {
        jpRegex = `"!${jpRegex}"`;
    }
    else if (engRegex.startsWith('"') && engRegex.endsWith('"')) {
        jpRegex = `"${jpRegex}"`;
    }
    getElement('jpRegexOutput').textContent = jpRegex;
    const detailsList = getElement('detailsList');
    detailsList.innerHTML = '';
    if (details.length === 0) {
        const li = document.createElement('li');
        li.textContent = '一致するModが見つかりませんでした';
        li.style.color = 'var(--text-secondary)';
        detailsList.appendChild(li);
    }
    else {
        details.forEach(detail => {
            const li = document.createElement('li');
            li.textContent = detail;
            detailsList.appendChild(li);
        });
    }
}
/**
 * 英語パターンに一致するModを検索
 * @param {string} pattern - 検索パターン
 * @returns {Array} - マッチしたModの配列
 */
function findMatchingMods(pattern) {
    const matches = [];
    const sourceList = getConvertModList();
    try {
        // パターンを正規表現として扱う
        const regex = new RegExp(pattern, 'i'); // 大文字小文字を区別しない
        for (const [key, value] of Object.entries(sourceList)) {
            // engRegexとengModの両方でマッチングを試みる
            if (regex.test(value.engRegex || '') || regex.test(value.engMod || '')) {
                matches.push(value);
            }
        }
    }
    catch (e) {
        // 正規表現として無効な場合は、部分一致で検索
        console.warn(`正規表現エラー: ${e.message}. 部分一致で検索します。`);
        const lowerPattern = pattern.toLowerCase();
        for (const [key, value] of Object.entries(sourceList)) {
            const engRegexLower = (value.engRegex || '').toLowerCase();
            const engModLower = (value.engMod || '').toLowerCase();
            if (engRegexLower.includes(lowerPattern) || engModLower.includes(lowerPattern)) {
                matches.push(value);
            }
        }
    }
    return matches;
}
/**
 * より詳細なマッチング情報を表示する拡張版
 */
function convertRegexWithDetails() {
    const engRegex = getElement('engRegexInput').value;
    let jpRegexParts = new Set();
    let detailsWithMatch = [];
    const sourceList = getConvertModList();
    const isNegated = engRegex.startsWith('"!');
    const cleanEngRegex = engRegex.replace(/^"|"$/g, '').replace(/^!/, '');
    const engParts = cleanEngRegex.split('|');
    engParts.forEach(part => {
        const trimmedPart = part.trim();
        if (!trimmedPart)
            return;
        // 完全一致チェック
        let foundExact = false;
        for (const [key, value] of Object.entries(sourceList)) {
            if (value.engRegex === trimmedPart) {
                jpRegexParts.add(value.Regex);
                detailsWithMatch.push({
                    pattern: trimmedPart,
                    mod: value.mod,
                    matchType: '完全一致'
                });
                foundExact = true;
                break;
            }
        }
        if (!foundExact) {
            const matches = findMatchingMods(trimmedPart);
            matches.forEach(match => {
                jpRegexParts.add(match.Regex);
                detailsWithMatch.push({
                    pattern: trimmedPart,
                    mod: match.mod,
                    matchType: 'パターン一致'
                });
            });
            if (matches.length === 0) {
                detailsWithMatch.push({
                    pattern: trimmedPart,
                    mod: null,
                    matchType: '未マッチ'
                });
            }
        }
    });
    let jpRegex = Array.from(jpRegexParts).join('|');
    if (isNegated) {
        jpRegex = `"!${jpRegex}"`;
    }
    else if (engRegex.startsWith('"') && engRegex.endsWith('"')) {
        jpRegex = `"${jpRegex}"`;
    }
    getElement('jpRegexOutput').textContent = jpRegex;
    const detailsList = getElement('detailsList');
    detailsList.innerHTML = '';
    if (detailsWithMatch.length === 0) {
        const li = document.createElement('li');
        li.textContent = '検索パターンが入力されていません';
        li.style.color = 'var(--text-secondary)';
        detailsList.appendChild(li);
    }
    else {
        detailsWithMatch.forEach(detail => {
            const li = document.createElement('li');
            if (detail.matchType === '未マッチ') {
                li.innerHTML = `<span style="color: #FCA5A5;">"${detail.pattern}" - マッチなし</span>`;
            }
            else {
                li.innerHTML = `${detail.mod} <span style="color: var(--text-secondary); font-size: 0.9em;">(${detail.matchType})</span>`;
            }
            detailsList.appendChild(li);
        });
    }
}
function copyJpRegex() {
    const jpRegex = getElement('jpRegexOutput').textContent;
    navigator.clipboard.writeText(jpRegex).then(() => {
        if (typeof showNotification === 'function') {
            showNotification('コピーしました!');
        }
        else {
            alert('コピーしました!');
        }
    }).catch(err => {
        console.error('クリップボードへのコピーに失敗しました', err);
        if (typeof showNotification === 'function') {
            showNotification('❌ コピー失敗', true);
        }
        else {
            alert('クリップボードへのコピーに失敗しました。');
        }
    });
}
let ModList = { ...mapModList };
let currentLanguage = readLanguagePreference('poeLanguage');
const CHANGELOG_VERSION = 'poe1-2026-10-13';
const CHANGELOG_STORAGE_KEY = 'poe1ChangelogSeenVersion';
let checkedMods = new Map(); // キー -> 'ng' または 'wanted'
let checkedBeasts = new Set();
let checkedScarabs = new Set();
let checkedEssences = new Set();
let checkedTattoos = new Set();
let checkedRunegrafts = new Set();
let scarabSortColumn = 'price';
let scarabSortDirection = 'desc';
let essenceSortColumn = 'price';
let essenceSortDirection = 'desc';
let tattooSortColumn = 'price';
let tattooSortDirection = 'desc';
let runegraftSortColumn = 'price';
let runegraftSortDirection = 'desc';
let scarabProfiles = {};
let essenceProfiles = {};
let tattooProfiles = {};
let runegraftProfiles = {};
let currentSearchTerm = '';
function toggleLanguage() {
    setLanguage(currentLanguage === 'ja' ? 'en' : 'ja');
}
/** 指定言語に切り替え（同じ言語なら何もしない） */
function setLanguage(lang) {
    if (lang !== 'ja' && lang !== 'en')
        return;
    if (currentLanguage === lang)
        return;
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
        if (typeof updateSavedRegexDisplay === 'function')
            updateSavedRegexDisplay();
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
    document.querySelectorAll('[data-lang-support]').forEach(el => {
        if (el.querySelector('.lang-support'))
            return;
        const langs = el.getAttribute('data-lang-support').trim().split(/\s+/).filter(Boolean);
        if (!langs.length)
            return;
        const wrap = document.createElement('span');
        wrap.className = 'lang-support';
        const hasJa = langs.includes('ja');
        const hasEn = langs.includes('en');
        if (hasJa && hasEn) {
            wrap.title = 'クリックで言語切替（明るい方が現在の言語）';
        }
        else if (hasJa) {
            wrap.title = '日本語のみ対応';
        }
        else if (hasEn) {
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
            }
            else {
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
    document.querySelectorAll('.lang-badge[data-lang]').forEach(badge => {
        if (badge.dataset.langClickBound === '1')
            return;
        badge.dataset.langClickBound = '1';
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (badge.classList.contains('is-disabled'))
                return;
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
    document.querySelectorAll('.lang-badge[data-lang]').forEach(badge => {
        const toggle = badge.closest('#globalLangToggle');
        const support = badge.closest('.lang-support');
        if (!toggle && !support)
            return;
        // 右上トグル: 現在言語のみアクティブ
        if (toggle) {
            badge.classList.toggle('is-active', badge.dataset.lang === currentLanguage);
            return;
        }
        // 見出しバッジ: 単一言語対応なら常に明るく（対応言語が分かるように）
        const siblings = support.querySelectorAll('.lang-badge[data-lang]');
        if (siblings.length === 1) {
            badge.classList.add('is-active');
            return;
        }
        badge.classList.toggle('is-active', badge.dataset.lang === currentLanguage);
    });
}
// Mod名の#プレースホルダーを実際の値で置換して表示
function formatModText(text, value) {
    if (!text)
        return text || '';
    if (!value)
        return text;
    const textParts = text.split('|');
    const valueParts = value.split('|');
    const result = textParts.map((part, i) => {
        const v = valueParts[i] !== undefined ? valueParts[i] : valueParts[0];
        if (!v || v === '1')
            return part;
        return part
            .replace(/\(##\)/g, `(${v})`)
            .replace(/##/g, v)
            .replace(/#/g, v);
    });
    return result.join('\n');
}
/** Use exactly the same name for display and sorting. */
function getCatalogDisplayName(name, data) {
    return currentLanguage === 'en' ? data.engName || name : name;
}
function addEffectItem(key, value) {
    const ModListDiv = getElement('ModList');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = key;
    checkbox.id = key;
    checkbox.style.display = 'none'; // CSSでも非表示になります
    checkbox.checked = checkedMods.has(key);
    const textSpan = document.createElement('span');
    textSpan.classList.add('mod-text');
    const rawText = currentLanguage === 'ja' ? value.mod : value.engMod;
    textSpan.textContent = formatModText(rawText, value.value);
    const effectItem = document.createElement('div');
    effectItem.classList.add('effect-item');
    const selectedRegex = currentLanguage === 'ja' ? value.Regex : value.engRegex;
    if (!selectedRegex) {
        checkbox.disabled = true;
        effectItem.setAttribute('aria-disabled', 'true');
        effectItem.title = currentLanguage === 'ja' ? 'Regex未設定：手動で設定してください' : 'Regex is not configured';
    }
    effectItem.dataset.modKey = key; // キーをdata属性に保持
    // 初期状態のクラスを設定
    if (checkedMods.get(key) === 'ng') {
        effectItem.classList.add('ng');
    }
    else if (checkedMods.get(key) === 'wanted') {
        effectItem.classList.add('wanted');
    }
    // 左クリック -> NG
    effectItem.addEventListener('click', function (e) {
        e.preventDefault();
        const currentState = checkedMods.get(key);
        if (currentState === 'ng') {
            checkedMods.delete(key);
            this.classList.remove('ng');
        }
        else {
            checkedMods.set(key, 'ng');
            this.classList.remove('wanted');
            this.classList.add('ng');
        }
        saveModCheckboxState();
        updateCombinedRegex();
        updateModList();
    });
    // 右クリック -> Wanted
    effectItem.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        const currentState = checkedMods.get(key);
        if (currentState === 'wanted') {
            checkedMods.delete(key);
            this.classList.remove('wanted');
        }
        else {
            checkedMods.set(key, 'wanted');
            this.classList.remove('ng');
            this.classList.add('wanted');
        }
        saveModCheckboxState();
        updateCombinedRegex();
        updateModList();
    });
    // ティアによる色分け
    if (value.tier > 1001) {
        effectItem.style.color = '#e0b8ee';
        effectItem.classList.add('t17-effect');
    }
    else if (value.tier > 750) {
        effectItem.style.color = '#ed4c4c';
    }
    else if (value.tier > 500) {
        effectItem.style.color = '#F87171';
    }
    else if (value.tier > 250) {
        effectItem.style.color = '#FCA5A5';
    }
    else if (value.tier > 100) {
        effectItem.style.color = '#f2d5d5';
    }
    else {
        effectItem.style.color = 'white';
    }
    const label = document.createElement('label');
    label.classList.add('mod-label');
    label.htmlFor = key;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.width = '100%';
    label.style.cursor = 'pointer';
    label.appendChild(checkbox);
    label.appendChild(textSpan);
    const content = document.createElement('div');
    content.className = 'mod-label-block';
    content.style.flex = '1';
    content.style.minWidth = '0';
    content.appendChild(label);
    const extra = document.createElement('div');
    extra.className = 'mod-extra-details';
    const tags = (value.modTags || []).map(tag => tag[currentLanguage]).filter(Boolean);
    if (tags.length) {
        const tagText = document.createElement('div');
        tagText.className = 'mod-tags';
        tagText.textContent = tags.join(' · ');
        extra.appendChild(tagText);
    }
    for (const text of value.reminderText?.[currentLanguage] || []) {
        const reminder = document.createElement('p');
        reminder.className = 'mod-reminder';
        reminder.textContent = text;
        extra.appendChild(reminder);
    }
    if (getElement('showModDetailsCheckbox')?.checked === false)
        extra.classList.add('hidden');
    content.appendChild(extra);
    effectItem.appendChild(content);
    // メタデータバッジ (数量、パックサイズなど)
    const badgeContainer = document.createElement('div');
    badgeContainer.classList.add('badge-container');
    const typeBadge = document.createElement('span');
    typeBadge.classList.add('badge', 'type-badge');
    if (value.type === 'Prefix') {
        typeBadge.style.backgroundColor = 'var(--accent-red)';
        typeBadge.textContent = 'P';
    }
    else {
        typeBadge.style.backgroundColor = 'var(--accent-blue)';
        typeBadge.textContent = 'S';
    }
    badgeContainer.appendChild(typeBadge);
    if (value["map_item_drop_quantity_+%"]) {
        const qtyBadge = document.createElement('span');
        qtyBadge.classList.add('badge', 'qty-badge');
        qtyBadge.textContent = `数量 ${value["map_item_drop_quantity_+%"]}`;
        badgeContainer.appendChild(qtyBadge);
    }
    if (value["map_item_drop_rarity_+%"]) {
        const rarityBadge = document.createElement('span');
        rarityBadge.classList.add('badge', 'rarity-badge');
        rarityBadge.textContent = `レア ${value["map_item_drop_rarity_+%"]}`;
        badgeContainer.appendChild(rarityBadge);
    }
    if (value["map_pack_size_+%"]) {
        const packBadge = document.createElement('span');
        packBadge.classList.add('badge', 'pack-badge');
        packBadge.textContent = `パック ${value["map_pack_size_+%"]}`;
        badgeContainer.appendChild(packBadge);
    }
    if (value["map_map_item_drop_chance_+%_final_from_uber_mod"]) {
        const mapBadge = document.createElement('span');
        mapBadge.classList.add('badge', 'map-badge');
        mapBadge.textContent = `マップ ${value["map_map_item_drop_chance_+%_final_from_uber_mod"]}`;
        badgeContainer.appendChild(mapBadge);
    }
    if (value["map_currency_drop_chance_+%_final_from_uber_mod"]) {
        const currBadge = document.createElement('span');
        currBadge.classList.add('badge', 'currency-badge');
        currBadge.textContent = `カレンシー ${value["map_currency_drop_chance_+%_final_from_uber_mod"]}`;
        badgeContainer.appendChild(currBadge);
    }
    if (value["map_scarab_drop_chance_+%_final_from_uber_mod"]) {
        const scarabBadge = document.createElement('span');
        scarabBadge.classList.add('badge', 'scarab-badge');
        scarabBadge.textContent = `スカラベ ${value["map_scarab_drop_chance_+%_final_from_uber_mod"]}`;
        badgeContainer.appendChild(scarabBadge);
    }
    const showDetails = getElement('showModDetailsCheckbox') ? getElement('showModDetailsCheckbox').checked : true;
    if (!showDetails) {
        badgeContainer.classList.add('hidden');
    }
    effectItem.appendChild(badgeContainer);
    ModListDiv.appendChild(effectItem);
}
function updateCombinedRegex() {
    const itemQuantityValue = getElement('itemQuantityInput').value;
    const packSizeValue = getElement('packSizeInput').value;
    const rarityValue = getElement('rarityInput').value;
    const ngModChecked = getElement('ngModCheckbox').checked;
    let combinedResult = '';
    const ngResults = [];
    const wantedResults = [];
    const validCheckedMods = new Map();
    checkedMods.forEach((state, key) => {
        const mod = ModList[key];
        if (mod) {
            const regex = currentLanguage === 'ja' ? mod.Regex : mod.engRegex;
            if (!regex)
                return;
            if (state === 'ng') {
                ngResults.push(regex);
            }
            else {
                wantedResults.push(regex);
            }
            validCheckedMods.set(key, state);
        }
    });
    checkedMods = validCheckedMods;
    const uniqueNg = [...new Set(ngResults)];
    const uniqueWanted = [...new Set(wantedResults)];
    let ngString = uniqueNg.length > 0 ? `"!${uniqueNg.join('|')}"` : '';
    let wantedString = uniqueWanted.length > 0 ? `"${uniqueWanted.join('|')}"` : '';
    let ModListResult = '';
    if (ngString && wantedString) {
        ModListResult = `${ngString} ${wantedString}`;
    }
    else if (ngString) {
        ModListResult = ngString;
    }
    else if (wantedString) {
        ModListResult = wantedString;
    }
    getElement('ModListResult').textContent = ModListResult;
    if (itemQuantityValue) {
        const itemQuantityRegex = getFixedRangeRegex(itemQuantityValue, currentLanguage === 'ja' ? '量:.*' : 'm q.*');
        combinedResult += ` ${itemQuantityRegex}`;
    }
    if (packSizeValue) {
        const packSizeRegex = getFixedRangeRegex(packSizeValue, currentLanguage === 'ja' ? 'ズ:.*' : 'iz.*');
        combinedResult += ` ${packSizeRegex}`;
    }
    if (rarityValue) {
        const rarityRegex = getFixedRangeRegex(rarityValue, currentLanguage === 'ja' ? 'ティ:.*' : 'm rar.*');
        combinedResult += ` ${rarityRegex}`;
    }
    const extraRegex = generateExtraRegex();
    if (extraRegex) {
        combinedResult += ` ${extraRegex}`;
    }
    if (ModListResult) {
        if (currentLanguage === 'ja') {
            combinedResult = `${ModListResult}${combinedResult}`.trim();
        }
        else {
            combinedResult = `${ModListResult} ${combinedResult}`.trim();
        }
    }
    getElement('combinedRegexOutput').textContent = combinedResult;
    updateCharCount();
}
let searchAllMode = true;
function generateExtraRegex() {
    const scarabValue = getElement('scarabInput').value;
    const currencyValue = getElement('currencyInput').value;
    const mapValue = getElement('mapInput').value;
    let extraRegex = [];
    if (scarabValue) {
        const scarabRegex = getFixedRangeRegex(scarabValue, currentLanguage === 'ja' ? 'ラベ量.*' : 're s.*');
        extraRegex.push(scarabRegex);
    }
    if (currencyValue) {
        const currencyRegex = getFixedRangeRegex(currencyValue, currentLanguage === 'ja' ? 'シー量.*' : 're cur.*');
        extraRegex.push(currencyRegex);
    }
    if (mapValue) {
        const mapRegex = getFixedRangeRegex(mapValue, currentLanguage === 'ja' ? 'ップ量.*' : 're maps.*');
        extraRegex.push(mapRegex);
    }
    if (extraRegex.length === 0) {
        return '';
    }
    if (searchAllMode) {
        return extraRegex.join(' ');
    }
    else {
        return extraRegex.join('|').replace(/"/g, '');
    }
}
function updateCharCount() {
    const result = getElement('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = getElement('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    }
    else {
        charCountElement.style.color = '';
    }
}
function resetAll() {
    if (getElement('itemQuantityInput'))
        getElement('itemQuantityInput').value = '';
    if (getElement('packSizeInput'))
        getElement('packSizeInput').value = '';
    if (getElement('rarityInput'))
        getElement('rarityInput').value = '';
    if (getElement('scarabInput'))
        getElement('scarabInput').value = '';
    if (getElement('currencyInput'))
        getElement('currencyInput').value = '';
    if (getElement('mapInput'))
        getElement('mapInput').value = '';
    if (getElement('ngModCheckbox'))
        getElement('ngModCheckbox').checked = false;
    if (getElement('mapTierCheckbox'))
        getElement('mapTierCheckbox').checked = false;
    if (getElement('normalCheckbox'))
        getElement('normalCheckbox').checked = false;
    if (getElement('magicCheckbox'))
        getElement('magicCheckbox').checked = false;
    if (getElement('rareCheckbox'))
        getElement('rareCheckbox').checked = false;
    if (getElement('searchAllRadio'))
        getElement('searchAllRadio').checked = false;
    if (getElement('searchAnyRadio'))
        getElement('searchAnyRadio').checked = true;
    checkedMods.clear();
    updateModList();
    removeStoredValue('searchModeState');
    removeStoredValue('inputState');
    removeStoredValue('modCheckboxState');
    removeStoredValue('ngModChecked');
    removeStoredValue('mapTierChecked');
    removeStoredValue('normalChecked');
    removeStoredValue('magicChecked');
    removeStoredValue('rareChecked');
    ModList = { ...mapModList };
    checkedMods.clear();
    updateModList();
    updateCombinedRegex();
}
function saveCheckboxState() {
    const ngModCheckbox = getElement('ngModCheckbox');
    const mapTierCheckbox = getElement('mapTierCheckbox');
    writeStoredText('ngModChecked', String(ngModCheckbox.checked));
    writeStoredText('mapTierChecked', String(mapTierCheckbox.checked));
}
function loadCheckboxState() {
    const ngModChecked = readStoredText('ngModChecked') === 'true';
    const mapTierChecked = readStoredText('mapTierChecked') === 'true';
    const ngModCheckbox = getElement('ngModCheckbox');
    const mapTierCheckbox = getElement('mapTierCheckbox');
    if (ngModCheckbox)
        ngModCheckbox.checked = ngModChecked;
    if (mapTierCheckbox)
        mapTierCheckbox.checked = mapTierChecked;
}
function saveModCheckboxState() {
    if (!checkedMods)
        return;
    const state = Object.fromEntries(checkedMods);
    writeStoredJson('modCheckboxState', state);
}
function updateModList() {
    const ModListDiv = getElement('ModList');
    const currentSearchTerm = getElement('effectSearch').value.toLowerCase();
    ModListDiv.innerHTML = '';
    const isT17 = getElement('mapTierCheckbox').checked;
    const sortSelect = getElement('modSortSelect');
    const sortMethod = sortSelect ? sortSelect.value : 'default';
    const sortedModList = Object.entries(ModList)
        .filter(([key, value]) => !(value.modTier17 && !isT17))
        .sort(([keyA, valueA], [keyB, valueB]) => {
        const stateA = checkedMods.get(keyA) || 'none';
        const stateB = checkedMods.get(keyB) || 'none';
        if (stateA !== 'none' && stateB === 'none')
            return -1;
        if (stateA === 'none' && stateB !== 'none')
            return 1;
        if (stateA !== 'none' && stateB !== 'none') {
            if (stateA === 'ng' && stateB === 'wanted')
                return -1;
            if (stateA === 'wanted' && stateB === 'ng')
                return 1;
        }
        switch (sortMethod) {
            case 'tier_asc':
                if (valueA.tier !== valueB.tier)
                    return valueA.tier - valueB.tier;
                break;
            case 'tier_desc':
                if (valueA.tier !== valueB.tier)
                    return valueB.tier - valueA.tier;
                break;
            case 'type_asc':
                if (valueA.type !== valueB.type)
                    return (valueA.type || '').localeCompare(valueB.type || '');
                break;
            case 'type_desc':
                if (valueA.type !== valueB.type)
                    return (valueB.type || '').localeCompare(valueA.type || '');
                break;
            case 'quantity_asc': {
                const qA = valueA["map_map_item_drop_chance_+%"] || valueA["map_item_drop_quantity_+%"] || 0;
                const qB = valueB["map_map_item_drop_chance_+%"] || valueB["map_item_drop_quantity_+%"] || 0;
                if (qA !== qB)
                    return qA - qB;
                break;
            }
            case 'quantity_desc': {
                const qA = valueA["map_map_item_drop_chance_+%"] || valueA["map_item_drop_quantity_+%"] || 0;
                const qB = valueB["map_map_item_drop_chance_+%"] || valueB["map_item_drop_quantity_+%"] || 0;
                if (qA !== qB)
                    return qB - qA;
                break;
            }
            case 'packsize_asc': {
                const pA = valueA["map_pack_size_+%"] || 0;
                const pB = valueB["map_pack_size_+%"] || 0;
                if (pA !== pB)
                    return pA - pB;
                break;
            }
            case 'packsize_desc': {
                const pA = valueA["map_pack_size_+%"] || 0;
                const pB = valueB["map_pack_size_+%"] || 0;
                if (pA !== pB)
                    return pB - pA;
                break;
            }
            case 'rarity_asc': {
                const rA = valueA["map_item_drop_rarity_+%"] || 0;
                const rB = valueB["map_item_drop_rarity_+%"] || 0;
                if (rA !== rB)
                    return rA - rB;
                break;
            }
            case 'rarity_desc': {
                const rA = valueA["map_item_drop_rarity_+%"] || 0;
                const rB = valueB["map_item_drop_rarity_+%"] || 0;
                if (rA !== rB)
                    return rB - rA;
                break;
            }
            case 'scarab_asc': {
                const vA = valueA["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                const vB = valueB["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'scarab_desc': {
                const vA = valueA["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                const vB = valueB["map_scarab_drop_chance_+%_final_from_uber_mod"] || 0;
                if (vA !== vB)
                    return vB - vA;
                break;
            }
            case 'currency_asc': {
                const vA = valueA["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                const vB = valueB["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'currency_desc': {
                const vA = valueA["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                const vB = valueB["map_currency_drop_chance_+%_final_from_uber_mod"] || 0;
                if (vA !== vB)
                    return vB - vA;
                break;
            }
            case 'map_asc': {
                const vA = valueA["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                const vB = valueB["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'map_desc': {
                const vA = valueA["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                const vB = valueB["map_map_item_drop_chance_+%_final_from_uber_mod"] || 0;
                if (vA !== vB)
                    return vB - vA;
                break;
            }
            case 'default':
            default:
                if (valueB.tier !== valueA.tier)
                    return valueB.tier - valueA.tier;
                break;
        }
        if (valueA.type === 'Prefix' && valueB.type === 'Suffix')
            return -1;
        if (valueA.type === 'Suffix' && valueB.type === 'Prefix')
            return 1;
        return 0;
    });
    sortedModList.forEach(([key, value]) => {
        addEffectItem(key, value);
    });
    addModCheckboxEventListeners();
    if (currentSearchTerm) {
        getElement('effectSearch').value = currentSearchTerm;
        filterEffects();
    }
}
function toggleModDetails() {
    const showDetails = getElement('showModDetailsCheckbox').checked;
    writeStoredText('showModDetails', String(showDetails));
    document.querySelectorAll('.badge-container, .mod-extra-details').forEach(container => {
        if (showDetails) {
            container.classList.remove('hidden');
        }
        else {
            container.classList.add('hidden');
        }
    });
}
function loadModDetailsState() {
    const showDetails = readStoredText('showModDetails') !== 'false'; // デフォルトは表示
    getElement('showModDetailsCheckbox').checked = showDetails;
}
function loadModCheckboxState() {
    const saved = readStoredText('modCheckboxState');
    if (saved) {
        try {
            const state = readStoredJson('modCheckboxState');
            checkedMods = new Map(Object.entries(state));
        }
        catch (e) {
            console.error('Failed to load modCheckboxState', e);
            checkedMods = new Map();
        }
    }
    else {
        checkedMods = new Map();
    }
}
function saveInputState() {
    const state = {
        itemQuantity: getElement('itemQuantityInput')?.value || '',
        packSize: getElement('packSizeInput')?.value || '',
        rarity: getElement('rarityInput')?.value || '',
        scarab: getElement('scarabInput')?.value || '',
        currency: getElement('currencyInput')?.value || '',
        map: getElement('mapInput')?.value || '',
        beastBulkThreshold: getElement('beastBulkThreshold')?.value || '',
        beastBulkThresholdMax: getElement('beastBulkThresholdMax')?.value || '',
        scarabBulkThreshold: getElement('scarabBulkThreshold')?.value || '',
        scarabBulkThresholdMax: getElement('scarabBulkThresholdMax')?.value || '',
        tattooBulkThreshold: getElement('tattooBulkThreshold')?.value || '',
        tattooBulkThresholdMax: getElement('tattooBulkThresholdMax')?.value || '',
        runegraftBulkThreshold: getElement('runegraftBulkThreshold')?.value || '',
        runegraftBulkThresholdMax: getElement('runegraftBulkThresholdMax')?.value || '',
        essenceBulkThreshold: getElement('essenceBulkThreshold')?.value || '',
        essenceBulkThresholdMax: getElement('essenceBulkThresholdMax')?.value || ''
    };
    writeStoredJson('inputState', state);
}
function loadInputState() {
    const state = readStoredJson('inputState');
    if (getElement('itemQuantityInput'))
        getElement('itemQuantityInput').value = state.itemQuantity || '';
    if (getElement('packSizeInput'))
        getElement('packSizeInput').value = state.packSize || '';
    if (getElement('rarityInput'))
        getElement('rarityInput').value = state.rarity || '';
    if (getElement('scarabInput'))
        getElement('scarabInput').value = state.scarab || '';
    if (getElement('currencyInput'))
        getElement('currencyInput').value = state.currency || '';
    if (getElement('mapInput'))
        getElement('mapInput').value = state.map || '';
    if (getElement('beastBulkThreshold'))
        getElement('beastBulkThreshold').value = state.beastBulkThreshold || '10';
    if (getElement('beastBulkThresholdMax'))
        getElement('beastBulkThresholdMax').value = state.beastBulkThresholdMax || '';
    if (getElement('scarabBulkThreshold'))
        getElement('scarabBulkThreshold').value = state.scarabBulkThreshold || '10';
    if (getElement('scarabBulkThresholdMax'))
        getElement('scarabBulkThresholdMax').value = state.scarabBulkThresholdMax || '';
    if (getElement('tattooBulkThreshold'))
        getElement('tattooBulkThreshold').value = state.tattooBulkThreshold || '10';
    if (getElement('tattooBulkThresholdMax'))
        getElement('tattooBulkThresholdMax').value = state.tattooBulkThresholdMax || '';
    if (getElement('runegraftBulkThreshold'))
        getElement('runegraftBulkThreshold').value = state.runegraftBulkThreshold || '10';
    if (getElement('runegraftBulkThresholdMax'))
        getElement('runegraftBulkThresholdMax').value = state.runegraftBulkThresholdMax || '';
    if (getElement('essenceBulkThreshold'))
        getElement('essenceBulkThreshold').value = state.essenceBulkThreshold || '10';
    if (getElement('essenceBulkThresholdMax'))
        getElement('essenceBulkThresholdMax').value = state.essenceBulkThresholdMax || '';
}
const ngModCheckboxEl = getElement('ngModCheckbox');
if (ngModCheckboxEl)
    ngModCheckboxEl.addEventListener('change', saveCheckboxState);
const mapTierCheckboxEl = getElement('mapTierCheckbox');
if (mapTierCheckboxEl)
    mapTierCheckboxEl.addEventListener('change', saveCheckboxState);
function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
        rarityChecked: {
            normal: getElement('normalCheckbox')?.checked || false,
            magic: getElement('magicCheckbox')?.checked || false,
            rare: getElement('rareCheckbox')?.checked || false
        }
    };
    writeStoredJson('searchModeState', state);
}
function loadSearchModeState() {
    const state = readStoredJson('searchModeState');
    const searchMode = state.searchMode || 'any';
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
        searchModeRadio.checked = true;
    }
    if (getElement('normalCheckbox'))
        getElement('normalCheckbox').checked = state.rarityChecked?.normal || false;
    if (getElement('magicCheckbox'))
        getElement('magicCheckbox').checked = state.rarityChecked?.magic || false;
    if (getElement('rareCheckbox'))
        getElement('rareCheckbox').checked = state.rarityChecked?.rare || false;
    searchAllMode = searchMode === 'all';
}
let profiles = {};
let selectedProfile = null;
function saveProfile() {
    const profileName = getElement('profileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (profiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
        return;
    }
    if (!validateInputs())
        return;
    profiles[profileName] = {
        mods: Array.from(checkedMods), // [[id, state], ...] の形式で保存
        settings: {
            itemQuantity: getElement('itemQuantityInput').value,
            packSize: getElement('packSizeInput').value,
            rarity: getElement('rarityInput').value,
            scarab: getElement('scarabInput').value,
            currency: getElement('currencyInput').value,
            map: getElement('mapInput').value,
            searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
            ngModChecked: getElement('ngModCheckbox').checked,
            mapTierChecked: getElement('mapTierCheckbox').checked,
            rarities: {
                normal: getElement('normalCheckbox')?.checked || false,
                magic: getElement('magicCheckbox')?.checked || false,
                rare: getElement('rareCheckbox')?.checked || false
            }
        }
    };
    if (!writeStoredJson('poeProfiles', profiles))
        return false;
    updateProfileList();
    // ローカルストレージ更新
    saveModCheckboxState();
    saveInputState();
    saveCheckboxState();
    saveSearchModeState();
    showNotification(`"${profileName}" を保存しました`);
    getElement('profileName').value = '';
}
// プロファイル読み込み
function loadProfile() {
    const profileName = getElement('profileList').value;
    if (!profileName || !profiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        // 完全リセット
        resetAll();
        const profile = profiles[profileName];
        // 入力値復元
        if (getElement('itemQuantityInput'))
            getElement('itemQuantityInput').value = profile.settings?.itemQuantity || '';
        if (getElement('packSizeInput'))
            getElement('packSizeInput').value = profile.settings?.packSize || '';
        if (getElement('rarityInput'))
            getElement('rarityInput').value = profile.settings?.rarity || '';
        if (getElement('scarabInput'))
            getElement('scarabInput').value = profile.settings?.scarab || '';
        if (getElement('currencyInput'))
            getElement('currencyInput').value = profile.settings?.currency || '';
        if (getElement('mapInput'))
            getElement('mapInput').value = profile.settings?.map || '';
        // チェックボックス状態復元（オプショナルチェイニングで安全に）
        if (getElement('ngModCheckbox'))
            getElement('ngModCheckbox').checked = profile.settings?.ngModChecked || false;
        if (getElement('mapTierCheckbox'))
            getElement('mapTierCheckbox').checked = profile.settings?.mapTierChecked || false;
        if (getElement('normalCheckbox'))
            getElement('normalCheckbox').checked = profile.settings?.rarities?.normal || false;
        if (getElement('magicCheckbox'))
            getElement('magicCheckbox').checked = profile.settings?.rarities?.magic || false;
        if (getElement('rareCheckbox'))
            getElement('rareCheckbox').checked = profile.settings?.rarities?.rare || false;
        // 検索モード
        const searchMode = profile.settings?.searchMode || 'any';
        const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${searchMode}"]`);
        if (searchModeRadio) {
            searchModeRadio.checked = true;
        }
        // MODチェックボックス復元 - 存在するMODのみ
        checkedMods.clear();
        if (Array.isArray(profile.mods)) {
            profile.mods.forEach(modData => {
                // 旧バージョンのSet形式プロファイルと現在のMap形式の互換性を維持
                if (Array.isArray(modData)) {
                    const [id, state] = modData;
                    if (ModList[id])
                        checkedMods.set(id, state);
                }
                else {
                    // 以前のプロパティ形式の互換性 (デフォルトで 'ng' として扱う)
                    if (ModList[modData])
                        checkedMods.set(modData, 'ng');
                }
            });
        }
        // プロファイル名を入力欄に表示
        if (getElement('profileName'))
            getElement('profileName').value = profileName;
        saveModCheckboxState();
        updateModList();
        updateCombinedRegex();
        ['change', 'input'].forEach(event => {
            const tierCb = getElement('mapTierCheckbox');
            if (tierCb)
                tierCb.dispatchEvent(new Event(event));
            const ngCb = getElement('ngModCheckbox');
            if (ngCb)
                ngCb.dispatchEvent(new Event(event));
        });
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('プロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
// プロファイル削除
function deleteProfile() {
    const profileName = getElement('profileList').value;
    if (!profileName || !profiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
        delete profiles[profileName];
        if (!writeStoredJson('poeProfiles', profiles))
            return false;
        updateProfileList();
        showNotification(`"${profileName}" を削除しました`);
    }
}
// 入力バリデーション
function validateInputs() {
    const inputs = [
        'itemQuantityInput',
        'packSizeInput',
        'rarityInput',
        'scarabInput',
        'currencyInput',
        'mapInput'
    ];
    for (const id of inputs) {
        const value = getElement(id).value;
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
            alert(`${id.replace('Input', '')} には0以上の数値を入力してください`);
            getElement(id).focus();
            return false;
        }
    }
    return true;
}
// フィルターリセット
function resetFilterSettings() {
    resetAll();
}
function exportProfiles() {
    const data = JSON.stringify(profiles);
    const blob = new Blob([data], { type: 'application/json' });
    // ダウンロード処理...
}
function importProfiles(event) {
    const file = event.target.files?.[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = JSON.parse(String(reader.result));
            if (!validStoredJson('poeProfiles', imported))
                throw new Error('Invalid profiles');
            if (!writeStoredJson('poeProfiles', imported))
                return;
            profiles = imported;
            updateProfileList();
        }
        catch {
            showNotification('プロファイルの形式が正しくありません。JSONファイルを確認してください。', true);
        }
    };
    reader.onerror = () => showNotification('ファイルを読み込めませんでした。', true);
    reader.readAsText(file);
}
// ビースト
function loadProfiles() {
    const saved = readStoredText('poeProfiles');
    if (saved) {
        try {
            profiles = readStoredJson('poeProfiles');
            updateProfileList();
        }
        catch (e) {
            console.error('プロファイルの読み込みエラー:', e);
            profiles = {};
        }
    }
}
let beastSortColumn = 'price';
let beastSortDirection = 'desc';
// ビーストリストのレンダリング（ソート機能追加）
function renderbeastlist() {
    const container = getElement('beastlistContainer');
    if (!container || typeof beastlist === 'undefined')
        return;
    container.innerHTML = '';
    let beasts = Object.entries(beastlist);
    if (beastSortColumn) {
        beasts.sort((a, b) => {
            const [nameA, dataA] = a;
            const [nameB, dataB] = b;
            let valueA, valueB;
            switch (beastSortColumn) {
                case 'price':
                    valueA = parseFloat(dataA.chaosValue);
                    valueB = parseFloat(dataB.chaosValue);
                    break;
                case 'name':
                    valueA = getCatalogDisplayName(nameA, dataA);
                    valueB = getCatalogDisplayName(nameB, dataB);
                    break;
                case 'family':
                    valueA = dataA.family;
                    valueB = dataB.family;
                    break;
                case 'effect':
                    valueA = dataA.effect;
                    valueB = dataB.effect;
                    break;
                default:
                    return 0;
            }
            let comparison = 0;
            if (typeof valueA === 'number') {
                comparison = valueA - valueB;
            }
            else {
                comparison = valueA.localeCompare(valueB, currentLanguage === 'en' ? 'en' : 'ja');
            }
            return beastSortDirection === 'asc' ? comparison : -comparison;
        });
    }
    // 0cのアイテムを除外
    beasts = beasts.filter(([name, data]) => parseFloat(data.chaosValue) > 0);
    beasts.forEach(([name, data]) => {
        const beastItem = document.createElement('div');
        beastItem.className = 'beast-item';
        beastItem.dataset.engName = data.engName;
        beastItem.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = beastItem.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
            }
        });
        const displayName = getCatalogDisplayName(name, data);
        beastItem.innerHTML = `
      <div class="beast-select">
        <input type="checkbox" id="beast-${name}" value="${name}">
      </div>
      <div class="beast-price">${data.chaosValue}</div>
      <div class="beast-name">${displayName}</div>
      <div class="beast-family">${data.family}</div>
      <div class="beast-effect">${data.effect}</div>
    `;
        const checkbox = beastItem.querySelector('input');
        checkbox.checked = checkedBeasts.has(name);
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                checkedBeasts.add(name);
            }
            else {
                checkedBeasts.delete(name);
            }
            updateBeastRegex();
            saveBeastCheckboxState();
        });
        container.appendChild(beastItem);
    });
}
// ソート処理関数
function sortBeasts(column) {
    if (beastSortColumn === column) {
        beastSortDirection = beastSortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
        beastSortColumn = column;
        beastSortDirection = 'asc';
    }
    updateSortIcons();
    renderbeastlist();
}
function updateSortIcons() {
    const headers = document.querySelectorAll('.beast-header > div');
    headers.forEach(header => {
        header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
        if (header.dataset.column === beastSortColumn) {
            header.innerHTML += beastSortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
// ビーストRegex更新
function updateBeastRegex() {
    const selectedRegexes = Array.from(checkedBeasts).map(name => {
        const data = beastlist[name];
        return (currentLanguage === 'en' && data.enRegex) ? data.enRegex : data.regex;
    });
    const regex = selectedRegexes.length > 0 ? selectedRegexes.join('|') : '';
    getElement('beastRegexOutput').textContent = regex;
    const charCount = regex.length;
    const charCountElement = getElement('beastCharCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    }
    else {
        charCountElement.style.color = '';
    }
}
// ビースト選択リセット
function resetBeastSelection() {
    checkedBeasts.clear();
    document.querySelectorAll('#beastlistContainer input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateBeastRegex();
    saveBeastCheckboxState();
}
// ビーストRegexコピー
function copyBeastRegex() {
    const regex = getElement('beastRegexOutput').textContent;
    if (regex) {
        navigator.clipboard.writeText(regex)
            .then(() => {
            if (typeof showNotification === 'function') {
                showNotification('コピーしました！');
            }
            else {
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
// ビースト検索
function filterBeasts() {
    const term = getElement('beastSearch').value.toLowerCase();
    document.querySelectorAll('.beast-item').forEach(item => {
        const japaneseName = item.querySelector('.beast-name').textContent.toLowerCase();
        const englishName = beastlist[japaneseName]?.engName.toLowerCase() || '';
        const family = item.querySelector('.beast-family').textContent.toLowerCase();
        const effect = item.querySelector('.beast-effect').textContent.toLowerCase();
        const match = japaneseName.includes(term) ||
            englishName.includes(term) ||
            family.includes(term) ||
            effect.includes(term);
        item.style.display = match ? '' : 'none';
    });
}
// チェックボックス状態保存
function saveBeastCheckboxState() {
    const state = Array.from(checkedBeasts);
    writeStoredJson('beastCheckboxState', state);
}
// チェックボックス状態復元
function loadBeastCheckboxState() {
    const saved = readStoredText('beastCheckboxState');
    if (saved) {
        checkedBeasts = new Set(readStoredJson('beastCheckboxState'));
    }
}
function bulkSelectBeasts() {
    const thresholdInput = getElement('beastBulkThreshold');
    const thresholdMaxInput = getElement('beastBulkThresholdMax');
    if (!thresholdInput)
        return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax))
        return;
    // 現在の選択をリセット
    checkedBeasts.clear();
    // 指定範囲内の全てのビーストを選択
    Object.entries(beastlist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedBeasts.add(name);
            }
        }
    });
    // UIと状態を更新
    renderbeastlist();
    saveBeastCheckboxState();
    updateBeastRegex();
}
let beastProfiles = {};
// ビーストプロファイル保存
function saveBeastProfile() {
    const profileName = getElement('beastProfileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (beastProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
        return;
    }
    beastProfiles[profileName] = {
        beasts: Array.from(checkedBeasts),
        timestamp: Date.now()
    };
    if (!writeStoredJson('beastProfiles', beastProfiles))
        return false;
    updateBeastProfileList();
    saveBeastCheckboxState();
    showNotification(`"${profileName}" を保存しました`);
    getElement('beastProfileName').value = '';
}
// ビーストプロファイル読み込み
function loadBeastProfile() {
    const profileName = getElement('beastProfileList').value;
    if (!profileName || !beastProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        const profile = beastProfiles[profileName];
        checkedBeasts.clear();
        profile.beasts.forEach(beast => {
            if (beastlist[beast])
                checkedBeasts.add(beast);
        });
        getElement('beastProfileName').value = profileName;
        renderbeastlist();
        updateBeastRegex();
        saveBeastCheckboxState();
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('ビーストプロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
// ビーストプロファイル削除
function deleteBeastProfile() {
    const profileName = getElement('beastProfileList').value;
    if (!profileName || !beastProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
        delete beastProfiles[profileName];
        if (!writeStoredJson('beastProfiles', beastProfiles))
            return false;
        updateBeastProfileList();
        showNotification(`"${profileName}" を削除しました`);
    }
}
// ビーストプロファイルリスト更新
function updateBeastProfileList() {
    const select = getElement('beastProfileList');
    if (!select)
        return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(beastProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = (name === currentValue);
        select.appendChild(option);
    });
}
// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.beast-header > div[data-column]').forEach(header => {
        header.addEventListener('click', () => {
            sortBeasts(header.dataset.column);
        });
    });
    loadBeastCheckboxState();
    renderbeastlist();
    updateSortIcons(); // 初期ソート状態のアイコンを表示
    updateBeastRegex();
    const savedBeastProfiles = readStoredText('beastProfiles');
    if (savedBeastProfiles) {
        try {
            beastProfiles = readStoredJson('beastProfiles');
            updateBeastProfileList();
        }
        catch (e) {
            console.error('beastProfiles の読み込みエラー:', e);
            beastProfiles = {};
        }
    }
    const beastProfileSelect = getElement('beastProfileList');
    if (beastProfileSelect && !beastProfileSelect.hasEventListener) {
        beastProfileSelect.addEventListener('change', function () {
            if (this.value) {
                loadBeastProfile();
            }
            else {
                const nameInput = getElement('beastProfileName');
                if (nameInput)
                    nameInput.value = '';
            }
        });
        beastProfileSelect.hasEventListener = true;
    }
    const beastSaveBtn = getElement('saveBeastProfileBtn');
    if (beastSaveBtn)
        beastSaveBtn.addEventListener('click', saveBeastProfile);
    const beastDeleteBtn = getElement('deleteBeastProfileBtn');
    if (beastDeleteBtn)
        beastDeleteBtn.addEventListener('click', deleteBeastProfile);
});
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
function findModsFromJpRegex(jpRegex) {
    const matchedMods = new Set();
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
// 実際に使うリーグ名を取得する
function getLeagueName() {
    const select = getElement('leagueSelect');
    if (select.value === '__custom__') {
        return getElement('leagueInput').value.trim() || 'Allflame';
    }
    return select.value;
}
function saveTradeSettings() {
    const league = getLeagueName();
    const leagueIsCustom = getElement('leagueSelect').value === '__custom__';
    const method = getElement('tradeMethodSelect').value;
    const minModCount = getElement('minModCountInput').value;
    const maxModCount = getElement('maxModCountInput').value;
    const corruptedStatus = getElement('corruptedStatusSelect').value;
    const memoryMap = getElement('memoryMapCheckbox').checked;
    const nightmareMap = getElement('nightmareMapCheckbox').checked;
    const mapTierMin = getElement('mapTierMinInput').value;
    const mapTierMax = getElement('mapTierMaxInput').value;
    const buyoutPrice = getElement('buyoutPriceSelect').value;
    const buyoutPriceMin = getElement('buyoutPriceMinInput').value;
    const buyoutPriceMax = getElement('buyoutPriceMaxInput').value;
    const wantedMode = getElement('wantedModModeSelect').value;
    const deliriumMin = getElement('deliriumMinInput').value;
    const deliriumMax = getElement('deliriumMaxInput').value;
    writeStoredText('poeTradeLeague', String(league));
    writeStoredText('poeTradeLeagueIsCustom', String(leagueIsCustom));
    writeStoredText('poeTradeMethod', String(method));
    writeStoredText('poeTradeMinModCount', String(minModCount));
    writeStoredText('poeTradeMaxModCount', String(maxModCount));
    writeStoredText('poeTradeCorruptedStatus', String(corruptedStatus));
    writeStoredText('poeTradeMemoryMap', String(memoryMap));
    writeStoredText('poeTradeNightmareMap', String(nightmareMap));
    writeStoredText('poeTradeMapTierMin', String(mapTierMin));
    writeStoredText('poeTradeMapTierMax', String(mapTierMax));
    writeStoredText('poeTradeBuyoutPrice', String(buyoutPrice));
    writeStoredText('poeTradeBuyoutPriceMin', String(buyoutPriceMin));
    writeStoredText('poeTradeBuyoutPriceMax', String(buyoutPriceMax));
    writeStoredText('poeTradeWantedMode', String(wantedMode));
    writeStoredText('poeTradeDeliriumMin', String(deliriumMin));
    writeStoredText('poeTradeDeliriumMax', String(deliriumMax));
}
function loadTradeSettings() {
    const league = readStoredText('poeTradeLeague') || "Allflame";
    const leagueIsCustom = readStoredText('poeTradeLeagueIsCustom') === 'true';
    let method = readStoredText('poeTradeMethod');
    if (method === null)
        method = "securable";
    let minModCount = readStoredText('poeTradeMinModCount');
    if (minModCount === null)
        minModCount = "8";
    let maxModCount = readStoredText('poeTradeMaxModCount');
    if (maxModCount === null)
        maxModCount = "8";
    let corruptedStatus = readStoredText('poeTradeCorruptedStatus');
    if (corruptedStatus === null)
        corruptedStatus = "";
    const memoryMap = readStoredText('poeTradeMemoryMap') === 'true';
    const nightmareMap = readStoredText('poeTradeNightmareMap') === 'true';
    const mapTierMin = readStoredText('poeTradeMapTierMin') || "16";
    const mapTierMax = readStoredText('poeTradeMapTierMax') || "16";
    const buyoutPrice = readStoredText('poeTradeBuyoutPrice') || "";
    const buyoutPriceMin = readStoredText('poeTradeBuyoutPriceMin') || "";
    const buyoutPriceMax = readStoredText('poeTradeBuyoutPriceMax') || "";
    const wantedMode = readStoredText('poeTradeWantedMode') || "any";
    const deliriumMin = readStoredText('poeTradeDeliriumMin') || "";
    const deliriumMax = readStoredText('poeTradeDeliriumMax') || "";
    const select = getElement('leagueSelect');
    const customInput = getElement('leagueInput');
    if (leagueIsCustom) {
        select.value = '__custom__';
        customInput.style.display = '';
        customInput.value = league;
    }
    else {
        // 保存されたリーグがセレクトの選択肢にあればそれを選択
        const hasOption = Array.from(select.options).some(opt => opt.value === league);
        if (hasOption) {
            select.value = league;
            customInput.style.display = 'none';
        }
        else {
            select.value = '__custom__';
            customInput.style.display = '';
            customInput.value = league;
        }
    }
    getElement('tradeMethodSelect').value = method;
    getElement('minModCountInput').value = minModCount;
    getElement('maxModCountInput').value = maxModCount;
    getElement('corruptedStatusSelect').value = corruptedStatus;
    getElement('memoryMapCheckbox').checked = memoryMap;
    getElement('nightmareMapCheckbox').checked = nightmareMap;
    getElement('mapTierMinInput').value = mapTierMin;
    getElement('mapTierMaxInput').value = mapTierMax;
    getElement('buyoutPriceSelect').value = buyoutPrice;
    getElement('buyoutPriceMinInput').value = buyoutPriceMin;
    getElement('buyoutPriceMaxInput').value = buyoutPriceMax;
    getElement('wantedModModeSelect').value = wantedMode;
    getElement('deliriumMinInput').value = deliriumMin;
    getElement('deliriumMaxInput').value = deliriumMax;
}
const originalOnLoad = window.onload;
window.onload = function () {
    if (originalOnLoad)
        originalOnLoad();
    loadTradeSettings();
};
// 要望・不具合報告
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdrlylmOp34bzayRTtuW19QyO9sRhV1BD0y_kUUnL8Mn5vHtQ/formResponse";
const FEEDBACK_ENTRY_ID = "entry.386755920";
const FEEDBACK_GAME_ENTRY_ID = "entry.2048327629";
const FEEDBACK_PRODUCT_ENTRY_ID = "entry.1137147546";
const FEEDBACK_DEFAULT_GAME = "PoE1";
const FEEDBACK_DEFAULT_PRODUCT = "Regex(サイト)";
let isFeedbackSubmitting = false;
// モーダルの外側をクリックして閉じる
window.onclick = function (event) {
    const feedbackModal = getElement('feedbackModal');
    const flaskModal = getElement('flaskModGroupModal');
    const itemModal = getElement('itemModGroupModal');
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    }
    else if (event.target === flaskModal) {
        closeFlaskModal();
    }
    else if (event.target === itemModal) {
        closeItemModal();
    }
};
// スカラベ関連ロジック
function renderscarablist() {
    const container = getElement('scarablistContainer');
    if (!container || typeof scarablist === 'undefined')
        return;
    if (!container)
        return;
    container.innerHTML = '';
    let scarabs = Object.entries(scarablist);
    if (scarabSortColumn) {
        scarabs.sort((a, b) => {
            const [nameA, dataA] = a;
            const [nameB, dataB] = b;
            let valueA, valueB;
            switch (scarabSortColumn) {
                case 'price':
                    valueA = parseFloat(dataA.chaosValue);
                    valueB = parseFloat(dataB.chaosValue);
                    break;
                case 'name':
                    valueA = getCatalogDisplayName(nameA, dataA);
                    valueB = getCatalogDisplayName(nameB, dataB);
                    break;
                case 'description':
                    valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
                    valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
                    break;
                default:
                    return 0;
            }
            let comparison = 0;
            if (typeof valueA === 'number') {
                comparison = valueA - valueB;
            }
            else {
                comparison = valueA.localeCompare(valueB, currentLanguage === 'en' ? 'en' : 'ja');
            }
            return scarabSortDirection === 'asc' ? comparison : -comparison;
        });
    }
    // 0cのアイテムを除外
    scarabs = scarabs.filter(([name, data]) => parseFloat(data.chaosValue) > 0);
    scarabs.forEach(([name, data]) => {
        const scarabItem = document.createElement('div');
        scarabItem.className = 'scarab-item';
        scarabItem.dataset.engName = data.engName;
        scarabItem.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = scarabItem.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
            }
        });
        const displayName = getCatalogDisplayName(name, data);
        const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
        scarabItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="scarab-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div style="width: 0; padding: 0; visibility: hidden;"></div>
      <div class="scarab-effect">${displayDesc}</div>
    `;
        const checkbox = scarabItem.querySelector('input');
        checkbox.checked = checkedScarabs.has(name);
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                checkedScarabs.add(name);
            }
            else {
                checkedScarabs.delete(name);
            }
            updateScarabRegex();
            saveScarabCheckboxState();
        });
        container.appendChild(scarabItem);
    });
}
function sortScarabs(column) {
    if (scarabSortColumn === column) {
        scarabSortDirection = scarabSortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
        scarabSortColumn = column;
        scarabSortDirection = 'asc';
    }
    updateScarabSortIcons();
    renderscarablist();
}
function updateScarabSortIcons() {
    const headers = document.querySelectorAll('#scarabContent .scarab-header > div');
    headers.forEach(header => {
        header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
        if (header.dataset.column === scarabSortColumn) {
            header.innerHTML += scarabSortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
function updateScarabRegex() {
    const selectedRegexes = Array.from(checkedScarabs).map(name => {
        const item = scarablist[name];
        return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
    });
    const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
    getElement('scarabRegexOutput').textContent = regex;
    const charCount = regex.length;
    const charCountElement = getElement('scarabCharCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    }
    else {
        charCountElement.style.color = '';
    }
}
function resetScarabSelection() {
    checkedScarabs.clear();
    document.querySelectorAll('#scarablistContainer input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateScarabRegex();
    saveScarabCheckboxState();
}
function bulkSelectScarabs() {
    const thresholdInput = getElement('scarabBulkThreshold');
    const thresholdMaxInput = getElement('scarabBulkThresholdMax');
    if (!thresholdInput)
        return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax))
        return;
    checkedScarabs.clear();
    Object.entries(scarablist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedScarabs.add(name);
            }
        }
    });
    renderscarablist();
    saveScarabCheckboxState();
    updateScarabRegex();
}
function copyScarabRegex() {
    const regex = getElement('scarabRegexOutput').textContent;
    if (regex) {
        copyTextToClipboard(regex);
    }
}
function filterScarabs() {
    const term = getElement('scarabSearch').value.toLowerCase();
    document.querySelectorAll('#scarablistContainer .scarab-item').forEach(item => {
        const japaneseName = item.querySelector('.scarab-name').textContent.toLowerCase();
        const englishName = scarablist[japaneseName]?.engName.toLowerCase() || '';
        const description = item.querySelector('.scarab-effect').textContent.toLowerCase();
        const match = japaneseName.includes(term) ||
            englishName.includes(term) ||
            description.includes(term);
        item.style.display = match ? '' : 'none';
    });
}
function saveScarabCheckboxState() {
    const state = Array.from(checkedScarabs);
    writeStoredJson('scarabCheckboxState', state);
}
function loadScarabCheckboxState() {
    const saved = readStoredText('scarabCheckboxState');
    if (saved) {
        try {
            checkedScarabs = new Set(readStoredJson('scarabCheckboxState'));
        }
        catch (e) {
            console.error('scarabCheckboxState 読み込みエラー:', e);
            checkedScarabs = new Set();
        }
    }
}
function saveScarabProfile() {
    const profileName = getElement('scarabProfileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (scarabProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
        return;
    }
    scarabProfiles[profileName] = {
        scarabs: Array.from(checkedScarabs),
        timestamp: Date.now()
    };
    if (!writeStoredJson('scarabProfiles', scarabProfiles))
        return false;
    updateScarabProfileList();
    saveScarabCheckboxState();
    showNotification(`"${profileName}" を保存しました`);
    getElement('scarabProfileName').value = '';
}
function loadScarabProfile() {
    const profileName = getElement('scarabProfileList').value;
    if (!profileName || !scarabProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        const profile = scarabProfiles[profileName];
        checkedScarabs.clear();
        profile.scarabs.forEach(scarab => {
            if (scarablist[scarab])
                checkedScarabs.add(scarab);
        });
        getElement('scarabProfileName').value = profileName;
        renderscarablist();
        updateScarabRegex();
        saveScarabCheckboxState();
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('スカラベプロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
function deleteScarabProfile() {
    const profileName = getElement('scarabProfileList').value;
    if (!profileName || !scarabProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
        delete scarabProfiles[profileName];
        if (!writeStoredJson('scarabProfiles', scarabProfiles))
            return false;
        updateScarabProfileList();
        showNotification(`"${profileName}" を削除しました`);
    }
}
function updateScarabProfileList() {
    const select = getElement('scarabProfileList');
    if (!select)
        return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(scarabProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = (name === currentValue);
        select.appendChild(option);
    });
}
// --- エッセンス関連ロジック ---
// 表示番号は慟哭=1、下位ほど大きく（特殊は「特殊」）
const ESSENCE_TIERS = [
    { en: 'Deafening', ja: '慟哭', level: 1 },
    { en: 'Shrieking', ja: '喚き', level: 2 },
    { en: 'Screaming', ja: '叫び', level: 3 },
    { en: 'Wailing', ja: '呻き', level: 4 },
    { en: 'Weeping', ja: '嘆き', level: 5 },
    { en: 'Muttering', ja: '呟き', level: 6 },
    { en: 'Whispering', ja: '囁き', level: 7 },
];
function getEssenceTierInfo(data) {
    const engName = data?.engName || '';
    for (const tier of ESSENCE_TIERS) {
        if (engName.startsWith(tier.en + ' ')) {
            return { ...tier, label: String(tier.level), isSpecial: false };
        }
    }
    // ヒステリー等の上位エッセンス
    return { en: 'Special', ja: '特殊', level: 0, label: '特殊', isSpecial: true };
}
function getEssenceTierLabel(data) {
    return getEssenceTierInfo(data).label;
}
function renderessencelist() {
    const container = getElement('essencelistContainer');
    if (!container || typeof essencelist === 'undefined')
        return;
    container.innerHTML = '';
    let essences = Object.entries(essencelist);
    if (essenceSortColumn) {
        essences.sort((a, b) => {
            const [nameA, dataA] = a;
            const [nameB, dataB] = b;
            let valueA, valueB;
            switch (essenceSortColumn) {
                case 'price':
                    valueA = parseFloat(dataA.chaosValue);
                    valueB = parseFloat(dataB.chaosValue);
                    break;
                case 'name':
                    valueA = getCatalogDisplayName(nameA, dataA);
                    valueB = getCatalogDisplayName(nameB, dataB);
                    break;
                case 'tier':
                    valueA = getEssenceTierInfo(dataA).level;
                    valueB = getEssenceTierInfo(dataB).level;
                    break;
                default:
                    return 0;
            }
            let comparison = 0;
            if (typeof valueA === 'number') {
                comparison = valueA - valueB;
            }
            else {
                comparison = valueA.localeCompare(valueB, currentLanguage === 'en' ? 'en' : 'ja');
            }
            return essenceSortDirection === 'asc' ? comparison : -comparison;
        });
    }
    // 0cのアイテムを除外
    essences = essences.filter(([name, data]) => parseFloat(data.chaosValue) > 0);
    essences.forEach(([name, data]) => {
        const essenceItem = document.createElement('div');
        essenceItem.className = 'essence-item';
        essenceItem.dataset.jpName = name;
        essenceItem.dataset.engName = data.engName;
        const tierInfo = getEssenceTierInfo(data);
        essenceItem.dataset.tierJa = tierInfo.ja;
        essenceItem.dataset.tierEn = tierInfo.en;
        essenceItem.dataset.tierLabel = tierInfo.label;
        essenceItem.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = essenceItem.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
            }
        });
        const displayName = getCatalogDisplayName(name, data);
        const displayTier = getEssenceTierLabel(data);
        essenceItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="essence-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="beast-family essence-tier">${displayTier}</div>
    `;
        const checkbox = essenceItem.querySelector('input');
        checkbox.checked = checkedEssences.has(name);
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                checkedEssences.add(name);
            }
            else {
                checkedEssences.delete(name);
            }
            updateEssenceRegex();
            saveEssenceCheckboxState();
        });
        container.appendChild(essenceItem);
    });
    // 一番長い名前の幅に合わせて Tier をすぐ横に揃える
    syncEssenceNameColumnWidth();
}
function syncEssenceNameColumnWidth() {
    const table = document.querySelector('#essenceContent .essence-table-container');
    const container = getElement('essencelistContainer');
    // Hidden tabs cannot provide a meaningful name width; measure after opening.
    if (!table || !container || table.getClientRects().length === 0)
        return;
    table.style.removeProperty('--essence-name-width');
    const nameEls = container.querySelectorAll('.scarab-name');
    let maxWidth = 0;
    nameEls.forEach(el => {
        maxWidth = Math.max(maxWidth, el.scrollWidth);
    });
    const headerName = document.querySelector('#essenceContent .essence-header .beast-col-name');
    if (headerName) {
        maxWidth = Math.max(maxWidth, headerName.scrollWidth);
    }
    if (maxWidth > 0) {
        table.style.setProperty('--essence-name-width', `${Math.ceil(maxWidth)}px`);
    }
}
function sortEssences(column) {
    if (essenceSortColumn === column) {
        essenceSortDirection = essenceSortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
        essenceSortColumn = column;
        essenceSortDirection = 'asc';
    }
    updateEssenceSortIcons();
    renderessencelist();
}
function updateEssenceSortIcons() {
    const headers = document.querySelectorAll('#essenceContent .essence-header > div');
    headers.forEach(header => {
        header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
        if (header.dataset.column === essenceSortColumn) {
            header.innerHTML += essenceSortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
function updateEssenceRegex() {
    const selectedRegexes = Array.from(checkedEssences).map(name => {
        const item = essencelist[name];
        return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
    });
    const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
    getElement('essenceRegexOutput').textContent = regex;
    const charCount = regex.length;
    const charCountElement = getElement('essenceCharCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    }
    else {
        charCountElement.style.color = '';
    }
}
function resetEssenceSelection() {
    checkedEssences.clear();
    document.querySelectorAll('#essencelistContainer input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateEssenceRegex();
    saveEssenceCheckboxState();
}
function bulkSelectEssences() {
    const thresholdInput = getElement('essenceBulkThreshold');
    const thresholdMaxInput = getElement('essenceBulkThresholdMax');
    if (!thresholdInput)
        return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax))
        return;
    checkedEssences.clear();
    Object.entries(essencelist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedEssences.add(name);
            }
        }
    });
    renderessencelist();
    saveEssenceCheckboxState();
    updateEssenceRegex();
}
function copyEssenceRegex() {
    const regex = getElement('essenceRegexOutput').textContent;
    if (regex) {
        copyTextToClipboard(regex);
    }
}
function filterEssences() {
    const term = getElement('essenceSearch').value.toLowerCase();
    document.querySelectorAll('#essencelistContainer .essence-item').forEach(item => {
        const jpName = (item.dataset.jpName || '').toLowerCase();
        const engName = (item.dataset.engName || '').toLowerCase();
        const tierJa = (item.dataset.tierJa || '').toLowerCase();
        const tierEn = (item.dataset.tierEn || '').toLowerCase();
        const tierLabel = (item.dataset.tierLabel || '').toLowerCase();
        const match = jpName.includes(term) ||
            engName.includes(term) ||
            tierJa.includes(term) ||
            tierEn.includes(term) ||
            tierLabel.includes(term);
        item.style.display = match ? '' : 'none';
    });
}
function saveEssenceCheckboxState() {
    const state = Array.from(checkedEssences);
    writeStoredJson('essenceCheckboxState', state);
}
function loadEssenceCheckboxState() {
    const saved = readStoredText('essenceCheckboxState');
    if (saved) {
        try {
            checkedEssences = new Set(readStoredJson('essenceCheckboxState'));
        }
        catch (e) {
            console.error('essenceCheckboxState 読み込みエラー:', e);
            checkedEssences = new Set();
        }
    }
}
function saveEssenceProfile() {
    const profileName = getElement('essenceProfileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (essenceProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
        return;
    }
    essenceProfiles[profileName] = {
        essences: Array.from(checkedEssences),
        timestamp: Date.now()
    };
    if (!writeStoredJson('essenceProfiles', essenceProfiles))
        return false;
    updateEssenceProfileList();
    saveEssenceCheckboxState();
    showNotification(`"${profileName}" を保存しました`);
    getElement('essenceProfileName').value = '';
}
function loadEssenceProfile() {
    const profileName = getElement('essenceProfileList').value;
    if (!profileName || !essenceProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        const profile = essenceProfiles[profileName];
        checkedEssences.clear();
        profile.essences.forEach(essence => {
            if (essencelist[essence])
                checkedEssences.add(essence);
        });
        getElement('essenceProfileName').value = profileName;
        renderessencelist();
        updateEssenceRegex();
        saveEssenceCheckboxState();
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('エッセンスプロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
function deleteEssenceProfile() {
    const profileName = getElement('essenceProfileList').value;
    if (!profileName || !essenceProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
        delete essenceProfiles[profileName];
        if (!writeStoredJson('essenceProfiles', essenceProfiles))
            return false;
        updateEssenceProfileList();
        showNotification(`"${profileName}" を削除しました`);
    }
}
function updateEssenceProfileList() {
    const select = getElement('essenceProfileList');
    if (!select)
        return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(essenceProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = (name === currentValue);
        select.appendChild(option);
    });
}
// --- タトゥー関連ロジック ---
function rendertattoolist() {
    const container = getElement('tattoolistContainer');
    if (!container || typeof tattoolist === 'undefined')
        return;
    if (!container)
        return;
    container.innerHTML = '';
    let Tattoos = Object.entries(tattoolist);
    if (tattooSortColumn) {
        Tattoos.sort((a, b) => {
            const [nameA, dataA] = a;
            const [nameB, dataB] = b;
            let valueA, valueB;
            switch (tattooSortColumn) {
                case 'price':
                    valueA = parseFloat(dataA.chaosValue);
                    valueB = parseFloat(dataB.chaosValue);
                    break;
                case 'name':
                    valueA = getCatalogDisplayName(nameA, dataA);
                    valueB = getCatalogDisplayName(nameB, dataB);
                    break;
                case 'attribute':
                    valueA = String(dataA.attribute || '');
                    valueB = String(dataB.attribute || '');
                    break;
                case 'description':
                    valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
                    valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
                    break;
                default:
                    return 0;
            }
            let comparison = 0;
            if (typeof valueA === 'number') {
                comparison = valueA - valueB;
            }
            else {
                comparison = valueA.localeCompare(valueB, currentLanguage === 'en' ? 'en' : 'ja');
            }
            return tattooSortDirection === 'asc' ? comparison : -comparison;
        });
    }
    // 0cのアイテムを除外
    Tattoos = Tattoos.filter(([name, data]) => parseFloat(data.chaosValue) > 0);
    Tattoos.forEach(([name, data]) => {
        const tattooItem = document.createElement('div');
        tattooItem.className = 'tattoo-item';
        tattooItem.dataset.jaName = name;
        tattooItem.dataset.engName = data.engName;
        tattooItem.dataset.attribute = data.attribute || '';
        tattooItem.dataset.description = data.description || '';
        tattooItem.dataset.enDescription = data.enDescription || '';
        tattooItem.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = tattooItem.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
            }
        });
        const displayName = getCatalogDisplayName(name, data);
        const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
        tattooItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="tattoo-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="scarab-attribute ${data.attribute ? data.attribute.toLowerCase() : ''}">${data.attribute || ''}</div>
      <div class="scarab-effect">${displayDesc}</div>
    `;
        const checkbox = tattooItem.querySelector('input');
        checkbox.checked = checkedTattoos.has(name);
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                checkedTattoos.add(name);
            }
            else {
                checkedTattoos.delete(name);
            }
            updateTattooRegex();
            saveTattooCheckboxState();
        });
        container.appendChild(tattooItem);
    });
}
function sortTattoos(column) {
    if (tattooSortColumn === column) {
        tattooSortDirection = tattooSortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
        tattooSortColumn = column;
        tattooSortDirection = 'asc';
    }
    updateTattooSortIcons();
    rendertattoolist();
}
function updateTattooSortIcons() {
    const headers = document.querySelectorAll('#tattooContent .tattoo-header > div');
    headers.forEach(header => {
        header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
        if (header.dataset.column === tattooSortColumn) {
            header.innerHTML += tattooSortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
function updateTattooRegex() {
    const selectedRegexes = Array.from(checkedTattoos).map(name => {
        const item = tattoolist[name];
        return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
    });
    const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
    getElement('tattooRegexOutput').textContent = regex;
    const charCount = regex.length;
    const charCountElement = getElement('tattooCharCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    }
    else {
        charCountElement.style.color = '';
    }
}
function resetTattooSelection() {
    checkedTattoos.clear();
    document.querySelectorAll('#tattoolistContainer input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateTattooRegex();
    saveTattooCheckboxState();
}
function bulkSelectTattoos() {
    const thresholdInput = getElement('tattooBulkThreshold');
    const thresholdMaxInput = getElement('tattooBulkThresholdMax');
    if (!thresholdInput)
        return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax))
        return;
    checkedTattoos.clear();
    Object.entries(tattoolist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedTattoos.add(name);
            }
        }
    });
    rendertattoolist();
    saveTattooCheckboxState();
    updateTattooRegex();
}
function copyTattooRegex() {
    const regex = getElement('tattooRegexOutput').textContent;
    if (regex) {
        copyTextToClipboard(regex);
    }
}
function filterTattoos() {
    const term = getElement('tattooSearch').value.toLowerCase();
    document.querySelectorAll('#tattoolistContainer .tattoo-item').forEach(item => {
        const jaName = (item.dataset.jaName || '').toLowerCase();
        const enName = (item.dataset.engName || '').toLowerCase();
        const attribute = (item.dataset.attribute || '').toLowerCase();
        const jaDesc = (item.dataset.description || '').toLowerCase();
        const enDesc = (item.dataset.enDescription || '').toLowerCase();
        const match = jaName.includes(term) ||
            enName.includes(term) ||
            attribute.includes(term) ||
            jaDesc.includes(term) ||
            enDesc.includes(term);
        item.style.display = match ? '' : 'none';
    });
}
function saveTattooCheckboxState() {
    const state = Array.from(checkedTattoos);
    writeStoredJson('tattooCheckboxState', state);
}
function loadTattooCheckboxState() {
    const saved = readStoredText('tattooCheckboxState');
    if (saved) {
        try {
            checkedTattoos = new Set(readStoredJson('tattooCheckboxState'));
        }
        catch (e) {
            console.error('tattooCheckboxState 読み込みエラー:', e);
            checkedTattoos = new Set();
        }
    }
}
function saveTattooProfile() {
    const profileName = getElement('tattooProfileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (tattooProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
        return;
    }
    tattooProfiles[profileName] = {
        tattoos: Array.from(checkedTattoos),
        timestamp: Date.now()
    };
    if (!writeStoredJson('tattooProfiles', tattooProfiles))
        return false;
    updateTattooProfileList();
    saveTattooCheckboxState();
    showNotification(`"${profileName}" を保存しました`);
    getElement('tattooProfileName').value = '';
}
function loadTattooProfile() {
    const profileName = getElement('tattooProfileList').value;
    if (!profileName || !tattooProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        const profile = tattooProfiles[profileName];
        checkedTattoos.clear();
        profile.tattoos.forEach(tattoo => {
            if (tattoolist[tattoo])
                checkedTattoos.add(tattoo);
        });
        getElement('tattooProfileName').value = profileName;
        rendertattoolist();
        updateTattooRegex();
        saveTattooCheckboxState();
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('タトゥープロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
function deleteTattooProfile() {
    const profileName = getElement('tattooProfileList').value;
    if (!profileName || !tattooProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
        delete tattooProfiles[profileName];
        if (!writeStoredJson('tattooProfiles', tattooProfiles))
            return false;
        updateTattooProfileList();
        showNotification(`"${profileName}" を削除しました`);
    }
}
function updateTattooProfileList() {
    const select = getElement('tattooProfileList');
    if (!select)
        return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(tattooProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = (name === currentValue);
        select.appendChild(option);
    });
}
// --- ルーングラフト関連ロジック ---
function renderrunegraftlist() {
    const container = getElement('runegraftlistContainer');
    if (!container || typeof runegraftlist === 'undefined')
        return;
    if (!container)
        return;
    container.innerHTML = '';
    let Runegrafts = Object.entries(runegraftlist);
    if (runegraftSortColumn) {
        Runegrafts.sort((a, b) => {
            const [nameA, dataA] = a;
            const [nameB, dataB] = b;
            let valueA, valueB;
            switch (runegraftSortColumn) {
                case 'price':
                    valueA = parseFloat(dataA.chaosValue);
                    valueB = parseFloat(dataB.chaosValue);
                    break;
                case 'name':
                    valueA = getCatalogDisplayName(nameA, dataA);
                    valueB = getCatalogDisplayName(nameB, dataB);
                    break;
                case 'attribute':
                    valueA = String(dataA.attribute || '');
                    valueB = String(dataB.attribute || '');
                    break;
                case 'description':
                    valueA = currentLanguage === 'ja' ? dataA.description : dataA.enDescription;
                    valueB = currentLanguage === 'ja' ? dataB.description : dataB.enDescription;
                    break;
                default:
                    return 0;
            }
            let comparison = 0;
            if (typeof valueA === 'number') {
                comparison = valueA - valueB;
            }
            else {
                comparison = valueA.localeCompare(valueB, currentLanguage === 'en' ? 'en' : 'ja');
            }
            return runegraftSortDirection === 'asc' ? comparison : -comparison;
        });
    }
    // 0cのアイテムを除外
    Runegrafts = Runegrafts.filter(([name, data]) => parseFloat(data.chaosValue) > 0);
    Runegrafts.forEach(([name, data]) => {
        const runegraftItem = document.createElement('div');
        runegraftItem.className = 'runegraft-item';
        runegraftItem.dataset.jaName = name;
        runegraftItem.dataset.engName = data.engName;
        runegraftItem.dataset.attribute = data.attribute || '';
        runegraftItem.dataset.description = data.description || '';
        runegraftItem.dataset.enDescription = data.enDescription || '';
        runegraftItem.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = runegraftItem.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
            }
        });
        const displayName = getCatalogDisplayName(name, data);
        const displayDesc = currentLanguage === 'ja' ? data.description : data.enDescription;
        runegraftItem.innerHTML = `
      <div class="scarab-select">
        <input type="checkbox" id="runegraft-${name}" value="${name}">
      </div>
      <div class="scarab-price">${data.chaosValue}</div>
      <div class="scarab-name">${displayName}</div>
      <div class="scarab-attribute ${data.attribute ? data.attribute.toLowerCase() : ''}">${data.attribute || ''}</div>
      <div class="scarab-effect">${displayDesc}</div>
    `;
        const checkbox = runegraftItem.querySelector('input');
        checkbox.checked = checkedRunegrafts.has(name);
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                checkedRunegrafts.add(name);
            }
            else {
                checkedRunegrafts.delete(name);
            }
            updateRunegraftRegex();
            saveRunegraftCheckboxState();
        });
        container.appendChild(runegraftItem);
    });
}
function sortRunegrafts(column) {
    if (runegraftSortColumn === column) {
        runegraftSortDirection = runegraftSortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
        runegraftSortColumn = column;
        runegraftSortDirection = 'asc';
    }
    updateRunegraftSortIcons();
    renderrunegraftlist();
}
function updateRunegraftSortIcons() {
    const headers = document.querySelectorAll('#runegraftContent .runegraft-header > div');
    headers.forEach(header => {
        header.innerHTML = header.innerHTML.replace(/ ↑| ↓/g, '');
        if (header.dataset.column === runegraftSortColumn) {
            header.innerHTML += runegraftSortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
function updateRunegraftRegex() {
    const selectedRegexes = Array.from(checkedRunegrafts).map(name => {
        const item = runegraftlist[name];
        return currentLanguage === 'en' ? (item.enRegex || item.regex) : item.regex;
    });
    const regex = selectedRegexes.length > 0 ? `"${selectedRegexes.join('|')}"` : '';
    getElement('runegraftRegexOutput').textContent = regex;
    const charCount = regex.length;
    const charCountElement = getElement('runegraftCharCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > 250) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ' (250文字を超えています)';
    }
    else {
        charCountElement.style.color = '';
    }
}
function resetRunegraftSelection() {
    checkedRunegrafts.clear();
    document.querySelectorAll('#runegraftlistContainer input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateRunegraftRegex();
    saveRunegraftCheckboxState();
}
function bulkSelectRunegrafts() {
    const thresholdInput = getElement('runegraftBulkThreshold');
    const thresholdMaxInput = getElement('runegraftBulkThresholdMax');
    if (!thresholdInput)
        return;
    const threshold = parseFloat(thresholdInput.value);
    const thresholdMax = thresholdMaxInput ? parseFloat(thresholdMaxInput.value) : NaN;
    if (isNaN(threshold) && isNaN(thresholdMax))
        return;
    checkedRunegrafts.clear();
    Object.entries(runegraftlist).forEach(([name, data]) => {
        const price = parseFloat(data.chaosValue);
        if (!isNaN(price)) {
            const matchMin = isNaN(threshold) || price >= threshold;
            const matchMax = isNaN(thresholdMax) || price <= thresholdMax;
            if (matchMin && matchMax && price > 0) {
                checkedRunegrafts.add(name);
            }
        }
    });
    renderrunegraftlist();
    saveRunegraftCheckboxState();
    updateRunegraftRegex();
}
function copyRunegraftRegex() {
    const regex = getElement('runegraftRegexOutput').textContent;
    if (regex) {
        copyTextToClipboard(regex);
    }
}
function filterRunegrafts() {
    const term = getElement('runegraftSearch').value.toLowerCase();
    document.querySelectorAll('#runegraftlistContainer .runegraft-item').forEach(item => {
        const jaName = (item.dataset.jaName || '').toLowerCase();
        const enName = (item.dataset.engName || '').toLowerCase();
        const attribute = (item.dataset.attribute || '').toLowerCase();
        const jaDesc = (item.dataset.description || '').toLowerCase();
        const enDesc = (item.dataset.enDescription || '').toLowerCase();
        const match = jaName.includes(term) ||
            enName.includes(term) ||
            attribute.includes(term) ||
            jaDesc.includes(term) ||
            enDesc.includes(term);
        item.style.display = match ? '' : 'none';
    });
}
function saveRunegraftCheckboxState() {
    const state = Array.from(checkedRunegrafts);
    writeStoredJson('runegraftCheckboxState', state);
}
function loadRunegraftCheckboxState() {
    const saved = readStoredText('runegraftCheckboxState');
    if (saved) {
        try {
            checkedRunegrafts = new Set(readStoredJson('runegraftCheckboxState'));
        }
        catch (e) {
            console.error('runegraftCheckboxState 読み込みエラー:', e);
            checkedRunegrafts = new Set();
        }
    }
}
function saveRunegraftProfile() {
    const profileName = getElement('runegraftProfileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (runegraftProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか？`)) {
        return;
    }
    runegraftProfiles[profileName] = {
        runegrafts: Array.from(checkedRunegrafts),
        timestamp: Date.now()
    };
    if (!writeStoredJson('runegraftProfiles', runegraftProfiles))
        return false;
    updateRunegraftProfileList();
    saveRunegraftCheckboxState();
    showNotification(`"${profileName}" を保存しました`);
    getElement('runegraftProfileName').value = '';
}
function loadRunegraftProfile() {
    const profileName = getElement('runegraftProfileList').value;
    if (!profileName || !runegraftProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        const profile = runegraftProfiles[profileName];
        checkedRunegrafts.clear();
        profile.runegrafts.forEach(runegraft => {
            if (runegraftlist[runegraft])
                checkedRunegrafts.add(runegraft);
        });
        getElement('runegraftProfileName').value = profileName;
        renderrunegraftlist();
        updateRunegraftRegex();
        saveRunegraftCheckboxState();
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('ルーングラフトプロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
function deleteRunegraftProfile() {
    const profileName = getElement('runegraftProfileList').value;
    if (!profileName || !runegraftProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を完全に削除しますか？\nこの操作は元に戻せません！`)) {
        delete runegraftProfiles[profileName];
        if (!writeStoredJson('runegraftProfiles', runegraftProfiles))
            return false;
        updateRunegraftProfileList();
        showNotification(`"${profileName}" を削除しました`);
    }
}
function updateRunegraftProfileList() {
    const select = getElement('runegraftProfileList');
    if (!select)
        return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(runegraftProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.selected = (name === currentValue);
        select.appendChild(option);
    });
}
function initializeApplication() {
    loadLanguageState();
    updateChangelogBadge();
    const initialTab = window.location.hash.slice(1) || 'map';
    const initialTabId = `${initialTab}Content`;
    if (getElement(initialTabId)) {
        switchTab(initialTabId);
    }
    else {
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }
    window.addEventListener('hashchange', handleHashChange);
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });
    // 各種状態を読み込み
    loadProfiles();
    loadCheckboxState();
    loadInputState();
    loadModCheckboxState();
    loadSearchModeState();
    loadModDetailsState();
    const profileSelect = getElement('profileList');
    if (profileSelect && !profileSelect.hasEventListener) {
        profileSelect.addEventListener('change', function () {
            if (this.value)
                loadProfile();
            else
                getElement('profileName').value = '';
        });
        profileSelect.hasEventListener = true;
    }
    loadScarabCheckboxState();
    renderscarablist();
    updateScarabSortIcons();
    updateScarabRegex();
    loadEssenceCheckboxState();
    renderessencelist();
    updateEssenceSortIcons();
    updateEssenceRegex();
    loadTattooCheckboxState();
    rendertattoolist();
    updateTattooSortIcons();
    updateTattooRegex();
    loadRunegraftCheckboxState();
    renderrunegraftlist();
    updateRunegraftSortIcons();
    updateRunegraftRegex();
    // 各カテゴリのプロファイルを読み込み
    const savedScarabProfiles = readStoredText('scarabProfiles');
    if (savedScarabProfiles)
        scarabProfiles = readStoredJson('scarabProfiles') || {};
    updateScarabProfileList();
    const savedEssenceProfiles = readStoredText('essenceProfiles');
    if (savedEssenceProfiles)
        essenceProfiles = readStoredJson('essenceProfiles') || {};
    updateEssenceProfileList();
    const savedTattooProfiles = readStoredText('tattooProfiles');
    if (savedTattooProfiles)
        tattooProfiles = readStoredJson('tattooProfiles') || {};
    updateTattooProfileList();
    const savedRunegraftProfiles = readStoredText('runegraftProfiles');
    if (savedRunegraftProfiles)
        runegraftProfiles = readStoredJson('runegraftProfiles') || {};
    updateRunegraftProfileList();
    // プロファイル選択時のイベントリスナーを設定
    const scarabProfileSelect = getElement('scarabProfileList');
    if (scarabProfileSelect && !scarabProfileSelect.hasEventListener) {
        scarabProfileSelect.addEventListener('change', function () {
            if (this.value)
                loadScarabProfile();
            else
                getElement('scarabProfileName').value = '';
        });
        scarabProfileSelect.hasEventListener = true;
    }
    const tattooProfileSelect = getElement('tattooProfileList');
    if (tattooProfileSelect && !tattooProfileSelect.hasEventListener) {
        tattooProfileSelect.addEventListener('change', function () {
            if (this.value)
                loadTattooProfile();
            else
                getElement('tattooProfileName').value = '';
        });
        tattooProfileSelect.hasEventListener = true;
    }
    const runegraftProfileSelect = getElement('runegraftProfileList');
    if (runegraftProfileSelect && !runegraftProfileSelect.hasEventListener) {
        runegraftProfileSelect.addEventListener('change', function () {
            if (this.value)
                loadRunegraftProfile();
            else
                getElement('runegraftProfileName').value = '';
        });
        runegraftProfileSelect.hasEventListener = true;
    }
    // 詳細表示の切り替えイベントを設定
    const detailCheckbox = getElement('showModDetailsCheckbox');
    if (detailCheckbox) {
        detailCheckbox.addEventListener('change', toggleModDetails);
    }
    initializeTooltips();
    updateModList();
    updateCombinedRegex();
}
document.addEventListener('DOMContentLoaded', initializeApplication);
/**
 * 海図（Voyage Chart / Deepwater）MOD タブ UI
 * map_mods / scripts.js の操作感に合わせた簡易版
 */
(function () {
    let chartCheckedMods = new Map(); // key -> 'ng' | 'wanted'
    let chartShowAdjacent = true;
    let chartShowVoyage = true;
    function chartList() {
        return typeof chartModList !== "undefined" ? chartModList : {};
    }
    function formatChartModText(text, value) {
        if (typeof formatModText === "function") {
            return formatModText(text, value);
        }
        if (!text || !value)
            return text || "";
        const textParts = text.split("|");
        const valueParts = value.split("|");
        return textParts
            .map((part, i) => {
            const v = valueParts[i] !== undefined ? valueParts[i] : valueParts[0];
            if (!v || v === "1")
                return part;
            return part
                .replace(/\(##\)/g, `(${v})`)
                .replace(/##/g, v)
                .replace(/#/g, v);
        })
            .join("\n");
    }
    function addChartEffectItem(key, value) {
        const listDiv = getElement("ChartModList");
        if (!listDiv)
            return;
        const textSpan = document.createElement("span");
        textSpan.classList.add("mod-text");
        const lang = typeof currentLanguage !== "undefined" ? currentLanguage : "ja";
        const rawText = lang === "ja" ? value.mod : value.engMod;
        textSpan.textContent = formatChartModText(rawText, value.value);
        const effectItem = document.createElement("div");
        effectItem.classList.add("effect-item");
        effectItem.dataset.modKey = key;
        if (chartCheckedMods.get(key) === "ng") {
            effectItem.classList.add("ng");
        }
        else if (chartCheckedMods.get(key) === "wanted") {
            effectItem.classList.add("wanted");
        }
        effectItem.addEventListener("click", function (e) {
            e.preventDefault();
            const cur = chartCheckedMods.get(key);
            if (cur === "ng")
                chartCheckedMods.delete(key);
            else
                chartCheckedMods.set(key, "ng");
            saveChartChecked();
            window.updateChartModList();
            window.updateChartCombinedRegex();
        });
        effectItem.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            const cur = chartCheckedMods.get(key);
            if (cur === "wanted")
                chartCheckedMods.delete(key);
            else
                chartCheckedMods.set(key, "wanted");
            saveChartChecked();
            window.updateChartModList();
            window.updateChartCombinedRegex();
        });
        const badgeContainer = document.createElement("div");
        badgeContainer.classList.add("badge-container");
        const typeBadge = document.createElement("span");
        typeBadge.classList.add("badge", "type-badge");
        if (value.type === "Prefix") {
            typeBadge.style.backgroundColor = "var(--accent-red)";
            typeBadge.textContent = "P";
        }
        else if (value.type === "Suffix") {
            typeBadge.style.backgroundColor = "var(--accent-blue)";
            typeBadge.textContent = "S";
        }
        else if (value.type === "Voyage" || value.voyage) {
            typeBadge.style.backgroundColor = "var(--accent-primary, #4ecdc4)";
            typeBadge.textContent = "航";
        }
        else {
            typeBadge.style.backgroundColor = "var(--accent-gold, #c9a227)";
            typeBadge.textContent = "隣";
        }
        badgeContainer.appendChild(typeBadge);
        const qty = value["map_item_drop_quantity_+%"];
        if (qty) {
            const b = document.createElement("span");
            b.classList.add("badge", "qty-badge");
            b.textContent = `数量 ${qty}`;
            badgeContainer.appendChild(b);
        }
        const rarity = value["map_item_drop_rarity_+%"];
        if (rarity) {
            const b = document.createElement("span");
            b.classList.add("badge", "rarity-badge");
            b.textContent = `レア ${rarity}`;
            badgeContainer.appendChild(b);
        }
        const pack = value["map_pack_size_+%"];
        if (pack) {
            const b = document.createElement("span");
            b.classList.add("badge", "pack-badge");
            b.textContent = `パック ${pack}`;
            badgeContainer.appendChild(b);
        }
        const sulphur = value["map_deepwater_league_resource_found_+%"];
        if (sulphur) {
            const b = document.createElement("span");
            b.classList.add("badge", "sulphur-badge");
            b.textContent = `硫黄 ${sulphur}`;
            badgeContainer.appendChild(b);
        }
        effectItem.appendChild(textSpan);
        effectItem.appendChild(badgeContainer);
        listDiv.appendChild(effectItem);
    }
    window.updateChartModList = function () {
        const listDiv = getElement("ChartModList");
        if (!listDiv)
            return;
        listDiv.innerHTML = "";
        const search = (getElement("chartEffectSearch")?.value || "").toLowerCase();
        const sortMethod = getElement("chartSortSelect")?.value || "default";
        chartShowAdjacent = !!getElement("chartAdjacentCheckbox")?.checked;
        chartShowVoyage = !!getElement("chartVoyageCheckbox")?.checked;
        const entries = Object.entries(chartList()).filter(([, v]) => {
            if (v.adjacent && !chartShowAdjacent)
                return false;
            if ((v.voyage || v.type === "Voyage") && !chartShowVoyage)
                return false;
            return true;
        });
        // 航海・隣接を先に、その後プレフィックス / サフィックス
        const typeOrder = (v) => {
            if (v.voyage || v.type === "Voyage")
                return 0;
            if (v.adjacent || v.type === "Adjacent")
                return 1;
            if (v.type === "Prefix")
                return 2;
            if (v.type === "Suffix")
                return 3;
            return 4;
        };
        entries.sort(([keyA, a], [keyB, b]) => {
            const aSel = chartCheckedMods.has(keyA) ? 0 : 1;
            const bSel = chartCheckedMods.has(keyB) ? 0 : 1;
            if (aSel !== bSel)
                return aSel - bSel;
            switch (sortMethod) {
                case "type_asc":
                    return typeOrder(a) - typeOrder(b) || keyA.localeCompare(keyB);
                case "quantity_desc":
                    return (b["map_item_drop_quantity_+%"] || 0) - (a["map_item_drop_quantity_+%"] || 0);
                case "sulphur_desc":
                    return ((b["map_deepwater_league_resource_found_+%"] || 0) -
                        (a["map_deepwater_league_resource_found_+%"] || 0));
                case "weight_desc":
                    return (b.weight || 0) - (a.weight || 0);
                default:
                    return typeOrder(a) - typeOrder(b) || keyA.localeCompare(keyB);
            }
        });
        entries.forEach(([key, value]) => {
            if (search) {
                const hay = `${value.mod} ${value.engMod} ${value.nameJa || ""} ${value.nameEn || ""}`.toLowerCase();
                if (!hay.includes(search))
                    return;
            }
            addChartEffectItem(key, value);
        });
    };
    window.updateChartCombinedRegex = function () {
        const out = getElement("chartRegexOutput");
        const countEl = getElement("chartCharCount");
        if (!out)
            return;
        const lang = typeof currentLanguage !== "undefined" ? currentLanguage : "ja";
        const ng = [];
        const wanted = [];
        const valid = new Map();
        chartCheckedMods.forEach((state, key) => {
            const mod = chartList()[key];
            if (!mod)
                return;
            const rx = lang === "ja" ? mod.Regex : mod.engRegex;
            if (!rx)
                return;
            if (state === "ng")
                ng.push(rx);
            else
                wanted.push(rx);
            valid.set(key, state);
        });
        chartCheckedMods = valid;
        const uniqNg = [...new Set(ng)];
        const uniqWanted = [...new Set(wanted)];
        let result = "";
        if (uniqNg.length && uniqWanted.length) {
            result = `"!${uniqNg.join("|")}" "${uniqWanted.join("|")}"`;
        }
        else if (uniqNg.length) {
            result = `"!${uniqNg.join("|")}"`;
        }
        else if (uniqWanted.length) {
            result = `"${uniqWanted.join("|")}"`;
        }
        // 数量 / 硫黄 数値フィルタ
        const qty = getElement("chartQtyInput")?.value;
        const sulphur = getElement("chartSulphurInput")?.value;
        const extras = [];
        if (qty && typeof getFixedRangeRegex === "function") {
            extras.push(getFixedRangeRegex(qty, lang === "ja" ? "量:.*" : "m q.*"));
        }
        if (sulphur && typeof getFixedRangeRegex === "function") {
            extras.push(getFixedRangeRegex(sulphur, lang === "ja" ? "硫黄.*" : "ulphur.*"));
        }
        if (extras.length) {
            result = result ? `${result} ${extras.join(" ")}` : extras.join(" ");
        }
        out.textContent = result;
        if (countEl) {
            countEl.textContent = `${result.length} 文字`;
            countEl.classList.toggle("over-limit", result.length > 250);
        }
    };
    window.copyChartRegex = function () {
        const text = getElement("chartRegexOutput")?.textContent || "";
        if (!text)
            return;
        navigator.clipboard.writeText(text);
    };
    window.resetChartMods = function () {
        chartCheckedMods.clear();
        const search = getElement("chartEffectSearch");
        if (search)
            search.value = "";
        const qty = getElement("chartQtyInput");
        if (qty)
            qty.value = "";
        const sulphur = getElement("chartSulphurInput");
        if (sulphur)
            sulphur.value = "";
        saveChartChecked();
        window.updateChartModList();
        window.updateChartCombinedRegex();
    };
    function saveChartChecked() {
        writeStoredJson("poe1_chart_checked_v1", [...chartCheckedMods.entries()]);
    }
    function loadChartChecked() {
        try {
            const raw = readStoredText("poe1_chart_checked_v1");
            if (!raw)
                return;
            const entries = readStoredJson("poe1_chart_checked_v1");
            chartCheckedMods = new Map();
            for (const [k, v] of entries) {
                if (chartList()[k])
                    chartCheckedMods.set(k, v);
            }
        }
        catch (_) {
            chartCheckedMods = new Map();
        }
    }
    // 言語切替時に再描画
    const origSetLanguage = window.setLanguage;
    if (typeof origSetLanguage === "function") {
        window.setLanguage = function (lang) {
            origSetLanguage(lang);
            const chart = getElement("chartContent");
            if (chart && chart.style.display !== "none") {
                window.updateChartModList();
                window.updateChartCombinedRegex();
            }
        };
    }
    else {
        const origToggle = window.toggleLanguage;
        if (typeof origToggle === "function") {
            window.toggleLanguage = function () {
                origToggle();
                const chart = getElement("chartContent");
                if (chart && chart.style.display !== "none") {
                    window.updateChartModList();
                    window.updateChartCombinedRegex();
                }
            };
        }
    }
    // トップナビ切替後に海図リストを描画
    const origSwitchTab = window.switchTab;
    if (typeof origSwitchTab === "function") {
        window.switchTab = function (tabId) {
            origSwitchTab(tabId);
            if (tabId === "chartContent") {
                window.updateChartModList();
                window.updateChartCombinedRegex();
            }
        };
    }
    document.addEventListener("DOMContentLoaded", () => {
        loadChartChecked();
        if (window.location.hash === "#chart") {
            window.updateChartModList();
            window.updateChartCombinedRegex();
        }
    });
})();
let flaskEventListenersInitialized = false;
let rawFlaskMods = [];
let flaskCheckedMods = new Set();
let flaskProfiles = {};
let currentFlaskModalGroup = null;
let flaskModalSelectedMods = new Set();
window.rawFlaskMods = [];
const flaskFileMapping = {
    'utility': 'data/poe1/flasks/utility_flask,flask,default.json',
    'life': 'data/poe1/flasks/life_flask,flask,default.json',
    'mana': 'data/poe1/flasks/mana_flask,flask,default.json',
    'hybrid': 'data/poe1/flasks/hybrid_flask,flask,default.json',
    'tincture': 'data/poe1/flasks/tincture.json'
};
// フラスコプロファイルリストの変更イベントを追加
function setupFlaskProfileEventListeners() {
    if (flaskEventListenersInitialized)
        return;
    const flaskProfileList = getElement('flaskProfileList');
    if (flaskProfileList) {
        flaskProfileList.addEventListener('change', function () {
            if (this.value) {
                loadFlaskProfile();
            }
            else {
                getElement('flaskProfileName').value = '';
            }
        });
    }
    flaskEventListenersInitialized = true;
}
// フラスコMod読み込み
async function loadFlaskMods() {
    const flaskTypeSelect = getElement('flaskTypeSelect');
    const statusElement = getElement('flaskModLoadingStatus');
    if (!flaskTypeSelect || !statusElement) {
        console.error('フラスコModの要素が見つかりません');
        return;
    }
    const flaskType = flaskTypeSelect.value;
    try {
        statusElement.textContent = `${flaskType} フラスコModデータを読み込み中...`;
        statusElement.style.color = "#FFA500";
        console.log(`Loading ${flaskType} flask mods...`);
        const fileName = flaskFileMapping[flaskType] || `${flaskType}_flask,flask,default.json`;
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();
        const processedData = {
            prefix: [],
            suffix: []
        };
        if (rawData.mods && rawData.mods.prefix) {
            Object.entries(rawData.mods.prefix).forEach(([familyName, mods]) => {
                mods.forEach(mod => {
                    processedData.prefix.push({
                        ...mod,
                        generation_type: 'prefix',
                        family: familyName
                    });
                });
            });
        }
        if (rawData.mods && rawData.mods.suffix) {
            Object.entries(rawData.mods.suffix).forEach(([familyName, mods]) => {
                mods.forEach(mod => {
                    processedData.suffix.push({
                        ...mod,
                        generation_type: 'suffix',
                        family: familyName
                    });
                });
            });
        }
        rawFlaskMods = [...processedData.prefix, ...processedData.suffix];
        console.log(`Loaded ${rawFlaskMods.length} mods for ${flaskType}`, rawFlaskMods);
        statusElement.textContent = `${flaskType} フラスコModデータ (${rawFlaskMods.length}件) 読み込み完了`;
        statusElement.style.color = "#4CAF50";
        updateSeparatedFlaskModLists();
        updateCombinedFlaskRegex();
        window.rawFlaskMods = rawFlaskMods;
        try {
            writeStoredJson('flaskModsData', rawFlaskMods);
        }
        catch (e) {
            console.error('フラスコMODデータの保存エラー:', e);
        }
    }
    catch (error) {
        console.error("フラスコModの読み込みエラー:", error);
        statusElement.textContent = `エラー: ${error.message}`;
        statusElement.style.color = "#FF0000";
    }
}
function restoreFlaskTypeState(flaskType) {
    const savedStates = readStoredJson('flaskTypeStates');
    if (savedStates[flaskType]) {
        flaskCheckedMods = new Set(savedStates[flaskType]);
        updateSeparatedFlaskModLists();
        updateCombinedFlaskRegex();
    }
}
function saveFlaskTypeState(flaskType) {
    const savedStates = readStoredJson('flaskTypeStates');
    savedStates[flaskType] = Array.from(flaskCheckedMods);
    writeStoredJson('flaskTypeStates', savedStates);
}
function updateSeparatedFlaskModLists() {
    const prefixListDiv = getElement('flaskPrefixModList');
    const suffixListDiv = getElement('flaskSuffixModList');
    if (!prefixListDiv || !suffixListDiv) {
        console.error('フラスコPrefix/Suffixリスト要素が見つかりません');
        return;
    }
    const currentSearchTerm = getElement('flaskModSearch').value.toLowerCase();
    prefixListDiv.innerHTML = '';
    suffixListDiv.innerHTML = '';
    if (!rawFlaskMods || rawFlaskMods.length === 0) {
        const message = '<div style="color: #888; text-align: center; padding: 20px;">Modデータが読み込まれていません</div>';
        prefixListDiv.innerHTML = message;
        suffixListDiv.innerHTML = message;
        return;
    }
    console.log(`Updating separated flask mod lists with ${rawFlaskMods.length} mods`);
    const { prefixGroups, suffixGroups } = groupAndSeparateFlaskMods(rawFlaskMods);
    const sortGroups = (groups) => {
        return Object.values(groups).sort((a, b) => {
            const selectedA = a.mods.filter(mod => flaskCheckedMods.has(mod.name)).length > 0 ? 1 : 0;
            const selectedB = b.mods.filter(mod => flaskCheckedMods.has(mod.name)).length > 0 ? 1 : 0;
            return selectedB - selectedA;
        });
    };
    sortGroups(prefixGroups).forEach(group => addFlaskGroupToColumn(group, prefixListDiv));
    sortGroups(suffixGroups).forEach(group => addFlaskGroupToColumn(group, suffixListDiv));
    if (Object.keys(prefixGroups).length === 0) {
        prefixListDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Prefix Modがありません</div>';
    }
    if (Object.keys(suffixGroups).length === 0) {
        suffixListDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Suffix Modがありません</div>';
    }
    if (currentSearchTerm) {
        getElement('flaskModSearch').value = currentSearchTerm;
        filterFlaskMods();
    }
}
function groupAndSeparateFlaskMods(mods) {
    const prefixGroups = {};
    const suffixGroups = {};
    mods.forEach(mod => {
        const familyName = mod.family;
        const targetGroups = mod.generation_type === 'prefix' ? prefixGroups : suffixGroups;
        if (!targetGroups[familyName]) {
            const familyMods = mods.filter(m => m.family === familyName && m.generation_type === mod.generation_type);
            const highestLevelMod = familyMods.reduce((highest, current) => {
                return (current.required_level || 0) > (highest.required_level || 0) ? current : highest;
            }, familyMods[0]);
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
function addFlaskGroupToColumn(group, container) {
    const groupItem = document.createElement('div');
    groupItem.className = `mod-group-item ${group.generationType}`;
    groupItem.dataset.groupKey = group.baseKey;
    groupItem.dataset.generationType = group.generationType;
    groupItem.dataset.searchText = (typeof getRecombGroupSearchText === 'function')
        ? getRecombGroupSearchText(group)
        : group.baseKey;
    const selectedCount = group.mods.filter(mod => flaskCheckedMods.has(mod.name)).length;
    const isSelected = selectedCount > 0;
    if (isSelected) {
        groupItem.classList.add('selected');
    }
    const groupHeader = document.createElement('div');
    groupHeader.className = 'mod-group-header';
    const groupTitle = document.createElement('span');
    groupTitle.textContent = (typeof getRecombModDisplayText === 'function')
        ? getRecombModDisplayText(group.highestTierMod)
        : (group.displayName);
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
        openFlaskGroupModal(group);
    });
    container.appendChild(groupItem);
}
function openFlaskGroupModal(group) {
    currentFlaskModalGroup = group;
    flaskModalSelectedMods.clear();
    group.mods.forEach(mod => {
        if (flaskCheckedMods.has(mod.name)) {
            flaskModalSelectedMods.add(mod.name);
        }
    });
    const modal = getElement('flaskModGroupModal');
    const modalTitle = getElement('flaskModalTitle');
    const modalModList = getElement('flaskModalModList');
    const titleColor = group.generationType === 'prefix' ? '#E74C3C' : '#3498DB';
    const titleText = (typeof getRecombModDisplayText === 'function')
        ? getRecombModDisplayText(group.highestTierMod)
        : group.displayName;
    modalTitle.innerHTML = `<span style="color: ${titleColor}">${titleText}</span> (${group.generationType === 'prefix' ? 'Prefix' : 'Suffix'})`;
    modalModList.innerHTML = '';
    const sortedMods = group.mods.sort((a, b) => {
        const levelA = a.required_level || 0;
        const levelB = b.required_level || 0;
        return levelB - levelA;
    });
    sortedMods.forEach(mod => {
        addFlaskModToModal(mod, modalModList, group);
    });
    modal.style.display = 'flex';
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFlaskModal();
        }
    });
    getElement('closeFlaskModal').onclick = closeFlaskModal;
}
function addFlaskModToModal(mod, container, group) {
    const modItem = document.createElement('div');
    modItem.className = 'modal-mod-item';
    modItem.style.cursor = 'pointer';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = mod.name;
    checkbox.checked = flaskModalSelectedMods.has(mod.name);
    checkbox.style.marginRight = '10px';
    checkbox.onchange = function () {
        if (this.checked) {
            flaskModalSelectedMods.add(this.value);
        }
        else {
            flaskModalSelectedMods.delete(this.value);
        }
        updateFlaskModalSelectionState();
    };
    const modInfo = document.createElement('div');
    modInfo.className = 'modal-mod-info';
    modInfo.style.flexGrow = '1';
    const modName = document.createElement('div');
    modName.className = 'modal-mod-name';
    modName.textContent = (typeof getRecombModDisplayName === 'function')
        ? getRecombModDisplayName(mod)
        : mod.name;
    const modDesc = document.createElement('div');
    modDesc.className = 'modal-mod-desc';
    modDesc.textContent = (typeof getRecombModDisplayText === 'function')
        ? getRecombModDisplayText(mod)
        : mod.text;
    modInfo.appendChild(modName);
    modInfo.appendChild(modDesc);
    const modLevel = document.createElement('div');
    modLevel.className = 'modal-mod-tier';
    if (mod.required_level) {
        modLevel.textContent = `Lv${mod.required_level}`;
        modLevel.style.background = '#8B4513';
        modLevel.style.color = '#FFF';
        modLevel.style.padding = '2px 6px';
        modLevel.style.borderRadius = '3px';
        modLevel.style.fontSize = '0.8em';
        modLevel.style.fontWeight = 'bold';
        modLevel.style.marginLeft = '10px';
    }
    else {
        modLevel.style.display = 'none';
    }
    modItem.appendChild(checkbox);
    modItem.appendChild(modInfo);
    modItem.appendChild(modLevel);
    modItem.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            if (checkbox.checked) {
                flaskModalSelectedMods.add(mod.name);
            }
            else {
                flaskModalSelectedMods.delete(mod.name);
            }
            updateFlaskModalSelectionState();
        }
    });
    container.appendChild(modItem);
}
function updateFlaskModalSelectionState() {
    console.log('Flask Modal selection updated:', Array.from(flaskModalSelectedMods));
}
function applyFlaskModalSelection() {
    if (!currentFlaskModalGroup)
        return;
    currentFlaskModalGroup.mods.forEach(mod => {
        flaskCheckedMods.delete(mod.name);
    });
    flaskModalSelectedMods.forEach(modName => {
        flaskCheckedMods.add(modName);
    });
    updateSeparatedFlaskModLists();
    updateCombinedFlaskRegex();
    saveFlaskModCheckboxState();
    const flaskType = getElement('flaskTypeSelect').value;
    saveFlaskTypeState(flaskType);
    closeFlaskModal();
}
function closeFlaskModal() {
    const modal = getElement('flaskModGroupModal');
    modal.style.display = 'none';
    currentFlaskModalGroup = null;
    flaskModalSelectedMods.clear();
}
function updateCombinedFlaskRegex() {
    const selectedMods = Array.from(flaskCheckedMods);
    const regex = selectedMods.map(modName => {
        const mod = rawFlaskMods.find(m => m.name === modName);
        if (!mod)
            return modName;
        return (typeof getRecombModDisplayName === 'function')
            ? getRecombModDisplayName(mod)
            : mod.name;
    }).join('|');
    const emptyMsg = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en')
        ? 'No mods selected'
        : '選択されたModがありません';
    const outputElement = getElement('combinedFlaskRegexOutput');
    if (outputElement) {
        outputElement.textContent = regex || emptyMsg;
        const charCount = regex.length;
        const charCountElement = getElement('flaskCharCount');
        if (charCountElement) {
            let maxLevel = 0;
            selectedMods.forEach(modName => {
                const mod = rawFlaskMods.find(m => m.name === modName);
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
            }
            else {
                charCountElement.style.color = '';
            }
        }
    }
}
let currentFlaskSearchTerm = '';
function filterFlaskMods() {
    currentFlaskSearchTerm = getElement('flaskModSearch').value.toLowerCase();
    const prefixGroups = document.querySelectorAll('#flaskPrefixModList .mod-group-item');
    const suffixGroups = document.querySelectorAll('#flaskSuffixModList .mod-group-item');
    let anyVisible = false;
    const applyFilter = (group) => {
        const searchText = (group.dataset.searchText || '').toLowerCase();
        const groupTitle = group.querySelector('.mod-group-header span:first-child').textContent.toLowerCase();
        const groupDesc = group.querySelector('.mod-group-desc').textContent.toLowerCase();
        const isVisible = !currentFlaskSearchTerm
            || searchText.includes(currentFlaskSearchTerm)
            || groupTitle.includes(currentFlaskSearchTerm)
            || groupDesc.includes(currentFlaskSearchTerm);
        group.style.display = isVisible ? 'block' : 'none';
        if (isVisible)
            anyVisible = true;
    };
    prefixGroups.forEach(applyFilter);
    suffixGroups.forEach(applyFilter);
    const prefixContainer = getElement('flaskPrefixModList');
    const suffixContainer = getElement('flaskSuffixModList');
    const showNoResults = (container, type) => {
        const existingMsg = container.querySelector('.no-results-message');
        if (!existingMsg && currentFlaskSearchTerm !== '') {
            const message = document.createElement('div');
            message.className = 'no-results-message';
            message.style.cssText = 'color: #888; text-align: center; padding: 20px;';
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            message.textContent = isEn
                ? `No ${type} mods matching "${currentFlaskSearchTerm}"`
                : `"${currentFlaskSearchTerm}" に一致する${type}Modが見つかりません`;
            container.appendChild(message);
        }
        else if (existingMsg && currentFlaskSearchTerm === '') {
            existingMsg.remove();
        }
    };
    if (!anyVisible && currentFlaskSearchTerm !== '') {
        showNoResults(prefixContainer, 'Prefix');
        showNoResults(suffixContainer, 'Suffix');
    }
    else {
        const messages = document.querySelectorAll('.no-results-message');
        messages.forEach(msg => msg.remove());
    }
}
function resetFlaskMods() {
    flaskCheckedMods.clear();
    flaskModalSelectedMods.clear();
    updateSeparatedFlaskModLists();
    updateCombinedFlaskRegex();
    saveFlaskModCheckboxState();
    const flaskType = getElement('flaskTypeSelect').value;
    saveFlaskTypeState(flaskType);
}
function copyFlaskRegex() {
    const regex = getElement('combinedFlaskRegexOutput').textContent;
    const emptyMsgs = ['選択されたModがありません', 'No mods selected'];
    if (regex && !emptyMsgs.includes(regex)) {
        navigator.clipboard.writeText(regex)
            .then(() => {
            if (typeof showNotification === 'function') {
                showNotification('コピーしました！');
            }
            else {
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
function saveFlaskModCheckboxState() {
    const state = Array.from(flaskCheckedMods);
    writeStoredJson('flaskModCheckboxState', state);
}
function loadFlaskModCheckboxState() {
    const saved = readStoredText('flaskModCheckboxState');
    if (saved) {
        try {
            flaskCheckedMods = new Set(readStoredJson('flaskModCheckboxState'));
        }
        catch (e) {
            console.error('フラスコMod状態の読み込みエラー:', e);
            flaskCheckedMods = new Set();
        }
    }
}
function saveFlaskProfile() {
    const profileName = getElement('flaskProfileName').value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    flaskProfiles[profileName] = {
        mods: Array.from(flaskCheckedMods),
        flaskType: getElement('flaskTypeSelect').value,
        timestamp: Date.now()
    };
    if (!writeStoredJson('flaskProfiles', flaskProfiles))
        return false;
    updateFlaskProfileList();
    showNotification(`"${profileName}" を保存しました`);
    if (typeof updateSavedRegexDisplay === 'function') {
        updateSavedRegexDisplay();
    }
}
function loadFlaskProfile() {
    const profileName = getElement('flaskProfileList').value;
    if (!profileName || !flaskProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    const profile = flaskProfiles[profileName];
    getElement('flaskTypeSelect').value = profile.flaskType;
    getElement('flaskProfileName').value = profileName;
    loadFlaskMods().then(() => {
        flaskCheckedMods.clear();
        profile.mods.forEach(mod => flaskCheckedMods.add(mod));
        updateSeparatedFlaskModLists();
        updateCombinedFlaskRegex();
        showNotification(`"${profileName}" を読み込みました`);
    });
}
function deleteFlaskProfile() {
    const profileName = getElement('flaskProfileList').value;
    if (!profileName || !confirm(`${profileName}を削除しますか？`))
        return;
    delete flaskProfiles[profileName];
    if (!writeStoredJson('flaskProfiles', flaskProfiles))
        return false;
    updateFlaskProfileList();
    getElement('flaskProfileName').value = '';
    showNotification(`"${profileName}" を削除しました`);
    if (typeof updateSavedRegexDisplay === 'function') {
        updateSavedRegexDisplay();
    }
}
function updateFlaskProfileList() {
    const select = getElement('flaskProfileList');
    if (!select)
        return;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(flaskProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}
function initializeFlaskMods() {
    const savedProfiles = readStoredText('flaskProfiles');
    if (savedProfiles) {
        try {
            flaskProfiles = readStoredJson('flaskProfiles');
            updateFlaskProfileList();
        }
        catch (e) {
            console.error('フラスコプロファイルの読み込みエラー:', e);
            flaskProfiles = {};
        }
    }
    loadFlaskModCheckboxState();
    const savedType = readStoredText('flaskSelectedType');
    const flaskTypeSelect = getElement('flaskTypeSelect');
    if (savedType && flaskTypeSelect) {
        flaskTypeSelect.value = savedType;
    }
    const flaskType = flaskTypeSelect.value;
    saveFlaskTypeState(flaskType);
    setTimeout(() => {
        console.log('Initializing flask mods...');
        loadFlaskMods().then(() => {
            restoreFlaskTypeState(flaskType);
        });
    }, 1000);
}
document.addEventListener('DOMContentLoaded', function () {
    initializeFlaskMods();
    setupFlaskProfileEventListeners();
    const flaskTypeSelect = getElement('flaskTypeSelect');
    if (flaskTypeSelect) {
        flaskTypeSelect.addEventListener('change', function () {
            const newType = this.value;
            writeStoredText('flaskSelectedType', String(newType));
            flaskCheckedMods.clear();
            loadFlaskMods().then(() => {
                restoreFlaskTypeState(newType);
            });
        });
    }
    const flaskTabLink = document.querySelector('a[data-tab="flaskContent"]');
    if (flaskTabLink) {
        flaskTabLink.addEventListener('click', function () {
            initializeFlaskMods();
        });
    }
});
let rawItemMods = [];
let itemCheckedMods = new Set();
let itemProfiles = {};
let currentItemModalGroup = null;
let itemModalSelectedMods = new Set();
window.rawItemMods = [];
/** リコンビModの表示用テキスト（効果文） */
function getRecombModDisplayText(mod) {
    if (!mod)
        return '';
    if (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
        return mod.engText || mod.text || mod.engName || mod.name || '';
    }
    return mod.text || mod.name || '';
}
/** リコンビModの表示用・Regex用接辞名 */
function getRecombModDisplayName(mod) {
    if (!mod)
        return '';
    if (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
        return mod.engName || mod.name || '';
    }
    return mod.name || '';
}
/** グループ検索用（日英両方を対象） */
function getRecombGroupSearchText(group) {
    const parts = [group.baseKey, group.familyName];
    (group.mods || []).forEach(mod => {
        parts.push(mod.name, mod.text, mod.engName, mod.engText, mod.family);
    });
    return parts.filter(Boolean).join(' ').toLowerCase();
}
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
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
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
            writeStoredJson('itemModsData', rawItemMods);
        }
        catch (e) {
            console.error('アイテムMODデータの保存エラー:', e);
        }
    }
    catch (error) {
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
    if (currentSearchTerm) {
        getElement('itemModSearch').value = currentSearchTerm;
        filterItemMods();
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
            const highestLevelMod = familyMods.reduce((highest, current) => (current.required_level || 0) > (highest.required_level || 0) ? current : highest, familyMods[0]);
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
    groupItem.dataset.searchText = getRecombGroupSearchText(group);
    const selectedCount = group.mods.filter(mod => checkedModsSet.has(mod.name)).length;
    if (selectedCount > 0)
        groupItem.classList.add('selected');
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
function openItemGroupModal(group) {
    currentItemModalGroup = group;
    itemModalSelectedMods.clear();
    group.mods.forEach(mod => {
        if (itemCheckedMods.has(mod.name))
            itemModalSelectedMods.add(mod.name);
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
    modal.addEventListener('click', (e) => { if (e.target === modal)
        closeItemModal(); });
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
    checkbox.onchange = function () {
        if (this.checked)
            selectedModsSet.add(this.value);
        else
            selectedModsSet.delete(this.value);
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
    }
    else {
        modLevel.style.display = 'none';
    }
    modInfo.appendChild(modNameAndDesc);
    modInfo.appendChild(modLevel);
    modItem.appendChild(checkbox);
    modItem.appendChild(modInfo);
    modItem.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            if (checkbox.checked)
                selectedModsSet.add(mod.name);
            else
                selectedModsSet.delete(mod.name);
        }
    });
    container.appendChild(modItem);
}
function applyItemModalSelection() {
    if (!currentItemModalGroup)
        return;
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
            }
            else {
                charCountElement.style.color = '';
            }
        }
    }
}
let currentItemSearchTerm = '';
function filterItemMods() {
    currentItemSearchTerm = getElement('itemModSearch').value.toLowerCase();
    const prefixGroups = document.querySelectorAll('#prefixModList .mod-group-item');
    const suffixGroups = document.querySelectorAll('#suffixModList .mod-group-item');
    let anyVisible = false;
    [prefixGroups, suffixGroups].forEach(groups => {
        groups.forEach(group => {
            const searchText = (group.dataset.searchText || '').toLowerCase();
            const groupTitle = group.querySelector('.mod-group-header span:first-child').textContent.toLowerCase();
            const groupDesc = group.querySelector('.mod-group-desc').textContent.toLowerCase();
            const isVisible = !currentItemSearchTerm
                || searchText.includes(currentItemSearchTerm)
                || groupTitle.includes(currentItemSearchTerm)
                || groupDesc.includes(currentItemSearchTerm);
            group.style.display = isVisible ? 'block' : 'none';
            if (isVisible)
                anyVisible = true;
        });
    });
    const containers = [getElement('prefixModList'), getElement('suffixModList')];
    if (!anyVisible && currentItemSearchTerm !== '') {
        containers.forEach(container => {
            const existingMsg = container.querySelector('.no-results-message');
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
    }
    else {
        document.querySelectorAll('.no-results-message').forEach(msg => msg.remove());
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
            }
            else {
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
    if (saved)
        itemCheckedMods = new Set(readStoredJson('itemModCheckboxState'));
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
    if (!writeStoredJson('itemProfiles', itemProfiles))
        return false;
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
    if (!profileName || !confirm(`${profileName}を削除しますか？`))
        return;
    delete itemProfiles[profileName];
    if (!writeStoredJson('itemProfiles', itemProfiles))
        return false;
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
    if (!categorySelect || !itemTypeSelect)
        return;
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
        if (!selectedCategory)
            return;
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
    itemTypeSelect.addEventListener("change", function () {
        const newType = this.value;
        if (!newType)
            return;
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
    const itemTabLink = document.querySelector('a[data-tab="itemContent"]');
    if (itemTabLink) {
        itemTabLink.addEventListener('click', initializeItemMods);
    }
    getElement('itemProfileList').addEventListener('change', function () {
        if (this.value)
            loadItemProfile();
    });
    initializeItemMods();
});
let isDragging = false;
let dragStartIndex = -1;
let dragEndIndex = -1;
let filterControlsAdded = false;
function saveFilterState() {
    const filterState = {
        searchTerm: getElement('savedRegexSearch').value,
        typeFilter: getElement('typeFilter').value,
        sortFilter: getElement('sortFilter').value
    };
    writeStoredJson('savedRegexFilterState', filterState);
}
function loadFilterState() {
    const saved = readStoredText('savedRegexFilterState');
    if (saved) {
        try {
            const filterState = readStoredJson('savedRegexFilterState');
            const searchInput = getElement('savedRegexSearch');
            const typeFilter = getElement('typeFilter');
            const sortFilter = getElement('sortFilter');
            if (searchInput && filterState.searchTerm !== undefined) {
                searchInput.value = filterState.searchTerm;
            }
            if (typeFilter && filterState.typeFilter) {
                typeFilter.value = filterState.typeFilter;
            }
            if (sortFilter && filterState.sortFilter) {
                sortFilter.value = filterState.sortFilter;
            }
            return filterState;
        }
        catch (e) {
            console.error('フィルター状態の読み込みエラー:', e);
        }
    }
    return null;
}
function getAllProfiles() {
    const allProfiles = [];
    const mapProfiles = readStoredJson('poeProfiles');
    Object.entries(mapProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'map', tabId: 'mapContent', timestamp: profile.timestamp || 0 });
    });
    const flaskProfiles = readStoredJson('flaskProfiles');
    Object.entries(flaskProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'flask', tabId: 'flaskContent', timestamp: profile.timestamp || 0 });
    });
    const itemProfiles = readStoredJson('itemProfiles');
    Object.entries(itemProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'item', tabId: 'itemContent', timestamp: profile.timestamp || 0 });
    });
    const vendorProfiles = readStoredJson('vendorProfiles');
    Object.entries(vendorProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'vendor', tabId: 'vendorContent', timestamp: profile.timestamp || 0 });
    });
    const beastProfiles = readStoredJson('beastProfiles');
    Object.entries(beastProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'beast', tabId: 'beastContent', timestamp: profile.timestamp || 0 });
    });
    const scarabProfiles = readStoredJson('scarabProfiles');
    Object.entries(scarabProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'scarab', tabId: 'scarabContent', timestamp: profile.timestamp || 0 });
    });
    const tattooProfiles = readStoredJson('tattooProfiles');
    Object.entries(tattooProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'tattoo', tabId: 'tattooContent', timestamp: profile.timestamp || 0 });
    });
    const runegraftProfiles = readStoredJson('runegraftProfiles');
    Object.entries(runegraftProfiles).forEach(([name, profile]) => {
        allProfiles.push({ name, profile, type: 'runegraft', tabId: 'runegraftContent', timestamp: profile.timestamp || 0 });
    });
    return allProfiles;
}
const typeConfig = {
    map: { label: 'マップ', color: '#E74C3C', icon: '' },
    flask: { label: 'フラスコ', color: '#9B59B6', icon: '' },
    item: { label: 'アイテム', color: '#3498DB', icon: '' },
    vendor: { label: 'ベンダー', color: '#F39C12', icon: '' },
    beast: { label: 'ビースト', color: '#1ABC9C', icon: '' },
    scarab: { label: 'スカラベ', color: '#D35400', icon: '' },
    tattoo: { label: 'タトゥー', color: '#8E44AD', icon: '' },
    runegraft: { label: 'ルーングラフト', color: '#2C3E50', icon: '' }
};
function generateRegexFromProfile(profile, type) {
    if (type === 'map') {
        return generateMapRegexFromProfile(profile);
    }
    else if (type === 'flask' || type === 'item') {
        const mods = (profile.mods || []).join('|');
        return mods || '(空のRegex)';
    }
    else if (type === 'vendor') {
        if (typeof window.generateVendorRegexFromProfile === 'function') {
            const regex = window.generateVendorRegexFromProfile(profile);
            return regex || '(空のRegex)';
        }
        else {
            return '(エラー: vendor.jsが読み込まれていません)';
        }
    }
    else if (type === 'beast') {
        const beasts = (profile.beasts || []);
        if (beasts.length === 0)
            return '(空のRegex)';
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        const regexes = beasts.map(beastName => {
            const beast = beastlist[beastName];
            if (!beast)
                return null;
            return isEn ? (beast.enRegex || beast.regex) : beast.regex;
        }).filter(regex => regex !== null);
        return regexes.join('|') || '(空のRegex)';
    }
    else if (type === 'scarab') {
        const scarabNames = (profile.scarabs || []);
        if (scarabNames.length === 0)
            return '(空のRegex)';
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        const regexes = scarabNames.map(name => {
            const item = scarablist[name];
            if (!item)
                return null;
            return isEn ? (item.enRegex || item.regex) : item.regex;
        }).filter(regex => regex !== null);
        return regexes.join('|') || '(空のRegex)';
    }
    else if (type === 'tattoo') {
        const tattooNames = (profile.tattoos || []);
        if (tattooNames.length === 0)
            return '(空のRegex)';
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        const regexes = tattooNames.map(name => {
            const item = tattoolist[name];
            if (!item)
                return null;
            return isEn ? (item.enRegex || item.regex) : item.regex;
        }).filter(regex => regex !== null);
        return regexes.join('|') || '(空のRegex)';
    }
    else if (type === 'runegraft') {
        const runegraftNames = (profile.runegrafts || []);
        if (runegraftNames.length === 0)
            return '(空のRegex)';
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        const regexes = runegraftNames.map(name => {
            const item = runegraftlist[name];
            if (!item)
                return null;
            return isEn ? (item.enRegex || item.regex) : item.regex;
        }).filter(regex => regex !== null);
        return regexes.join('|') || '(空のRegex)';
    }
    return '(不明なタイプ)';
}
function generateMapRegexFromProfile(profile) {
    const originalCheckedMods = new Map(checkedMods);
    const originalInputState = {
        itemQuantity: getElement('itemQuantityInput')?.value || '',
        packSize: getElement('packSizeInput')?.value || '',
        rarity: getElement('rarityInput')?.value || '',
        scarab: getElement('scarabInput')?.value || '',
        currency: getElement('currencyInput')?.value || '',
        map: getElement('mapInput')?.value || ''
    };
    const originalCheckboxState = {
        mapTierChecked: getElement('mapTierCheckbox')?.checked || false,
        normalChecked: getElement('normalCheckbox')?.checked || false,
        magicChecked: getElement('magicCheckbox')?.checked || false,
        rareChecked: getElement('rareCheckbox')?.checked || false
    };
    const originalSearchMode = document.querySelector('input[name="searchMode"]:checked')?.value;
    try {
        checkedMods.clear();
        if (profile.mods) {
            if (Array.isArray(profile.mods)) {
                profile.mods.forEach(mod => {
                    if (Array.isArray(mod)) {
                        const [id, state] = mod;
                        if (id)
                            checkedMods.set(id, state || 'ng');
                    }
                    else if (typeof mod === 'string') {
                        checkedMods.set(mod, 'ng');
                    }
                });
            }
            else if (typeof profile.mods === 'object') {
                Object.entries(profile.mods).forEach(([mod, state]) => checkedMods.set(mod, state));
            }
        }
        if (profile.settings) {
            const settings = profile.settings;
            if (getElement('itemQuantityInput'))
                getElement('itemQuantityInput').value = settings.itemQuantity || '';
            if (getElement('packSizeInput'))
                getElement('packSizeInput').value = settings.packSize || '';
            if (getElement('rarityInput'))
                getElement('rarityInput').value = settings.rarity || '';
            if (getElement('scarabInput'))
                getElement('scarabInput').value = settings.scarab || '';
            if (getElement('currencyInput'))
                getElement('currencyInput').value = settings.currency || '';
            if (getElement('mapInput'))
                getElement('mapInput').value = settings.map || '';
            if (getElement('mapTierCheckbox'))
                getElement('mapTierCheckbox').checked = settings.mapTierChecked || false;
            if (getElement('normalCheckbox'))
                getElement('normalCheckbox').checked = settings.rarities?.normal || false;
            if (getElement('magicCheckbox'))
                getElement('magicCheckbox').checked = settings.rarities?.magic || false;
            if (getElement('rareCheckbox'))
                getElement('rareCheckbox').checked = settings.rarities?.rare || false;
            const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${settings.searchMode || 'any'}"]`);
            if (searchModeRadio)
                searchModeRadio.checked = true;
        }
        updateCombinedRegex();
        const regex = getElement('combinedRegexOutput').textContent;
        return regex || '(空のRegex)';
    }
    finally {
        checkedMods.clear();
        originalCheckedMods.forEach((state, mod) => checkedMods.set(mod, state));
        if (getElement('itemQuantityInput'))
            getElement('itemQuantityInput').value = originalInputState.itemQuantity;
        if (getElement('packSizeInput'))
            getElement('packSizeInput').value = originalInputState.packSize;
        if (getElement('rarityInput'))
            getElement('rarityInput').value = originalInputState.rarity;
        if (getElement('scarabInput'))
            getElement('scarabInput').value = originalInputState.scarab;
        if (getElement('currencyInput'))
            getElement('currencyInput').value = originalInputState.currency;
        if (getElement('mapInput'))
            getElement('mapInput').value = originalInputState.map;
        if (getElement('mapTierCheckbox'))
            getElement('mapTierCheckbox').checked = originalCheckboxState.mapTierChecked;
        if (getElement('normalCheckbox'))
            getElement('normalCheckbox').checked = originalCheckboxState.normalChecked;
        if (getElement('magicCheckbox'))
            getElement('magicCheckbox').checked = originalCheckboxState.magicChecked;
        if (getElement('rareCheckbox'))
            getElement('rareCheckbox').checked = originalCheckboxState.rareChecked;
        const originalSearchModeRadio = document.querySelector(`input[name="searchMode"][value="${originalSearchMode || 'any'}"]`);
        if (originalSearchModeRadio)
            originalSearchModeRadio.checked = true;
        updateCombinedRegex();
    }
}
function calcMapModTotals(profile) {
    // profile.modsからmapModListを参照して合計値を計算
    let totalCurrency = 0, totalPackSize = 0, totalQuantity = 0;
    let totalRarity = 0, totalScarab = 0, totalMap = 0;
    if (!profile.mods)
        return { totalCurrency, totalPackSize, totalQuantity, totalRarity, totalScarab, totalMap };
    const modsToProcess = [];
    if (Array.isArray(profile.mods)) {
        profile.mods.forEach(mod => {
            if (Array.isArray(mod))
                modsToProcess.push(mod[0]); // [id, state] 形式
            else if (typeof mod === 'string')
                modsToProcess.push(mod);
        });
    }
    else if (typeof profile.mods === 'object') {
        Object.keys(profile.mods).forEach(key => modsToProcess.push(key));
    }
    modsToProcess.forEach(key => {
        const mod = (typeof mapModList !== 'undefined' ? mapModList : {})[key];
        if (!mod)
            return;
        totalCurrency += Number(mod['map_currency_drop_chance_+%_final_from_uber_mod'] || 0);
        totalPackSize += Number(mod['map_pack_size_+%'] || 0);
        totalQuantity += Number(mod['map_item_drop_quantity_+%'] || 0);
        totalRarity += Number(mod['map_item_drop_rarity_+%'] || 0);
        totalScarab += Number(mod['map_scarab_drop_chance_+%_final_from_uber_mod'] || 0);
        totalMap += Number(mod['map_map_item_drop_chance_+%_final_from_uber_mod'] || 0);
    });
    return { totalCurrency, totalPackSize, totalQuantity, totalRarity, totalScarab, totalMap };
}
function createSortableProfileCard(name, profile, type, tabId) {
    const card = createProfileCard(name, profile, type, tabId);
    card.draggable = true;
    card.style.cursor = 'grab';
    card.dataset.profileName = name;
    card.dataset.profileType = type;
    card.dataset.timestamp = profile.timestamp || Date.now();
    if (type === 'map') {
        const settings = profile.settings || {};
        card.dataset.totalQuantity = settings.itemQuantity || 0;
        card.dataset.totalPackSize = settings.packSize || 0;
        card.dataset.totalRarity = settings.rarity || 0;
        card.dataset.totalScarab = settings.scarab || 0;
        card.dataset.totalCurrency = settings.currency || 0;
        card.dataset.totalMap = settings.map || 0;
    }
    else {
        card.dataset.totalQuantity = '0';
        card.dataset.totalPackSize = '0';
        card.dataset.totalRarity = '0';
        card.dataset.totalScarab = '0';
        card.dataset.totalCurrency = '0';
        card.dataset.totalMap = '0';
    }
    const title = card.querySelector('.profile-card-title') || card.querySelector('.title-area span:nth-child(2)');
    if (title)
        title.classList.add('profile-card-title');
    const typeLabel = card.querySelector('.profile-card-type');
    if (!typeLabel) {
        const typeSpan = document.createElement('span');
        typeSpan.className = 'profile-card-type';
        typeSpan.textContent = type;
        typeSpan.style.display = 'none';
        card.appendChild(typeSpan);
    }
    card.addEventListener('dragstart', () => {
        card.style.opacity = '0.5';
        card.style.cursor = 'grabbing';
    });
    card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        card.style.cursor = 'grab';
    });
    return card;
}
function createProfileCard(name, profile, type, tabId) {
    const config = typeConfig[type];
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.style.cssText = `
    background: #2a2a2a;
    border: 1px solid #444;
    border-left: 4px solid ${config.color};
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
  `;
    card.addEventListener('mouseenter', () => {
        card.style.background = '#333';
        card.style.borderColor = config.color;
    });
    card.addEventListener('mouseleave', () => {
        card.style.background = '#2a2a2a';
        card.style.borderColor = '#444';
        card.style.borderLeftColor = config.color;
    });
    card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button'))
            return;
        const regex = generateRegexFromProfile(profile, type);
        if (regex && regex !== '(空のRegex)') {
            navigator.clipboard.writeText(regex).then(() => {
                showNotification('コピーしました！');
                const originalBackground = card.style.background;
                const originalBorderColor = card.style.borderColor;
                card.style.background = '#2d5a2d';
                card.style.borderColor = '#4CAF50';
                setTimeout(() => {
                    card.style.background = originalBackground;
                    card.style.borderColor = originalBorderColor;
                }, 300);
            }).catch(err => {
                console.error('コピー失敗:', err);
                showNotification('❌ コピー失敗', true);
                const originalBackground = card.style.background;
                const originalBorderColor = card.style.borderColor;
                card.style.background = '#5a2d2d';
                card.style.borderColor = '#e74c3c';
                setTimeout(() => {
                    card.style.background = originalBackground;
                    card.style.borderColor = originalBorderColor;
                }, 300);
            });
        }
    });
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    const titleArea = document.createElement('div');
    titleArea.className = 'title-area';
    titleArea.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';
    const typeLabel = document.createElement('span');
    typeLabel.className = 'profile-card-type';
    typeLabel.style.cssText = `
    background: ${config.color};
    color: white;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.7em;
    font-weight: bold;
    white-space: nowrap;
  `;
    typeLabel.textContent = `${config.icon} ${config.label}`;
    const title = document.createElement('span');
    title.className = 'profile-card-title';
    title.style.cssText = 'color: #FFF; font-size: 0.9em; font-weight: 500;';
    title.textContent = name;
    const summary = createProfileSummary(profile, type);
    const summarySpan = document.createElement('span');
    summarySpan.style.cssText = 'color: #888; font-size: 0.7em; margin-left: auto;';
    summarySpan.textContent = summary;
    titleArea.appendChild(typeLabel);
    titleArea.appendChild(title);
    if (type === 'map') {
        const settings = profile.settings || {};
        const badgeContainer = document.createElement('div');
        badgeContainer.style.cssText = 'display: flex; gap: 4px; margin-left: 10px; flex-wrap: wrap;';
        const isEn = typeof currentLanguage !== 'undefined' ? currentLanguage === 'en' : false;
        const badgeConfigs = [
            { label: isEn ? 'Quality' : '数量', value: settings.itemQuantity, color: '#a54242' },
            { label: isEn ? 'Pack' : 'パック', value: settings.packSize, color: '#42a5a5' },
            { label: isEn ? 'Rarity' : 'レア', value: settings.rarity, color: '#a58242' },
            { label: isEn ? 'Scarab' : 'スカラベ', value: settings.scarab, color: '#a542a5' },
            { label: isEn ? 'Currency' : 'カレンシー', value: settings.currency, color: '#a5a542' },
            { label: isEn ? 'Map' : 'マップ', value: settings.map, color: '#4264a5' }
        ];
        badgeConfigs.forEach(b => {
            if (b.value && b.value > 0) {
                const badge = document.createElement('span');
                badge.style.cssText = `background: ${b.color}; color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.65em; font-weight: bold;`;
                badge.textContent = `${b.label} ${b.value}`;
                badgeContainer.appendChild(badge);
            }
        });
        titleArea.appendChild(badgeContainer);
    }
    else {
        const summary = createProfileSummary(profile, type);
        if (summary) {
            const summarySpan = document.createElement('span');
            summarySpan.style.cssText = 'color: #888; font-size: 0.7em; margin-left: auto;';
            summarySpan.textContent = summary;
            titleArea.appendChild(summarySpan);
        }
    }
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.style.cssText = `
    background: transparent;
    color: #e74c3c;
    border: 1px solid #e74c3c;
    padding: 2px 6px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 1.1em;
    line-height: 1;
    transition: all 0.2s;
    margin-left: 8px;
  `;
    deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.background = '#e74c3c';
        deleteBtn.style.color = 'white';
    });
    deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.color = '#e74c3c';
    });
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSavedProfile(name, type);
    });
    header.appendChild(titleArea);
    header.appendChild(deleteBtn);
    card.appendChild(header);
    const regexRow = document.createElement('div');
    regexRow.style.cssText = 'display: flex; gap: 6px; align-items: center;';
    const regex = generateRegexFromProfile(profile, type);
    const regexDiv = document.createElement('div');
    regexDiv.style.cssText = `
    background: #1e1e1e;
    padding: 6px 8px;
    border-radius: 4px;
    font-family: monospace;
    color: #FFF;
    word-break: break-all;
    max-height: 50px;
    overflow-y: auto;
    font-size: 0.75em;
    line-height: 1.3;
    flex: 1;
  `;
    regexDiv.textContent = regex || '(空のRegex)';
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 4px; flex-shrink: 0;';
    const copyBtn = createActionButton('コピー', '#3498db', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(regex).then(() => {
            showNotification('コピーしました！');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓';
            setTimeout(() => copyBtn.textContent = originalText, 1500);
        });
    }, 'コピー');
    const detailBtn = createActionButton('詳細', '#9b59b6', (e) => {
        e.stopPropagation();
        toggleProfileDetails(card, profile, type, config.color);
    }, '詳細');
    const loadBtn = createActionButton('読み込み', '#4CAF50', (e) => {
        e.stopPropagation();
        loadSavedProfile(name, type, tabId);
    }, '読み込み');
    actions.appendChild(copyBtn);
    actions.appendChild(detailBtn);
    actions.appendChild(loadBtn);
    regexRow.appendChild(regexDiv);
    regexRow.appendChild(actions);
    card.appendChild(regexRow);
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'details-container';
    detailsContainer.style.cssText = `
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    margin-top: 0;
  `;
    card.appendChild(detailsContainer);
    return card;
}
function createProfileSummary(profile, type) {
    const parts = [];
    if (type === 'map') {
        let modCount = 0;
        if (profile.mods) {
            modCount = Array.isArray(profile.mods) ? profile.mods.length : Object.keys(profile.mods).length;
        }
        if (modCount > 0)
            parts.push(`${modCount}個のMod`);
        const settings = profile.settings || {};
        if (settings.itemQuantity)
            parts.push(`数量${settings.itemQuantity}%`);
        if (settings.packSize)
            parts.push(`パック${settings.packSize}%`);
    }
    else if (type === 'flask') {
        const modCount = (profile.mods || []).length;
        if (modCount > 0)
            parts.push(`${modCount}個のMod`);
        if (profile.flaskType) {
            const typeNames = { utility: 'ユーティリティ', life: 'ライフ', mana: 'マナ', hybrid: 'ハイブリッド', tincture: 'チンキ' };
            parts.push(typeNames[profile.flaskType] || profile.flaskType);
        }
    }
    else if (type === 'item') {
        const modCount = (profile.mods || []).length;
        if (modCount > 0)
            parts.push(`${modCount}個のMod`);
        if (profile.itemType)
            parts.push(profile.itemType);
    }
    else if (type === 'vendor') {
        const settings = profile.settings || {};
        const colorCount = Object.values(settings.colors || {}).filter(Boolean).length;
        if (colorCount > 0)
            parts.push(`${colorCount}色`);
        const linkSettings = [];
        if (settings.anyThreeLink)
            linkSettings.push('3L');
        if (settings.anyFourLink)
            linkSettings.push('4L');
        if (settings.anyFiveLink)
            linkSettings.push('5L');
        if (settings.anySixLink)
            linkSettings.push('6L');
        if (settings.anySixSocket)
            linkSettings.push('6S');
        if (linkSettings.length > 0)
            parts.push(linkSettings.join(','));
        const weaponCount = Object.values(settings.weapon || {}).filter(Boolean).length;
        if (weaponCount > 0)
            parts.push(`${weaponCount}武器`);
        const accessoryCount = Object.values(settings.accessory || {}).filter(Boolean).length;
        if (accessoryCount > 0)
            parts.push(`${accessoryCount}アクセ`);
        const extraCount = Object.values(settings.extra || {}).filter(Boolean).length;
        if (extraCount > 0)
            parts.push(`その他${extraCount}件`);
        const gemCount = (settings.selectedGems || []).length;
        if (gemCount > 0) {
            const gemNames = [];
            const maxDisplay = 2;
            for (let i = 0; i < Math.min(gemCount, maxDisplay); i++) {
                // 保存されたRegex内の現在の言語は異なる可能性がありますが、
                // 混合クライアントの場合はデフォルトとして日本語を使用するか、
                // または enRegex を使用すべきか判断を試みます。;
                const gemRegex = settings.selectedGems[i];
                let displayName = gemRegex;
                if (profile.gemInfo) {
                    const gemInfo = profile.gemInfo.find(g => g.regex === gemRegex);
                    if (gemInfo && gemInfo.display_name)
                        displayName = gemInfo.display_name;
                }
                if (typeof window.getGemDisplayName === 'function') {
                    displayName = window.getGemDisplayName(gemRegex);
                }
                gemNames.push(displayName);
            }
            let gemSummary = gemNames.join(', ');
            if (gemCount > maxDisplay)
                gemSummary += ` ...他${gemCount - maxDisplay}個`;
            parts.push(gemSummary);
        }
    }
    else if (type === 'beast') {
        const beastCount = (profile.beasts || []).length;
        if (beastCount > 0)
            parts.push(`${beastCount}個のビースト`);
    }
    else if (type === 'scarab') {
        const scarabCount = (profile.scarabs || []).length;
        if (scarabCount > 0)
            parts.push(`${scarabCount}個のスカラベ`);
    }
    return parts.length > 0 ? parts.join(' | ') : '';
}
function createDetailedView(profile, type) {
    const container = document.createElement('div');
    container.style.cssText = 'padding: 10px; background: #1e1e1e; border-radius: 4px;';
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    if (type === 'map') {
        const settings = profile.settings || {};
        // MOD合計値サマリーバッジ (6項目対応)
        const totals = calcMapModTotals(profile);
        const summaryRow = document.createElement('div');
        summaryRow.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;';
        const makeSummaryBadge = (label, value, color) => {
            const badge = document.createElement('span');
            badge.style.cssText = `
        background: ${color}22;
        border: 1px solid ${color};
        color: ${color};
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
      `;
            badge.textContent = `${label} ${value}`;
            return badge;
        };
        if (settings.itemQuantity > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Quality' : '数量', settings.itemQuantity, '#a54242'));
        if (settings.packSize > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Pack' : 'パック', settings.packSize, '#42a5a5'));
        if (settings.rarity > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Rarity' : 'レア', settings.rarity, '#a58242'));
        if (settings.scarab > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Scarab' : 'スカラベ', settings.scarab, '#a542a5'));
        if (settings.currency > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Currency' : 'カレンシー', settings.currency, '#a5a542'));
        if (settings.map > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Map' : 'マップ', settings.map, '#4264a5'));
        if (summaryRow.childNodes.length > 0) {
            container.appendChild(summaryRow);
        }
        if (Object.keys(settings).length > 0) {
            const settingsDiv = document.createElement('div');
            settingsDiv.style.cssText = 'margin-bottom: 12px;';
            const rows = [];
            if (settings.itemQuantity)
                rows.push(createDetailRow(isEn ? 'Min Quality' : '数量', `${settings.itemQuantity}%`));
            if (settings.packSize)
                rows.push(createDetailRow(isEn ? 'Min Pack' : 'パックサイズ', `${settings.packSize}%`));
            if (settings.rarity)
                rows.push(createDetailRow(isEn ? 'Min Rarity' : 'レアリティ', `${settings.rarity}%`));
            if (settings.scarab)
                rows.push(createDetailRow(isEn ? 'Min Scarab' : 'スカラベ', `${settings.scarab}%`));
            if (settings.currency)
                rows.push(createDetailRow(isEn ? 'Min Currency' : 'カレンシー', `${settings.currency}%`));
            if (settings.map)
                rows.push(createDetailRow(isEn ? 'Min Map' : 'マップ', `${settings.map}%`));
            const rarities = [];
            if (settings.rarities?.normal)
                rarities.push(isEn ? 'Normal' : 'ノーマル');
            if (settings.rarities?.magic)
                rarities.push(isEn ? 'Magic' : 'マジック');
            if (settings.rarities?.rare)
                rarities.push(isEn ? 'Rare' : 'レア');
            if (rarities.length > 0)
                rows.push(createDetailRow(isEn ? 'Rarity Filter' : 'レアリティフィルタ', rarities.join(', ')));
            if (settings.searchMode) {
                rows.push(createDetailRow(isEn ? 'Search Mode' : '検索モード', settings.searchMode === 'all' ? (isEn ? 'All' : '全て値以上') : (isEn ? 'Any' : 'どれか')));
            }
            const options = [];
            if (settings.ngModChecked)
                options.push(isEn ? 'NG mod' : 'NG mod');
            if (settings.mapTierChecked)
                options.push(isEn ? 'T17 mod' : 'T17 mod');
            if (options.length > 0)
                rows.push(createDetailRow(isEn ? 'Options' : 'オプション', options.join(', ')));
            rows.forEach(row => settingsDiv.appendChild(row));
            if (rows.length > 0)
                container.appendChild(settingsDiv);
        }
        if (profile.mods) {
            const modList = document.createElement('div');
            modList.style.cssText = 'display: grid; gap: 4px;';
            const modsToProcess = [];
            if (Array.isArray(profile.mods)) {
                profile.mods.forEach(mod => {
                    if (Array.isArray(mod))
                        modsToProcess.push({ id: mod[0], state: mod[1] || 'ng' }); // [id, state] format
                    else if (typeof mod === 'string')
                        modsToProcess.push({ id: mod, state: 'ng' });
                });
            }
            else if (typeof profile.mods === 'object') {
                Object.entries(profile.mods).forEach(([id, state]) => modsToProcess.push({ id, state }));
            }
            modsToProcess.forEach(({ id: modKey, state: modState }) => {
                const mod = (typeof mapModList !== 'undefined' ? mapModList : ModList)[modKey];
                if (mod) {
                    const modItem = document.createElement('div');
                    modItem.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid ${modState === 'wanted' ? '#4CAF50' : (mod.tier > 750 ? '#ed4c4c' : mod.tier > 500 ? '#F87171' : '#FCA5A5')};
          `;
                    const primaryText = isEn ? (mod.engMod || mod.mod) : mod.mod;
                    const secondaryText = isEn ? mod.mod : (mod.engMod || '');
                    modItem.innerHTML = `
            <div style="color: #FFF; font-size: 0.8em; margin-bottom: 2px;">${typeof formatModText === 'function' ? formatModText(primaryText, mod.value) : primaryText}</div>
            <div style="color: #888; font-size: 0.7em;">${typeof formatModText === 'function' ? formatModText(secondaryText, mod.value) : secondaryText}</div>
          `;
                    modList.appendChild(modItem);
                }
            });
            container.appendChild(modList);
        }
    }
    else if (type === 'flask' || type === 'item') {
        if (profile.flaskType || profile.itemType) {
            const typeRow = createDetailRow(isEn ? 'Type' : 'タイプ', profile.flaskType || profile.itemType);
            container.appendChild(typeRow);
            const spacer = document.createElement('div');
            spacer.style.cssText = 'height: 8px;';
            container.appendChild(spacer);
        }
        if (profile.mods && profile.mods.length > 0) {
            const modList = document.createElement('div');
            modList.style.cssText = 'display: grid; gap: 4px;';
            const modsData = type === 'flask' ? (window.rawFlaskMods || []) : (window.rawItemMods || []);
            profile.mods.forEach(modName => {
                let displayText = modName;
                if (modsData.length > 0) {
                    const mod = modsData.find(m => m.name === modName);
                    if (mod)
                        displayText = `${mod.name}　${mod.text}`;
                }
                const modItem = document.createElement('div');
                modItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid ${type === 'flask' ? '#9B59B6' : '#3498DB'};
          color: #FFF;
          font-size: 0.8em;
        `;
                modItem.textContent = displayText;
                modList.appendChild(modItem);
            });
            container.appendChild(modList);
        }
    }
    else if (type === 'vendor') {
        const settings = profile.settings || {};
        const enabledColors = Object.entries(settings.colors || {})
            .filter(([key, value]) => value)
            .map(([key]) => key);
        if (enabledColors.length > 0) {
            const colorsDiv = document.createElement('div');
            colorsDiv.style.cssText = 'margin-bottom: 12px;';
            const colorTitle = document.createElement('div');
            colorTitle.textContent = isEn ? 'Color Settings:' : 'カラー設定:';
            colorTitle.style.cssText = 'color: #AAA; font-size: 0.8em; margin-bottom: 8px;';
            colorsDiv.appendChild(colorTitle);
            enabledColors.forEach(colorKey => {
                const colorItem = document.createElement('div');
                colorItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid #F39C12;
          color: #FFF;
          font-size: 0.8em;
          margin-bottom: 4px;
        `;
                const colorNames = {
                    rrr: '🔴-🔴-🔴', ggg: '🟢-🟢-🟢', bbb: '🔵-🔵-🔵',
                    rrA: '🔴-🔴-⚪', ggA: '🟢-🟢-⚪', bbA: '🔵-🔵-⚪',
                    rrg: '🔴-🔴-🟢', rrb: '🔴-🔴-🔵', ggr: '🟢-🟢-🔴',
                    ggb: '🟢-🟢-🔵', bbr: '🔵-🔵-🔴', bbg: '🔵-🔵-🟢',
                    rgb: '🔴-🟢-🔵', raa: '🔴-⚪-⚪', gaa: '🟢-⚪-⚪', baa: '🔵-⚪-⚪',
                    rr: '🔴-🔴', gg: '🟢-🟢', bb: '🔵-🔵',
                    rb: '🔴-🔵', gr: '🟢-🔴', bg: '🔵-🟢'
                };
                colorItem.textContent = colorNames[colorKey] || colorKey;
                colorsDiv.appendChild(colorItem);
            });
            container.appendChild(colorsDiv);
        }
        const enabledExcludeWeapons = Object.entries(settings.excludeWeapons || {})
            .filter(([key, value]) => value)
            .map(([key]) => key);
        if (enabledExcludeWeapons.length > 0) {
            const weaponNames = isEn ? {
                claw: 'Claw', dagger: 'Dagger', wand: 'Wand', oneHandSword: '1H Sword',
                thrustingSword: 'Thrusting Sword', oneHandAxe: '1H Axe', oneHandMace: '1H Mace',
                sceptre: 'Sceptre', runeDagger: 'Rune Dagger', bow: 'Bow', staff: 'Staff',
                twoHandSword: '2H Sword', twoHandAxe: '2H Axe', twoHandMace: '2H Mace',
                warstaff: 'Warstaff', shield: 'Shield'
            } : {
                claw: '鉤爪', dagger: '短剣', wand: 'ワンド', oneHandSword: '片手剣',
                thrustingSword: '刺突剣', oneHandAxe: '片手斧', oneHandMace: '片手メイス',
                sceptre: 'セプター', runeDagger: 'ルーンの短剣', bow: '弓', staff: 'スタッフ',
                twoHandSword: '両手剣', twoHandAxe: '両手斧', twoHandMace: '両手メイス',
                warstaff: 'ウォースタッフ', shield: '盾'
            };
            const excludeWeaponDisplayNames = enabledExcludeWeapons.map(weapon => weaponNames[weapon] || weapon);
            container.appendChild(createDetailRow(isEn ? 'Excluded Weapons' : '除外武器ベース', excludeWeaponDisplayNames.join(', ')));
        }
        const linkSettings = [];
        if (settings.anyThreeLink)
            linkSettings.push(isEn ? '3-Link' : '3リンク');
        if (settings.anyFourLink)
            linkSettings.push(isEn ? '4-Link' : '4リンク');
        if (settings.anyFiveLink)
            linkSettings.push(isEn ? '5-Link' : '5リンク');
        if (settings.anySixLink)
            linkSettings.push(isEn ? '6-Link' : '6リンク');
        if (settings.anySixSocket)
            linkSettings.push(isEn ? '6-Socket' : '6ソケット');
        if (linkSettings.length > 0)
            container.appendChild(createDetailRow(isEn ? 'Links' : 'リンク設定', linkSettings.join(', ')));
        const movementSettings = [];
        if (settings.movement?.ten)
            movementSettings.push('10%');
        if (settings.movement?.fifteen)
            movementSettings.push('15%');
        if (settings.movement?.twenty)
            movementSettings.push('20%');
        if (settings.movement?.twentyfive)
            movementSettings.push('25%');
        if (settings.movement?.thirty)
            movementSettings.push('30%');
        if (movementSettings.length > 0)
            container.appendChild(createDetailRow(isEn ? 'MS' : '移動速度', movementSettings.join(', ')));
        for (const [group, title, options] of [
            ['accessory', 'アクセ', VENDOR_ACCESSORY_OPTIONS],
            ['extra', 'その他', VENDOR_EXTRA_OPTIONS],
        ]) {
            const names = Object.entries(options).filter(([key]) => settings[group]?.[key]).map(([, option]) => option.label);
            if (names.length)
                container.appendChild(createDetailRow(title, names.join(', ')));
        }
        const enabledWeapons = Object.entries(settings.weapon || {})
            .filter(([key, value]) => value)
            .map(([key]) => key);
        if (enabledWeapons.length > 0) {
            const weaponNames = isEn ? {
                claw: 'Claw', dagger: 'Dagger', wand: 'Wand', oneHandSword: '1H Sword',
                thrustingSword: 'Thrusting Sword', oneHandAxe: '1H Axe', oneHandMace: '1H Mace',
                sceptre: 'Sceptre', runeDagger: 'Rune Dagger', bow: 'Bow', staff: 'Staff',
                twoHandSword: '2H Sword', twoHandAxe: '2H Axe', twoHandMace: '2H Mace', warstaff: 'Warstaff'
            } : {
                claw: '鉤爪', dagger: '短剣', wand: 'ワンド', oneHandSword: '片手剣',
                thrustingSword: '刺突剣', oneHandAxe: '片手斧', oneHandMace: '片手メイス',
                sceptre: 'セプター', runeDagger: 'ルーンの短剣', bow: '弓', staff: 'スタッフ',
                twoHandSword: '両手剣', twoHandAxe: '両手斧', twoHandMace: '両手メイス', warstaff: 'ウォースタッフ'
            };
            const weaponDisplayNames = enabledWeapons.map(weapon => weaponNames[weapon] || weapon);
            container.appendChild(createDetailRow(isEn ? 'Weapon Bases' : '武器ベース', weaponDisplayNames.join(', ')));
        }
    }
    else if (type === 'beast' || type === 'scarab' || type === 'tattoo' || type === 'runegraft') {
        const modItems = profile.beasts || profile.scarabs || profile.tattoos || profile.runegrafts || [];
        if (modItems.length > 0) {
            const list = document.createElement('div');
            list.style.cssText = 'display: grid; gap: 4px;';
            const dataList = type === 'beast' ? beastlist : (type === 'scarab' ? scarablist : (type === 'tattoo' ? tattoolist : runegraftlist));
            const stripeColor = type === 'beast' ? '#1ABC9C' : (type === 'scarab' ? '#D35400' : (type === 'tattoo' ? '#8E44AD' : '#2C3E50'));
            modItems.forEach(name => {
                const item = dataList && dataList[name];
                if (item) {
                    const itemDiv = document.createElement('div');
                    itemDiv.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid ${stripeColor};
            color: #FFF;
            font-size: 0.8em;
          `;
                    const displayName = isEn ? (item.engName || name) : name;
                    const displayDesc = isEn ? (item.enDescription || item.description || item.effect || '') : (item.description || item.effect || '');
                    itemDiv.innerHTML = `
            <div style="color: #FFF; font-size: 0.8em; margin-bottom: 2px;">${displayName}</div>
            <div style="color: #888; font-size: 0.7em;">${displayDesc}${type === 'beast' && item.family ? ' - ' + item.family : ''}</div>
          `;
                    list.appendChild(itemDiv);
                }
                else {
                    const unknownItem = document.createElement('div');
                    unknownItem.style.cssText = `background: #2a2a2a; padding: 6px 8px; border-radius: 3px; border-left: 3px solid ${stripeColor}; color: #FFF; font-size: 0.8em;`;
                    unknownItem.textContent = name;
                    list.appendChild(unknownItem);
                }
            });
            container.appendChild(list);
        }
    }
    return container;
}
function loadSavedProfile(name, type, tabId) {
    switchTab(tabId);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (type === 'vendor') {
        setTimeout(() => {
            if (typeof window.loadVendorProfileDirectly === 'function') {
                window.loadVendorProfileDirectly(name);
            }
            else {
                setTimeout(() => {
                    if (typeof window.loadVendorProfileDirectly === 'function') {
                        window.loadVendorProfileDirectly(name);
                    }
                    else {
                        console.error('loadVendorProfileDirectly function not available');
                        showNotification('ベンダーモジュールの読み込みに失敗しました', true);
                    }
                }, 500);
            }
        }, 500);
        return;
    }
    setTimeout(() => {
        try {
            if (type === 'map') {
                getElement('profileList').value = name;
                loadProfile();
            }
            else if (type === 'flask') {
                getElement('flaskProfileList').value = name;
                loadFlaskProfile();
            }
            else if (type === 'item') {
                getElement('itemProfileList').value = name;
                loadItemProfile();
            }
            else if (type === 'beast') {
                getElement('beastProfileList').value = name;
                loadBeastProfile();
            }
            else if (type === 'scarab') {
                getElement('scarabProfileList').value = name;
                loadScarabProfile();
            }
            else if (type === 'tattoo') {
                getElement('tattooProfileList').value = name;
                loadTattooProfile();
            }
            else if (type === 'runegraft') {
                getElement('runegraftProfileList').value = name;
                loadRunegraftProfile();
            }
            const tabContent = getElement(tabId);
            if (tabContent) {
                tabContent.scrollTop = 0;
            }
        }
        catch (error) {
            console.error('Error loading profile:', error);
            showNotification('プロファイルの読み込みに失敗しました', true);
        }
    }, 300);
}
function addProfileToTop(profileName, type) {
    const savedOrder = readStoredText('savedRegexOrder');
    let order = [];
    if (savedOrder) {
        try {
            order = readStoredJson('savedRegexOrder');
        }
        catch (e) {
            console.error('並び順の解析エラー:', e);
        }
    }
    order = order.filter(item => !(item.name === profileName && item.type === type));
    order.unshift({ name: profileName, type: type });
    writeStoredJson('savedRegexOrder', order);
}
function removeProfileFromOrder(profileName, type) {
    const savedOrder = readStoredText('savedRegexOrder');
    if (!savedOrder)
        return;
    try {
        let order = readStoredJson('savedRegexOrder');
        order = order.filter(item => !(item.name === profileName && item.type === type));
        writeStoredJson('savedRegexOrder', order);
    }
    catch (e) {
        console.error('並び順からの削除エラー:', e);
    }
}
function deleteSavedProfile(name, type) {
    if (!confirm(`"${name}" を削除しますか?\nこの操作は元に戻せません。`))
        return;
    let storageKey = '';
    if (type === 'map')
        storageKey = 'poeProfiles';
    else if (type === 'flask')
        storageKey = 'flaskProfiles';
    else if (type === 'item')
        storageKey = 'itemProfiles';
    else if (type === 'vendor')
        storageKey = 'vendorProfiles';
    else if (type === 'beast')
        storageKey = 'beastProfiles';
    else if (type === 'scarab')
        storageKey = 'scarabProfiles';
    else if (type === 'tattoo')
        storageKey = 'tattooProfiles';
    else if (type === 'runegraft')
        storageKey = 'runegraftProfiles';
    try {
        const profiles = readStoredJson(storageKey);
        delete profiles[name];
        if (!writeStoredJson(storageKey, profiles))
            return false;
        removeProfileFromOrder(name, type);
        if (type === 'map') {
            window.profiles = profiles;
            if (typeof updateProfileList === 'function')
                updateProfileList();
        }
        else if (type === 'flask') {
            window.flaskProfiles = profiles;
            if (typeof updateFlaskProfileList === 'function')
                updateFlaskProfileList();
        }
        else if (type === 'item') {
            window.itemProfiles = profiles;
            if (typeof updateItemProfileList === 'function')
                updateItemProfileList();
        }
        else if (type === 'vendor') {
            window.vendorProfiles = profiles;
            if (typeof updateVendorProfileList === 'function')
                updateVendorProfileList();
        }
        else if (type === 'beast') {
            window.beastProfiles = profiles;
            if (typeof updateBeastProfileList === 'function')
                updateBeastProfileList();
        }
        else if (type === 'scarab') {
            window.scarabProfiles = profiles;
            if (typeof updateScarabProfileList === 'function')
                updateScarabProfileList();
        }
        else if (type === 'tattoo') {
            window.tattooProfiles = profiles;
            if (typeof updateTattooProfileList === 'function')
                updateTattooProfileList();
        }
        else if (type === 'runegraft') {
            window.runegraftProfiles = profiles;
            if (typeof updateRunegraftProfileList === 'function')
                updateRunegraftProfileList();
        }
        updateSavedRegexDisplay();
        showNotification(`"${name}" を削除しました`);
    }
    catch (error) {
        console.error('Error deleting profile:', error);
        showNotification('プロファイルの削除に失敗しました', true);
    }
}
function addFilterControls() {
    if (filterControlsAdded)
        return;
    const container = getElement('savedRegexList');
    if (!container)
        return;
    const searchBox = getElement('savedRegexSearch');
    if (!searchBox)
        return;
    const parent = searchBox.parentNode;
    const existingFilter = getElement('savedRegexFilterControls');
    if (existingFilter)
        existingFilter.remove();
    const filterContainer = document.createElement('div');
    filterContainer.id = 'savedRegexFilterControls';
    filterContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
    align-items: center;
  `;
    const typeFilter = document.createElement('select');
    typeFilter.id = 'typeFilter';
    typeFilter.innerHTML = `
    <option value="all">すべてのタイプ</option>
    <option value="map">マップ</option>
    <option value="flask">フラスコ</option>
    <option value="item">アイテム</option>
    <option value="vendor">ベンダー</option>
    <option value="beast">ビースト</option>
    <option value="scarab">スカラベ</option>
    <option value="tattoo">タトゥー</option>
    <option value="runegraft">ルーングラフト</option>
  `;
    typeFilter.style.cssText = `
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #2a2a2a;
    color: white;
    min-width: 150px;
  `;
    const sortFilter = document.createElement('select');
    sortFilter.id = 'sortFilter';
    sortFilter.innerHTML = `
    <option value="custom">カスタム順序</option>
    <option value="newest">更新日時（新しい順）</option>
    <option value="oldest">更新日時（古い順）</option>
    <option value="name_asc">名前（昇順）</option>
    <option value="name_desc">名前（降順）</option>
    <option value="quantity_desc">数量（多い順）</option>
    <option value="packsize_desc">パックサイズ（多い順）</option>
    <option value="rarity_desc">レアリティ（多い順）</option>
    <option value="scarab_desc">スカラベ（多い順）</option>
    <option value="currency_desc">カレンシー（多い順）</option>
    <option value="maps_desc">マップ（多い順）</option>
  `;
    sortFilter.style.cssText = `
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #2a2a2a;
    color: white;
    min-width: 180px;
  `;
    const resetButton = document.createElement('button');
    resetButton.textContent = 'フィルターリセット';
    resetButton.style.cssText = `
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #666;
    background: #444;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
  `;
    resetButton.addEventListener('mouseenter', () => {
        resetButton.style.background = '#555';
    });
    resetButton.addEventListener('mouseleave', () => {
        resetButton.style.background = '#444';
    });
    filterContainer.appendChild(typeFilter);
    filterContainer.appendChild(sortFilter);
    filterContainer.appendChild(resetButton);
    parent.insertBefore(filterContainer, searchBox.nextSibling);
    typeFilter.addEventListener('change', function () {
        saveFilterState();
        applyFilters();
    });
    sortFilter.addEventListener('change', function () {
        saveFilterState();
        applyFilters();
    });
    resetButton.addEventListener('click', resetFilters);
    const searchInput = getElement('savedRegexSearch');
    if (searchInput) {
        searchInput.removeEventListener('input', applyFilters);
        searchInput.addEventListener('input', function () {
            saveFilterState();
            applyFilters();
        });
    }
    filterControlsAdded = true;
    // フィルターコントロール追加後に初期フィルターを適用
    setTimeout(() => {
        const filterState = loadFilterState();
        if (filterState) {
            applyFilters();
        }
    }, 100);
}
function sortCards(cards, sortType) {
    const container = getElement('savedRegexCards');
    if (!container)
        return;
    const sortedCards = [...cards].sort((a, b) => {
        switch (sortType) {
            case 'newest':
                return (b.dataset.timestamp || 0) - (a.dataset.timestamp || 0);
            case 'oldest':
                return (a.dataset.timestamp || 0) - (b.dataset.timestamp || 0);
            case 'name_asc':
                return (a.dataset.profileName || '').localeCompare(b.dataset.profileName || '');
            case 'name_desc':
                return (b.dataset.profileName || '').localeCompare(a.dataset.profileName || '');
            case 'currency_desc':
                return Number(b.dataset.totalCurrency || 0) - Number(a.dataset.totalCurrency || 0);
            case 'packsize_desc':
                return Number(b.dataset.totalPackSize || 0) - Number(a.dataset.totalPackSize || 0);
            case 'quantity_desc':
                return Number(b.dataset.totalQuantity || 0) - Number(a.dataset.totalQuantity || 0);
            case 'rarity_desc':
                return Number(b.dataset.totalRarity || 0) - Number(a.dataset.totalRarity || 0);
            case 'scarab_desc':
                return Number(b.dataset.totalScarab || 0) - Number(a.dataset.totalScarab || 0);
            case 'maps_desc':
                return Number(b.dataset.totalMap || 0) - Number(a.dataset.totalMap || 0);
            case 'custom':
                return 0;
            default:
                return 0;
        }
    });
    sortedCards.forEach(card => {
        container.appendChild(card);
    });
}
function saveSortOrder() {
    const container = getElement('savedRegexCards');
    if (!container)
        return;
    const cards = Array.from(container.querySelectorAll('.profile-card'));
    const order = cards.map(card => {
        return { name: card.dataset.profileName, type: card.dataset.profileType };
    });
    writeStoredJson('savedRegexOrder', order);
}
function restoreSortOrder(allProfiles) {
    const savedOrder = readStoredText('savedRegexOrder');
    if (!savedOrder)
        return allProfiles;
    try {
        const order = readStoredJson('savedRegexOrder');
        const orderedProfiles = [];
        const remainingProfiles = [...allProfiles];
        order.forEach(item => {
            const index = remainingProfiles.findIndex(profile => profile.name === item.name && profile.type === item.type);
            if (index !== -1) {
                orderedProfiles.push(remainingProfiles[index]);
                remainingProfiles.splice(index, 1);
            }
        });
        const result = [...orderedProfiles, ...remainingProfiles];
        return result;
    }
    catch (e) {
        console.error('並び順の復元エラー:', e);
        return allProfiles;
    }
}
function resetSortOrder() {
    if (confirm('並び順をリセットしますか？')) {
        removeStoredValue('savedRegexOrder');
        updateSavedRegexDisplay();
    }
}
function hookSaveProfiles() {
    const originalMapSave = window.saveProfile;
    if (originalMapSave && typeof originalMapSave === 'function' && !originalMapSave._hooked) {
        window.saveProfile = function () {
            const profileName = getElement('profileName')?.value.trim() || '';
            if (originalMapSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('poeProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('poeProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'map');
                    updateSavedRegexDisplay();
                    // フィルターコントロールが存在する場合のみ適用
                    setTimeout(() => {
                        const typeFilter = getElement('typeFilter');
                        if (typeFilter) {
                            applyFilters();
                        }
                    }, 200);
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveProfile._hooked = true;
    }
    const originalFlaskSave = window.saveFlaskProfile;
    if (originalFlaskSave && typeof originalFlaskSave === 'function' && !originalFlaskSave._hooked) {
        window.saveFlaskProfile = function () {
            const profileName = getElement('flaskProfileName')?.value.trim() || '';
            if (originalFlaskSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('flaskProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('flaskProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'flask');
                    updateSavedRegexDisplay();
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveFlaskProfile._hooked = true;
    }
    const originalItemSave = window.saveItemProfile;
    if (originalItemSave && typeof originalItemSave === 'function' && !originalItemSave._hooked) {
        window.saveItemProfile = function () {
            const profileName = getElement('itemProfileName')?.value.trim() || '';
            if (originalItemSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('itemProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('itemProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'item');
                    updateSavedRegexDisplay();
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveItemProfile._hooked = true;
    }
    const originalVendorSave = window.saveVendorProfile;
    if (originalVendorSave && typeof originalVendorSave === 'function' && !originalVendorSave._hooked) {
        window.saveVendorProfile = function () {
            const profileName = getElement('vendorProfileName')?.value.trim() || '';
            if (originalVendorSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('vendorProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('vendorProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'vendor');
                    updateSavedRegexDisplay();
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveVendorProfile._hooked = true;
    }
    const originalBeastSave = window.saveBeastProfile;
    if (originalBeastSave && typeof originalBeastSave === 'function' && !originalBeastSave._hooked) {
        window.saveBeastProfile = function () {
            const profileName = getElement('beastProfileName')?.value.trim() || '';
            if (originalBeastSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('beastProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('beastProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'beast');
                    updateSavedRegexDisplay();
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveBeastProfile._hooked = true;
    }
    const originalScarabSave = window.saveScarabProfile;
    if (originalScarabSave && typeof originalScarabSave === 'function' && !originalScarabSave._hooked) {
        window.saveScarabProfile = function () {
            const profileName = getElement('scarabProfileName')?.value.trim() || '';
            if (originalScarabSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('scarabProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('scarabProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'scarab');
                    updateSavedRegexDisplay();
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveScarabProfile._hooked = true;
    }
}
function initSavedRegex() {
    const savedTabLink = document.querySelector('a[data-tab="savedContent"]');
    if (savedTabLink) {
        savedTabLink.addEventListener('click', () => {
            resetFilterControls();
            try {
                const flaskData = readStoredText('flaskModsData');
                if (flaskData)
                    window.rawFlaskMods = readStoredJson('flaskModsData');
                const itemData = readStoredText('itemModsData');
                if (itemData)
                    window.rawItemMods = readStoredJson('itemModsData');
            }
            catch (e) {
                console.error('MODデータ復元エラー:', e);
            }
            // コンテナを非表示にしてから更新
            const container = getElement('savedRegexList');
            if (container) {
                container.style.opacity = '1';
            }
            setTimeout(() => {
                updateSavedRegexDisplay();
                addSortableStyles();
                addFilterControls(); // 必ずフィルターコントロールを追加
            }, 100);
        });
    }
    const searchBox = getElement('savedRegexSearch');
    if (searchBox) {
        searchBox.addEventListener('input', function () {
            saveFilterState();
            applyFilters();
        });
    }
    if (window.location.hash === '#saved') {
        // 初期表示時も非表示状態から開始
        const container = getElement('savedRegexList');
        if (container) {
            container.style.opacity = '1';
        }
        setTimeout(() => {
            updateSavedRegexDisplay();
            addFilterControls(); // 必ずフィルターコントロールを追加
        }, 200);
    }
    setTimeout(() => {
        hookSaveProfiles();
    }, 1000);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSavedRegex);
}
else {
    initSavedRegex();
}
/**
 * Path of Building 共有コード / pobb.in URL のデコードとジェム抽出
 */
const POB_CLASS_TO_JP = {
    Witch: 'ウィッチ',
    Marauder: 'マローダー',
    Ranger: 'レンジャー',
    Duelist: 'デュエリスト',
    Shadow: 'シャドウ',
    Templar: 'テンプラー',
    Scion: 'サイオン',
};
const POB_FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/plain,text/html,*/*',
};
/** PoB 共有コードらしい文字列か */
function isPobShareCode(text) {
    const t = String(text || '').trim().replace(/\s+/g, '');
    return t.length >= 20 && /^eN[a-zA-Z0-9+/=_-]+$/.test(t);
}
/** pobb.in ページ HTML からビルドコードを抽出 */
function extractCodeFromPobbInHtml(html) {
    const source = String(html || '');
    const textareaMatch = source.match(/aria-label="Path of Building buildcode"[^>]*>\s*(eN[a-zA-Z0-9+/=_-]+)/);
    if (textareaMatch)
        return textareaMatch[1].trim();
    const readonlyMatch = source.match(/readonly="">\s*(eN[a-zA-Z0-9+/=_-]+)/);
    if (readonlyMatch)
        return readonlyMatch[1].trim();
    return null;
}
/** jina.ai リーダー応答からビルドコードを抽出 */
function extractCodeFromJinaMarkdown(text) {
    const source = String(text || '');
    const mdMatch = source.match(/Markdown Content:\s*(eN[a-zA-Z0-9+/=_-]+)/);
    if (mdMatch)
        return mdMatch[1].trim();
    return extractLoosePobCode(source) || extractCodeFromPobbInHtml(source);
}
/** 応答テキストから最長の PoB コード候補を探す */
function extractLoosePobCode(text) {
    const matches = String(text || '').match(/eN[a-zA-Z0-9+/=_-]{20,}={0,2}/g);
    if (!matches?.length)
        return null;
    const longest = matches.reduce((best, current) => (current.length > best.length ? current : best));
    return isPobShareCode(longest) ? longest.replace(/\s+/g, '') : null;
}
/** 取得テキストから PoB コードを取り出す */
function extractPobCodeFromFetchedText(text, sourceKind) {
    const trimmed = String(text || '').trim();
    if (!trimmed)
        return null;
    if (sourceKind === 'jina') {
        const fromJina = extractCodeFromJinaMarkdown(trimmed);
        if (fromJina)
            return fromJina.replace(/\s+/g, '');
    }
    if (isPobShareCode(trimmed))
        return trimmed.replace(/\s+/g, '');
    const fromHtml = extractCodeFromPobbInHtml(trimmed);
    if (fromHtml)
        return fromHtml.replace(/\s+/g, '');
    const loose = extractLoosePobCode(trimmed);
    if (loose)
        return loose;
    return null;
}
async function fetchAlloriginsRaw(targetUrl, label) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`${label}: HTTP ${response.status}`);
    }
    const text = await response.text();
    const code = extractPobCodeFromFetchedText(text, 'raw');
    if (!code) {
        throw new Error(`${label}: PoB コードを抽出できませんでした`);
    }
    return code;
}
async function fetchAlloriginsGet(targetUrl, label) {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`${label}: HTTP ${response.status}`);
    }
    const data = await response.json();
    const text = data?.contents || '';
    const code = extractPobCodeFromFetchedText(text, 'raw');
    if (!code) {
        throw new Error(`${label}: PoB コードを抽出できませんでした`);
    }
    return code;
}
async function fetchJinaProxy(targetUrl, label) {
    const proxyUrl = `https://r.jina.ai/${targetUrl}`;
    const response = await fetch(proxyUrl, { headers: POB_FETCH_HEADERS });
    if (!response.ok) {
        throw new Error(`${label}: HTTP ${response.status}`);
    }
    const text = await response.text();
    const code = extractPobCodeFromFetchedText(text, 'jina');
    if (!code) {
        throw new Error(`${label}: PoB コードを抽出できませんでした`);
    }
    return code;
}
/** 複数プロキシを並列試行し、最初に成功した時点で返す */
async function fetchPobCodeFromProxies(fetchers) {
    const errors = [];
    return new Promise((resolve, reject) => {
        if (!fetchers.length) {
            reject(new Error('取得経路がありません'));
            return;
        }
        let pending = fetchers.length;
        let settled = false;
        fetchers.forEach((fetcher) => {
            fetcher()
                .then((code) => {
                if (!settled && code) {
                    settled = true;
                    resolve(code);
                }
            })
                .catch((error) => {
                errors.push(error.message || String(error));
                pending -= 1;
                if (!settled && pending === 0) {
                    reject(new Error(errors.join(' / ') || '取得に失敗しました'));
                }
            });
        });
    });
}
/** PoB 共有コードを XML 文字列にデコード */
function decodePobShareCode(code) {
    if (typeof pako === 'undefined') {
        throw new Error('pako が読み込まれていません');
    }
    let normalized = String(code || '').trim().replace(/\s+/g, '');
    if (!normalized) {
        throw new Error('PoB コードが空です');
    }
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
    while (normalized.length % 4 !== 0) {
        normalized += '=';
    }
    let binary;
    try {
        binary = atob(normalized);
    }
    catch {
        throw new Error('PoB コードの Base64 形式が不正です');
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    try {
        return pako.inflate(bytes, { to: 'string' });
    }
    catch {
        throw new Error('PoB コードの解凍に失敗しました');
    }
}
/** pobb.in URL または生コードを判別 */
function parsePobInput(input) {
    const text = String(input || '').trim().replace(/[.,;)\]}>]+$/g, '');
    if (!text) {
        return { type: 'empty' };
    }
    const userUrlMatch = text.match(/(pobb\.in\/u\/[^/\s?#]+?\/[A-Za-z0-9_-]{6,})/i);
    const directUrlMatch = text.match(/pobb\.in\/([A-Za-z0-9_-]{6,})/i);
    let id = null;
    let pagePath = null;
    if (userUrlMatch) {
        pagePath = userUrlMatch[1];
        const idMatch = pagePath.match(/\/([A-Za-z0-9_-]{6,})$/);
        id = idMatch ? idMatch[1] : null;
    }
    else if (directUrlMatch) {
        const candidate = directUrlMatch[1];
        if (!['raw', 'u', 'oembed'].includes(candidate.toLowerCase())) {
            id = candidate;
            pagePath = `pobb.in/${id}`;
        }
    }
    if (id && pagePath) {
        const normalizedPath = pagePath.replace(/\/raw\/?$/, '');
        return {
            type: 'url',
            id,
            pageUrl: `https://${normalizedPath}`,
            rawUrl: `https://${normalizedPath}/raw`,
        };
    }
    const compact = text.replace(/\s+/g, '');
    if (compact.length >= 20 && /^[A-Za-z0-9+/_=-]+$/.test(compact)) {
        return { type: 'code', code: compact };
    }
    return { type: 'unknown' };
}
/** pobb.in から生コードを取得（高速経路を優先） */
async function fetchPobbInRawCode(rawUrl, pageUrl) {
    const errors = [];
    const fastAttempts = [
        () => fetchAlloriginsRaw(rawUrl, 'allorigins /raw'),
        () => fetchAlloriginsGet(rawUrl, 'allorigins get /raw'),
    ];
    for (const attempt of fastAttempts) {
        try {
            return await attempt();
        }
        catch (error) {
            errors.push(error.message || String(error));
        }
    }
    try {
        return await fetchPobCodeFromProxies([
            () => fetchJinaProxy(rawUrl, 'jina.ai /raw'),
        ]);
    }
    catch (error) {
        errors.push(error.message || String(error));
    }
    throw new Error(`pobb.in からビルドを取得できませんでした（${errors.join(' / ')}）`);
}
/** XML からビルド情報とジェム一覧を抽出 */
function parsePobBuildXml(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error('PoB XML の解析に失敗しました');
    }
    const buildEl = doc.querySelector('Build');
    if (!buildEl) {
        throw new Error('PoB ビルドデータが見つかりません');
    }
    const className = buildEl.getAttribute('className') || '';
    const ascendClassName = buildEl.getAttribute('ascendClassName') || '';
    const level = buildEl.getAttribute('level') || '';
    const targetVersion = buildEl.getAttribute('targetVersion') || '';
    const classNameJp = POB_CLASS_TO_JP[className] || className;
    const skillsEl = doc.querySelector('Skills');
    const activeSkillSetId = skillsEl?.getAttribute('activeSkillSet') || '1';
    const skillSetElements = Array.from(doc.querySelectorAll('SkillSet'));
    const collectGemsFromSkillSetEl = (skillSetEl) => {
        const gems = [];
        const seen = new Set();
        const skillSetTitle = skillSetEl.getAttribute('title') || '';
        skillSetEl.querySelectorAll('Gem').forEach((gemEl) => {
            const enabled = gemEl.getAttribute('enabled') !== 'false';
            if (!enabled)
                return;
            const skillId = gemEl.getAttribute('skillId')
                || gemEl.getAttribute('variantId')
                || '';
            const nameSpec = gemEl.getAttribute('nameSpec') || '';
            const key = `${skillId}::${nameSpec}`;
            if (seen.has(key))
                return;
            seen.add(key);
            gems.push({
                skillId,
                nameSpec,
                level: gemEl.getAttribute('level') || '1',
                quality: gemEl.getAttribute('quality') || '0',
                skillSetTitle,
            });
        });
        return gems;
    };
    const skillSets = skillSetElements.map((skillSetEl, index) => {
        const id = skillSetEl.getAttribute('id') || String(index + 1);
        const title = skillSetEl.getAttribute('title') || `ロードアウト ${id}`;
        return {
            id,
            title,
            gems: collectGemsFromSkillSetEl(skillSetEl),
        };
    });
    let gems = [];
    if (skillSets.length > 0) {
        const activeSet = skillSets.find((set) => set.id === activeSkillSetId) || skillSets[0];
        gems = activeSet.gems;
    }
    else {
        const seen = new Set();
        doc.querySelectorAll('Gem').forEach((gemEl) => {
            const enabled = gemEl.getAttribute('enabled') !== 'false';
            if (!enabled)
                return;
            const skillId = gemEl.getAttribute('skillId') || gemEl.getAttribute('variantId') || '';
            const nameSpec = gemEl.getAttribute('nameSpec') || '';
            const key = `${skillId}::${nameSpec}`;
            if (seen.has(key))
                return;
            seen.add(key);
            gems.push({ skillId, nameSpec, level: '1', quality: '0', skillSetTitle: '' });
        });
    }
    return {
        className,
        ascendClassName,
        classNameJp,
        level,
        targetVersion,
        activeSkillSetId,
        skillSets,
        gems,
    };
}
/** 指定ロードアウトのジェム一覧を返す */
function getBuildGemsForSkillSet(build, skillSetId) {
    return getBuildGemsForSkillSets(build, [skillSetId]);
}
/** 複数ロードアウトのジェムを重複除いて結合 */
function getBuildGemsForSkillSets(build, skillSetIds) {
    if (!build)
        return [];
    const ids = (Array.isArray(skillSetIds) ? skillSetIds : [skillSetIds])
        .filter((id) => id != null && id !== '');
    if (!build.skillSets?.length) {
        return build.gems || [];
    }
    if (ids.length === 0) {
        const active = build.skillSets.find((set) => set.id === build.activeSkillSetId);
        return active?.gems || build.skillSets[0].gems;
    }
    const seen = new Set();
    const gems = [];
    ids.forEach((id) => {
        const set = build.skillSets.find((item) => item.id === id);
        if (!set)
            return;
        set.gems.forEach((gem) => {
            const key = `${gem.skillId}::${gem.nameSpec}`;
            if (seen.has(key))
                return;
            seen.add(key);
            gems.push(gem);
        });
    });
    return gems;
}
function normalizeGemName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}
/** gems_regex.json のエントリと PoB ジェムを照合 */
function matchPobGemToLocal(pobGem, gemData) {
    if (!pobGem || !gemData?.length)
        return null;
    const skillId = pobGem.skillId || '';
    const nameSpec = pobGem.nameSpec || '';
    const normName = normalizeGemName(nameSpec);
    if (skillId) {
        const byId = gemData.find((g) => g.id === skillId);
        if (byId)
            return byId;
    }
    if (nameSpec) {
        const byEng = gemData.find((g) => g.eng && g.eng.toLowerCase() === nameSpec.toLowerCase());
        if (byEng)
            return byEng;
        const byNorm = gemData.find((g) => normalizeGemName(g.eng) === normName);
        if (byNorm)
            return byNorm;
    }
    if (normName) {
        const partial = gemData.find((g) => {
            const engNorm = normalizeGemName(g.eng);
            return engNorm && (engNorm.includes(normName) || normName.includes(engNorm));
        });
        if (partial)
            return partial;
    }
    return null;
}
/** クエスト報酬の一意キー */
function getQuestRewardKey(act, quest) {
    return `${act}::${quest || ''}`;
}
/** 同じクエストに複数の選択枠がある場合の一意キー */
function getQuestRewardChoiceKey(act, quest, choiceType = 'main') {
    return `${getQuestRewardKey(act, quest)}::${choiceType}`;
}
const BREAKING_EGGS_BONUS_GEMS = new Set([
    'Dash',
    'Frostblink',
    'Shield Charge',
]);
const CAGED_BRUTE_BONUS_GEMS = new Set([
    'Clarity',
    'Faster Attacks Support',
    'Melee Splash Support',
    'Precision',
    'Vitality',
]);
/** クエストごとの追加報酬定義 */
const QUEST_BONUS_REWARD_DEFS = {
    '卵の破壊': {
        engNames: BREAKING_EGGS_BONUS_GEMS,
        sharedAllClasses: false,
    },
    '檻の中のけだもの': {
        engNames: CAGED_BRUTE_BONUS_GEMS,
        sharedAllClasses: true,
    },
};
function toQuestMemoGem(gem, act, quest) {
    return {
        regex: gem.regex,
        display_name: gem.display_name,
        eng: gem.eng,
        quest,
        classes: gem.quest_reward?.classes || [],
        act,
    };
}
/** 追加報酬ジェム一覧を取得 */
function getQuestBonusGems(gemData, quest, act, classGems, engNames, sharedAllClasses) {
    if (sharedAllClasses) {
        return gemData
            .filter((gem) => engNames.has(gem.eng))
            .map((gem) => toQuestMemoGem(gem, act, quest))
            .sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'));
    }
    return classGems.filter((gem) => engNames.has(gem.eng));
}
/** クラス向けクエスト報酬を ACT → クエスト単位に整理 */
function buildQuestRewardMemo(gemData, classNameJp) {
    const byAct = new Map();
    gemData.forEach((gem) => {
        const reward = gem.quest_reward;
        if (!reward || !reward.classes || !reward.act)
            return;
        if (classNameJp && !reward.classes.includes(classNameJp))
            return;
        const act = reward.act;
        const quest = reward.quest || '';
        if (!byAct.has(act)) {
            byAct.set(act, new Map());
        }
        const byQuest = byAct.get(act);
        if (!byQuest.has(quest)) {
            byQuest.set(quest, []);
        }
        byQuest.get(quest).push(toQuestMemoGem(gem, act, quest));
    });
    // 全クラス共有の追加報酬クエストが、クラス報酬一覧に無い場合も枠を用意する
    Object.entries(QUEST_BONUS_REWARD_DEFS).forEach(([quest, def]) => {
        if (!def.sharedAllClasses)
            return;
        const sample = gemData.find((gem) => def.engNames.has(gem.eng) && gem.quest_reward?.quest === quest);
        const act = sample?.quest_reward?.act;
        if (!act)
            return;
        if (!byAct.has(act))
            byAct.set(act, new Map());
        const byQuest = byAct.get(act);
        if (!byQuest.has(quest))
            byQuest.set(quest, []);
    });
    return Array.from(byAct.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([act, questMap]) => ({
        act,
        quests: Array.from(questMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
            .map(([quest, gems]) => {
            const sortedGems = gems.sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'));
            const bonusDef = QUEST_BONUS_REWARD_DEFS[quest];
            if (!bonusDef) {
                return { quest, gems: sortedGems, bonusGems: [] };
            }
            const bonusGems = getQuestBonusGems(gemData, quest, act, sortedGems, bonusDef.engNames, bonusDef.sharedAllClasses);
            const mainGems = sortedGems.filter((gem) => !bonusDef.engNames.has(gem.eng));
            return {
                quest,
                gems: mainGems,
                bonusGems,
            };
        }),
    }));
}
/** 同一クエストの各選択枠を初期化（ビルド内を優先） */
function initQuestRewardChoices(questMemo, importedRegexes) {
    const choices = {};
    questMemo.forEach(({ act, quests }) => {
        quests.forEach(({ quest, gems, bonusGems = [] }) => {
            const mainKey = getQuestRewardChoiceKey(act, quest, 'main');
            const mainInBuild = gems.filter((g) => importedRegexes.has(g.regex));
            if (mainInBuild.length > 0) {
                choices[mainKey] = mainInBuild[0].regex;
            }
            else if (gems.length > 0) {
                choices[mainKey] = gems[0].regex;
            }
            if (bonusGems.length > 0) {
                const bonusKey = getQuestRewardChoiceKey(act, quest, 'bonus');
                const bonusInBuild = bonusGems.filter((g) => importedRegexes.has(g.regex));
                const mainRegex = choices[mainKey];
                const distinctBonus = bonusInBuild.find((g) => g.regex !== mainRegex)
                    || bonusGems.find((g) => g.regex !== mainRegex);
                choices[bonusKey] = (distinctBonus || bonusInBuild[0] || bonusGems[0]).regex;
            }
        });
    });
    return choices;
}
function isQuestRewardForClass(gemEntry, classNameJp) {
    const reward = gemEntry?.quest_reward;
    if (!reward || !classNameJp)
        return false;
    if (Array.isArray(reward.classes) && reward.classes.includes(classNameJp))
        return true;
    // 檻の中のけだもの追加報酬は全クラス共有
    if (reward.quest === '檻の中のけだもの'
        && CAGED_BRUTE_BONUS_GEMS.has(gemEntry.eng)) {
        return true;
    }
    return false;
}
/** 入力から PoB ビルドを取得して解析 */
async function loadPobBuildFromInput(input) {
    const parsed = parsePobInput(input);
    let code = '';
    if (parsed.type === 'empty') {
        throw new Error('PoB コードまたは pobb.in URL を入力してください');
    }
    if (parsed.type === 'code') {
        code = parsed.code;
    }
    else if (parsed.type === 'url') {
        code = await fetchPobbInRawCode(parsed.rawUrl, parsed.pageUrl);
    }
    else {
        throw new Error('PoB コードまたは pobb.in URL の形式を認識できません');
    }
    const xml = decodePobShareCode(code);
    const build = parsePobBuildXml(xml);
    return build;
}
window.POB_CLASS_TO_JP = POB_CLASS_TO_JP;
window.decodePobShareCode = decodePobShareCode;
window.parsePobInput = parsePobInput;
window.isPobShareCode = isPobShareCode;
window.fetchPobbInRawCode = fetchPobbInRawCode;
window.parsePobBuildXml = parsePobBuildXml;
window.getBuildGemsForSkillSet = getBuildGemsForSkillSet;
window.getBuildGemsForSkillSets = getBuildGemsForSkillSets;
window.matchPobGemToLocal = matchPobGemToLocal;
window.buildQuestRewardMemo = buildQuestRewardMemo;
window.getQuestRewardKey = getQuestRewardKey;
window.getQuestRewardChoiceKey = getQuestRewardChoiceKey;
window.initQuestRewardChoices = initQuestRewardChoices;
window.isQuestRewardForClass = isQuestRewardForClass;
window.loadPobBuildFromInput = loadPobBuildFromInput;
let vendorInitialized = false;
let vendorInitPromise = null;
let vendorInitResolve = null;
const VENDOR_ACCESSORY_OPTIONS = {
    amber: { category: 'アミュレット', label: '琥珀(STR)', pattern: '珀のア' },
    jade: { category: 'アミュレット', label: '翡翠(DEX)', pattern: '翠のア' },
    lapis: { category: 'アミュレット', label: '瑠璃(INT)', pattern: '璃のア' },
    onyx: { category: 'アミュレット', label: 'オニキス', pattern: 'キスのア' },
    turquoise: { category: 'アミュレット', label: 'ターコイズ', pattern: 'イズのア' },
    agate: { category: 'アミュレット', label: '瑪瑙', pattern: '瑙のア' },
    rusticSash: { category: 'ベルト', label: '素朴な飾り帯', pattern: '朴な飾' },
    heavyBelt: { category: 'ベルト', label: 'ヘビーベルト', pattern: 'ビーベ' },
    leatherBelt: { category: 'ベルト', label: '革のベルト', pattern: '革のベ' },
    ironRing: { category: '指輪', label: '鉄', pattern: '鉄の指' },
    coralRing: { category: '指輪', label: '珊瑚', pattern: '瑚の指' },
    topazRing: { category: '指輪', label: 'トパーズ', pattern: 'ズの指' },
    sapphireRing: { category: '指輪', label: 'サファイア', pattern: 'アの指' },
    rubyRing: { category: '指輪', label: 'ルビー', pattern: 'ーの指' },
};
const VENDOR_EXTRA_OPTIONS = {
    allGem: { label: '全スキルジェム +1', pattern: '全スキ.*ム +' },
    minionGem: { label: 'ミニオンスキルジェム +1', pattern: 'てのミニ' },
    spellGem: { label: '全スペルスキルジェム +1', pattern: 'てのスペ' },
    fireGem: { label: '火スペルスキルジェム +1', pattern: 'ての火ス' },
    coldGem: { label: '冷気スペルスキルジェム +1', pattern: 'ての冷気ス' },
    lightningGem: { label: '雷スペルスキルジェム +1', pattern: 'ての雷ス' },
    physicalGem: { label: '物理スペルスキルジェム +1', pattern: 'ての物理ス' },
    chaosGem: { label: '混沌スペルスキルジェム +1', pattern: 'ての混沌ス' },
    dotMulti: { label: '継続ダメージ倍率', pattern: '^継.*率 \\+' },
    fireDotMulti: { label: '火継続ダメージ倍率', pattern: '^火継.*率 \\+' },
    coldDotMulti: { label: '冷気継続ダメージ倍率', pattern: '^冷気継.*率 \\+' },
    physicalDotMulti: { label: '物理継続ダメージ倍率', pattern: '^物理継.*率 \\+' },
    chaosDotMulti: { label: '混沌継続ダメージ倍率', pattern: '^混沌継.*率 \\+' },
};
function setupVendorExtraOptions() {
    for (const [group, options] of [['accessory', VENDOR_ACCESSORY_OPTIONS], ['extra', VENDOR_EXTRA_OPTIONS]]) {
        const container = getElement(`vendor-${group}-options`);
        if (!container)
            continue;
        container.replaceChildren();
        let category = '';
        for (const [key, option] of Object.entries(options)) {
            if ('category' in option && typeof option.category === 'string' && category !== option.category) {
                category = option.category;
                const heading = document.createElement('h4');
                heading.textContent = category;
                container.appendChild(heading);
            }
            const label = document.createElement('label');
            label.className = 'input-label vendor-option';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `vendor-${group}-${key}`;
            label.append(checkbox, document.createTextNode(' ' + option.label));
            container.appendChild(label);
        }
    }
}
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
let pobImportState = null;
/** 複数選択時に接尾辞へまとめられる武器グループ（両方 ON のときのみ $） */
const WEAPON_SUFFIX_GROUPS = [
    {
        keys: ['oneHandAxe', 'twoHandAxe'],
        merged: '斧$',
        singles: { oneHandAxe: '^片手斧', twoHandAxe: '^両手斧' },
    },
    {
        keys: ['oneHandSword', 'twoHandSword'],
        merged: '剣$',
        singles: { oneHandSword: '^片手剣', twoHandSword: '^両手剣' },
    },
    {
        keys: ['oneHandMace', 'twoHandMace'],
        merged: 'メイス$',
        singles: { oneHandMace: '^片手メイス', twoHandMace: '^両手メイス' },
    },
    {
        keys: ['staff', 'warstaff'],
        merged: 'スタッフ$',
        singles: { staff: '^スタッフ', warstaff: '^ウォースタッフ' },
    },
    {
        keys: ['dagger', 'runeDagger'],
        merged: '短剣$',
        singles: { dagger: '^短剣', runeDagger: '^ルーンの短剣' },
    },
];
/** 単独武器の Regex（従来どおり） */
const WEAPON_SINGLE_PATTERNS = {
    claw: '^鉤爪',
    wand: ' wand|s horn',
    thrustingSword: '^刺突剣',
    sceptre: '^セプター',
    bow: ' bow',
    shield: '^ブロック率',
};
/** 選択された武器から短縮済み Regex パターンを生成 */
function buildWeaponRegexPatterns(weaponSelections) {
    const selectedKeys = Object.entries(weaponSelections || {})
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);
    if (selectedKeys.length === 0)
        return [];
    const patterns = [];
    const usedKeys = new Set();
    WEAPON_SUFFIX_GROUPS.forEach((group) => {
        const selectedInGroup = group.keys.filter((key) => selectedKeys.includes(key));
        if (selectedInGroup.length === 0)
            return;
        if (selectedInGroup.length === group.keys.length) {
            patterns.push(group.merged);
        }
        else {
            selectedInGroup.forEach((key) => {
                patterns.push(group.singles[key]);
            });
        }
        selectedInGroup.forEach((key) => usedKeys.add(key));
    });
    selectedKeys.forEach((key) => {
        if (usedKeys.has(key))
            return;
        if (WEAPON_SINGLE_PATTERNS[key]) {
            patterns.push(WEAPON_SINGLE_PATTERNS[key]);
        }
    });
    return patterns;
}
function generateVendorRegex() {
    const parts = [];
    const settings = vendorSettings;
    for (const [group, options] of [['accessory', VENDOR_ACCESSORY_OPTIONS], ['extra', VENDOR_EXTRA_OPTIONS]]) {
        for (const [key, option] of Object.entries(options)) {
            if (settings[group]?.[key])
                parts.push(option.pattern);
        }
    }
    const color3L = [];
    if (settings.colors.rrA)
        color3L.push('r-r-|-r-r|r-.-r');
    if (settings.colors.ggA)
        color3L.push('g-g-|-g-g|g-.-g');
    if (settings.colors.bbA)
        color3L.push('b-b-|-b-b|b-.-b');
    if (settings.colors.rrr)
        color3L.push('r-r-r');
    if (settings.colors.ggg)
        color3L.push('g-g-g');
    if (settings.colors.bbb)
        color3L.push('b-b-b');
    if (settings.colors.rrg && settings.colors.rrb) {
        color3L.push('r-r-[gb]|r-[gb]-r|[gb]-r-r');
    }
    else {
        if (settings.colors.rrg)
            color3L.push('r-r-g|r-g-r|g-r-r');
        if (settings.colors.rrb)
            color3L.push('r-r-b|r-b-r|b-r-r');
    }
    if (settings.colors.ggr && settings.colors.ggb) {
        color3L.push('g-g-[rb]|g-[rb]-g|[rb]-g-g');
    }
    else {
        if (settings.colors.ggr)
            color3L.push('g-g-r|g-r-g|r-g-g');
        if (settings.colors.ggb)
            color3L.push('g-g-b|g-b-g|b-g-g');
    }
    if (settings.colors.bbr && settings.colors.bbg) {
        color3L.push('b-b-[rg]|b-[rg]-b|[rg]-b-b');
    }
    else {
        if (settings.colors.bbr)
            color3L.push('b-b-r|b-r-b|r-b-b');
        if (settings.colors.bbg)
            color3L.push('b-b-g|b-g-b|g-b-b');
    }
    if (settings.colors.rgb)
        color3L.push(':.*(?=\\S*r)(?=\\S*g)(?=\\S*b)');
    if (settings.colors.raa)
        color3L.push('.-.-r|.-r-.|r-.-.');
    if (settings.colors.gaa)
        color3L.push('.-.-g|.-g-.|g-.-.');
    if (settings.colors.baa)
        color3L.push('.-.-b|.-b-.|b-.-.');
    if (color3L.length > 0)
        parts.push(color3L.join('|'));
    const color2L = [];
    if (settings.colors.rr)
        color2L.push('r-r');
    if (settings.colors.gg)
        color2L.push('g-g');
    if (settings.colors.bb)
        color2L.push('b-b');
    if (settings.colors.rb)
        color2L.push('r-b|b-r');
    if (settings.colors.gr)
        color2L.push('g-r|r-g');
    if (settings.colors.bg)
        color2L.push('b-g|g-b');
    if (color2L.length > 0)
        parts.push(color2L.join('|'));
    if (settings.anyThreeLink)
        parts.push('-\\w-');
    if (settings.anyFourLink)
        parts.push('-\\w-.-');
    if (settings.anyFiveLink)
        parts.push('(-\\w){4}');
    if (settings.anySixLink)
        parts.push('(-\\w){5}');
    if (settings.anySixSocket)
        parts.push('(\\w\\W){5}');
    if (settings.movement.ten)
        parts.push('走者の');
    if (settings.movement.fifteen)
        parts.push('競走者の');
    if (settings.movement.twenty)
        parts.push('牡馬の');
    if (settings.movement.twentyfive)
        parts.push('ガゼルの');
    if (settings.movement.thirty)
        parts.push('チーターの');
    const weapons = buildWeaponRegexPatterns(settings.weapon);
    if (weapons.length > 0)
        parts.push(weapons.join('|'));
    if (settings.selectedGems && settings.selectedGems.length > 0) {
        parts.push(settings.selectedGems.join('|'));
    }
    let regex = parts.join('|');
    let mainRegex = parts.join('|');
    let finalRegex = '';
    const excludeWeapons = buildWeaponRegexPatterns(settings.excludeWeapons);
    if (mainRegex && excludeWeapons.length > 0) {
        finalRegex = `"${mainRegex}" "!.*(?:${excludeWeapons.join('|')})"`;
    }
    else if (mainRegex) {
        finalRegex = `"${mainRegex}"`;
    }
    else if (excludeWeapons.length > 0) {
        finalRegex = `"!.*(?:${excludeWeapons.join('|')})"`;
    }
    return finalRegex;
}
function updateVendorCharCount() {
    const result = getElement('vendorRegexOutput')?.textContent || '';
    const charCount = result.length;
    const charCountElement = getElement('vendorCharCount');
    if (charCountElement) {
        charCountElement.textContent = `文字数: ${charCount}`;
        if (charCount > 250) {
            charCountElement.style.color = 'red';
            charCountElement.textContent += ' (250文字を超えています)';
        }
        else {
            charCountElement.style.color = '';
        }
    }
}
function copyVendorRegex() {
    const regex = getElement('vendorRegexOutput')?.textContent || '';
    if (regex && regex !== '(空のRegex)') {
        navigator.clipboard.writeText(regex)
            .then(() => {
            showNotification('コピーしました！');
        })
            .catch(err => {
            console.error('コピー失敗:', err);
            showNotification('❌ コピー失敗', true);
        });
    }
    else {
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
    removeStoredValue('vendorSettings');
    showNotification('ベンダー設定をリセットしました');
}
function saveVendorSettings() {
    writeStoredJson('vendorSettings', vendorSettings);
}
function loadVendorSettings() {
    const saved = readStoredText('vendorSettings');
    if (saved) {
        try {
            const parsed = readStoredJson('vendorSettings');
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
                accessory: { ...parsed.accessory },
                extra: { ...parsed.extra },
                selectedGems: parsed.selectedGems || []
            };
            applyVendorSettings();
        }
        catch (e) {
            console.error('設定の読み込みエラー:', e);
        }
    }
}
function applyVendorSettings() {
    for (const [group, options] of [['accessory', VENDOR_ACCESSORY_OPTIONS], ['extra', VENDOR_EXTRA_OPTIONS]]) {
        for (const key of Object.keys(options)) {
            const checkbox = getElement(`vendor-${group}-${key}`);
            if (checkbox)
                checkbox.checked = vendorSettings[group]?.[key] || false;
        }
    }
    Object.entries(vendorSettings.colors).forEach(([key, value]) => {
        const checkbox = getElement(`vendor-color-${key}`);
        if (checkbox)
            checkbox.checked = value;
    });
    ['anyThreeLink', 'anyFourLink', 'anyFiveLink', 'anySixLink', 'anySixSocket'].forEach(key => {
        const checkbox = getElement(`vendor-${key}`);
        if (checkbox)
            checkbox.checked = vendorSettings[key];
    });
    const moveTen = getElement('vendor-movement-ten');
    const moveFifteen = getElement('vendor-movement-fifteen');
    const moveTwenty = getElement('vendor-movement-twenty');
    const moveTwentyfive = getElement('vendor-movement-twentyfive');
    const moveThirty = getElement('vendor-movement-thirty');
    if (moveTen)
        moveTen.checked = vendorSettings.movement?.ten || false;
    if (moveFifteen)
        moveFifteen.checked = vendorSettings.movement?.fifteen || false;
    if (moveTwenty)
        moveTwenty.checked = vendorSettings.movement?.twenty || false;
    if (moveTwentyfive)
        moveTwentyfive.checked = vendorSettings.movement?.twentyfive || false;
    if (moveThirty)
        moveThirty.checked = vendorSettings.movement?.thirty || false;
    Object.entries(vendorSettings.weapon).forEach(([key, value]) => {
        const checkbox = getElement(`vendor-weapon-${key}`);
        if (checkbox)
            checkbox.checked = value;
    });
    Object.entries(vendorSettings.excludeWeapons).forEach(([key, value]) => {
        const checkbox = getElement(`vendor-exclude-${key}`);
        if (checkbox)
            checkbox.checked = value;
    });
    selectedGems = vendorSettings.selectedGems || [];
    updateGemButtons();
    updateVendorRegex();
}
function handleVendorCheckboxChange(checkbox) {
    const id = checkbox.id.replace('vendor-', '');
    if (id.startsWith('accessory-') || id.startsWith('extra-')) {
        const [group, key] = id.split('-');
        vendorSettings[group] ?? (vendorSettings[group] = {});
        vendorSettings[group][key] = checkbox.checked;
    }
    else if (id.startsWith('color-')) {
        const colorKey = id.replace('color-', '');
        vendorSettings.colors[colorKey] = checkbox.checked;
    }
    else if (id.startsWith('weapon-')) {
        const weaponKey = id.replace('weapon-', '');
        vendorSettings.weapon[weaponKey] = checkbox.checked;
    }
    else if (id.startsWith('exclude-')) {
        const excludeKey = id.replace('exclude-', '');
        vendorSettings.excludeWeapons[excludeKey] = checkbox.checked;
    }
    else if (id.startsWith('movement-')) {
        const moveKey = id.replace('movement-', '');
        vendorSettings.movement = vendorSettings.movement || {};
        const moveMapping = {
            'ten': 'ten', 'fifteen': 'fifteen', 'twenty': 'twenty',
            'twentyfive': 'twentyfive', 'thirty': 'thirty'
        };
        if (moveMapping[moveKey]) {
            vendorSettings.movement[moveMapping[moveKey]] = checkbox.checked;
        }
    }
    else {
        vendorSettings[id] = checkbox.checked;
    }
    updateVendorRegex();
}
function setupVendorEventListeners() {
    document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
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
        fetch('data/poe1/gems/gems_regex.json')
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
    const container = getElement('gemListContainer');
    if (!container)
        return;
    const gemsByColor = { r: [], g: [], b: [], other: [] };
    gemData.forEach(gem => {
        const color = gem.color || 'other';
        if (gemsByColor[color])
            gemsByColor[color].push(gem);
        else
            gemsByColor.other.push(gem);
    });
    container.innerHTML = '';
    Object.entries(gemsByColor).forEach(([color, gems]) => {
        if (gems.length === 0)
            return;
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
    button.dataset.regex = gem.regex;
    button.dataset.color = gem.color || 'other';
    button.dataset.eng = gem.eng || '';
    button.dataset.name = gem.display_name;
    button.dataset.gemId = gem.id || '';
    const label = document.createElement('span');
    label.className = 'gem-button-label';
    label.textContent = gem.display_name;
    button.appendChild(label);
    const badges = document.createElement('span');
    badges.className = 'gem-button-badges';
    button.appendChild(badges);
    updateGemButtonBadges(button, gem);
    button.title = buildGemButtonTitle(gem);
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
function buildGemButtonTitle(gem) {
    const parts = [gem.regex];
    if (gem.eng)
        parts.push(gem.eng);
    if (gem.quest_reward) {
        parts.push(`ACT${gem.quest_reward.act} クエスト: ${gem.quest_reward.quest}`);
    }
    if (pobImportState?.importedRegexes?.has(gem.regex)) {
        parts.push('PoBビルド内');
    }
    return parts.join(' / ');
}
function updateGemButtonBadges(button, gem) {
    const badges = button.querySelector('.gem-button-badges');
    if (!badges)
        return;
    badges.innerHTML = '';
    if (pobImportState?.importedRegexes?.has(gem.regex)) {
        const pobBadge = document.createElement('span');
        pobBadge.className = 'gem-badge gem-badge-pob';
        pobBadge.textContent = 'PoB';
        badges.appendChild(pobBadge);
    }
    const classNameJp = pobImportState?.classNameJp;
    if (classNameJp && isQuestRewardForClass(gem, classNameJp)) {
        const questBadge = document.createElement('span');
        questBadge.className = 'gem-badge gem-badge-quest';
        questBadge.textContent = `ACT${gem.quest_reward.act}Q`;
        badges.appendChild(questBadge);
    }
}
function refreshAllGemBadges() {
    document.querySelectorAll('.gem-button').forEach((button) => {
        const regex = button.dataset.regex;
        const gem = gemData.find((g) => g.regex === regex);
        if (gem) {
            updateGemButtonBadges(button, gem);
            button.title = buildGemButtonTitle(gem);
        }
    });
}
function findGemByRegex(regex) {
    return gemData.find((g) => g.regex === regex);
}
function selectGemByRegex(regex, selected = true) {
    const index = selectedGems.indexOf(regex);
    if (selected && index === -1) {
        selectedGems.push(regex);
    }
    else if (!selected && index !== -1) {
        selectedGems.splice(index, 1);
    }
}
function applyGemSelectionFromRegexes(regexes, { replace = false } = {}) {
    if (replace) {
        selectedGems = [];
    }
    regexes.forEach((regex) => selectGemByRegex(regex, true));
    vendorSettings.selectedGems = [...selectedGems];
    updateGemButtons();
    updateVendorRegex();
    saveVendorSettings();
}
/** 同一クエストの重複を除いたマッチ結果（クエスト報酬は1クエスト1ジェム） */
function dedupeMatchedByQuest(matched, questChoices) {
    const vendorItems = matched.filter((m) => !m.isQuest);
    const questGroups = new Map();
    matched.filter((m) => m.isQuest).forEach((item) => {
        const reward = item.localGem.quest_reward;
        const key = getQuestRewardKey(reward.act, reward.quest);
        if (!questGroups.has(key))
            questGroups.set(key, []);
        questGroups.get(key).push(item);
    });
    const questItems = [];
    questGroups.forEach((items, key) => {
        const mainRegex = questChoices?.[`${key}::main`];
        const bonusRegex = questChoices?.[`${key}::bonus`];
        const picked = items.filter((item) => (item.localGem.regex === mainRegex || item.localGem.regex === bonusRegex));
        questItems.push(...(picked.length ? picked : [items[0]]));
    });
    return [...vendorItems, ...questItems];
}
function getRegexesFromMatchedItems(items) {
    return items.map((m) => m.localGem.regex);
}
/** ビルド内ジェムに関係するクエストを ACT 順に整理 */
function getBuildRelevantQuestGroups(questMemo, importedRegexes) {
    const byAct = new Map();
    questMemo.forEach(({ act, quests }) => {
        quests.forEach((questEntry) => {
            const gems = questEntry.gems || [];
            const bonusGems = questEntry.bonusGems || [];
            const allRewardGems = [...gems, ...bonusGems];
            if (!allRewardGems.some((gem) => importedRegexes.has(gem.regex)))
                return;
            if (!byAct.has(act))
                byAct.set(act, []);
            byAct.get(act).push(questEntry);
        });
    });
    return Array.from(byAct.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([act, quests]) => ({ act, quests }));
}
function renderQuestChoiceButtons(act, quest, choiceType, gems, chosenRegex, importedRegexes) {
    let html = '<div class="pob-memo-quest-gems">';
    gems.forEach((gem) => {
        const inBuild = importedRegexes.has(gem.regex);
        const isChosen = gem.regex === chosenRegex;
        const selected = selectedGems.includes(gem.regex);
        const classes = [
            'pob-quest-gem-btn',
            isChosen ? 'is-chosen' : '',
            inBuild ? 'in-build' : '',
            selected ? 'is-selected' : '',
        ].filter(Boolean).join(' ');
        const title = inBuild ? 'ビルド内' : gem.eng || '';
        html += `<button type="button" class="${classes}"`
            + ` data-act="${act}" data-quest="${encodeURIComponent(quest)}"`
            + ` data-choice-type="${choiceType}" data-regex="${gem.regex}"`
            + ` title="${title}">${gem.display_name}</button>`;
    });
    html += '</div>';
    return html;
}
/** クエスト名 + 通常報酬 + 追加報酬 */
function renderQuestGemChoiceRow(act, questEntry, questChoices, importedRegexes) {
    const quest = questEntry.quest;
    const gems = questEntry.gems || [];
    const bonusGems = questEntry.bonusGems || [];
    const mainKey = getQuestRewardChoiceKey(act, quest, 'main');
    const bonusKey = getQuestRewardChoiceKey(act, quest, 'bonus');
    const chosenMainRegex = questChoices[mainKey] || gems[0]?.regex;
    const chosenBonusRegex = questChoices[bonusKey] || bonusGems[0]?.regex;
    let html = '<div class="pob-memo-quest-block">';
    html += `<div class="pob-memo-quest-name">${quest}</div>`;
    if (gems.length > 0) {
        html += '<div class="pob-memo-quest-line">';
        html += '<span class="pob-memo-quest-kind">クエスト報酬</span>';
        html += renderQuestChoiceButtons(act, quest, 'main', gems, chosenMainRegex, importedRegexes);
        html += '</div>';
    }
    if (bonusGems.length > 0) {
        html += '<div class="pob-memo-quest-line">';
        html += '<span class="pob-memo-quest-kind pob-memo-quest-kind-bonus">追加報酬</span>';
        html += renderQuestChoiceButtons(act, quest, 'bonus', bonusGems, chosenBonusRegex, importedRegexes);
        html += '</div>';
    }
    html += '</div>';
    return html;
}
/** ACT 単位のクエスト選択ブロック */
function renderQuestGroupsByAct(questGroupsByAct, questChoices, importedRegexes) {
    let html = '';
    questGroupsByAct.forEach(({ act, quests }) => {
        html += `<div class="pob-memo-act"><div class="pob-memo-act-title">ACT ${act}</div>`;
        quests.forEach((questEntry) => {
            html += renderQuestGemChoiceRow(act, questEntry, questChoices, importedRegexes);
        });
        html += '</div>';
    });
    return html;
}
function isBuildRelevantQuest(act, quest, pobImportState) {
    if (!pobImportState)
        return false;
    return getBuildRelevantQuestGroups(pobImportState.questMemo, pobImportState.importedRegexes)
        .some((group) => group.act === act && group.quests.some((entry) => entry.quest === quest));
}
/** PoB ジェム一覧をローカルデータと照合 */
function matchPobGemsFromBuild(pobGems, classNameJp) {
    const matched = [];
    const unmatched = [];
    pobGems.forEach((pobGem) => {
        const localGem = matchPobGemToLocal(pobGem, gemData);
        if (localGem) {
            matched.push({
                pobGem,
                localGem,
                isQuest: isQuestRewardForClass(localGem, classNameJp),
            });
        }
        else {
            unmatched.push(pobGem);
        }
    });
    return { matched, unmatched };
}
/** pobImportState をロードアウトのジェム照合結果で更新 */
function updatePobImportFromSkillSets(skillSetIds, { replaceGems = true } = {}) {
    if (!pobImportState?.build)
        return;
    const pobGems = getBuildGemsForSkillSets(pobImportState.build, skillSetIds);
    const { matched, unmatched } = matchPobGemsFromBuild(pobGems, pobImportState.classNameJp);
    const importedRegexes = new Set(matched.map((m) => m.localGem.regex));
    const questChoices = initQuestRewardChoices(pobImportState.questMemo, importedRegexes);
    const dedupedMatched = dedupeMatchedByQuest(matched, questChoices);
    pobImportState.selectedSkillSetIds = [...skillSetIds];
    pobImportState.matched = matched;
    pobImportState.unmatched = unmatched;
    pobImportState.importedRegexes = importedRegexes;
    pobImportState.dedupedImportedRegexes = new Set(getRegexesFromMatchedItems(dedupedMatched));
    pobImportState.questChoices = questChoices;
    pobImportState.questRegexes = dedupedMatched.filter((m) => m.isQuest).map((m) => m.localGem.regex);
    applyPobVendorSelection({ replace: replaceGems });
    const searchInput = getElement('gemSearch');
    if (searchInput && matched.length > 0) {
        searchInput.value = matched.map((m) => m.localGem.eng || m.localGem.display_name).join('\n');
        filterGems();
    }
}
function getSelectedPobSkillSetIdsFromUI() {
    const list = getElement('pobSkillSetList');
    if (!list)
        return [];
    return Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
}
function buildSkillSetListHtml(build, selectedSkillSetIds) {
    const skillSets = build?.skillSets || [];
    if (skillSets.length <= 1)
        return '';
    const selectedSet = new Set(selectedSkillSetIds || []);
    const items = skillSets.map((set) => {
        const gemCount = set.gems.length;
        const checked = selectedSet.has(set.id) ? ' checked' : '';
        return `<label class="pob-import-skillset-item">`
            + `<input type="checkbox" value="${set.id}"${checked}>`
            + `<span>${set.title}（${gemCount}）</span>`
            + `</label>`;
    }).join('');
    return `
    <div class="pob-memo-loadout-group">
      <span class="pob-memo-loadout-label">ジェム・ロードアウト（複数選択可）</span>
      <div id="pobSkillSetList" class="pob-memo-loadout-list">${items}</div>
    </div>
  `;
}
function changePobSkillSets() {
    if (!pobImportState)
        return;
    let selectedIds = getSelectedPobSkillSetIdsFromUI();
    if (selectedIds.length === 0) {
        const fallbackId = pobImportState.selectedSkillSetIds?.[0]
            || pobImportState.build.skillSets?.[0]?.id
            || pobImportState.build.activeSkillSetId;
        if (fallbackId) {
            selectedIds = [fallbackId];
            const input = document.querySelector(`#pobSkillSetList input[value="${fallbackId}"]`);
            if (input)
                input.checked = true;
        }
    }
    updatePobImportFromSkillSets(selectedIds, { replaceGems: true });
    renderPobImportMemo();
    refreshAllGemBadges();
    showNotification(`ロードアウト ${selectedIds.length}件を反映しました`);
}
/** PoB 読込時のベンダー Regex 対象を算出（クエスト選択分を反映） */
function computePobVendorRegexes(pobImportState, excludeQuest = true) {
    if (!pobImportState)
        return [];
    const { matched, questMemo, questChoices, importedRegexes, } = pobImportState;
    const regexSet = new Set();
    const questRelatedRegexes = new Set();
    getBuildRelevantQuestGroups(questMemo, importedRegexes).forEach(({ act, quests }) => {
        quests.forEach((questEntry) => {
            const quest = questEntry.quest;
            const gems = questEntry.gems || [];
            const bonusGems = questEntry.bonusGems || [];
            const mainKey = getQuestRewardChoiceKey(act, quest, 'main');
            const bonusKey = getQuestRewardChoiceKey(act, quest, 'bonus');
            const rewardRegexes = new Set([
                questChoices[mainKey] || gems[0]?.regex,
                questChoices[bonusKey],
            ].filter(Boolean));
            const allRewardGems = new Map();
            [...gems, ...bonusGems].forEach((gem) => {
                allRewardGems.set(gem.regex, gem);
            });
            allRewardGems.forEach((gem) => {
                questRelatedRegexes.add(gem.regex);
                if (!importedRegexes.has(gem.regex))
                    return;
                if (!excludeQuest || !rewardRegexes.has(gem.regex)) {
                    regexSet.add(gem.regex);
                }
            });
        });
    });
    // クエスト非関連のビルド内ジェムはベンダー購入として含める
    matched.forEach((m) => {
        const regex = m.localGem.regex;
        if (questRelatedRegexes.has(regex))
            return;
        regexSet.add(regex);
    });
    return Array.from(regexSet);
}
function applyPobVendorSelection({ replace = true } = {}) {
    if (!pobImportState)
        return;
    const excludeQuest = getElement('pobExcludeQuestGems')?.checked !== false;
    const regexes = computePobVendorRegexes(pobImportState, excludeQuest);
    pobImportState.vendorRegexes = regexes;
    applyGemSelectionFromRegexes(regexes, { replace });
}
function selectQuestRewardChoice(act, quest, regex, choiceType = 'main') {
    if (!pobImportState)
        return;
    const key = getQuestRewardChoiceKey(act, quest, choiceType);
    pobImportState.questChoices[key] = regex;
    if (isBuildRelevantQuest(act, quest, pobImportState)) {
        applyPobVendorSelection({ replace: true });
    }
    renderPobImportMemo();
}
async function importGemsFromPobInput() {
    const inputEl = getElement('pobImportInput');
    const statusEl = getElement('pobImportStatus');
    const replaceCheckbox = getElement('pobImportReplaceGems');
    if (!inputEl)
        return;
    const input = inputEl.value.trim();
    if (!input) {
        showNotification('PoB コードまたは pobb.in URL を入力してください', true);
        return;
    }
    const parsed = parsePobInput(input);
    if (statusEl) {
        if (parsed.type === 'url') {
            statusEl.textContent = 'pobb.in から取得中...';
        }
        else {
            statusEl.textContent = 'ビルドを読み込み中...';
        }
        statusEl.style.color = '#FFA500';
    }
    try {
        await loadGemData();
        const build = await loadPobBuildFromInput(input);
        const defaultSkillSetId = build.skillSets?.[0]?.id
            || build.activeSkillSetId
            || '1';
        const selectedSkillSetIds = [defaultSkillSetId];
        const pobGems = getBuildGemsForSkillSets(build, selectedSkillSetIds);
        const { matched, unmatched } = matchPobGemsFromBuild(pobGems, build.classNameJp);
        const importedRegexes = new Set(matched.map((m) => m.localGem.regex));
        const questMemo = buildQuestRewardMemo(gemData, build.classNameJp);
        const questChoices = initQuestRewardChoices(questMemo, importedRegexes);
        const dedupedMatched = dedupeMatchedByQuest(matched, questChoices);
        const dedupedImportedRegexes = new Set(getRegexesFromMatchedItems(dedupedMatched));
        const questRegexes = dedupedMatched.filter((m) => m.isQuest).map((m) => m.localGem.regex);
        pobImportState = {
            build,
            selectedSkillSetIds,
            className: build.className,
            ascendClassName: build.ascendClassName,
            classNameJp: build.classNameJp,
            level: build.level,
            matched,
            unmatched,
            importedRegexes,
            dedupedImportedRegexes,
            vendorRegexes: [],
            questRegexes,
            questMemo,
            questChoices,
        };
        const excludeQuest = getElement('pobExcludeQuestGems')?.checked !== false;
        applyPobVendorSelection({ replace: replaceCheckbox?.checked === true });
        const vendorCount = pobImportState.vendorRegexes.length;
        renderPobImportMemo();
        refreshAllGemBadges();
        if (matched.length > 0) {
            const searchInput = getElement('gemSearch');
            if (searchInput) {
                searchInput.value = matched.map((m) => m.localGem.eng || m.localGem.display_name).join('\n');
                filterGems();
            }
        }
        const msg = `PoB読込: ${matched.length}件マッチ`
            + (unmatched.length ? ` / 未対応 ${unmatched.length}件` : '')
            + (excludeQuest ? ` / ベンダー購入 ${vendorCount}件` : '');
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.style.color = '#4CAF50';
        }
        showNotification(msg);
    }
    catch (error) {
        console.error('PoB import error:', error);
        if (statusEl) {
            statusEl.textContent = `エラー: ${error.message}`;
            statusEl.style.color = '#FF6B6B';
        }
        showNotification(`PoB読込失敗: ${error.message}`, true);
    }
}
function renderPobImportMemo() {
    const panel = getElement('pobImportMemo');
    if (!panel)
        return;
    if (!pobImportState) {
        panel.innerHTML = '';
        return;
    }
    const { className, ascendClassName, classNameJp, unmatched, questMemo, questChoices, importedRegexes, } = pobImportState;
    const ascendText = ascendClassName && ascendClassName !== 'None' ? ` / ${ascendClassName}` : '';
    const buildQuestGroups = getBuildRelevantQuestGroups(questMemo, importedRegexes);
    const hasBuildQuests = buildQuestGroups.some((g) => g.quests.length > 0);
    const skillSetHtml = buildSkillSetListHtml(pobImportState.build, pobImportState.selectedSkillSetIds);
    let html = `
    <div class="pob-memo-toolbar">
      <div class="pob-memo-build"><strong>ビルド:</strong> ${classNameJp || className}${ascendText}</div>
      ${skillSetHtml}
    </div>
  `;
    html += '<div class="pob-memo-section"><h4>クエスト報酬（このクラス・ビルド内）</h4>';
    if (!hasBuildQuests) {
        html += '<p class="pob-memo-note">ビルド内にクエスト報酬ジェムはありません。</p>';
    }
    else {
        html += '<p class="pob-memo-note">各報酬枠から1つ選択できます。選択したジェムは Regex から除外します。</p>';
        html += renderQuestGroupsByAct(buildQuestGroups, questChoices, importedRegexes);
    }
    html += '</div>';
    if (unmatched.length > 0) {
        html += '<div class="pob-memo-section pob-memo-warning"><h4>未対応ジェム</h4><ul class="pob-memo-list">';
        unmatched.forEach((gem) => {
            html += `<li><span>${gem.nameSpec || gem.skillId}</span></li>`;
        });
        html += '</ul><p class="pob-memo-note">gems_regex.json に未登録の可能性があります。手動で検索してください。</p></div>';
    }
    panel.innerHTML = html;
}
function selectVendorGemsFromPob() {
    if (!pobImportState)
        return;
    applyPobVendorSelection({ replace: true });
    renderPobImportMemo();
    showNotification('ベンダー購入分のみ選択しました');
}
function clearPobImport() {
    pobImportState = null;
    const inputEl = getElement('pobImportInput');
    const statusEl = getElement('pobImportStatus');
    if (inputEl)
        inputEl.value = '';
    if (statusEl)
        statusEl.textContent = '';
    renderPobImportMemo();
    refreshAllGemBadges();
}
function setupPobImportUI() {
    const importBtn = getElement('pobImportBtn');
    if (importBtn && !importBtn.hasEventListener) {
        importBtn.addEventListener('click', importGemsFromPobInput);
        importBtn.hasEventListener = true;
    }
    const clearBtn = getElement('pobImportClearBtn');
    if (clearBtn && !clearBtn.hasEventListener) {
        clearBtn.addEventListener('click', clearPobImport);
        clearBtn.hasEventListener = true;
    }
    const memoPanel = getElement('pobImportMemo');
    if (memoPanel && !memoPanel.hasPobMemoListener) {
        memoPanel.addEventListener('click', (event) => {
            const btn = event.target.closest('.pob-quest-gem-btn');
            if (!btn)
                return;
            const act = Number(btn.dataset.act);
            const quest = decodeURIComponent(btn.dataset.quest || '');
            const regex = btn.dataset.regex;
            const choiceType = btn.dataset.choiceType || 'main';
            if (act && quest && regex) {
                selectQuestRewardChoice(act, quest, regex, choiceType);
            }
        });
        memoPanel.addEventListener('change', (event) => {
            if (event.target?.type === 'checkbox' && event.target.closest('#pobSkillSetList')) {
                changePobSkillSets();
            }
        });
        memoPanel.hasPobMemoListener = true;
    }
    const excludeQuestCheckbox = getElement('pobExcludeQuestGems');
    if (excludeQuestCheckbox && !excludeQuestCheckbox.hasEventListener) {
        excludeQuestCheckbox.addEventListener('change', () => {
            if (!pobImportState)
                return;
            applyPobVendorSelection({ replace: true });
            renderPobImportMemo();
            refreshAllGemBadges();
        });
        excludeQuestCheckbox.hasEventListener = true;
    }
    renderPobImportMemo();
}
function updateGemButtonStyle(button) {
    const isSelected = selectedGems.includes(button.dataset.regex);
    const color = button.dataset.color;
    if (isSelected) {
        button.style.background = '#2d5a2d';
        button.style.borderColor = '#4CAF50';
        button.style.color = '#FFFFFF';
        button.style.fontWeight = 'bold';
    }
    else {
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
    }
    else {
        selectedGems.splice(index, 1);
    }
    vendorSettings.selectedGems = selectedGems;
    updateGemButtonStyle(button);
    updateVendorRegex();
    saveVendorSettings();
    renderPobImportMemo();
}
function filterGems() {
    const searchInput = getElement('gemSearch');
    if (!searchInput)
        return;
    const searchText = searchInput.value;
    const keywords = searchText.split(/[\n,;]+/)
        .map(keyword => keyword.trim().toLowerCase())
        .filter(keyword => keyword.length > 0);
    const buttons = document.querySelectorAll('.gem-button');
    let matchCount = 0;
    buttons.forEach(button => {
        const gemName = (button.dataset.name || '').toLowerCase();
        const gemRegex = button.dataset.regex || '';
        const gemEng = button.dataset.eng || '';
        const gemDisplayName = button.dataset.name || '';
        let match = false;
        if (keywords.length === 0) {
            match = true;
        }
        else {
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
        }
        else {
            button.style.display = 'none';
        }
    });
    updateSearchResultCount(matchCount);
}
function updateSearchResultCount(count) {
    let countElement = getElement('gemSearchResultCount');
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.id = 'gemSearchResultCount';
        countElement.style.cssText = `
      margin-top: 8px;
      font-size: 0.9em;
      color: #ccc;
      text-align: left;
    `;
        const searchContainer = getElement('gemSearch').parentNode;
        searchContainer.appendChild(countElement);
    }
    countElement.textContent = `検索結果: ${count}件`;
}
function setupGemSearch() {
    const searchInput = getElement('gemSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterGems);
        searchInput.addEventListener('paste', function () {
            setTimeout(filterGems, 10);
        });
        searchInput.addEventListener('keyup', filterGems);
    }
}
function clearGemSearch() {
    const searchInput = getElement('gemSearch');
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
    const profileName = getElement('vendorProfileName').value.trim();
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
    if (!writeStoredJson('vendorProfiles', vendorProfiles))
        return false;
    updateVendorProfileList();
    showNotification(`"${profileName}" を保存しました`);
    getElement('vendorProfileName').value = '';
    if (typeof updateSavedRegexDisplay === 'function') {
        updateSavedRegexDisplay();
    }
}
function loadVendorProfile() {
    const profileName = getElement('vendorProfileList').value;
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
        getElement('vendorProfileName').value = profileName;
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('プロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
function deleteVendorProfile() {
    const profileName = getElement('vendorProfileList').value;
    if (!profileName || !vendorProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を削除しますか?`)) {
        delete vendorProfiles[profileName];
        if (!writeStoredJson('vendorProfiles', vendorProfiles))
            return false;
        updateVendorProfileList();
        getElement('vendorProfileName').value = '';
        showNotification(`"${profileName}" を削除しました`);
        if (typeof updateSavedRegexDisplay === 'function') {
            updateSavedRegexDisplay();
        }
    }
}
function getGemDisplayName(gemRegex) {
    if (!gemData || gemData.length === 0)
        return gemRegex;
    const gem = gemData.find(g => g.regex === gemRegex);
    if (gem)
        return gem.display_name;
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
            const profileNameInput = getElement('vendorProfileName');
            const profileList = getElement('vendorProfileList');
            if (profileNameInput) {
                profileNameInput.value = profileName;
            }
            if (profileList) {
                profileList.value = profileName;
            }
            showNotification(`"${profileName}" を読み込みました`);
        }
        catch (error) {
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
    }
    catch (error) {
        console.error('Error generating vendor regex from profile:', error);
        return '(エラー: Regex生成失敗)';
    }
    finally {
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
    const savedProfiles = readStoredText('vendorProfiles');
    if (savedProfiles) {
        try {
            vendorProfiles = readStoredJson('vendorProfiles');
            updateVendorProfileList();
        }
        catch (e) {
            console.error('プロファイル読み込みエラー:', e);
            vendorProfiles = {};
        }
    }
    const profileList = getElement('vendorProfileList');
    if (profileList && !profileList.hasEventListener) {
        profileList.addEventListener('change', function () {
            if (this.value) {
                loadVendorProfile();
            }
            else {
                const input = getElement('vendorProfileName');
                if (input)
                    input.value = '';
            }
        });
        profileList.hasEventListener = true;
    }
    const saveBtn = getElement('saveVendorProfileBtn');
    if (saveBtn && !saveBtn.hasEventListener) {
        saveBtn.addEventListener('click', saveVendorProfile);
        saveBtn.hasEventListener = true;
    }
    const deleteBtn = getElement('deleteVendorProfileBtn');
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
    setupVendorExtraOptions();
    loadVendorSettings();
    setupVendorEventListeners();
    setupPobImportUI();
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
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, setting up vendor tab listeners');
    const vendorTab = document.querySelector('a[data-tab="vendorContent"]');
    if (vendorTab && !vendorTab.hasEventListener) {
        vendorTab.addEventListener('click', function (e) {
            console.log('Vendor tab clicked');
            setTimeout(handleVendorTabActivation, 100);
        });
        vendorTab.hasEventListener = true;
    }
    const vendorContentElem = getElement('vendorContent');
    if (window.location.hash === '#vendor' ||
        (vendorContentElem && vendorContentElem.style.display === 'block') ||
        (vendorContentElem && vendorContentElem.classList.contains('active'))) {
        console.log('Vendor tab is active on load');
        setTimeout(handleVendorTabActivation, 200);
    }
    if (!window.vendorHashChangeHandler) {
        window.vendorHashChangeHandler = function () {
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
window.importGemsFromPobInput = importGemsFromPobInput;
window.selectVendorGemsFromPob = selectVendorGemsFromPob;
window.clearPobImport = clearPobImport;
function getItemTranslationEngine() {
    return window.JpPoeUtils || window.JpPoe2Utils;
}
(function () {
    'use strict';
    var DIRECTION_LABELS = {
        ja2en: '日本語 → 英語',
        en2ja: '英語 → 日本語'
    };
    function setStatus(message, isError = false) {
        var el = getElement('itemTransStatus');
        if (!el)
            return;
        el.textContent = message || '';
        el.style.color = isError ? '#ff8a80' : 'var(--text-secondary)';
    }
    function translateItemText() {
        var input = getElement('itemTransInput');
        var output = getElement('itemTransOutput');
        if (!input || !output)
            return;
        if (!getItemTranslationEngine() || typeof getItemTranslationEngine().translateItemTextAuto !== 'function') {
            setStatus('変換エンジンの読み込みに失敗しました。', true);
            return;
        }
        var text = input.value;
        if (!text.trim()) {
            setStatus('入力が空です。', true);
            return;
        }
        try {
            var result = getItemTranslationEngine().translateItemTextAuto(text);
            output.value = result.result;
            var label = DIRECTION_LABELS[result.direction] || '変換';
            setStatus(label + ' に変換しました');
        }
        catch (err) {
            output.value = '';
            setStatus(err && err.message ? err.message : String(err), true);
        }
    }
    function copyItemTransOutput() {
        var output = getElement('itemTransOutput');
        if (!output || !output.value) {
            setStatus('コピーする出力がありません。', true);
            return;
        }
        navigator.clipboard.writeText(output.value).then(function () {
            if (typeof showNotification === 'function') {
                showNotification('コピーしました！');
            }
            setStatus('結果をクリップボードにコピーしました');
        }).catch(function () {
            output.select();
            document.execCommand('copy');
            setStatus('結果をコピーしました');
        });
    }
    function clearItemTransFields() {
        var input = getElement('itemTransInput');
        var output = getElement('itemTransOutput');
        if (input)
            input.value = '';
        if (output)
            output.value = '';
        setStatus('');
    }
    function initItemTranslatorTab() {
        var input = getElement('itemTransInput');
        if (input) {
            input.addEventListener('keydown', function (event) {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault();
                    translateItemText();
                }
            });
        }
    }
    window.translateItemText = translateItemText;
    window.copyItemTransOutput = copyItemTransOutput;
    window.clearItemTransFields = clearItemTransFields;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initItemTranslatorTab);
    }
    else {
        initItemTranslatorTab();
    }
})();
//# sourceMappingURL=poe1.js.map
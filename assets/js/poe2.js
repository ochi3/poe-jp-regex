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
        if (key === 'customRegex')
            return typeof item === 'string';
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
const POE2_REGEX_CHAR_LIMIT = 250;
function getPoe2MapProfileSettings() {
    return {
        itemQuantity: getElement('itemQuantityInput')?.value || '',
        packSize: getElement('packSizeInput')?.value || '',
        rarity: getElement('rarityInput')?.value || '',
        waystone: getElement('waystoneInput')?.value || '',
        effectiveness: getElement('effectivenessInput')?.value || '',
        mapMonsterRarity: getElement('mapMonsterRarityInput')?.value || '',
        revive: getElement('reviveInput')?.value || '',
        delirium: getElement('deliriumInput')?.value || '',
        rareMonster: getElement('rareMonsterInput')?.value || '',
        magicMonster: getElement('magicMonsterInput')?.value || '',
        packAddition: getElement('packAdditionCheckbox')?.checked || false,
        searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
        ngModChecked: getElement('ngModCheckbox')?.checked || false,
        mapTierChecked: getElement('mapTierCheckbox')?.checked || false,
    };
}
function applyPoe2MapProfileSettings(settings = {}) {
    const setInput = (id, value) => {
        const el = getElement(id);
        if (!el)
            return;
        el.value = value ?? '';
    };
    const setChecked = (id, value) => {
        const el = getElement(id);
        if (el && el.type === 'checkbox')
            el.checked = !!value;
    };
    setInput('itemQuantityInput', settings.itemQuantity);
    setInput('packSizeInput', settings.packSize);
    setInput('rarityInput', settings.rarity || settings.mapItemRarity);
    setInput('waystoneInput', settings.waystone);
    setInput('effectivenessInput', settings.effectiveness);
    setInput('mapMonsterRarityInput', settings.mapMonsterRarity);
    setInput('reviveInput', settings.revive);
    setInput('deliriumInput', settings.delirium);
    setInput('rareMonsterInput', settings.rareMonster);
    setInput('magicMonsterInput', settings.magicMonster);
    setChecked('packAdditionCheckbox', settings.packAddition);
    setChecked('ngModCheckbox', settings.ngModChecked);
    setChecked('mapTierCheckbox', settings.mapTierChecked);
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${settings.searchMode || 'any'}"]`);
    if (searchModeRadio)
        searchModeRadio.checked = true;
}
window.POE2_REGEX_CHAR_LIMIT = POE2_REGEX_CHAR_LIMIT;
window.getPoe2MapProfileSettings = getPoe2MapProfileSettings;
window.applyPoe2MapProfileSettings = applyPoe2MapProfileSettings;
/**
 * 選択されたマップMod用のPoEトレードサイトリンクを生成
 */
function buildTradeUrl() {
    // UIから設定を取得
    const league = (typeof getLeagueName === 'function' ? getLeagueName() : null)
        || getElement('leagueInput')?.value
        || "Mirage";
    let tradeMethod = getElement('tradeMethodSelect').value || "any";
    let minModCount = parseInt(getElement('minModCountInput').value) || 0;
    const notStats = [];
    const wantedStats = [];
    // 入力値を取得
    const iiq = parseInt(getElement('itemQuantityInput').value);
    const packsize = parseInt(getElement('packSizeInput').value);
    const iir = parseInt(getElement('rarityInput').value);
    const mapMonsterRarity = parseInt(getElement('mapMonsterRarityInput').value);
    const reviveRaw = getElement('reviveInput').value;
    const revive = reviveRaw === '' ? NaN : parseInt(reviveRaw, 10);
    const waystoneDrop = parseInt(getElement('waystoneInput').value);
    const delirium = parseInt(getElement('deliriumInput').value);
    const rareMonster = parseInt(getElement('rareMonsterInput').value);
    const magicMonster = parseInt(getElement('magicMonsterInput').value);
    const mapTierMin = getElement('mapTierMinInput').value;
    const mapTierMax = getElement('mapTierMaxInput').value;
    // checkedModsから選択されたModを取得
    const hasCheckedMods = checkedMods && checkedMods.size > 0;
    const hasInputs = !!(minModCount || iiq || packsize || iir || mapMonsterRarity
        || !isNaN(revive) || waystoneDrop || delirium || rareMonster || magicMonster
        || mapTierMin || mapTierMax);
    if (!hasCheckedMods && !hasInputs) {
        alert("検索条件を一つ以上指定してください。");
        return null;
    }
    // デフォルトで否定するステータスを追加 (PoE2用があればここに追加)
    const defaultNotStatIds = [
    // PoE2では現在不要な可能性が高いが、必要に応じて追加
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
    // クエリィオブジェクトを構築
    const query = {
        status: {
            option: tradeMethod
        },
        stats: []
    };
    // デリリウムの条件を追加
    // メインUIのセレクトボックスとサイドパネルのMin/Max値の両方をチェック
    const sideDeliriumMin = parseInt(getElement('deliriumMinInput')?.value || '0');
    const sideDeliriumMax = parseInt(getElement('deliriumMaxInput')?.value || '0');
    // 両方のソースから最大値を抽出
    const finalDeliriumMin = Math.max(delirium || 0, sideDeliriumMin);
    const finalDeliriumMax = sideDeliriumMax;
    if (finalDeliriumMin > 0 || finalDeliriumMax > 0) {
        const deliriumFilter = {
            id: "enchant.stat_1715784068",
            value: {},
            disabled: false
        };
        if (finalDeliriumMin > 0)
            deliriumFilter.value.min = finalDeliriumMin;
        if (finalDeliriumMax > 0)
            deliriumFilter.value.max = finalDeliriumMax;
        query.stats.push({
            type: "and",
            filters: [deliriumFilter]
        });
    }
    // Mod数の条件を追加
    const maxModCount = parseInt(getElement('maxModCountInput').value);
    if (minModCount > 0 || maxModCount > 0) {
        const stats = [];
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
    const buyoutPrice = getElement('buyoutPriceSelect').value;
    const buyoutPriceMin = parseInt(getElement('buyoutPriceMinInput').value);
    const buyoutPriceMax = parseInt(getElement('buyoutPriceMaxInput').value);
    const filters = {};
    // 詳細フィルタ（価格）
    if (buyoutPrice || buyoutPriceMin > 0 || buyoutPriceMax > 0) {
        const priceObj = {};
        if (buyoutPrice)
            priceObj.currency = buyoutPrice;
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
    // アイテムカテゴリ（ウェイストーン）とデフォルトフィルタ（レアリティ、フォイル、コラプト）
    const corruptedStatus = getElement('corruptedStatusSelect').value;
    filters.type_filters = {
        filters: {
            category: { option: "map.waystone" },
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
    // ウェイストーン（マップ）フィルタ
    const waystoneIir = iir || 0;
    if (mapTierMin || mapTierMax || iiq > 0 || packsize > 0 || waystoneIir > 0
        || waystoneDrop > 0 || rareMonster > 0 || magicMonster > 0 || !isNaN(revive)) {
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
        if (waystoneIir > 0)
            filters.map_filters.filters.map_iir = { min: waystoneIir };
        if (waystoneDrop > 0)
            filters.map_filters.filters.map_bonus = { min: waystoneDrop };
        if (rareMonster > 0)
            filters.map_filters.filters.map_rare_monsters = { min: rareMonster };
        if (magicMonster > 0)
            filters.map_filters.filters.map_magic_monsters = { min: magicMonster };
        if (!isNaN(revive))
            filters.map_filters.filters.map_revives = { min: revive };
    }
    // フィルタをクエリオブジェクトに割り当て
    Object.assign(query, { filters: filters });
    const queryJson = JSON.stringify({ query: query, sort: { price: "asc" } });
    const encodedQuery = encodeURIComponent(queryJson);
    const baseUrlHost = currentLanguage === 'en' ? 'www.pathofexile.com' : 'jp.pathofexile.com';
    return `https://${baseUrlHost}/trade2/search/poe2/${encodeURIComponent(league)}?q=${encodedQuery}`;
}
let ModList = { ...mapModList };
let currentLanguage = readLanguagePreference('poe2_poeLanguage');
const CHANGELOG_VERSION = 'poe2-2026-10-13';
const CHANGELOG_STORAGE_KEY = 'poe2ChangelogSeenVersion';
let checkedMods = new Map(); // キー -> 'ng' または 'wanted'
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    writeStoredText('poe2_poeLanguage', String(currentLanguage));
    updateLanguageUI();
    updateModList();
    updateCombinedRegex();
    if (typeof updateTabletModList === 'function')
        updateTabletModList();
    if (typeof updateTabletCombinedRegex === 'function')
        updateTabletCombinedRegex();
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
function formatModText(text, value) {
    if (!text)
        return text || '';
    const textParts = text.split('|');
    const valueParts = value ? value.split('|') : [];
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
    if (!selectedRegex?.trim()) {
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
        if (!selectedRegex?.trim())
            return;
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
        if (!selectedRegex?.trim())
            return;
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
    effectItem.appendChild(label);
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
    const mapChance = value["map_map_item_drop_chance_+%"] || value["map_map_item_drop_chance_+%_final_from_uber_mod"];
    if (mapChance) {
        const mapBadge = document.createElement('span');
        mapBadge.classList.add('badge', 'map-badge');
        mapBadge.textContent = `ウェイストーン ${mapChance}`;
        badgeContainer.appendChild(mapBadge);
    }
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
    const currencyChance = value["map_currency_drop_chance_+%"] || value["map_currency_drop_chance_+%_final_from_uber_mod"];
    if (currencyChance) {
        const currBadge = document.createElement('span');
        currBadge.classList.add('badge', 'currency-badge');
        currBadge.textContent = `カレンシー ${currencyChance}`;
        badgeContainer.appendChild(currBadge);
    }
    const scarabChance = value["map_scarab_drop_chance_+%"] || value["map_scarab_drop_chance_+%_final_from_uber_mod"];
    if (scarabChance) {
        const scarabBadge = document.createElement('span');
        scarabBadge.classList.add('badge', 'scarab-badge');
        scarabBadge.textContent = `スカラベ ${scarabChance}`;
        badgeContainer.appendChild(scarabBadge);
    }
    const rareMonsterCount = value["map_number_of_rare_packs_+%"];
    if (rareMonsterCount) {
        const rareBadge = document.createElement('span');
        rareBadge.classList.add('badge', 'qty-badge');
        rareBadge.style.backgroundColor = '#a5a744ff';
        rareBadge.textContent = `レアモンスター ${rareMonsterCount}`;
        badgeContainer.appendChild(rareBadge);
    }
    const magicMonsterCount = value["map_number_of_magic_packs_+%"];
    if (magicMonsterCount) {
        const magicBadge = document.createElement('span');
        magicBadge.classList.add('badge', 'qty-badge');
        magicBadge.style.backgroundColor = '#5878e0ff';
        magicBadge.textContent = `マジックモンスター ${magicMonsterCount}`;
        badgeContainer.appendChild(magicBadge);
    }
    const effectiveness = value["map_monster_potency_+%"];
    if (effectiveness) {
        const effBadge = document.createElement('span');
        effBadge.classList.add('badge', 'qty-badge');
        effBadge.style.backgroundColor = '#8e44ad';
        effBadge.textContent = `エフェクティブ ${effectiveness}`;
        badgeContainer.appendChild(effBadge);
    }
    const showDetails = getElement('showModDetailsCheckbox')?.checked ?? true;
    if (!showDetails) {
        badgeContainer.classList.add('hidden');
    }
    effectItem.appendChild(badgeContainer);
    ModListDiv.appendChild(effectItem);
}
function generateRarityRegex() {
    const normalChecked = getElement('normalCheckbox')?.checked || false;
    const magicChecked = getElement('magicCheckbox')?.checked || false;
    const rareChecked = getElement('rareCheckbox')?.checked || false;
    const rarities = {
        ja: [],
        en: []
    };
    if (normalChecked) {
        rarities.ja.push('ル');
        rarities.en.push('n');
    }
    if (magicChecked) {
        rarities.ja.push('ク');
        rarities.en.push('m');
    }
    if (rareChecked) {
        rarities.ja.push('ア');
        rarities.en.push('r');
    }
    const currentRarities = rarities[currentLanguage];
    if (currentRarities.length === 0 || currentRarities.length === 3) {
        return '';
    }
    else if (currentRarities.length === 1) {
        return currentLanguage === 'ja'
            ? `${currentRarities[0]}\$`
            : `"y: ${currentRarities[0]}"`;
    }
    else {
        return currentLanguage === 'ja'
            ? `(${currentRarities.join('|')})\$`
            : `"y: (${currentRarities.join('|')})"`;
    }
}
function updateCombinedRegex() {
    const itemQuantityValue = getElement('itemQuantityInput').value;
    const packSizeValue = getElement('packSizeInput').value;
    const rarityValue = getElement('rarityInput').value;
    const ngModChecked = getElement('ngModCheckbox').checked;
    let combinedResult = '';
    const ngResults = [];
    const wantedResults = [];
    if (getElement('packAdditionCheckbox')?.checked) {
        wantedResults.push(currentLanguage === 'ja' ? 'が追.*ク出' : 'l pa');
    }
    const validCheckedMods = new Map();
    checkedMods.forEach((state, key) => {
        const mod = ModList[key];
        if (mod) {
            const regex = currentLanguage === 'ja' ? mod.Regex : mod.engRegex;
            if (!regex?.trim())
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
        const rarityRegex = getFixedRangeRegex(rarityValue, currentLanguage === 'ja' ? 'ムレア.*' : 'm rar.*');
        combinedResult += ` ${rarityRegex}`;
    }
    const waystoneValue = getElement('waystoneInput').value;
    if (waystoneValue) {
        const waystoneRegex = getFixedRangeRegex(waystoneValue, currentLanguage === 'ja' ? 'プ確.*' : 'p c.*');
        combinedResult += ` ${waystoneRegex}`;
    }
    const effectivenessValue = getElement('effectivenessInput').value;
    if (effectivenessValue) {
        const effectivenessRegex = getFixedRangeRegex(effectivenessValue, currentLanguage === 'ja' ? 'ィブ:.*' : 'ess:.*');
        combinedResult += ` ${effectivenessRegex}`;
    }
    const mapMonsterRarityValue = getElement('mapMonsterRarityInput').value;
    if (mapMonsterRarityValue) {
        const mapMonsterRarityRegex = getFixedRangeRegex(mapMonsterRarityValue, currentLanguage === 'ja' ? 'モ.*ティ:.*' : 'ter rar.*');
        combinedResult += ` ${mapMonsterRarityRegex}`;
    }
    const reviveValue = getElement('reviveInput').value;
    if (reviveValue !== '') {
        const reviveRegex = getSingleDigitRangeRegex(reviveValue, currentLanguage === 'ja' ? '活が利.*' : 's ava.*');
        if (reviveRegex) {
            combinedResult += ` ${reviveRegex}`;
        }
    }
    const extraRegex = generateExtraRegex();
    if (extraRegex) {
        combinedResult += ` ${extraRegex}`;
    }
    const rarityRegex = generateRarityRegex();
    if (currentLanguage === 'ja') {
        if (rarityRegex && ModListResult) {
            combinedResult = `${ModListResult}|${rarityRegex}${combinedResult}`.trim();
        }
        else if (rarityRegex) {
            combinedResult = `${rarityRegex}${combinedResult}`.trim();
        }
        else if (ModListResult) {
            combinedResult = `${ModListResult}${combinedResult}`.trim();
        }
    }
    else {
        if (ModListResult) {
            combinedResult = `${ModListResult} ${rarityRegex} ${combinedResult}`.trim();
        }
        else {
            combinedResult = `${rarityRegex} ${combinedResult}`.trim();
        }
    }
    getElement('combinedRegexOutput').textContent = combinedResult;
    updateCharCount();
}
let searchAllMode = true;
function generateExtraRegex() {
    const rareValue = getElement('rareMonsterInput').value;
    const magicValue = getElement('magicMonsterInput').value;
    let monsterRegex = [];
    if (rareValue) {
        monsterRegex.push(getFixedRangeRegex(rareValue, currentLanguage === 'ja' ? 'アモ.*数が' : 'e mo .*'));
    }
    if (magicValue) {
        monsterRegex.push(getFixedRangeRegex(magicValue, currentLanguage === 'ja' ? 'ックモ.*数が' : 'c m.*'));
    }
    let combinedMonster = '';
    if (monsterRegex.length > 0) {
        if (searchAllMode) {
            combinedMonster = monsterRegex.join(' ');
        }
        else {
            combinedMonster = monsterRegex.join('|').replace(/"/g, '');
            if (monsterRegex.length > 1) {
                combinedMonster = `(${combinedMonster})`;
            }
            // "どれか"モードでも個別の条件として認識させるため、""が必要な場合はgetFixedRangeRegexが付けているが、
            // join('|')で消したため、全体を""で囲む必要がある場合がある。
            // しかしPoEの検索バーでは (a|b) 形式で動作するため、そのままにする。
        }
    }
    let finalResult = [];
    if (combinedMonster)
        finalResult.push(combinedMonster);
    const deliriumValue = getElement('deliriumInput').value;
    if (deliriumValue) {
        const firstDigit = deliriumValue.toString()[0];
        if (firstDigit >= '1' && firstDigit <= '9') {
            const deliriumPattern = currentLanguage === 'ja'
                ? `([${firstDigit}-9]\\d+%のせ)`
                : `([${firstDigit}-9]\\d+% Del)`;
            finalResult.push(deliriumPattern);
        }
    }
    return finalResult.join(' ');
}
function updateCharCount() {
    const result = getElement('combinedRegexOutput').textContent;
    const charCount = result.length;
    const charCountElement = getElement('charCount');
    charCountElement.textContent = `文字数: ${charCount}`;
    if (charCount > POE2_REGEX_CHAR_LIMIT) {
        charCountElement.style.color = 'red';
        charCountElement.textContent += ` (${POE2_REGEX_CHAR_LIMIT}文字を超えています)`;
    }
    else {
        charCountElement.style.color = '';
    }
}
function resetAll() {
    getElement('itemQuantityInput').value = '';
    getElement('packSizeInput').value = '';
    getElement('rarityInput').value = '';
    getElement('rareMonsterInput').value = '';
    getElement('magicMonsterInput').value = '';
    getElement('waystoneInput').value = '';
    getElement('effectivenessInput').value = '';
    getElement('mapMonsterRarityInput').value = '';
    getElement('reviveInput').value = '';
    getElement('deliriumInput').value = '';
    if (getElement('packAdditionCheckbox'))
        getElement('packAdditionCheckbox').checked = false;
    if (getElement('corruptedCheckbox'))
        getElement('corruptedCheckbox').checked = false;
    if (getElement('nonCorruptedCheckbox'))
        getElement('nonCorruptedCheckbox').checked = false;
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
    removeStoredValue('poe2_searchModeState');
    removeStoredValue('poe2_inputState');
    removeStoredValue('poe2_modCheckboxState');
    removeStoredValue('poe2_ngModChecked');
    removeStoredValue('poe2_mapTierChecked');
    removeStoredValue('poe2_normalChecked');
    removeStoredValue('poe2_magicChecked');
    removeStoredValue('poe2_rareChecked');
    ModList = { ...mapModList };
    checkedMods.clear();
    updateModList();
    updateCombinedRegex();
}
/** 0〜9 の1桁数値用（復活回数など、% なし） */
function getSingleDigitRangeRegex(num, basePattern, maxDigit = 9) {
    num = parseInt(num, 10);
    if (isNaN(num) || num < 0 || num > maxDigit)
        return '';
    if (num === 0) {
        return `"${basePattern}[0-${maxDigit}]"`;
    }
    return `"${basePattern}[${num}-${maxDigit}]"`;
}
let currentSearchTerm = '';
function saveCheckboxState() {
    const ngModCheckbox = getElement('ngModCheckbox');
    if (ngModCheckbox) {
        writeStoredText('poe2_ngModChecked', String(ngModCheckbox.checked));
    }
    const mapTierCheckbox = getElement('mapTierCheckbox');
    if (mapTierCheckbox) {
        writeStoredText('poe2_mapTierChecked', String(mapTierCheckbox.checked));
    }
}
function loadCheckboxState() {
    const ngModChecked = readStoredText('poe2_ngModChecked') === 'true';
    const mapTierChecked = readStoredText('poe2_mapTierChecked') === 'true';
    const ngModCheckbox = getElement('ngModCheckbox');
    if (ngModCheckbox)
        ngModCheckbox.checked = ngModChecked;
    const mapTierCheckbox = getElement('mapTierCheckbox');
    if (mapTierCheckbox)
        mapTierCheckbox.checked = mapTierChecked;
}
function saveModCheckboxState() {
    if (!checkedMods)
        return;
    const state = Object.fromEntries(checkedMods);
    writeStoredJson('poe2_modCheckboxState', state);
}
function updateModList() {
    const ModListDiv = getElement('ModList');
    const currentSearchTerm = getElement('effectSearch').value.toLowerCase();
    ModListDiv.innerHTML = '';
    const isT17 = getElement('mapTierCheckbox')?.checked || false;
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
            case 'waystone_asc': {
                const vA = valueA["map_map_item_drop_chance_+%"] || 0;
                const vB = valueB["map_map_item_drop_chance_+%"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'waystone_desc': {
                const vA = valueA["map_map_item_drop_chance_+%"] || 0;
                const vB = valueB["map_map_item_drop_chance_+%"] || 0;
                if (vA !== vB)
                    return vB - vA;
                break;
            }
            case 'rare_asc': {
                const vA = valueA["map_number_of_rare_packs_+%"] || 0;
                const vB = valueB["map_number_of_rare_packs_+%"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'rare_desc': {
                const vA = valueA["map_number_of_rare_packs_+%"] || 0;
                const vB = valueB["map_number_of_rare_packs_+%"] || 0;
                if (vA !== vB)
                    return vB - vA;
                break;
            }
            case 'magic_asc': {
                const vA = valueA["map_number_of_magic_packs_+%"] || 0;
                const vB = valueB["map_number_of_magic_packs_+%"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'magic_desc': {
                const vA = valueA["map_number_of_magic_packs_+%"] || 0;
                const vB = valueB["map_number_of_magic_packs_+%"] || 0;
                if (vA !== vB)
                    return vB - vA;
                break;
            }
            case 'effectiveness_asc': {
                const vA = valueA["map_monster_potency_+%"] || 0;
                const vB = valueB["map_monster_potency_+%"] || 0;
                if (vA !== vB)
                    return vA - vB;
                break;
            }
            case 'effectiveness_desc': {
                const vA = valueA["map_monster_potency_+%"] || 0;
                const vB = valueB["map_monster_potency_+%"] || 0;
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
    const showDetails = getElement('showModDetailsCheckbox')?.checked || false;
    writeStoredText('poe2_showModDetails', String(showDetails));
    document.querySelectorAll('.badge-container').forEach(container => {
        if (showDetails) {
            container.classList.remove('hidden');
        }
        else {
            container.classList.add('hidden');
        }
    });
}
function loadModDetailsState() {
    const showDetails = readStoredText('poe2_showModDetails') !== 'false'; // デフォルトは表示
    if (getElement('showModDetailsCheckbox')) {
        getElement('showModDetailsCheckbox').checked = showDetails;
    }
}
function loadModCheckboxState() {
    const saved = readStoredText('poe2_modCheckboxState');
    if (saved) {
        try {
            const state = readStoredJson('poe2_modCheckboxState');
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
    const state = {};
    const ids = [
        'itemQuantityInput', 'packSizeInput', 'rarityInput', 'rareMonsterInput', 'magicMonsterInput',
        'waystoneInput', 'effectivenessInput', 'mapMonsterRarityInput', 'reviveInput',
        'deliriumInput', 'packAdditionCheckbox'
    ];
    ids.forEach(id => {
        const el = getElement(id);
        if (el) {
            const key = id.replace('Input', '').replace('Checkbox', '');
            state[key] = el.type === 'checkbox' ? el.checked : el.value;
        }
    });
    writeStoredJson('poe2_inputState', state);
}
function loadInputState() {
    const state = readStoredJson('poe2_inputState');
    const mapping = {
        'itemQuantityInput': state.itemQuantity || '',
        'packSizeInput': state.packSize || '',
        'rarityInput': state.rarity || state.mapItemRarity || '',
        'rareMonsterInput': state.rareMonster || '',
        'magicMonsterInput': state.magicMonster || '',
        'waystoneInput': state.waystone || '',
        'effectivenessInput': state.effectiveness || '',
        'mapMonsterRarityInput': state.mapMonsterRarity || '',
        'reviveInput': state.revive || '',
        'deliriumInput': state.delirium || '',
        'packAdditionCheckbox': state.packAddition || false
    };
    Object.entries(mapping).forEach(([id, val]) => {
        const el = getElement(id);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = val;
            }
            else {
                el.value = val;
            }
        }
    });
}
getElement('ngModCheckbox')?.addEventListener('change', saveCheckboxState);
getElement('mapTierCheckbox')?.addEventListener('change', saveCheckboxState);
function saveSearchModeState() {
    const state = {
        searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any'
    };
    writeStoredJson('poe2_searchModeState', state);
}
function loadSearchModeState() {
    const state = readStoredJson('poe2_searchModeState');
    const searchMode = state.searchMode || 'any';
    const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${searchMode}"]`);
    if (searchModeRadio) {
        searchModeRadio.checked = true;
    }
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
        mods: Array.from(checkedMods),
        settings: getPoe2MapProfileSettings(),
        timestamp: Date.now()
    };
    if (!writeStoredJson('poe2_poeProfiles', profiles))
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
    if (!profileName) {
        getElement('profileName').value = '';
        return;
    }
    if (!profiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        // 完全リセット
        resetAll();
        const profile = profiles[profileName];
        applyPoe2MapProfileSettings(profile.settings);
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
        getElement('profileName').value = profileName;
        saveModCheckboxState();
        updateModList();
        updateCombinedRegex();
        ['change', 'input'].forEach(event => {
            getElement('mapTierCheckbox')?.dispatchEvent(new Event(event));
            getElement('ngModCheckbox').dispatchEvent(new Event(event));
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
        if (!writeStoredJson('poe2_poeProfiles', profiles))
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
        'reviveInput',
        'waystoneInput',
        'effectivenessInput',
        'mapMonsterRarityInput',
        'rareMonsterInput',
        'magicMonsterInput'
    ];
    for (const id of inputs) {
        const el = getElement(id);
        if (!el)
            continue;
        const value = el.value;
        if (value === '')
            continue;
        if (isNaN(Number(value)) || Number(value) < 0) {
            alert(`${id.replace('Input', '')} には0以上の数値を入力してください`);
            getElement(id).focus();
            return false;
        }
        if (id === 'reviveInput' && Number(value) > 9) {
            alert('復活 には0〜9の数値を入力してください');
            getElement(id).focus();
            return false;
        }
    }
    return true;
}
// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
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
});
function loadProfiles() {
    const saved = readStoredText('poe2_poeProfiles');
    if (saved) {
        try {
            profiles = readStoredJson('poe2_poeProfiles');
            updateProfileList();
        }
        catch (e) {
            console.error('プロファイルの読み込みエラー:', e);
            profiles = {};
        }
    }
}
function getConvertTarget() {
    return document.querySelector('input[name="convertTarget"]:checked')?.value || 'waystone';
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
    if (output)
        output.textContent = '';
    const detailsList = getElement('detailsList');
    if (detailsList)
        detailsList.innerHTML = '';
}
function applyConvertedMods() {
    if (getConvertTarget() === 'tablet') {
        applyConvertedToTabletMods();
    }
    else {
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
    if (typeof updateTabletModList === 'function')
        updateTabletModList();
    if (typeof updateTabletCombinedRegex === 'function')
        updateTabletCombinedRegex();
    if (typeof saveTabletState === 'function')
        saveTabletState();
    showNotification(`変換結果を石板の${matchedMods.length}個のModに適用しました`);
}
function findModsFromJpRegex(jpRegex, sourceList) {
    const matchedMods = new Set();
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
// 実際に使うリーグ名を取得する
function getLeagueName() {
    const select = getElement('leagueSelect');
    if (select.value === '__custom__') {
        return getElement('leagueInput').value.trim() || 'Mirage';
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
    const mapTierMin = getElement('mapTierMinInput').value;
    const mapTierMax = getElement('mapTierMaxInput').value;
    const buyoutPrice = getElement('buyoutPriceSelect').value;
    const buyoutPriceMin = getElement('buyoutPriceMinInput').value;
    const buyoutPriceMax = getElement('buyoutPriceMaxInput').value;
    const wantedMode = getElement('wantedModModeSelect').value;
    const deliriumMin = getElement('deliriumMinInput')?.value || '';
    const deliriumMax = getElement('deliriumMaxInput')?.value || '';
    writeStoredText('poe2_poeTradeLeague', String(league));
    writeStoredText('poe2_poeTradeLeagueIsCustom', String(leagueIsCustom));
    writeStoredText('poe2_poeTradeMethod', String(method));
    writeStoredText('poe2_poeTradeMinModCount', String(minModCount));
    writeStoredText('poe2_poeTradeMaxModCount', String(maxModCount));
    writeStoredText('poe2_poeTradeCorruptedStatus', String(corruptedStatus));
    writeStoredText('poe2_poeTradeMapTierMin', String(mapTierMin));
    writeStoredText('poe2_poeTradeMapTierMax', String(mapTierMax));
    writeStoredText('poe2_poeTradeBuyoutPrice', String(buyoutPrice));
    writeStoredText('poe2_poeTradeBuyoutPriceMin', String(buyoutPriceMin));
    writeStoredText('poe2_poeTradeBuyoutPriceMax', String(buyoutPriceMax));
    writeStoredText('poe2_poeTradeWantedMode', String(wantedMode));
    writeStoredText('poe2_poeTradeDeliriumMin', String(deliriumMin));
    writeStoredText('poe2_poeTradeDeliriumMax', String(deliriumMax));
}
function loadTradeSettings() {
    const league = readStoredText('poe2_poeTradeLeague') || "Fate of the Vaal";
    const leagueIsCustom = readStoredText('poe2_poeTradeLeagueIsCustom') === 'true';
    let method = readStoredText('poe2_poeTradeMethod');
    if (method === null)
        method = "securable";
    let minModCount = readStoredText('poe2_poeTradeMinModCount');
    if (minModCount === null)
        minModCount = "6";
    let maxModCount = readStoredText('poe2_poeTradeMaxModCount');
    if (maxModCount === null)
        maxModCount = "6";
    let corruptedStatus = readStoredText('poe2_poeTradeCorruptedStatus');
    if (corruptedStatus === null)
        corruptedStatus = "";
    const mapTierMin = readStoredText('poe2_poeTradeMapTierMin') || "16";
    const mapTierMax = readStoredText('poe2_poeTradeMapTierMax') || "16";
    let buyoutPrice = readStoredText('poe2_poeTradeBuyoutPrice');
    if (buyoutPrice === null)
        buyoutPrice = "";
    const buyoutPriceMin = readStoredText('poe2_poeTradeBuyoutPriceMin') || "";
    const buyoutPriceMax = readStoredText('poe2_poeTradeBuyoutPriceMax') || "";
    const wantedMode = readStoredText('poe2_poeTradeWantedMode') || "any";
    const deliriumMin = readStoredText('poe2_poeTradeDeliriumMin') || "";
    const deliriumMax = readStoredText('poe2_poeTradeDeliriumMax') || "";
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
    getElement('mapTierMinInput').value = mapTierMin;
    getElement('mapTierMaxInput').value = mapTierMax;
    getElement('buyoutPriceSelect').value = buyoutPrice;
    getElement('buyoutPriceMinInput').value = buyoutPriceMin;
    getElement('buyoutPriceMaxInput').value = buyoutPriceMax;
    getElement('wantedModModeSelect').value = wantedMode;
    const deliriumMinInput = getElement('deliriumMinInput');
    const deliriumMaxInput = getElement('deliriumMaxInput');
    if (deliriumMinInput)
        deliriumMinInput.value = deliriumMin;
    if (deliriumMaxInput)
        deliriumMaxInput.value = deliriumMax;
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
const FEEDBACK_DEFAULT_GAME = "PoE2";
const FEEDBACK_DEFAULT_PRODUCT = "Regex(サイト)";
let isFeedbackSubmitting = false;
// モーダルの外側をクリックして閉じる
window.onclick = function (event) {
    const feedbackModal = getElement('feedbackModal');
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    }
};
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
// tablet_mods.js が先に読み込まれている必要がある
// tabletModList は tablet_mods.js で定義済み
let tabletCheckedMods = new Set(); // 選択されたModのキー（modテキスト）
let tabletProfiles = {};
function formatTabletModText(text, value) {
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
function updateTabletModList() {
    const listDiv = getElement('TabletModList');
    if (!listDiv)
        return;
    // 初回のみソートオプションを初期化
    const sortSelect = getElement('tabletSortSelect');
    if (sortSelect && sortSelect.options.length <= 4) { // デフォルト、Pre、Suf、League の4つの初期状態
        const categories = new Set();
        Object.values(tabletModList).forEach(m => {
            if (m.subGroups)
                m.subGroups.forEach(g => categories.add(g));
        });
        // カテゴリー順オプションを消して個別のカテゴリーを追加
        const leagueOpt = Array.from(sortSelect.options).find(o => o.value === 'league');
        if (leagueOpt)
            leagueOpt.remove();
        // カテゴリーを五十音順に追加
        Array.from(categories).sort().forEach(cat => {
            if (cat === 'Map')
                return; // Mapは一般的すぎるので除外
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
            if (mod.subGroups && mod.subGroups.includes(targetCat))
                return 0;
        }
        switch (tabletSortMode) {
            case 'prefix':
                if (mod.type === 'Prefix')
                    return 0;
                break;
            case 'suffix':
                if (mod.type === 'Suffix')
                    return 0;
                break;
            case 'league':
                if (mod.subGroups && mod.subGroups.length > 0 && mod.subGroups[0] !== 'Map')
                    return 0;
                break;
        }
        // デフォルトの並び
        if (mod.type === 'Prefix')
            return 1;
        if (mod.type === 'Suffix')
            return 2;
        return 3;
    };
    // 選択中のものを上に、それ以外をタイプ別にソート
    const sortedKeys = Object.keys(tabletModList)
        .filter(key => tabletModList[key].type !== 'Unique')
        .sort((a, b) => {
        const aChecked = tabletCheckedMods.has(a);
        const bChecked = tabletCheckedMods.has(b);
        if (aChecked && !bChecked)
            return -1;
        if (!aChecked && bChecked)
            return 1;
        const aWeight = getTypeWeight(a);
        const bWeight = getTypeWeight(b);
        if (aWeight !== bWeight)
            return aWeight - bWeight;
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
        const rawText = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en')
            ? (value.engMod || value.mod)
            : value.mod;
        textSpan.textContent = formatTabletModText(rawText, value.value);
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
        // バッジ表示順: Prefix > Suffix > others
        // 1. Prefix
        if (value.type === 'Prefix') {
            const prefixBadge = document.createElement('span');
            prefixBadge.classList.add('badge');
            prefixBadge.style.backgroundColor = 'var(--accent-red)';
            prefixBadge.textContent = 'Prefix';
            badgeContainer.appendChild(prefixBadge);
        }
        // 2. Suffix
        if (value.type === 'Suffix') {
            const suffixBadge = document.createElement('span');
            suffixBadge.classList.add('badge');
            suffixBadge.style.backgroundColor = 'var(--accent-blue)';
            suffixBadge.textContent = 'Suffix';
            badgeContainer.appendChild(suffixBadge);
        }
        // 3. Mechanic (SubGroups)
        if (value.subGroups) {
            value.subGroups.forEach(cat => {
                const exists = Array.from(badgeContainer.children).some(b => b.textContent === cat);
                if (!exists) {
                    const badge = document.createElement('span');
                    badge.classList.add('badge');
                    badge.style.backgroundColor = colorMap[cat] || '#555';
                    if (cat === 'Tower')
                        badge.style.color = '#000';
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
            }
            else {
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
        const useEnglish = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        const reg = useEnglish
            ? (modData.engRegex || modData.Regex || (modData.engMod || modData.mod).split('|')[0].substring(0, 8))
            : (modData.Regex || modData.mod.split('|')[0].substring(0, 8));
        results.push(reg);
    });
    const combined = results.length > 0 ? `"${results.join('|')}"` : '';
    const outputElem = getElement('tabletRegexOutput');
    if (outputElem)
        outputElem.textContent = combined;
    const charCount = combined.length;
    const charCountElement = getElement('tabletCharCount');
    if (charCountElement) {
        charCountElement.textContent = `文字数: ${charCount}`;
        if (charCount > POE2_REGEX_CHAR_LIMIT) {
            charCountElement.style.color = 'red';
            charCountElement.textContent += ` (${POE2_REGEX_CHAR_LIMIT}文字を超えています)`;
        }
        else {
            charCountElement.style.color = '';
        }
    }
}
function filterTabletEffects() {
    const searchInput = getElement('tabletSearch');
    if (!searchInput)
        return;
    const term = searchInput.value.toLowerCase();
    const items = document.querySelectorAll('#TabletModList .effect-item');
    items.forEach(item => {
        // 全体のテキスト（モッド文 + バッジテキスト）を検索対象にする
        const text = item.textContent.toLowerCase();
        if (text.includes(term)) {
            item.classList.remove('hidden');
        }
        else {
            item.classList.add('hidden');
        }
    });
}
function copyTabletToClipboard() {
    const outputElem = getElement('tabletRegexOutput');
    if (!outputElem)
        return;
    const text = outputElem.textContent;
    if (!text)
        return;
    navigator.clipboard.writeText(text).then(() => {
        showNotification ? showNotification('コピーしました！') : alert('コピーしました！');
    });
}
function resetTabletAll() {
    tabletCheckedMods.clear();
    const searchInput = getElement('tabletSearch');
    if (searchInput)
        searchInput.value = '';
    updateTabletModList();
    updateTabletCombinedRegex();
    saveTabletState();
}
function saveTabletState() {
    writeStoredJson('poe2_tablet_checked_v2', [...tabletCheckedMods]);
}
function loadTabletState() {
    const saved = readStoredText('poe2_tablet_checked_v2');
    if (saved) {
        const keys = readStoredJson('poe2_tablet_checked_v2');
        keys.forEach(k => {
            if (tabletModList[k])
                tabletCheckedMods.add(k);
        });
    }
}
function applyTabletMods(mods) {
    tabletCheckedMods.clear();
    (mods || []).forEach(key => {
        if (tabletModList[key])
            tabletCheckedMods.add(key);
    });
    updateTabletModList();
    updateTabletCombinedRegex();
    saveTabletState();
}
function saveTabletProfile() {
    const profileName = getElement('tabletProfileName')?.value.trim();
    if (!profileName) {
        showNotification('プロファイル名を入力してください', true);
        return;
    }
    if (tabletProfiles[profileName] && !confirm(`${profileName} は既に存在します。上書きしますか?`)) {
        return;
    }
    tabletProfiles[profileName] = {
        mods: Array.from(tabletCheckedMods),
        timestamp: Date.now()
    };
    if (!writeStoredJson('poe2_tabletProfiles', tabletProfiles))
        return false;
    updateTabletProfileList();
    showNotification(`"${profileName}" を保存しました`);
    getElement('tabletProfileName').value = '';
    if (typeof updateSavedRegexDisplay === 'function') {
        updateSavedRegexDisplay();
    }
}
function loadTabletProfile() {
    const profileName = getElement('tabletProfileList')?.value;
    if (!profileName) {
        getElement('tabletProfileName').value = '';
        return;
    }
    if (!tabletProfiles[profileName]) {
        showNotification('プロファイルを選択してください', true);
        return;
    }
    try {
        applyTabletMods(tabletProfiles[profileName].mods);
        getElement('tabletProfileName').value = profileName;
        showNotification(`"${profileName}" を読み込みました`);
    }
    catch (error) {
        console.error('石板プロファイル読み込みエラー:', error);
        showNotification('プロファイルの読み込みに失敗しました', true);
    }
}
function deleteTabletProfile() {
    const profileName = getElement('tabletProfileList')?.value;
    if (!profileName || !tabletProfiles[profileName]) {
        showNotification('削除するプロファイルを選択してください', true);
        return;
    }
    if (confirm(`本当に "${profileName}" を削除しますか?`)) {
        delete tabletProfiles[profileName];
        if (!writeStoredJson('poe2_tabletProfiles', tabletProfiles))
            return false;
        updateTabletProfileList();
        getElement('tabletProfileName').value = '';
        showNotification(`"${profileName}" を削除しました`);
        if (typeof updateSavedRegexDisplay === 'function') {
            updateSavedRegexDisplay();
        }
    }
}
function updateTabletProfileList() {
    const select = getElement('tabletProfileList');
    if (!select)
        return;
    select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
    Object.keys(tabletProfiles).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}
function loadTabletProfileDirectly(profileName) {
    const profile = tabletProfiles[profileName];
    if (!profile) {
        showNotification('プロファイルが見つかりません', true);
        return;
    }
    applyTabletMods(profile.mods);
    const profileNameInput = getElement('tabletProfileName');
    const profileList = getElement('tabletProfileList');
    if (profileNameInput)
        profileNameInput.value = profileName;
    if (profileList)
        profileList.value = profileName;
    showNotification(`"${profileName}" を読み込みました`);
}
function generateTabletRegexFromProfile(profile) {
    const mods = profile?.mods || [];
    const results = mods.map(key => {
        const modData = tabletModList[key];
        if (!modData)
            return null;
        return modData.Regex || modData.mod.split('|')[0].substring(0, 8);
    }).filter(Boolean);
    return results.length > 0 ? `"${results.join('|')}"` : '(空のRegex)';
}
function initializeTabletProfiles() {
    const savedProfiles = readStoredText('poe2_tabletProfiles');
    if (savedProfiles) {
        try {
            tabletProfiles = readStoredJson('poe2_tabletProfiles');
            updateTabletProfileList();
        }
        catch (e) {
            console.error('石板プロファイル読み込みエラー:', e);
            tabletProfiles = {};
        }
    }
    const profileList = getElement('tabletProfileList');
    if (profileList && !profileList.hasEventListener) {
        profileList.addEventListener('change', function () {
            if (this.value)
                loadTabletProfile();
            else
                getElement('tabletProfileName').value = '';
        });
        profileList.hasEventListener = true;
    }
}
function syncTabletProfiles(profiles) {
    tabletProfiles = profiles;
    updateTabletProfileList();
}
window.saveTabletProfile = saveTabletProfile;
window.loadTabletProfile = loadTabletProfile;
window.deleteTabletProfile = deleteTabletProfile;
window.loadTabletProfileDirectly = loadTabletProfileDirectly;
window.generateTabletRegexFromProfile = generateTabletRegexFromProfile;
window.syncTabletProfiles = syncTabletProfiles;
// 初期化
// 注意: scripts.js と共存するため、重複して window.onload 等を使わないよう検討
// ここでは poe2.html から直接初期化関数として呼び出すか、DOMContentLoaded を使う
window.addEventListener('DOMContentLoaded', () => {
    // ページ内に Tablet 用の要素がある場合のみ初期化
    if (getElement('tabletContent')) {
        initializeTabletProfiles();
        loadTabletState();
        updateTabletModList();
        updateTabletCombinedRegex();
    }
});
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
            // { key: 'claw', label: '鉤爪', regex: ': 鉤爪' },
            // { key: 'dagger', label: '短剣', regex: ': 短剣' },
            { key: 'wand', label: 'ワンド', regex: ': ワンド' },
            // { key: 'oneHandSword', label: '片手剣', regex: ': 片手剣' },
            // { key: 'oneHandAxe', label: '片手斧', regex: ': 片手斧' },
            { key: 'oneHandMace', label: '片手メイス', regex: ': 片手メ' },
            { key: 'sceptre', label: 'セプター', regex: ': セプター' },
            { key: 'spear', label: 'スピア', regex: ': スピア' },
            // { key: 'flail', label: 'フレイル', regex: ': フレイル' },
        ]
    },
    {
        name: '両手武器',
        items: [
            { key: 'bow', label: '弓', regex: ': 弓' },
            { key: 'staff', label: 'スタッフ', regex: ': スタッ' },
            // { key: 'twoHandSword', label: '両手剣', regex: ': 両手剣' },
            // { key: 'twoHandAxe', label: '両手斧', regex: ': 両手斧' },
            { key: 'twoHandMace', label: '両手メイス', regex: ': 両手メ' },
            { key: 'quarterstaff', label: 'クォータースタッフ', regex: ': クォー' },
            // { key: 'fishingRod', label: '釣り竿', regex: ': 釣り竿' },
            { key: 'crossbow', label: 'クロスボウ', regex: ': クロス' },
            { key: 'talisman', label: 'タリスマン', regex: ': タリス' },
        ]
    },
    {
        name: 'オフハンド',
        items: [
            { key: 'quiver', label: '矢筒', regex: ': 矢筒' },
            // { key: 'shield', label: '盾', regex: ': 盾' },
            { key: 'buckler', label: 'バックラー', regex: ': バック' },
            { key: 'focus', label: 'フォーカス', regex: ': フォー' },
        ]
    },
];
const WEAPON_OPTIONS = WEAPON_GROUPS.flatMap(group => group.items);
const weaponMapping = Object.fromEntries(WEAPON_OPTIONS.map(({ key, label, regex }) => [key, regex]));
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
const MOVEMENT_SPEED_PCTS = [10, 15, 20, 25, 30];
function buildMovementSpeedRegex(pct) {
    return `移動ス.*${pct}%増`;
}
function createMovementSpeedItems() {
    const items = [
        { id: 'move_all', label: 'ALL', regex: '移動スピ' },
    ];
    for (const pct of MOVEMENT_SPEED_PCTS) {
        items.push({
            id: `move_${pct}`,
            label: `${pct}%`,
            regex: buildMovementSpeedRegex(pct),
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
            { id: 'common_all_attributes', label: '全ての能力値 ', regex: '能力値 +' },
            { id: 'common_max_life', label: '最大ライフ', regex: '大ライ' },
            { id: 'common_resist', label: '耐性', regex: '耐性' },
            { id: 'common_spirit', label: 'スピリット', regex: 'リット +' },
        ]
    },
    {
        name: 'ダメージMOD',
        items: [
            { id: 'build_phys_pct', label: '物理ダメージが#%増加する', regex: '理ダ.*増' },
            { id: 'build_fire_pct', label: '火ダメージが#%増加する', regex: '火ダ.*増' },
            { id: 'build_cold_pct', label: '冷気ダメージが#%増加する', regex: '気ダ.*増' },
            { id: 'build_lightning_pct', label: '雷ダメージが#%増加する', regex: '雷ダ.*増' },
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
            { id: 'build_spell_level', label: '全てのスペルスキル+', regex: 'のスペルス' },
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
// 複数選択時に (火|理).*… の形式へまとめる設定
const VENDOR_REGEX_MERGE_CONFIG = [
    {
        suffix: ' +',
        items: {
            common_str: '筋力',
            common_dex: '器用さ',
            common_int: '知性',
            common_all_attributes: '能力値',
            common_spirit: 'リット',
        },
        alwaysIncludePrefixes: ['能力値'],
        alwaysIncludeWhenAny: ['common_str', 'common_dex', 'common_int'],
    },
    {
        suffix: 'ダ.*増',
        items: {
            build_phys_pct: '理',
            build_fire_pct: '火',
            build_cold_pct: '気',
            build_lightning_pct: '雷',
        },
    },
    {
        suffix: '.*ジを追',
        items: {
            build_phys_add: '理',
            build_fire_add: '火',
            build_cold_add: '気',
            build_lightning_add: '雷',
        },
    },
    {
        suffix: 'ダ.*をア',
        items: {
            build_phys_attack_add: '理',
            build_fire_attack_add: '火',
            build_cold_attack_add: '気',
            build_lightning_attack_add: '雷',
        },
    },
    {
        prefixLiteral: 'の',
        suffix: 'スペ',
        items: {
            build_fire_spell: '火',
            build_cold_spell: '冷気',
            build_lightning_spell: '雷',
            build_chaos_spell: '混沌',
            build_physical_spell: '物理',
        },
    },
    {
        prefixLiteral: 'の',
        suffix: 'ス',
        items: {
            build_melee_level: '近接',
            build_projectile_level: '投射物',
        },
    },
    {
        prefixLiteral: '移動ス.*',
        suffix: '増',
        items: Object.fromEntries(MOVEMENT_SPEED_PCTS.map(pct => [`move_${pct}`, `${pct}%`])),
    },
];
function sortAlternationPrefixes(prefixes) {
    return [...prefixes].sort((a, b) => b.length - a.length);
}
function buildMergedRegexPart(prefixes, mergeConfig) {
    const ordered = sortAlternationPrefixes(prefixes);
    const alternation = ordered.join('|');
    if (mergeConfig.prefixLiteral) {
        return `${mergeConfig.prefixLiteral}(${alternation})${mergeConfig.suffix}`;
    }
    return `(${alternation})${mergeConfig.suffix}`;
}
function applyAlwaysIncludePrefixes(activePrefixes, mergeConfig, selectedIds) {
    const extras = mergeConfig.alwaysIncludePrefixes;
    const triggers = mergeConfig.alwaysIncludeWhenAny;
    if (!extras?.length || !triggers?.some(id => selectedIds.has(id))) {
        return activePrefixes;
    }
    const merged = [...activePrefixes];
    extras.forEach(prefix => {
        if (!merged.includes(prefix))
            merged.push(prefix);
    });
    return merged;
}
function buildOptimizedVendorRegexParts(settings = vendorSettings) {
    const selectedItems = getSelectedItems(settings);
    const selectedIds = new Set(selectedItems.map(item => item.id));
    const usedIds = new Set();
    const parts = [];
    VENDOR_REGEX_MERGE_CONFIG.forEach(mergeConfig => {
        let activePrefixes = Object.entries(mergeConfig.items)
            .filter(([id]) => selectedIds.has(id))
            .map(([, prefix]) => prefix);
        if (activePrefixes.length >= 2) {
            activePrefixes = applyAlwaysIncludePrefixes(activePrefixes, mergeConfig, selectedIds);
            parts.push(buildMergedRegexPart(activePrefixes, mergeConfig));
            Object.keys(mergeConfig.items).forEach(id => {
                if (selectedIds.has(id))
                    usedIds.add(id);
            });
        }
    });
    selectedItems.forEach(item => {
        if (!usedIds.has(item.id)) {
            parts.push(getItemRegexPart(item));
        }
    });
    return parts;
}
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
    const parts = buildOptimizedVendorRegexParts(settings);
    const weapons = [];
    Object.entries(settings.weapon || {}).forEach(([key, value]) => {
        if (value && weaponMapping[key])
            weapons.push(weaponMapping[key]);
    });
    if (weapons.length > 0)
        parts.push(weapons.join('|'));
    const mainRegex = parts.join('|');
    const excludeWeapons = [];
    Object.entries(settings.excludeWeapons || {}).forEach(([key, value]) => {
        if (value && weaponMapping[key])
            excludeWeapons.push(weaponMapping[key]);
    });
    if (mainRegex && excludeWeapons.length > 0) {
        return `"${mainRegex}" "!.*(?:${excludeWeapons.join('|')})"`;
    }
    if (mainRegex)
        return `"${mainRegex}"`;
    if (excludeWeapons.length > 0)
        return `"!.*(?:${excludeWeapons.join('|')})"`;
    return '';
}
function updateVendorCharCount() {
    const result = getElement('vendorRegexOutput')?.textContent || '';
    const charCount = result.length;
    const charCountElement = getElement('vendorCharCount');
    if (charCountElement) {
        charCountElement.textContent = `文字数: ${charCount}`;
        if (charCount > POE2_REGEX_CHAR_LIMIT) {
            charCountElement.style.color = 'red';
            charCountElement.textContent += ` (${POE2_REGEX_CHAR_LIMIT}文字を超えています)`;
        }
        else {
            charCountElement.style.color = '';
        }
    }
}
function copyVendorRegex() {
    const regex = getElement('vendorRegexOutput')?.textContent || '';
    if (regex) {
        navigator.clipboard.writeText(regex)
            .then(() => showNotification('コピーしました！'))
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
    vendorSettings = {
        selected: {},
        ...createDefaultWeaponSettings()
    };
    document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    updateVendorRegex();
    removeStoredValue('poe2_vendorSettings');
    showNotification('ベンダー設定をリセットしました');
}
function saveVendorSettings() {
    writeStoredJson('poe2_vendorSettings', vendorSettings);
}
function loadVendorSettings() {
    const saved = readStoredText('poe2_vendorSettings');
    if (!saved)
        return;
    try {
        const parsed = readStoredJson('poe2_vendorSettings');
        const defaults = createDefaultWeaponSettings();
        vendorSettings = {
            selected: parsed.selected || {},
            weapon: { ...defaults.weapon, ...parsed.weapon },
            excludeWeapons: { ...defaults.excludeWeapons, ...parsed.excludeWeapons }
        };
        applyVendorSettings();
    }
    catch (e) {
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
        }
        else if (id.startsWith('exclude-')) {
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
    }
    else {
        const id = checkbox.id.replace('vendor-', '');
        if (id.startsWith('weapon-')) {
            vendorSettings.weapon[id.replace('weapon-', '')] = checkbox.checked;
        }
        else if (id.startsWith('exclude-')) {
            vendorSettings.excludeWeapons[id.replace('exclude-', '')] = checkbox.checked;
        }
    }
    updateVendorRegex();
}
function setupVendorEventListeners() {
    document.querySelectorAll('#vendorContent input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.hasEventListener)
            return;
        checkbox.addEventListener('change', function () {
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
    }
    else {
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
    if (!group)
        return null;
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
    }
    else {
        group.items.forEach(item => {
            section.appendChild(createVendorCheckboxRow(item.label, createVendorItemCheckbox(item)));
        });
    }
    return section;
}
function buildVendorGroupsUI() {
    const container = getElement('vendorGroupsContainer');
    if (!container)
        return;
    container.innerHTML = '';
    const columnsWrapper = document.createElement('div');
    columnsWrapper.className = 'three-columns';
    VENDOR_COLUMNS.forEach(column => {
        const columnEl = document.createElement('div');
        if (column.className)
            columnEl.className = column.className;
        column.groupNames.forEach((groupName, index) => {
            const section = buildCategorySection(groupName, index === 0);
            if (section)
                columnEl.appendChild(section);
        });
        columnsWrapper.appendChild(columnEl);
    });
    container.appendChild(columnsWrapper);
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
    vendorProfiles[profileName] = {
        settings: JSON.parse(JSON.stringify(vendorSettings)),
        timestamp: Date.now()
    };
    if (!writeStoredJson('poe2_vendorProfiles', vendorProfiles))
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
    if (!profileName) {
        getElement('vendorProfileName').value = '';
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
        if (!writeStoredJson('poe2_vendorProfiles', vendorProfiles))
            return false;
        updateVendorProfileList();
        getElement('vendorProfileName').value = '';
        showNotification(`"${profileName}" を削除しました`);
        if (typeof updateSavedRegexDisplay === 'function') {
            updateSavedRegexDisplay();
        }
    }
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
        const profileNameInput = getElement('vendorProfileName');
        const profileList = getElement('vendorProfileList');
        if (profileNameInput)
            profileNameInput.value = profileName;
        if (profileList)
            profileList.value = profileName;
        showNotification(`"${profileName}" を読み込みました`);
    });
}
function generateVendorRegexFromProfile(profile) {
    if (!profile || !profile.settings)
        return '(無効なプロファイル)';
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
    }
    catch (error) {
        console.error('Error generating vendor regex from profile:', error);
        return '(エラー: Regex生成失敗)';
    }
    finally {
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
        const savedProfiles = readStoredText('poe2_vendorProfiles');
        if (savedProfiles) {
            try {
                vendorProfiles = readStoredJson('poe2_vendorProfiles');
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
                if (this.value)
                    loadVendorProfile();
                else
                    getElement('vendorProfileName').value = '';
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
document.addEventListener('DOMContentLoaded', function () {
    const vendorTab = document.querySelector('a[data-tab="vendorContent"]');
    if (vendorTab && !vendorTab.hasEventListener) {
        vendorTab.addEventListener('click', function () {
            setTimeout(handleVendorTabActivation, 100);
        });
        vendorTab.hasEventListener = true;
    }
    const vendorContentElem = getElement('vendorContent');
    if (window.location.hash === '#vendor' ||
        (vendorContentElem && vendorContentElem.style.display === 'block')) {
        setTimeout(handleVendorTabActivation, 200);
    }
    if (!window.vendorHashChangeHandler) {
        window.vendorHashChangeHandler = function () {
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
let isDragging = false;
let dragStartIndex = -1;
let dragEndIndex = -1;
let filterControlsAdded = false;
const POE2_PROFILE_STORAGE_KEYS = {
    map: 'poe2_poeProfiles',
    vendor: 'poe2_vendorProfiles',
    tablet: 'poe2_tabletProfiles',
};
function getPoe2StorageKey(type) {
    return POE2_PROFILE_STORAGE_KEYS[type] || null;
}
function saveFilterState() {
    const filterState = {
        searchTerm: getElement('savedRegexSearch').value,
        typeFilter: getElement('typeFilter').value,
        sortFilter: getElement('sortFilter').value
    };
    writeStoredJson('poe2_savedRegexFilterState', filterState);
}
function loadFilterState() {
    const saved = readStoredText('poe2_savedRegexFilterState');
    if (saved) {
        try {
            const filterState = readStoredJson('poe2_savedRegexFilterState');
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
    Object.entries(POE2_PROFILE_STORAGE_KEYS).forEach(([type, storageKey]) => {
        const profiles = readStoredJson(storageKey);
        const tabIdMap = { map: 'mapContent', vendor: 'vendorContent', tablet: 'tabletContent' };
        const tabId = tabIdMap[type] || `${type}Content`;
        Object.entries(profiles).forEach(([name, profile]) => {
            allProfiles.push({ name, profile, type, tabId, timestamp: profile.timestamp || 0 });
        });
    });
    return allProfiles;
}
const typeConfig = {
    map: { label: 'マップ', color: '#E74C3C', icon: '' },
    vendor: { label: 'ベンダー', color: '#F39C12', icon: '' },
    tablet: { label: '石板', color: '#3498DB', icon: '' },
};
function generateRegexFromProfile(profile, type) {
    if (type === 'map') {
        return generateMapRegexFromProfile(profile);
    }
    if (type === 'vendor') {
        if (typeof window.generateVendorRegexFromProfile === 'function') {
            const regex = window.generateVendorRegexFromProfile(profile);
            return regex || '(空のRegex)';
        }
        return '(エラー: vendor.jsが読み込まれていません)';
    }
    if (type === 'tablet') {
        if (typeof window.generateTabletRegexFromProfile === 'function') {
            const regex = window.generateTabletRegexFromProfile(profile);
            return regex || '(空のRegex)';
        }
        return '(エラー: tablet_scripts.jsが読み込まれていません)';
    }
    return '(不明なタイプ)';
}
function generateMapRegexFromProfile(profile) {
    const originalCheckedMods = new Map(checkedMods);
    const originalSettings = getPoe2MapProfileSettings();
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
        applyPoe2MapProfileSettings(profile.settings || {});
        updateCombinedRegex();
        const regex = getElement('combinedRegexOutput').textContent;
        return regex || '(空のRegex)';
    }
    finally {
        checkedMods.clear();
        originalCheckedMods.forEach((state, mod) => checkedMods.set(mod, state));
        applyPoe2MapProfileSettings(originalSettings);
        updateCombinedRegex();
    }
}
function calcMapModTotals(profile) {
    // profile.modsからmapModListを参照して合計値を計算
    let totalQuantity = 0, totalPackSize = 0, totalRarity = 0, totalRareMonster = 0, totalMagicMonster = 0, totalWaystone = 0;
    if (!profile.mods)
        return { totalQuantity, totalPackSize, totalRarity, totalRareMonster, totalMagicMonster, totalWaystone };
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
        totalPackSize += Number(mod['map_pack_size_+%'] || 0);
        totalQuantity += Number(mod['map_item_drop_quantity_+%'] || 0);
        totalRarity += Number(mod['map_item_drop_rarity_+%'] || 0);
        // レア/マジックモンスターのキー
        totalRareMonster += Number(mod['map_number_of_rare_packs_+%'] || 0);
        totalMagicMonster += Number(mod['map_number_of_magic_packs_+%'] || 0);
        totalWaystone += Number(mod['map_map_item_drop_chance_+%'] || mod['map_map_item_drop_chance_+%_final_from_uber_mod'] || 0);
    });
    return { totalQuantity, totalPackSize, totalRarity, totalRareMonster, totalMagicMonster, totalWaystone };
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
        card.dataset.totalRareMonster = settings.rareMonster || 0;
        card.dataset.totalMagicMonster = settings.magicMonster || 0;
        card.dataset.totalWaystone = settings.waystone || 0;
    }
    else {
        card.dataset.totalQuantity = '0';
        card.dataset.totalPackSize = '0';
        card.dataset.totalRarity = '0';
        card.dataset.totalRareMonster = '0';
        card.dataset.totalMagicMonster = '0';
        card.dataset.totalWaystone = '0';
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
            { label: isEn ? 'Waystone' : 'ウェイス', value: settings.waystone, color: '#4264a5' },
            { label: isEn ? 'Delirium' : 'デリ', value: settings.delirium, color: '#607d8b' },
            { label: isEn ? 'Rare Mon' : 'レアモン', value: settings.rareMonster, color: '#a542a5' },
            { label: isEn ? 'Magic Mon' : 'マジモン', value: settings.magicMonster, color: '#a5a542' }
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
    else if (type === 'vendor') {
        const settings = profile.settings || {};
        const selected = settings.selected || {};
        const selectedIds = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
        if (selectedIds.length > 0) {
            const labels = selectedIds
                .slice(0, 2)
                .map(id => (typeof window.getVendorItemLabel === 'function' ? window.getVendorItemLabel(id) : id));
            let summary = labels.join(', ');
            if (selectedIds.length > 2)
                summary += ` ...他${selectedIds.length - 2}個`;
            parts.push(summary);
        }
        const weaponCount = Object.values(settings.weapon || {}).filter(Boolean).length;
        if (weaponCount > 0)
            parts.push(`${weaponCount}武器`);
        const excludeCount = Object.values(settings.excludeWeapons || {}).filter(Boolean).length;
        if (excludeCount > 0)
            parts.push(`NG${excludeCount}武器`);
    }
    else if (type === 'tablet') {
        const modCount = (profile.mods || []).length;
        if (modCount > 0)
            parts.push(`${modCount}個のMod`);
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
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Quantity' : '数量', settings.itemQuantity, '#a54242'));
        if (settings.packSize > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Pack' : 'パック', settings.packSize, '#42a5a5'));
        if (settings.rarity > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Rarity' : 'レア', settings.rarity, '#a58242'));
        if (settings.rareMonster > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Rare Mon' : 'レアモン', settings.rareMonster, '#a542a5'));
        if (settings.magicMonster > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Magic Mon' : 'マジモン', settings.magicMonster, '#a5a542'));
        if (settings.waystone > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Waystone' : 'ウェイス', settings.waystone, '#4264a5'));
        if (settings.delirium > 0)
            summaryRow.appendChild(makeSummaryBadge(isEn ? 'Delirium' : 'デリリウム', settings.delirium, '#607d8b'));
        if (summaryRow.childNodes.length > 0) {
            container.appendChild(summaryRow);
        }
        if (Object.keys(settings).length > 0) {
            const settingsDiv = document.createElement('div');
            settingsDiv.style.cssText = 'margin-bottom: 12px;';
            const rows = [];
            if (settings.itemQuantity)
                rows.push(createDetailRow(isEn ? 'Min Quantity' : '数量', `${settings.itemQuantity}%`));
            if (settings.packSize)
                rows.push(createDetailRow(isEn ? 'Min Pack' : 'パックサイズ', `${settings.packSize}%`));
            if (settings.rarity)
                rows.push(createDetailRow(isEn ? 'Min Rarity' : 'レアリティ', `${settings.rarity}%`));
            if (settings.rareMonster)
                rows.push(createDetailRow(isEn ? 'Min Rare' : 'レアモンスター', `${settings.rareMonster}%`));
            if (settings.magicMonster)
                rows.push(createDetailRow(isEn ? 'Min Magic' : 'マジックモンスター', `${settings.magicMonster}%`));
            if (settings.waystone)
                rows.push(createDetailRow(isEn ? 'Min Waystone' : 'ウェイストーン', `${settings.waystone}%`));
            if (settings.delirium)
                rows.push(createDetailRow(isEn ? 'Delirium' : 'デリリウム', `${settings.delirium}%`));
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
    else if (type === 'vendor') {
        const settings = profile.settings || {};
        const selected = settings.selected || {};
        const selectedIds = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
        if (selectedIds.length > 0) {
            const groups = window.VENDOR_GROUPS || [];
            const list = document.createElement('div');
            list.style.cssText = 'display: grid; gap: 4px; margin-bottom: 12px;';
            groups.forEach(group => {
                const groupItems = group.items.filter(item => selected[item.id]);
                if (groupItems.length === 0)
                    return;
                const groupTitle = document.createElement('div');
                groupTitle.textContent = group.name;
                groupTitle.style.cssText = 'color: #AAA; font-size: 0.8em; margin: 8px 0 4px;';
                list.appendChild(groupTitle);
                groupItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.style.cssText = `
            background: #2a2a2a;
            padding: 6px 8px;
            border-radius: 3px;
            border-left: 3px solid #F39C12;
            color: #FFF;
            font-size: 0.8em;
            margin-bottom: 4px;
          `;
                    itemDiv.textContent = item.label;
                    list.appendChild(itemDiv);
                });
            });
            container.appendChild(list);
        }
        const enabledExcludeWeapons = Object.entries(settings.excludeWeapons || {})
            .filter(([, value]) => value)
            .map(([key]) => key);
        if (enabledExcludeWeapons.length > 0) {
            const excludeNames = enabledExcludeWeapons.map(key => typeof window.getWeaponLabel === 'function' ? window.getWeaponLabel(key) : key);
            container.appendChild(createDetailRow('NG武器ベース（除外）', excludeNames.join(', ')));
        }
        const enabledWeapons = Object.entries(settings.weapon || {})
            .filter(([, value]) => value)
            .map(([key]) => key);
        if (enabledWeapons.length > 0) {
            const weaponNames = enabledWeapons.map(key => typeof window.getWeaponLabel === 'function' ? window.getWeaponLabel(key) : key);
            container.appendChild(createDetailRow('武器ベース', weaponNames.join(', ')));
        }
    }
    else if (type === 'tablet') {
        const mods = profile.mods || [];
        if (mods.length > 0) {
            const modList = document.createElement('div');
            modList.style.cssText = 'display: grid; gap: 4px;';
            mods.forEach(modKey => {
                const mod = typeof tabletModList !== 'undefined' ? tabletModList[modKey] : null;
                const modItem = document.createElement('div');
                modItem.style.cssText = `
          background: #2a2a2a;
          padding: 6px 8px;
          border-radius: 3px;
          border-left: 3px solid #3498DB;
          color: #FFF;
          font-size: 0.8em;
        `;
                if (mod) {
                    const primaryText = typeof formatTabletModText === 'function'
                        ? formatTabletModText(mod.mod, mod.value)
                        : mod.mod;
                    modItem.textContent = primaryText;
                }
                else {
                    modItem.textContent = modKey;
                }
                modList.appendChild(modItem);
            });
            container.appendChild(modList);
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
    if (type === 'tablet') {
        setTimeout(() => {
            if (typeof window.loadTabletProfileDirectly === 'function') {
                window.loadTabletProfileDirectly(name);
            }
            else {
                console.error('loadTabletProfileDirectly function not available');
                showNotification('石板モジュールの読み込みに失敗しました', true);
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
    const savedOrder = readStoredText('poe2_savedRegexOrder');
    let order = [];
    if (savedOrder) {
        try {
            order = readStoredJson('poe2_savedRegexOrder');
        }
        catch (e) {
            console.error('並び順の解析エラー:', e);
        }
    }
    order = order.filter(item => !(item.name === profileName && item.type === type));
    order.unshift({ name: profileName, type: type });
    writeStoredJson('poe2_savedRegexOrder', order);
}
function removeProfileFromOrder(profileName, type) {
    const savedOrder = readStoredText('poe2_savedRegexOrder');
    if (!savedOrder)
        return;
    try {
        let order = readStoredJson('poe2_savedRegexOrder');
        order = order.filter(item => !(item.name === profileName && item.type === type));
        writeStoredJson('poe2_savedRegexOrder', order);
    }
    catch (e) {
        console.error('並び順からの削除エラー:', e);
    }
}
function deleteSavedProfile(name, type) {
    if (!confirm(`"${name}" を削除しますか?\nこの操作は元に戻せません。`))
        return;
    const storageKey = getPoe2StorageKey(type);
    if (!storageKey) {
        showNotification('不明なプロファイルタイプです', true);
        return;
    }
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
        else if (type === 'vendor') {
            window.vendorProfiles = profiles;
            if (typeof updateVendorProfileList === 'function')
                updateVendorProfileList();
        }
        else if (type === 'tablet') {
            if (typeof window.syncTabletProfiles === 'function') {
                window.syncTabletProfiles(profiles);
            }
            else if (typeof updateTabletProfileList === 'function') {
                updateTabletProfileList();
            }
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
    <option value="vendor">ベンダー</option>
    <option value="tablet">石板</option>
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
            case 'packsize_desc':
                return Number(b.dataset.totalPackSize || 0) - Number(a.dataset.totalPackSize || 0);
            case 'quantity_desc':
                return Number(b.dataset.totalQuantity || 0) - Number(a.dataset.totalQuantity || 0);
            case 'rarity_desc':
                return Number(b.dataset.totalRarity || 0) - Number(a.dataset.totalRarity || 0);
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
    writeStoredJson('poe2_savedRegexOrder', order);
}
function restoreSortOrder(allProfiles) {
    const savedOrder = readStoredText('poe2_savedRegexOrder');
    if (!savedOrder)
        return allProfiles;
    try {
        const order = readStoredJson('poe2_savedRegexOrder');
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
        removeStoredValue('poe2_savedRegexOrder');
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
                    const profiles = readStoredJson('poe2_poeProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('poe2_poeProfiles', profiles))
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
    const originalVendorSave = window.saveVendorProfile;
    if (originalVendorSave && typeof originalVendorSave === 'function' && !originalVendorSave._hooked) {
        window.saveVendorProfile = function () {
            const profileName = getElement('vendorProfileName')?.value.trim() || '';
            if (originalVendorSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('poe2_vendorProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('poe2_vendorProfiles', profiles))
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
    const originalTabletSave = window.saveTabletProfile;
    if (originalTabletSave && typeof originalTabletSave === 'function' && !originalTabletSave._hooked) {
        window.saveTabletProfile = function () {
            const profileName = getElement('tabletProfileName')?.value.trim() || '';
            if (originalTabletSave.apply(this, arguments) === false)
                return false;
            setTimeout(() => {
                try {
                    const profiles = readStoredJson('poe2_tabletProfiles');
                    Object.keys(profiles).forEach(key => {
                        if (!profiles[key].timestamp)
                            profiles[key].timestamp = Date.now();
                    });
                    if (!writeStoredJson('poe2_tabletProfiles', profiles))
                        return false;
                    if (profileName)
                        addProfileToTop(profileName, 'tablet');
                    updateSavedRegexDisplay();
                }
                catch (e) {
                    console.error('タイムスタンプ追加エラー:', e);
                }
            }, 100);
        };
        window.saveTabletProfile._hooked = true;
    }
}
function initSavedRegex() {
    const savedTabLink = document.querySelector('a[data-tab="savedContent"]');
    if (savedTabLink) {
        savedTabLink.addEventListener('click', () => {
            resetFilterControls();
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
//# sourceMappingURL=poe2.js.map
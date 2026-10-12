function initializeApplication() {
    loadLanguageState();
    updateChangelogBadge();
    const initialTab = window.location.hash.slice(1) || 'map';
    const initialTabId = `${initialTab}Content`;
    
    if (getElement(initialTabId)) {
        switchTab(initialTabId);
    } else {
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }

    window.addEventListener('hashchange', handleHashChange);
    
    document.querySelectorAll<HTMLElement>('#sideMenu .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
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
        profileSelect.addEventListener('change', function() {
            if (this.value) loadProfile();
            else getElement('profileName').value = '';
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
    if (savedScarabProfiles) scarabProfiles = readStoredJson('scarabProfiles') || {};
    updateScarabProfileList();

    const savedEssenceProfiles = readStoredText('essenceProfiles');
    if (savedEssenceProfiles) essenceProfiles = readStoredJson('essenceProfiles') || {};
    updateEssenceProfileList();

    const savedTattooProfiles = readStoredText('tattooProfiles');
    if (savedTattooProfiles) tattooProfiles = readStoredJson('tattooProfiles') || {};
    updateTattooProfileList();

    const savedRunegraftProfiles = readStoredText('runegraftProfiles');
    if (savedRunegraftProfiles) runegraftProfiles = readStoredJson('runegraftProfiles') || {};
    updateRunegraftProfileList();

    // プロファイル選択時のイベントリスナーを設定
    const scarabProfileSelect = getElement('scarabProfileList');
    if (scarabProfileSelect && !scarabProfileSelect.hasEventListener) {
        scarabProfileSelect.addEventListener('change', function() {
            if (this.value) loadScarabProfile();
            else getElement('scarabProfileName').value = '';
        });
        scarabProfileSelect.hasEventListener = true;
    }
    
    const tattooProfileSelect = getElement('tattooProfileList');
    if (tattooProfileSelect && !tattooProfileSelect.hasEventListener) {
        tattooProfileSelect.addEventListener('change', function() {
            if (this.value) loadTattooProfile();
            else getElement('tattooProfileName').value = '';
        });
        tattooProfileSelect.hasEventListener = true;
    }

    const runegraftProfileSelect = getElement('runegraftProfileList');
    if (runegraftProfileSelect && !runegraftProfileSelect.hasEventListener) {
        runegraftProfileSelect.addEventListener('change', function() {
            if (this.value) loadRunegraftProfile();
            else getElement('runegraftProfileName').value = '';
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

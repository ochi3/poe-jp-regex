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

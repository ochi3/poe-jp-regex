function switchTab(tabId: string) {
    document.querySelectorAll<HTMLElement>('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const targetContent = getElement(tabId);
    if (targetContent) {
        targetContent.style.display = 'block';
    }

    if (tabId === 'essenceContent' && typeof window.syncEssenceNameColumnWidth === 'function') {
        window.syncEssenceNameColumnWidth();
    }
    
    document.querySelectorAll<HTMLElement>('#sideMenu .nav-link').forEach(link => {
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
    if (!badge) return;
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
    } else {
        switchTab('mapContent');
        history.replaceState(null, '', '#map');
    }
}

function initializeTooltips() {
    document.querySelectorAll<HTMLElement>('.effect-item').forEach(item => {
        const tooltip = item.querySelector<HTMLElement>('.tooltip');

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

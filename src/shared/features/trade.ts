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
    } else {
        customInput.style.display = 'none';
    }
    saveTradeSettings();
}

function toggleTradeSettings() {
    const panel = getElement('tradeSettingsPanel');
    panel.classList.toggle('open');
}

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
    if (method === null) method = "securable";
    let minModCount = readStoredText('poeTradeMinModCount');
    if (minModCount === null) minModCount = "8";
    let maxModCount = readStoredText('poeTradeMaxModCount');
    if (maxModCount === null) maxModCount = "8";
    let corruptedStatus = readStoredText('poeTradeCorruptedStatus');
    if (corruptedStatus === null) corruptedStatus = "";

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
    } else {
        // 保存されたリーグがセレクトの選択肢にあればそれを選択
        const hasOption = Array.from(select.options).some(opt => opt.value === league);
        if (hasOption) {
            select.value = league;
            customInput.style.display = 'none';
        } else {
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
window.onload = function() {
    if (originalOnLoad) (originalOnLoad as () => void)();
    loadTradeSettings();
};

// 要望・不具合報告

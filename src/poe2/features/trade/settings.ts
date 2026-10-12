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
    if (method === null) method = "securable";
    let minModCount = readStoredText('poe2_poeTradeMinModCount');
    if (minModCount === null) minModCount = "6";
    let maxModCount = readStoredText('poe2_poeTradeMaxModCount');
    if (maxModCount === null) maxModCount = "6";
    let corruptedStatus = readStoredText('poe2_poeTradeCorruptedStatus');
    if (corruptedStatus === null) corruptedStatus = "";

    const mapTierMin = readStoredText('poe2_poeTradeMapTierMin') || "16";
    const mapTierMax = readStoredText('poe2_poeTradeMapTierMax') || "16";
    let buyoutPrice = readStoredText('poe2_poeTradeBuyoutPrice');
    if (buyoutPrice === null) buyoutPrice = "";
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
    getElement('mapTierMinInput').value = mapTierMin;
    getElement('mapTierMaxInput').value = mapTierMax;
    getElement('buyoutPriceSelect').value = buyoutPrice;
    getElement('buyoutPriceMinInput').value = buyoutPriceMin;
    getElement('buyoutPriceMaxInput').value = buyoutPriceMax;
    getElement('wantedModModeSelect').value = wantedMode;
    const deliriumMinInput = getElement('deliriumMinInput');
    const deliriumMaxInput = getElement('deliriumMaxInput');
    if (deliriumMinInput) deliriumMinInput.value = deliriumMin;
    if (deliriumMaxInput) deliriumMaxInput.value = deliriumMax;
}

const originalOnLoad = window.onload;
window.onload = function() {
    if (originalOnLoad) (originalOnLoad as () => void)();
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

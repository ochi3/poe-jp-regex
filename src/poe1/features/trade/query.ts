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
        "implicit.stat_2563183002|4", // Drox
        "implicit.stat_2563183002|3", // Al-Hezmin
        "implicit.stat_2563183002|2", // Veritania
        "implicit.stat_2563183002|1", // Baran
        "implicit.stat_1792283443|2", // The Elder
        "implicit.stat_1792283443|1"  // The Shaper
    ];
    defaultNotStatIds.forEach(id => {
        notStats.push({ id, disabled: false });
    });

    checkedMods.forEach((state, jpModName) => {
        const modInfo = mapModList[jpModName];
        if (!modInfo) return;

        // tradeStatIds（配列）を使用
        const ids = modInfo.tradeStatIds || [];

        if (ids.length === 0) {
            console.warn(`No tradeStatIds found for: ${jpModName}`);
            return;
        }

        ids.forEach(id => {
            if (!id) return; // 空文字のIDは無視
            const statObj = { id, disabled: false };
            if (state === 'ng') {
                notStats.push(statObj);
            } else {
                wantedStats.push(statObj);
            }
        });
    });

    const stats = []; // 一般的なAND条件（Mod数、メモリーマップなど）

    // クエリィオブジェクトを構築
    const query: TradeQuery = {
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
        const modCountFilter: TradeStat = {
            id: "pseudo.pseudo_number_of_affix_mods",
            value: {},
            disabled: false
        };
        if (minModCount > 0) modCountFilter.value.min = minModCount;
        if (maxModCount > 0) modCountFilter.value.max = maxModCount;
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
        if (scarabInput > 0) anyStats.push({ id: "pseudo.pseudo_map_more_scarab_drops", value: { min: scarabInput }, disabled: false });
        if (currencyInput > 0) anyStats.push({ id: "pseudo.pseudo_map_more_currency_drops", value: { min: currencyInput }, disabled: false });
        if (mapDropInput > 0) anyStats.push({ id: "pseudo.pseudo_map_more_map_drops", value: { min: mapDropInput }, disabled: false });

        query.stats.push({
            type: "count",
            value: { min: 1 },
            filters: anyStats
        });
    } else {
        // 通常のAND検索動作
        if (scarabInput > 0) stats.push({ id: "pseudo.pseudo_map_more_scarab_drops", value: { min: scarabInput }, disabled: false });
        if (currencyInput > 0) stats.push({ id: "pseudo.pseudo_map_more_currency_drops", value: { min: currencyInput }, disabled: false });
        if (mapDropInput > 0) stats.push({ id: "pseudo.pseudo_map_more_map_drops", value: { min: mapDropInput }, disabled: false });
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
        } else {
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
        const deliriumFilter: TradeStat = {
            id: "enchant.stat_1715784068",
            value: {},
            disabled: false
        };
        if (deliriumMin > 0) deliriumFilter.value.min = deliriumMin;
        if (deliriumMax > 0) deliriumFilter.value.max = deliriumMax;
        
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

    const filters: TradeFilters = {};
    
    // 詳細フィルタ（価格）
    if (buyoutPrice || buyoutPriceMin > 0 || buyoutPriceMax > 0) {
        const priceObj: TradeValue = {};
        if (buyoutPrice) priceObj.option = buyoutPrice;
        if (buyoutPriceMin > 0) priceObj.min = buyoutPriceMin;
        if (buyoutPriceMax > 0) priceObj.max = buyoutPriceMax;

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
            const tierFilter: TradeValue = {};
            if (mapTierMin) tierFilter.min = parseInt(mapTierMin);
            if (mapTierMax) tierFilter.max = parseInt(mapTierMax);
            filters.map_filters.filters.map_tier = tierFilter;
        }

        if (iiq > 0) filters.map_filters.filters.map_iiq = { min: iiq };
        if (packsize > 0) filters.map_filters.filters.map_packsize = { min: packsize };
        if (iir > 0) filters.map_filters.filters.map_iir = { min: iir };
    }

    // フィルタをクエリオブジェクトに割り当て
    Object.assign(query, { filters: filters });

    const queryJson = JSON.stringify({ query: query, sort: { price: "asc" } });
    const encodedQuery = encodeURIComponent(queryJson);
    
    const baseUrl = currentLanguage === 'en' ? 'www.pathofexile.com' : 'jp.pathofexile.com';
    return `https://${baseUrl}/trade/search/${encodeURIComponent(league)}?q=${encodedQuery}`;
}

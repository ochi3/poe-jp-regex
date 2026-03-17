/**
 * 選択されたマップMod用のPoEトレードサイトリンクを生成
 */
function buildTradeUrl() {
    // UIから設定を取得
    const league = (typeof getLeagueName === 'function' ? getLeagueName() : null)
        || document.getElementById('leagueInput')?.value
        || "Mirage";
    let tradeMethod = document.getElementById('tradeMethodSelect').value || "any";
    let minModCount = parseInt(document.getElementById('minModCountInput').value) || 0;
    
    // checkedModsから選択されたModを取得
    if ((!checkedMods || checkedMods.size === 0) && notStats.length === 0 && !document.getElementById('memoryMapCheckbox').checked && !parseInt(document.getElementById('minModCountInput').value) && !document.getElementById('itemQuantityInput').value && !document.getElementById('packSizeInput').value && !document.getElementById('rarityInput').value && !document.getElementById('scarabInput').value && !document.getElementById('currencyInput').value && !document.getElementById('mapInput').value) {
        alert("検索条件を一つ以上指定してください。");
        return null;
    }

    const notStats = [];
    const wantedStats = [];

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
    const query = {
        status: {
            option: tradeMethod
        },
        stats: []
    };

    // Mod数の条件を追加
    if (minModCount > 0) {
        stats.push({
            id: "pseudo.pseudo_number_of_affix_mods",
            value: { min: minModCount },
            disabled: false
        });
    }

    // メモリーマップの条件を追加
    if (document.getElementById('memoryMapCheckbox').checked) {
        stats.push({
            id: "implicit.stat_2696470877",
            disabled: false
        });
    }

    // 入力値から一般的なマップの擬似ステータスを追加（数量、パックサイズなど）
    const scarabInput = parseInt(document.getElementById('scarabInput').value);
    const currencyInput = parseInt(document.getElementById('currencyInput').value);
    const mapDropInput = parseInt(document.getElementById('mapInput').value);
    const isSearchAny = document.getElementById('searchAnyRadio').checked;

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
        const wantedMode = document.getElementById('wantedModModeSelect').value;
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

    const mapTierMin = document.getElementById('mapTierMinInput').value;
    const mapTierMax = document.getElementById('mapTierMaxInput').value;
    const buyoutPrice = document.getElementById('buyoutPriceSelect').value;
    const buyoutPriceMin = parseInt(document.getElementById('buyoutPriceMinInput').value);
    const buyoutPriceMax = parseInt(document.getElementById('buyoutPriceMaxInput').value);

    const filters = {};
    
    // 詳細フィルタ（価格）
    if (buyoutPrice || buyoutPriceMin > 0 || buyoutPriceMax > 0) {
        const priceObj = {};
        if (buyoutPrice) priceObj.option = buyoutPrice;
        if (buyoutPriceMin > 0) priceObj.min = buyoutPriceMin;
        if (buyoutPriceMax > 0) priceObj.max = buyoutPriceMax;

        filters.trade_filters = {
            filters: {
                price: priceObj
            }
        };
    }

    // アイテムカテゴリ（マップ）とデフォルトフィルタ（レアリティ、フォイル）
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

    // マップ層と値のフィルタ
    const iiq = parseInt(document.getElementById('itemQuantityInput').value);
    const packsize = parseInt(document.getElementById('packSizeInput').value);
    const iir = parseInt(document.getElementById('rarityInput').value);

    if (mapTierMin || mapTierMax || iiq || packsize || iir) {
        filters.map_filters = {
            filters: {}
        };

        if (mapTierMin || mapTierMax) {
            const tierFilter = {};
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
    
    return `https://jp.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodedQuery}`;
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

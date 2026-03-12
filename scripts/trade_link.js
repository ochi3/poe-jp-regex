/**
 * Generate a PoE Trade site link for selected map mods
 */
function buildTradeUrl() {
    // Get settings from UI
    const league = (typeof getLeagueName === 'function' ? getLeagueName() : null)
        || document.getElementById('leagueInput')?.value
        || "Mirage";
    let tradeMethod = document.getElementById('tradeMethodSelect').value || "any";
    let minModCount = parseInt(document.getElementById('minModCountInput').value) || 0;
    
    // Get selected mods from checkedMods Set
    if ((!checkedMods || checkedMods.size === 0) && notStats.length === 0 && !document.getElementById('memoryMapCheckbox').checked && !parseInt(document.getElementById('minModCountInput').value) && !document.getElementById('itemQuantityInput').value && !document.getElementById('packSizeInput').value && !document.getElementById('rarityInput').value && !document.getElementById('scarabInput').value && !document.getElementById('currencyInput').value && !document.getElementById('mapInput').value) {
        alert("検索条件を一つ以上指定してください。");
        return null;
    }

    const notStats = [];
    const wantedStats = [];

    checkedMods.forEach((state, jpModName) => {
        const modInfo = mapModList[jpModName];
        if (modInfo && modInfo.tradeStatId) {
            const statObj = {
                id: modInfo.tradeStatId,
                disabled: false
            };
            
            if (state === 'ng') {
                notStats.push(statObj);
            } else {
                wantedStats.push(statObj);
            }
        } else if (modInfo) {
            console.warn(`No tradeStatId found for: ${jpModName}`);
        }
    });

    const stats = []; // General AND stats (like Mod Count, Memory Map)

    // Build query object
    const query = {
        status: {
            option: tradeMethod
        },
        stats: []
    };

    // Add Mod Count condition
    if (minModCount > 0) {
        stats.push({
            id: "pseudo.pseudo_number_of_affix_mods",
            value: { min: minModCount },
            disabled: false
        });
    }

    // Add Memory Map condition
    if (document.getElementById('memoryMapCheckbox').checked) {
        stats.push({
            id: "implicit.stat_2696470877",
            disabled: false
        });
    }

    // Add general Map pseudo stats from inputs
    const scarabInput = parseInt(document.getElementById('scarabInput').value);
    const currencyInput = parseInt(document.getElementById('currencyInput').value);
    const mapDropInput = parseInt(document.getElementById('mapInput').value);
    const isSearchAny = document.getElementById('searchAnyRadio').checked;

    if (isSearchAny && (scarabInput > 0 || currencyInput > 0 || mapDropInput > 0)) {
        // Group them into a count search with min: 1
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
        // Normal AND search behavior
        if (scarabInput > 0) stats.push({ id: "pseudo.pseudo_map_more_scarab_drops", value: { min: scarabInput }, disabled: false });
        if (currencyInput > 0) stats.push({ id: "pseudo.pseudo_map_more_currency_drops", value: { min: currencyInput }, disabled: false });
        if (mapDropInput > 0) stats.push({ id: "pseudo.pseudo_map_more_map_drops", value: { min: mapDropInput }, disabled: false });
    }

    // Add combined stats group if not empty
    if (stats.length > 0) {
        // Standard AND search
        query.stats.push({
            type: "and",
            filters: stats
        });
    }

    // Add NOT stats group
    if (notStats.length > 0) {
        query.stats.push({
            type: "not",
            filters: notStats
        });
    }

    // Add Wanted stats group
    if (wantedStats.length > 0) {
        const wantedMode = document.getElementById('wantedModModeSelect').value;
        if (wantedMode === 'all') {
            // Match ALL (AND search)
            query.stats.push({
                type: "and",
                filters: wantedStats
            });
        } else {
            // Match ANY (OR search behavior of regex)
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
    
    // Advanced filters (Price)
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

    // Item category (Map) and Default Filters (Rarity, Foil)
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

    // Map Tier & Value filters
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

    // Assign filters to the query object
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

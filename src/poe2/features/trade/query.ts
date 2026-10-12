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
    const hasInputs = !!(
        minModCount || iiq || packsize || iir || mapMonsterRarity
        || !isNaN(revive) || waystoneDrop || delirium || rareMonster || magicMonster
        || mapTierMin || mapTierMax
    );

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

    // クエリィオブジェクトを構築
    const query: TradeQuery = {
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
        const deliriumFilter: TradeStat = {
            id: "enchant.stat_1715784068",
            value: {},
            disabled: false
        };
        if (finalDeliriumMin > 0) deliriumFilter.value.min = finalDeliriumMin;
        if (finalDeliriumMax > 0) deliriumFilter.value.max = finalDeliriumMax;
        
        query.stats.push({
            type: "and",
            filters: [deliriumFilter]
        });
    }

    // Mod数の条件を追加
    const maxModCount = parseInt(getElement('maxModCountInput').value);
    if (minModCount > 0 || maxModCount > 0) {
        const stats = [];
        const modCountFilter: TradeStat = {
            id: "pseudo.pseudo_number_of_affix_mods",
            value: {},
            disabled: false
        };
        if (minModCount > 0) modCountFilter.value.min = minModCount;
        if (maxModCount > 0) modCountFilter.value.max = maxModCount;
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
        } else {
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

    const filters: TradeFilters = {};
    
    // 詳細フィルタ（価格）
    if (buyoutPrice || buyoutPriceMin > 0 || buyoutPriceMax > 0) {
        const priceObj: TradeValue = {};
        if (buyoutPrice) priceObj.currency = buyoutPrice;
        if (buyoutPriceMin > 0) priceObj.min = buyoutPriceMin;
        if (buyoutPriceMax > 0) priceObj.max = buyoutPriceMax;

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
    if (
        mapTierMin || mapTierMax || iiq > 0 || packsize > 0 || waystoneIir > 0
        || waystoneDrop > 0 || rareMonster > 0 || magicMonster > 0 || !isNaN(revive)
    ) {
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
        if (waystoneIir > 0) filters.map_filters.filters.map_iir = { min: waystoneIir };
        if (waystoneDrop > 0) filters.map_filters.filters.map_bonus = { min: waystoneDrop };
        if (rareMonster > 0) filters.map_filters.filters.map_rare_monsters = { min: rareMonster };
        if (magicMonster > 0) filters.map_filters.filters.map_magic_monsters = { min: magicMonster };
        if (!isNaN(revive)) filters.map_filters.filters.map_revives = { min: revive };
    }

    // フィルタをクエリオブジェクトに割り当て
    Object.assign(query, { filters: filters });

    const queryJson = JSON.stringify({ query: query, sort: { price: "asc" } });
    const encodedQuery = encodeURIComponent(queryJson);
    
    const baseUrlHost = currentLanguage === 'en' ? 'www.pathofexile.com' : 'jp.pathofexile.com';
    return `https://${baseUrlHost}/trade2/search/poe2/${encodeURIComponent(league)}?q=${encodedQuery}`;
}

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

    const notStats = [];
    const wantedStats = [];

    // 入力値を取得
    const iiq = parseInt(document.getElementById('itemQuantityInput').value);
    const packsize = parseInt(document.getElementById('packSizeInput').value);
    const iir = parseInt(document.getElementById('rarityInput').value);
    const mapMonsterRarity = parseInt(document.getElementById('mapMonsterRarityInput').value);
    const reviveRaw = document.getElementById('reviveInput').value;
    const revive = reviveRaw === '' ? NaN : parseInt(reviveRaw, 10);
    const waystoneDrop = parseInt(document.getElementById('waystoneInput').value);
    const delirium = parseInt(document.getElementById('deliriumInput').value);
    const rareMonster = parseInt(document.getElementById('rareMonsterInput').value);
    const magicMonster = parseInt(document.getElementById('magicMonsterInput').value);
    const mapTierMin = document.getElementById('mapTierMinInput').value;
    const mapTierMax = document.getElementById('mapTierMaxInput').value;

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
    const query = {
        status: {
            option: tradeMethod
        },
        stats: []
    };

    // デリリウムの条件を追加
    // メインUIのセレクトボックスとサイドパネルのMin/Max値の両方をチェック
    const sideDeliriumMin = parseInt(document.getElementById('deliriumMinInput')?.value || 0);
    const sideDeliriumMax = parseInt(document.getElementById('deliriumMaxInput')?.value || 0);
    
    // 両方のソースから最大値を抽出
    const finalDeliriumMin = Math.max(delirium || 0, sideDeliriumMin);
    const finalDeliriumMax = sideDeliriumMax;

    if (finalDeliriumMin > 0 || finalDeliriumMax > 0) {
        const deliriumFilter = {
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
    const maxModCount = parseInt(document.getElementById('maxModCountInput').value);
    if (minModCount > 0 || maxModCount > 0) {
        const stats = [];
        const modCountFilter = {
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

    const buyoutPrice = document.getElementById('buyoutPriceSelect').value;
    const buyoutPriceMin = parseInt(document.getElementById('buyoutPriceMinInput').value);
    const buyoutPriceMax = parseInt(document.getElementById('buyoutPriceMaxInput').value);

    const filters = {};
    
    // 詳細フィルタ（価格）
    if (buyoutPrice || buyoutPriceMin > 0 || buyoutPriceMax > 0) {
        const priceObj = {};
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
    const corruptedStatus = document.getElementById('corruptedStatusSelect').value;

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
            const tierFilter = {};
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

/**
 * 独自のトレード検索IDを使用してリンクを開く。
 * リーグ設定は getLeagueName() から動的に取得される。
 * @param {string} queryId トレードサイトの検索ID（URLの末尾部分）
 */
function openCustomTrade(queryId) {
    // リーグ名を取得
    const league = (typeof getLeagueName === 'function' ? getLeagueName() : null)
        || document.getElementById('leagueInput')?.value
        || document.getElementById('leagueSelect')?.value
        || "Mirage";
    
    // 現在の言語設定に基づいてベースURLを選択
    const baseUrlHost = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') 
        ? 'www.pathofexile.com' 
        : 'jp.pathofexile.com';
    
    // クエリIDが空の場合は検索トップを開く
    const tradeUrl = `https://${baseUrlHost}/trade2/search/poe2/${encodeURIComponent(league)}${queryId ? '/' + queryId : ''}`;
    
    window.open(tradeUrl, '_blank');
}

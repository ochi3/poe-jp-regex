/**
 * 海図（Voyage Chart / Deepwater）MOD タブ UI
 * map_mods / scripts.js の操作感に合わせた簡易版
 */
(function () {
    let chartCheckedMods = new Map(); // key -> 'ng' | 'wanted'
    let chartShowAdjacent = true;
    let chartShowVoyage = true;

    function chartList() {
        return typeof chartModList !== "undefined" ? chartModList : {};
    }

    function formatChartModText(text, value) {
        if (typeof formatModText === "function") {
            return formatModText(text, value);
        }
        if (!text || !value) return text || "";
        const textParts = text.split("|");
        const valueParts = value.split("|");
        return textParts
            .map((part, i) => {
                const v = valueParts[i] !== undefined ? valueParts[i] : valueParts[0];
                if (!v || v === "1") return part;
                return part
                    .replace(/\(##\)/g, `(${v})`)
                    .replace(/##/g, v)
                    .replace(/#/g, v);
            })
            .join("\n");
    }

    function addChartEffectItem(key, value) {
        const listDiv = document.getElementById("ChartModList");
        if (!listDiv) return;

        const textSpan = document.createElement("span");
        textSpan.classList.add("mod-text");
        const lang = typeof currentLanguage !== "undefined" ? currentLanguage : "ja";
        const rawText = lang === "ja" ? value.mod : value.engMod;
        textSpan.textContent = formatChartModText(rawText, value.value);

        const effectItem = document.createElement("div");
        effectItem.classList.add("effect-item");
        effectItem.dataset.modKey = key;

        if (chartCheckedMods.get(key) === "ng") {
            effectItem.classList.add("ng");
        } else if (chartCheckedMods.get(key) === "wanted") {
            effectItem.classList.add("wanted");
        }

        effectItem.addEventListener("click", function (e) {
            e.preventDefault();
            const cur = chartCheckedMods.get(key);
            if (cur === "ng") chartCheckedMods.delete(key);
            else chartCheckedMods.set(key, "ng");
            saveChartChecked();
            updateChartModList();
            updateChartCombinedRegex();
        });

        effectItem.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            const cur = chartCheckedMods.get(key);
            if (cur === "wanted") chartCheckedMods.delete(key);
            else chartCheckedMods.set(key, "wanted");
            saveChartChecked();
            updateChartModList();
            updateChartCombinedRegex();
        });

        const badgeContainer = document.createElement("div");
        badgeContainer.classList.add("badge-container");

        const typeBadge = document.createElement("span");
        typeBadge.classList.add("badge", "type-badge");
        if (value.type === "Prefix") {
            typeBadge.style.backgroundColor = "var(--accent-red)";
            typeBadge.textContent = "P";
        } else if (value.type === "Suffix") {
            typeBadge.style.backgroundColor = "var(--accent-blue)";
            typeBadge.textContent = "S";
        } else if (value.type === "Voyage" || value.voyage) {
            typeBadge.style.backgroundColor = "var(--accent-primary, #4ecdc4)";
            typeBadge.textContent = "航";
        } else {
            typeBadge.style.backgroundColor = "var(--accent-gold, #c9a227)";
            typeBadge.textContent = "隣";
        }
        badgeContainer.appendChild(typeBadge);

        const qty = value["map_item_drop_quantity_+%"];
        if (qty) {
            const b = document.createElement("span");
            b.classList.add("badge", "qty-badge");
            b.textContent = `数量 ${qty}`;
            badgeContainer.appendChild(b);
        }
        const rarity = value["map_item_drop_rarity_+%"];
        if (rarity) {
            const b = document.createElement("span");
            b.classList.add("badge", "rarity-badge");
            b.textContent = `レア ${rarity}`;
            badgeContainer.appendChild(b);
        }
        const pack = value["map_pack_size_+%"];
        if (pack) {
            const b = document.createElement("span");
            b.classList.add("badge", "pack-badge");
            b.textContent = `パック ${pack}`;
            badgeContainer.appendChild(b);
        }
        const sulphur = value["map_deepwater_league_resource_found_+%"];
        if (sulphur) {
            const b = document.createElement("span");
            b.classList.add("badge", "sulphur-badge");
            b.textContent = `硫黄 ${sulphur}`;
            badgeContainer.appendChild(b);
        }

        effectItem.appendChild(textSpan);
        effectItem.appendChild(badgeContainer);
        listDiv.appendChild(effectItem);
    }

    window.updateChartModList = function () {
        const listDiv = document.getElementById("ChartModList");
        if (!listDiv) return;
        listDiv.innerHTML = "";

        const search = (document.getElementById("chartEffectSearch")?.value || "").toLowerCase();
        const sortMethod = document.getElementById("chartSortSelect")?.value || "default";
        chartShowAdjacent = !!document.getElementById("chartAdjacentCheckbox")?.checked;
        chartShowVoyage = !!document.getElementById("chartVoyageCheckbox")?.checked;

        const entries = Object.entries(chartList()).filter(([, v]) => {
            if (v.adjacent && !chartShowAdjacent) return false;
            if ((v.voyage || v.type === "Voyage") && !chartShowVoyage) return false;
            return true;
        });

        // 航海・隣接を先に、その後プレフィックス / サフィックス
        const typeOrder = (v) => {
            if (v.voyage || v.type === "Voyage") return 0;
            if (v.adjacent || v.type === "Adjacent") return 1;
            if (v.type === "Prefix") return 2;
            if (v.type === "Suffix") return 3;
            return 4;
        };

        entries.sort(([keyA, a], [keyB, b]) => {
            const aSel = chartCheckedMods.has(keyA) ? 0 : 1;
            const bSel = chartCheckedMods.has(keyB) ? 0 : 1;
            if (aSel !== bSel) return aSel - bSel;

            switch (sortMethod) {
                case "type_asc":
                    return typeOrder(a) - typeOrder(b) || keyA.localeCompare(keyB);
                case "quantity_desc":
                    return (b["map_item_drop_quantity_+%"] || 0) - (a["map_item_drop_quantity_+%"] || 0);
                case "sulphur_desc":
                    return (
                        (b["map_deepwater_league_resource_found_+%"] || 0) -
                        (a["map_deepwater_league_resource_found_+%"] || 0)
                    );
                case "weight_desc":
                    return (b.weight || 0) - (a.weight || 0);
                default:
                    return typeOrder(a) - typeOrder(b) || keyA.localeCompare(keyB);
            }
        });

        entries.forEach(([key, value]) => {
            if (search) {
                const hay = `${value.mod} ${value.engMod} ${value.nameJa || ""} ${value.nameEn || ""}`.toLowerCase();
                if (!hay.includes(search)) return;
            }
            addChartEffectItem(key, value);
        });
    };

    window.updateChartCombinedRegex = function () {
        const out = document.getElementById("chartRegexOutput");
        const countEl = document.getElementById("chartCharCount");
        if (!out) return;

        const lang = typeof currentLanguage !== "undefined" ? currentLanguage : "ja";
        const ng = [];
        const wanted = [];
        const valid = new Map();

        chartCheckedMods.forEach((state, key) => {
            const mod = chartList()[key];
            if (!mod) return;
            const rx = lang === "ja" ? mod.Regex : mod.engRegex;
            if (!rx) return;
            if (state === "ng") ng.push(rx);
            else wanted.push(rx);
            valid.set(key, state);
        });
        chartCheckedMods = valid;

        const uniqNg = [...new Set(ng)];
        const uniqWanted = [...new Set(wanted)];
        let result = "";
        if (uniqNg.length && uniqWanted.length) {
            result = `"!${uniqNg.join("|")}" "${uniqWanted.join("|")}"`;
        } else if (uniqNg.length) {
            result = `"!${uniqNg.join("|")}"`;
        } else if (uniqWanted.length) {
            result = `"${uniqWanted.join("|")}"`;
        }

        // 数量 / 硫黄 数値フィルタ
        const qty = document.getElementById("chartQtyInput")?.value;
        const sulphur = document.getElementById("chartSulphurInput")?.value;
        const extras = [];
        if (qty && typeof getFixedRangeRegex === "function") {
            extras.push(getFixedRangeRegex(qty, lang === "ja" ? "量:.*" : "m q.*"));
        }
        if (sulphur && typeof getFixedRangeRegex === "function") {
            extras.push(getFixedRangeRegex(sulphur, lang === "ja" ? "硫黄.*" : "ulphur.*"));
        }
        if (extras.length) {
            result = result ? `${result} ${extras.join(" ")}` : extras.join(" ");
        }

        out.textContent = result;
        if (countEl) {
            countEl.textContent = `${result.length} 文字`;
            countEl.classList.toggle("over-limit", result.length > 250);
        }
    };

    window.copyChartRegex = function () {
        const text = document.getElementById("chartRegexOutput")?.textContent || "";
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    window.resetChartMods = function () {
        chartCheckedMods.clear();
        const search = document.getElementById("chartEffectSearch");
        if (search) search.value = "";
        const qty = document.getElementById("chartQtyInput");
        if (qty) qty.value = "";
        const sulphur = document.getElementById("chartSulphurInput");
        if (sulphur) sulphur.value = "";
        saveChartChecked();
        updateChartModList();
        updateChartCombinedRegex();
    };

    function saveChartChecked() {
        localStorage.setItem(
            "poe1_chart_checked_v1",
            JSON.stringify([...chartCheckedMods.entries()]),
        );
    }

    function loadChartChecked() {
        try {
            const raw = localStorage.getItem("poe1_chart_checked_v1");
            if (!raw) return;
            const entries = JSON.parse(raw);
            chartCheckedMods = new Map();
            for (const [k, v] of entries) {
                if (chartList()[k]) chartCheckedMods.set(k, v);
            }
        } catch (_) {
            chartCheckedMods = new Map();
        }
    }

    // 言語切替時に再描画
    const origToggle = window.toggleLanguage;
    if (typeof origToggle === "function") {
        window.toggleLanguage = function () {
            origToggle();
            const chart = document.getElementById("chartContent");
            if (chart && chart.style.display !== "none") {
                updateChartModList();
                updateChartCombinedRegex();
            }
        };
    }

    // トップナビ切替後に海図リストを描画
    const origSwitchTab = window.switchTab;
    if (typeof origSwitchTab === "function") {
        window.switchTab = function (tabId) {
            origSwitchTab(tabId);
            if (tabId === "chartContent") {
                updateChartModList();
                updateChartCombinedRegex();
            }
        };
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadChartChecked();
        if (window.location.hash === "#chart") {
            updateChartModList();
            updateChartCombinedRegex();
        }
    });
})();

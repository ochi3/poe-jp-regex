"""Deepwater / 海図（Voyage Chart）MOD を抽出して scripts/chart_mods.js を生成する。"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tooling', 'data')))
from mod_identity import find_by_source_id, with_source_id, manual_regex_entry
from mod_details import attach_mod_details
from chart_scopes import extract_chart_scopes


from extract_map_mods import (
    clean_and_placeholder_with_values,
    fetch_trade_stat_map,
    find_existing_mod,
    find_trade_stat_ids,
    load_existing_mod_list,
    load_js_object_data,
    normalize_mod_key,
    POE_TRADE_STATS_EN_URL,
    POE_TRADE_STATS_JP_URL,
)
from mod_data_source import load_mods_and_stat_map, parse_source_arg

# バッジ用（表示テキスト / value からは除外）
TARGET_STATS = [
    "map_item_drop_quantity_+%",
    "map_item_drop_rarity_+%",
    "map_pack_size_+%",
    "map_deepwater_league_resource_found_+%",
]

GENERIC_STAT_TEXTS = [
    "このエリアで見つかるアイテムの数量が#%増加する",
    "このエリアで見つかるアイテムのレアリティが#%増加する",
    "パックサイズが#%増加する",
    "このエリアで見つかる死人の硫黄が#%増加する",
    "#% increased Quantity of Items found in this Area",
    "#% increased Rarity of Items found in this Area",
    "#% increased Pack size",
    "#% increased Dead Man's Sulphur found in this Area",
]

# extract_map_mods の GENERIC を一時差し替えするためローカル版を使う
import extract_map_mods as _emm

_ORIG_GENERIC = _emm.GENERIC_STAT_TEXTS


def _clean_chart(text: str):
    _emm.GENERIC_STAT_TEXTS = GENERIC_STAT_TEXTS
    try:
        return clean_and_placeholder_with_values(text)
    finally:
        _emm.GENERIC_STAT_TEXTS = _ORIG_GENERIC


def _suggest_regex(jp: str, eng: str, used: set[str]) -> tuple[str, str]:
    """Choose escaped contiguous text; never join words or include regex syntax."""
    def pick(text, width):
        text = re.sub(r"^\((?:隣接|航海|Adjacent|Voyage)\)\s*", "", text)
        words = re.findall(r"[A-Za-z']{3,}|[一-龯ぁ-んァ-ヶー]{3,}", text)
        for length in range(width, width + 4):
            for word in words:
                for start in range(max(0, len(word) - length + 1)):
                    candidate = re.escape(word[start:start + length])
                    if candidate not in used:
                        used.add(candidate)
                        return candidate
        if not words:
            raise ValueError(f"Regexを生成する文字列がありません: {text}")
        return re.escape(words[0])
    return pick(jp, 3), pick(eng, 4)


def _max_chart_weight(spawn_weights: list) -> int:
    max_w = 0
    for sw in spawn_weights or []:
        if sw.get("tag") == "chart" and sw.get("weight", 0) > 0:
            max_w = max(max_w, sw.get("weight", 0))
    return max_w


def _load_map_mod_regex_index(map_mods_path: str) -> dict[str, dict]:
    """マップMODを正規化キーで引き、Regex / engRegex を再利用できるようにする。"""
    data = load_js_object_data(map_mods_path) or {}
    index: dict[str, dict] = {}
    for key, entry in data.items():
        if not isinstance(entry, dict):
            continue
        rx = (entry.get("Regex") or "").strip()
        erx = (entry.get("engRegex") or "").strip()
        if not rx and not erx:
            continue
        for candidate in (key, entry.get("mod") or "", entry.get("engMod") or ""):
            nk = normalize_mod_key(candidate)
            if not nk:
                continue
            prev = index.get(nk)
            # 既存より長い（＝より具体的な）Regex を優先
            if prev is None or len(rx) > len(prev.get("Regex") or ""):
                index[nk] = {"Regex": rx, "engRegex": erx, "source": key}
    return index


def _resolve_regex(
    full_jp: str,
    full_en: str,
    prev: dict,
    map_rx_index: dict[str, dict],
    used_jp_rx: set[str],
    used_en_rx: set[str],
) -> tuple[str, str, str]:
    """
    Regex 解決順:
      1. マップMODと同文言 → マップの Regex / engRegex を優先
      2. 既存 chart_mods の Regex
      3. 自動生成
    """
    # Only the previous manual settings of this chart Mod may be inherited.
    return prev.get('Regex', ''), prev.get('engRegex', ''), 'prev' if prev else 'manual-required'



def main():
    source = parse_source_arg()
    tools_dir = os.path.dirname(__file__)
    out_path = os.path.join(tools_dir, "../scripts/chart_mods.js")
    backup_path = os.path.join(tools_dir, "../scripts/chart_mods_backup.js")
    map_mods_path = os.path.join(tools_dir, "../scripts/map_mods.js")

    existing = load_existing_mod_list(out_path)
    existing = load_existing_mod_list(backup_path, existing)
    old_data = load_js_object_data(out_path)
    map_rx_index = _load_map_mod_regex_index(map_mods_path)
    print(f"Map mod regex index: {len(map_rx_index)} keys from {os.path.basename(map_mods_path)}")

    if os.path.exists(out_path) and old_data:
        print(f"Backing up to {backup_path}...")
        shutil.copy2(out_path, backup_path)

    trade_en = fetch_trade_stat_map(POE_TRADE_STATS_EN_URL)
    trade_jp = fetch_trade_stat_map(POE_TRADE_STATS_JP_URL)
    mods_en, mods_jp, _stat_map = load_mods_and_stat_map(source, tools_dir)
    if not mods_en or not mods_jp:
        print("Failed to load mod data.")
        return

    result: dict = {}
    used_jp_rx: set[str] = set()
    used_en_rx: set[str] = set()
    count = 0
    trade_matched = 0
    rx_from_map = 0
    rx_from_prev = 0
    rx_generated = 0

    for m_id, m_en in mods_en.items():
        if m_en.get("domain") != "deepwater_chart":
            continue

        gen = m_en.get("generation_type") or ""
        is_adjacent = False
        is_affix = gen in ("prefix", "suffix")
        if not is_affix and not is_adjacent:
            continue

        weight = _max_chart_weight(m_en.get("spawn_weights", []))
        if is_affix and weight <= 0:
            continue
        # 隣接効果は spawn_weights が無いことがある
        if is_adjacent:
            weight = weight or 0

        m_jp = mods_jp.get(m_id, {})
        raw_jp = m_jp.get("text") or ""
        raw_en = m_en.get("text") or ""
        if not raw_jp and not raw_en:
            continue

        full_jp, val_jp = _clean_chart(raw_jp)
        full_en, val_en = _clean_chart(raw_en)
        if not full_jp:
            continue

        if is_adjacent and not full_jp.startswith("(隣接)"):
            full_jp = f"(隣接) {full_jp}"
            full_en = f"(Adjacent) {full_en}" if full_en else full_en

        full_val = val_jp if any(p not in ("", "1", "0") for p in val_jp.split("|")) else val_en

        stats = m_en.get("stats") or []
        badge = {}
        for s_id in TARGET_STATS:
            val = 0
            for s in stats:
                if s.get("id") == s_id:
                    val = s.get("max", 0) or 0
                    break
            badge[s_id] = val

        new_trade_ids = find_trade_stat_ids(full_en, full_jp, trade_en, trade_jp)
        prev = manual_regex_entry(old_data, m_id, full_jp, full_en)

        prev_ids = list(prev.get("tradeStatIds") or [])
        n = max(len(prev_ids), len(new_trade_ids))
        prev_ids += [""] * (n - len(prev_ids))
        padded_new = list(new_trade_ids) + [""] * (n - len(new_trade_ids))
        trade_ids = [a or b for a, b in zip(prev_ids, padded_new)]

        rx, erx, rx_src = _resolve_regex(
            full_jp, full_en, prev, map_rx_index, used_jp_rx, used_en_rx
        )

        id_previous = find_by_source_id(old_data, m_id)
        if id_previous:
            rx, erx = id_previous.get('Regex', rx), id_previous.get('engRegex', erx)
        type_label = "Adjacent" if is_adjacent else gen.capitalize()
        entry = {
            "mod": full_jp,
            "engMod": full_en,
            "value": full_val,
            "type": type_label,
            "weight": prev.get("weight", weight),
            "tier": prev.get("tier", 0),
            "engRegex": erx,
            "Regex": rx,
            "tradeStatIds": trade_ids,
            "adjacent": is_adjacent,
            "nameJa": m_jp.get("name") or "",
            "nameEn": m_en.get("name") or "",
            "_rx_src": rx_src,
        }
        with_source_id(entry, m_id, result.get(full_jp))
        entry.update(badge)

        # 同一キーは weight が大きい方を残す
        if full_jp in result:
            if entry["weight"] <= result[full_jp].get("weight", 0):
                continue
        result[full_jp] = entry
        count += 1

    translations = []
    if source == 'poe-db':
        from poe_db_source import stat_translations_dir
        directory = stat_translations_dir()
        for filename in ['deepwater_implicit_stat_descriptions.json', 'deepwater_explicit_stat_descriptions.json',
                         'deepwater_applied_adjacent_stat_descriptions.json', 'deepwater_stat_descriptions.json',
                         'map_stat_descriptions.json', 'stat_descriptions.json']:
            translation_path = directory / filename
            if translation_path.is_file():
                for item in json.loads(translation_path.read_text(encoding='utf-8-sig')):
                    translations.append({**item, '_src': filename})
    else:
        translations = [{'ids': [stat_id], 'ja': text.get('jp', ''), 'en': text.get('en', '')}
                        for stat_id, text in _stat_map.items()]
    scoped = extract_chart_scopes(mods_en, mods_jp, translations, old_data, result)
    result.update(scoped)
    attach_mod_details(result, mods_en, mods_jp)
    print(f"Scope translations: adjacent={sum(bool(v.get('adjacent')) for v in scoped.values())}, voyage={sum(bool(v.get('voyage')) for v in scoped.values())}")

    for entry in result.values():
        if any(entry.get("tradeStatIds") or []):
            trade_matched += 1
        src = entry.pop("_rx_src", "generated")
        if src == "map":
            rx_from_map += 1
        elif src == "prev":
            rx_from_prev += 1
        else:
            rx_generated += 1

    print(f"Extracted {len(result)} chart modifiers.")
    print(f"Trade stat ID matched: {trade_matched} / {len(result)}")
    print(f"Regex source: map={rx_from_map}, prev={rx_from_prev}, generated={rx_generated}")
    print(f"  prefix/suffix: {sum(1 for v in result.values() if v.get('type') in ('Prefix', 'Suffix'))}")
    print(f"  adjacent: {sum(1 for v in result.values() if v.get('adjacent'))}")
    print(f"  voyage: {sum(1 for v in result.values() if v.get('voyage'))}")

    json_data = json.dumps(result, ensure_ascii=False, indent=2)
    content = (
        f"// tools/extract_chart_mods.py によって自動生成されました (source: {source})\n"
        f"const chartModList = {json_data};\n"
    )
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()

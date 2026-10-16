"""PoE2-DB ローカル export から mods.json / stat 翻訳を読み込む。"""

from __future__ import annotations

import json
import re
from pathlib import Path

STAT_DESC_FILES = [
    "map_stat_descriptions.json",
    "endgame_map_stat_descriptions.json",
    "atlas_stat_descriptions.json",
    "stat_descriptions.json",
]

UPDATE_NUMERIC_FIELDS = [
    "value",
    "type",
    "weight",
    "tradeStatIds",
    "map_item_drop_quantity_+%",
    "map_item_drop_rarity_+%",
    "map_pack_size_+%",
    "map_map_item_drop_chance_+%",
    "map_number_of_rare_packs_+%",
    "map_number_of_magic_packs_+%",
    "map_monster_potency_+%",
]

MAP_STAT_FIELDS = [
    "map_item_drop_quantity_+%",
    "map_item_drop_rarity_+%",
    "map_pack_size_+%",
    "map_map_item_drop_chance_+%",
    "map_number_of_rare_packs_+%",
    "map_number_of_magic_packs_+%",
    "map_monster_potency_+%",
]


def mod_entry_priority(entry: dict, source_key: str = "") -> tuple:
    """extract / merge 索引で同一正規化キー衝突時、Suffix/Prefix を Unique より優先。"""
    gen = entry.get("type", "").lower()
    type_rank = {"prefix": 3, "suffix": 3, "unique": 1}.get(gen, 0)
    weight = entry.get("weight", 0) or 0
    stat_sum = sum(abs(entry.get(k, 0) or 0) for k in MAP_STAT_FIELDS)
    tier_num = 0
    m = re.search(r"(\d+)$", source_key)
    if m:
        tier_num = int(m.group(1))
    return (type_rank, weight, stat_sum, tier_num)


def _upsert_best_index(
    index: dict,
    source_keys: dict,
    norm_key: str,
    entry: dict,
    source_key: str,
) -> None:
    """正規化キーが衝突したら mod_entry_priority が高い方を残す。"""
    if not norm_key:
        return
    prev = index.get(norm_key)
    prev_source = source_keys.get(norm_key, "")
    if prev is None or mod_entry_priority(entry, source_key) > mod_entry_priority(
        prev, prev_source
    ):
        index[norm_key] = entry
        source_keys[norm_key] = source_key


def resolve_poe2db_root() -> Path:
    """tools_poe2 から PoE2-DB ルートを解決する。"""
    here = Path(__file__).resolve().parent
    candidates = [
        here.parent.parent / "PoE2-DB",
        here.parent / "PoE2-DB",
    ]
    for path in candidates:
        if (path / "data" / "export" / "repoe" / "global" / "mods.json").is_file():
            return path
    raise FileNotFoundError(
        "PoE2-DB が見つかりません。"
        " data/export/repoe/global/mods.json がある PoE2-DB を配置してください。"
    )


def mods_json_path(lang: str) -> Path:
    root = resolve_poe2db_root()
    folder = "japanese" if lang in ("ja", "jp", "japanese") else "global"
    return root / "data" / "export" / "repoe" / folder / "mods.json"


def stat_translations_dir() -> Path:
    return resolve_poe2db_root() / "data" / "export" / "game" / "stat_translations"


def trade_groups_path() -> Path:
    return resolve_poe2db_root() / "data" / "db" / "stats" / "trade_groups.json"


def load_mods(lang: str) -> dict:
    path = mods_json_path(lang)
    print(f"mods {lang.upper()}: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _placeholder_stat_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace("{0}", "#").replace("{1}", "#").replace("{2}", "#")
    text = re.sub(r"\[[^|\]]+\|([^\]]+)\]", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]", r"\1", text)
    return text


def load_stat_map() -> dict[str, dict[str, str]]:
    """stat_id -> {en, jp}（PoE2-DB stat_translations 形式）"""
    root = stat_translations_dir()
    if not root.is_dir():
        raise FileNotFoundError(
            f"stat_translations がありません: {root}\n"
            "PoE2-DB で `uv run ./main.py prepare translations` を実行してください。"
        )

    stat_map: dict[str, dict[str, str]] = {}
    for filename in STAT_DESC_FILES:
        path = root / filename
        if not path.is_file():
            print(f"警告: stat 翻訳ファイルなし（スキップ）: {path.name}")
            continue
        entries = json.loads(path.read_text(encoding="utf-8"))
        for entry in entries:
            ids = entry.get("ids") or []
            en = _placeholder_stat_text(entry.get("en", ""))
            ja = _placeholder_stat_text(entry.get("ja", ""))
            if not ids or not en or not ja:
                continue
            for stat_id in ids:
                stat_map[stat_id] = {"en": en, "jp": ja}
        print(f"  stat 翻訳: {path.name} … 累計 {len(stat_map)} stat")
    return stat_map


def _primary_normalize(key: str, normalize_key) -> str:
    """pipe 連結 Mod の先頭行で正規化（汎用副統計行を除いた主 Mod と突合）。"""
    if not key:
        return ""
    return normalize_key(key.split("|", 1)[0])


def merge_map_mods_with_canonical(extracted: dict, canonical: dict, normalize_key) -> dict:
    """既存 map_mods.js の Mod 名・Regex を維持し、数値系のみ extracted で更新する。"""
    by_mod: dict = {}
    by_eng: dict = {}
    by_primary: dict = {}
    mod_sources: dict = {}
    eng_sources: dict = {}
    primary_sources: dict = {}
    for k, v in extracted.items():
        _upsert_best_index(by_mod, mod_sources, normalize_key(k), v, k)
        eng = v.get("engMod", "")
        if eng:
            _upsert_best_index(by_eng, eng_sources, normalize_key(eng), v, k)
        pk = _primary_normalize(k, normalize_key)
        _upsert_best_index(by_primary, primary_sources, pk, v, k)

    by_source_id = {source_id: entry for entry in extracted.values() for source_id in entry.get('sourceIds', [])}
    merged: dict = {}
    updated = 0
    for key, entry in canonical.items():
        if entry.get('sourceIds') and not any(source_id in by_source_id for source_id in entry['sourceIds']):
            continue
        out = dict(entry)
        norm_mod = normalize_key(key)
        norm_eng = normalize_key(entry.get("engMod", ""))
        primary = _primary_normalize(key, normalize_key)
        fresh = (
            next((by_source_id[source_id] for source_id in entry.get('sourceIds', []) if source_id in by_source_id), None)
            or by_mod.get(norm_mod)
            or by_eng.get(norm_eng)
            or by_primary.get(primary)
        )
        if fresh:
            for field in UPDATE_NUMERIC_FIELDS:
                if field in fresh:
                    out[field] = fresh[field]
            # 表示用 mod 文は extracted のクリーン版を反映
            for field in ('mod', 'engMod', 'sourceIds'):
                if fresh.get(field):
                    out[field] = fresh[field]
            updated += 1
        merged[key] = out

    added = 0
    merged_norm_keys = {normalize_key(k) for k in merged}
    merged_primaries = {_primary_normalize(k, normalize_key) for k in merged}
    for key, entry in extracted.items():
        if entry.get("type") not in ("Prefix", "Suffix"):
            continue
        if entry.get("weight", 0) <= 0:
            continue
        norm_mod = normalize_key(key)
        norm_eng = normalize_key(entry.get("engMod", ""))
        primary = _primary_normalize(key, normalize_key)
        if (
            norm_mod in merged_norm_keys
            or norm_eng in merged_norm_keys
            or primary in merged_primaries
        ):
            continue
        merged[key] = dict(entry)
        merged_norm_keys.add(norm_mod)
        merged_primaries.add(primary)
        if norm_eng:
            merged_norm_keys.add(norm_eng)
        added += 1

    print(f"canonical マージ: {len(canonical)} 件維持 / 数値更新 {updated} 件 / 新規追加 {added} 件")
    return merged

"""PoE-DB ローカル export から mods.json / stat 翻訳を読み込む。"""

from __future__ import annotations

import json
import re
from pathlib import Path

STAT_DESC_FILES = [
    "map_stat_descriptions.json",
    "atlas_stat_descriptions.json",
    "stat_descriptions.json",
    "heist_stat_descriptions.json",
    # 3.29 Deepwater / 海図
    "deepwater_explicit_stat_descriptions.json",
    "deepwater_implicit_stat_descriptions.json",
    "deepwater_applied_adjacent_stat_descriptions.json",
]


def resolve_poe_db_root(*, require_repoe: bool = True) -> Path:
    here = Path(__file__).resolve().parent
    candidates = [
        here.parent.parent / "PoE-DB",
        here.parent / "PoE-DB",
    ]
    for path in candidates:
        if not path.is_dir():
            continue
        if require_repoe:
            if (path / "data" / "export" / "repoe" / "global" / "mods.json").is_file():
                return path
        elif (path / "data" / "export").is_dir():
            return path
    if require_repoe:
        raise FileNotFoundError(
            "PoE-DB が見つかりません。"
            " data/export/repoe/global/mods.json がある PoE-DB を配置してください。"
            " `uv run ./main.py export-repoe-mods` を先に実行してください。"
        )
    raise FileNotFoundError("PoE-DB が見つかりません。")


def mods_json_path(lang: str) -> Path:
    root = resolve_poe_db_root()
    folder = "japanese" if lang in ("ja", "jp", "japanese") else "global"
    return root / "data" / "export" / "repoe" / folder / "mods.json"


def stat_translations_dir() -> Path:
    return resolve_poe_db_root() / "data" / "export" / "game" / "stat_translations"


def trade_stats_path(lang: str) -> Path:
    root = resolve_poe_db_root(require_repoe=False)
    folder = "japanese" if lang in ("ja", "jp", "japanese") else "global"
    return root / "data" / "export" / "trade" / folder / "stats.json"


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
    """stat_id -> {en, jp}（PoE-DB stat_translations 形式）"""
    root = stat_translations_dir()
    if not root.is_dir():
        raise FileNotFoundError(
            f"stat_translations がありません: {root}\n"
            "PoE-DB で `uv run ./main.py prepare translations` を実行してください。"
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

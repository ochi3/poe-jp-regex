"""PoE-DB ローカル / RePoE Web から mods・stat 翻訳を読み込む（PoE1）。"""

from __future__ import annotations

import json
import os
import re
import urllib.request
from pathlib import Path

from poe_db_source import (
    STAT_DESC_FILES,
    load_mods as load_poe_db_mods,
    load_stat_map as load_poe_db_stat_map,
    resolve_poe_db_root,
)

USER_AGENT = "PoE-JP-Regex-Tool/1.0 (contact: user)"

REPOE_MODS_EN_URL = "https://repoe-fork.github.io/mods.min.json"
REPOE_MODS_JP_URL = "https://repoe-fork.github.io/Japanese/mods.json"
REPOE_STAT_TRANS_EN_URL = "https://repoe-fork.github.io/stat_translations.min.json"
REPOE_STAT_TRANS_JP_URL = "https://repoe-fork.github.io/Japanese/stat_translations.min.json"
REPOE_STAT_TRANS_DIR_EN = "https://repoe-fork.github.io/stat_translations/"
REPOE_STAT_TRANS_DIR_JP = "https://repoe-fork.github.io/Japanese/stat_translations/"


def parse_source_arg(argv: list[str] | None = None) -> str:
    """CLI から --source poe-db|repoe を解釈（既定: poe-db）。"""
    import sys

    args = argv if argv is not None else sys.argv[1:]
    source = "poe-db"
    if "--source" in args:
        idx = args.index("--source")
        if idx + 1 < len(args):
            source = args[idx + 1].lower()
    if source not in ("poe-db", "repoe"):
        raise SystemExit(f"未対応の --source: {source}（poe-db または repoe）")
    return source


def has_flag(argv: list[str] | None, flag: str) -> bool:
    import sys

    args = argv if argv is not None else sys.argv[1:]
    return flag in args


def fetch_json(url: str, tools_dir: str | None = None) -> dict | list | None:
    tools_dir = tools_dir or str(Path(__file__).resolve().parent)
    local_name = url.split("/")[-1]
    if "Japanese" in url:
        local_name = "jp_" + local_name
    else:
        local_name = "en_" + local_name

    if local_name == "en_mods.min.json":
        local_name = "mods.json"
    if local_name == "jp_mods.json":
        local_name = "mods_jp.json"

    local_path = os.path.join(tools_dir, local_name)
    if os.path.exists(local_path):
        print(f"ローカルキャッシュを使用: {local_path}")
        try:
            with open(local_path, encoding="utf-8") as f:
                return json.load(f)
        except OSError as exc:
            print(f"ローカルファイル読込エラー {local_path}: {exc}")

    print(f"取得中: {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        print(f"警告: 取得できませんでした ({url}): {exc}")
        return None


def _normalize_repoe_text(text: str) -> str:
    text = text.replace("{0}", "#").replace("{1}", "#").replace("{2}", "#")
    text = re.sub(r"\[[^|\]]+\|([^\]]+)\]", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]", r"\1", text)
    return text


def build_stat_map_repoe(en_trans_list, jp_trans_list) -> dict[str, dict[str, str]]:
    stat_map: dict[str, dict[str, str]] = {}
    jp_map: dict[tuple[str, ...], str] = {}

    for entry in jp_trans_list or []:
        ids = tuple(sorted(entry.get("ids", [])))
        if not ids:
            continue
        trans = entry.get("Japanese") or entry.get("translations")
        if not trans:
            continue
        text = trans[0].get("string", "")
        jp_map[ids] = _normalize_repoe_text(text)

    for entry in en_trans_list or []:
        ids = tuple(sorted(entry.get("ids", [])))
        if not ids:
            continue
        trans = entry.get("English") or entry.get("translations")
        if not trans or ids not in jp_map:
            continue
        text_en = _normalize_repoe_text(trans[0].get("string", ""))
        for stat_id in ids:
            stat_map[stat_id] = {"en": text_en, "jp": jp_map[ids]}

    return stat_map


def _load_repoe_min_stat_map(tools_dir: str) -> dict[str, dict[str, str]]:
    trans_en = fetch_json(REPOE_STAT_TRANS_EN_URL, tools_dir)
    trans_jp = fetch_json(REPOE_STAT_TRANS_JP_URL, tools_dir)
    if not trans_en or not trans_jp:
        return {}
    stat_map = build_stat_map_repoe(trans_en, trans_jp)
    print(f"  stat 翻訳 (RePoE min.json) … {len(stat_map)} stat")
    return stat_map


def _load_repoe_dir_stat_map(tools_dir: str) -> dict[str, dict[str, str]]:
    stat_map: dict[str, dict[str, str]] = {}
    for filename in STAT_DESC_FILES:
        trans_en = fetch_json(REPOE_STAT_TRANS_DIR_EN + filename, tools_dir)
        trans_jp = fetch_json(REPOE_STAT_TRANS_DIR_JP + filename, tools_dir)
        if trans_en and trans_jp:
            stat_map.update(build_stat_map_repoe(trans_en, trans_jp))
            print(f"  stat 翻訳 (RePoE Web): {filename} … 累計 {len(stat_map)} stat")
    return stat_map


def _load_repoe_stat_map(tools_dir: str) -> dict[str, dict[str, str]]:
    stat_map = _load_repoe_dir_stat_map(tools_dir)
    if stat_map:
        return stat_map
    return _load_repoe_min_stat_map(tools_dir)


def _load_repoe_mods_jp(tools_dir: str) -> dict:
    mods_jp = fetch_json(REPOE_MODS_JP_URL, tools_dir)
    if mods_jp:
        print("mods JA: RePoE Web")
        return mods_jp

    print("警告: RePoE Web の Japanese/mods.json は利用不可。PoE-DB ローカルへフォールバックします。")
    try:
        mods_jp = load_poe_db_mods("ja")
        print("mods JA: PoE-DB ローカル（フォールバック）")
        return mods_jp
    except OSError:
        pass

    local_path = os.path.join(tools_dir, "mods_jp.json")
    if os.path.isfile(local_path):
        print(f"mods JA: {local_path}")
        with open(local_path, encoding="utf-8") as f:
            return json.load(f)

    raise SystemExit(
        "日本語 mods.json を取得できません。"
        " PoE-DB の export-repoe-mods 実行、または tools/mods_jp.json を配置してください。"
    )


def load_mods_and_stat_map(source: str, tools_dir: str | None = None) -> tuple[dict, dict, dict]:
    """source に応じて (mods_en, mods_jp, stat_map) を返す。"""
    tools_dir = tools_dir or str(Path(__file__).resolve().parent)

    if source == "poe-db":
        root = resolve_poe_db_root()
        print(f"データソース: PoE-DB ({root})")
        try:
            stat_map = load_poe_db_stat_map()
        except OSError as exc:
            print(f"警告: PoE-DB stat 翻訳を読めません: {exc}")
            print("警告: RePoE Web stat_translations.min.json にフォールバックします。")
            stat_map = _load_repoe_min_stat_map(tools_dir)
        mods_en = load_poe_db_mods("en")
        try:
            mods_jp = load_poe_db_mods("ja")
        except OSError as exc:
            print(f"警告: PoE-DB 日本語 mods.json を読めません: {exc}")
            mods_jp = _load_repoe_mods_jp(tools_dir)
        return mods_en, mods_jp, stat_map

    print("データソース: RePoE Web (repoe-fork.github.io)")
    mods_en = fetch_json(REPOE_MODS_EN_URL, tools_dir)
    if not mods_en:
        raise SystemExit(f"英語 mods.json の取得に失敗: {REPOE_MODS_EN_URL}")
    print("mods EN: RePoE Web")

    mods_jp = _load_repoe_mods_jp(tools_dir)
    stat_map = _load_repoe_stat_map(tools_dir)
    if not stat_map:
        print("警告: RePoE Web stat 翻訳が空です。PoE-DB stat_translations にフォールバックします。")
        try:
            stat_map = load_poe_db_stat_map()
        except OSError as exc:
            print(f"警告: stat 翻訳フォールバックも失敗: {exc}")

    return mods_en, mods_jp, stat_map

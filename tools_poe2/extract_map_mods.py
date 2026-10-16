import json
import urllib.request
import os
import shutil
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tooling', 'data')))
from mod_identity import find_by_source_id, with_source_id, manual_regex_entry

import re
from change_utils import load_js_object, log_data_changes
from mod_data_source import has_flag, load_mods_and_stat_map, parse_source_arg
from poe2db_source import merge_map_mods_with_canonical, UPDATE_NUMERIC_FIELDS, mod_entry_priority

# 定数
USER_AGENT = 'PoE2-JP-Regex-Tool/1.0 (contact: user)'

STAT_DESC_FILES = [
    'map_stat_descriptions.json',
    'endgame_map_stat_descriptions.json',
    'atlas_stat_descriptions.json',
    'stat_descriptions.json'
]

POE_TRADE_STATS_EN_URL = 'https://www.pathofexile.com/api/trade2/data/stats'
POE_TRADE_STATS_JP_URL = 'https://jp.pathofexile.com/api/trade2/data/stats'

TARGET_STATS = [
    'map_item_drop_quantity_+%',
    'map_item_drop_rarity_+%',
    'map_pack_size_+%',
    'map_map_item_drop_chance_+%',
    'map_number_of_rare_packs_+%',
    'map_number_of_magic_packs_+%',
    'map_monster_potency_+%',
]

# TARGET_STATS の別名 stat_id（PoE2 の _final_from_map 等）
STAT_ID_ALIASES: dict[str, list[str]] = {
    'map_item_drop_quantity_+%': [
        'map_item_drop_quantity_+%',
        'map_item_drop_quantity_+%_final_from_map',
    ],
    'map_item_drop_rarity_+%': [
        'map_item_drop_rarity_+%',
        'map_item_drop_rarity_+%_final_from_map',
    ],
    'map_pack_size_+%': [
        'map_pack_size_+%',
        'map_pack_size_+%_final_from_map',
    ],
    'map_map_item_drop_chance_+%': [
        'map_map_item_drop_chance_+%',
        'map_map_item_drop_chance_+%_final_from_map',
        'map_map_item_drop_chance_+%_final_from_uber_mod',
    ],
    'map_number_of_rare_packs_+%': [
        'map_number_of_rare_packs_+%',
        'map_number_of_magic_and_rare_packs_+%_final_and_rare_monster_modifiers_chance_+%_final_from_map',
    ],
    'map_number_of_magic_packs_+%': [
        'map_number_of_magic_packs_+%',
        'map_number_of_magic_and_rare_packs_+%_final_and_rare_monster_modifiers_chance_+%_final_from_map',
    ],
    'map_monster_potency_+%': [
        'map_monster_potency_+%',
        'map_monster_potency_+%_final_from_map',
    ],
}

# 自動マッチできない特例の手動マッピング (PoE2用)
MANUAL_TRADE_STAT_MAP = {
    "全てのプレイヤーのクールダウン解消レートが#%低下する": "explicit.stat_941368244",
}

# mod名/テキストから除外する汎用マップ統計テキスト（リスト表示は主Mod行のみ、数値はバッジ）
GENERIC_STAT_TEXTS = [
    "このエリアで見つかるアイテムの数量が#%増加する",
    "このエリアで見つかるアイテムの数量が#%上昇する",
    "このエリアで見つかるアイテムのレアリティが#%増加する",
    "このエリアで見つかるアイテムのレアリティが#%上昇する",
    "エリアで見つかるアイテムのレアリティが#%上昇する",
    "パックサイズが#%増加する",
    "パックサイズが#%上昇する",
    "エリアで見つかるウェイストーンの量が#%増加する",
    "エリアで見つかるウェイストーンの量が#%上昇する",
    "ウェイストーンドロップ率: +#%",
    "レアモンスターの数が#%増加する",
    "レアモンスターの数が#%上昇する",
    "マジックモンスターの数が#%増加する",
    "マジックモンスターの数が#%上昇する",
    "マジックおよびレアモンスターの数が#%上昇する",
    "レアモンスターはモンスターモッドを持つ確率が#%上昇する",
    "モンスターはエフェクティブが#%増加する",
    "モンスターはエフェクティブが#%上昇する",
    "#% increased Quantity of Items found in this Area",
    "#% more Quantity of Items found in this Area",
    "#% increased Rarity of Items found in this Area",
    "#% more Rarity of Items found in this Area",
    "#% increased Pack size",
    "#% more Pack size",
    "#% increased Waystones found in Area",
    "#% more Waystones found in Area",
    "Waystone Drop Chance: +#%",
    "#% increased number of Rare Monsters",
    "#% increased number of Magic Monsters",
    "#% more number of Rare Monsters",
    "#% more number of Magic Monsters",
    "#% more Magic and Rare Monsters",
    "Rare Monsters have #% more chance of Monster Modifiers",
    "Monsters have #% increased Effectiveness",
    "Monsters have #% more Effectiveness",
]

def stat_max_from_mod(stats: list, stat_ids: list[str], *, should_flip: bool) -> int:
    """stats から stat_id 群の最大値を返す（デバフ stat は絶対値化）。"""
    best = 0
    for s_id in stat_ids:
        for s in stats:
            if s['id'] != s_id:
                continue
            val = s.get('max', 0)
            if should_flip and val < 0:
                val = abs(val)
            if val > best:
                best = val
    return best


def format_stat_value_range(min_v: int, max_v: int, *, flip_debuff: bool) -> str:
    """stat の min/max を value 文字列に。デバフ stat のみ正の表示範囲へ反転。"""
    if flip_debuff and max_v <= 0 and min_v <= 0:
        min_v, max_v = abs(min_v), abs(max_v)
    if min_v == max_v:
        return str(min_v)
    low, high = sorted([min_v, max_v])
    return f"{low}-{high}"


def fetch_json(url):
    """URLからJSONを取得。同名のローカルファイルがある場合はそれを優先する。"""
    # ローカルファイル名の推定
    local_name = url.split('/')[-1]
    if "Japanese" in url:
        local_name = "jp_" + local_name
    else:
        local_name = "en_" + local_name
        
    if local_name == "en_mods.json": local_name = "mods.json"
    if local_name == "jp_mods.json": local_name = "mods_jp.json"
    
    local_path = os.path.join(os.path.dirname(__file__), local_name)
    if os.path.exists(local_path):
        print(f"ローカルファイルを使用: {local_path}")
        try:
            with open(local_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"ローカルファイル読込エラー {local_path}: {e}")

    print(f"取得中: {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"取得エラー {url}: {e}")
        return None

def build_stat_map_poe2(en_trans_list, jp_trans_list):
    """PoE2の統計翻訳リストから stat_id -> {en, jp} のマップを構築する"""
    stat_map = {}
    
    # 日本語版をベースにIDマップを作成
    jp_map = {}
    for entry in jp_trans_list:
        ids = tuple(sorted(entry.get('ids', [])))
        if not ids: continue
        trans = entry.get('Japanese')
        if trans:
            # 最初の翻訳を採用（簡易化のため）
            text = trans[0].get('string', '')
            text = text.replace('{0}', '#').replace('{1}', '#').replace('{2}', '#')
            # 独自マークアップの除去 [Rarity|レアリティ] -> レアリティ
            text = re.sub(r'\[[^|\]]+\|([^\]]+)\]', r'\1', text)
            # [Rarity] 形式は Rarity のまま残す
            text = re.sub(r'\[([^\]]+)\]', r'\1', text)
            jp_map[ids] = text
            
    # 英語版からテキストを取得して結合
    for entry in en_trans_list:
        ids = tuple(sorted(entry.get('ids', [])))
        if not ids: continue
        trans = entry.get('English')
        if trans and ids in jp_map:
            text_en = trans[0].get('string', '')
            text_en = text_en.replace('{0}', '#').replace('{1}', '#').replace('{2}', '#')
            text_en = re.sub(r'\[([^\]]+)\]', r'\1', text_en)
            
            for stat_id in ids:
                stat_map[stat_id] = {
                    'en': text_en,
                    'jp': jp_map[ids]
                }
    return stat_map

def clean_and_placeholder(text):
    """テキスト内の数値を # に置換し、汎用行をフィルタリングします。また、[|] 形式のマークアップをクリーンアップします。"""
    if not text:
        return ""
    
    # 改行の標準化
    text = text.replace('\\n', '\n').replace('\r', '')
    
    # [Rarity|レアリティ] -> レアリティ、[Rarity] 形式は Rarity のまま残す
    text = re.sub(r'\[[^|\]]+\|([^\]]+)\]', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]', r'\1', text)
    
    lines = text.split('\n')
    
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # 数値を # に置換
        line_placeholder = re.sub(r'-?\d+(\.\d+)?', '#', line).strip()
        
        if line_placeholder in GENERIC_STAT_TEXTS:
            continue
            
        cleaned_lines.append(line_placeholder)
    
    if not cleaned_lines and lines:
        # すべてが汎用的な場合
        res = re.sub(r'-?\d+(\.\d+)?', '#', lines[0].strip())
        res = re.sub(r'\[[^|\]]+\|([^\]]+)\]', r'\1', res)
        res = re.sub(r'\[([^\]]+)\]', r'\1', res)
        return res
        
    return "|".join(cleaned_lines)


def _line_is_generic(line: str) -> bool:
    """1行が汎用マップ統計かどうか（表示から除外）。"""
    line = line.strip()
    if not line:
        return True
    line_ph = re.sub(r'\(##\)', '#', line)
    line_ph = re.sub(r'#{2,}', '#', line_ph)
    line_ph = re.sub(r'-?\d+(\.\d+)?', '#', line_ph)
    return line_ph in GENERIC_STAT_TEXTS


def strip_generic_pipe_lines(mod_list: dict) -> int:
    """mod / engMod からウェイストーン等の汎用行を除去する。"""
    changed = 0
    for entry in mod_list.values():
        for field in ('mod', 'engMod'):
            text = entry.get(field, '')
            if not text or '|' not in text:
                continue
            parts = [p.strip() for p in text.split('|') if p.strip() and not _line_is_generic(p)]
            if not parts:
                parts = [text.split('|', 1)[0].strip()]
            new_text = '|'.join(parts)
            if new_text != text:
                entry[field] = new_text
                changed += 1
    return changed


def remove_duplicate_primary_keys(mod_list: dict) -> int:
    """先頭行と同一の Mod が既にある pipe キー重複を削除する。"""
    removed = 0
    for key in list(mod_list.keys()):
        if '|' not in key:
            continue
        primary = key.split('|', 1)[0]
        if primary in mod_list and primary != key:
            del mod_list[key]
            removed += 1
    return removed


def _entry_keep_score(key: str, entry: dict) -> float:
    """重複 mod 文のとき、Prefix/Suffix（weight>0）を優先して残す。"""
    score = 0.0
    gen = entry.get('type', '').lower()
    if gen in ('prefix', 'suffix'):
        score += 200
    score += min(entry.get('weight', 0) or 0, 10) * 10
    if entry.get('Regex'):
        score += 50
    if entry.get('engRegex'):
        score += 25
    score -= len(key) * 0.001
    return score


def remove_mod_text_duplicates(mod_list: dict) -> int:
    """mod 表示文が同一の冗長エントリを統合する（数値は大きい方を採用）。"""
    removed = 0
    groups: dict[str, list[str]] = {}
    for key, entry in mod_list.items():
        mod = entry.get('mod', key)
        groups.setdefault(normalize_mod_key(mod), []).append(key)

    for keys in groups.values():
        if len(keys) < 2:
            continue
        keys.sort(key=lambda k: -_entry_keep_score(k, mod_list[k]))
        keeper = keys[0]
        for drop in keys[1:]:
            for field in UPDATE_NUMERIC_FIELDS:
                fresh_val = mod_list[drop].get(field)
                if fresh_val is None:
                    continue
                if field.startswith('map_') and isinstance(fresh_val, (int, float)):
                    old = mod_list[keeper].get(field, 0) or 0
                    mod_list[keeper][field] = max(old, fresh_val)
                else:
                    mod_list[keeper][field] = fresh_val
            del mod_list[drop]
            removed += 1
    return removed


def normalize_mod_key(key):
    normalized = re.sub(r'\([+\-]?[\d#]+(?:[~\-][+\-]?[\d#]+)?\)', '#', key)
    normalized = re.sub(r'-?\d+(\.\d+)?', '#', normalized)
    normalized = re.sub(r'#{2,}', '#', normalized)
    return normalized.strip()

def normalize_for_trade(text):
    if not text:
        return ""
    normalized = re.sub(r'\([+\-]?[\d#]+(?:[~\-][+\-]?[\d#]+)?\)', '#', text)
    normalized = re.sub(r'[+\-]?\d+(\.\d+)?', '#', normalized)
    normalized = re.sub(r'[+\-]#', '#', normalized)
    normalized = re.sub(r'#{2,}', '#', normalized)
    normalized = normalized.replace('\n', ' ').replace('\r', '').strip()
    return normalized

def fetch_trade_stat_map(url):
    """トレードAPIからステータスを取得。カレントディレクトリにキャッシュを保存して再利用する。"""
    cache_name = "trade_stats_en.json" if "www.pathofexile.com" in url else "trade_stats_jp.json"
    cache_path = os.path.join(os.path.dirname(__file__), cache_name)
    
    if os.path.exists(cache_path):
        print(f"キャッシュ済み trade stats を使用: {cache_path}")
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return _parse_trade_stats(data)
        except Exception as e:
            print(f"キャッシュ読込エラー: {e}")

    print(f"trade stat ID を取得中: {url}...")
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read().decode('utf-8')
            data = json.loads(content)
            # キャッシュに保存
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return _parse_trade_stats(data)
    except Exception as e:
        print(f"警告: trade stat ID を取得できませんでした ({url}): {e}")
        return {}

def _parse_trade_stats(data):
    stat_map = {}
    total = 0
    for group in data.get('result', []):
        for entry in group.get('entries', []):
            stat_id = entry.get('id', '')
            raw_text = entry.get('text', '')
            if not stat_id or not raw_text:
                continue

            key = normalize_for_trade(raw_text)
            if key and key not in stat_map:
                stat_map[key] = stat_id

            raw_stripped = raw_text.strip()
            if raw_stripped and raw_stripped not in stat_map:
                stat_map[raw_stripped] = stat_id

            total += 1

    print(f"  trade stat 読込: {total}件（ユニークキー {len(stat_map)}件）")
    return stat_map

def find_trade_stat_id_single(eng_line, jp_line, trade_stat_map_en, trade_stat_map_jp):
    def search_line(text, stat_map):
        if not text or not stat_map:
            return ""
        if text in stat_map:
            return stat_map[text]
        key = normalize_for_trade(text)
        if key in stat_map:
            return stat_map[key]
        key_no_sign = re.sub(r'[+\-]', '', key).strip()
        if key_no_sign in stat_map:
            return stat_map[key_no_sign]
        return ""

    result = search_line(eng_line, trade_stat_map_en)
    if not result:
        result = search_line(jp_line, trade_stat_map_jp)
    return result

def find_trade_stat_ids(eng_mod_text, jp_mod_text, trade_stat_map_en, trade_stat_map_jp):
    clean_eng = (eng_mod_text or '').strip()
    clean_jp  = (jp_mod_text  or '').strip()

    eng_lines = [l.strip() for l in clean_eng.split('|')] if clean_eng else []
    jp_lines  = [l.strip() for l in clean_jp.split('|')]  if clean_jp  else []

    n = max(len(eng_lines), len(jp_lines), 1)
    eng_lines += [''] * (n - len(eng_lines))
    jp_lines  += [''] * (n - len(jp_lines))

    ids = []
    for eng_line, jp_line in zip(eng_lines, jp_lines):
        result = find_trade_stat_id_single(eng_line, jp_line, trade_stat_map_en, trade_stat_map_jp)

        if not result and jp_line:
            normalized_jp = re.sub(r'-?\d+(\.\d+)?', '#', jp_line)
            result = (MANUAL_TRADE_STAT_MAP.get(normalized_jp)
                      or MANUAL_TRADE_STAT_MAP.get(jp_line)
                      or "")

        ids.append(result)

    return ids

WAYSTONE_GENERATION_TYPES = {"prefix", "suffix", "unique"}
TEST_MOD_ID_SUBSTRINGS = ("qweMapModsForPOE2StartHere",)


def is_waystone_area_mod(m_id: str, m_data_en: dict) -> bool:
    if m_data_en.get("domain") != "area":
        return False
    if m_data_en.get("generation_type") not in WAYSTONE_GENERATION_TYPES:
        return False
    if any(token in m_id for token in TEST_MOD_ID_SUBSTRINGS):
        return False
    return bool(m_data_en.get("stats"))


def load_existing_mod_list(file_path):
    if not os.path.exists(file_path):
        return {}

    print(f"既存 mod リストを読込: {file_path}...")
    existing_data = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start != -1 and json_end != 0:
            json_str = content[json_start:json_end]
            data = json.loads(json_str)

            for mod_key, details in data.items():
                normalized_key = normalize_mod_key(mod_key)
                if normalized_key not in existing_data:
                    existing_data[normalized_key] = {
                        'tier': details.get('tier', 0),
                        'engRegex': details.get('engRegex', ""),
                        'Regex': details.get('Regex', ""),
                        'tradeStatIds': details.get('tradeStatIds', [])
                    }
    except Exception as e:
        print(f"既存 mod リスト解析エラー: {e}")
        
    return existing_data

def main():
    source = parse_source_arg()
    merge_canonical = not has_flag(None, "--full-replace")

    tools_dir = os.path.dirname(__file__)
    output_path = os.path.join(tools_dir, '../poe2_scripts/map_mods.js')
    old_output_data = load_js_object(output_path)
    backup_path = os.path.join(tools_dir, '../poe2_scripts/map_mods_backup.js')
    
    if os.path.exists(output_path):
        print(f"既存 map_mods.js をバックアップ: {backup_path}...")
        shutil.copy2(output_path, backup_path)

    existing_mods = load_existing_mod_list(output_path)

    # トレードステータスIDマップをフェッチ
    trade_stat_map_en = fetch_trade_stat_map(POE_TRADE_STATS_EN_URL)
    trade_stat_map_jp = fetch_trade_stat_map(POE_TRADE_STATS_JP_URL)

    mods_en, mods_jp, global_stat_map = load_mods_and_stat_map(source, tools_dir)

    result_mod_list = {}
    mod_source_ids: dict[str, str] = {}
    count = 0
    trade_matched = 0

    NEG_WORDS = ['低下', '減少', 'less', 'reduced']

    for m_id, m_data_en in mods_en.items():
        if not is_waystone_area_mod(m_id, m_data_en):
            continue

        max_weight = 0
        for sw in m_data_en.get("spawn_weights", []):
            weight = sw.get("weight", 0)
            if weight > 0:
                max_weight = max(max_weight, weight)

        m_data_jp = mods_jp.get(m_id, {})
        
        full_jp = m_data_jp.get('text', "")
        full_en = m_data_en.get('text', "")
        
        stats = m_data_en.get('stats', [])
        if not stats: continue

        if not full_jp or not full_en:
            jp_texts = []
            en_texts = []
            for s in stats:
                stat_info = global_stat_map.get(s['id'])
                if stat_info:
                    en_texts.append(stat_info['en'])
                    jp_texts.append(stat_info['jp'])
            full_jp = "|".join(jp_texts)
            full_en = "|".join(en_texts)
        else:
            full_jp = clean_and_placeholder(full_jp)
            full_en = clean_and_placeholder(full_en)

        if not full_jp: continue

        should_flip = any(w in full_jp or w.lower() in full_en.lower() for w in NEG_WORDS)

        # 数値範囲（デバフ stat のみ符号反転、ウェイストーン等ボーナスはそのまま）
        val_texts = []
        for s in stats:
            min_v = s.get('min', 0)
            max_v = s.get('max', 0)
            flip_debuff = should_flip and max_v <= 0 and min_v <= 0
            val_texts.append(format_stat_value_range(min_v, max_v, flip_debuff=flip_debuff))
        
        full_val = "|".join(val_texts)

        mod_stats_values = {}
        for s_id in TARGET_STATS:
            aliases = STAT_ID_ALIASES.get(s_id, [s_id])
            mod_stats_values[s_id] = stat_max_from_mod(stats, aliases, should_flip=should_flip)

        # トレード ID 検索
        existing_key = normalize_mod_key(full_jp)
        existing = existing_mods.get(existing_key, {})
        existing = find_by_source_id(old_output_data, m_id) or existing
        
        existing_trade_ids = existing.get('tradeStatIds', [])
        new_trade_ids = find_trade_stat_ids(full_en, full_jp, trade_stat_map_en, trade_stat_map_jp)

        n = max(len(existing_trade_ids), len(new_trade_ids))
        existing_trade_ids += [''] * (n - len(existing_trade_ids))
        new_trade_ids      += [''] * (n - len(new_trade_ids))
        trade_stat_ids = [
            existing_id if existing_id else new_id
            for existing_id, new_id in zip(existing_trade_ids, new_trade_ids)
        ]

        if any(trade_stat_ids):
            trade_matched += 1

        regex_previous = manual_regex_entry(old_output_data, m_id, full_jp, full_en)
        gen_type = m_data_en.get('generation_type', "").capitalize()
        
        entry = {
            "mod": full_jp,
            "engMod": full_en,
            "value": full_val,
            "type": gen_type,
            "weight": max_weight,
            "tier": existing.get("tier", 0),
            "engRegex": regex_previous.get('engRegex', ""),
            "Regex": regex_previous.get('Regex', ""),
            "tradeStatIds": trade_stat_ids
        }
        with_source_id(entry, m_id, result_mod_list.get(full_jp))
        entry.update(mod_stats_values)

        prev = result_mod_list.get(full_jp)
        prev_id = mod_source_ids.get(full_jp, '')
        if prev is None or mod_entry_priority(entry, m_id) > mod_entry_priority(prev, prev_id):
            result_mod_list[full_jp] = entry
            mod_source_ids[full_jp] = m_id
        if full_jp in result_mod_list:
            result_mod_list[full_jp]['sourceIds'] = entry['sourceIds']
        count += 1

    print(f"抽出 Mod 数（生）: {count}")
    print(f"trade stat ID マッチ: {trade_matched} / {count}")

    if merge_canonical:
        result_mod_list = merge_map_mods_with_canonical(
            result_mod_list, old_output_data, normalize_mod_key
        )
        stripped = strip_generic_pipe_lines(result_mod_list)
        removed = remove_duplicate_primary_keys(result_mod_list)
        deduped = remove_mod_text_duplicates(result_mod_list)
        print(
            f"表示整理: 汎用行除去 {stripped} 件 / 重複キー削除 {removed} 件 / mod文重複 {deduped} 件"
        )
        print(f"出力 Mod 数: {len(result_mod_list)}")
    else:
        print(f"出力 Mod 数（full-replace）: {len(result_mod_list)}")
        print("警告: --full-replace のため既存44件リストは上書きされます。")

    # tradeStatIds に空があるmodをログ出力
    unmatched_any = [
        entry for entry in result_mod_list.values()
        if not all(entry.get("tradeStatIds", [""]))
    ]
    if unmatched_any:
        print(f"\n--- tradeStatIds 未マッチあり: {len(unmatched_any)}件 ---")
        for entry in unmatched_any:
            ids = entry.get('tradeStatIds', [])
            jp_lines = entry['mod'].split('|')
            for i, (jp_line, stat_id) in enumerate(zip(jp_lines, ids + [''] * len(jp_lines))):
                if not stat_id:
                    jp_norm = re.sub(r'-?\d+(\.\d+)?', '#', jp_line.strip())
                    print(f'    # "{jp_norm}": "",')
        print("---")

    json_data = json.dumps(result_mod_list, ensure_ascii=False, indent=2)
    source_note = "PoE2-DB" if source == "poe2db" else "RePoE Web"
    content = (
        f"// tools_poe2/extract_map_mods.py によって自動生成されました ({source_note})\n"
        f"const mapModList = {json_data};\n"
    )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    log_data_changes(old_output_data, result_mod_list, "poe2 mapModList", normalize=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"保存先: {output_path}")

if __name__ == '__main__':
    main()

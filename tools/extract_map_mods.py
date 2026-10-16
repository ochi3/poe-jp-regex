import json
import urllib.request
import os
import shutil
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tooling', 'data')))
from mod_identity import find_by_source_id, with_source_id, manual_regex_entry
from mod_details import attach_mod_details

import re
from mod_data_source import load_mods_and_stat_map, parse_source_arg
from poe_db_source import trade_stats_path

TARGET_STATS = [
    'map_item_drop_quantity_+%',
    'map_item_drop_rarity_+%',
    'map_pack_size_+%',
    'map_map_item_drop_chance_+%_final_from_uber_mod',
    'map_currency_drop_chance_+%_final_from_uber_mod',
    'map_scarab_drop_chance_+%_final_from_uber_mod'
]

USER_AGENT = 'PoE-JP-Regex-Tool/1.0 (contact: user)'
POE_TRADE_STATS_EN_URL = 'https://www.pathofexile.com/api/trade/data/stats'
POE_TRADE_STATS_JP_URL = 'https://jp.pathofexile.com/api/trade/data/stats'

# 自動マッチできない特例の手動マッピング
# キー: 自分のデータ上のテキスト（(T17)プレフィックスなし・数値は#に置換済み）
# 値: 公式トレードサイトの stat ID
# stat IDはトレードサイトで該当modを検索し、開発者ツール(Network tab)で確認できます
MANUAL_TRADE_STAT_MAP = {
    "全てのプレイヤーのクールダウン解消レートが#%低下する": "explicit.stat_941368244",
    "全てのプレイヤーはスキルによる呪い以外のオーラの効果が#%減少する": "explicit.stat_2450628570",
    "全てのプレイヤーの命中力が#%低下する": "explicit.stat_3667574329",
    "プレイヤーはリーチによるライフ、マナおよびエナジーシールドの最大合計回復量が(##)%減少する": "explicit.stat_2946888410",
    "レアモンスターはボラタイルコアを持つ": "explicit.stat_1706239920",
    "プレイヤーはフラスコを使用した時に隕石の対象となる": "explicit.stat_4102870672",
    "プレイヤーの防御力が(##)%低下する": "explicit.stat_943960754",
    "プレイヤーは適用されるフラスコの効果が#%低下する": "explicit.stat_1207482628",
    "モンスターはヒット時にフレンジーチャージを#個獲得する": "explicit.stat_1742567045",
    "モンスターはヒット時にエンデュランスチャージを#個獲得する": "explicit.stat_687813731",
    "モンスターはヒット時にパワーチャージを#個獲得する": "explicit.stat_406353061",
    "モンスターはヒット時に盲目を付与する": "explicit.stat_1629869774",
    "モンスターはアタックによるヒット時に重傷を付与する": "explicit.stat_4164174520",
    "モンスターはスペルによるヒット時に阻害を付与する": "explicit.stat_962720646",
    "モンスターはヒット時にパワーチャージ、フレンジーチャージおよびエンデュランスチャージのスタックを盗む": "explicit.stat_3222482040",
}

# mod名/テキストから除外する汎用マップ統計テキスト
GENERIC_STAT_TEXTS = [
    "このエリアで見つかるアイテムの数量が#%増加する",
    "このエリアで見つかるアイテムのレアリティが#%増加する",
    "パックサイズが#%増加する",
    "エリアで見つかるスカラベの量が#%上昇する",
    "エリアで見つかるカレンシーの量が#%上昇する",
    "エリアで見つかるマップの量が#%上昇する",
    "#% increased Quantity of Items found in this Area",
    "#% increased Rarity of Items found in this Area",
    "#% increased Pack size",
    "#% more Scarabs found in Area",
    "#% more Currencies found in Area",
    "#% more Maps found in Area",
    "#% more Scarab found in Area",
    "#% more Currency found in Area",
    "#% more Map found in Area",
    "#% more Scarabs found in this Area",
    "#% more Currencies found in this Area",
    "#% more Maps found in this Area",
    "#% more Scarab found in this Area",
    "#% more Currency found in this Area",
    "#% more Map found in this Area"
]

def fetch_json(url):
    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def build_stat_map(translations):
    stat_map = {}
    for entry in translations:
        ids = entry.get('ids', [])
        trans_list = entry.get('English') or entry.get('Japanese') or entry.get('translations') or []
        if trans_list:
            text = trans_list[0].get('string', '')
            text = text.replace('{0}', '#').replace('{1}', '#').replace('{2}', '#')
            text = text.replace('\n', ' ')
            for stat_id in ids:
                stat_map[stat_id] = text
    return stat_map

def _line_display_value(line: str) -> str:
    """表示行からサイト表示用の数値文字列を1つ取り出す。

    formatModText は行ごとに value の1要素を使うため、
    範囲 (90-110) はまとめて、単一値は先頭の意味ある数値を返す。
    """
    # (90-110) / (20-50) のような範囲を優先
    range_match = re.search(r'\((-?\d+(?:\.\d+)?)\s*[-~]\s*(-?\d+(?:\.\d+)?)\)', line)
    if range_match:
        low, high = sorted([float(range_match.group(1)), float(range_match.group(2))], key=float)
        # 整数なら整数表記
        def fmt(n):
            return str(int(n)) if float(n).is_integer() else str(n)
        return f"{fmt(low)}-{fmt(high)}"

    nums = re.findall(r'-?\d+(?:\.\d+)?', line)
    if not nums:
        return ""
    # フラグ的な 1 だけの行は表示置換しない（formatModText も '1' を無視）
    if len(nums) == 1 and nums[0] in ("1", "0"):
        return nums[0]
    # 複数ある場合は最初の「効果値らしい」もの（1/0 以外を優先）
    for n in nums:
        if n not in ("1", "0"):
            return n
    return nums[0]


def clean_and_placeholder(text):
    """テキスト内の数値を # に置換し、汎用行をフィルタリングします。"""
    cleaned, _values = clean_and_placeholder_with_values(text)
    return cleaned


def clean_and_placeholder_with_values(text):
    """表示テキストと、行対応の value 文字列を同時に返す。"""
    if not text:
        return "", ""
    # 改行の標準化
    text = text.replace('\\n', '\n').replace('\r', '')
    lines = text.split('\n')

    cleaned_lines = []
    value_parts = []
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # "20%" や "60%低下" などの数値を # に置換
        # GENERIC_STAT_TEXTS との比較用
        line_placeholder = re.sub(r'-?\d+(\.\d+)?', '#', line).strip()

        if line_placeholder in GENERIC_STAT_TEXTS:
            continue

        cleaned_lines.append(line_placeholder)
        value_parts.append(_line_display_value(line))

    if not cleaned_lines and lines:
        # すべてが汎用的な場合 (例: MapPureQuantity mod)
        # 空のキーを避けるため、フォールバックとして最初の行を返す
        first = lines[0].strip()
        return re.sub(r'-?\d+(\.\d+)?', '#', first), _line_display_value(first)

    return "|".join(cleaned_lines), "|".join(value_parts)

def normalize_mod_key(key):
    """
    modキーを正規化して新旧フォーマットの差異を吸収する。
    旧: モンスターのライフが#%上昇する
    新: モンスターのライフが(##)%上昇する
    → 両方とも「モンスターのライフが#%上昇する」に統一
    """
    # 括弧付き範囲表記を # に統一: (20-60) / (#-#) / (##) / (#) → #
    normalized = re.sub(r'\([+\-]?[\d#]+(?:[~\-][+\-]?[\d#]+)?\)', '#', key)
    # T17 / 隣接 のような表示用プレフィックスは既存データとの照合では無視
    normalized = re.sub(r'^\s*\(T17\)\s*', '', normalized)
    normalized = re.sub(r'^\s*\(隣接\)\s*', '', normalized)
    normalized = re.sub(r'^\s*\(Adjacent\)\s*', '', normalized, flags=re.IGNORECASE)
    # 残った数値も # に統一
    normalized = re.sub(r'-?\d+(\.\d+)?', '#', normalized)
    # 連続する # を1つに
    normalized = re.sub(r'#{2,}', '#', normalized)
    return normalized.strip()

def make_existing_entry(details):
    return {
        'tier': details.get('tier', 0),
        'weight': details.get('weight', 0),
        'engRegex': details.get('engRegex', ""),
        'Regex': details.get('Regex', ""),
        'tradeStatIds': details.get('tradeStatIds', [])
    }

def existing_entry_score(entry):
    """既存値として有用な情報が多い方を優先するためのスコア。"""
    score = 0
    if entry.get('Regex'):
        score += 100
    if entry.get('engRegex'):
        score += 100
    if entry.get('tier'):
        score += 10
    if entry.get('weight'):
        score += 5
    score += len([x for x in entry.get('tradeStatIds', []) if x])
    return score

def put_existing_entry(index, key, entry):
    if not key:
        return
    current = index.get(key)
    if current is None or existing_entry_score(entry) > existing_entry_score(current):
        index[key] = entry

def empty_existing_indexes():
    return {
        'by_key': {},
        'by_eng': {},
        'by_trade': {},
        'parse_errors': 0
    }

def extract_js_object_text(content):
    json_start = content.find('{')
    json_end = content.rfind('}') + 1
    if json_start == -1 or json_end == 0:
        return ""
    return content[json_start:json_end]

def parse_js_object_text(object_text):
    """JS生成ファイルをJSONとして読む。配列/オブジェクト末尾カンマを許容する。"""
    cleaned = re.sub(r',\s*([}\]])', r'\1', object_text)
    return json.loads(cleaned)

def load_existing_mod_list(file_path, existing_data=None):
    """scripts/map_mods.js を解析して、各 mod の tier, engRegex, Regex を抽出します。
    JS の代入部分を削除して、'const mapModList = {...};' フォーマットを読み取ります。
    """
    if not os.path.exists(file_path):
        print(f"Existing mod list not found: {file_path}")
        return existing_data or empty_existing_indexes()

    print(f"Loading existing mod list from {file_path}...")
    existing_data = existing_data or empty_existing_indexes()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 'const mapModList = { ... };' から JSON 部分を抽出
        json_str = extract_js_object_text(content)
        if json_str:
            data = parse_js_object_text(json_str)

            for mod_key, details in data.items():
                entry = make_existing_entry(details)

                normalized_key = normalize_mod_key(mod_key)
                put_existing_entry(existing_data['by_key'], normalized_key, entry)

                normalized_eng = normalize_mod_key(details.get('engMod', ''))
                put_existing_entry(existing_data['by_eng'], normalized_eng, entry)

                trade_ids = tuple(x for x in details.get('tradeStatIds', []) if x)
                put_existing_entry(existing_data['by_trade'], trade_ids, entry)
    except Exception as e:
        print(f"Error parsing existing mod list: {e}")
        existing_data['parse_errors'] = existing_data.get('parse_errors', 0) + 1
        
    return existing_data

def count_existing_regex_fields(file_path):
    if not os.path.exists(file_path):
        return 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        json_str = extract_js_object_text(content)
        if not json_str:
            return 0
        data = parse_js_object_text(json_str)
        return sum(
            1
            for details in data.values()
            if details.get('Regex') or details.get('engRegex')
        )
    except Exception:
        return 0

def count_regex_fields_in_data(data):
    return sum(
        1
        for details in data.values()
        if details.get('Regex') or details.get('engRegex')
    )

def load_js_object_data(file_path):
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        json_str = extract_js_object_text(content)
        if not json_str:
            return {}
        return parse_js_object_text(json_str)
    except Exception as e:
        print(f"Warning: Could not load change comparison data from {file_path}: {e}")
        return {}

def build_comparison_index(data):
    index = {}
    for key, value in data.items():
        normalized = normalize_mod_key(key)
        if normalized:
            index[normalized] = (key, value)
    return index

def log_generation_changes(old_data, new_data, limit=60):
    old_index = build_comparison_index(old_data)
    new_index = build_comparison_index(new_data)

    old_keys = set(old_index.keys())
    new_keys = set(new_index.keys())
    added = sorted(new_keys - old_keys)
    removed = sorted(old_keys - new_keys)

    watched_fields = [
        "mod",
        "engMod",
        "value",
        "type",
        "weight",
        "tier",
        "engRegex",
        "Regex",
        "tradeStatIds",
        *TARGET_STATS,
        "modTier17",
    ]

    changed = []
    for key in sorted(old_keys & new_keys):
        old_name, old_entry = old_index[key]
        new_name, new_entry = new_index[key]
        field_changes = []
        for field in watched_fields:
            if old_entry.get(field) != new_entry.get(field):
                field_changes.append(field)
        if field_changes:
            changed.append((new_name or old_name, field_changes))

    total = len(added) + len(removed) + len(changed)
    print("\n--- Change summary ---")
    print(f"Added: {len(added)}, Removed: {len(removed)}, Changed: {len(changed)}")

    printed = 0
    for key in added:
        if printed >= limit:
            break
        print(f"[ADD] {new_index[key][0]}")
        printed += 1

    for key in removed:
        if printed >= limit:
            break
        print(f"[REMOVE] {old_index[key][0]}")
        printed += 1

    for name, fields in changed:
        if printed >= limit:
            break
        print(f"[CHANGE] {name}: {', '.join(fields)}")
        printed += 1

    if total > printed:
        print(f"... and {total - printed} more changes")
    if total == 0:
        print("No data changes detected.")
    print("---")

# 文言変更・仕様置換でキーが変わった MOD: 新キー → 旧キー
# weight / tier を旧エントリから引き継ぐ（Regex は新文言用のため引き継がない）
LEGACY_MOD_KEY_ALIASES = {
    # 灼熱の代行者 → シアリング・エグザーク（ローカライズ更新）
    "(T17) エリアにはシアリング・エグザークのルーンが出現する":
        "(T17) エリアには灼熱の代行者のルーンが出現する",
    # %反射 → レアの棘（仕様変更）
    "(T17) レアモンスターは物理の棘を持ち#の物理ダメージを反射する|レアモンスターは元素の棘を持ち#の元素ダメージを反射する":
        "(T17) モンスターは物理ダメージの#%を反射する|モンスターは元素ダメージの#%を反射する",
    "レアモンスターは元素の棘を持ち#の元素ダメージを反射する":
        "モンスターは元素ダメージの#%を反射する",
    "レアモンスターは物理の棘を持ち#の物理ダメージを反射する":
        "モンスターは物理ダメージの#%を反射する",
}


def find_existing_mod(existing_mods, full_jp, full_en, trade_stat_ids):
    """既存の Regex / tier / weight / 手入力 tradeStatIds をできるだけ維持する。"""
    jp_key = normalize_mod_key(full_jp)
    existing = existing_mods.get('by_key', {}).get(jp_key)
    if existing:
        return existing

    en_key = normalize_mod_key(full_en)
    existing = existing_mods.get('by_eng', {}).get(en_key)
    if existing:
        return existing

    trade_key = tuple(x for x in trade_stat_ids if x)
    if trade_key:
        existing = existing_mods.get('by_trade', {}).get(trade_key)
        if existing:
            return existing

    return {}


def find_legacy_mod(existing_mods, full_jp):
    """改名・仕様置換前の旧キーから weight / tier 引き継ぎ用エントリを探す。"""
    jp_key = normalize_mod_key(full_jp)
    legacy_key = LEGACY_MOD_KEY_ALIASES.get(full_jp) or LEGACY_MOD_KEY_ALIASES.get(jp_key)
    if not legacy_key:
        return {}
    legacy = existing_mods.get('by_key', {}).get(normalize_mod_key(legacy_key))
    return legacy or {}

def normalize_for_trade(text):
    """
    トレードAPIのstatテキストと比較するための正規化。
    数値を # に置換し、改行を除去する。

    以下のパターンをすべて # に統一する:
      - 数値リテラル: 20, -20, 3.5
      - 符号付きプレースホルダー: +#, -#
      - 括弧付き範囲表記: (20-60), (#-#), (##), (#)
    """
    if not text:
        return ""
    # 括弧付き範囲表記を先に除去: (20-60) / (#-#) / (##) / (#) → #
    normalized = re.sub(r'\([+\-]?[\d#]+(?:[~\-][+\-]?[\d#]+)?\)', '#', text)
    # 数値（小数・負数含む）を # に統一
    normalized = re.sub(r'[+\-]?\d+(\.\d+)?', '#', normalized)
    # +# / -# の符号付きプレースホルダーも # に統一
    normalized = re.sub(r'[+\-]#', '#', normalized)
    # 連続する # をひとつに（(##) → ## → # のケース）
    normalized = re.sub(r'#{2,}', '#', normalized)
    # 改行を除去してフラットに
    normalized = normalized.replace('\n', ' ').replace('\r', '').strip()
    return normalized

def fetch_trade_stat_map(url):
    """
    指定したトレードAPIのURLからstat一覧を取得し、
    正規化テキスト → stat ID のマップを返す。
    PoE-DB の export/trade/*/stats.json を優先し、次に tools キャッシュ、最後に API。
    """
    lang = "en" if "www.pathofexile.com" in url else "jp"
    try:
        db_path = trade_stats_path(lang)
        if db_path.is_file():
            print(f"PoE-DB trade stats を使用: {db_path}")
            with open(db_path, encoding="utf-8") as f:
                return _parse_trade_stats(json.load(f))
    except (OSError, FileNotFoundError) as exc:
        print(f"警告: PoE-DB trade stats を読めません: {exc}")

    cache_name = "trade_stats_en.json" if lang == "en" else "trade_stats_jp.json"
    cache_path = os.path.join(os.path.dirname(__file__), cache_name)
    if os.path.exists(cache_path):
        print(f"キャッシュ済み trade stats を使用: {cache_path}")
        try:
            with open(cache_path, encoding="utf-8") as f:
                return _parse_trade_stats(json.load(f))
        except Exception as exc:
            print(f"キャッシュ読込エラー: {exc}")

    print(f"Fetching trade stat IDs from {url}...")
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False)
            return _parse_trade_stats(data)
    except Exception as e:
        print(f"Warning: Could not fetch trade stat IDs from {url}: {e}")
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

    print(f"  Loaded {total} trade stat entries ({len(stat_map)} unique keys).")
    return stat_map

def find_trade_stat_id_single(eng_line, jp_line, trade_stat_map_en, trade_stat_map_jp):
    """
    1行分のテキストに対して stat ID を検索して返す。
    マッチしない場合は空文字を返す。
    """
    def search_line(text, stat_map):
        if not text or not stat_map:
            return ""
        # 1. 生テキストで直接マッチ
        if text in stat_map:
            return stat_map[text]
        # 2. 正規化してマッチ
        key = normalize_for_trade(text)
        if key in stat_map:
            return stat_map[key]
        # 3. 符号を無視して再試行（reduced 系 mod 対策）
        key_no_sign = re.sub(r'[+\-]', '', key).strip()
        if key_no_sign in stat_map:
            return stat_map[key_no_sign]
        return ""

    result = search_line(eng_line, trade_stat_map_en)
    if not result:
        result = search_line(jp_line, trade_stat_map_jp)
    return result


def find_trade_stat_ids(eng_mod_text, jp_mod_text, trade_stat_map_en, trade_stat_map_jp):
    """
    パイプ区切りの各行を個別に stat ID 検索し、ID のリストを返す。
    マッチしなかった行は空文字 "" をリストに入れる。
    英語優先、未マッチなら日本語で補完、最後に手動マッピングを参照。
    """
    # (T17) プレフィックスを除去してから行分割
    clean_eng = re.sub(r'^\(T17\)\s*', '', eng_mod_text or '').strip()
    clean_jp  = re.sub(r'^\(T17\)\s*', '', jp_mod_text  or '').strip()

    eng_lines = [l.strip() for l in clean_eng.split('|')] if clean_eng else []
    jp_lines  = [l.strip() for l in clean_jp.split('|')]  if clean_jp  else []

    # 行数を合わせる（多い方の長さに統一、短い方は空文字で埋める）
    n = max(len(eng_lines), len(jp_lines), 1)
    eng_lines += [''] * (n - len(eng_lines))
    jp_lines  += [''] * (n - len(jp_lines))

    ids = []
    for eng_line, jp_line in zip(eng_lines, jp_lines):
        result = find_trade_stat_id_single(eng_line, jp_line, trade_stat_map_en, trade_stat_map_jp)

        # それでもマッチしない場合は手動マッピングを参照
        if not result and jp_line:
            normalized_jp = re.sub(r'-?\d+(\.\d+)?', '#', jp_line)
            result = (MANUAL_TRADE_STAT_MAP.get(normalized_jp)
                      or MANUAL_TRADE_STAT_MAP.get(jp_line)
                      or "")

        ids.append(result)

    return ids

def main():
    source = parse_source_arg()
    tools_dir = os.path.dirname(__file__)
    existing_mod_list_path = os.path.join(tools_dir, '../scripts/map_mods.js')
    backup_path = os.path.join(tools_dir, '../scripts/map_mods_backup.js')
    old_output_data = load_js_object_data(existing_mod_list_path)

    existing_mods = load_existing_mod_list(existing_mod_list_path)
    existing_mods = load_existing_mod_list(backup_path, existing_mods)
    # 改名前スナップショット（legacy alias 用）
    legacy_snapshot = os.path.join(tools_dir, '../scripts/map_mods.js.before_329update')
    if os.path.exists(legacy_snapshot):
        existing_mods = load_existing_mod_list(legacy_snapshot, existing_mods)

    # 既存の map_mods.js が有用なRegexを持つ場合だけバックアップを更新する。
    # 空Regex状態のファイルで、良いバックアップを上書きしないため。
    current_regex_count = count_existing_regex_fields(existing_mod_list_path)
    backup_regex_count = count_existing_regex_fields(backup_path)
    if existing_mods.get('parse_errors') and max(current_regex_count, backup_regex_count) == 0:
        print("[ERROR] Existing map_mods files could not be parsed, and no Regex fields were readable.")
        print("        Output was not written to avoid clearing existing Regex / tier / weight.")
        raise SystemExit(1)
    if os.path.exists(existing_mod_list_path) and current_regex_count >= backup_regex_count and current_regex_count > 0:
        print(f"Backing up existing map_mods.js to {backup_path}...")
        try:
            shutil.copy2(existing_mod_list_path, backup_path)
            print("Backup successful.")
        except Exception as e:
            print(f"Backup failed: {e}")
            return
    else:
        print(f"Keeping existing backup. current regex fields: {current_regex_count}, backup regex fields: {backup_regex_count}")

    trade_stat_map_en = fetch_trade_stat_map(POE_TRADE_STATS_EN_URL)
    trade_stat_map_jp = fetch_trade_stat_map(POE_TRADE_STATS_JP_URL)

    mods_en, mods_jp, global_stat_map = load_mods_and_stat_map(source, tools_dir)
    if not mods_en or not mods_jp:
        print("Failed to load necessary mod data.")
        return

    result_mod_list = {}
    count = 0
    trade_matched = 0

    # 符号反転をトリガーする否定語
    NEG_WORDS = ['低下', '減少', 'less', 'reduced']

    for m_id, m_data_en in mods_en.items():
        # spawn_weights に基づくフィルタリング
        spawn_weights = m_data_en.get('spawn_weights', [])
        is_normal = False
        is_t17 = False
        max_weight = 0
        
        for sw in spawn_weights:
            tag = sw.get('tag')
            weight = sw.get('weight', 0)
            if weight > 0:
                if tag in ['default', 'top_tier_map']:
                    is_normal = True
                    max_weight = max(max_weight, weight)
                elif tag == 'uber_tier_map':
                    is_t17 = True
                    max_weight = max(max_weight, weight)
        
        # いずれかのティアに属し、ウェイトが 0 より大きい場合のみ処理
        if not (is_normal or is_t17):
            continue
            
        # 基本的なドメイン/タイプのチェック
        if m_data_en.get('domain') != 'area' or m_data_en.get('generation_type') not in ['prefix', 'suffix']:
            continue

        m_data_jp = mods_jp.get(m_id, {})
        
        # 優先順位: mods.json の 'text' フィールド
        full_jp = m_data_jp.get('text', "")
        full_en = m_data_en.get('text', "")
        
        # 最終的なテキストに基づいて符号を反転させるべきか判断
        # ("低下" などを確実に検出するために、クリーンアップ前の生のテキストを使用)
        should_flip = any(w in full_jp or w.lower() in full_en.lower() for w in NEG_WORDS)

        stats = m_data_en.get('stats', [])
        if not stats: continue

        # mods.json のテキスト選択が空の場合、stat_translation にフォールバック
        # 数量/レア/パック等の汎用 stat は表示テキスト・value から除外（バッジ用フィールドに別出し）
        effect_stats = [s for s in stats if s.get('id') not in TARGET_STATS]
        full_val = ""

        if not full_jp or not full_en:
            jp_texts = []
            en_texts = []
            val_texts = []
            for s in effect_stats:
                stat_info = global_stat_map.get(s['id'])
                if not stat_info:
                    continue
                en_texts.append(stat_info['en'])
                jp_texts.append(stat_info['jp'])
                min_v = s.get('min', 0)
                max_v = s.get('max', 0)
                if should_flip:
                    min_v, max_v = -min_v, -max_v
                if min_v == max_v:
                    val_texts.append(str(min_v))
                else:
                    low, high = sorted([min_v, max_v])
                    val_texts.append(f"{low}-{high}")
            full_jp = "|".join(jp_texts)
            full_en = "|".join(en_texts)
            full_val = "|".join(val_texts)
        else:
            # キー入力のために数値を含むテキストをプレースホルダー付きテキストに変換し、汎用行をフィルタリング
            # value は残した表示行から抽出し、数量等とずれないようにする
            full_jp, full_val_jp = clean_and_placeholder_with_values(full_jp)
            full_en, full_val_en = clean_and_placeholder_with_values(full_en)
            # 日本語表示が主なので JP 側の数値を優先（無ければ EN）
            full_val = full_val_jp if any(p not in ("", "1", "0") for p in full_val_jp.split("|")) else full_val_en

        if not full_jp: continue

        # T17 ウェイトに厳密に属する場合、(T17) プレフィックスを追加
        # 注: 一部の mod は両方に属する可能性があります。is_t17 が true の場合、マークします。
        if is_t17 and not full_jp.startswith("(T17)"):
            full_jp = f"(T17) {full_jp}"
            full_en = f"(T17) {full_en}"

        # 対象ステータス (ドロップ数量など) - 必要に応じて反転
        mod_stats_values = {}
        for s_id in TARGET_STATS:
            val = 0
            for s in stats:
                if s['id'] == s_id:
                    val = s.get('max', 0)
                    if should_flip and val < 0:
                        val = abs(val)
                    break
            mod_stats_values[s_id] = val

        # トレード stat ID を検索（パイプ区切り各行ごとに個別検索）
        new_trade_ids = find_trade_stat_ids(full_en, full_jp, trade_stat_map_en, trade_stat_map_jp)
        existing = find_existing_mod(existing_mods, full_jp, full_en, new_trade_ids)
        existing = find_by_source_id(old_output_data, m_id) or existing
        legacy = find_legacy_mod(existing_mods, full_jp)

        # 既存の tradeStatIds があれば優先して引き継ぐ（手入力済み分を保持）
        existing_trade_ids = existing.get('tradeStatIds', [])

        # 行数を合わせて、既存で空でないものがあれば優先
        n = max(len(existing_trade_ids), len(new_trade_ids))
        existing_trade_ids += [''] * (n - len(existing_trade_ids))
        new_trade_ids      += [''] * (n - len(new_trade_ids))
        trade_stat_ids = [
            existing_id if existing_id else new_id
            for existing_id, new_id in zip(existing_trade_ids, new_trade_ids)
        ]

        if any(trade_stat_ids):
            trade_matched += 1

        # weight / tier: 同一キーの既存 → 旧キー(legacy) → ゲームの spawn weight
        if "weight" in existing:
            keep_weight = existing.get("weight", max_weight)
        elif "weight" in legacy:
            keep_weight = legacy.get("weight", max_weight)
            print(f"info: weight 引き継ぎ: {full_jp[:48]} ← legacy ({keep_weight})")
        else:
            keep_weight = max_weight

        if existing.get("tier"):
            keep_tier = existing.get("tier", 0)
        elif legacy.get("tier"):
            keep_tier = legacy.get("tier", 0)
            print(f"info: tier 引き継ぎ: {full_jp[:48]} ← legacy ({keep_tier})")
        else:
            keep_tier = 0

        regex_previous = manual_regex_entry(old_output_data, m_id, full_jp, full_en)
        # タイプ、エントリの構築
        gen_type = m_data_en.get('generation_type', "").capitalize()
        
        entry = {
            "mod": full_jp,
            "engMod": full_en,
            "value": full_val,
            "type": gen_type,
            "weight": keep_weight,
            "tier": keep_tier,
            "engRegex": regex_previous.get('engRegex', ""),
            "Regex": regex_previous.get('Regex', ""),
            "tradeStatIds": trade_stat_ids       # 各行に対応したID配列
        }
        with_source_id(entry, m_id, result_mod_list.get(full_jp))
        entry.update(mod_stats_values)
        entry["modTier17"] = is_t17
        
        result_mod_list[full_jp] = entry
        count += 1

    print(f"Extracted {count} modifiers (filtered by spawn_weights).")
    print(f"Trade stat ID matched: {trade_matched} / {count}")

    # tradeStatIds に空があるmodをログ出力
    unmatched_any = [
        entry for entry in result_mod_list.values()
        if not all(entry.get("tradeStatIds", [""]))
    ]
    if unmatched_any:
        print(f"\n--- tradeStatIds 未マッチあり: {len(unmatched_any)}件 ---")
        print("MANUAL_TRADE_STAT_MAP または手入力候補:")
        for entry in unmatched_any:
            ids = entry.get('tradeStatIds', [])
            jp_lines = re.sub(r'^\(T17\)\s*', '', entry['mod']).strip().split('|')
            for i, (jp_line, stat_id) in enumerate(zip(jp_lines, ids + [''] * len(jp_lines))):
                if not stat_id:
                    jp_norm = re.sub(r'-?\d+(\.\d+)?', '#', jp_line.strip())
                    print(f'    # 行{i+1}: "{jp_norm}": "",')
        print("---")
    else:
        print("全modのtradeStatIdsがマッチしました。")

    output_path = os.path.join(tools_dir, '../scripts/map_mods.js')
    source_regex_count = max(current_regex_count, backup_regex_count)
    output_regex_count = count_regex_fields_in_data(result_mod_list)
    print(f"Regex fields preserved: {output_regex_count} / source {source_regex_count}")

    # 既存Regexがあるのに生成結果で大きく失われる場合は、書き込みを止める。
    # RePoE 側の文言変更や照合ミスで Regex / engRegex / tier / weight を空にしないための安全弁。
    if source_regex_count >= 10 and output_regex_count < int(source_regex_count * 0.8):
        print("[ERROR] Generated map_mods.js would lose too many existing Regex fields.")
        print("        Output was not written. Check existing matching logic or map_mods_backup.js.")
        raise SystemExit(1)

    attach_mod_details(result_mod_list, mods_en, mods_jp)
    log_generation_changes(old_output_data, result_mod_list)

    json_data = json.dumps(result_mod_list, ensure_ascii=False, indent=2)
    content = f"// tools/extract_map_mods.py によって自動生成されました (source: {source})\nconst mapModList = {json_data};\n"

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Saved to {output_path}")

if __name__ == '__main__':
    main()

import json
import urllib.request
import os
import shutil
import re

# 定数
USER_AGENT = 'PoE2-JP-Regex-Tool/1.0 (contact: user)'
REPOE_MODS = 'https://repoe-fork.github.io/poe2/mods.json'
REPOE_MOD_TEXTS_JP = 'https://repoe-fork.github.io/poe2/Japanese/mods.json'

STAT_DESC_FILES = [
    'map_stat_descriptions.json',
    'endgame_map_stat_descriptions.json',
    'atlas_stat_descriptions.json',
    'stat_descriptions.json'
]

REPOE_STAT_TRANS_DIR_EN = 'https://repoe-fork.github.io/poe2/stat_translations/'
REPOE_STAT_TRANS_DIR_JP = 'https://repoe-fork.github.io/poe2/Japanese/stat_translations/'

POE_TRADE_STATS_EN_URL = 'https://www.pathofexile.com/api/trade2/data/stats'
POE_TRADE_STATS_JP_URL = 'https://jp.pathofexile.com/api/trade2/data/stats'

TARGET_STATS = [
    'map_item_drop_quantity_+%',
    'map_item_drop_rarity_+%',
    'map_pack_size_+%',
    'map_map_item_drop_chance_+%',
    'map_number_of_rare_packs_+%',
    'map_number_of_magic_packs_+%'
]

# 自動マッチできない特例の手動マッピング (PoE2用)
MANUAL_TRADE_STAT_MAP = {
    "全てのプレイヤーのクールダウン解消レートが#%低下する": "explicit.stat_941368244",
}

# mod名/テキストから除外する汎用マップ統計テキスト
GENERIC_STAT_TEXTS = [
    "このエリアで見つかるアイテムの数量が#%増加する",
    "このエリアで見つかるアイテムのレアリティが#%増加する",
    "パックサイズが#%増加する",
    "エリアで見つかるウェイストーンの量が#%増加する",
    "ウェイストーンドロップ率: +#%",
    "レアモンスターの数が#%増加する",
    "マジックモンスターの数が#%増加する",
    "#% increased Quantity of Items found in this Area",
    "#% increased Rarity of Items found in this Area",
    "#% increased Pack size",
    "#% increased Waystones found in Area",
    "Waystone Drop Chance: +#%",
    "#% increased number of Rare Monsters",
    "#% increased number of Magic Monsters"
]

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
        print(f"Using local file: {local_path}")
        try:
            with open(local_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading local file {local_path}: {e}")

    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
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
            # [Rarity] -> Rarity
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
    
    # [Rarity|レアリティ] -> レアリティ, [Rarity] -> Rarity
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
        print(f"Using cached trade stats from {cache_path}")
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return _parse_trade_stats(data)
        except Exception as e:
            print(f"Error reading cache: {e}")

    print(f"Fetching trade stat IDs from {url}...")
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

def load_existing_mod_list(file_path):
    if not os.path.exists(file_path):
        return {}

    print(f"Loading existing mod list from {file_path}...")
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
        print(f"Error parsing existing mod list: {e}")
        
    return existing_data

def main():
    tools_dir = os.path.dirname(__file__)
    output_path = os.path.join(tools_dir, '../poe2_scripts/map_mods.js')
    backup_path = os.path.join(tools_dir, '../poe2_scripts/map_mods_backup.js')
    
    if os.path.exists(output_path):
        print(f"Backing up existing map_mods.js to {backup_path}...")
        shutil.copy2(output_path, backup_path)

    existing_mods = load_existing_mod_list(output_path)

    # トレードステータスIDマップをフェッチ
    trade_stat_map_en = fetch_trade_stat_map(POE_TRADE_STATS_EN_URL)
    trade_stat_map_jp = fetch_trade_stat_map(POE_TRADE_STATS_JP_URL)

    # RePoEデータをフェッチ
    mods_en = fetch_json(REPOE_MODS)
    mods_jp = fetch_json(REPOE_MOD_TEXTS_JP)

    if not mods_en or not mods_jp:
        print("Failed to fetch mods data.")
        return

    # 統計翻訳の統合マップ
    global_stat_map = {}
    for filename in STAT_DESC_FILES:
        url_en = REPOE_STAT_TRANS_DIR_EN + filename
        url_jp = REPOE_STAT_TRANS_DIR_JP + filename
        
        trans_en = fetch_json(url_en)
        trans_jp = fetch_json(url_jp)
        
        if trans_en and trans_jp:
            file_stat_map = build_stat_map_poe2(trans_en, trans_jp)
            global_stat_map.update(file_stat_map)

    result_mod_list = {}
    count = 0
    trade_matched = 0

    NEG_WORDS = ['低下', '減少', 'less', 'reduced']

    for m_id, m_data_en in mods_en.items():
        spawn_weights = m_data_en.get('spawn_weights', [])
        is_valid_tag = False
        max_weight = 0
        
        for sw in spawn_weights:
            tag = sw.get('tag')
            weight = sw.get('weight', 0)
            if weight > 0:
                if tag in ['default', 'top_tier_map']:
                    is_valid_tag = True
                    max_weight = max(max_weight, weight)
        
        if not is_valid_tag:
            continue
            
        if m_data_en.get('domain') != 'area' or m_data_en.get('generation_type') not in ['prefix', 'suffix']:
            continue

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

        # 数値範囲
        val_texts = []
        for s in stats:
            min_v = s.get('min', 0)
            max_v = s.get('max', 0)
            if should_flip:
                min_v, max_v = -min_v, -max_v
            
            if min_v == max_v:
                val_texts.append(str(min_v))
            else:
                low, high = sorted([min_v, max_v])
                val_texts.append(f"{low}-{high}")
        
        full_val = "|".join(val_texts)

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

        # トレード ID 検索
        existing_key = normalize_mod_key(full_jp)
        existing = existing_mods.get(existing_key, {})
        
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

        gen_type = m_data_en.get('generation_type', "").capitalize()
        
        entry = {
            "mod": full_jp,
            "engMod": full_en,
            "value": full_val,
            "type": gen_type,
            "weight": max_weight,
            "tier": existing.get("tier", 0),
            "engRegex": existing.get('engRegex', ""),
            "Regex": existing.get('Regex', ""),
            "tradeStatIds": trade_stat_ids
        }
        entry.update(mod_stats_values)
        
        result_mod_list[full_jp] = entry
        count += 1

    print(f"Extracted {count} modifiers.")
    print(f"Trade stat ID matched: {trade_matched} / {count}")

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
    content = f"// Auto-generated by tools_poe2/extract_map_mods.py\nconst mapModList = {json_data};\n"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Saved to {output_path}")

if __name__ == '__main__':
    main()

import urllib.request
import json
import os
import re

# 定数
USER_AGENT = 'PoE-JP-Regex-Tool/1.0 (contact: user)'
LEAGUE_API_URL = "https://api.pathofexile.com/leagues?type=main"
DEFAULT_LEAGUE = "Mirage"

# poe.ninja API URL
NINJA_BEAST_API = "https://poe.ninja/api/data/itemoverview?league={league}&type=Beast"
NINJA_SCARAB_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Scarab"
NINJA_TATTOO_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Tattoo"
NINJA_RUNEGRAFT_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Runegraft"

# リポジトリルートからの相対パス
BEAST_LIST_PATH = "scripts/beastlist.js"
SCARAB_LIST_PATH = "scripts/scarablist.js"
TATTOO_LIST_PATH = "scripts/tattoolist.js"
RUNEGRAFT_LIST_PATH = "scripts/runegraftlist.js"

def fetch_json(url):
    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def load_js_data(path, var_name):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            # オブジェクトの開始と終了を検索
            pattern = re.compile(fr'const\s+{var_name}\s*=\s*({{.*}});?\s*$', re.DOTALL)
            match = pattern.search(content)
            if not match:
                match = re.search(fr'const\s+{var_name}\s*=\s*({{.*}})', content, re.DOTALL)
                
            if not match:
                print(f"Warning: Could not find object for {var_name} in {path}")
                return {}
            
            json_str = match.group(1)
            # 有効なJSONにするためにJavaScript固有の記述をクリーンアップ
            keys = ["engName", "family", "effect", "regex", "enRegex", "chaosValue", "description", "enDescription", "jaName", "enName"]
            for k in keys:
                json_str = re.sub(fr'(?<!"){k}\s*:', fr'"{k}":', json_str)
            
            json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
            return json.loads(json_str)
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return {}

def save_js_data(path, var_name, data):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(f"const {var_name} = {json.dumps(data, ensure_ascii=False, indent=2)};\n")
    print(f"Saved to {path}")

def get_current_league():
    leagues = fetch_json(LEAGUE_API_URL)
    if not leagues: return DEFAULT_LEAGUE
    exclude = ["Standard", "Hardcore", "HardMode", "SSF", "Ruthless"]
    challenge_leagues = [l['id'] for l in leagues if not any(ex.lower() in l['id'].lower() for ex in exclude)]
    return challenge_leagues[-1] if challenge_leagues else DEFAULT_LEAGUE

def update_js_prices(path, var_name, prices):
    data = load_js_data(path, var_name)
    if not data: return

    updated_count = 0
    for name, item in data.items():
        eng_name = item.get('engName')
        if not eng_name: continue
        
        # 特殊文字を正規化
        norm_name = eng_name.replace('ó', 'o').replace('á', 'a').replace('é', 'e')
        price = prices.get(eng_name) or prices.get(norm_name)
        
        if price is not None:
            item['chaosValue'] = f"{price:g}"
            updated_count += 1

    save_js_data(path, var_name, data)
    print(f"Updated {updated_count} prices in {path}")

def update_exchange_type(path, var_name, url):
    data = fetch_json(url)
    if not data: return
    
    prices = {l['id']: l['primaryValue'] for l in data.get('lines', [])}
    items = data.get('items', [])
    names = {i['id']: i['name'] for i in items}
    
    category_prices = {names[sid]: price for sid, price in prices.items() if sid in names}
    update_js_prices(path, var_name, category_prices)

def main():
    league = get_current_league()
    print(f"Updating prices for league: {league}")

    # ビーストの価格を更新
    beast_data = fetch_json(NINJA_BEAST_API.format(league=league))
    if beast_data:
        beast_prices = {item['name']: item['chaosValue'] for item in beast_data.get('lines', []) if 'name' in item}
        update_js_prices(BEAST_LIST_PATH, "beastlist", beast_prices)

    # 各種カテゴリ（スカラベ、タトゥー、ルーングラフト）の価格を更新
    update_exchange_type(SCARAB_LIST_PATH, "scarablist", NINJA_SCARAB_API.format(league=league))
    update_exchange_type(TATTOO_LIST_PATH, "tattoolist", NINJA_TATTOO_API.format(league=league))
    update_exchange_type(RUNEGRAFT_LIST_PATH, "runegraftlist", NINJA_RUNEGRAFT_API.format(league=league))

if __name__ == "__main__":
    main()

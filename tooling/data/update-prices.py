import urllib.request
import json
import os

# 定数
USER_AGENT = 'PoE-JP-Regex-Tool/1.0 (contact: user)'
LEAGUE_API_URL = "https://api.pathofexile.com/leagues?type=main"
DEFAULT_LEAGUE = "Allflame"

# poe.ninja API URL
NINJA_BEAST_API = "https://poe.ninja/poe1/api/economy/stash/current/item/overview?league={league}&type=Beast"
NINJA_SCARAB_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Scarab"
NINJA_TATTOO_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Tattoo"
NINJA_RUNEGRAFT_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Runegraft"
NINJA_ESSENCE_API = "https://poe.ninja/poe1/api/economy/exchange/current/overview?league={league}&type=Essence"

# リポジトリルートからの相対パス
BEAST_LIST_PATH = "data/poe1/beastlist.json"
SCARAB_LIST_PATH = "data/poe1/scarablist.json"
TATTOO_LIST_PATH = "data/poe1/tattoolist.json"
RUNEGRAFT_LIST_PATH = "data/poe1/runegraftlist.json"
ESSENCE_LIST_PATH = "data/poe1/essencelist.json"

def fetch_json(url):
    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def load_json_data(path):
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_data(path, data):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"Saved to {path}")

def get_current_league():
    leagues = fetch_json(LEAGUE_API_URL)
    if not leagues: return DEFAULT_LEAGUE
    exclude = ["Standard", "Hardcore", "HardMode", "SSF", "Ruthless"]
    challenge_leagues = [l['id'] for l in leagues if not any(ex.lower() in l['id'].lower() for ex in exclude)]
    return challenge_leagues[-1] if challenge_leagues else DEFAULT_LEAGUE

def update_prices(path, prices):
    data = load_json_data(path)
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

    save_json_data(path, data)
    print(f"Updated {updated_count} prices in {path}")

def update_exchange_type(path, url):
    data = fetch_json(url)
    if not data: return
    
    prices = {l['id']: l['primaryValue'] for l in data.get('lines', [])}
    items = data.get('items', [])
    names = {i['id']: i['name'] for i in items}
    
    category_prices = {names[sid]: price for sid, price in prices.items() if sid in names}
    update_prices(path, category_prices)

def main():
    league = get_current_league()
    print(f"Updating prices for league: {league}")

    # ビーストの価格を更新
    beast_data = fetch_json(NINJA_BEAST_API.format(league=league))
    if beast_data:
        beast_prices = {item['name']: item['chaosValue'] for item in beast_data.get('lines', []) if 'name' in item}
        update_prices(BEAST_LIST_PATH, beast_prices)

    # 各種カテゴリ（スカラベ、タトゥー、ルーングラフト、エッセンス）の価格を更新
    update_exchange_type(SCARAB_LIST_PATH, NINJA_SCARAB_API.format(league=league))
    update_exchange_type(TATTOO_LIST_PATH, NINJA_TATTOO_API.format(league=league))
    update_exchange_type(RUNEGRAFT_LIST_PATH, NINJA_RUNEGRAFT_API.format(league=league))
    update_exchange_type(ESSENCE_LIST_PATH, NINJA_ESSENCE_API.format(league=league))

if __name__ == "__main__":
    main()

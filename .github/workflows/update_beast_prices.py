import urllib.request
import json
import re
import os
import sys

# 設定
LEAGUE_API_URL = "https://api.pathofexile.com/leagues?type=main"
NINJA_API_BASE = "https://poe.ninja/api/data/itemoverview?league={league}&type=Beast"
BEAST_LIST_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "beastlist.js")
# extract_map_mods.py と同じ User-Agent を使用
USER_AGENT = 'PoE-JP-Regex-Tool/1.0 (contact: user)'
DEFAULT_LEAGUE = "Standard" # 取得失敗時のフォールバック

def get_current_league():
    try:
        print("Fetching current league from GGG API...")
        req = urllib.request.Request(LEAGUE_API_URL, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as response:
            leagues = json.loads(response.read().decode())
            # リーグリストの中から、特殊なモードを除外して Softcore Trade リーグを探す
            # 除外キーワード: Hardcore, SSF, Ruthless, HardMode, Standard
            exclude = ["Standard", "Hardcore", "HardMode", "SSF", "Ruthless"]
            challenge_leagues = []
            for l in leagues:
                league_id = l['id']
                # 除外キーワードが含まれていないものを候補にする
                if not any(ex.lower() in league_id.lower() for ex in exclude):
                    challenge_leagues.append(league_id)
            
            if challenge_leagues:
                # 候補の中で最新のものを返す（通常はリストの後ろの方）
                current = challenge_leagues[-1]
                print(f"Detected challenge league: {current}")
                return current
    except Exception as e:
        print(f"Error fetching league: {e}")
    return DEFAULT_LEAGUE

def fetch_ninja_prices(league):
    url = NINJA_API_BASE.format(league=league)
    print(f"Fetching prices from poe.ninja ({league})...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            prices = {}
            for item in data.get('lines', []):
                name = item.get('name')
                chaos_value = item.get('chaosValue')
                if name and chaos_value is not None:
                    prices[name] = chaos_value
            return prices
    except Exception as e:
        print(f"Error fetching prices: {e}")
        return {}

def update_beast_list(prices):
    if not os.path.exists(BEAST_LIST_PATH):
        print(f"Error: {BEAST_LIST_PATH} not found.")
        return

    print(f"Updating {BEAST_LIST_PATH}...")
    with open(BEAST_LIST_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    updated_count = 0
    new_content = content
    
    # \d+.\d+ などの浮動小数点に対応するために g フォーマットを使用
    def get_price_str(p):
        return f"{p:g}"

    # 各項目をマッチング
    # offset を使わずに一括置換するための関数
    def replace_entry(match):
        nonlocal updated_count
        jp_name = match.group(1)
        body = match.group(2)
        
        eng_match = re.search(r'engName:\s*\"([^\"]+)\"', body)
        if eng_match:
            eng_name = eng_match.group(1)
            price = prices.get(eng_name)
            
            if price is None:
                # 正規化を試みる
                normalized_eng = eng_name.replace('ó', 'o').replace('á', 'a').replace('é', 'e')
                price = prices.get(normalized_eng)

            if price is not None:
                price_str = get_price_str(price)
                new_body, count = re.subn(r'(chaosValue:\s*\")[^\"]*(\")', rf'\g<1>{price_str}\g<2>', body)
                if count > 0:
                    updated_count += 1
                    return f'"{jp_name}": {{{new_body}}}'
        
        return match.group(0)

    # 全体を置換
    new_content = re.sub(r'\"([^\"]+)\":\s*\{(.*?)\}', replace_entry, content, flags=re.DOTALL)

    with open(BEAST_LIST_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Successfully updated {updated_count} beasts.")

def main():
    league = get_current_league()
    prices = fetch_ninja_prices(league)
    if not prices:
        # 失敗した場合、Standardで試す
        print("Retrying with Standard league...")
        prices = fetch_ninja_prices("Standard")
        
    if not prices:
        print("No prices fetched. Aborting.")
        return
    
    update_beast_list(prices)

if __name__ == "__main__":
    main()

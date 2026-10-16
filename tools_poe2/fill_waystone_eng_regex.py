"""ウェイストーンModの空 engRegex を poe2.re の Waystone.Gen.ts から埋める。"""
import json
import os
import re
import urllib.request

from change_utils import load_js_object, log_data_changes

USER_AGENT = 'PoE2-JP-Regex-Tool/1.0 (contact: user)'
WAYSTONE_GEN_URL = (
    'https://raw.githubusercontent.com/veiset/poe2.re/refs/heads/main/'
    'src/generated/Waystone.Gen.ts'
)

GENERIC_STAT_LINES = {
    '#% increased quantity of items found in this area',
    '#% increased rarity of items found in this area',
    '#% increased pack size',
    '#% increased waystones found in area',
    'waystone drop chance: +#%',
    '#% increased number of rare monsters',
    '#% increased number of magic monsters',
}

# RePoE 文言と poe2.re で表現が異なる Mod の手動マッピング
MANUAL_ENG_REGEX_MAP = {
    'monsters have #% increased attack, cast and movement speed': 'tta',
    '-#% maximum player resistances': '% ma',
}


def fetch_waystone_gen_text():
    local_path = os.path.join(os.path.dirname(__file__), 'Waystone.Gen.ts')
    if os.path.exists(local_path):
        print(f'ローカルファイルを使用: {local_path}')
        with open(local_path, 'r', encoding='utf-8') as f:
            return f.read()

    print(f'取得中: {WAYSTONE_GEN_URL}...')
    req = urllib.request.Request(WAYSTONE_GEN_URL, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode('utf-8')


def parse_waystone_entries(content):
    """Waystone.Gen.ts から name / regex のペアを抽出する。"""
    entries = []
    block_pattern = re.compile(
        r'\{\s*name:\s*"((?:\\.|[^"\\])*)"\s*,\s*regex:\s*"((?:\\.|[^"\\])*)"',
        re.MULTILINE,
    )
    for name, regex in block_pattern.findall(content):
        entries.append({
            'name': name.replace('\\"', '"'),
            'regex': regex.replace('\\"', '"'),
        })
    return entries


def normalize_mod_line(line):
    if not line:
        return ''
    text = line.strip().lower()
    text = re.sub(r'\(##\)', '#', text)
    text = re.sub(r'##', '#', text)
    text = re.sub(r'\+#', '#', text)
    text = re.sub(r'-#', '#', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def mod_line_set(text):
    lines = [normalize_mod_line(line) for line in text.split('|') if line.strip()]
    return {line for line in lines if line}


def signature(text):
    return frozenset(mod_line_set(text))


def build_waystone_lookup(entries):
    lookup = {}
    for entry in entries:
        sig = signature(entry['name'])
        if not sig:
            continue
        lookup.setdefault(sig, []).append(entry)
    return lookup


def find_waystone_regex(eng_mod, lookup):
    manual = MANUAL_ENG_REGEX_MAP.get(normalize_mod_line(eng_mod))
    if manual:
        return manual

    eng_sig = signature(eng_mod)
    if not eng_sig:
        return ''

    exact = lookup.get(eng_sig)
    if exact:
        return exact[0]['regex']

    candidates = []
    for sig, items in lookup.items():
        if eng_sig.issubset(sig):
            candidates.extend(items)

    if len(candidates) == 1:
        return candidates[0]['regex']

    if len(candidates) > 1:
        # 接頭辞/接尾辞ではなく、非汎用行の一致数が最大の候補を選ぶ
        best = max(
            candidates,
            key=lambda item: len(mod_line_set(item['name']) - GENERIC_STAT_LINES & eng_sig),
        )
        return best['regex']

    return ''


def fill_empty_eng_regex(mod_list, lookup, overwrite=False):
    filled = 0
    skipped_existing = 0
    unmatched = []

    for key, entry in mod_list.items():
        if entry.get('engRegex') and not overwrite:
            skipped_existing += 1
            continue

        eng_mod = entry.get('engMod', '')
        regex = find_waystone_regex(eng_mod, lookup)
        if regex:
            entry['engRegex'] = regex
            filled += 1
        elif not entry.get('engRegex'):
            unmatched.append((key, eng_mod))

    return filled, skipped_existing, unmatched


def save_map_mods(output_path, mod_list):
    json_data = json.dumps(mod_list, ensure_ascii=False, indent=2)
    content = (
        '// tools_poe2/extract_map_mods.py によって自動生成されました\n'
        f'const mapModList = {json_data};\n'
    )
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)


def main():
    tools_dir = os.path.dirname(__file__)
    output_path = os.path.join(tools_dir, '../poe2_scripts/map_mods.js')
    old_data = load_js_object(output_path)

    waystone_text = fetch_waystone_gen_text()
    entries = parse_waystone_entries(waystone_text)
    if not entries:
        print('Waystone.Gen.ts からエントリを取得できませんでした。')
        return

    lookup = build_waystone_lookup(entries)
    mod_list = load_js_object(output_path)
    filled, skipped_existing, unmatched = fill_empty_eng_regex(mod_list, lookup)

    print(f'Waystone エントリ読込: {len(entries)}件')
    print(f'engRegex 追加: {filled}件')
    print(f'engRegex 保持（既存）: {skipped_existing}件')

    if unmatched:
        print(f'\n--- engRegex 未マッチ: {len(unmatched)}件 ---')
        for jp_mod, eng_mod in unmatched:
            print(f'  JP: {jp_mod}')
            print(f'  EN: {eng_mod}')
        print('---')

    log_data_changes(old_data, mod_list, 'poe2 mapModList engRegex', normalize=True)
    save_map_mods(output_path, mod_list)
    print(f'保存先: {output_path}')


if __name__ == '__main__':
    main()

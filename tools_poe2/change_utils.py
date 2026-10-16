import json
import os
import re

def extract_js_object_text(content):
    start = content.find('{')
    end = content.rfind('}') + 1
    if start == -1 or end == 0:
        return ""
    return content[start:end]

def parse_js_object_text(object_text):
    cleaned = re.sub(r',\s*([}\]])', r'\1', object_text)
    return json.loads(cleaned)

def load_js_object(path):
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()
        object_text = extract_js_object_text(text)
        if not object_text:
            return {}
        return parse_js_object_text(object_text)
    except Exception as e:
        print(f"警告: 変更サマリー用の旧データを読み込めませんでした: {e}")
        return {}

def normalize_key(key):
    key = re.sub(r'^\s*\(T17\)\s*', '', key or '')
    key = re.sub(r'\([+\-]?[\d#]+(?:[~\-][+\-]?[\d#]+)?\)', '#', key)
    key = re.sub(r'-?\d+(\.\d+)?', '#', key)
    key = re.sub(r'#{2,}', '#', key)
    return key.strip()

def build_index(data):
    result = {}
    for key, value in data.items():
        result[normalize_key(key)] = (key, value)
    return result

def log_data_changes(old_data, new_data, label="data", limit=60, normalize=False):
    if normalize:
        old_index = build_index(old_data)
        new_index = build_index(new_data)
        old_keys = set(old_index.keys())
        new_keys = set(new_index.keys())
        get_old = lambda key: old_index[key]
        get_new = lambda key: new_index[key]
    else:
        old_keys = set(old_data.keys())
        new_keys = set(new_data.keys())
        get_old = lambda key: (key, old_data[key])
        get_new = lambda key: (key, new_data[key])

    added = sorted(new_keys - old_keys)
    removed = sorted(old_keys - new_keys)
    changed = []
    for key in sorted(old_keys & new_keys):
        old_name, old_item = get_old(key)
        new_name, new_item = get_new(key)
        fields = sorted(set(old_item.keys()) | set(new_item.keys()))
        changed_fields = [field for field in fields if old_item.get(field) != new_item.get(field)]
        if changed_fields:
            changed.append((new_name or old_name, changed_fields))

    total = len(added) + len(removed) + len(changed)
    print(f"\n--- 変更サマリー: {label} ---")
    print(f"追加: {len(added)}, 削除: {len(removed)}, 変更: {len(changed)}")

    printed = 0
    for key in added:
        if printed >= limit:
            break
        print(f"[追加] {get_new(key)[0]}")
        printed += 1
    for key in removed:
        if printed >= limit:
            break
        print(f"[削除] {get_old(key)[0]}")
        printed += 1
    for name, fields in changed:
        if printed >= limit:
            break
        print(f"[変更] {name}: {', '.join(fields)}")
        printed += 1

    if total > printed:
        print(f"... 他 {total - printed} 件")
    if total == 0:
        print("データ変更は検出されませんでした。")
    print("---")

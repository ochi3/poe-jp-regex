import json
import os
import subprocess
from pathlib import Path


def extract_chart_scopes(mods_en, mods_jp, translations, previous, affixes):
    helper = Path(__file__).resolve().with_name('chart-scopes.cjs')
    mods = {key: {**entry, 'name': mods_jp.get(key, {}).get('name', '')}
            for key, entry in mods_en.items()
            if entry.get('domain') == 'deepwater_chart' and entry.get('generation_type') == 'deepwater_chart'}
    result = subprocess.run([os.environ.get('REGEX_NODE_PATH', 'node'), str(helper)],
                            input=json.dumps({'mods': mods, 'translations': translations,
                                              'previous': previous, 'affixes': affixes}, ensure_ascii=False),
                            text=True, encoding='utf-8', capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or '海図の隣接・航海Mod生成に失敗しました')
    return json.loads(result.stdout)

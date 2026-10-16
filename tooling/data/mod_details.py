"""Attach display-only metadata exported by the user's PoE-DB. No guessed text."""
from pathlib import Path
import json


def attach_mod_details(data, mods_en, mods_jp, details=None):
    if details is None:
        file = Path(__file__).resolve().parents[3] / 'PoE-DB/data/export/game/mod_details.json'
        if not file.is_file():
            print('Warning: PoE-DBのmod_details.jsonがありません。export-mod-detailsを実行してください。')
            return data
        details = json.loads(file.read_text(encoding='utf-8-sig'))
    for entry in data.values():
        sources = [mods_en[source_id] for source_id in entry.get('sourceIds', []) if source_id in mods_en]
        tag_ids = list(dict.fromkeys(tag for source in sources for tag in source.get('implicit_tags', [])))
        stat_ids = list(dict.fromkeys(stat['id'] for source in sources for stat in source.get('stats', [])))
        reminder_ids = list(dict.fromkeys(ref for stat_id in stat_ids for ref in details.get('statReminders', {}).get(stat_id, [])))
        entry['tagIds'] = tag_ids
        entry['modTags'] = [{'id': tag, 'ja': details['tags'][tag].get('ja', ''), 'en': details['tags'][tag].get('en', '')}
                            for tag in tag_ids if tag in details.get('tags', {})
                            and any(details['tags'][tag].get(lang) for lang in ['ja', 'en'])]
        entry['reminderIds'] = reminder_ids
        entry['reminderText'] = {lang: list(dict.fromkeys(details.get('reminders', {}).get(ref, {}).get(lang, '')
                                 for ref in reminder_ids if details.get('reminders', {}).get(ref, {}).get(lang))) for lang in ['ja','en']}
        entry['detailsSource'] = 'PoE-DB/export/game/mod_details.json'
    return data

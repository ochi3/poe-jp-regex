"""Stable source IDs shared by the local map/chart generators."""
def find_by_source_id(entries, source_id):
    matches = [entry for entry in entries.values() if source_id in entry.get('sourceIds', [])]
    if len(matches) > 1:
        raise ValueError(f'Ambiguous existing Mod ID: {source_id}')
    return matches[0] if matches else None


def with_source_id(entry, source_id, previous=None):
    entry['sourceIds'] = sorted(set((previous or {}).get('sourceIds', []) + [source_id]))
    return entry


def manual_regex_entry(entries, source_id, jp, en):
    previous = find_by_source_id(entries, source_id)
    if previous is not None:
        return previous
    if jp in entries:
        return entries[jp]
    matches = [entry for entry in entries.values() if en and entry.get('engMod') == en]
    return matches[0] if len(matches) == 1 else {}

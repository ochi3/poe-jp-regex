let ModList: Record<string, ModDefinition> = {...mapModList};
let currentLanguage: Language = readLanguagePreference('poe2_poeLanguage');
const CHANGELOG_VERSION = 'poe2-2026-10-13';
const CHANGELOG_STORAGE_KEY = 'poe2ChangelogSeenVersion';

let checkedMods: Map<string, ModSelection> = new Map(); // キー -> 'ng' または 'wanted'

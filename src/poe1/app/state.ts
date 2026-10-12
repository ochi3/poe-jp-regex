let ModList: Record<string, ModDefinition> = {...mapModList};
let currentLanguage: Language = readLanguagePreference('poeLanguage');
const CHANGELOG_VERSION = 'poe1-2026-10-13';
const CHANGELOG_STORAGE_KEY = 'poe1ChangelogSeenVersion';

let checkedMods: Map<string, ModSelection> = new Map(); // キー -> 'ng' または 'wanted'
let checkedBeasts: Set<string> = new Set<string>();
let checkedScarabs: Set<string> = new Set<string>();
let checkedEssences: Set<string> = new Set<string>();
let checkedTattoos: Set<string> = new Set<string>();
let checkedRunegrafts: Set<string> = new Set<string>();

let scarabSortColumn = 'price';
let scarabSortDirection = 'desc';
let essenceSortColumn = 'price';
let essenceSortDirection = 'desc';
let tattooSortColumn = 'price';
let tattooSortDirection = 'desc';
let runegraftSortColumn = 'price';
let runegraftSortDirection = 'desc';

let scarabProfiles: ProfileDictionary = {};
let essenceProfiles: ProfileDictionary = {};
let tattooProfiles: ProfileDictionary = {};
let runegraftProfiles: ProfileDictionary = {};

let currentSearchTerm = '';

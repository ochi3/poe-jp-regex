/** Shared domain types. Data dictionaries retain the stat keys used by PoE. */
type Language = 'ja' | 'en';
type ModSelection = 'ng' | 'wanted';
type SortDirection = 'asc' | 'desc';

interface ModDefinition {
  mod: string;
  engMod?: string;
  value: string;
  Regex: string;
  engRegex?: string;
  type?: string;
  weight?: number;
  tier?: number;
  modTier17?: boolean;
  tradeStatIds?: string[];
  /** Generated data includes game-specific numeric stats. */
  [stat: string]: any;
}

interface CatalogEntry {
  engName?: string;
  jaName?: string;
  enName?: string;
  family?: string;
  effect?: string;
  description?: string;
  enDescription?: string;
  attribute?: string;
  regex: string;
  enRegex?: string;
  chaosValue?: string;
}

/** The serialized profile format stays compatible with existing localStorage. */
interface SavedProfile {
  mods?: string[] | [string, ModSelection][] | Record<string, ModSelection>;
  checkedMods?: [string, ModSelection][];
  selectedMods?: string[];
  timestamp?: number;
  createdAt?: string;
  updatedAt?: string;
  [setting: string]: any;
}
interface AffixProfile extends SavedProfile { mods?: string[]; }
type ProfileDictionary<T extends SavedProfile = SavedProfile> = Record<string, T>;

interface AffixMod {
  name: string;
  text?: string;
  engName?: string;
  engText?: string;
  family?: string;
  regex?: string;
  enRegex?: string;
  type?: string;
  [stat: string]: any;
}

interface AffixData {
  mods?: { prefix?: Record<string, AffixMod[]>; suffix?: Record<string, AffixMod[]> };
}
interface AffixGroup {
  displayName: string;
  baseKey: string;
  mods: AffixMod[];
  generationType: string;
  highestTierMod: AffixMod;
  familyName: string;
}
interface TradeValue { min?: number; max?: number; option?: string; currency?: string; }
interface TradeStat { id: string; disabled: boolean; value?: TradeValue; }
interface TradeQuery {
  type?: string;
  status: { option: string };
  stats: { type: string; filters: TradeStat[]; value?: TradeValue }[];
  filters?: TradeFilters;
}
type TradeFilters = Record<string, { filters: Record<string, TradeValue> }>;
interface VendorSettings {
  colors?: Record<string, boolean>;
  movement?: Record<string, boolean>;
  weapon: Record<string, boolean>;
  excludeWeapons?: Record<string, boolean>;
  selectedGems?: string[];
  selected?: Record<string, boolean>;
  [setting: string]: any;
}

interface ItemTranslationEngine {
  translateItemTextAuto(text: string): { result: string; direction: 'ja2en' | 'en2ja' };
}

interface HookableAction {
  (...args: any[]): any;
  _hooked?: boolean;
}

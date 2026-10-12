/** Public compatibility API used by existing HTML and profile-save hooks. */
interface Window {
  syncEssenceNameColumnWidth?: () => void;
  JpPoeUtils?: ItemTranslationEngine;
  JpPoe2Utils?: ItemTranslationEngine;
  getPoe2ConvertModList?: () => Record<string, ModDefinition>;
  showNotification: typeof showNotification;
  rawFlaskMods?: AffixMod[];
  rawItemMods?: AffixMod[];
  saveProfile: HookableAction;
  saveFlaskProfile?: HookableAction;
  saveItemProfile?: HookableAction;
  saveVendorProfile: HookableAction;
  saveBeastProfile?: HookableAction;
  saveScarabProfile?: HookableAction;
  saveTabletProfile?: HookableAction;
}

interface HTMLElement {
  /** Prevent duplicate listeners when a tab is initialized again. */
  hasEventListener?: boolean;
  hasPobMemoListener?: boolean;
}

interface HTMLSelectElement { previousValue?: string; }
declare const pako: { inflate(bytes: Uint8Array, options: { to: 'string' }): string };

/** Compatibility API exported by the poe2 bundle. */
interface Window {
  POE2_REGEX_CHAR_LIMIT: 250;
  getPoe2MapProfileSettings: typeof getPoe2MapProfileSettings;
  applyPoe2MapProfileSettings: typeof applyPoe2MapProfileSettings;
  loadTabletProfile: typeof loadTabletProfile;
  deleteTabletProfile: typeof deleteTabletProfile;
  loadTabletProfileDirectly: typeof loadTabletProfileDirectly;
  generateTabletRegexFromProfile: typeof generateTabletRegexFromProfile;
  syncTabletProfiles: typeof syncTabletProfiles;
  applyVendorSettings: typeof applyVendorSettings;
  updateVendorRegex: typeof updateVendorRegex;
  loadVendorProfileDirectly: typeof loadVendorProfileDirectly;
  generateVendorRegexFromProfile: typeof generateVendorRegexFromProfile;
  getVendorItemLabel: typeof getVendorItemLabel;
  getWeaponLabel: typeof getWeaponLabel;
  vendorSettings: VendorSettings;
  VENDOR_GROUPS: { name: string; items: { id: string; label: string; regex: string; }[]; }[];
  VENDOR_COLUMNS: { className: string; groupNames: string[]; }[];
  WEAPON_OPTIONS: { key: string; label: string; regex: string; }[];
  WEAPON_GROUPS: { name: string; items: { key: string; label: string; regex: string; }[]; }[];
  vendorHashChangeHandler: () => void;
  copyVendorRegex: typeof copyVendorRegex;
  resetVendorSettings: typeof resetVendorSettings;
  initializeVendor: typeof initializeVendor;
  loadVendorProfile: typeof loadVendorProfile;
  deleteVendorProfile: typeof deleteVendorProfile;
  generateVendorRegex: typeof generateVendorRegex;
  profiles: ProfileDictionary<SavedProfile>;
  vendorProfiles: ProfileDictionary<SavedProfile>;
  translateItemText: () => void;
  copyItemTransOutput: () => void;
  clearItemTransFields: () => void;
}

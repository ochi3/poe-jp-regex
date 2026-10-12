const POE2_REGEX_CHAR_LIMIT = 250;

function getPoe2MapProfileSettings() {
  return {
    itemQuantity: getElement('itemQuantityInput')?.value || '',
    packSize: getElement('packSizeInput')?.value || '',
    rarity: getElement('rarityInput')?.value || '',
    waystone: getElement('waystoneInput')?.value || '',
    effectiveness: getElement('effectivenessInput')?.value || '',
    mapMonsterRarity: getElement('mapMonsterRarityInput')?.value || '',
    revive: getElement('reviveInput')?.value || '',
    delirium: getElement('deliriumInput')?.value || '',
    rareMonster: getElement('rareMonsterInput')?.value || '',
    magicMonster: getElement('magicMonsterInput')?.value || '',
    packAddition: getElement('packAdditionCheckbox')?.checked || false,
    searchMode: document.querySelector<HTMLInputElement>('input[name="searchMode"]:checked')?.value || 'any',
    ngModChecked: getElement('ngModCheckbox')?.checked || false,
    mapTierChecked: getElement('mapTierCheckbox')?.checked || false,
  };
}

function applyPoe2MapProfileSettings(settings: Partial<ReturnType<typeof getPoe2MapProfileSettings>> & { mapItemRarity?: string } = {}) {
  const setInput = (id, value) => {
    const el = getElement<HTMLInputElement>(id);
    if (!el) return;
    el.value = value ?? '';
  };
  const setChecked = (id, value) => {
    const el = getElement<HTMLInputElement>(id);
    if (el && el.type === 'checkbox') el.checked = !!value;
  };

  setInput('itemQuantityInput', settings.itemQuantity);
  setInput('packSizeInput', settings.packSize);
  setInput('rarityInput', settings.rarity || settings.mapItemRarity);
  setInput('waystoneInput', settings.waystone);
  setInput('effectivenessInput', settings.effectiveness);
  setInput('mapMonsterRarityInput', settings.mapMonsterRarity);
  setInput('reviveInput', settings.revive);
  setInput('deliriumInput', settings.delirium);
  setInput('rareMonsterInput', settings.rareMonster);
  setInput('magicMonsterInput', settings.magicMonster);
  setChecked('packAdditionCheckbox', settings.packAddition);
  setChecked('ngModCheckbox', settings.ngModChecked);
  setChecked('mapTierCheckbox', settings.mapTierChecked);

  const searchModeRadio = document.querySelector<HTMLInputElement>(`input[name="searchMode"][value="${settings.searchMode || 'any'}"]`);
  if (searchModeRadio) searchModeRadio.checked = true;
}

window.POE2_REGEX_CHAR_LIMIT = POE2_REGEX_CHAR_LIMIT;
window.getPoe2MapProfileSettings = getPoe2MapProfileSettings;
window.applyPoe2MapProfileSettings = applyPoe2MapProfileSettings;

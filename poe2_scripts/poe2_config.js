const POE2_REGEX_CHAR_LIMIT = 250;

function getPoe2MapProfileSettings() {
  return {
    itemQuantity: document.getElementById('itemQuantityInput')?.value || '',
    packSize: document.getElementById('packSizeInput')?.value || '',
    rarity: document.getElementById('rarityInput')?.value || '',
    waystone: document.getElementById('waystoneInput')?.value || '',
    delirium: document.getElementById('deliriumInput')?.value || '',
    rareMonster: document.getElementById('rareMonsterInput')?.value || '',
    magicMonster: document.getElementById('magicMonsterInput')?.value || '',
    packAddition: document.getElementById('packAdditionCheckbox')?.checked || false,
    searchMode: document.querySelector('input[name="searchMode"]:checked')?.value || 'any',
    ngModChecked: document.getElementById('ngModCheckbox')?.checked || false,
    mapTierChecked: document.getElementById('mapTierCheckbox')?.checked || false,
  };
}

function applyPoe2MapProfileSettings(settings = {}) {
  const setInput = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value ?? '';
  };
  const setChecked = (id, value) => {
    const el = document.getElementById(id);
    if (el && el.type === 'checkbox') el.checked = !!value;
  };

  setInput('itemQuantityInput', settings.itemQuantity);
  setInput('packSizeInput', settings.packSize);
  setInput('rarityInput', settings.rarity);
  setInput('waystoneInput', settings.waystone);
  setInput('deliriumInput', settings.delirium);
  setInput('rareMonsterInput', settings.rareMonster);
  setInput('magicMonsterInput', settings.magicMonster);
  setChecked('packAdditionCheckbox', settings.packAddition);
  setChecked('ngModCheckbox', settings.ngModChecked);
  setChecked('mapTierCheckbox', settings.mapTierChecked);

  const searchModeRadio = document.querySelector(`input[name="searchMode"][value="${settings.searchMode || 'any'}"]`);
  if (searchModeRadio) searchModeRadio.checked = true;
}

window.POE2_REGEX_CHAR_LIMIT = POE2_REGEX_CHAR_LIMIT;
window.getPoe2MapProfileSettings = getPoe2MapProfileSettings;
window.applyPoe2MapProfileSettings = applyPoe2MapProfileSettings;

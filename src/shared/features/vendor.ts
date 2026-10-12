function updateVendorRegex() {
  const regex = generateVendorRegex();
  const output = getElement('vendorRegexOutput');
  if (output) output.textContent = regex || '';
  updateVendorCharCount();
  saveVendorSettings();
}

function updateVendorProfileList() {
  const select = getElement('vendorProfileList');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';
  Object.keys(vendorProfiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

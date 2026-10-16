function updateSearchMode() {
    searchAllMode = getElement('searchAllRadio').checked;
    updateCombinedRegex();
}

function toggleSearchMode(mode: string) {
    searchAllMode = mode === 'all';
    getElement('searchAllButton').classList.toggle('active', searchAllMode);
    getElement('searchAnyButton').classList.toggle('active', !searchAllMode);
    updateCombinedRegex();
}

function copyToClipboard() {
  const resultText = getElement('combinedRegexOutput').textContent;
  navigator.clipboard.writeText(resultText)
    .then(() => {
      if (typeof showNotification === 'function') {
        showNotification('コピーしました！');
      } else {
        alert('コピーしました！');
      }
    })
    .catch(err => {
      console.error('クリップボードへのコピーに失敗しました', err);
      if (typeof showNotification === 'function') {
        showNotification('❌ コピー失敗', true);
      }
    });
}

function filterEffects() {
    currentSearchTerm = getElement('effectSearch').value.toLowerCase();
    const ModListDiv = getElement('ModList');
    const effects = ModListDiv.getElementsByClassName('effect-item') as HTMLCollectionOf<HTMLElement>;
    const terms = currentSearchTerm.split(/\s+/).filter(t => t);

    for (let i = 0; i < effects.length; i++) {
        if (terms.length === 0) {
            effects[i].classList.remove('hidden');
            continue;
        }

        const textSpan = effects[i].querySelector<HTMLElement>('.mod-text');
        const displayedText = textSpan ? textSpan.textContent.toLowerCase() : '';

        const modKey = effects[i].dataset.modKey;
        const mod = modKey ? ModList[modKey] : null;
        const rawJa = mod ? [mod.mod || '', ...(mod.modTags || []).map(tag => tag.ja), ...(mod.reminderText?.ja || [])].join(' ') : '';
        const rawEn = mod ? [mod.engMod || '', ...(mod.modTags || []).map(tag => tag.en), ...(mod.reminderText?.en || [])].join(' ') : '';

        const match = terms.every(term =>
            displayedText.includes(term) ||
            rawJa.toLowerCase().includes(term) ||
            rawEn.toLowerCase().includes(term)
        );

        effects[i].classList.toggle('hidden', !match);
    }
}

function addModCheckboxEventListeners() {
    // 選択イベントリスナー（現状はeffect-itemのクリックで処理）
}

function updateProfileList() {
  const select = getElement('profileList');
  const currentValue = select.value;

  select.innerHTML = '<option value="">-- プロファイル選択 --</option>';

  Object.keys(profiles).sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = (name === currentValue);
    select.appendChild(option);
  });
}

function extractModNamesFromRegex(regex: string) {
    const modNames = [];
    const cleanRegex = regex.replace(/^"!?|"$/g, '');
    const regexParts = cleanRegex.split('|').filter(part => part.trim());
    
    regexParts.forEach(part => {
        Object.entries(ModList).forEach(([key, value]) => {
            if (value.Regex === part) {
                modNames.push(value.mod);
            }
        });
    });
    
    return modNames;
}

function copyUnidentified() {
    const text = currentLanguage === 'ja' ? '未鑑定' : 'unid';
    copyTextToClipboard(text);
}

function copyNormal() {
    const text = currentLanguage === 'ja' ? 'ル$' : '"y: n"';
    copyTextToClipboard(text);
}

function copyMagic() {
    const text = currentLanguage === 'ja' ? 'ク$' : '"y: m"';
    copyTextToClipboard(text);
}

function copyRare() {
    const text = currentLanguage === 'ja' ? 'ア$' : '"y: r"';
    copyTextToClipboard(text);
}

function copyCorrupted() {
    const text = currentLanguage === 'ja' ? 'コラプト' : 'pted';
    copyTextToClipboard(text);
}

function copyNonCorrupted() {
    const text = currentLanguage === 'ja' ? '!コラプト' : '!pted';
    copyTextToClipboard(text);
}

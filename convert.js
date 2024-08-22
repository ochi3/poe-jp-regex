function convertRegex() {
  const engRegex = document.getElementById('engRegexInput').value;
  let jpRegex = '';
  let details = [];

  // Check if the input starts with "!"
  const isNegated = engRegex.startsWith('"!');
  const cleanEngRegex = engRegex.replace(/^"|"$/g, '').replace(/^!/, '');

  const engParts = cleanEngRegex.split('|');

  engParts.forEach(part => {
    const trimmedPart = part.trim();
    for (const [key, value] of Object.entries(ModList)) {
      if (value.engRegex === trimmedPart) {
        jpRegex += (jpRegex ? '|' : '') + value.Regex;
        details.push(value.mod);
        break;
      }
    }
  });

  // Add negation if the original input was negated
  if (isNegated) {
    jpRegex = `"!${jpRegex}"`;
  } else if (engRegex.startsWith('"') && engRegex.endsWith('"')) {
    jpRegex = `"${jpRegex}"`;
  }

  document.getElementById('jpRegexOutput').textContent = jpRegex;

  const detailsList = document.getElementById('detailsList');
  detailsList.innerHTML = '';
  details.forEach(detail => {
    const li = document.createElement('li');
    li.textContent = detail;
    detailsList.appendChild(li);
  });
}

function copyJpRegex() {
  const jpRegex = document.getElementById('jpRegexOutput').textContent;
  navigator.clipboard.writeText(jpRegex).then(() => {
  }).catch(err => {
    console.error('クリップボードへのコピーに失敗しました', err);
    alert('クリップボードへのコピーに失敗しました。');
  });
}

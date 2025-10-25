function convertRegex() {
  const engRegex = document.getElementById('engRegexInput').value;
  let jpRegexParts = new Set();
  let details = [];

  // !確認
  const isNegated = engRegex.startsWith('"!');
  const cleanEngRegex = engRegex.replace(/^"|"$/g, '').replace(/^!/, '');

  const engParts = cleanEngRegex.split('|');

  engParts.forEach(part => {
    const trimmedPart = part.trim();
    
    // 空文字列はスキップ
    if (!trimmedPart) return;
    
    // 完全一致を優先して検索
    let foundExact = false;
    for (const [key, value] of Object.entries(ModList)) {
      if (value.engRegex === trimmedPart) {
        jpRegexParts.add(value.Regex);
        details.push(value.mod);
        foundExact = true;
        break;
      }
    }
    
    // 完全一致が見つからなかった場合、パターンマッチングを実行
    if (!foundExact) {
      const matches = findMatchingMods(trimmedPart);
      matches.forEach(match => {
        jpRegexParts.add(match.Regex);
        details.push(match.mod);
      });
      
      // マッチが見つからなかった場合は警告を表示
      if (matches.length === 0) {
        console.warn(`パターン "${trimmedPart}" に一致するModが見つかりませんでした`);
      }
    }
  });

  let jpRegex = Array.from(jpRegexParts).join('|');

  if (isNegated) {
    jpRegex = `"!${jpRegex}"`;
  } else if (engRegex.startsWith('"') && engRegex.endsWith('"')) {
    jpRegex = `"${jpRegex}"`;
  }

  document.getElementById('jpRegexOutput').textContent = jpRegex;

  const detailsList = document.getElementById('detailsList');
  detailsList.innerHTML = '';
  
  if (details.length === 0) {
    const li = document.createElement('li');
    li.textContent = '一致するModが見つかりませんでした';
    li.style.color = 'var(--text-secondary)';
    detailsList.appendChild(li);
  } else {
    details.forEach(detail => {
      const li = document.createElement('li');
      li.textContent = detail;
      detailsList.appendChild(li);
    });
  }
}

/**
 * 英語パターンに一致するModを検索
 * @param {string} pattern - 検索パターン
 * @returns {Array} - マッチしたModの配列
 */
function findMatchingMods(pattern) {
  const matches = [];
  
  try {
    // パターンを正規表現として扱う
    const regex = new RegExp(pattern, 'i'); // 大文字小文字を区別しない
    
    for (const [key, value] of Object.entries(ModList)) {
      // engRegexとengModの両方でマッチングを試みる
      if (regex.test(value.engRegex) || regex.test(value.engMod)) {
        matches.push(value);
      }
    }
  } catch (e) {
    // 正規表現として無効な場合は、部分一致で検索
    console.warn(`正規表現エラー: ${e.message}. 部分一致で検索します。`);
    
    const lowerPattern = pattern.toLowerCase();
    for (const [key, value] of Object.entries(ModList)) {
      const engRegexLower = value.engRegex.toLowerCase();
      const engModLower = value.engMod.toLowerCase();
      
      if (engRegexLower.includes(lowerPattern) || engModLower.includes(lowerPattern)) {
        matches.push(value);
      }
    }
  }
  
  return matches;
}

/**
 * より詳細なマッチング情報を表示する拡張版
 */
function convertRegexWithDetails() {
  const engRegex = document.getElementById('engRegexInput').value;
  let jpRegexParts = new Set();
  let detailsWithMatch = [];

  const isNegated = engRegex.startsWith('"!');
  const cleanEngRegex = engRegex.replace(/^"|"$/g, '').replace(/^!/, '');
  const engParts = cleanEngRegex.split('|');

  engParts.forEach(part => {
    const trimmedPart = part.trim();
    if (!trimmedPart) return;
    
    // 完全一致チェック
    let foundExact = false;
    for (const [key, value] of Object.entries(ModList)) {
      if (value.engRegex === trimmedPart) {
        jpRegexParts.add(value.Regex);
        detailsWithMatch.push({
          pattern: trimmedPart,
          mod: value.mod,
          matchType: '完全一致'
        });
        foundExact = true;
        break;
      }
    }
    
    if (!foundExact) {
      const matches = findMatchingMods(trimmedPart);
      matches.forEach(match => {
        jpRegexParts.add(match.Regex);
        detailsWithMatch.push({
          pattern: trimmedPart,
          mod: match.mod,
          matchType: 'パターン一致'
        });
      });
      
      if (matches.length === 0) {
        detailsWithMatch.push({
          pattern: trimmedPart,
          mod: null,
          matchType: '未マッチ'
        });
      }
    }
  });

  let jpRegex = Array.from(jpRegexParts).join('|');

  if (isNegated) {
    jpRegex = `"!${jpRegex}"`;
  } else if (engRegex.startsWith('"') && engRegex.endsWith('"')) {
    jpRegex = `"${jpRegex}"`;
  }

  document.getElementById('jpRegexOutput').textContent = jpRegex;

  const detailsList = document.getElementById('detailsList');
  detailsList.innerHTML = '';
  
  if (detailsWithMatch.length === 0) {
    const li = document.createElement('li');
    li.textContent = '検索パターンが入力されていません';
    li.style.color = 'var(--text-secondary)';
    detailsList.appendChild(li);
  } else {
    detailsWithMatch.forEach(detail => {
      const li = document.createElement('li');
      
      if (detail.matchType === '未マッチ') {
        li.innerHTML = `<span style="color: #FCA5A5;">"${detail.pattern}" - マッチなし</span>`;
      } else {
        li.innerHTML = `${detail.mod} <span style="color: var(--text-secondary); font-size: 0.9em;">(${detail.matchType})</span>`;
      }
      
      detailsList.appendChild(li);
    });
  }
}

function copyJpRegex() {
  const jpRegex = document.getElementById('jpRegexOutput').textContent;
  navigator.clipboard.writeText(jpRegex).then(() => {
    if (typeof showNotification === 'function') {
      showNotification('コピーしました!');
    } else {
      alert('コピーしました!');
    }
  }).catch(err => {
    console.error('クリップボードへのコピーに失敗しました', err);
    if (typeof showNotification === 'function') {
      showNotification('❌ コピー失敗', true);
    } else {
      alert('クリップボードへのコピーに失敗しました。');
    }
  });
}
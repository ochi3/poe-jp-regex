function getFixedRangeRegex(num: string | number, basePattern: string, optimize = false): string {
  const parsedNumber = parseInt(String(num));
  num = parsedNumber;
  if (isNaN(num) || num < 0) return '';
  const quant = optimize ? Math.floor(num / 10) * 10 : num;
  let numberRegex;

  if (quant === 0) {
    return num === 0 ? `"${basePattern}0%"` : `"${basePattern}[0-${num}]%"`;
  }

  if (quant <= 9) {
    // 1桁: [x-9]
    numberRegex = `[${quant}-9]`;
  } else if (quant === 100) {
    // ちょうど100: \d.. (先頭\dで制約、後ろ2桁は.)
    return `"${basePattern}\\d..%"`;
  } else if (quant < 100) {
    // 2桁: 末尾桁は . に
    const str = quant.toString();
    const d0 = str[0];
    const d1 = str[1] || '0';
    if (d1 === '0') {
      // 10, 20, 30 など: [d0-9]. | \d.. (d0=9のときは 9. | \d.. → ただし100+の\d..に含まれるので 9. のみ)
      if (d0 === '9') {
        numberRegex = `9.|\\d..`;
      } else {
        numberRegex = `[${d0}-9].|\\d..`;
      }
    } else if (d0 === '9') {
      // 91, 95 など: 9[d1-9] | \d..
      numberRegex = `${d0}[${d1}-9]|\\d..`;
    } else {
      // 一般: d0[d1-9] | [d0+1-9]. | \d..
      numberRegex = `${d0}[${d1}-9]|[${Number(d0) + 1}-9].|\\d..`;
    }
  } else if (quant < 1000) {
    // 3桁
    if (quant % 100 === 0) {
      // 200, 300 など: [d0-9]..
      const d0 = quant / 100;
      numberRegex = `[${d0}-9]..`;
    } else {
      const str = quant.toString();
      const d0 = parseInt(str[0]);
      const d1 = parseInt(str[1] || '0');
      const d2 = parseInt(str[2] || '0');
      let parts = [];

      if (d2 === 0) {
        // 末桁が0: d0[d1-9]. | [d0+1-9]..
        if (d1 < 9) {
          parts.push(`${d0}[${d1}-9].`);
        } else {
          parts.push(`${d0}9.`);
        }
        if (d0 < 9) {
          parts.push(`[${d0 + 1}-9]..`);
        }
      } else {
        // 一般: [d0+1-9].. | d0[d1+1-9]. | d0d1[d2-9]
        if (d0 < 9) {
          parts.push(`[${d0 + 1}-9]..`);
        }
        if (d1 < 9) {
          parts.push(`${d0}[${d1 + 1}-9].`);
        }
        parts.push(`${d0}${d1}[${d2}-9]`);
      }

      numberRegex = parts.join('|');
    }
  } else {
    // 1000以上
    numberRegex = `\\d{4,}%`;
  }

  return `"${basePattern}${quant >= 10 ? '(' + numberRegex + ')' : numberRegex}%"`;
}

function copyTextToClipboard(text: string): void {
    navigator.clipboard.writeText(text)
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

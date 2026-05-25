(function () {
  'use strict';

  var DIRECTION_LABELS = {
    ja2en: '日本語 → 英語',
    en2ja: '英語 → 日本語'
  };

  function setStatus(message, isError) {
    var el = document.getElementById('itemTransStatus');
    if (!el) return;
    el.textContent = message || '';
    el.style.color = isError ? '#ff8a80' : 'var(--text-secondary)';
  }

  function translateItemText() {
    var input = document.getElementById('itemTransInput');
    var output = document.getElementById('itemTransOutput');
    if (!input || !output) return;

    if (!window.JpPoeUtils || typeof window.JpPoeUtils.translateItemTextAuto !== 'function') {
      setStatus('変換エンジンの読み込みに失敗しました。', true);
      return;
    }

    var text = input.value;
    if (!text.trim()) {
      setStatus('入力が空です。', true);
      return;
    }

    try {
      var result = window.JpPoeUtils.translateItemTextAuto(text);
      output.value = result.result;
      var label = DIRECTION_LABELS[result.direction] || '変換';
      setStatus(label + ' に変換しました');
    } catch (err) {
      output.value = '';
      setStatus(err && err.message ? err.message : String(err), true);
    }
  }

  function copyItemTransOutput() {
    var output = document.getElementById('itemTransOutput');
    if (!output || !output.value) {
      setStatus('コピーする出力がありません。', true);
      return;
    }
    navigator.clipboard.writeText(output.value).then(function () {
      if (typeof showNotification === 'function') {
        showNotification('コピーしました！');
      }
      setStatus('結果をクリップボードにコピーしました');
    }).catch(function () {
      output.select();
      document.execCommand('copy');
      setStatus('結果をコピーしました');
    });
  }

  function clearItemTransFields() {
    var input = document.getElementById('itemTransInput');
    var output = document.getElementById('itemTransOutput');
    if (input) input.value = '';
    if (output) output.value = '';
    setStatus('');
  }

  function initItemTranslatorTab() {
    var input = document.getElementById('itemTransInput');
    if (input) {
      input.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          translateItemText();
        }
      });
    }
  }

  window.translateItemText = translateItemText;
  window.copyItemTransOutput = copyItemTransOutput;
  window.clearItemTransFields = clearItemTransFields;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initItemTranslatorTab);
  } else {
    initItemTranslatorTab();
  }
})();

import {modExamples,searchTargets} from './mod-search-text.mjs';
const normalize=text=>String(text||'').replace(/^\(T17\)\s*/,'').replace(/\s+/g,' ').trim();
export function auditRegex(tables,{languages=['ja','en']}={}) {
  const entries=Object.entries(tables).flatMap(([table,data])=>Object.entries(data).map(([key,entry])=>({table,key,entry})));
  const targets=new Map(languages.map(language=>[language,entries.flatMap(item=>searchTargets(item.entry,language).map(target=>({...item,...target})))]));
  const checks=[];
  for(const item of entries)for(const language of languages) {
    const pattern=item.entry[language==='ja'?'Regex':'engRegex'];
    const check={table:item.table,key:item.key,sourceIds:item.entry.sourceIds||[],language,pattern:pattern||'',errors:[],hits:[]};
    checks.push(check);
    if(typeof pattern!=='string'||!pattern.trim()){check.errors.push({code:'empty',message:'Regex未設定'});continue;}
    let regex;
    try{regex=new RegExp(pattern,'i');}catch(error){check.errors.push({code:'invalid',message:error.message});continue;}
    // A pattern must match the body itself, rather than only its tags or explanation.
    for(const example of modExamples(item.entry,language))if(!example.split('\n').some(line=>regex.test(line)))check.errors.push({code:'no-match',message:'数値サンプルを入れたMod本文に一致しません',example});
    for(const target of targets.get(language)) {
      const self=target.table===item.table&&target.key===item.key;
      const body=target.field==='mod'||target.field==='engMod';
      if(self&&body)continue;
      const match=regex.exec(target.text);
      if(!match)continue;
      const sameEffect=body&&normalize(target.entry[language==='ja'?'mod':'engMod'])===normalize(item.entry[language==='ja'?'mod':'engMod']);
      check.hits.push({table:target.table,key:target.key,field:target.field,text:target.text,matched:match[0],index:match.index,self,sameEffect});
    }
  }
  return {createdAt:new Date().toISOString(),tables:Object.fromEntries(Object.entries(tables).map(([name,data])=>[name,Object.keys(data).length])),summary:{patterns:checks.length,errors:checks.filter(check=>check.errors.length).length,collisions:checks.filter(check=>check.hits.some(hit=>!hit.sameEffect)).length,sameEffect:checks.filter(check=>check.hits.some(hit=>hit.sameEffect)).length},checks};
}
const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function auditHtml(report) {
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Regex誤一致チェック</title><style>body{font:15px sans-serif;margin:24px;background:#181818;color:#eee}input{padding:10px;width:min(600px,85%)}details{margin:12px 0;background:#252525;padding:12px}summary{cursor:pointer;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{padding:8px;border:1px solid #555;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}mark{background:#ffcd50;color:#111}.error{color:#ff9b9b}.same-effect{opacity:.65}body:not(.show-same) .same-effect{display:none}small{color:#ccc}</style><h1>Regex誤一致チェック</h1><p>Regex ${report.summary.patterns}件 / 未設定・構文・本文不一致 ${report.summary.errors}件 / 誤一致候補あり ${report.summary.collisions}件</p><p>日英それぞれ、大文字・小文字を区別せず検証。自分のMod本文は正しい一致として除外し、自分のタグ・説明への一致も表示します。同文言のModへの一致は別扱いです。</p><p>JavaScriptによる近似検証です。数値は最小・中間・最大の例を使用します。ゲーム内の最終確認も必要です。Regexの変更は行いません。</p><input id="filter" placeholder="Mod名・Regex・一致した文字列で絞り込み" aria-label="検索"><label><input id="same" type="checkbox" style="width:auto"> 同文言のModへの一致も表示</label>${report.checks.filter(check=>check.errors.length||check.hits.length).map(check=>`<details class="check"${check.errors.length?' open':''}><summary>${escape(check.language.toUpperCase())} <code>${escape(check.pattern||'未設定')}</code> — ${escape(check.key)} <small>問題 ${check.errors.length} / 一致 ${check.hits.filter(hit=>!hit.sameEffect).length}</small></summary><p><small>${escape(check.table)}</small></p>${check.errors.map(error=>`<p class="error">${escape(error.message)}${error.example?`：${escape(error.example)}`:''}</p>`).join('')}<table><thead><tr><th>一致先のMod</th><th>項目</th><th>一致した文字列</th></tr></thead><tbody>${check.hits.map(hit=>`<tr${hit.sameEffect?' class="same-effect"':''}><td>${escape(hit.key)}${hit.self?'（自分の付加情報）':''}${hit.sameEffect?'（同文言）':''}<br><small>${escape(hit.table)}</small></td><td>${escape(hit.field)}</td><td>${escape(hit.text.slice(0,hit.index))}<mark>${escape(hit.matched)||'空文字'}</mark>${escape(hit.text.slice(hit.index+hit.matched.length))}</td></tr>`).join('')}</tbody></table></details>`).join('')}<script>document.querySelector('#filter').addEventListener('input',event=>{const text=event.target.value.toLowerCase();document.querySelectorAll('.check').forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(text);});});document.querySelector('#same').addEventListener('change',event=>document.body.classList.toggle('show-same',event.target.checked));</script></html>`;
}

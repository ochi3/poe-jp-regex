/** Review game Mod dictionaries without changing the published data. */
const ids = entry => entry.sourceIds || [];
const identity = (key, entry) => ids(entry)[0] || key;
const normalize = text => String(text || '').replace(/^\(T17\)\s*/, '').replace(/\s+/g, ' ').trim();
export {modExamples} from './mod-search-text.mjs';
import {auditRegex} from './regex-audit.mjs';
export function inspectRegex(data) {
  const findings=[];
  for(const check of auditRegex({mods:data}).checks) {
    const issue={key:check.key,identity:check.sourceIds[0]||check.key,language:check.language,pattern:check.pattern};
    for(const error of check.errors)findings.push({...issue,code:error.code,severity:'error',detail:error.message,examples:error.example?[error.example]:undefined});
    const hits=check.hits.filter(hit=>!hit.sameEffect);
    if(hits.length)findings.push({...issue,code:'overlap',severity:'warning',matches:[...new Set(hits.map(hit=>hit.key))],details:hits});
  }
  return findings;
}
export function reviewMods(before, after) {
  const changes = {added:[],removed:[],changed:[],identified:[]};
  const available = new Set(Object.keys(before));
  const identityErrors = [];
  const owner = new Map();
  for(const [key,entry] of Object.entries(after)) for(const id of ids(entry)) {
    if(owner.has(id)) identityErrors.push({key,code:'duplicate-source-id',severity:'error',detail:id});
    owner.set(id,key);
  }
  for(const [key,entry] of Object.entries(after)) {
    const byId = [...available].filter(oldKey=>ids(before[oldKey]).some(id=>ids(entry).includes(id)));
    if(byId.length>1) {identityErrors.push({key,code:'ambiguous-identity',severity:'error',matches:byId});continue;}
    let previousKey=byId[0];
    if(!previousKey && available.has(key) && (!ids(entry).length || !ids(before[key]).length)) previousKey=key;
    if(!previousKey) {
      const byEnglish=[...available].filter(oldKey=>(!ids(entry).length || !ids(before[oldKey]).length) && normalize(before[oldKey].engMod) && normalize(before[oldKey].engMod)===normalize(entry.engMod));
      if(byEnglish.length===1) previousKey=byEnglish[0];
    }
    if(previousKey===undefined) {changes.added.push({key,sourceIds:ids(entry)});continue;}
    available.delete(previousKey);
    const previous=before[previousKey];
    const fields=[...new Set([...Object.keys(previous),...Object.keys(entry)])].filter(field=>field!=='sourceIds' && JSON.stringify(previous[field])!==JSON.stringify(entry[field]));
    if(previousKey!==key) fields.unshift('key');
    if(fields.length) changes.changed.push({key,previousKey,sourceIds:ids(entry),fields,before:previous,after:entry});
    else if(JSON.stringify(ids(previous))!==JSON.stringify(ids(entry))) changes.identified.push({key,sourceIds:ids(entry)});
  }
  changes.removed=[...available].map(key=>({key,sourceIds:ids(before[key])}));
  const oldFindings=inspectRegex(before);
  const oldProblems=new Set(oldFindings.filter(f=>f.severity==='error').map(f=>JSON.stringify([f.key,f.language,f.code,f.pattern])));
  const findings=inspectRegex(after).map(f=>{
    const previous=changes.changed.find(c=>c.key===f.key)?.previousKey || f.key;
    const field=f.language==='ja'?'mod':'engMod';
    const unchangedText=before[previous]?.[field]===after[f.key]?.[field] && before[previous]?.value===after[f.key]?.value;
    return {...f,existing:oldProblems.has(JSON.stringify([previous,f.language,f.code,f.pattern])) && (f.code!=='no-match'||unchangedText)};
  });
  for(const [key,entry] of Object.entries(after)) {
    if(!ids(entry).length) findings.push({key,code:'missing-source-id',severity:'warning'});
    if(!entry.tradeStatIds?.length || entry.tradeStatIds.some(id=>!id)) findings.push({key,code:'missing-trade-id',severity:'warning'});
  }
  const blocking=[...identityErrors,...findings.filter(f=>f.severity==='error'&&!f.existing)];
  if(Object.keys(after).length < Object.keys(before).length * 0.75) blocking.push({code:'large-removal',severity:'error',detail:'Mod count decreased by more than 25%'});
  return {counts:Object.fromEntries(Object.entries(changes).map(([kind,entries])=>[kind,entries.length])),changes,findings,blocking};
}
export function reportHtml(report) {
  const escape = text => String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><title>マップMod更新レポート</title><style>body{font:16px sans-serif;max-width:1100px;margin:32px auto;padding:16px;background:#181818;color:#eee}pre{white-space:pre-wrap;overflow-wrap:anywhere}summary{cursor:pointer;padding:12px;background:#303030}a{color:#8bd}</style><h1>マップMod更新レポート</h1><p>状態: ${escape(({applied:'反映完了',preview:'確認のみ',failed:'反映停止',generating:'生成中'})[report.status] || report.status)} / ${escape(report.createdAt)}</p><p>既存の問題は記録し、新たなRegexエラー・ID重複・25%超の件数減少を検出した場合は反映を止めます。Regex検証はJavaScriptによる近似です。ゲーム内での確認も行ってください。</p>${Object.entries(report.tables||{}).map(([name,value])=>`<h2>${escape(name)}</h2><p>${escape(`追加 ${value.counts.added} / 変更 ${value.counts.changed} / 削除 ${value.counts.removed} / ID付与 ${value.counts.identified}`)}</p>${['changes','blocking','findings'].map(kind=>`<details${kind==='blocking'?' open':''}><summary>${{changes:'追加・変更・削除',blocking:'反映を止める問題',findings:'Regex・IDの確認事項'}[kind]}</summary><pre>${escape(JSON.stringify(value[kind],null,2))}</pre></details>`).join('')}`).join('')}${report.error?`<h2>失敗理由</h2><pre>${escape(report.error)}</pre>`:''}<details><summary>入力元・実行コマンド</summary><pre>${escape(JSON.stringify(report.sources,null,2))}</pre></details></html>`;
}

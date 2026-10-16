export function displayText(text) {
  return String(text || '').replace(/\[[^\]|]*\|([^\]]+)\]/g,'$1').replace(/\[([^\]]+)\]/g,'$1');
}
/** Searchable text for in-game Mod bodies and their additional display metadata. */
export function modExamples(entry, language) {
  const text = language === 'ja' ? entry.mod : entry.engMod;
  return [...new Set([0, 0.5, 1].map(ratio => displayText(text).split('|').map((line,index) => {
    const raw=String(entry.value || '').split('|')[index] || '';
    const range=raw.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    const min=range?Number(range[1]):Number(raw.match(/-?\d+(?:\.\d+)?/)?.[0] || 1);
    const max=range?Number(range[2]):min;
    const precision=Math.max(0,...(raw.match(/\.\d+/g)||[]).map(value=>value.length-1));
    const value=Number((min+(max-min)*ratio).toFixed(precision));
    return line.replace(/\(##?\)|##?/g,String(value));
  }).join('\n').replace(/^\(T17\)\s*/, '')))];
}
const typeNames={ja:{Prefix:'プレフィックスモッド',Suffix:'サフィックスモッド',Adjacent:'隣接',Voyage:'航海'},en:{Prefix:'Prefix Modifier',Suffix:'Suffix Modifier',Adjacent:'Adjacent',Voyage:'Voyage'}};
export function searchTargets(entry,language) {
  const targets=[];
  function add(field,text) {
    if(typeof text!=='string'||!text.trim())return;
    text=displayText(text);
    for(const part of new Set([text,...text.split(/\r?\n/)]))if(part.trim()&&!targets.some(target=>target.field===field&&target.text===part))targets.push({field,text:part});
  }
  for(const example of modExamples(entry,language))add(language==='ja'?'mod':'engMod',example);
  add('type',entry.type);
  add('type',typeNames[language][entry.type]);
  add(language==='ja'?'nameJa':'nameEn',entry[language==='ja'?'nameJa':'nameEn']);
  const tags=(entry.modTags || []).map(tag=>tag[language]).filter(Boolean);
  for(const tag of tags)add('modTags',tag);
  add('modTags',tags.join(', '));
  add('modTags',tags.join('、'));
  for(const text of entry.reminderText?.[language] || [])add('reminderText',text);
  return targets;
}

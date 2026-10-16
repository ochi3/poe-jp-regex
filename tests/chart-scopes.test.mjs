import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewMods} from '../tooling/data/map-review.mjs';
const {buildChartScopes,literalRegex}=createRequire(import.meta.url)('../tooling/data/chart-scopes.cjs');
const mods={
 AdjacentBox1:{type:'Box',domain:'deepwater_chart',generation_type:'deepwater_chart',required_level:1,stats:[{id:'boxes',min:1,max:1},{id:'local_deepwater_mod_applies_to_adjacent_charts',min:1,max:1}],spawn_weights:[{tag:'chart',weight:100}]},
 AdjacentBox2:{type:'Box',domain:'deepwater_chart',generation_type:'deepwater_chart',required_level:2,stats:[{id:'boxes',min:2,max:3},{id:'local_deepwater_mod_applies_to_adjacent_charts',min:1,max:1}],spawn_weights:[{tag:'chart',weight:50}]},
 VoyagePossessed:{type:'Possessed',domain:'deepwater_chart',generation_type:'deepwater_chart',stats:[{id:'possessed',min:100,max:100},{id:'local_deepwater_mod_applies_globally',min:1,max:1}],spawn_weights:[{tag:'chart',weight:100}]},
 AdjacentFractured:{type:'Fractured',domain:'deepwater_chart',generation_type:'deepwater_chart',stats:[{id:'fractured',min:2,max:2},{id:'local_deepwater_mod_applies_to_adjacent_charts',min:1,max:1}],spawn_weights:[{tag:'chart',weight:100}]}
};
const translations=[
 {ids:['boxes'],ja:'隣接エリアにストロングボックスが追加で{0}個出現する',en:'{0} additional Strongboxes in adjacent Areas'},
 {ids:['possessed'],ja:'全ての航海エリアのレアモンスターは{0}%の確率で憑依されている',en:'{0}% chance for Rare Monsters in all Voyage Areas to be Possessed'},
 {ids:['fractured'],ja:'隣接エリアでドロップするアイテムは{0}%の確率でフラクチャー状態になる',en:'Items dropped in adjacent Areas have {0}% chance to be Fractured'}
];
test('chart scope extraction includes untranslated raw mods, voyage scopes and every tier ID',()=>{
 const data=buildChartScopes({mods,translations});
 assert.equal(Object.keys(data).length,3);
 const box=Object.values(data).find(e=>e.sourceIds.includes('AdjacentBox1'));
 assert.deepEqual(box.sourceIds,['AdjacentBox1','AdjacentBox2']);assert.equal(box.value,'2-3');
 assert.equal(Object.values(data).filter(e=>e.voyage).length,1);
 assert.equal(reviewMods({},data).blocking.filter(issue=>issue.code==='empty').length,6);
 for(const entry of Object.values(data)) {assert.equal(entry.Regex,'');assert.equal(entry.engRegex,'');}
});
test('chart scope extraction preserves existing hand-adjusted regex and reports no fake removals',()=>{
 const before=buildChartScopes({mods,translations});
 for(const entry of Object.values(before)) {entry.Regex='手動設定';entry.engRegex='manual-only';}
 const after=buildChartScopes({mods,translations,previous:before});
 assert.equal(reviewMods(before,after).counts.removed,0);
 for(const [key,value] of Object.entries(before))assert.equal(after[key].engRegex,value.engRegex);
});
test('literal snippets match original text without concatenating words or leaking brackets',()=>{
 for(const text of ['[DNT] Dropped items have #% chance to be Fractured','100% chance for Rare Monsters in Area to be Possessed']) {
  const pattern=literalRegex(text,new Set(['Drop','ropp','oppe']),true);
  assert.ok(new RegExp(pattern,'i').test(text));
 }
});
test('a chart with no translation stops generation instead of silently disappearing',()=>{
 assert.throws(()=>buildChartScopes({mods,translations:[]}),/翻訳が見つかりません/);
});

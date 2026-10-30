function siteGame(): string {return 'poe1';}
function selectionPanels(): SelectionPanel[] {
  const catalog=(outputId: string,selected: ()=>Set<string>,data: any,save: ()=>void,render: ()=>void,update: ()=>void): SelectionPanel=>({outputId,choices:()=>[...selected()].map(key=>({kind:'選択',label:currentLanguage==='en'?(data[key]?.engName||key):key,remove:()=>{selected().delete(key);save();render();update();}}))});
  return [
    {outputId:'chartRegexOutput',choices:()=>window.getChartSelectionChoices?.()||[]},
    catalog('beastRegexOutput',()=>checkedBeasts,beastlist,saveBeastCheckboxState,renderbeastlist,updateBeastRegex),
    catalog('scarabRegexOutput',()=>checkedScarabs,scarablist,saveScarabCheckboxState,renderscarablist,updateScarabRegex),
    catalog('essenceRegexOutput',()=>checkedEssences,essencelist,saveEssenceCheckboxState,renderessencelist,updateEssenceRegex),
    catalog('tattooRegexOutput',()=>checkedTattoos,tattoolist,saveTattooCheckboxState,rendertattoolist,updateTattooRegex),
    catalog('runegraftRegexOutput',()=>checkedRunegrafts,runegraftlist,saveRunegraftCheckboxState,renderrunegraftlist,updateRunegraftRegex),
    {outputId:'combinedRegexOutput',choices:()=>[...checkedMods].map(([key,state])=>({kind:state==='ng'?'NG':'欲しい',label:formatModText(currentLanguage==='ja'?ModList[key]?.mod:ModList[key]?.engMod,ModList[key]?.value)||key,remove:()=>{checkedMods.delete(key);saveModCheckboxState();updateModList();updateCombinedRegex();}}))},
    {outputId:'combinedItemRegexOutput',choices:()=>[...itemCheckedMods].map(name=>({kind:'接辞',label:getRecombModDisplayName(rawItemMods.find(mod=>mod.name===name))||name,remove:()=>{itemCheckedMods.delete(name);saveItemModCheckboxState();saveItemTypeState(getElement('itemTypeSelect').value);updateSeparatedItemModLists();updateCombinedItemRegex();}}))},
    {outputId:'combinedFlaskRegexOutput',choices:()=>[...flaskCheckedMods].map(name=>({kind:'接辞',label:getRecombModDisplayName(rawFlaskMods.find(mod=>mod.name===name))||name,remove:()=>{flaskCheckedMods.delete(name);saveFlaskModCheckboxState();saveFlaskTypeState(getElement('flaskTypeSelect').value);updateSeparatedFlaskModLists();updateCombinedFlaskRegex();}}))},
  ];
}

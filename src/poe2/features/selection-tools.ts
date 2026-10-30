function siteGame(): string {return 'poe2';}
function selectionPanels(): SelectionPanel[] {
  return [
    {outputId:'combinedRegexOutput',choices:()=>[...checkedMods].map(([key,state])=>({kind:state==='ng'?'NG':'欲しい',label:formatModText(currentLanguage==='ja'?ModList[key]?.mod:ModList[key]?.engMod,ModList[key]?.value)||key,remove:()=>{checkedMods.delete(key);saveModCheckboxState();updateModList();updateCombinedRegex();}}))},
    {outputId:'tabletRegexOutput',choices:()=>[...tabletCheckedMods].map(key=>({kind:'選択',label:formatTabletModText(currentLanguage==='ja'?tabletModList[key]?.mod:tabletModList[key]?.engMod,tabletModList[key]?.value)||key,remove:()=>{tabletCheckedMods.delete(key);saveTabletState();updateTabletModList();updateTabletCombinedRegex();}}))},
  ];
}

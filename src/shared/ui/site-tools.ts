interface SelectionChoice {label: string; kind: string; remove(): void;}
interface SelectionPanel {outputId: string; choices(): SelectionChoice[];}
function toolsElement<K extends keyof HTMLElementTagNameMap>(tag: K,text='',className=''): HTMLElementTagNameMap[K] {
  const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;return element;
}
function toolsButton(label: string,action: ()=>void): HTMLButtonElement {
  const button=toolsElement('button',label);button.type='button';button.addEventListener('click',action);return button;
}
function mountProfileBackup(): void {
  const card=document.querySelector('#savedContent .card');if(!card)return;
  const box=toolsElement('details','','site-tools');box.id='profileBackupTools';
  box.append(toolsElement('summary','全プロファイルのバックアップ・復元'));
  box.append(toolsElement('p','このサイト・ブラウザーに保存されたPoE1／PoE2の全カテゴリをまとめて書き出します。復元は追加方式で、同名は別名にして既存の内容を残します。'));
  const status=toolsElement('p');status.setAttribute('role','status');
  const actions=toolsElement('div','','site-tools-actions');
  const recovery=toolsButton('復元前のバックアップを書き出す',()=>{
    try {const raw=readStoredText(PROFILE_RECOVERY_KEY);if(!raw)throw Error('復元前のバックアップはありません。');downloadProfileBackup(validateProfileBackup(JSON.parse(raw)),'poe-profiles-before-restore.json');}
    catch(error){status.textContent=error.message;}
  });
  recovery.disabled=!readStoredText(PROFILE_RECOVERY_KEY);
  actions.append(toolsButton('全プロファイルを書き出す',()=>{
    try {const backup=createProfileBackup();downloadProfileBackup(backup,'poe-profiles-'+new Date().toISOString().slice(0,10)+'.json');status.textContent='バックアップを書き出しました。';}
    catch(error){status.textContent='書き出しできません: '+error.message;}
  }),recovery);
  const fileLabel=toolsElement('label','復元するJSONファイル');fileLabel.htmlFor='profileBackupFile';
  const file=toolsElement('input');file.type='file';file.accept='.json,application/json';file.id='profileBackupFile';
  let pending: ProfileBackup=null;
  let fileRevision=0;
  const restore=toolsButton('確認した内容を追加で復元',()=>{
    if(!pending)return;
    try {const result=restoreProfileBackup(pending);status.textContent=`${result.count}件を復元しました（同名の別名保存 ${result.renamed}件）。再読み込みで反映されます。`;pending=null;restore.disabled=true;recovery.disabled=!readStoredText(PROFILE_RECOVERY_KEY);reload.hidden=false;}
    catch(error){status.textContent='復元できません。元のプロファイルは保持しています: '+error.message;}
  });
  restore.disabled=true;
  const reload=toolsButton('再読み込みして反映',()=>location.reload());reload.hidden=true;
  file.addEventListener('change',async()=>{
    const current=++fileRevision;
    pending=null;restore.disabled=true;
    try {
      const selected=file.files?.[0];if(!selected)return;
      if(selected.size>10*1024*1024)throw Error('ファイルは10MB以内にしてください。');
      const contents=await selected.text();
      if(current!==fileRevision)return;
      pending=validateProfileBackup(JSON.parse(contents));
      const summaries=Object.entries(pending.profiles).map(([key,profiles])=>`${key}: ${Object.keys(profiles).length}件`);
      status.textContent='内容を検証しました。'+summaries.join(' / ');restore.disabled=false;
    }catch(error){status.textContent='ファイルを読み込めません: '+error.message;}
  });
  box.append(actions,fileLabel,file,restore,reload,status);card.insertBefore(box,card.querySelector('#savedRegexList'));
}
let siteDataStatus: any=null;
function renderDataStatus(): void {
  const status=document.getElementById('dataStatusTools');if(!status||!siteDataStatus)return;
  const tab=document.getElementById('siteUtilities')?.closest('.tab-content')?.id||'mapContent';
  const category=tab.replace(/Content$/,'').toLowerCase();
  const info=siteDataStatus.categories?.[category]||(['saved','link','changelog'].includes(category)?siteDataStatus:null);
  const date=(value: string)=>{const parsed=new Date(value);return value&&!Number.isNaN(parsed.getTime())?[String(parsed.getFullYear()).slice(-2),String(parsed.getMonth()+1).padStart(2,'0'),String(parsed.getDate()).padStart(2,'0')].join('/'):'未記録';};
  status.textContent=`Modデータ更新: ${date(info?.mods?.updatedAt)} / 価格データ更新: ${info?.prices?date(info.prices.updatedAt):'対象データなし'}`;
  status.title=`表示中のRegexカテゴリの更新日です。対応ゲームバージョン: ${siteDataStatus.gameVersion||'未登録'}。${siteDataStatus.versionNote||''}`;
}
function mountDataStatus(container: HTMLElement): void {
  const status=toolsElement('p','更新情報を読み込み中…');status.id='dataStatusTools';status.setAttribute('role','status');container.append(status);
  const game=siteGame();
  fetch('data/status.json').then(response=>{if(!response.ok)throw Error();return response.json();}).then(data=>{
    const info=data.games?.[game];if(!info)throw Error();
    siteDataStatus=info;renderDataStatus();
  }).catch(()=>{status.textContent='データ更新情報を取得できません。';});
}
function mountSelectedConditions(): void {
  for(const panel of selectionPanels()) {
    const output=document.getElementById(panel.outputId);if(!output)continue;
    const selected=toolsElement('span','','selected-conditions');
    const dialog=toolsElement('dialog','','selection-dialog');dialog.id=panel.outputId+'SelectedDialog';
    const title=toolsElement('h2','選択中');title.id=dialog.id+'Title';dialog.setAttribute('aria-labelledby',title.id);
    const list=toolsElement('ul','','selected-condition-list');
    const heading=toolsButton('選択中（0件）',()=>dialog.showModal());
    heading.setAttribute('aria-haspopup','dialog');heading.setAttribute('aria-expanded','false');heading.setAttribute('aria-controls',dialog.id);
    heading.addEventListener('click',()=>heading.setAttribute('aria-expanded','true'));
    dialog.addEventListener('close',()=>heading.setAttribute('aria-expanded','false'));
    dialog.addEventListener('click',event=>{const bounds=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))dialog.close();});
    const close=toolsButton('閉じる',()=>dialog.close());
    const header=toolsElement('div','','selection-dialog-header');header.append(title,close);dialog.append(header,list);document.body.append(dialog);
    selected.append(heading);
    const reset=Array.from(output.closest('.card')?.querySelectorAll('button')||[]).find(button=>button.textContent.trim()==='リセット');
    if(reset)reset.before(selected);else output.after(selected);
    const render=()=>{
      const choices=panel.choices();heading.textContent=`選択中（${choices.length}件）`;list.replaceChildren();
      title.textContent=`選択中（${choices.length}件）`;
      if(!choices.length){list.append(toolsElement('li','選択なし'));return;}
      for(const choice of choices) {
        const row=toolsElement('li','','selected-condition-row');row.dataset.kind=choice.kind;
        row.append(toolsElement('span',`${choice.kind}: ${choice.label}`));
        const button=toolsButton('解除',()=>{choice.remove();render();close.focus();});
        button.className='selected-condition';button.setAttribute('aria-label',`${choice.kind}: ${choice.label} を解除`);row.append(button);list.append(row);
      }
    };
    new MutationObserver(render).observe(output,{childList:true,subtree:true,characterData:true});render();
  }
}
function positionSiteUtilities(tabId?: string): void {
  const tools=document.getElementById('siteUtilities');if(!tools)return;
  const tab=tabId?document.getElementById(tabId):Array.from(document.querySelectorAll<HTMLElement>('.tab-content')).find(element=>element.style.display==='block');
  const card=tab?.querySelector<HTMLElement>('.card');if(!card)return;
  let header=card.querySelector<HTMLElement>(':scope > .main-card-heading');
  if(!header){
    header=toolsElement('div','','main-card-heading');
    const title=card.querySelector(':scope > h2');
    if(title){card.insertBefore(header,title);header.append(title);}else card.prepend(header);
  }
  header.append(tools);
  renderDataStatus();
}
function initSiteTools(): void {
  const area=document.getElementById('contentArea');if(!area)return;
  const tools=toolsElement('div','','site-utilities');tools.id='siteUtilities';
  mountDataStatus(tools);
  const language=document.getElementById('globalLangToggleContainer');
  if(language){language.removeAttribute('style');tools.append(language);}
  area.prepend(tools);
  positionSiteUtilities();
  mountProfileBackup();mountSelectedConditions();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSiteTools);else initSiteTools();

import fs from 'node:fs';
import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:5174'?route.continue():route.abort());
});
for(const game of ['poe1','poe2']) {
 test(`${game}: switching Regex tabs shows that category's independent update date`,async({page})=>{
  await page.route('**/data/status.json',route=>route.fulfill({json:{games:{[game]:{gameVersion:null,categories:{
   map:{mods:{updatedAt:'2026-10-30T00:00:00Z'},prices:null},
   vendor:{mods:{updatedAt:'2026-10-01T00:00:00Z'},prices:null},
   item:{mods:{updatedAt:'2026-09-15T00:00:00Z'},prices:null},
  }}}}}));
  await page.goto(`/${game}.html#map`);
  await expect(page.locator('#dataStatusTools')).toHaveText('Modデータ更新: 26/10/30 / 価格データ更新: 対象データなし');
  await page.locator('a[data-tab="vendorContent"]').click();
  await expect(page.locator('#dataStatusTools')).toHaveText('Modデータ更新: 26/10/01 / 価格データ更新: 対象データなし');
  if(game==='poe1'){
   await page.locator('a[data-tab="itemContent"]').click();
   await expect(page.locator('#dataStatusTools')).toHaveText('Modデータ更新: 26/09/15 / 価格データ更新: 対象データなし');
  }
  await page.locator('a[data-tab="mapContent"]').click();
  await expect(page.locator('#dataStatusTools')).toContainText('26/10/30');
 });
 test(`${game}: reset-side button opens a condition dialog and header shows dates with language controls`,async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`/${game}.html#map`);
  await expect(page.locator('#regexCheckTools')).toHaveCount(0);
  const selected=page.locator('#mapContent .selected-conditions');
  const toggle=selected.locator(':scope > button');
  const dialog=page.locator('#combinedRegexOutputSelectedDialog');
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(dialog).toBeHidden();
  expect(await selected.evaluate(element=>element.nextElementSibling.textContent.trim())).toBe('リセット');
  await expect(page.locator('#dataStatusTools')).toBeVisible();
  await expect(page.locator('#dataStatusTools')).toContainText(/Modデータ更新: \d{2}\/\d{2}\/\d{2} \/ 価格データ更新:/);
  await expect(page.locator('#mapContent .card #siteUtilities')).toHaveCount(1);
  await expect(page.locator('#siteUtilities #globalLangToggleContainer')).toBeVisible();
  await page.locator('#ModList .effect-item:not([aria-disabled="true"])').first().click();
  await expect(toggle).toHaveText('選択中（1件）');
  await expect(dialog).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('li')).toHaveCount(1);
  await page.screenshot({path:testInfo.outputPath('condition-dialog.png')});
  await dialog.locator('.selected-condition').click();
  await expect(toggle).toHaveText('選択中（0件）');
  await expect(page.locator('#combinedRegexOutput')).toHaveText('');
  await dialog.getByRole('button',{name:'閉じる',exact:true}).click();
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await page.locator('#siteUtilities').scrollIntoViewIfNeeded();
  const layout=await page.locator('#siteUtilities').evaluate(element=>{const box=element.getBoundingClientRect();return {left:box.left,right:box.right,viewport:innerWidth};});
  expect(layout.left).toBeGreaterThanOrEqual(0);expect(layout.right).toBeLessThanOrEqual(layout.viewport+1);
  await page.screenshot({path:testInfo.outputPath('compact-tools.png')});
  expect(errors).toEqual([]);
 });
 test(`${game}: backup download, validated restore and same-name recovery preserve both games`,async({page},testInfo)=>{
  await page.addInitScript(()=>{
   if(!localStorage.getItem('poeProfiles'))localStorage.setItem('poeProfiles',JSON.stringify({same:{mods:[],settings:{}}}));
   if(!localStorage.getItem('poe2_poeProfiles'))localStorage.setItem('poe2_poeProfiles',JSON.stringify({same:{mods:[],settings:{}}}));
  });
  await page.goto(`/${game}.html#saved`);
  await page.locator('#profileBackupTools summary').click();
  const downloaded=page.waitForEvent('download');
  await page.getByRole('button',{name:'全プロファイルを書き出す',exact:true}).click();
  const download=await downloaded,file=testInfo.outputPath('backup.json');await download.saveAs(file);
  const backup=JSON.parse(fs.readFileSync(file,'utf8'));
  expect(backup.profiles.poeProfiles.same).toBeTruthy();expect(backup.profiles.poe2_poeProfiles.same).toBeTruthy();
  const original=await page.evaluate(()=>localStorage.getItem('poeProfiles'));
  const invalid={...backup,profiles:{...backup.profiles,itemProfiles:{bad:{mods:1}}}};
  await page.locator('#profileBackupFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
  await expect(page.locator('#profileBackupTools')).toContainText('ファイルを読み込めません');
  await expect(page.getByRole('button',{name:'確認した内容を追加で復元',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>localStorage.getItem('poeProfiles'))).toBe(original);
  await page.locator('#profileBackupFile').setInputFiles(file);
  await expect(page.locator('#profileBackupTools')).toContainText('内容を検証しました');
  await page.getByRole('button',{name:'確認した内容を追加で復元',exact:true}).click();
  await expect(page.locator('#profileBackupTools')).toContainText('2件を復元');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('poeProfiles')));
  expect(stored.same).toBeTruthy();expect(stored['same (復元 1)']).toBeTruthy();
  const recoveryDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'復元前のバックアップを書き出す',exact:true}).click();
  const recoveryFile=testInfo.outputPath('recovery.json');await (await recoveryDownload).saveAs(recoveryFile);
  expect(Object.keys(JSON.parse(fs.readFileSync(recoveryFile,'utf8')).profiles.poeProfiles)).toEqual(['same']);
  await page.getByRole('button',{name:'再読み込みして反映',exact:true}).click();
  await expect(page.locator('#savedContent')).toContainText('same (復元 1)');
 });
}

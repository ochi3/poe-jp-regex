import {test,expect} from '@playwright/test';

test('extra map highlights render below the amount inputs and persist on reload',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/poe1.html#map');
 const group=page.getByRole('group',{name:'下記いずれかに一致'});
 await expect(page.locator('#tradeSettingsBtn + .info-icon')).toHaveText('!');
 await expect(group.locator('input[type=checkbox]')).toHaveCount(5);
 await group.getByLabel('ミラージュ',{exact:true}).check();
 await group.getByLabel('デリリウム',{exact:true}).check();
 await group.getByLabel('ヴィリディアンワイルドウッド',{exact:true}).check();
 await expect(page.locator('#combinedRegexOutput')).toContainText('ージュ|ムの鏡|ディアン');
 await page.reload();
 await expect(group.getByLabel('ミラージュ',{exact:true})).toBeChecked();
 const groupBox=await group.boundingBox(),amountBox=await page.locator('#scarabInput').boundingBox();
 expect(groupBox.y).toBeGreaterThan(amountBox.y);
 for(const label of await group.locator('label').all()) {
  const box=await label.boundingBox();expect(box.x).toBeGreaterThanOrEqual(groupBox.x-1);
  expect(box.x+box.width).toBeLessThanOrEqual(groupBox.x+groupBox.width+1);
 }
 await group.scrollIntoViewIfNeeded();
 await page.screenshot({path:`.cache/map-highlights-${testInfo.project.name}.png`});
 expect(errors).toEqual([]);
});

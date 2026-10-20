import {test, expect} from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => {
    return new URL(route.request().url()).origin === 'http://127.0.0.1:5174' ? route.continue() : route.abort();
  });
});

test('ACT options preserve profiles and keep legacy colors collapsed below weapons', async ({page}, testInfo) => {
  const errors=[];page.on('pageerror', error=>errors.push(error.message));
  await page.goto('/poe1.html#vendor');
  await expect(page.locator('#gemListContainer .gem-button').first()).toBeVisible();
  await expect(page.locator('#vendor-link-colors')).not.toHaveAttribute('open');
  await expect(page.locator('#vendor-color-rrr')).toBeHidden();
  await expect(page.locator('#vendor-accessory-options input')).toHaveCount(14);
  await expect(page.locator('#vendor-accessory-options a')).toHaveCount(0);
  await expect(page.locator('#vendor-accessory-options h4')).toHaveText(['アミュレット','ベルト','指輪']);
  for (const [key, pattern] of Object.entries({amber:'珀のア',jade:'翠のア',lapis:'璃のア',onyx:'キスのア',turquoise:'イズのア',agate:'瑙のア',rusticSash:'朴な飾',heavyBelt:'ビーベ',leatherBelt:'革のベ',ironRing:'鉄の指',coralRing:'瑚の指',topazRing:'ズの指',sapphireRing:'アの指',rubyRing:'ーの指'})) {
    const checkbox=page.locator(`#vendor-accessory-${key}`);
    await checkbox.check();
    await expect(page.locator('#vendorRegexOutput')).toHaveText(`"${pattern}"`);
    await checkbox.uncheck();
  }
  await page.locator('#vendor-accessory-ironRing').check();
  await page.locator('#vendor-weapon-goatHorn').check();
  await page.locator('#vendor-extra-fireGem').check();
  await page.locator('#vendor-extra-coldDotMulti').check();
  const output=page.locator('#vendorRegexOutput');
  await expect(output).toContainText('鉄の指');
  await expect(output).toContainText('ギの角');
  await expect(output).toContainText('ての火ス');
  await expect(output).toContainText('^冷気継.*率 \\+');
  const before=await output.textContent();
  const expression = new RegExp(before.slice(1,-1),'im');
  expect(expression.test('鉄の指\nレアリティ: ノーマル')).toBe(true);
  expect(expression.test('全ての火スペルスキルジェムのレベル +1')).toBe(true);
  expect(expression.test('全ての雷スペルスキルジェムのレベル +1')).toBe(false);
  expect(expression.test('冷気継続ダメージ倍率 +15%')).toBe(true);
  expect(expression.test('火継続ダメージ倍率 +15%')).toBe(false);
  await page.locator('#vendorProfileName').fill('ACT new options');
  await page.getByRole('button',{name:'保存',exact:true}).filter({visible:true}).click();
  await page.reload();
  await expect(page.locator('#vendor-accessory-ironRing')).toBeChecked();
  await expect(page.locator('#vendor-weapon-goatHorn')).toBeChecked();
  await expect(page.locator('#vendor-extra-fireGem')).toBeChecked();
  await page.getByRole('button',{name:'リセット',exact:true}).filter({visible:true}).click();
  await expect(page.locator('#vendor-accessory-ironRing')).not.toBeChecked();
  await expect(page.locator('#vendor-weapon-goatHorn')).not.toBeChecked();
  await expect(page.locator('#vendor-extra-fireGem')).not.toBeChecked();
  await page.locator('#vendorProfileList').selectOption('ACT new options');
  await expect(output).toHaveText(before);
  await expect(page.locator('#vendor-extra-coldDotMulti')).toBeChecked();
  await page.locator('#vendor-link-colors summary').click();
  await page.locator('#vendor-color-rrr').check();
  await expect(output).toContainText('r-r-r');
  const positions=await page.locator('.vendor-act-layout').evaluate(el=>[...el.children].map(child=>{const r=child.getBoundingClientRect();return {x:r.x,y:r.y};}));
  if(testInfo.project.name==='desktop') {
    expect(positions[1].x).toBeGreaterThan(positions[0].x);
    const borders=await page.locator('.vendor-act-layout').evaluate(el=>[...el.children].map(child=>child.querySelector('h3').getBoundingClientRect().bottom));
    expect(Math.max(...borders)-Math.min(...borders)).toBeLessThanOrEqual(0.5);
  }
  else expect(positions[1].y).toBeGreaterThan(positions[0].y);
  await page.locator('#vendor-link-colors summary').click();
  await page.locator('.vendor-act-layout').scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('act-options.png')});
  expect(errors).toEqual([]);
});
async function assertEssenceColumns(page) {
  const deviations = await page.evaluate(() => {
    const header = [...document.querySelectorAll('#essenceContent .essence-header > div')].map(el => el.getBoundingClientRect());
    return [...document.querySelectorAll('.essence-item')].flatMap(row => [...row.children].map((cell, i) => {
      const rect = cell.getBoundingClientRect();
      return Math.max(Math.abs(rect.x - header[i].x), Math.abs(rect.width - header[i].width));
    }));
  });
  expect(deviations.length).toBeGreaterThan(100);
  expect(Math.max(...deviations)).toBeLessThanOrEqual(0.5);
}
test('essence columns stay aligned after navigation, sorting, language and scrolling', async ({page}) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/poe1.html');
  await page.locator('a[data-tab="essenceContent"]').click();
  await expect(page.locator('#essenceContent')).toBeVisible();
  await assertEssenceColumns(page);
  const selected = page.locator('.essence-item input').first();
  const selectedId = await selected.getAttribute('id');
  await selected.check();
  for (const language of ['en', 'ja']) {
    await page.locator(`#globalLangToggle [data-lang="${language}"]`).click();
    for (const column of ['name', 'price', 'tier']) {
      await page.locator(`#essenceContent .essence-header [data-column="${column}"]`).click();
      await assertEssenceColumns(page);
      if (column === 'name') {
        const names = await page.locator('.essence-item .scarab-name').allTextContents();
        expect(names).toEqual([...names].sort((a,b) => a.localeCompare(b, language)));
      }
    }
    expect(await page.locator('input').evaluateAll((inputs,id) => inputs.find(input => input.id === id).checked, selectedId)).toBe(true);
    await page.locator('.essence-table-container').evaluate(el => {el.scrollTop = 200; el.scrollLeft = 100;});
    await assertEssenceColumns(page);
  }
  expect(errors).toEqual([]);
});
for (const game of ['poe1', 'poe2']) {
  test(`${game}: damaged saved data does not break direct tabs or navigation`, async ({page}) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(game => {
      const prefix = game === 'poe2' ? 'poe2_' : '';
      localStorage.setItem(prefix + 'poeProfiles', '{broken');
      localStorage.setItem(prefix + 'inputState', 'null');
      localStorage.setItem(prefix + 'searchModeState', '[]');
      localStorage.setItem(prefix + 'vendorProfiles', '{"damaged":null}');
    }, game);
    await page.goto(`/${game}.html#saved`);
    await expect(page.locator('#savedContent')).toBeVisible();
    for (const tab of ['vendorContent', 'mapContent', 'savedContent']) {
      await page.locator(`a[data-tab="${tab}"]`).click();
      await expect(page.locator(`#${tab}`)).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
test('a direct essence bookmark and persisted English language use aligned columns', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('poeLanguage', 'en'));
  await page.goto('/poe1.html#essence');
  await expect(page.locator('#essenceContent')).toBeVisible();
  await assertEssenceColumns(page);
  await page.locator('#essenceContent .essence-header [data-column="name"]').click();
  await page.locator('#essenceContent .essence-header [data-column="name"]').click();
  const names = await page.locator('.essence-item .scarab-name').allTextContents();
  expect(names).toEqual([...names].sort((a,b)=>b.localeCompare(a,'en')));
  await assertEssenceColumns(page);
});
test('PoE1 loads the published gem JSON and renders the vendor gem list', async ({page}) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/data/poe1/gems/gems_regex.json'));
  await page.goto('/poe-jp-regex/poe1.html#vendor');
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const gems = await response.json();
  expect(Array.isArray(gems)).toBe(true);
  expect(gems.length).toBeGreaterThan(0);
  await expect(page.locator('#gemListContainer .gem-button-label')).toHaveCount(gems.length);
  await expect(page.locator('#gemListContainer')).toContainText('ファイヤーボール');
  expect(errors).toEqual([]);
});
test('map reminder text and badges toggle independently while tags stay hidden', async ({page}) => {
  await page.goto('/poe1.html#map');
  const poison=page.locator('.effect-item[data-mod-key="モンスターは#%の確率で毒、串刺しおよび出血を無効化する"]');
  const vulnerability=page.locator('.effect-item[data-mod-key="プレイヤーはヴァルネラビリティの呪いを受ける"]');
  await expect(page.locator('#ModList .mod-tags')).toHaveCount(0);
  await expect(vulnerability.locator('.mod-reminder')).toContainText('物理ダメージが15%増加');
  await expect(vulnerability.locator('.mod-reminder')).toContainText('出血確率を+20%');
  await expect(vulnerability.locator('.mod-reminder')).toContainText('持続時間は8秒');
  await page.locator('#showModDetailsCheckbox').uncheck();
  await expect(vulnerability.locator('.mod-extra-details')).toBeHidden();
  await expect(poison.locator('.badge-container')).toBeVisible();
  await page.locator('#showModBadgesCheckbox').uncheck();
  await expect(poison.locator('.badge-container')).toBeHidden();
  await page.locator('#showModDetailsCheckbox').check();
  await expect(vulnerability.locator('.mod-extra-details')).toBeVisible();
  await expect(poison.locator('.badge-container')).toBeHidden();
  await page.reload();
  await expect(page.locator('#showModDetailsCheckbox')).toBeChecked();
  await expect(page.locator('#showModBadgesCheckbox')).not.toBeChecked();
  await expect(vulnerability.locator('.mod-extra-details')).toBeVisible();
  await expect(poison.locator('.badge-container')).toBeHidden();
  await page.locator('#effectSearch').fill('状態異常');
  await expect(poison).toBeVisible();
  await page.locator('#effectSearch').fill('');
  await page.locator('#globalLangToggle [data-lang="en"]').click();
  await expect(page.locator('#ModList .mod-tags')).toHaveCount(0);
  await expect(vulnerability.locator('.mod-reminder')).toContainText('Vulnerability is a Hex');
  await expect(poison.locator('.badge-container')).toBeHidden();
  await page.locator('#showModBadgesCheckbox').check();
  await expect(poison.locator('.badge-container')).toBeVisible();
});

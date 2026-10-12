import {test, expect} from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => {
    return new URL(route.request().url()).origin === 'http://127.0.0.1:5174' ? route.continue() : route.abort();
  });
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

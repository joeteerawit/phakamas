import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'
import { expectTapTarget } from './tapTarget.js'
import { near, overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectNoDrifterCrosses, expectSceneFillsWithCornerButtons, expectSceneStill } from './windyScene.js'

// src/lessons/mae-kom.ts: the six words in picture order.
const WORDS = ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม']
const SLUGS = ['rom', 'lom', 'som', 'nom', 'phom', 'cham']

const windows = (page: Page) => page.getByRole('list').getByRole('button')
const shopWindow = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word} `) })
const scene = (page: Page) => page.getByTestId('stage-scene')
const ahead = (page: Page) => page.getByRole('link', { name: 'ไปต่อ', exact: true })

test('the six words are dark shop windows side by side along the shop street, each in its own shop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 2, {}, 'mae-kom')
  await expect(windows(page)).toHaveCount(6)
  await waitUntilStill(...(await windows(page).all()))
  const shops = await Promise.all((await page.getByTestId('shop-row').locator('> div').all()).map((b) => stageBox(page, b)))
  expect(shops).toHaveLength(6)
  const boxes = []
  for (const [i, word] of WORDS.entries()) {
    await expect(windows(page).nth(i)).toHaveAccessibleName(`${word} แตะฟังเสียง`)
    // Dark: no light and no picture until it is tapped.
    await expect(windows(page).nth(i)).not.toHaveAttribute('data-lit')
    await expect(windows(page).nth(i).locator('img')).toHaveCount(0)
    await expect(windows(page).nth(i).getByTestId('window-light')).toHaveCSS('opacity', '0')
    const box = await stageBox(page, windows(page).nth(i))
    const shop = shops[i]!
    expect(box.left >= shop.left && box.right <= shop.right && box.top >= shop.top && box.bottom <= shop.bottom, word).toBe(true)
    boxes.push(box)
  }
  // One row, left to right in word order.
  for (let i = 1; i < 6; i++) {
    expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[0]!.top))
    expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
  }
  await expect(page.getByTestId('street-barrier')).toBeVisible()
  await expect(ahead(page)).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('แตะหน้าต่างร้านให้ไฟติด (0/6)')
})

test('tapping a shop lights its window, shows its picture and plays its word, and น้องส้ม walks to it', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 2, {}, 'mae-kom')
  await waitUntilStill(...(await windows(page).all()))
  const her = page.getByTestId('shop-mascot')
  await expect(her.locator('img')).toHaveAttribute('src', /mascot-som-greet\.webp$/)
  for (const i of [2, 0, 5]) {
    await shopWindow(page, WORDS[i]!).click()
    await expect.poll(() => audioLog(page)).toContain(`play:/assets/audio/vocabulary/${SLUGS[i]}.mp3`)
    await expect(windows(page).nth(i)).toHaveAttribute('data-lit', 'true')
    await expect(windows(page).nth(i).locator(`img[src="/assets/comic/word-${SLUGS[i]}.webp"]`)).toHaveJSProperty('complete', true)
    await expect(windows(page).nth(i).getByTestId('window-light')).toHaveCSS('opacity', '1')
    // She stands on the street outside that shop, below its window.
    await waitUntilStill(her)
    const at = await stageBox(page, her)
    const window = await stageBox(page, windows(page).nth(i))
    near(at.cx, window.cx, `under ${WORDS[i]}`)
    expect(at.top).toBeGreaterThan(window.bottom)
  }
  await expect(page.getByRole('status')).toHaveText('แตะหน้าต่างร้านให้ไฟติด (3/6)')
  await expect(windows(page).nth(1)).not.toHaveAttribute('data-lit')
})

test('the street ahead opens only once all six shops are lit, and ไปต่อ leads on to the next stop', async ({ page }) => {
  await open(page, 2, {}, 'mae-kom')
  for (const [i, word] of WORDS.entries()) {
    await expect(ahead(page), `before ${word}`).toHaveCount(0)
    await expect(page.getByTestId('street-barrier')).toBeVisible()
    await shopWindow(page, word).click()
    // Tapping a lit window again plays it again but lights nothing new.
    if (i === 2) await shopWindow(page, WORDS[0]!).click()
    await endCurrent(page)
  }
  await expect(page.getByRole('status')).toHaveText('ไฟติดครบ 6 ร้านแล้ว ไปต่อกันเลย')
  await expect(page.getByTestId('street-barrier')).toHaveCount(0)
  await ahead(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/3$/)
  // It counts as finishing the Step, as ถัดไป does: the Map shows it done.
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page.getByRole('link', { name: /^ขั้น 2 / })).toHaveAttribute('data-done', 'true')
})

test('tapping a window plays its word as on แม่กง, and tapping another stops the first', async ({ page }) => {
  await open(page, 2, {}, 'mae-kom')
  await shopWindow(page, 'ร่ม').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/rom.mp3'])
  await expect(shopWindow(page, 'ร่ม')).toContainText('กำลังเล่น')
  await expect(shopWindow(page, 'ร่ม')).toHaveAttribute('data-highlight', 'true')
  await expect(shopWindow(page, 'ร่ม').getByTestId('sound-waves')).toBeVisible()

  await shopWindow(page, 'ชาม').click()
  await expect.poll(() => audioLog(page)).toEqual([
    'play:/assets/audio/vocabulary/rom.mp3',
    'pause:/assets/audio/vocabulary/rom.mp3',
    'play:/assets/audio/vocabulary/cham.mp3',
  ])
  await endCurrent(page)
  await expect(shopWindow(page, 'ร่ม')).toContainText('ฟังแล้ว')
  await expect(shopWindow(page, 'ชาม')).toContainText('ฟังแล้ว')
  await expect(shopWindow(page, 'ลม')).toContainText('แตะฟังเสียง')
})

test('missing mp3 falls back to Web Speech reading the Thai word', async ({ page }) => {
  await open(page, 2, { mp3: 'missing' }, 'mae-kom')
  await shopWindow(page, 'นม').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/nom.mp3', 'speak:นม|th-TH'])
})

test('Steps 2–6, 8 and 9 share the windy street Scene', async ({ page }) => {
  for (const step of [2, 3, 4, 5, 6, 8, 9]) {
    await page.goto(`/lesson/mae-kom/${step}`)
    await expect(scene(page), `Step ${step}`).toHaveCSS('background-image', /comic\/kom-scene-windy\.webp/)
    await expect(scene(page).getByTestId('scene-drifter').first(), `Step ${step}`).toBeAttached()
  }
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`Step 2 at ${viewport.width}×${viewport.height}: the Scene fills the window, buttons in the corners, nothing moving crosses a window`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 2, {}, 'mae-kom')
    await waitUntilStill(...(await windows(page).all()))
    await expectSceneFillsWithCornerButtons(page, viewport)

    for (const word of WORDS) {
      await shopWindow(page, word).click()
      await endCurrent(page)
    }
    await expect(ahead(page)).toBeVisible()
    if (viewport.height === 390) {
      for (const word of WORDS) await expectTapTarget(shopWindow(page, word))
      for (const target of [ahead(page), ...['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => page.getByRole('link', { name }))]) await expectTapTarget(target)
    }
    await expectNoDrifterCrosses(page, [windows(page), ahead(page), page.getByRole('status')])

    // ไปต่อ and น้องส้ม (outside the last shop) keep clear of the windows and the corner buttons.
    await waitUntilStill(page.getByTestId('shop-mascot'))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const cards = await Promise.all(WORDS.map((word) => stageBox(page, shopWindow(page, word))))
    for (const box of [await stageBox(page, ahead(page)), await stageBox(page, page.getByTestId('shop-mascot'))]) {
      for (const other of [...corners, ...cards]) expect(overlaps(box, other)).toBe(false)
    }
    expect(overlaps(await stageBox(page, ahead(page)), await stageBox(page, page.getByTestId('shop-mascot')))).toBe(false)
  })
}

test('keyboard and screen reader: each shop window is a named button, Enter lights it, and the street ahead is announced', async ({ page }) => {
  await open(page, 2, {}, 'mae-kom')
  await expect(page.getByTestId('shop-row')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByTestId('shop-mascot')).toHaveAttribute('aria-hidden', 'true')
  for (const word of WORDS) {
    await shopWindow(page, word).focus()
    expect(parseFloat(await shopWindow(page, word).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await expect(shopWindow(page, word)).toHaveAttribute('data-lit', 'true')
    await endCurrent(page)
    await expect(shopWindow(page, word)).toHaveAccessibleName(`${word} ฟังแล้ว`)
  }
  await expect(page.getByRole('status')).toHaveText('ไฟติดครบ 6 ร้านแล้ว ไปต่อกันเลย')
  await ahead(page).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/3$/)
})

test('the windy Scene drifts slowly; under reduced motion it is still, and so is the Game', async ({ page }) => {
  await open(page, 2, {}, 'mae-kom')
  const drifters = scene(page).getByTestId('scene-drifter')
  // A few: five leaves and eight snowflakes.
  await expect(drifters).toHaveCount(13)
  for (const drifter of await drifters.all()) await expect(drifter).toHaveCSS('animation-name', 'drift-fall')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await windows(page).first().waitFor()
  await expectSceneStill(page)
  // She is outside each shop at once, the window lights without fading and the barrier simply goes.
  await expect(page.getByTestId('step-content')).toHaveCSS('opacity', '1')
  for (const [i, word] of WORDS.entries()) {
    await shopWindow(page, word).click()
    await endCurrent(page)
    const at = await stageBox(page, page.getByTestId('shop-mascot'))
    near(at.cx, (await stageBox(page, windows(page).nth(i))).cx, `at ${word} at once`)
    await expect(windows(page).nth(i).getByTestId('window-light')).toHaveCSS('transition-duration', '0s')
  }
  await expect(page.getByTestId('street-barrier')).toHaveCount(0)
  await expect(ahead(page)).toBeVisible()
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  expect(moving).toBe(0)
})

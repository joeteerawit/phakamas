import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'
import { expectTapTarget } from './tapTarget.js'
import { stageBox, waitUntilStill } from './stageBox.js'
import { drifterPaths } from './windyScene.js'

// src/lessons/mae-kom.ts: the six words in picture order.
const WORDS = ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม']
const SLUGS = ['rom', 'lom', 'som', 'nom', 'phom', 'cham']

const windows = (page: Page) => page.getByRole('list').getByRole('button')
const shopWindow = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word} `) })
const scene = (page: Page) => page.getByTestId('stage-scene')

test('the six words are lit shop windows on two floors of a building row', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 2, {}, 'mae-kom')
  await expect(windows(page)).toHaveCount(6)
  await waitUntilStill(...(await windows(page).all()))
  const boxes = []
  for (const [i, word] of WORDS.entries()) {
    await expect(windows(page).nth(i)).toHaveAccessibleName(new RegExp(`^${word} `))
    await expect(windows(page).nth(i).locator(`img[src="/assets/comic/word-${SLUGS[i]}.webp"]`)).toHaveJSProperty('complete', true)
    boxes.push(await stageBox(page, windows(page).nth(i)))
  }
  // Upstairs ร่ม ลม ส้ม, downstairs นม ผม ชาม, in three columns centred on x = 960.
  for (let i = 0; i < 3; i++) {
    expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[0]!.top))
    expect(Math.round(boxes[i + 3]!.top)).toBe(Math.round(boxes[3]!.top))
    expect(boxes[i + 3]!.top).toBeGreaterThan(boxes[i]!.bottom)
    expect(Math.round(boxes[i + 3]!.left)).toBe(Math.round(boxes[i]!.left))
  }
  expect((boxes[0]!.left + boxes[2]!.right) / 2).toBeCloseTo(960, 0)

  // Each window sits inside one of the buildings.
  const buildings = await Promise.all((await page.getByTestId('building-row').locator('> div').all()).map((b) => stageBox(page, b)))
  expect(buildings).toHaveLength(3)
  for (const [i, box] of boxes.entries()) {
    const building = buildings[i % 3]!
    expect(box.left >= building.left && box.right <= building.right && box.top >= building.top && box.bottom <= building.bottom, WORDS[i]).toBe(true)
  }
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
    await page.goto('/lesson/mae-kom/2')
    await waitUntilStill(...(await windows(page).all()))

    const fill = (await scene(page).boundingBox())!
    expect(fill.x).toBeLessThanOrEqual(0.5)
    expect(fill.y).toBeLessThanOrEqual(0.5)
    expect(fill.x + fill.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
    expect(fill.y + fill.height).toBeGreaterThanOrEqual(viewport.height - 0.5)

    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const home = (await page.getByRole('link', { name: 'กลับไปขั้นแรก' }).boundingBox())!
    expect(viewport.width - home.x - home.width).toBeCloseTo(20 * scale, 0)
    expect(home.y).toBeCloseTo(23 * scale, 0)
    const back = (await page.getByRole('link', { name: 'ย้อนกลับ' }).boundingBox())!
    expect(back.x).toBeCloseTo(29 * scale, 0)
    expect(viewport.height - back.y - back.height).toBeCloseTo(13 * scale, 0)
    const next = (await page.getByRole('link', { name: 'ถัดไป' }).boundingBox())!
    expect(viewport.width - next.x - next.width).toBeCloseTo(34 * scale, 0)
    expect(viewport.height - next.y - next.height).toBeCloseTo(13 * scale, 0)

    if (viewport.height === 390) {
      for (const word of WORDS) await expectTapTarget(shopWindow(page, word))
      for (const name of ['กลับไปขั้นแรก', 'ย้อนกลับ', 'ถัดไป']) await expectTapTarget(page.getByRole('link', { name }))
    }

    const cards = await Promise.all(WORDS.map(async (word) => (await shopWindow(page, word).boundingBox())!))
    const paths = await drifterPaths(page)
    expect(paths.length).toBeGreaterThan(0)
    const crossing = paths.filter((r) => cards.some((c) => r.x < c.x + c.width && c.x < r.right && r.y < c.y + c.height && c.y < r.bottom))
    expect(crossing, 'a leaf or snowflake crosses a window').toEqual([])
  })
}

test('the windy Scene drifts slowly; under reduced motion it is still', async ({ page }) => {
  await page.goto('/lesson/mae-kom/2')
  const drifters = scene(page).getByTestId('scene-drifter')
  // A few: five leaves and eight snowflakes.
  await expect(drifters).toHaveCount(13)
  for (const drifter of await drifters.all()) await expect(drifter).toHaveCSS('animation-name', 'drift-fall')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await windows(page).first().waitFor()
  for (const drifter of await drifters.all()) await expect(drifter).toBeHidden()
  const moving = await scene(page).evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
  expect(moving).toBe(0)
})

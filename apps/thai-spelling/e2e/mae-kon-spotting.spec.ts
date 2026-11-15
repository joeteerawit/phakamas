import { expect, type Locator, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 4, hat on the final (#103). src/lessons/mae-kon.ts: two sets of three words, on wooden tiles.
const SETS = [
  [
    { text: 'จาน', slug: 'chan', tiles: ['จ', 'า', 'น'] },
    { text: 'ช้อน', slug: 'chon', tiles: ['ช้', 'อ', 'น'] },
    { text: 'ร้าน', slug: 'ran', tiles: ['ร้', 'า', 'น'] },
  ],
  [
    { text: 'กิน', slug: 'kin', tiles: ['กิ', 'น'] },
    { text: 'คน', slug: 'khon', tiles: ['ค', 'น'] },
    { text: 'บ้าน', slug: 'ban', tiles: ['บ้', 'า', 'น'] },
  ],
]

const cards = (page: Page) => page.getByTestId('hat-card')
const card = (page: Page, word: string) => page.locator(`[data-testid="hat-card"][data-word="${word}"]`)
const tiles = (page: Page, word: string) => page.getByRole('list', { name: `คำว่า ${word}` }).getByRole('button')
const hat = (page: Page, word: string) => page.getByRole('button', { name: `หมวกงอบของคำว่า ${word}`, exact: true })
const messages = (page: Page) => page.getByTestId('hat-messages')
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

/** Drags `from` onto `to` with the mouse, in steps, as a child would. */
async function drag(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 })
  await page.mouse.up()
}

test('three bamboo-tray cards each spell their word on wooden tiles, a red งอบ on each card; two sets of three', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('มาตราแม่กน มี น ญ ณ ร ล ฬ เป็นตัวสะกด')
  for (const [s, set] of SETS.entries()) {
    await expect(page.getByText(`ชุดที่ ${s + 1}/2`)).toBeVisible()
    await expect(cards(page)).toHaveCount(3)
    for (const word of set) {
      await expect(tiles(page, word.text)).toHaveText(word.tiles)
      await expect(card(page, word.text).locator('img')).toHaveAttribute('src', `/assets/comic/word-${word.slug}.webp`)
      await expect(card(page, word.text).getByTestId('wooden-tile').first()).toHaveClass(/wooden-tile/)
      await expect(hat(page, word.text)).toBeVisible()
    }
    if (s === 0) await button(page, 'ชุดถัดไป').click()
  }
  await expect(button(page, 'ชุดถัดไป')).toBeDisabled()
})

test('dragging the hat onto the น: the hat stays, the น turns red and the spelling line plays and sweeps', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  await drag(page, hat(page, 'จาน'), tiles(page, 'จาน').nth(2))
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/chan.mp3'])
  const final = page.getByRole('button', { name: 'น ตัวสะกด' })
  await expect(final).toHaveAttribute('aria-pressed', 'true')
  await expect(final.getByTestId('placed-hat')).toBeVisible()
  await expect(final.locator('span span')).toHaveCSS('color', 'rgb(169, 49, 31)')
  await expect(hat(page, 'จาน')).toHaveCount(0)
  await expect(card(page, 'จาน').getByTestId('spelling-line')).toHaveText(/จอ\s*อา\s*นอ\s*จาน/)
  await expect(card(page, 'จาน').locator('[data-active]')).toHaveCount(1)
})

test('tapping the hat then a tile works too; on any other tile the hat goes back to its peg and the narration plays as a hint', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  await hat(page, 'ช้อน').click()
  await expect(hat(page, 'ช้อน')).toHaveAttribute('aria-pressed', 'true')
  await tiles(page, 'ช้อน').nth(0).click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/explanations/mae-kon.mp3')
  await expect(messages(page)).toHaveText('ยังไม่ใช่ ตัวสะกดของคำว่า ช้อน อยู่ท้ายคำ ลองใหม่นะ')
  await expect(hat(page, 'ช้อน')).toHaveAttribute('aria-pressed', 'false')
  await expect(card(page, 'ช้อน')).not.toHaveAttribute('data-placed')
  // A wrong drag also sends the hat back.
  await drag(page, hat(page, 'ช้อน'), tiles(page, 'ช้อน').nth(1))
  await expect(hat(page, 'ช้อน')).toBeVisible()
  await expect(card(page, 'ช้อน')).not.toHaveAttribute('data-placed')
  await hat(page, 'ช้อน').click()
  await tiles(page, 'ช้อน').nth(2).click()
  await expect(card(page, 'ช้อน')).toHaveAttribute('data-placed', 'true')
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/spelling/chon.mp3')
  await expect(messages(page)).toHaveText('')
})

test('แสดงตัวสะกด puts a hat on every น; all three found says เก่งมาก!', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  await button(page, 'แสดงตัวสะกด').click()
  await expect(page.getByTestId('placed-hat')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'น ตัวสะกด' })).toHaveCount(3)
  await expect(messages(page)).toHaveText('เก่งมาก! ใส่หมวกบนตัวสะกดครบ 3 คำแล้ว')
  await expect(button(page, 'แสดงตัวสะกด')).toBeDisabled()
  await button(page, 'ชุดถัดไป').click()
  await expect(page.getByTestId('placed-hat')).toHaveCount(0)
  await button(page, 'ชุดก่อนหน้า').click()
  await expect(page.getByTestId('placed-hat')).toHaveCount(3)
  const explain = button(page, 'ฟังคำอธิบาย')
  await expect(explain.locator('[data-art="leaf-cone"]')).toBeVisible()
  await explain.click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/explanations/mae-kon.mp3')
})

test('the Game uses only the แม่กน Kit: nothing from another Lesson', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  await expect(cards(page).first()).toBeVisible()
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const one of await cards(page).all()) await expect(one).toHaveClass(/bamboo-tray/)
  await expect(hat(page, 'จาน').locator('[data-art="ngob"]')).toBeVisible()
})

for (const viewport of VIEWPORTS) {
  test(`Step 4 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, nothing crosses a tile, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 4, {}, 'mae-kon')
    await expectSceneFills(page, 'kon-canal', viewport)
    await drag(page, hat(page, 'ร้าน'), tiles(page, 'ร้าน').nth(2))
    await expect(card(page, 'ร้าน')).toHaveAttribute('data-placed', 'true')
    const targets = [...(await page.locator('[data-tile]').all()), hat(page, 'จาน'), button(page, 'ฟังคำอธิบาย'), button(page, 'แสดงตัวสะกด'), button(page, 'ชุดถัดไป')]
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    await expectNoDrifterCrosses(page, [cards(page), messages(page), page.getByRole('heading', { level: 2 }), button(page, 'แสดงตัวสะกด')])
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [...(await cards(page).all()), button(page, 'ฟังคำอธิบาย'), button(page, 'แสดงตัวสะกด'), page.getByRole('navigation', { name: 'ชุดคำ' })]) {
      const box = await stageBox(page, target)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: tiles and hats are named, Enter lifts a hat and places it', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  await hat(page, 'จาน').focus()
  expect(parseFloat(await hat(page, 'จาน').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(hat(page, 'จาน')).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'น ตัวที่ 3' }).first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'น ตัวสะกด' })).toHaveAttribute('aria-pressed', 'true')
  await expect(messages(page)).toHaveAttribute('aria-live', 'polite')
})

test('under reduced motion the hat simply sits on the น and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 4, {}, 'mae-kon')
  await cards(page).first().waitFor()
  await expectSceneStill(page)
  await hat(page, 'จาน').click()
  await expect(hat(page, 'จาน')).toHaveCSS('transform', 'none')
  await tiles(page, 'จาน').nth(2).click()
  await expect(page.getByTestId('placed-hat')).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

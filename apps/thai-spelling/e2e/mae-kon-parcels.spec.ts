import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 2, unwrap the leaf parcels (#101). src/lessons/mae-kon.ts: the six words in picture order.
const WORDS = ['จาน', 'ช้อน', 'ร้าน', 'กิน', 'คน', 'บ้าน']
const SLUGS = ['chan', 'chon', 'ran', 'kin', 'khon', 'ban']

const parcels = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const parcel = (page: Page, i: number) => parcels(page).nth(i)
const stallStatus = (page: Page) => page.getByRole('status').filter({ hasText: 'ห่อใบตอง' })

async function openAll(page: Page) {
  for (let i = 0; i < 6; i++) {
    await parcel(page, i).click()
    await endCurrent(page)
  }
}

test('six closed banana-leaf parcels sit three by two on the tray, each pinned shut, nothing showing inside', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  await expect(parcels(page)).toHaveCount(6)
  const boxes = []
  for (let i = 0; i < 6; i++) {
    const one = parcel(page, i)
    await expect(one).toHaveAccessibleName(`ห่อที่ ${i + 1} แตะเพื่อแกะห่อ`)
    await expect(one).not.toHaveAttribute('data-open')
    await expect(one.getByTestId('parcel-pin')).toBeVisible()
    await expect(one.locator('img')).toHaveCount(0)
    for (const word of WORDS) await expect(one).not.toContainText(word)
    boxes.push(await stageBox(page, one))
  }
  // Three by two, in word order, all on the tray.
  const tray = await stageBox(page, page.getByTestId('parcel-tray'))
  for (const [i, box] of boxes.entries()) {
    expect(box.left).toBeGreaterThanOrEqual(tray.left)
    expect(box.right).toBeLessThanOrEqual(tray.right)
    expect(box.bottom).toBeLessThanOrEqual(tray.bottom)
    if (i % 3) {
      expect(Math.round(box.top)).toBe(Math.round(boxes[i - 1]!.top))
      expect(box.left).toBeGreaterThan(boxes[i - 1]!.right)
    }
  }
  expect(boxes[3]!.top).toBeGreaterThan(boxes[0]!.bottom)
  await expect(stallStatus(page)).toHaveText('แตะห่อใบตองเพื่อแกะดูภาพ (0/6)')
  await expect(page.getByTestId('stall-keeper')).not.toHaveAttribute('data-waving')
  await expect(page.getByTestId('stall-cheer')).toHaveCount(0)
})

test('tapping a parcel unfolds its leaf: the pin pops out, the picture and word show and the word plays', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  for (const i of [3, 0, 5]) {
    const one = parcel(page, i)
    await one.click()
    await expect.poll(() => audioLog(page)).toContain(`play:/assets/audio/vocabulary/${SLUGS[i]}.mp3`)
    await expect(one).toHaveAttribute('data-open', 'true')
    await expect(one.getByTestId('parcel-pin')).toHaveCount(0)
    await expect(one.locator(`img[src="/assets/comic/word-${SLUGS[i]}.webp"]`)).toHaveJSProperty('complete', true)
    await expect(one).toContainText(WORDS[i]!)
    await endCurrent(page)
    await expect(one).toHaveAccessibleName(`${WORDS[i]} ฟังแล้ว`)
  }
  await expect(stallStatus(page)).toHaveText('แตะห่อใบตองเพื่อแกะดูภาพ (3/6)')
  await expect(parcel(page, 1)).not.toHaveAttribute('data-open')
})

test('open parcels stay open and play again; once all six are open the stall-keeper waves and น้องส้ม cheers', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  await parcel(page, 0).click()
  await endCurrent(page)
  await parcel(page, 0).click()
  await expect.poll(async () => (await audioLog(page)).filter((e) => e === 'play:/assets/audio/vocabulary/chan.mp3').length).toBe(2)
  await expect(parcel(page, 0)).toHaveAttribute('data-open', 'true')
  await endCurrent(page)
  for (let i = 1; i < 6; i++) {
    await expect(page.getByTestId('stall-keeper')).not.toHaveAttribute('data-waving')
    await parcel(page, i).click()
    await endCurrent(page)
  }
  await expect(stallStatus(page)).toHaveText('แกะห่อใบตองครบ 6 ห่อแล้ว เก่งมาก!')
  await expect(page.getByTestId('stall-keeper')).toHaveAttribute('data-waving', 'true')
  await expect(page.getByTestId('stall-cheer')).toHaveAttribute('src', /mascot-kon-cheer\.webp$/)
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/3$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page.getByRole('link', { name: /^ขั้น 2 / })).toHaveAttribute('data-done', 'true')
})

test('a parcel plays its word as on every Lesson: the leaf cone sounds, and tapping another stops the first', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  await parcel(page, 0).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/chan.mp3'])
  await expect(parcel(page, 0)).toHaveAccessibleName('จาน กำลังเล่น')
  await expect(parcel(page, 0).getByTestId('parcel-leaf')).toHaveAttribute('data-highlight', 'true')
  await expect(parcel(page, 0).getByTestId('sound-waves')).toBeVisible()
  await parcel(page, 5).click()
  await expect.poll(() => audioLog(page)).toEqual([
    'play:/assets/audio/vocabulary/chan.mp3',
    'pause:/assets/audio/vocabulary/chan.mp3',
    'play:/assets/audio/vocabulary/ban.mp3',
  ])
})

test('a missing mp3 falls back to Web Speech reading the Thai word', async ({ page }) => {
  await open(page, 2, { mp3: 'missing' }, 'mae-kon')
  await parcel(page, 2).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/ran.mp3', 'speak:ร้าน|th-TH'])
})

test('the Game uses only the แม่กน Kit: bamboo-tray leaves and a leaf-cone speaker, nothing from another Lesson', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  await openAll(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const one of await parcels(page).all()) {
    await expect(one.getByTestId('parcel-leaf')).toHaveClass(/bamboo-tray/)
    await expect(one.locator('[data-art="leaf-cone"]')).toBeVisible()
  }
})

for (const viewport of VIEWPORTS) {
  test(`Step 2 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, nothing moving crosses a parcel, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 2, {}, 'mae-kon')
    await expectSceneFills(page, 'kon-canal', viewport)
    await openAll(page)
    if (viewport.height === 390) {
      for (const one of await parcels(page).all()) await expectTapTarget(one)
      for (const name of ['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป']) await expectTapTarget(page.getByRole('link', { name }))
    }
    await expectNoDrifterCrosses(page, [parcels(page), stallStatus(page)])
    const corners = await Promise.all(['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [page.getByTestId('parcel-tray'), stallStatus(page), page.getByTestId('stall-keeper'), page.getByTestId('stall-cheer')]) {
      const box = await stageBox(page, target)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: each parcel is a named button and Enter unwraps it', async ({ page }) => {
  await open(page, 2, {}, 'mae-kon')
  await expect(page.getByTestId('stall-keeper')).toHaveAttribute('aria-hidden', 'true')
  for (const [i, word] of WORDS.entries()) {
    await parcel(page, i).focus()
    expect(parseFloat(await parcel(page, i).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await expect(parcel(page, i)).toHaveAttribute('data-open', 'true')
    await endCurrent(page)
    await expect(parcel(page, i)).toHaveAccessibleName(`${word} ฟังแล้ว`)
  }
  await expect(stallStatus(page)).toHaveText('แกะห่อใบตองครบ 6 ห่อแล้ว เก่งมาก!')
})

test('under reduced motion the leaf is simply open, and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 2, {}, 'mae-kon')
  await parcels(page).first().waitFor()
  await expectSceneStill(page)
  for (let i = 0; i < 6; i++) {
    await parcel(page, i).click()
    await endCurrent(page)
    await expect(parcel(page, i)).toHaveAttribute('data-open', 'true')
    // Open at once: the flaps are gone without folding.
    await expect.poll(() => parcel(page, i).getByTestId('parcel-flaps').locator('path').first().evaluate((el) => getComputedStyle(el).opacity), { timeout: 300 }).toBe('0')
  }
  await expect(page.getByTestId('stall-cheer')).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

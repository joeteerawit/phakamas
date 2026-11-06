import { expect, type Locator, type Page, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { audioLog, open } from './audioStub.js'
import { expectTapTarget } from './tapTarget.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'

const COVER = '/lesson/mae-kom/1'
const playLink = (page: Page) => page.getByRole('link', { name: 'เริ่มเรียน' })
const speaker = (page: Page) => page.getByRole('button', { name: 'ปิดเพลง' }).or(page.getByRole('button', { name: 'เปิดเพลง' }))
const mascot = (page: Page) => page.getByTestId('cover-mascot')
const sign = (page: Page) => page.getByTestId('cover-sign')
const scene = (page: Page) => page.getByTestId('stage-scene')
const words = (page: Page) => [
  page.getByRole('heading', { level: 2 }),
  page.getByText('แม่ กม (ม)', { exact: true }),
  page.getByText('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒'),
]

const transformOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).transform)
const running = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)

/**
 * Whether the target is drawn on top at its centre. Hit testing follows paint order but skips
 * pointer-events: none (the sign's words), so the target takes the pointer for the check.
 */
const onTop = (target: Locator) =>
  target.evaluate((el: HTMLElement) => {
    const old = el.style.pointerEvents
    el.style.pointerEvents = 'auto'
    const box = el.getBoundingClientRect()
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
    el.style.pointerEvents = old
    return !!hit && el.contains(hit)
  })

test('the แม่กม cover: snowy street Scene, title on the shop sign, น้องส้ม floating, ▶ instead of Next', async ({ page }) => {
  await open(page, 1, {}, 'mae-kom')
  await expect(scene(page)).toHaveCSS('background-image', /comic\/kom-scene-cover\.webp/)
  await expect(sign(page).locator('img')).toHaveAttribute('src', /comic\/kom-shop-sign\.webp$/)
  await expect(mascot(page).locator('img')).toHaveAttribute('src', /comic\/mascot-som-float\.webp$/)
  await expect(page.locator('img[src*="mascot-swing"], img[src*="mascot-vine"], [data-testid="cover-decor"]')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('คำแม่กมชมเมืองหิมะ')
  for (const text of words(page)) await expect(text).toBeVisible()
  await expect(page.getByRole('link', { name: 'ถัดไป' })).toHaveCount(0)

  await playLink(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/2$/)
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/explanations/mae-kom-intro.mp3'])
})

test('น้องส้ม replaces น้องลิง on แม่กม Steps', async ({ page }) => {
  await page.goto('/lesson/mae-kom/5')
  for (const word of ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม', 'แก้ม', 'ยิ้ม']) {
    await page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) }).click()
  }
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
  await expect(page.getByRole('status').locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-som-cheer\.webp$/)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-som-greet\.webp$/)
})

test('the แม่กม Theme uses only comic art files that exist', () => {
  const files = readdirSync('public/assets/comic')
  const dir = 'src/themes/mae-kom'
  const sources = ['theme.ts', ...readdirSync(`${dir}/steps`).map((f) => `steps/${f}`), ...readdirSync(`${dir}/scenes`).map((f) => `scenes/${f}`)]
  const used = [...sources.map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join().matchAll(/[\w-]+\.webp/g)].map(([name]) => name)
  expect(used).toContain('mascot-som-float.webp')
  expect(used.filter((name) => !files.includes(name))).toEqual([])
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
  { width: 2560, height: 1080 },
  { width: 1280, height: 900 },
]) {
  test(`the แม่กม cover fills ${viewport.width}×${viewport.height}: sign centred, buttons in the corners`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(COVER)

    const fill = (await scene(page).boundingBox())!
    expect(fill.x).toBeLessThanOrEqual(0.5)
    expect(fill.y).toBeLessThanOrEqual(0.5)
    expect(fill.x + fill.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
    expect(fill.y + fill.height).toBeGreaterThanOrEqual(viewport.height - 0.5)

    for (const text of words(page)) {
      const box = (await text.boundingBox())!
      expect(box.x + box.width / 2, 'sign text centred').toBeCloseTo(viewport.width / 2, 0)
    }

    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const music = (await speaker(page).boundingBox())!
    const play = (await playLink(page).boundingBox())!
    expect(music.x).toBeCloseTo(40 * scale, 0)
    expect(viewport.height - music.y - music.height).toBeCloseTo(32 * scale, 0)
    expect(viewport.width - play.x - play.width).toBeCloseTo(32 * scale, 0)
    expect(viewport.height - play.y - play.height).toBeCloseTo(24 * scale, 0)
    if (viewport.height === 390) for (const button of [speaker(page), playLink(page)]) await expectTapTarget(button)

    // น้องส้ม floats beside the sign, clear of its words and the buttons.
    const her = await stageBox(page, mascot(page))
    expect(her.left).toBeGreaterThanOrEqual(0)
    expect(her.right).toBeLessThanOrEqual(1920)
    for (const other of [...words(page), speaker(page), playLink(page)]) {
      expect(overlaps(her, await stageBox(page, other)), 'Mascot clear of the sign words and buttons').toBe(false)
    }
  })
}

test('the cover Scene is busy and moves behind the sign and buttons; น้องส้ม drifts', async ({ page }) => {
  await page.goto(COVER)
  await waitUntilStill(page.getByRole('heading', { level: 2 }))
  const moving = () => scene(page).evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
  await expect.poll(moving).toBeGreaterThan(20)

  const before = await transformOf(mascot(page))
  // Sample while the snow, gusts, umbrella and orange move: nothing in the Scene ever covers the words or buttons.
  for (let i = 0; i < 6; i++) {
    for (const target of [...words(page), speaker(page), playLink(page)]) expect(await onTop(target), `sample ${i}`).toBe(true)
    await page.waitForTimeout(150)
  }
  expect(await transformOf(mascot(page)), 'น้องส้ม drifts').not.toBe(before)
})

test('reduced motion: the แม่กม cover is still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(COVER)
  await page.getByRole('heading', { level: 2 }).waitFor()
  expect(await running(page)).toBe(0)
  for (const target of [mascot(page), sign(page), playLink(page).locator('img')]) {
    const before = await transformOf(target)
    await page.waitForTimeout(300)
    expect(await transformOf(target)).toBe(before)
    expect(before).toBe('none')
  }
})

import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { chrome, otherLook, VIEWPORTS, wordButton } from './maeKon.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน's UI Kit (#98, docs/mae-kon-spec.md): nothing in its chrome may look like แม่กง's, แม่กม's or แม่กบ's controls.

const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true })
const home = (page: Page) => page.getByRole('link', { name: /^(กลับไปขั้นแรก|กลับไปแผนที่)$/ })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const burst = (page: Page) => page.getByTestId('click-burst')
const corners = (page: Page) => [home(page), link(page, 'ย้อนกลับ'), link(page, 'ถัดไป'), music(page)]
const running = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)

/** Counts the oscillators the page starts: each plop is one. */
function countPlops() {
  const w = window as unknown as { __plops: number }
  w.__plops = 0
  const create = AudioContext.prototype.createOscillator
  AudioContext.prototype.createOscillator = function (this: AudioContext) {
    w.__plops++
    return create.call(this)
  }
}
const plops = (page: Page) => page.evaluate(() => (window as unknown as { __plops: number }).__plops)

/** Scripted animations on `scale` or `rotate` of the control itself: แม่กง's boing (CSS transitions are the plank's own dip). */
const squashes = (target: Locator) =>
  target.evaluate(
    (el) =>
      el
        .getAnimations()
        .filter((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation))
        .filter((a) => (a as Animation & { effect: KeyframeEffect }).effect.getKeyframes().some((f) => 'scale' in f || 'rotate' in f)).length,
  )

async function press(page: Page, target: Locator) {
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
}

test('the chrome of Steps 2–10 uses only the แม่กน Kit: nothing from แม่กง, แม่กม or แม่กบ', async ({ page }) => {
  for (const step of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    await open(page, step, {}, 'mae-kon')
    await page.getByRole('heading', { level: 1 }).waitFor()
    expect(await chrome(page).count(), `Step ${step}`).toBeGreaterThan(0)
    expect(await otherLook(chrome(page)), `Step ${step}`).toEqual([])
    await expect(music(page), `Step ${step}`).toHaveClass(/plank-button/)
    await expect(page.getByText(`ขั้น ${step}/10`), `Step ${step}`).toHaveClass(/bamboo-label/)
  }
})

test('Home is a woven งอบ, Back and Next wooden paddles, the title a split-bamboo board', async ({ page }) => {
  for (const step of [2, 5, 7, 10]) {
    await page.goto(`/lesson/mae-kon/${step}`)
    await expect(home(page).locator('[data-art="ngob"]'), `Step ${step}`).toBeVisible()
    for (const name of ['ย้อนกลับ', step === 10 ? 'กลับหน้าแรก' : 'ถัดไป']) {
      await expect(link(page, name).locator('[data-art="paddle"]'), `Step ${step} ${name}`).toBeVisible()
      await expect(link(page, name).locator('img'), `Step ${step} ${name}`).toHaveCount(0)
    }
    await expect(page.getByRole('heading', { level: 1 }).locator('..'), `Step ${step}`).toHaveCSS('background-image', /repeating-linear-gradient/)
  }
  // Back points the other way.
  const flip = await link(page, 'ย้อนกลับ').locator('svg').evaluate((el) => getComputedStyle(el).scale)
  expect(flip).toMatch(/^-1/)
})

test('the speaker is a rolled banana-leaf cone, with sound lines while it plays', async ({ page }) => {
  await open(page, 4, {}, 'mae-kon')
  const explain = button(page, 'ฟังคำอธิบาย')
  await expect(explain.locator('[data-art="leaf-cone"]')).toBeVisible()
  await expect(explain.getByTestId('sound-waves')).toHaveCount(0)
  await explain.click()
  await expect(explain.getByTestId('sound-waves')).toBeVisible()
  await page.goto('/lesson/mae-kon/3')
  await expect(page.locator('[data-art="leaf-cone"]').first()).toBeVisible()
})

test("a tap plops softly and spreads ripples at the pointer; the plank dips, not แม่กง's boing", async ({ page }) => {
  await page.addInitScript(countPlops)
  await open(page, 3, {}, 'mae-kon')
  await press(page, music(page))
  await expect(burst(page).locator('svg[data-ripple]')).toHaveCount(1)
  await expect(burst(page).locator('svg[data-splash]')).toHaveCount(0)
  expect(await squashes(music(page))).toBe(0)
  expect(await plops(page)).toBe(1)
  // The plank dips into the water while held.
  await expect.poll(() => music(page).evaluate((el) => getComputedStyle(el).translate)).toBe('0px 7px')
  await page.mouse.up()
  await expect(burst(page)).toHaveCount(0)
  await press(page, link(page, 'ถัดไป'))
  expect(await plops(page)).toBe(2)
  await page.mouse.up()
})

test('two banana leaves sweep in from the sides to cover the window between Steps, then part, and never take a tap', async ({ page }) => {
  await page.goto('/lesson/mae-kon/2')
  for (const [name, step] of [
    ['ถัดไป', 3],
    ['ถัดไป', 4],
    ['ย้อนกลับ', 3],
  ] as const) {
    await link(page, name).click()
    const leaves = page.getByTestId('step-leaves')
    await expect(leaves, `to Step ${step}`).toBeVisible()
    await expect(leaves.locator('[data-leaf]')).toHaveCount(2)
    for (const other of ['step-ripple', 'step-flurry', 'panel-transition']) await expect(page.getByTestId(other)).toHaveCount(0)
    await expect(leaves).toHaveCSS('pointer-events', 'none')
    await expect(page).toHaveURL(new RegExp(`/lesson/mae-kon/${step}$`))
    await expect(leaves).toHaveCount(0)
  }
})

test('feedback is a round woven tray น้องส้ม holds up from her boat at the window edge, clear of every control', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.goto('/lesson/mae-kon/5')
    await wordButton(page, 'จาน').click()
    await button(page, 'ตรวจคำตอบ').click()
    const status = page.getByRole('status').filter({ hasText: 'คะแนน' })
    await expect(status).toContainText('ยังไม่ถูก: ')
    await expect(status.locator('.bg-coral-deep')).toBeVisible()
    await expect(status.locator('> div')).toHaveCSS('border-radius', /px/)
    await expect(status.locator('> div')).toHaveCSS('background-image', /radial-gradient/)
    const mascot = page.getByTestId('feedback-mascot')
    await expect(mascot.locator('img')).toHaveAttribute('src', /-encourage\.webp$/)
    await expect.poll(async () => Math.abs((await mascot.boundingBox())!.x), `${viewport.width}: at the left edge`).toBeLessThan(1)
    await waitUntilStill(mascot.locator('img'))
    const her = await stageBox(page, mascot)
    for (const control of [...corners(page), button(page, 'ตรวจคำตอบ'), button(page, 'เริ่มใหม่'), status]) {
      expect(overlaps(her, await stageBox(page, control))).toBe(false)
    }
  }
})

test('the Stars display: gold stars painted on a paddle blade, on a canal-water plaque and in the celebration', async ({ page }) => {
  await open(page, 8, {}, 'mae-kon')
  const counter = page.getByTestId('star-counter')
  await expect(counter).toHaveClass(/paddle-counter/)
  await expect(counter.locator('[data-art="paddle-star"]')).toBeVisible()
  await expect(counter).toHaveText(/ดาวที่ได้\s*0\/9/)
  for (const [a, b] of [
    ['จาน', 'หวาน'],
    ['ช้อน', 'ร้อน'],
  ] as const) {
    await wordButton(page, a).click()
    await wordButton(page, b).click()
  }
  const celebration = page.getByTestId('celebration')
  await expect(celebration).toContainText('ได้ 3 ดาว')
  await expect(celebration.locator('[data-art="paddle-star"]')).toHaveCount(3)
  await expect(counter).toHaveText(/3\/9/)
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} the Kit's controls sit in the window's corners and are big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const phone = viewport.height === 390
    for (const step of [2, 5, 9]) {
      await open(page, step, {}, 'mae-kon')
      await page.getByRole('heading', { level: 1 }).waitFor()
      const box = (await music(page).boundingBox())!
      expect(viewport.width - box.x - box.width, `Step ${step} music`).toBeCloseTo(178 * scale, 0)
      expect(box.y, `Step ${step} music`).toBeCloseTo(32 * scale, 0)
      const homeBox = (await home(page).boundingBox())!
      expect(viewport.width - homeBox.x - homeBox.width).toBeCloseTo(20 * scale, 0)
      const back = (await link(page, 'ย้อนกลับ').boundingBox())!
      expect(back.x).toBeCloseTo(29 * scale, 0)
      expect(viewport.height - back.y - back.height).toBeCloseTo(13 * scale, 0)
      if (phone) for (const target of corners(page)) await expectTapTarget(target)
    }
  })
}

test('keyboard and screen reader: every Kit control is named, its art hidden, focus visible, Enter works', async ({ page }) => {
  await open(page, 3, {}, 'mae-kon')
  for (const target of corners(page)) {
    await expect(target).toHaveAccessibleName(/\S/)
    for (const art of await target.locator('svg').all()) await expect(art).toHaveAttribute('aria-hidden', 'true')
  }
  await expect(music(page)).toHaveAttribute('aria-pressed', /true|false/)

  let focused = ''
  for (let i = 0; i < 30 && focused !== 'ถัดไป'; i++) {
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '')
    if (focused) {
      const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineWidth)
      expect(parseFloat(outline), `${focused} focus ring`).toBeGreaterThan(0)
    }
  }
  expect(focused).toBe('ถัดไป')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/4$/)

  const before = await music(page).getAttribute('aria-pressed')
  await music(page).focus()
  await page.keyboard.press('Space')
  await expect(music(page)).not.toHaveAttribute('aria-pressed', before!)
})

test('reduced motion: no leaves, no ripples and nothing moving in the chrome; the plop still sounds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(countPlops)
  await open(page, 2, {}, 'mae-kon')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await link(page, 'ถัดไป').click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/3$/)
  await expect(page.getByTestId('step-leaves')).toHaveCount(0)
  await press(page, music(page))
  await expect(burst(page)).toHaveCount(0)
  expect(await plops(page)).toBe(2)
  await page.mouse.up()
  await expect(music(page)).toHaveCSS('transition-property', 'none')

  await page.goto('/lesson/mae-kon/5')
  await wordButton(page, 'จาน').click()
  await button(page, 'ตรวจคำตอบ').click()
  const mascot = page.getByTestId('feedback-mascot')
  await expect(mascot).toBeVisible()
  await expect(mascot.locator('> div')).toHaveCSS('transform', 'none')
  await expect(page.getByTestId('step-content')).toHaveCSS('opacity', '1')
  await expect.poll(() => running(page)).toBe(0)
})

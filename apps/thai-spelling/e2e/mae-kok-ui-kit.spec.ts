import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { otherLook, running, VIEWPORTS } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก's UI Kit (#84, docs/mae-kok-spec.md): nothing in its chrome may look like แม่กง's, แม่กม's or แม่กบ's controls.

const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const burst = (page: Page) => page.getByTestId('click-burst')
const home = (page: Page) => link(page, 'กลับไปแผนที่').or(link(page, 'กลับไปขั้นแรก'))
const corners = (page: Page) => [home(page), link(page, 'ย้อนกลับ'), link(page, 'ถัดไป'), music(page)]

/** The chrome every Step shares, stretched to the window's edges: title, Step badge, Star counter, Home, music, Back and Next. */
const chrome = (page: Page) => page.locator('[data-testid="stage"] > [style*="inset"]')

/** Counts the oscillators the page starts: each tok is one. */
function countToks() {
  const w = window as unknown as { __toks: number }
  w.__toks = 0
  const create = AudioContext.prototype.createOscillator
  AudioContext.prototype.createOscillator = function (this: AudioContext) {
    w.__toks++
    return create.call(this)
  }
}
const toks = (page: Page) => page.evaluate(() => (window as unknown as { __toks: number }).__toks)

/** Scripted animations on `scale` or `rotate` of the control itself: แม่กง's boing (the pot sinks with a CSS transition). */
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

test('the chrome of Steps 2–10 uses only the แม่กก Kit: nothing from แม่กง, แม่กม or แม่กบ', async ({ page }) => {
  for (const step of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    await open(page, step, {}, 'mae-kok')
    await page.getByRole('heading', { level: 1 }).waitFor()
    expect(await chrome(page).count(), `Step ${step}`).toBeGreaterThan(0)
    expect(await otherLook(chrome(page)), `Step ${step}`).toEqual([])
    await expect(music(page), `Step ${step}`).toHaveClass(/pot-button/)
    await expect(page.getByText(`ขั้น ${step}/10`), `Step ${step}`).toHaveClass(/kraft-label/)
  }
})

test('Home is a wooden birdhouse, Back and Next plant-marker stakes, the title a wooden garden sign', async ({ page }) => {
  for (const step of [2, 5, 7, 10]) {
    await open(page, step, {}, 'mae-kok')
    await expect(home(page).locator('[data-art="birdhouse"]'), `Step ${step}`).toBeVisible()
    for (const name of ['ย้อนกลับ', step === 10 ? 'กลับหน้าแรก' : 'ถัดไป']) {
      await expect(link(page, name).locator('[data-art="stake"]'), `Step ${step} ${name}`).toBeVisible()
      await expect(link(page, name).locator('img'), `Step ${step} ${name}`).toHaveCount(0)
    }
    const title = page.locator('[data-art="garden-sign"]').getByRole('heading', { level: 1 })
    await expect(title, `Step ${step}`).toBeVisible()
    // The longest title still fits its sign, untruncated.
    expect(await title.evaluate((el) => el.scrollWidth <= el.clientWidth), `Step ${step}`).toBe(true)
  }
  // Back leans the other way.
  const flip = await link(page, 'ย้อนกลับ').locator('svg').evaluate((el) => getComputedStyle(el).scale)
  expect(flip).toMatch(/^-1/)
})

test('the speaker is a terracotta pot on its side, with sound lines while it plays', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  const explain = button(page, 'ฟังคำอธิบาย')
  await expect(explain.locator('[data-art="pot-horn"]')).toBeVisible()
  await expect(explain.getByTestId('sound-waves')).toHaveCount(0)
  await explain.click()
  await expect(explain.getByTestId('sound-waves')).toBeVisible()
})

test('a tap toks like a clay pot and bursts seeds and leaf bits at the pointer; the pot sinks, not แม่กง\'s boing', async ({ page }) => {
  await page.addInitScript(countToks)
  await open(page, 3, {}, 'mae-kok')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await press(page, music(page))
  await expect(burst(page).locator('svg[data-seeds]')).toHaveCount(1)
  expect(await squashes(music(page))).toBe(0)
  expect(await toks(page)).toBe(1)
  await expect.poll(() => music(page).evaluate((el) => getComputedStyle(el).translate)).toBe('0px 6px')
  await page.mouse.up()
  await expect(burst(page)).toHaveCount(0)
  await press(page, link(page, 'ถัดไป'))
  expect(await toks(page)).toBe(2)
  await page.mouse.up()
})

test('one pass of a hoe sweeps turned soil across the window between Steps, and never takes a tap', async ({ page }) => {
  await open(page, 2, {}, 'mae-kok')
  for (const [name, step] of [
    ['ถัดไป', 3],
    ['ถัดไป', 4],
    ['ย้อนกลับ', 3],
  ] as const) {
    await link(page, name).click()
    const hoe = page.getByTestId('step-hoe')
    await expect(hoe, `to Step ${step}`).toBeVisible()
    for (const other of ['step-ripple', 'step-flurry', 'panel-transition']) await expect(page.getByTestId(other)).toHaveCount(0)
    await expect(hoe).toHaveCSS('pointer-events', 'none')
    await expect(page).toHaveURL(new RegExp(`/lesson/mae-kok/${step}$`))
    await expect(hoe).toHaveCount(0)
  }
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} feedback is a kraft leaf bubble, with น้องนก rising on a stake from the bottom edge clear of every control`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 5, {}, 'mae-kok')
    await page.getByRole('button', { name: /^นก(\s|$)/ }).click()
    await button(page, 'ตรวจคำตอบ').click()
    const status = page.getByRole('status').filter({ hasText: 'คะแนน' })
    await expect(status).toContainText('ยังไม่ถูก: ')
    await expect(status.locator('.bg-wrong')).toBeVisible()
    await expect(status.locator('> div')).toHaveCSS('background-color', 'rgb(246, 233, 207)')
    const mascot = page.getByTestId('feedback-mascot')
    await expect(mascot.locator('img')).toHaveAttribute('src', /mascot-nok-encourage\.webp$/)
    await waitUntilStill(page.getByTestId('feedback-stake'))
    // She stands on the window's bottom edge.
    const box = (await mascot.boundingBox())!
    expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThan(1)
    const her = await stageBox(page, mascot)
    for (const control of [...corners(page), status.locator('> div')]) expect(overlaps(her, await stageBox(page, control))).toBe(false)
  })
}

test('the Stars display: seed-stars in a wooden planter box, and in the celebration', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  const counter = page.getByTestId('star-counter')
  await expect(counter).toHaveClass(/planter-box/)
  await expect(counter.locator('[data-art="seed-star"]')).toBeVisible()
  await expect(counter).toHaveText(/ดาวที่ได้\s*0\/9/)
  for (const [a, b] of [
    ['ผัก', 'ตัก'],
    ['ดอก', 'บอก'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${a}(\\s|$)`) }).click()
    await page.getByRole('button', { name: new RegExp(`^${b}(\\s|$)`) }).click()
  }
  const celebration = page.getByTestId('celebration')
  await expect(celebration).toContainText('ได้ 3 ดาว')
  await expect(celebration.locator('[data-art="seed-star"]')).toHaveCount(3)
  await expect(counter).toHaveText(/3\/9/)
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} the Kit's controls sit in the window's corners and are big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    for (const step of [2, 5, 9]) {
      await open(page, step, {}, 'mae-kok')
      await page.getByRole('heading', { level: 1 }).waitFor()
      const box = (await music(page).boundingBox())!
      expect(viewport.width - box.x - box.width, `Step ${step} music`).toBeCloseTo(178 * scale, 0)
      const back = (await link(page, 'ย้อนกลับ').boundingBox())!
      expect(back.x).toBeCloseTo(29 * scale, 0)
      expect(viewport.height - back.y - back.height).toBeCloseTo(13 * scale, 0)
      if (viewport.height === 390) for (const target of corners(page)) await expectTapTarget(target)
    }
  })
}

test('keyboard and screen reader: every Kit control is named, its art hidden, focus visible, Enter works', async ({ page }) => {
  await open(page, 3, {}, 'mae-kok')
  for (const target of corners(page)) {
    await expect(target).toHaveAccessibleName(/\S/)
    for (const art of await target.locator('svg').all()) await expect(art).toHaveAttribute('aria-hidden', 'true')
  }
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
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/4$/)
  const before = await music(page).getAttribute('aria-pressed')
  await music(page).focus()
  await page.keyboard.press('Space')
  await expect(music(page)).not.toHaveAttribute('aria-pressed', before!)
})

test('reduced motion: no hoe, no seed burst and nothing moving; the tok still sounds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(countToks)
  await open(page, 2, {}, 'mae-kok')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await link(page, 'ถัดไป').click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/3$/)
  await expect(page.getByTestId('step-hoe')).toHaveCount(0)
  await press(page, music(page))
  await expect(burst(page)).toHaveCount(0)
  expect(await toks(page)).toBe(2)
  await page.mouse.up()
  await expect(music(page)).toHaveCSS('transition-property', 'none')

  await open(page, 5, {}, 'mae-kok')
  await page.getByRole('button', { name: /^นก(\s|$)/ }).click()
  await button(page, 'ตรวจคำตอบ').click()
  await expect(page.getByTestId('feedback-mascot')).toBeVisible()
  await expect(page.getByTestId('feedback-stake')).toHaveCSS('transform', 'none')
  await expect(page.getByTestId('step-content')).toHaveCSS('opacity', '1')
  await expect.poll(() => running(page)).toBe(0)
})

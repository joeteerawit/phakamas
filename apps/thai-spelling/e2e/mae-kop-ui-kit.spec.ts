import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { otherLook, wholeStage } from './maeKop.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ's UI Kit (#70, docs/mae-kop-spec.md): nothing in its chrome may look like แม่กง's or แม่กม's controls.

const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const burst = (page: Page) => page.getByTestId('click-burst')
const corners = (page: Page) => [link(page, 'กลับไปแผนที่'), link(page, 'ย้อนกลับ'), link(page, 'ถัดไป'), music(page)]
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

/** Scripted animations on `scale` or `rotate` of the control itself: แม่กง's boing (CSS transitions are the vinyl's own squash). */
const squashes = (target: Locator) =>
  target.evaluate(
    (el) =>
      el
        .getAnimations()
        .filter((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation))
        .filter((a) => (a as Animation & { effect: KeyframeEffect }).effect.getKeyframes().some((f) => 'scale' in f || 'rotate' in f)).length,
  )

/** The chrome every Step shares, stretched to the window's edges: title, Step badge, Star counter, Home, music, Back and Next. */
const chrome = (page: Page) => page.locator('[data-testid="stage"] > [style*="inset"]')

async function press(page: Page, target: Locator) {
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
}

test('the chrome of Steps 2–10 uses only the แม่กบ Kit: nothing from แม่กง or แม่กม', async ({ page }) => {
  for (const step of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    await open(page, step, {}, 'mae-kop')
    await page.getByRole('heading', { level: 1 }).waitFor()
    expect(await chrome(page).count(), `Step ${step}`).toBeGreaterThan(0)
    expect(await otherLook(chrome(page)), `Step ${step}`).toEqual([])
    await expect(music(page), `Step ${step}`).toHaveClass(/vinyl-button/)
    await expect(page.getByText(`ขั้น ${step}/10`), `Step ${step}`).toHaveClass(/drop-label/)
  }
})

test('every Step and the Map, Games included, look like the แม่กบ Kit only: no control from แม่กง or แม่กม anywhere', async ({ page }) => {
  for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'map']) {
    await open(page, 1, {}, 'mae-kop')
    await page.goto(`/lesson/mae-kop/${step}`)
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'attached' })
    await expect(page.getByTestId('step-content').or(page.getByTestId('map-art')).first(), `Step ${step}`).toBeAttached()
    expect(await otherLook(wholeStage(page)), `Step ${step}`).toEqual([])
  }
})

test('Home is a teal hut back to the Map, Back and Next rubber boots, the title a teal vinyl tag', async ({ page }) => {
  for (const step of [2, 5, 7, 10]) {
    await page.goto(`/lesson/mae-kop/${step}`)
    await expect(link(page, 'กลับไปแผนที่').locator('[data-art="hut"]'), `Step ${step}`).toBeVisible()
    for (const name of ['ย้อนกลับ', step === 10 ? 'กลับหน้าแรก' : 'ถัดไป']) {
      await expect(link(page, name).locator('[data-art="boot"]'), `Step ${step} ${name}`).toBeVisible()
      await expect(link(page, name).locator('img'), `Step ${step} ${name}`).toHaveCount(0)
    }
    await expect(page.getByRole('heading', { level: 1 }).locator('..'), `Step ${step}`).toHaveCSS('background-color', 'rgb(15, 127, 122)')
  }
  // Back points the other way.
  const flip = await link(page, 'ย้อนกลับ').locator('svg').evaluate((el) => getComputedStyle(el).scale)
  expect(flip).toMatch(/^-1/)
})

test('the speaker is a snail on a pebble, with ripple rings while it plays', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  const explain = button(page, 'ฟังคำอธิบาย')
  await expect(explain.locator('[data-art="snail"]')).toBeVisible()
  await expect(explain.getByTestId('sound-waves')).toHaveCount(0)
  await explain.click()
  await expect(explain.getByTestId('sound-waves')).toBeVisible()
  await page.goto('/lesson/mae-kop/3')
  await expect(page.locator('[data-art="snail"]').first()).toBeVisible()
})

test('a tap plops softly and splashes droplets at the pointer; the vinyl squashes, not แม่กง\'s boing', async ({ page }) => {
  await page.addInitScript(countPlops)
  await open(page, 3, {}, 'mae-kop')
  const next = link(page, 'ถัดไป')
  await press(page, music(page))
  await expect(burst(page).locator('svg[data-splash]')).toHaveCount(1)
  expect(await squashes(music(page))).toBe(0)
  expect(await plops(page)).toBe(1)
  // The vinyl squashes like rubber while held.
  await expect.poll(() => music(page).evaluate((el) => getComputedStyle(el).scale)).toBe('1.06 0.88')
  await page.mouse.up()
  await expect(burst(page)).toHaveCount(0)
  await press(page, next)
  expect(await plops(page)).toBe(2)
  await page.mouse.up()
})

test('a ripple spreads from the centre to cover the window between Steps, and never takes a tap', async ({ page }) => {
  await page.goto('/lesson/mae-kop/2')
  for (const [name, step] of [
    ['ถัดไป', 3],
    ['ถัดไป', 4],
    ['ย้อนกลับ', 3],
  ] as const) {
    await link(page, name).click()
    const ripple = page.getByTestId('step-ripple')
    await expect(ripple, `to Step ${step}`).toBeVisible()
    await expect(page.getByTestId('step-flurry')).toHaveCount(0)
    await expect(page.getByTestId('panel-transition')).toHaveCount(0)
    await expect(ripple).toHaveCSS('pointer-events', 'none')
    await expect(page).toHaveURL(new RegExp(`/lesson/mae-kop/${step}$`))
    await expect(ripple).toHaveCount(0)
  }
})

test('feedback is a drop-shaped bubble from น้องกบ, who pops up from a puddle at the window edge clear of every control', async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/lesson/mae-kop/5')
    await page.getByRole('button', { name: /^กบ(\s|$)/ }).click()
    await button(page, 'ตรวจคำตอบ').click()
    const status = page.getByRole('status').filter({ hasText: 'คะแนน' })
    await expect(status).toContainText('ยังไม่ถูก: ')
    await expect(status.locator('.bg-wrong')).toBeVisible()
    await expect(status.locator('> div')).toHaveCSS('background-color', 'rgb(255, 243, 184)')
    const mascot = page.getByTestId('feedback-mascot')
    await expect(mascot.locator('img')).toHaveAttribute('src', /mascot-kop-encourage\.webp$/)
    await expect.poll(async () => Math.abs((await mascot.boundingBox())!.x), `${viewport.width}: at the left edge`).toBeLessThan(1)
    await waitUntilStill(mascot.locator('img'))
    const her = await stageBox(page, mascot)
    for (const control of [...corners(page), button(page, 'ตรวจคำตอบ'), button(page, 'เริ่มใหม่'), status]) {
      expect(overlaps(her, await stageBox(page, control))).toBe(false)
    }
  }
})

test('the Stars display: raindrop Stars hung from a reed, and in the celebration', async ({ page }) => {
  await open(page, 8, {}, 'mae-kop')
  const counter = page.getByTestId('star-counter')
  await expect(counter).toHaveClass(/reed-stars/)
  await expect(counter.locator('[data-art="raindrop-star"]')).toBeVisible()
  await expect(counter).toHaveText(/ดาวที่ได้\s*0\/9/)
  for (const [a, b] of [
    ['กบ', 'จบ'],
    ['จับ', 'รับ'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${a}(\\s|$)`) }).click()
    await page.getByRole('button', { name: new RegExp(`^${b}(\\s|$)`) }).click()
  }
  const celebration = page.getByTestId('celebration')
  await expect(celebration).toContainText('ได้ 3 ดาว')
  await expect(celebration.locator('[data-art="raindrop-star"]')).toHaveCount(3)
  await expect(counter).toHaveText(/3\/9/)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`at ${viewport.width}×${viewport.height} the Kit's controls sit in the window's corners and are big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const phone = viewport.height === 390
    for (const step of [2, 5, 9]) {
      await open(page, step, {}, 'mae-kop')
      await page.getByRole('heading', { level: 1 }).waitFor()
      const box = (await music(page).boundingBox())!
      expect(viewport.width - box.x - box.width, `Step ${step} music`).toBeCloseTo(178 * scale, 0)
      expect(box.y, `Step ${step} music`).toBeCloseTo(32 * scale, 0)
      const home = (await link(page, 'กลับไปแผนที่').boundingBox())!
      expect(viewport.width - home.x - home.width).toBeCloseTo(20 * scale, 0)
      const back = (await link(page, 'ย้อนกลับ').boundingBox())!
      expect(back.x).toBeCloseTo(29 * scale, 0)
      expect(viewport.height - back.y - back.height).toBeCloseTo(13 * scale, 0)
      if (phone) for (const target of corners(page)) await expectTapTarget(target)
    }
  })
}

test('keyboard and screen reader: every Kit control is named, its art hidden, focus visible, Enter works', async ({ page }) => {
  await open(page, 3, {}, 'mae-kop')
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
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/4$/)

  // The vinyl music pill works from the keyboard too.
  const before = await music(page).getAttribute('aria-pressed')
  await music(page).focus()
  await page.keyboard.press('Space')
  await expect(music(page)).not.toHaveAttribute('aria-pressed', before!)
})

test('reduced motion: no ripple, no splash and nothing moving; the plop still sounds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(countPlops)
  await open(page, 2, {}, 'mae-kop')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await link(page, 'ถัดไป').click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/3$/)
  await expect(page.getByTestId('step-ripple')).toHaveCount(0)
  await press(page, music(page))
  await expect(burst(page)).toHaveCount(0)
  expect(await plops(page)).toBe(2)
  await page.mouse.up()
  await expect(music(page)).toHaveCSS('transition-property', 'none')

  await page.goto('/lesson/mae-kop/5')
  await page.getByRole('button', { name: /^กบ(\s|$)/ }).click()
  await button(page, 'ตรวจคำตอบ').click()
  await expect(page.getByTestId('feedback-mascot')).toBeVisible()
  await expect(page.getByTestId('feedback-mascot').locator('img')).toHaveCSS('transform', 'none')
  await expect(page.getByTestId('feedback-splash')).toHaveCount(0)
  await expect(page.getByTestId('step-content')).toHaveCSS('opacity', '1')
  await expect.poll(() => running(page)).toBe(0)
})

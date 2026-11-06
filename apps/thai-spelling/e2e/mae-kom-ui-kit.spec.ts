import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กม's UI Kit (#63, docs/mae-kom-spec.md): nothing on its Steps may look like แม่กง's controls.
const MAE_KONG_ART = ['ui-home', 'play-button', 'speaker-button', 'ui-buzzer', 'ui-plank']

const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const burst = (page: Page) => page.getByTestId('click-burst')
const corners = (page: Page) => [link(page, 'กลับไปขั้นแรก'), link(page, 'ย้อนกลับ'), link(page, 'ถัดไป'), music(page)]
const running = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)

/** Counts the oscillators the page starts: each bell jingle is six. */
function countBells() {
  const w = window as unknown as { __bells: number }
  w.__bells = 0
  const create = AudioContext.prototype.createOscillator
  AudioContext.prototype.createOscillator = function (this: AudioContext) {
    w.__bells++
    return create.call(this)
  }
}
const bells = (page: Page) => page.evaluate(() => (window as unknown as { __bells: number }).__bells)

/** Animations on `scale` or `rotate` of the control itself: แม่กง's boing. */
const squashes = (target: Locator) =>
  target.evaluate((el) => el.getAnimations().filter((a) => (a as Animation & { effect: KeyframeEffect }).effect.getKeyframes().some((f) => 'scale' in f || 'rotate' in f)).length)

/** Whether anything on the page draws แม่กง's art, comic card ring or wooden plank. */
const maeKongLook = (page: Page) =>
  page.evaluate((art) => {
    const found: string[] = []
    for (const el of document.querySelectorAll('*')) {
      const src = el.getAttribute('src') ?? ''
      const bg = getComputedStyle(el).backgroundImage
      if (art.some((name) => src.includes(`/${name}.webp`) || bg.includes(`/${name}.webp`))) found.push(src || bg)
      if (el.classList.contains('comic-card') || bg.includes('conic-gradient')) found.push(el.className.toString())
    }
    return found
  }, MAE_KONG_ART)

async function press(page: Page, target: Locator) {
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
}

test('Steps 1–4 use only the แม่กม Kit: no แม่กง art, comic card or plank anywhere', async ({ page }) => {
  for (const step of [1, 2, 3, 4]) {
    await open(page, step, {}, 'mae-kom')
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'attached' })
    expect(await maeKongLook(page), `Step ${step}`).toEqual([])
    await expect(music(page), `Step ${step}`).toHaveClass(/ice-block/)
  }
})

test('Home is a snowy house, Back and Next street direction signs, the title a street-name sign', async ({ page }) => {
  for (const step of [2, 5, 7, 10]) {
    await page.goto(`/lesson/mae-kom/${step}`)
    await expect(link(page, 'กลับไปขั้นแรก').locator('[data-art="house"]'), `Step ${step}`).toBeVisible()
    for (const name of ['ย้อนกลับ', step === 10 ? 'กลับหน้าแรก' : 'ถัดไป']) {
      await expect(link(page, name).locator('[data-art="street-sign"]'), `Step ${step} ${name}`).toBeVisible()
      await expect(link(page, name).locator('img'), `Step ${step} ${name}`).toHaveCount(0)
    }
    await expect(page.getByRole('heading', { level: 1 }).locator('..'), `Step ${step}`).toHaveCSS('background-color', 'rgb(31, 79, 191)')
  }
})

test('the speaker is a red radio and the cards are frosted window frames', async ({ page }) => {
  await open(page, 2, {}, 'mae-kom')
  const windows = page.getByRole('main').getByRole('list').getByRole('button')
  await expect(windows).toHaveCount(6)
  for (const card of await windows.all()) {
    await expect(card).toHaveClass(/frost-card/)
    await expect(card.locator('[data-art="radio"]')).toBeVisible()
  }
  await page.goto('/lesson/mae-kom/3')
  await expect(button(page, 'ฟังเสียง').locator('[data-art="radio"]')).toBeVisible()
  for (const name of ['คำก่อนหน้า', 'คำถัดไป', 'ลองอ่านเอง']) await expect(button(page, name)).toHaveClass(/ice-block/)
  await page.goto('/lesson/mae-kom/4')
  await expect(button(page, 'ฟังคำอธิบาย').locator('[data-art="radio"]')).toBeVisible()
  await expect(button(page, 'ชุดคำที่ 1')).toHaveClass(/ice-block/)
})

test('a tap rings a soft bell and puffs snow at the pointer; the control does not boing', async ({ page }) => {
  await page.addInitScript(countBells)
  await open(page, 3, {}, 'mae-kom')
  const next = button(page, 'คำถัดไป')
  await press(page, next)
  await expect(burst(page).locator('svg[data-puff]')).toHaveCount(1)
  expect(await squashes(next)).toBe(0)
  expect(await bells(page)).toBe(6)
  await page.mouse.up()
  await expect(page.getByText('คำที่ 2/6')).toBeVisible()
  await expect(burst(page)).toHaveCount(0)

  // Disabled controls get nothing.
  await button(page, 'คำก่อนหน้า').click()
  await expect(button(page, 'คำก่อนหน้า')).toBeDisabled()
  const before = await bells(page)
  await press(page, button(page, 'คำก่อนหน้า'))
  expect(await bells(page)).toBe(before)
  await page.mouse.up()
})

test("แม่กง's tap is unchanged: a boing and a comic star, no bell", async ({ page }) => {
  await page.addInitScript(countBells)
  await open(page, 3)
  const next = button(page, 'คำถัดไป')
  await press(page, next)
  await expect(burst(page)).toHaveCount(1)
  await expect(burst(page).locator('svg[data-puff]')).toHaveCount(0)
  expect(await squashes(next)).toBe(1)
  expect(await bells(page)).toBe(0)
  await page.mouse.up()
})

test('a snow flurry wipes across the window between Steps, never the comic panel', async ({ page }) => {
  await page.goto('/lesson/mae-kom/1')
  await link(page, 'เริ่มเรียน').click()
  await expect(page.getByTestId('step-flurry')).toBeVisible()
  await expect(page.getByTestId('panel-transition')).toHaveCount(0)
  await expect(page.getByTestId('step-flurry')).toHaveCount(0)
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/2$/)

  for (const [name, step] of [
    ['ถัดไป', 3],
    ['ถัดไป', 4],
    ['ถัดไป', 5],
    ['ย้อนกลับ', 4],
  ] as const) {
    await link(page, name).click()
    await expect(page.getByTestId('step-flurry'), `to Step ${step}`).toBeVisible()
    await expect(page.getByTestId('panel-transition')).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(`/lesson/mae-kom/${step}$`))
    // It never takes a tap, and is gone once the new Step shows.
    await expect(page.getByTestId('step-flurry')).toHaveCSS('pointer-events', 'none')
    await expect(page.getByTestId('step-flurry')).toHaveCount(0)
  }
})

test('feedback is a speech bubble from น้องส้ม, who peeks in at the window edge clear of every control', async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/lesson/mae-kom/5')
    await page.getByRole('button', { name: /^ร่ม(\s|$)/ }).click()
    await button(page, 'ตรวจคำตอบ').click()
    const status = page.getByRole('status').filter({ hasText: 'คะแนน' })
    await expect(status).toContainText('ยังไม่ถูก: ')
    await expect(status.locator('.bg-wrong')).toBeVisible()
    const mascot = page.getByTestId('feedback-mascot')
    await expect(mascot.locator('img')).toHaveAttribute('src', /mascot-som-encourage\.webp$/)
    await expect.poll(async () => Math.abs((await mascot.boundingBox())!.x), `${viewport.width}: at the left edge`).toBeLessThan(1)
    const her = await stageBox(page, mascot)
    for (const control of [...corners(page), button(page, 'ตรวจคำตอบ'), button(page, 'เริ่มใหม่'), status]) {
      expect(overlaps(her, await stageBox(page, control))).toBe(false)
    }
  }
})

test('the Stars display: snowflake-stars on a shop banner, and in the celebration', async ({ page }) => {
  await open(page, 8, {}, 'mae-kom')
  const counter = page.getByTestId('star-counter')
  await expect(counter).toHaveClass(/shop-banner/)
  await expect(counter.locator('[data-art="snowflake-star"]')).toBeVisible()
  await expect(counter).toHaveText(/ดาวที่ได้\s*0\/9/)
  for (const [a, b] of [
    ['ร่ม', 'ชม'],
    ['ลม', 'ผม'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${a}(\\s|$)`) }).click()
    await page.getByRole('button', { name: new RegExp(`^${b}(\\s|$)`) }).click()
  }
  const celebration = page.getByTestId('celebration')
  await expect(celebration).toContainText('ได้ 3 ดาว')
  await expect(celebration.locator('[data-art="snowflake-star"]')).toHaveCount(3)
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
    for (const step of [2, 3, 4]) {
      await open(page, step, {}, 'mae-kom')
      await page.getByRole('heading', { level: 1 }).waitFor()
      const box = (await music(page).boundingBox())!
      expect(viewport.width - box.x - box.width, `Step ${step} music`).toBeCloseTo(178 * scale, 0)
      expect(box.y, `Step ${step} music`).toBeCloseTo(32 * scale, 0)
      if (phone) {
        for (const target of corners(page)) await expectTapTarget(target)
        for (const target of await page.getByRole('main').getByRole('button').all()) await expectTapTarget(target)
      }
    }

    // The cover: music bottom-left, ▶ as a street sign bottom-right, เริ่มใหม่ once a Session is under way.
    await page.goto('/lesson/mae-kom/1')
    const start = link(page, 'เรียนต่อ (ขั้น 4)')
    await expect(start.locator('[data-art="street-sign"]')).toBeVisible()
    const play = (await start.boundingBox())!
    expect(viewport.width - play.x - play.width).toBeCloseTo(32 * scale, 0)
    expect(viewport.height - play.y - play.height).toBeCloseTo(24 * scale, 0)
    await expect(button(page, 'เริ่มใหม่')).toHaveClass(/ice-block/)
    if (phone) for (const target of [music(page), start, button(page, 'เริ่มใหม่')]) await expectTapTarget(target)
  })
}

test('keyboard and screen reader: every Kit control is named, its art hidden, focus visible, Enter works', async ({ page }) => {
  await open(page, 3, {}, 'mae-kom')
  for (const target of corners(page)) {
    await expect(target).toHaveAccessibleName(/\S/)
    for (const art of await target.locator('svg').all()) await expect(art).toHaveAttribute('aria-hidden', 'true')
  }
  await expect(music(page)).toHaveAttribute('aria-pressed', /true|false/)

  // Tab through the chrome and the Step to Next; its focus ring shows, and Enter goes on.
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
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/4$/)

  // An ice block works from the keyboard too.
  await button(page, 'ชุดคำที่ 2').focus()
  await page.keyboard.press('Space')
  await expect(button(page, 'ชุดคำที่ 2')).toHaveAttribute('aria-pressed', 'true')
})

test('reduced motion: no flurry, no snow puff and nothing moving; the bell still rings', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(countBells)
  await open(page, 2, {}, 'mae-kom')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await link(page, 'ถัดไป').click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/3$/)
  await expect(page.getByTestId('step-flurry')).toHaveCount(0)
  await expect(button(page, 'คำถัดไป')).toBeVisible()
  await press(page, button(page, 'คำถัดไป'))
  await expect(burst(page)).toHaveCount(0)
  expect(await bells(page)).toBe(12)
  await page.mouse.up()
  await expect(page.getByText('คำที่ 2/6')).toBeVisible()
  // The shared Step fade (opacity only) ends; then nothing runs.
  await expect(page.getByTestId('step-content')).toHaveCSS('opacity', '1')
  expect(await running(page)).toBe(0)

  await page.goto('/lesson/mae-kom/5')
  await page.getByRole('button', { name: /^ร่ม(\s|$)/ }).click()
  await button(page, 'ตรวจคำตอบ').click()
  await expect(page.getByTestId('feedback-mascot')).toBeVisible()
  await expect(page.getByTestId('feedback-mascot')).toHaveCSS('transform', 'none')
})

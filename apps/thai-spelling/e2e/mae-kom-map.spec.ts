import { expect, type Locator, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { overlaps, stageBox, type StageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

const MAP = '/lesson/mae-kom/map'
// src/lessons/mae-kom.ts: Steps 2–10, the Map's stops in street order.
const TITLES = ['ดูภาพเรียนรู้คำ', 'ฟังแล้วอ่านตาม', 'สังเกตตัวสะกด', 'แม่กมอยู่ไหน?', 'กล่องคำแม่กม', 'อ่านการ์ตูนแม่กม', 'จับคู่ดูคำ', 'อ่านออก บอกได้', 'สรุปและประเมิน']
const ACTIVITY_STEPS = [5, 6, 8]
const MAE_KOM = ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม', 'แก้ม', 'ยิ้ม']
// The landmark each stop's sign sits on, in pixels of kom-map.webp (1920×1080).
const LANDMARKS: Record<number, { left: number; right: number; top: number; bottom: number; what: string }> = {
  2: { left: 70, right: 690, top: 700, bottom: 1020, what: 'the shop row' },
  3: { left: 110, right: 445, top: 350, bottom: 720, what: 'the billboard building' },
  4: { left: 480, right: 710, top: 490, bottom: 680, what: 'the bus stop' },
  5: { left: 800, right: 1300, top: 480, bottom: 710, what: 'the umbrella square' },
  6: { left: 650, right: 960, top: 180, bottom: 470, what: 'the apartment block' },
  7: { left: 1010, right: 1360, top: 130, bottom: 430, what: 'the cinema' },
  8: { left: 1380, right: 1720, top: 180, bottom: 400, what: 'the lamp street' },
  9: { left: 1640, right: 1900, top: 270, bottom: 570, what: 'the post office' },
  10: { left: 1650, right: 1860, top: 30, bottom: 280, what: 'home' },
}

const stops = (page: Page) => page.getByRole('navigation', { name: 'แผนที่เมืองหิมะ' }).getByRole('link')
const stop = (page: Page, step: number) => page.getByRole('link', { name: new RegExp(`^ขั้น ${step} `) })
const backToCover = (page: Page) => page.getByRole('link', { name: 'กลับหน้าปก', exact: true })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })
const mascot = (page: Page) => page.getByTestId('map-mascot')
const arrow = (page: Page) => page.getByTestId('map-arrow')
const running = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)

type Seed = { currentStep: number; completedSteps?: number[] }
const KEY = 'thai-spelling:lesson-session'

/** A Session already under way, as the Session store saves it. */
const stored = (session: Seed) =>
  JSON.stringify({
    state: {
      session: { lessonId: 'mae-kom', visitedSteps: [1, session.currentStep], completedSteps: [], activities: {}, startedAt: '2026-11-06T00:00:00.000Z', ...session },
      musicOn: true,
    },
    version: 1,
  })

/** Starts the page with `session` saved; reloads keep whatever the page saved since. */
const seed = (page: Page, session: Seed) =>
  page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('seeded')) localStorage.setItem(key, value)
      sessionStorage.setItem('seeded', '1')
    },
    [KEY, stored(session)] as const,
  )

/** Saves `session` over the current one and reloads. */
async function reseed(page: Page, session: Seed) {
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, stored(session)] as const)
  await page.reload()
}

/** A box in pixels of kom-map.webp, wherever the map art is drawn. */
async function inMapPixels(page: Page, target: Locator) {
  const art = await stageBox(page, page.getByTestId('map-art'))
  const box = await stageBox(page, target)
  const x = (stagePx: number) => ((stagePx - art.left) / art.width) * 1920
  const y = (stagePx: number) => ((stagePx - art.top) / art.height) * 1080
  return { cx: x(box.cx), cy: y(box.cy) }
}

test("the cover's ▶ opens the Map: nine stops along the street, Back to the cover and the music", async ({ page }) => {
  await open(page, 1, {}, 'mae-kom')
  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/map$/)
  // The teacher's intro carries on over the Map.
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/explanations/mae-kom-intro.mp3'])
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('แผนที่เมืองหิมะ')
  await expect(page.getByTestId('stage-scene')).toHaveCSS('background-image', /comic\/kom-map\.webp/)
  await expect(page.getByTestId('map-art')).toHaveAttribute('src', '/assets/comic/kom-map.webp')
  await expect(mascot(page).locator('img')).toHaveAttribute('src', /mascot-som-greet\.webp$/)

  await expect(stops(page)).toHaveCount(9)
  for (const [i, title] of TITLES.entries()) {
    await expect(stops(page).nth(i)).toHaveAccessibleName(new RegExp(`^ขั้น ${i + 2} ${title.replace('?', '\\?')}`))
    await expect(stops(page).nth(i)).toHaveAttribute('href', `/lesson/mae-kom/${i + 2}`)
  }
  // A new Session: nothing done, no Stars yet, the arrow on the first stop, น้องส้ม at the start of the street.
  for (const step of ACTIVITY_STEPS) await expect(stop(page, step)).toHaveAccessibleName(/ได้ 0 ดาว/)
  await expect(page.locator('[data-done]')).toHaveCount(0)
  await expect(arrow(page)).toHaveCount(1)
  await expect(stop(page, 2)).toHaveAccessibleName(/ไปต่อที่นี่$/)
  await expect(mascot(page)).toHaveAttribute('data-at', 'start')

  await backToCover(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/1$/)
})

test('แม่กง has no Map: its URL lands on the แม่กง cover', async ({ page }) => {
  await page.goto('/lesson/mae-kong/map')
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/1$/)
  await expect(page.getByText('แม่ กง (ง)')).toBeVisible()
})

test("every stop opens its Step, and each Step's Home comes back to the Map, keeping the Session", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seed(page, { currentStep: 4, completedSteps: [2, 3] })
  await page.goto(MAP)
  for (const [i, title] of TITLES.entries()) {
    const step = i + 2
    await stop(page, step).click()
    await expect(page).toHaveURL(new RegExp(`/lesson/mae-kom/${step}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await page.getByRole('link', { name: 'กลับไปแผนที่', exact: true }).click()
    await expect(page).toHaveURL(/\/lesson\/mae-kom\/map$/)
    // She stands at the stop just left; the Session is still there.
    await expect(mascot(page)).toHaveAttribute('data-at', String(step))
    await expect(page.locator('[data-done]')).toHaveCount(2)
  }
})

test('done stops show a lit window and Activities their Stars, from the Session and after a reload; the arrow marks the next stop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(MAP)
  await stop(page, 2).click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/3$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()

  await expect(stop(page, 2)).toHaveAccessibleName('ขั้น 2 ดูภาพเรียนรู้คำ ทำแล้ว')
  await expect(stop(page, 2)).toHaveAttribute('data-done', 'true')
  await expect(stop(page, 2).getByTestId('stop-window').locator('span').first()).toHaveClass(/bg-sun/)
  await expect(stop(page, 3).getByTestId('stop-window').locator('span').first()).not.toHaveClass(/bg-sun/)
  await expect(stop(page, 3)).toHaveAccessibleName(/ไปต่อที่นี่$/)

  // Full marks on Step 5: 3 Stars on its stop.
  await stop(page, 5).click()
  for (const word of MAE_KOM) await page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) }).click()
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
  await expect(page.getByRole('status').filter({ hasText: '12/12' })).toBeVisible()
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()

  for (const reload of [false, true]) {
    if (reload) await page.reload()
    await expect(stop(page, 5), `reload ${reload}`).toHaveAccessibleName('ขั้น 5 แม่กมอยู่ไหน? ทำแล้ว ได้ 3 ดาว')
    await expect(stop(page, 5).locator('[data-earned]')).toHaveCount(3)
    await expect(stop(page, 6)).toHaveAccessibleName('ขั้น 6 กล่องคำแม่กม ได้ 0 ดาว')
    await expect(stop(page, 6).locator('[data-earned]')).toHaveCount(0)
    await expect(stop(page, 6).locator('[data-art="snowflake-star"]')).toHaveCount(3)
    await expect(page.locator('[data-done]')).toHaveCount(2)
    await expect(stop(page, 3)).toHaveAccessibleName(/ไปต่อที่นี่$/)
    await expect(arrow(page)).toHaveCount(1)
    await expect(mascot(page)).toHaveAttribute('data-at', '5')
  }

  // Once every stop up to 9 is done, the arrow points home.
  await reseed(page, { currentStep: 9, completedSteps: [2, 3, 4, 5, 6, 7, 8, 9] })
  await expect(stop(page, 10)).toHaveAccessibleName('ขั้น 10 สรุปและประเมิน ไปต่อที่นี่')
})

test('น้องส้ม walks along the street to the chosen stop, then its Step opens', async ({ page }) => {
  await seed(page, { currentStep: 4 })
  await page.goto(MAP)
  await expect(mascot(page)).toHaveAttribute('data-at', '4')
  const before = await stageBox(page, mascot(page))
  const start = await page.evaluate(() => performance.now())
  await stop(page, 6).click()
  // She sets off; the Map stays until she gets there.
  await expect(mascot(page)).toHaveAttribute('data-at', '6')
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/map$/)
  await expect.poll(async () => (await stageBox(page, mascot(page))).top).toBeLessThan(before.top - 20)
  // A tap on another stop while she walks is ignored.
  await stop(page, 9).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/6$/)
  expect(await page.evaluate(() => performance.now()), 'she walks for at most 2 s').toBeLessThan(start + 2600)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('กล่องคำแม่กม')
})

test('under reduced motion she is at the chosen stop at once and nothing on the Map moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seed(page, { currentStep: 4, completedSteps: [2] })
  await page.goto(MAP)
  await expect(arrow(page)).toBeVisible()
  expect(await running(page)).toBe(0)
  for (const target of [mascot(page), arrow(page)]) {
    const before = await target.boundingBox()
    await page.waitForTimeout(300)
    expect(await target.boundingBox()).toEqual(before)
  }
  await stop(page, 8).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/8$/)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`the Map at ${viewport.width}×${viewport.height}: it fills the window, signs on their landmarks, buttons in the corners, nothing in the way`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(MAP)
    await expect(stops(page)).toHaveCount(9)

    for (const target of [page.getByTestId('stage-scene'), page.getByTestId('map-art')]) {
      const fill = (await target.boundingBox())!
      expect(fill.x).toBeLessThanOrEqual(0.5)
      expect(fill.y).toBeLessThanOrEqual(0.5)
      expect(fill.x + fill.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
      expect(fill.y + fill.height).toBeGreaterThanOrEqual(viewport.height - 0.5)
    }

    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const back = (await backToCover(page).boundingBox())!
    expect(back.x).toBeCloseTo(29 * scale, 0)
    expect(viewport.height - back.y - back.height).toBeCloseTo(13 * scale, 0)
    const note = (await music(page).boundingBox())!
    expect(viewport.width - note.x - note.width).toBeCloseTo(46 * scale, 0)
    expect(viewport.height - note.y - note.height).toBeCloseTo(27 * scale, 0)
    await expect(backToCover(page).locator('[data-art="street-sign"]')).toBeVisible()
    await expect(music(page)).toHaveClass(/ice-block/)

    const signs: StageBox[] = []
    for (let step = 2; step <= 10; step++) {
      const { cx, cy } = await inMapPixels(page, stop(page, step))
      const land = LANDMARKS[step]!
      expect(cx >= land.left && cx <= land.right && cy >= land.top && cy <= land.bottom, `Step ${step} on ${land.what}`).toBe(true)
      const box = (await stop(page, step).boundingBox())!
      expect(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height, `Step ${step} in the window`).toBe(true)
      if (viewport.height === 390) await expectTapTarget(stop(page, step))
      signs.push(await stageBox(page, stop(page, step)))
    }
    if (viewport.height === 390) for (const target of [backToCover(page), music(page)]) await expectTapTarget(target)

    const chrome = [await stageBox(page, backToCover(page)), await stageBox(page, music(page)), await stageBox(page, page.getByRole('heading', { level: 1 }).locator('..'))]
    for (const [i, sign] of signs.entries()) {
      for (const other of [...signs.slice(i + 1), ...chrome]) expect(overlaps(sign, other), `Step ${i + 2} sign in the clear`).toBe(false)
    }
  })
}

test('wherever she stands, น้องส้ม and the arrow leave every sign clear', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(MAP)
  for (const currentStep of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    // Every stop up to hers is done, so the arrow points at the next one.
    await reseed(page, { currentStep, completedSteps: Array.from({ length: currentStep - 1 }, (_, i) => i + 2) })
    await expect(mascot(page)).toHaveAttribute('data-at', currentStep === 1 ? 'start' : String(currentStep))
    const her = await stageBox(page, mascot(page))
    const marker = await stageBox(page, arrow(page))
    for (let step = 2; step <= 10; step++) {
      const sign = await stageBox(page, stop(page, step))
      expect(overlaps(her, sign), `at ${currentStep}: น้องส้ม clear of Step ${step}`).toBe(false)
      expect(overlaps(marker, sign), `at ${currentStep}: the arrow clear of Step ${step}`).toBe(false)
    }
  }
})

test('keyboard and screen reader: the stops are named links in a list, their art hidden, focus visible, Enter opens one', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(MAP)
  await expect(page.getByRole('navigation', { name: 'แผนที่เมืองหิมะ' }).getByRole('listitem')).toHaveCount(9)
  for (const target of await stops(page).all()) {
    for (const art of await target.locator('> span').all()) await expect(art).toHaveAttribute('aria-hidden', 'true')
  }
  await expect(mascot(page)).toHaveAttribute('aria-hidden', 'true')

  let focused = ''
  for (let i = 0; i < 12 && !focused.startsWith('ขั้น 4 '); i++) {
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '')
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineWidth)
    expect(parseFloat(outline), `${focused} focus ring`).toBeGreaterThan(0)
  }
  expect(focused).toBe('ขั้น 4 สังเกตตัวสะกด')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/4$/)
})

test("the Map uses only the แม่กม Kit: no แม่กง art, comic card or plank", async ({ page }) => {
  await page.goto(MAP)
  await expect(stops(page)).toHaveCount(9)
  const found = await page.evaluate(() => {
    const art = ['ui-home', 'play-button', 'speaker-button', 'ui-buzzer', 'ui-plank']
    return [...document.querySelectorAll('*')].filter((el) => {
      const src = el.getAttribute('src') ?? ''
      const bg = getComputedStyle(el).backgroundImage
      return art.some((name) => src.includes(`/${name}.webp`) || bg.includes(`/${name}.webp`)) || el.classList.contains('comic-card')
    }).length
  })
  expect(found).toBe(0)
  for (const target of await stops(page).all()) await expect(target).toHaveClass(/ice-block/)
})

import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { otherLook, VIEWPORTS, wholeStage, wordButton } from './maeKon.js'
import { gapBetween, overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน's Map (#100, docs/mae-kon-spec.md): the floating market from above, one pier per Step 2–10 along the canal.
const TITLES = ['ดูภาพเรียนรู้คำ', 'ฟังแล้วอ่านตาม', 'สังเกตตัวสะกด', 'แม่กนอยู่ไหน?', 'กล่องคำแม่กน', 'อ่านการ์ตูนแม่กน', 'จับคู่ดูคำ', 'อ่านออก บอกได้', 'สรุปและประเมิน']
const MAP_TITLE = 'แผนที่ตลาดเรือ'

const stop = (page: Page, step: number) => page.getByRole('link', { name: new RegExp(`^ขั้น ${step} `) })
const stops = (page: Page) => page.getByRole('navigation', { name: MAP_TITLE }).getByRole('link')
const arrow = (page: Page) => page.getByTestId('map-arrow')
const her = (page: Page) => page.getByTestId('map-mascot')
const back = (page: Page) => page.getByRole('link', { name: 'กลับหน้าปก' })
const music = (page: Page) => page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ })

async function openMap(page: Page) {
  await open(page, 1, {}, 'mae-kon')
  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/map$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(MAP_TITLE)
}

/** The stop the recommended arrow points at: the sign nearest it. */
async function arrowStop(page: Page) {
  const at = await stageBox(page, arrow(page))
  let best = { step: 0, d: Infinity }
  for (let step = 2; step <= 10; step++) {
    const box = await stageBox(page, stop(page, step))
    const d = Math.hypot(box.cx - at.cx, box.cy - at.cy)
    if (d < best.d) best = { step, d }
  }
  return best.step
}

test("the cover ▶ opens the Map: nine open piers along the canal up to น้องส้ม's stilt house, the first one recommended", async ({ page }) => {
  await openMap(page)
  await expect(stops(page)).toHaveCount(9)
  for (const [i, title] of TITLES.entries()) {
    const step = i + 2
    await expect(stop(page, step)).toHaveAccessibleName(new RegExp(`^ขั้น ${step} ${title.replace('?', '\\?')}`))
    await expect(stop(page, step)).toHaveAttribute('href', `/lesson/mae-kon/${step}`)
    await expect(stop(page, step)).toHaveClass(/plank-sign/)
    await expect(stop(page, step)).not.toHaveAttribute('data-done')
  }
  await expect(stop(page, 2)).toHaveAccessibleName(/ไปต่อที่นี่$/)
  await expect(arrow(page)).toHaveCount(1)
  expect(await arrowStop(page)).toBe(2)
  // The Activity stops show their (empty) paddle Stars.
  for (const step of [5, 6, 8]) await expect(stop(page, step).getByTestId('stop-stars')).toBeVisible()
  await expect(stop(page, 3).getByTestId('stop-stars')).toHaveCount(0)
  await expect(her(page)).toHaveAttribute('data-at', 'start')
  await expect(her(page).locator('img')).toHaveAttribute('src', /mascot-kon-greet\.webp$/)
})

test('choosing a stop paddles น้องส้ม along the canal to its pier, then opens its Step; Home goes back to the Map', async ({ page }) => {
  await openMap(page)
  await stop(page, 4).click()
  await expect(her(page)).toHaveAttribute('data-at', '4')
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/4$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/map$/)
  // She waits where the student last was, moored at that pier.
  await expect(her(page)).toHaveAttribute('data-at', '4')
  await waitUntilStill(her(page))
  const at = await stageBox(page, her(page))
  const sign = await stageBox(page, stop(page, 4))
  expect(Math.hypot(at.cx - sign.cx, at.bottom - sign.bottom)).toBeLessThan(260)
})

test('done stops hang a marigold garland; Activity Stars and the recommended stop come from the Session and survive a reload', async ({ page }) => {
  await openMap(page)
  await stop(page, 2).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/2$/)
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/3$/)

  // Step 8 with full marks.
  await page.goto('/lesson/mae-kon/8')
  for (const [a, b] of [
    ['จาน', 'หวาน'],
    ['ช้อน', 'ร้อน'],
  ] as const) {
    await wordButton(page, a).click()
    await wordButton(page, b).click()
  }
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()

  for (const reload of [false, true]) {
    if (reload) await page.reload()
    await expect(stop(page, 2)).toHaveAttribute('data-done', 'true')
    await expect(stop(page, 2).getByTestId('stop-garland')).toBeVisible()
    await expect(stop(page, 8)).toHaveAttribute('data-done', 'true')
    await expect(stop(page, 8)).toHaveAccessibleName(/ได้ 3 ดาว/)
    await expect(stop(page, 8).locator('[data-earned]')).toHaveCount(3)
    await expect(stop(page, 5).locator('[data-earned]')).toHaveCount(0)
    await expect(stop(page, 3).getByTestId('stop-garland')).toHaveCount(0)
    expect(await arrowStop(page)).toBe(3)
  }
})

test('every Step is reachable: the nine stops open Steps 2–10, and Back opens the cover', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openMap(page)
  for (let step = 2; step <= 10; step++) {
    await stop(page, step).click()
    await expect(page).toHaveURL(new RegExp(`/lesson/mae-kon/${step}$`))
    await page.goto('/lesson/mae-kon/map')
  }
  await back(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/1$/)
})

test('the Map uses only the แม่กน Kit: nothing from แม่กง, แม่กม or แม่กบ anywhere on it', async ({ page }) => {
  await openMap(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(back(page).locator('[data-art="paddle"]')).toBeVisible()
  await expect(music(page)).toHaveClass(/plank-button/)
  await expect(stop(page, 2).locator('[data-art]')).toHaveCount(0)
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} the market fills the window, signs are clear of each other and the chrome, and big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openMap(page)
    const art = (await page.getByTestId('map-art').boundingBox())!
    expect(art.x).toBeLessThanOrEqual(0.5)
    expect(art.x + art.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
    const signs = await Promise.all((await stops(page).all()).map((s) => stageBox(page, s)))
    const chrome = await Promise.all([back(page), music(page), page.getByRole('heading', { level: 1 }).locator('../..')].map((c) => stageBox(page, c)))
    for (const [i, a] of signs.entries()) {
      for (const b of signs.slice(i + 1)) expect(gapBetween(a, b)).toBeGreaterThan(8)
      for (const c of chrome) expect(overlaps(a, c), `stop ${i + 2}`).toBe(false)
      expect(overlaps(a, await stageBox(page, arrow(page))), `arrow on stop ${i + 2}`).toBe(false)
      expect(overlaps(a, await stageBox(page, her(page))), `น้องส้ม on stop ${i + 2}`).toBe(false)
    }
    if (viewport.height === 390) for (const target of [...(await stops(page).all()), back(page), music(page)]) await expectTapTarget(target)
  })
}

test('keyboard and screen reader: the stops are a named list of links, the art is hidden, Enter opens a stop', async ({ page }) => {
  await openMap(page)
  await expect(page.getByTestId('map-art')).toHaveAttribute('aria-hidden', 'true')
  await expect(her(page)).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByRole('navigation', { name: MAP_TITLE }).getByRole('listitem')).toHaveCount(9)
  await stop(page, 3).focus()
  expect(parseFloat(await stop(page, 3).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/3$/)
})

test('under reduced motion she is simply there and the Step opens at once; nothing on the Map moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openMap(page)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
  await expect(arrow(page)).toHaveCSS('transform', 'none')
  await stop(page, 9).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/9$/, { timeout: 500 })
})

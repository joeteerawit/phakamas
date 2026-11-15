import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก's Map (#86, docs/mae-kok-spec.md): the terraced hillside, a stake per stop, น้องนก hopping up the path.

const stop = (page: Page, step: number) => page.getByRole('link', { name: new RegExp(`^ขั้น ${step} `) })
const stops = (page: Page) => page.getByRole('navigation', { name: 'แผนที่สวนผัก' }).getByRole('link')
const mascot = (page: Page) => page.getByTestId('map-mascot')

async function openMap(page: Page) {
  await open(page, 1, {}, 'mae-kok')
  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/map$/)
  // The Map is drawn once its last stop and its corner controls are on screen.
  await expect(stop(page, 10)).toBeVisible()
  await expect(page.getByRole('link', { name: 'กลับหน้าปก' })).toBeVisible()
}

test('the cover opens the Map: eight stops climbing the terraces to the bamboo hut, every one open, Step 2 recommended', async ({ page }) => {
  await openMap(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('แผนที่สวนผัก')
  await expect(stops(page)).toHaveCount(9)
  for (const [i, one] of (await stops(page).all()).entries()) {
    await expect(one).toHaveAccessibleName(new RegExp(`^ขั้น ${i + 2} `))
    await expect(one).toHaveClass(/seed-packet/)
  }
  await expect(stop(page, 2)).toHaveAccessibleName(/ไปต่อที่นี่$/)
  await expect(page.getByTestId('map-arrow')).toHaveCount(1)
  await expect(page.getByTestId('map-hut')).toBeAttached()
  // Activities show their (empty) seed-stars; nothing is done yet.
  for (const step of [5, 6, 8]) await expect(stop(page, step).getByTestId('stop-stars')).toBeVisible()
  await expect(page.getByTestId('stop-sprout')).toHaveCount(0)
  await expect(mascot(page)).toHaveAttribute('data-at', 'start')
  expect(await otherLook(wholeStage(page))).toEqual([])
})

test('the stops zigzag up the hill: 2–4 on the lowest terrace, 5–7 back across the middle, 8, 9 and the hut on top', async ({ page }) => {
  await openMap(page)
  const box = async (step: number) => stageBox(page, stop(page, step))
  const [two, three, four, five, six, seven, eight, nine, ten] = await Promise.all([2, 3, 4, 5, 6, 7, 8, 9, 10].map(box))
  expect(two!.cx).toBeLessThan(three!.cx)
  expect(three!.cx).toBeLessThan(four!.cx)
  expect(five!.cy).toBeLessThan(four!.cy)
  expect(five!.cx).toBeGreaterThan(six!.cx)
  expect(six!.cx).toBeGreaterThan(seven!.cx)
  expect(eight!.cy).toBeLessThan(seven!.cy)
  expect(eight!.cx).toBeLessThan(nine!.cx)
  expect(nine!.cx).toBeLessThan(ten!.cx)
})

test('tapping a stop hops น้องนก up the path to it, then opens its Step; Home goes back to the Map', async ({ page }) => {
  await openMap(page)
  await stop(page, 4).click()
  await expect(mascot(page)).toHaveAttribute('data-at', '4')
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/4$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/map$/)
  // She waits where the student was last.
  await expect(mascot(page)).toHaveAttribute('data-at', '4')
  await page.getByRole('link', { name: 'กลับหน้าปก' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/1$/)
})

test('done stops grow a sprout and Activity stops show their seed-stars from the Session, after a reload too', async ({ page }) => {
  await openMap(page)
  await stop(page, 2).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/2$/)
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/3$/)
  await page.goto('/lesson/mae-kok/8')
  for (const [a, b] of [
    ['ผัก', 'ตัก'],
    ['ดอก', 'บอก'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${a}(\\s|$)`) }).click()
    await page.getByRole('button', { name: new RegExp(`^${b}(\\s|$)`) }).click()
  }
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
  for (const _ of [0, 1]) {
    await page.goto('/lesson/mae-kok/map')
    await expect(stop(page, 2)).toHaveAttribute('data-done', 'true')
    await expect(stop(page, 2).getByTestId('stop-sprout')).toBeVisible()
    await expect(stop(page, 8)).toHaveAccessibleName(/ทำแล้ว ได้ 3 ดาว/)
    await expect(stop(page, 8).locator('[data-earned]')).toHaveCount(3)
    await expect(stop(page, 3)).toHaveAccessibleName(/ไปต่อที่นี่$/)
    await page.reload()
  }
})

for (const viewport of VIEWPORTS) {
  test(`at ${viewport.width}×${viewport.height} every stop shows, is big enough to tap and clears the corner controls`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openMap(page)
    const corners = await Promise.all(
      [page.getByRole('link', { name: 'กลับหน้าปก' }), page.getByRole('button', { name: /เพลง$/ }), page.getByRole('heading', { level: 1 }).locator('..')].map((c) =>
        stageBox(page, c),
      ),
    )
    for (const one of await stops(page).all()) {
      await expect(one).toBeInViewport({ ratio: 0.99 })
      if (viewport.height === 390) await expectTapTarget(one)
      const box = await stageBox(page, one)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
    // The art fills the window.
    const art = (await page.getByTestId('map-art').boundingBox())!
    expect(art.x).toBeLessThanOrEqual(0.5)
    expect(art.x + art.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
  })
}

test('keyboard and screen reader: each stop is a named link in the Map\'s navigation, Enter travels there', async ({ page }) => {
  await openMap(page)
  await expect(page.getByTestId('map-art')).toHaveAttribute('aria-hidden', 'true')
  await expect(mascot(page)).toHaveAttribute('aria-hidden', 'true')
  await stop(page, 3).focus()
  expect(parseFloat(await stop(page, 3).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/3$/)
})

test('under reduced motion น้องนก is simply there, the Step opens at once and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openMap(page)
  await expect.poll(() => running(page)).toBe(0)
  await stop(page, 9).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/9$/)
})

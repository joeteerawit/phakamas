import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 8, balance the carrying pole (#93). src/lessons/mae-kok.ts: ผัก ↔ ตัก, ดอก ↔ บอก.
const ORDER = ['ผัก', 'บอก', 'ดอก', 'ตัก']
const SLUGS: Record<string, string> = { ผัก: 'phak', บอก: 'bok', ดอก: 'dok', ตัก: 'tak' }

const bundles = (page: Page) => page.getByRole('list', { name: 'มัดผัก' }).getByRole('button')
const word = (page: Page, w: string) => page.getByRole('button', { name: new RegExp(`^${w}(\\s|$)`) })
const carrier = (page: Page) => page.getByTestId('carrier')
const signPairs = (page: Page) => page.getByTestId('sign-pair')

test('a child with a shoulder pole and two empty baskets stands above the four words on vegetable bundles', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('จับคู่ดูคำ')
  await expect(bundles(page)).toHaveText(ORDER)
  await expect(page.getByTestId('basket-word')).toHaveCount(0)
  await expect(carrier(page)).toHaveAttribute('data-tilt', '0')
  // The child's lane is above the words.
  const lane = await stageBox(page, carrier(page))
  for (const one of await bundles(page).all()) expect(lane.bottom).toBeLessThanOrEqual((await stageBox(page, one)).top)
  await expect(signPairs(page)).toHaveCount(0)
})

test('tapping a word puts it in the left basket and dips the pole; tapping it again takes it out', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await word(page, 'ผัก').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/phak.mp3'])
  await expect(word(page, 'ผัก')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('basket-left').getByTestId('basket-word')).toHaveText('ผัก')
  await expect(word(page, 'ผัก').getByTestId('bundle')).toHaveAttribute('data-empty', 'true')
  await expect(carrier(page)).toHaveAttribute('data-tilt', '-6')
  await word(page, 'ผัก').click()
  await expect(word(page, 'ผัก')).toHaveAttribute('aria-pressed', 'false')
  await expect(carrier(page)).toHaveAttribute('data-tilt', '0')
})

test('a rhyming pair balances the pole, plays the correct sound and is locked on the hut sign', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await word(page, 'ผัก').click()
  await word(page, 'ตัก').click()
  await expect(carrier(page)).toHaveAttribute('data-tilt', '0')
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/feedback/correct.mp3')
  await expect(signPairs(page)).toHaveCount(1)
  await expect(signPairs(page).first()).toHaveText(/ผัก.*ตัก/)
  for (const w of ['ผัก', 'ตัก']) {
    await expect(word(page, w)).toBeDisabled()
    await expect(word(page, w)).toContainText('จับคู่แล้ว')
  }
  await expect(page.getByRole('status').filter({ hasText: 'คล้องจอง' })).toContainText('ผัก คล้องจองกับ ตัก')
})

test('a wrong pair tips the pole and slides the second word back to its bundle, counting the try', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await word(page, 'ผัก').click()
  await word(page, 'ดอก').click()
  await expect(carrier(page)).toHaveAttribute('data-tilt', '14')
  await expect(page.getByTestId('basket-right').getByTestId('basket-word')).toHaveText('ดอก')
  await expect(page.getByRole('status').filter({ hasText: 'ยังไม่ใช่' })).toContainText('ผัก กับ ดอก ยังไม่ใช่คู่กัน')
  // ดอก goes back; ผัก stays in the left basket for another try.
  await expect(page.getByTestId('basket-right').getByTestId('basket-word')).toHaveCount(0)
  await expect(word(page, 'ดอก').getByTestId('bundle')).not.toHaveAttribute('data-empty')
  await expect(word(page, 'ผัก')).toHaveAttribute('aria-pressed', 'true')
  await expect(carrier(page)).toHaveAttribute('data-tilt', '-6')
  // Matching both now still scores 2/2: wrong tries are counted, not taken off.
  await word(page, 'ตัก').click()
  await word(page, 'ดอก').click()
  await word(page, 'บอก').click()
  await expect(page.getByText('หาบครบ 2 คู่ ได้ 2 คะแนน')).toBeVisible()
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
})

test('both pairs score 2/2 with the shared Activity scoring; leaving after one pair records it as finished', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await word(page, 'ดอก').click()
  await word(page, 'บอก').click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/9$/)
  await page.goto('/lesson/mae-kok/map')
  await expect(page.getByRole('link', { name: /^ขั้น 8 / })).toHaveAccessibleName(/ได้ 1 ดาว/)
  await page.goto('/lesson/mae-kok/8')
  for (const [a, b] of [
    ['ผัก', 'ตัก'],
    ['ดอก', 'บอก'],
  ] as const) {
    await word(page, a).click()
    await word(page, b).click()
  }
  await expect(page.getByTestId('celebration')).toContainText('ได้ 3 ดาว')
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await expect(signPairs(page)).toHaveCount(0)
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await word(page, 'ผัก').click()
  await word(page, 'ตัก').click()
  expect(await otherLook(wholeStage(page))).toEqual([])
})

for (const viewport of VIEWPORTS) {
  test(`Step 8 at ${viewport.width}×${viewport.height}: the terrace fills the window, nothing moving crosses a word, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 8, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-terrace', viewport)
    const restart = page.getByRole('button', { name: 'เริ่มใหม่' })
    if (viewport.height === 390) for (const target of [...(await bundles(page).all()), restart]) await expectTapTarget(target)
    await expectNothingMovingCrosses(page, [bundles(page), restart, page.getByTestId('hut-sign')])
    await word(page, 'ผัก').click()
    await word(page, 'บอก').click()
    const toast = await stageBox(page, page.getByRole('status').filter({ hasText: 'ยังไม่ใช่' }).locator('> div'))
    await waitUntilStill(page.getByTestId('basket-right'))
    for (const target of [carrier(page), page.getByTestId('hut-sign'), ...(await bundles(page).all())]) expect(overlaps(await stageBox(page, target), toast)).toBe(false)
    const corners = await Promise.all(['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [page.getByTestId('hut-sign'), restart, ...(await bundles(page).all())]) for (const c of corners) expect(overlaps(await stageBox(page, target), c)).toBe(false)
  })
}

test('keyboard and screen reader: each bundle is a named toggle button; Enter and Space fill the baskets', async ({ page }) => {
  await open(page, 8, {}, 'mae-kok')
  await expect(carrier(page)).toHaveAttribute('aria-hidden', 'true')
  await word(page, 'ดอก').focus()
  expect(parseFloat(await word(page, 'ดอก').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(word(page, 'ดอก')).toHaveAttribute('aria-pressed', 'true')
  await word(page, 'บอก').focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('list', { name: 'คู่ที่หาบแล้ว' }).getByRole('listitem')).toHaveCount(1)
  await expect.poll(() => audioLog(page)).toContain(`play:/assets/audio/vocabulary/${SLUGS['บอก']}.mp3`)
})

test('under reduced motion the pole never tips and the pair simply appears on the sign', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 8, {}, 'mae-kok')
  await bundles(page).first().waitFor()
  await expectSceneStill(page)
  await word(page, 'ผัก').click()
  await expect(carrier(page)).toHaveAttribute('data-tilt', '0')
  await word(page, 'ดอก').click()
  await expect(carrier(page)).toHaveAttribute('data-tilt', '0')
  await expect(page.getByTestId('basket-right').getByTestId('basket-word')).toHaveCount(0)
  await word(page, 'ตัก').click()
  await expect(signPairs(page)).toHaveCount(1, { timeout: 300 })
  await expect.poll(() => running(page)).toBe(0)
})

import { expect, type Locator, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'
import { audioLog, open } from './audioStub.js'

const playLink = (page: Page) => page.getByRole('link', { name: 'เริ่มเรียน' })
const mascot = (page: Page) => page.getByTestId('cover-mascot')
const sign = (page: Page) => page.getByTestId('cover-sign')

const transformOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).transform)

test('the cover is design page 1: separate background, sign and Mascot, live text, ▶ instead of Next', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await expect(page.getByTestId('stage')).toHaveCSS('background-image', /backgrounds\/cover\.webp/)
  await expect(sign(page).locator('img')).toHaveAttribute('src', /cover\/sign\.webp/)
  await expect(mascot(page).locator('img')).toHaveAttribute('src', /cover\/monkey\.webp/)
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('คำคล้องจองพาเพลิน')
  await expect(page.getByText('แม่ กง (ง)')).toBeVisible()
  await expect(page.getByText('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')).toBeVisible()
  await expect(page.getByRole('link', { name: 'ถัดไป' })).toHaveCount(0)

  await playLink(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
})

test('the first ▶ of a Session plays the teacher intro and goes to Step 2; resuming does not', async ({ page }) => {
  const intro = 'play:/assets/audio/intro.mp3'
  await open(page, 1)
  await playLink(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
  await expect.poll(() => audioLog(page)).toEqual([intro])
  // Still playing on Step 2: leaving the cover does not cut the intro off.
  await expect(page.getByRole('button', { name: /^ลิง / })).toBeVisible()
  expect(await audioLog(page)).not.toContain('pause:/assets/audio/intro.mp3')

  await page.getByRole('link', { name: 'ย้อนกลับ' }).click()
  await page.getByRole('link', { name: 'เรียนต่อ (ขั้น 2)' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
  await page.waitForTimeout(300)
  expect((await audioLog(page)).filter((entry) => entry === intro)).toHaveLength(1)
})

test('the Mascot swings, the sign drops in and ▶ pulses', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  const before = await Promise.all([transformOf(mascot(page)), transformOf(sign(page)), transformOf(playLink(page).locator('img'))])
  await page.waitForTimeout(700)
  const after = await Promise.all([transformOf(mascot(page)), transformOf(sign(page)), transformOf(playLink(page).locator('img'))])
  expect(after[0], 'Mascot swings').not.toBe(before[0])
  expect(after[1], 'sign drops in').not.toBe(before[1])
  expect(after[2], '▶ pulses').not.toBe(before[2])
})

test('reduced motion: the cover is static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/lesson/mae-kong/1')
  for (const target of [mascot(page), sign(page), playLink(page).locator('img')]) {
    const before = await transformOf(target)
    await page.waitForTimeout(400)
    expect(await transformOf(target)).toBe(before)
    expect(before).toBe('none')
  }
})

test('cover buttons are at least 44px on a 390px-tall landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/lesson/mae-kong/1')
  for (const target of [playLink(page), page.getByRole('button', { name: 'ปิดเพลง' })]) {
    await expectTapTarget(target)
  }
})

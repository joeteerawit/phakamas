import { expect, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'

const stage = (page: Page) => page.getByTestId('stage')
const rotateOverlay = (page: Page) => page.getByRole('dialog', { name: 'กรุณาหมุนจอเป็นแนวนอน' })

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`every Step fits the 1920×1080 stage at ${viewport.width}×${viewport.height} with no scrollbars`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    for (let step = 1; step <= 10; step++) {
      await page.goto(`/lesson/mae-kong/${step}`)
      const box = (await stage(page).boundingBox())!
      expect(box.width).toBeCloseTo(1920 * scale, 0)
      expect(box.height).toBeCloseTo(1080 * scale, 0)
      expect(box.x).toBeCloseTo((viewport.width - box.width) / 2, 0)
      expect(box.y).toBeCloseTo((viewport.height - box.height) / 2, 0)
      const overflow = await page.evaluate(() => ({
        x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      }))
      expect(overflow, `Step ${step} scrolls`).toEqual({ x: 0, y: 0 })
      const title = page.getByRole('heading', { level: 1 })
      if (step > 1) expect(await title.evaluate((h) => h.scrollWidth <= h.clientWidth), `Step ${step} title is cut off`).toBe(true)
      await expect(rotateOverlay(page)).toHaveCount(0)
    }
  })
}

test('chrome buttons are at least 44px on a 390px-tall landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/lesson/mae-kong/5')
  for (const name of ['กลับไปขั้นแรก', 'ย้อนกลับ', 'ถัดไป']) await expectTapTarget(page.getByRole('link', { name }))
  await expectTapTarget(page.getByRole('button', { name: 'ปิดเสียง' }))
})

test('Home keeps Session progress: the cover offers to resume', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await page.getByRole('link', { name: 'ถัดไป' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/4$/)

  await page.getByRole('link', { name: 'กลับไปขั้นแรก' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/1$/)
  await expect(page.getByRole('link', { name: 'เรียนต่อ (ขั้น 4)' })).toBeVisible()
})

test('a portrait phone shows the rotate overlay and blocks the stage; landscape hides it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/lesson/mae-kong/2')
  await expect(rotateOverlay(page)).toBeVisible()
  await expect(rotateOverlay(page)).toContainText('กรุณาหมุนจอเป็นแนวนอน')

  // Nothing behind is reachable: not by pointer (the overlay is on top) and not by keyboard/AT (inert).
  const next = page.getByRole('link', { name: 'ถัดไป' })
  const box = (await next.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)

  await page.setViewportSize({ width: 844, height: 390 })
  await expect(rotateOverlay(page)).toHaveCount(0)
  await next.click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/3$/)
})

test('the rotate overlay phone spins, and stays still with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/lesson/mae-kong/1')
  const phone = page.getByTestId('rotate-phone')
  await expect(phone).toHaveCSS('animation-name', 'rotate-phone')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(phone).toHaveCSS('animation-name', 'none')
})

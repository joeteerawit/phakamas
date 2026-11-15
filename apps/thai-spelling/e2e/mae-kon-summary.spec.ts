import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage, wordButton } from './maeKon.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 10, lotus at dusk (#109): one lotus bud per Star the Lesson can give.
const lotuses = (page: Page) => page.getByTestId('lotus')
const open_ = (page: Page) => page.locator('[data-testid="lotus"][data-open]')
const row = (page: Page, title: string) => page.getByRole('list', { name: 'ดาวแต่ละกิจกรรม' }).getByRole('listitem').filter({ hasText: title })
const again = (page: Page) => page.getByRole('button', { name: 'เรียนอีกครั้ง' })

/** Step 8 with both pairs: 3 Stars. */
async function earnThree(page: Page) {
  await open(page, 8, {}, 'mae-kon')
  for (const [a, b] of [
    ['จาน', 'หวาน'],
    ['ช้อน', 'ร้อน'],
  ] as const) {
    await wordButton(page, a).click()
    await wordButton(page, b).click()
  }
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
}

test('the canal at dusk holds nine lotus buds, all closed before any Star', async ({ page }) => {
  await open(page, 10, {}, 'mae-kon')
  await expect(lotuses(page)).toHaveCount(9)
  await expect(open_(page)).toHaveCount(0)
  await expect(page.getByTestId('lotus-bud')).toHaveCount(9)
  await expect(page.getByTestId('lotus-pond')).toHaveAccessibleName('บัวบาน 0 จาก 9 ดอก')
  await expect(page.getByText(/^ได้ 0\/9 ดาว/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'เก่งมาก!' })).toBeVisible()
  for (const title of ['แม่กนอยู่ไหน?', 'กล่องคำแม่กน', 'จับคู่ดูคำ']) await expect(row(page, title)).toContainText('ยังไม่ได้ทำ')
})

test("one lotus opens for each Star the Lesson gave, left to right: the open lotuses are exactly the Lesson's Stars, and survive a reload", async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kon/10')
  for (const reload of [false, true]) {
    if (reload) await page.reload()
    await expect(open_(page)).toHaveCount(3)
    for (let i = 0; i < 9; i++) {
      if (i < 3) await expect(lotuses(page).nth(i)).toHaveAttribute('data-open', 'true')
      else await expect(lotuses(page).nth(i)).not.toHaveAttribute('data-open')
    }
    await expect(page.getByTestId('lotus-bloom')).toHaveCount(3)
    await expect(page.getByText(/^ได้ 3\/9 ดาว/)).toBeVisible()
    await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
    await expect(row(page, 'จับคู่ดูคำ')).toContainText('2/2')
    await expect(row(page, 'จับคู่ดูคำ').locator('[data-earned]')).toHaveCount(3)
  }
})

test('the review words list the six words and the two rhyming pairs', async ({ page }) => {
  await open(page, 10, {}, 'mae-kon')
  const review = page.getByRole('region', { name: 'ทบทวนคำ' })
  await expect(review.getByRole('list', { name: 'คำในบทเรียน' }).getByRole('listitem')).toHaveText(['จาน', 'ช้อน', 'ร้าน', 'กิน', 'คน', 'บ้าน'])
  await expect(review.getByRole('list', { name: 'คู่คำคล้องจอง' }).getByRole('listitem')).toHaveText(['จาน – หวาน', 'ช้อน – ร้อน'])
})

test('an Activity not done yet is a ไปทำ row back to its Step', async ({ page }) => {
  await open(page, 10, {}, 'mae-kon')
  await page.getByRole('link', { name: 'ไปทำ กล่องคำแม่กน' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/6$/)
})

test('เรียนอีกครั้ง asks first; cancel keeps the Stars, confirm clears the Session and starts again at Step 2', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kon/10')
  await again(page).click()
  const dialog = page.getByRole('dialog', { name: /ล้างความคืบหน้า/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'ยกเลิก' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(open_(page)).toHaveCount(3)
  await again(page).click()
  await dialog.getByRole('button', { name: 'ล้างและเริ่มใหม่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/2$/)
  await page.goto('/lesson/mae-kon/10')
  await expect(open_(page)).toHaveCount(0)
})

test('the summary uses only the แม่กน Kit, its confirm too: nothing from another Lesson', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kon/10')
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(again(page)).toHaveClass(/plank-button/)
  for (const one of await row(page, '').all()) await expect(one.locator('.bamboo-tray')).toHaveCount(1)
  await again(page).click()
  for (const name of ['ยกเลิก', 'ล้างและเริ่มใหม่']) await expect(page.getByRole('dialog').getByRole('button', { name })).toHaveClass(/plank-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 10 at ${viewport.width}×${viewport.height}: the canal at dusk fills the window, the summary stands clear of the chrome, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 10, {}, 'mae-kon')
    await expectSceneFills(page, 'kon-dusk', viewport)
    const targets = [again(page), ...(await page.getByRole('link', { name: /^ไปทำ / }).all())]
    expect(targets).toHaveLength(4)
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    const parts = [
      page.getByRole('heading', { name: 'เก่งมาก!' }),
      page.getByText(/^ได้ 0\/9 ดาว/),
      page.getByRole('list', { name: 'ดาวแต่ละกิจกรรม' }),
      page.getByRole('region', { name: 'ทบทวนคำ' }),
      page.getByTestId('lotus-pond'),
      page.getByTestId('summary-mascot'),
      again(page),
    ]
    const boxes = await Promise.all(parts.map((p) => stageBox(page, p)))
    const chrome = await Promise.all(
      [page.getByTestId('star-counter'), page.getByText('ขั้น 10/10'), ...['กลับไปแผนที่', 'ย้อนกลับ', 'กลับหน้าแรก'].map((name) => page.getByRole('link', { name }))].map((c) => stageBox(page, c)),
    )
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) expect(overlaps(a, b), `part ${i}`).toBe(false)
      for (const c of chrome) expect(overlaps(a, c), `part ${i}`).toBe(false)
    }
  })
}

test('keyboard and screen reader: the lotus pond is named by its Stars, every row and button is reachable', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kon/10')
  await expect(page.getByTestId('lotus-pond')).toHaveAccessibleName('บัวบาน 3 จาก 9 ดอก')
  await expect(row(page, 'จับคู่ดูคำ')).toContainText('3 ดาว')
  const link = page.getByRole('link', { name: 'ไปทำ แม่กนอยู่ไหน?' })
  await link.focus()
  expect(parseFloat(await link.evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await again(page).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('under reduced motion the earned lotuses are simply open and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await earnThree(page)
  await page.goto('/lesson/mae-kon/10')
  await expect(open_(page)).toHaveCount(3)
  await expectSceneStill(page)
  await expect(page.getByTestId('lotus-bloom').first()).toHaveCSS('opacity', '1')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

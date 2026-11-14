import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 10, น้องกบ's hut after the rain (#81): one rainbow band per Star the Lesson can give.
const bands = (page: Page) => page.getByTestId('rainbow-band')
const lit = (page: Page) => page.locator('[data-testid="rainbow-band"][data-earned]')
const pocket = (page: Page, title: string) => page.getByRole('list', { name: 'ดาวแต่ละกิจกรรม' }).getByRole('listitem').filter({ hasText: title })
const again = (page: Page) => page.getByRole('button', { name: 'เรียนอีกครั้ง' })

/** Step 8 with both pairs: 3 Stars. */
async function earnThree(page: Page) {
  await open(page, 8, {}, 'mae-kop')
  for (const [a, b] of [
    ['กบ', 'จบ'],
    ['จับ', 'รับ'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${a}(\\s|$)`) }).click()
    await page.getByRole('button', { name: new RegExp(`^${b}(\\s|$)`) }).click()
  }
  await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
}

test('the rainbow has nine bands, all pale outlines before any Star', async ({ page }) => {
  await open(page, 10, {}, 'mae-kop')
  await expect(bands(page)).toHaveCount(9)
  await expect(lit(page)).toHaveCount(0)
  await expect(page.getByTestId('rainbow')).toHaveAccessibleName('รุ้ง 0 จาก 9 สี')
  await expect(page.getByText(/^ได้ 0\/9 ดาว/)).toBeVisible()
  for (const title of ['แม่กบอยู่ไหน?', 'กล่องคำแม่กบ', 'จับคู่ดูคำ']) await expect(pocket(page, title)).toContainText('ยังไม่ได้ทำ')
})

test('each Star earned fills one band, from the outer band in: the lit bands are exactly the Lesson\'s Stars, and survive a reload', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kop/10')
  for (const reload of [false, true]) {
    if (reload) await page.reload()
    await expect(lit(page)).toHaveCount(3)
    for (let i = 0; i < 9; i++) {
      if (i < 3) await expect(bands(page).nth(i)).toHaveAttribute('data-earned', 'true')
      else await expect(bands(page).nth(i)).not.toHaveAttribute('data-earned')
    }
    await expect(page.getByText(/^ได้ 3\/9 ดาว/)).toBeVisible()
    await expect(page.getByTestId('star-counter')).toHaveText(/3\/9/)
    await expect(pocket(page, 'จับคู่ดูคำ')).toContainText('2/2')
    await expect(pocket(page, 'จับคู่ดูคำ').locator('[data-earned]')).toHaveCount(3)
  }
})

test('an Activity not done yet is a ไปทำ pocket back to its Step', async ({ page }) => {
  await open(page, 10, {}, 'mae-kop')
  await page.getByRole('link', { name: 'ไปทำ กล่องคำแม่กบ' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/6$/)
})

test('เรียนอีกครั้ง asks first; cancel keeps the Stars, confirm clears the Session and starts again at Step 2', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kop/10')
  await again(page).click()
  const dialog = page.getByRole('dialog', { name: /ล้างความคืบหน้า/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'ยกเลิก' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(lit(page)).toHaveCount(3)
  await again(page).click()
  await dialog.getByRole('button', { name: 'ล้างและเริ่มใหม่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/2$/)
  await page.goto('/lesson/mae-kop/10')
  await expect(lit(page)).toHaveCount(0)
})

test('the summary uses only the แม่กบ Kit, its confirm too: nothing from แม่กง or แม่กม', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kop/10')
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(again(page)).toHaveClass(/vinyl-button/)
  await again(page).click()
  for (const name of ['ยกเลิก', 'ล้างและเริ่มใหม่']) await expect(page.getByRole('dialog').getByRole('button', { name })).toHaveClass(/vinyl-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 10 at ${viewport.width}×${viewport.height}: the pond after the rain fills the window, the summary stands clear of the chrome, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 10, {}, 'mae-kop')
    await expectSceneFills(page, 'kop-rainbow', viewport)
    const targets = [again(page), ...(await page.getByRole('link', { name: /^ไปทำ / }).all())]
    expect(targets).toHaveLength(4)
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    const parts = [page.getByRole('heading', { name: 'เก่งมาก!' }), page.getByText(/^ได้ 0\/9 ดาว/), page.getByRole('list', { name: 'ดาวแต่ละกิจกรรม' }), again(page)]
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

test('keyboard and screen reader: the rainbow is named by its Stars, every pocket and button is reachable', async ({ page }) => {
  await earnThree(page)
  await page.goto('/lesson/mae-kop/10')
  await expect(page.getByTestId('rainbow')).toHaveAccessibleName('รุ้ง 3 จาก 9 สี')
  await expect(pocket(page, 'จับคู่ดูคำ')).toContainText('3 ดาว')
  await page.getByRole('link', { name: 'ไปทำ แม่กบอยู่ไหน?' }).focus()
  expect(parseFloat(await page.getByRole('link', { name: 'ไปทำ แม่กบอยู่ไหน?' }).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await again(page).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('under reduced motion the earned bands simply stand filled and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await earnThree(page)
  await page.goto('/lesson/mae-kop/10')
  await expect(lit(page)).toHaveCount(3)
  await expectSceneStill(page)
  await expect(page.getByTestId('band-colour')).toHaveCount(3)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'

const MAE_KONG = ['ลิง', 'ช้าง', 'รัง', 'กางเกง']

const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const backLink = (page: Page) => page.getByRole('link', { name: 'ย้อนกลับ' })
const homeLink = (page: Page) => page.getByRole('link', { name: 'กลับไปหน้าปก' })
const dialog = (page: Page) => page.getByRole('dialog')
const choice = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const scoreRow = (page: Page, title: string) => page.getByRole('listitem').filter({ hasText: title })
const activities = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null')?.state.session?.activities ?? {})

async function selectAllCorrect(page: Page) {
  for (const word of MAE_KONG) await choice(page, word).click()
  await check(page).click()
}

test('Back and Home leave an unchecked Activity without marking it skipped', async ({ page }) => {
  await open(page, 5)
  await backLink(page).click()
  await expect(page).toHaveURL(/\/4$/)
  await page.goto('/lesson/mae-kong/6')
  await homeLink(page).click()
  await expect(page).toHaveURL(/\/1$/)
  expect(await activities(page)).toEqual({})
})

test('TC-019: Home with unchecked answers asks first; staying keeps the work', async ({ page }) => {
  await open(page, 5)
  await choice(page, 'ลิง').click()
  await homeLink(page).click()
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page)).toContainText('ยังไม่ได้ตรวจคำตอบ')

  await dialog(page).getByRole('button', { name: 'ทำต่อ' }).click()
  await expect(dialog(page)).toBeHidden()
  await expect(page).toHaveURL(/\/5$/)
  await expect(choice(page, 'ลิง')).toHaveAttribute('aria-pressed', 'true')

  await homeLink(page).click()
  await dialog(page).getByRole('button', { name: 'ออกจากหน้านี้' }).click()
  await expect(page).toHaveURL(/\/1$/)
  expect(await activities(page)).toEqual({})
})

test('Home leaves straight away once the answers are checked', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  await homeLink(page).click()
  await expect(page).toHaveURL(/\/1$/)
  await expect(dialog(page)).toHaveCount(0)
})

test('Step 10 reviews key words and rhyme pairs', async ({ page }) => {
  await open(page, 10)
  const words = page.getByRole('list', { name: 'คำสำคัญ' }).getByRole('listitem')
  await expect(words).toHaveText(['ลิง', 'ช้าง', 'รัง', 'กางเกง', 'ดัง', 'ค้างคาว'])
  const pairs = page.getByRole('list', { name: 'คู่คล้องจอง' }).getByRole('listitem')
  await expect(pairs).toHaveText(['ดัง – ฟัง', 'รัง – นั่ง', 'กาง – วาง'])
})

test('TC-017: Step 10 shows each bestScore, ยังไม่ได้ทำ for the rest, total /16, and survives refresh', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  await nextLink(page).click() // Step 6
  await nextLink(page).click() // skip Step 6
  await page.goto('/lesson/mae-kong/10')

  await expect(scoreRow(page, 'เลือกคำในมาตรา')).toContainText('7/7')
  await expect(scoreRow(page, 'เติมคำตรงภาพ')).toContainText('ยังไม่ได้ทำ')
  await expect(scoreRow(page, 'เกมจับคู่เสียง')).toContainText('ยังไม่ได้ทำ')
  await expect(page.getByText('คะแนนรวม 7/16')).toBeVisible()

  await page.reload()
  await expect(scoreRow(page, 'เลือกคำในมาตรา')).toContainText('7/7')
  await expect(page.getByText('คะแนนรวม 7/16')).toBeVisible()

  await scoreRow(page, 'เติมคำตรงภาพ').getByRole('link', { name: /ไปทำ/ }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/6$/)
})

test('TC-020: เริ่มใหม่ on one Activity leaves the other scores intact', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  await page.goto('/lesson/mae-kong/8')
  await page.getByRole('button', { name: /^ดัง/ }).click()
  await page.getByRole('button', { name: /^ฟัง/ }).click()
  await page.getByRole('button', { name: 'เริ่มใหม่' }).click()
  await page.goto('/lesson/mae-kong/10')
  await expect(scoreRow(page, 'เลือกคำในมาตรา')).toContainText('7/7')
})

test('เรียนอีกครั้ง confirms, then clears the Session and starts from Step 2', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  await page.goto('/lesson/mae-kong/10')

  await page.getByRole('button', { name: 'เรียนอีกครั้ง' }).click()
  await dialog(page).getByRole('button', { name: 'ยกเลิก' }).click()
  await expect(page).toHaveURL(/\/10$/)
  await expect(scoreRow(page, 'เลือกคำในมาตรา')).toContainText('7/7')

  await page.getByRole('button', { name: 'เรียนอีกครั้ง' }).click()
  await dialog(page).getByRole('button', { name: 'ล้างและเริ่มใหม่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
  expect(await activities(page)).toEqual({})
})

test('Step 10 has no Reading Assessment and fits at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await open(page, 10)
  await expect(page.getByText(/ประเมิน|ผ่าน/).and(page.getByRole('button'))).toHaveCount(0)
  for (const target of [page.getByRole('button', { name: 'เรียนอีกครั้ง' }), page.getByRole('link', { name: /ไปทำ/ }).first()]) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)
})

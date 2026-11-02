import { expect, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'
import { open } from './audioStub.js'

const MAE_KONG = ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง']

const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const backLink = (page: Page) => page.getByRole('link', { name: 'ย้อนกลับ' })
const homeLink = (page: Page) => page.getByRole('link', { name: 'กลับไปขั้นแรก' })
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

test('TC-019: Home with unchecked answers clears the Session without asking', async ({ page }) => {
  await open(page, 5)
  await choice(page, 'ลิง').click()
  await homeLink(page).click()
  await expect(page).toHaveURL(/\/1$/)
  await expect(dialog(page)).toHaveCount(0)
  expect(await activities(page)).toEqual({})
})

test('Home clears checked scores too', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  expect(await activities(page)).toHaveProperty('wordSelection')
  await homeLink(page).click()
  await expect(page).toHaveURL(/\/1$/)
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'เริ่มเรียน' })).toBeVisible()
  expect(await activities(page)).toEqual({})

  await page.goto('/lesson/mae-kong/10')
  await expect(scoreRow(page, 'แม่กงอยู่ไหน?')).toContainText('ยังไม่ได้ทำ')
})

test('TC-017: Step 10 shows each bestScore and Stars, ยังไม่ได้ทำ for the rest, total Stars /9, and survives refresh', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  await nextLink(page).click() // Step 6
  await nextLink(page).click() // skip Step 6
  await page.goto('/lesson/mae-kong/10')

  await expect(scoreRow(page, 'แม่กงอยู่ไหน?')).toContainText('12/12')
  await expect(scoreRow(page, 'กล่องคำแม่กง')).toContainText('ยังไม่ได้ทำ')
  await expect(scoreRow(page, 'จับคู่ดูคำ')).toContainText('ยังไม่ได้ทำ')
  await expect(page.getByText(/^ได้ 3\/9 ดาว/)).toBeVisible()

  await page.reload()
  await expect(scoreRow(page, 'แม่กงอยู่ไหน?')).toContainText('12/12')
  await expect(page.getByText(/^ได้ 3\/9 ดาว/)).toBeVisible()

  await scoreRow(page, 'กล่องคำแม่กง').getByRole('link', { name: /ไปทำ/ }).click()
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
  await expect(scoreRow(page, 'แม่กงอยู่ไหน?')).toContainText('12/12')
})

test('เรียนอีกครั้ง confirms, then clears the Session and starts from Step 2', async ({ page }) => {
  await open(page, 5)
  await selectAllCorrect(page)
  await page.goto('/lesson/mae-kong/10')

  await page.getByRole('button', { name: 'เรียนอีกครั้ง' }).click()
  await dialog(page).getByRole('button', { name: 'ยกเลิก' }).click()
  await expect(page).toHaveURL(/\/10$/)
  await expect(scoreRow(page, 'แม่กงอยู่ไหน?')).toContainText('12/12')

  await page.getByRole('button', { name: 'เรียนอีกครั้ง' }).click()
  await dialog(page).getByRole('button', { name: 'ล้างและเริ่มใหม่' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
  expect(await activities(page)).toEqual({})
})

test('Step 10 has no Reading Assessment and fits a 390px-tall phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await open(page, 10)
  await expect(page.getByText(/ประเมิน|ผ่าน/).and(page.getByRole('button'))).toHaveCount(0)
  for (const target of [page.getByRole('button', { name: 'เรียนอีกครั้ง' }), page.getByRole('link', { name: /ไปทำ/ }).first()]) {
    await expectTapTarget(target)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)
})

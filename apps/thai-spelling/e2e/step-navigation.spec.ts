import { expect, type Page, test } from '@playwright/test'

const stepUrl = (step: number) => new RegExp(`/lesson/mae-kong/${step}$`)

const stepBadge = (page: Page) => page.getByText(/^ขั้น \d+\/10$/)
const backLink = (page: Page) => page.getByRole('link', { name: 'ย้อนกลับ' })
const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const backToCoverLink = (page: Page) => page.getByRole('link', { name: 'กลับหน้าแรก', exact: true })

async function expectStep(page: Page, step: number, title: string) {
  await expect(page).toHaveURL(stepUrl(step))
  await expect(stepBadge(page)).toHaveText(`ขั้น ${step}/10`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
}

test('/ redirects to Step 1, the cover', async ({ page }) => {
  await page.goto('/')
  await expectStep(page, 1, 'หน้าปก')
  await expect(page.getByText('แม่ กง (ง)')).toBeVisible()
  await expect(page.getByText('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')).toBeVisible()
})

test('Step 1 has no Back, and เริ่มเรียน goes to Step 2', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await expectStep(page, 1, 'หน้าปก')
  await expect(backLink(page)).toHaveCount(0)

  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expectStep(page, 2, 'ดูภาพเรียนรู้คำ')
})

test('Next and Back move between Steps and update ขั้น X/10', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await expect(nextLink(page)).toHaveCount(0)

  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expectStep(page, 2, 'ดูภาพเรียนรู้คำ')
  await nextLink(page).click()
  await expectStep(page, 3, 'ฟังแล้วอ่านตาม')

  await backLink(page).click()
  await expectStep(page, 2, 'ดูภาพเรียนรู้คำ')
  await backLink(page).click()
  await expectStep(page, 1, 'หน้าปก')
})

test('Step 10 shows กลับหน้าแรก instead of Next, returning to Step 1', async ({ page }) => {
  await page.goto('/lesson/mae-kong/9')
  await nextLink(page).click()
  await expectStep(page, 10, 'สรุปและประเมิน')

  await expect(nextLink(page)).toHaveCount(0)
  await expect(backLink(page)).toBeVisible()

  await backToCoverLink(page).click()
  await expectStep(page, 1, 'หน้าปก')
})

test('Home button returns to Step 1', async ({ page }) => {
  await page.goto('/lesson/mae-kong/5')
  await page.getByRole('link', { name: 'กลับไปขั้นแรก' }).click()
  await expectStep(page, 1, 'หน้าปก')
})

for (const path of ['/lesson/mae-kong/99', '/lesson/mae-kong/0', '/lesson/mae-kong/abc', '/lesson/unknown/2']) {
  test(`invalid URL ${path} lands on Step 1`, async ({ page }) => {
    await page.goto(path)
    await expectStep(page, 1, 'หน้าปก')
  })
}


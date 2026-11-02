import { expect, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'

const stepBadge = (page: Page) => page.getByText(/^ขั้น \d+\/10$/)
const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const resumeLink = (page: Page) => page.getByRole('link', { name: /^เรียนต่อ/ })
const restartButton = (page: Page) => page.getByRole('button', { name: 'เริ่มใหม่' })
const startLink = (page: Page) => page.getByRole('link', { name: 'เริ่มเรียน' })
// Home clears the Session, so reach the cover by URL to see the resume offer.
async function gotoCoverFrom(page: Page, step: number) {
  await expect(stepBadge(page)).toHaveText(`ขั้น ${step}/10`)
  await page.goto('/lesson/mae-kong/1')
}

test('a fresh browser shows only เริ่มเรียน on the cover', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await expect(startLink(page)).toBeVisible()
  await expect(resumeLink(page)).toHaveCount(0)
  await expect(restartButton(page)).toHaveCount(0)
})

test('the Session survives refresh and เรียนต่อ returns to the last Step', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await startLink(page).click()
  await nextLink(page).click()
  await nextLink(page).click()
  await expect(stepBadge(page)).toHaveText('ขั้น 4/10')

  await page.reload()
  await expect(stepBadge(page)).toHaveText('ขั้น 4/10')

  await gotoCoverFrom(page, 4)
  await expect(startLink(page)).toHaveCount(0)
  await resumeLink(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/4$/)
  await expect(stepBadge(page)).toHaveText('ขั้น 4/10')
})

test('cover resume label names the Step', async ({ page }) => {
  await page.goto('/lesson/mae-kong/6')
  await gotoCoverFrom(page, 6)
  await expect(resumeLink(page)).toHaveText('เรียนต่อ (ขั้น 6)')
})

test('เริ่มใหม่ clears the Session and starts from Step 2', async ({ page }) => {
  await page.goto('/lesson/mae-kong/7')
  await gotoCoverFrom(page, 7)
  await restartButton(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null'))
  expect(stored.state.session).toMatchObject({ currentStep: 2, visitedSteps: [2] })
})

test('browser Back keeps the Session intact', async ({ page }) => {
  await page.goto('/lesson/mae-kong/1')
  await startLink(page).click()
  await nextLink(page).click()
  await nextLink(page).click()
  await expect(stepBadge(page)).toHaveText('ขั้น 4/10')

  await page.goBack()
  await expect(stepBadge(page)).toHaveText('ขั้น 3/10')
  await page.goBack()
  await page.goBack()
  await expect(stepBadge(page)).toHaveText('ขั้น 1/10')

  await expect(resumeLink(page)).toHaveText('เรียนต่อ (ขั้น 2)')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null'))
  expect(stored.state.session.visitedSteps).toEqual([1, 2, 3, 4])
})

test('resume buttons fit at 360px with ≥44px targets and no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 })
  await page.goto('/lesson/mae-kong/5')
  await gotoCoverFrom(page, 5)
  for (const target of [resumeLink(page), restartButton(page)]) await expectTapTarget(target)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)
})

test('ถัดไป completes non-Activity Steps; checking an Activity completes its Step', async ({ page }) => {
  await page.goto('/lesson/mae-kong/3')
  await nextLink(page).click()
  await nextLink(page).click()
  await expect(stepBadge(page)).toHaveText('ขั้น 5/10')
  await page.getByRole('button', { name: /^ลิง/ }).click()
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null'))
  expect(stored.state.session.activities.wordSelection).toMatchObject({ status: 'in_progress' })
  expect(stored.state.session.completedSteps).toEqual([3, 4])

  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('thai-spelling:lesson-session') ?? 'null'))
  expect(stored.state.session.completedSteps).toEqual([3, 4, 5])
})

import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'

const MAE_KONG = ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง']
const FILLING = ['ลิง', 'ช้าง', 'ดัง', 'รัง', 'ค่าง', 'ผึ้ง']

const counter = (page: Page) => page.getByTestId('star-counter')
const celebration = (page: Page) => page.getByTestId('celebration')
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })

test('completing each Activity celebrates and fills the Star counter', async ({ page }) => {
  await open(page, 5)
  await expect(counter(page)).toContainText('0/9')

  // Step 5: 8 of 12 right (the 4 distractors left unselected, 4 แม่กง words missed) = 67 % → 2 Stars.
  for (const word of MAE_KONG.slice(0, 4)) await page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) }).click()
  await check(page).click()
  await expect(celebration(page)).toContainText('ได้ 2 ดาว')
  await expect(celebration(page).locator('img')).toBeVisible()
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/feedback/keng-mak.mp3')
  await expect(counter(page)).toContainText('2/9')
  await celebration(page).click()
  await expect(celebration(page)).toHaveCount(0)

  // Step 6: full marks → 3 Stars.
  await page.goto('/lesson/mae-kong/6')
  const bank = page.getByRole('group', { name: 'คลังคำ' })
  for (const [i, word] of FILLING.entries()) {
    await bank.getByRole('button', { name: word, exact: true }).click()
    await page.getByRole('button', { name: new RegExp(`^ช่องที่ ${i + 1}:`) }).click()
  }
  await check(page).click()
  await expect(celebration(page)).toContainText('ได้ 3 ดาว')
  await expect(counter(page)).toContainText('5/9')
  // Dismisses itself after 2.5 s.
  await expect(celebration(page)).toHaveCount(0, { timeout: 4000 })

  // Step 8: both pairs → 3 Stars.
  await page.goto('/lesson/mae-kong/8')
  const buzzer = (text: string) => page.getByRole('button', { name: new RegExp(`^${text}`) })
  for (const [a, b] of [['ดัง', 'ฟัง'], ['มอง', 'ร้อง']] as const) {
    await buzzer(a).click()
    await buzzer(b).click()
  }
  await expect(celebration(page)).toContainText('ได้ 3 ดาว')
  await expect(counter(page)).toContainText('8/9')
})

test('reduced motion: the celebration shows its Stars without confetti', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 6)
  await check(page).click()
  await expect(celebration(page)).toContainText('ได้ 1 ดาว')
  await expect(celebration(page).getByTestId('confetti')).toHaveCount(0)
})

test('Step 10 shows each Activity\'s Stars and the total out of 9', async ({ page }) => {
  await open(page, 6)
  await check(page).click() // 0/6 checked → 1 Star
  await page.goto('/lesson/mae-kong/10')
  await expect(page.getByText('เก่งมาก!')).toBeVisible()
  await expect(page.getByText(/^ได้ 1\/9 ดาว/)).toBeVisible()
  const rows = page.getByRole('list', { name: 'ดาวแต่ละกิจกรรม' }).getByRole('listitem')
  await expect(rows.filter({ hasText: 'กล่องคำแม่กง' })).toContainText('1 ดาว')
  await expect(rows.filter({ hasText: 'แม่กงอยู่ไหน?' })).toContainText('ยังไม่ได้ทำ')
  await expect(counter(page)).toContainText('1/9')
})

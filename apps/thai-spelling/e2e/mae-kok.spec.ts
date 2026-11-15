import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'

// src/lessons/mae-kok.ts: the six words in picture order, and Step 5's Target Words.
const WORDS = ['นก', 'ผัก', 'ดอก', 'เด็ก', 'ปาก', 'แบก']
const MAE_KOK = [...WORDS, 'หมวก', 'โลก']
const PAIRS = [
  ['ผัก', 'ตัก'],
  ['ดอก', 'บอก'],
] as const

const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const wordButton = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const bankWord = (page: Page, word: string) =>
  page.getByRole('group', { name: 'คลังคำ' }).getByRole('button', { name: word, exact: true })
const slot = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ช่องที่ ${n}:`) })
const scoreRow = (page: Page, title: string) => page.getByRole('listitem').filter({ hasText: title })

async function expectStep(page: Page, step: number, title: string) {
  await expect(page).toHaveURL(new RegExp(`/lesson/mae-kok/${step}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
}

test('a student plays แม่กก through all 10 Steps to the summary with all 9 Stars', async ({ page }) => {
  await open(page, 1, {}, 'mae-kok')
  await expectStep(page, 1, 'หน้าปก')
  await expect(page.getByText('คำแม่กกเที่ยวสวนผักบนดอย')).toBeVisible()
  await expect(page.getByText('แม่ กก (ก ข ค ฆ)')).toBeVisible()

  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expectStep(page, 2, 'ดูภาพเรียนรู้คำ')
  for (const word of WORDS) await wordButton(page, word).click()

  await nextLink(page).click()
  await expectStep(page, 3, 'ฟังแล้วอ่านตาม')
  await nextLink(page).click()
  await expectStep(page, 4, 'สังเกตตัวสะกด')

  await nextLink(page).click()
  await expectStep(page, 5, 'แม่กกอยู่ไหน?')
  for (const word of MAE_KOK) await wordButton(page, word).click()
  await check(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'คะแนน' })).toContainText('12/12')

  await nextLink(page).click()
  await expectStep(page, 6, 'กล่องคำแม่กก')
  for (const [i, word] of WORDS.entries()) {
    await bankWord(page, word).click()
    await slot(page, i + 1).click()
  }
  await check(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'คะแนน' })).toContainText('6/6')

  await nextLink(page).click()
  await expectStep(page, 7, 'อ่านการ์ตูนแม่กก')

  await nextLink(page).click()
  await expectStep(page, 8, 'จับคู่ดูคำ')
  for (const [a, b] of PAIRS) {
    await wordButton(page, a).click()
    await wordButton(page, b).click()
  }
  await expect(page.getByTestId('star-counter')).toHaveText(/9\/9/)

  await nextLink(page).click()
  await expectStep(page, 9, 'อ่านออก บอกได้')
  await nextLink(page).click()
  await expectStep(page, 10, 'สรุปและประเมิน')
  await expect(page.getByText(/^ได้ 9\/9 ดาว/)).toBeVisible()
  await expect(scoreRow(page, 'แม่กกอยู่ไหน?')).toContainText('12/12')
  await expect(scoreRow(page, 'กล่องคำแม่กก')).toContainText('6/6')
  await expect(scoreRow(page, 'จับคู่ดูคำ')).toContainText('2/2')
})

test('every แม่กก picture card loads (Step 5 shows all twelve)', async ({ page }) => {
  await open(page, 5, {}, 'mae-kok')
  const images = page.getByRole('main').locator('img[src*="/word-"]')
  await expect(images).toHaveCount(12)
  for (const img of await images.all()) {
    await expect(img).toHaveJSProperty('complete', true)
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth), (await img.getAttribute('src')) ?? '').toBeGreaterThan(0)
  }
})

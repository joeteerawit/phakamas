import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'

// src/lessons/mae-kon.ts: the six words in picture order, and Step 5's Target Words.
const WORDS = ['จาน', 'ช้อน', 'ร้าน', 'กิน', 'คน', 'บ้าน']
const MAE_KON = [...WORDS, 'ฟัน', 'แขน']
const PAIRS = [
  ['จาน', 'หวาน'],
  ['ช้อน', 'ร้อน'],
] as const

const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const wordButton = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const bankWord = (page: Page, word: string) =>
  page.getByRole('group', { name: 'คลังคำ' }).getByRole('button', { name: word, exact: true })
const slot = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^เรือลำที่ ${n}:`) })
const scoreRow = (page: Page, title: string) => page.getByRole('listitem').filter({ hasText: title })

async function expectStep(page: Page, step: number, title: string) {
  await expect(page).toHaveURL(new RegExp(`/lesson/mae-kon/${step}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
}

test('a student plays แม่กน from the cover, by the Map, through all 10 Steps to the summary with all 9 Stars', async ({ page }) => {
  await open(page, 1, {}, 'mae-kon')
  await expectStep(page, 1, 'หน้าปก')
  await expect(page.getByText('คำแม่กนล่องเรือชมตลาด')).toBeVisible()
  await expect(page.getByText('แม่ กน (น ญ ณ ร ล ฬ)')).toBeVisible()

  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kon\/map$/)
  await page.getByRole('link', { name: /^ขั้น 2 / }).click()
  await expectStep(page, 2, 'ดูภาพเรียนรู้คำ')
  for (const n of [1, 2, 3, 4, 5, 6]) await page.getByRole('button', { name: `ห่อที่ ${n} แตะเพื่อแกะห่อ` }).click()

  await nextLink(page).click()
  await expectStep(page, 3, 'ฟังแล้วอ่านตาม')
  await nextLink(page).click()
  await expectStep(page, 4, 'สังเกตตัวสะกด')

  await nextLink(page).click()
  await expectStep(page, 5, 'แม่กนอยู่ไหน?')
  for (const word of MAE_KON) await wordButton(page, word).click()
  await check(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'คะแนน' })).toContainText('12/12')

  await nextLink(page).click()
  await expectStep(page, 6, 'กล่องคำแม่กน')
  for (const [i, word] of WORDS.entries()) {
    await bankWord(page, word).click()
    await slot(page, i + 1).click()
  }
  await check(page).click()
  await expect(page.getByRole('status').filter({ hasText: 'คะแนน' })).toContainText('6/6')

  await nextLink(page).click()
  await expectStep(page, 7, 'อ่านการ์ตูนแม่กน')

  await nextLink(page).click()
  await expectStep(page, 8, 'จับคู่ดูคำ')
  for (const [a, b] of PAIRS) {
    await wordButton(page, a).click()
    await wordButton(page, b).click()
  }
  await expect(page.getByRole('status').filter({ hasText: 'เก่งมาก' })).toBeVisible()

  await nextLink(page).click()
  await expectStep(page, 9, 'อ่านออก บอกได้')
  await nextLink(page).click()
  await expectStep(page, 10, 'สรุปและประเมิน')
  await expect(page.getByText(/^ได้ 9\/9 ดาว/)).toBeVisible()
  await expect(scoreRow(page, 'แม่กนอยู่ไหน?')).toContainText('12/12')
  await expect(scoreRow(page, 'กล่องคำแม่กน')).toContainText('6/6')
  await expect(scoreRow(page, 'จับคู่ดูคำ')).toContainText('2/2')
})

test('every แม่กน picture card loads', async ({ page }) => {
  for (const step of [5, 9]) {
    await open(page, step, {}, 'mae-kon')
    const images = page.getByRole('main').locator('img[src*="/word-"]')
    await expect(images.first()).toBeVisible()
    for (const img of await images.all()) {
      await expect(img).toHaveJSProperty('complete', true)
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth), (await img.getAttribute('src')) ?? '').toBeGreaterThan(0)
    }
  }
})

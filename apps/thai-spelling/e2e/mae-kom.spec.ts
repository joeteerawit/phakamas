import { expect, type Page, test } from '@playwright/test'

// src/lessons/mae-kom.ts: the six words in picture order, and Step 5's Target Words.
const WORDS = ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม']
const SLUGS = ['rom', 'lom', 'som', 'nom', 'phom', 'cham']
const MAE_KOM = [...WORDS, 'แก้ม', 'ยิ้ม']

const nextLink = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const wordButton = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const bankWord = (page: Page, word: string) =>
  page.getByRole('group', { name: 'คลังคำ' }).getByRole('button', { name: word, exact: true })
const slot = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ช่องที่ ${n}:`) })
const scoreRow = (page: Page, title: string) => page.getByRole('listitem').filter({ hasText: title })

async function expectStep(page: Page, step: number, title: string) {
  await expect(page).toHaveURL(new RegExp(`/lesson/mae-kom/${step}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
}

test('a student goes through แม่กม from the cover, by the Map, to the summary with all 9 Stars', async ({ page }) => {
  await page.goto('/lesson/mae-kom/1')
  await expectStep(page, 1, 'หน้าปก')
  await expect(page.getByText('คำแม่กมชมเมืองหิมะ')).toBeVisible()
  await expect(page.getByText('แม่ กม (ม)')).toBeVisible()

  await page.getByRole('link', { name: 'เริ่มเรียน' }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kom\/map$/)
  await page.getByRole('link', { name: /^ขั้น 2 / }).click()
  await expectStep(page, 2, 'ดูภาพเรียนรู้คำ')
  for (const [i, word] of WORDS.entries()) {
    await expect(wordButton(page, word)).toBeVisible()
    await expect(wordButton(page, word).locator(`img[src="/assets/comic/word-${SLUGS[i]}.webp"]`)).toBeVisible()
  }

  await nextLink(page).click()
  await expectStep(page, 3, 'ฟังแล้วอ่านตาม')
  await nextLink(page).click()
  await expectStep(page, 4, 'สังเกตตัวสะกด')

  await nextLink(page).click()
  await expectStep(page, 5, 'แม่กมอยู่ไหน?')
  for (const word of MAE_KOM) await wordButton(page, word).click()
  await check(page).click()
  await expect(page.getByRole('status')).toContainText('12/12')

  await nextLink(page).click()
  await expectStep(page, 6, 'กล่องคำแม่กม')
  for (const [i, word] of WORDS.entries()) {
    await bankWord(page, word).click()
    await slot(page, i + 1).click()
  }
  await check(page).click()
  await expect(page.getByRole('status')).toContainText('6/6')

  await nextLink(page).click()
  await expectStep(page, 7, 'อ่านการ์ตูนแม่กม')

  await nextLink(page).click()
  await expectStep(page, 8, 'จับคู่ดูคำ')
  for (const [a, b] of [['ร่ม', 'ชม'], ['ลม', 'ผม']] as const) {
    await wordButton(page, a).click()
    await wordButton(page, b).click()
  }
  await expect(page.getByRole('status')).toContainText('เก่งมาก!')

  await nextLink(page).click()
  await expectStep(page, 9, 'อ่านออก บอกได้')
  await nextLink(page).click()
  await expectStep(page, 10, 'สรุปและประเมิน')
  await expect(page.getByText(/^ได้ 9\/9 ดาว/)).toBeVisible()
  await expect(scoreRow(page, 'แม่กมอยู่ไหน?')).toContainText('12/12')
  await expect(scoreRow(page, 'กล่องคำแม่กม')).toContainText('6/6')
  await expect(scoreRow(page, 'จับคู่ดูคำ')).toContainText('2/2')
})

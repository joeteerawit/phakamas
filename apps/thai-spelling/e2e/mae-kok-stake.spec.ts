import { expect, type Locator, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 4, stake the final (#89). src/lessons/mae-kok.ts: the six words in order, each word's letters and final.
const WORDS = [
  { word: 'นก', slug: 'nok', letters: ['น', 'ก'], spelling: ['นอ', 'โอะ', 'กอ', 'นก'] },
  { word: 'ผัก', slug: 'phak', letters: ['ผั', 'ก'], spelling: ['ผอ', 'อะ', 'กอ', 'ผัก'] },
  { word: 'ดอก', slug: 'dok', letters: ['ด', 'อ', 'ก'], spelling: ['ดอ', 'ออ', 'กอ', 'ดอก'] },
  { word: 'เด็ก', slug: 'dek', letters: ['เ', 'ด็', 'ก'], spelling: ['ดอ', 'เอะ', 'กอ', 'เด็ก'] },
  { word: 'ปาก', slug: 'pak', letters: ['ป', 'า', 'ก'], spelling: ['ปอ', 'อา', 'กอ', 'ปาก'] },
  { word: 'แบก', slug: 'baek', letters: ['แ', 'บ', 'ก'], spelling: ['บอ', 'แอ', 'กอ', 'แบก'] },
]

const stake = (page: Page) => page.getByRole('button', { name: 'ป้ายตัวสะกด' })
const slots = (page: Page) => page.getByRole('list', { name: /^คำว่า / }).getByRole('button')
const finalSlot = (page: Page) => slots(page).last()
const messages = (page: Page) => page.getByTestId('stake-messages')
const nextWord = (page: Page) => page.getByRole('button', { name: /^(คำต่อไป|เสร็จแล้ว)$/ })

async function dragTo(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
  await page.mouse.up()
}

async function plantByTap(page: Page) {
  await stake(page).click()
  await finalSlot(page).click()
  await expect(finalSlot(page)).toHaveAttribute('data-final', 'true')
}

test('the word is written in the raised bed one letter per slot, with its picture, and the ตัวสะกด stake waits in its holder', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  await expect(page.getByText('มาตราแม่กก มี ก ข ค ฆ เป็นตัวสะกด')).toBeVisible()
  await expect(page.getByTestId('raised-bed')).toBeVisible()
  await expect(slots(page)).toHaveText(WORDS[0]!.letters)
  await expect(page.getByTestId('bed-picture').locator('img')).toHaveAttribute('src', '/assets/comic/word-nok.webp')
  await expect(page.getByTestId('bed-picture')).toHaveClass(/seed-packet/)
  await expect(stake(page)).toHaveAttribute('aria-pressed', 'false')
  await expect(stake(page)).toContainText('ตัวสะกด')
  await expect(page.getByText('คำที่ 1/6')).toBeVisible()
})

test('tap the stake, then the final: the stake stays, the ก turns terracotta and the spelling plays with its parts lit', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  await stake(page).click()
  await expect(stake(page)).toHaveAttribute('aria-pressed', 'true')
  await finalSlot(page).click()
  await expect(finalSlot(page)).toHaveAccessibleName('ก ตัวสะกด')
  await expect(finalSlot(page).getByTestId('planted-stake')).toBeVisible()
  await expect(finalSlot(page).getByTestId('bed-letter')).toHaveCSS('color', 'rgb(176, 79, 41)')
  await expect(stake(page)).toHaveCount(0)
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/nok.mp3'])
  const spelling = page.getByTestId('spelling')
  await expect(spelling.locator('span')).toHaveText(WORDS[0]!.spelling)
  await expect(spelling.locator('[data-active]')).toHaveText('นอ')
  await expect(spelling.locator('[data-active]')).toHaveText('โอะ')
  await expect(messages(page)).toHaveText('ถูกต้อง! ก คือตัวสะกดของ นก')
})

test('dragging the stake onto the final plants it too', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 4, {}, 'mae-kok')
  await dragTo(page, stake(page), finalSlot(page))
  await expect(finalSlot(page)).toHaveAttribute('data-final', 'true')
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/nok.mp3'])
})

test('a wrong letter springs the stake back to its holder and plays the มาตราแม่กก explanation as a hint; the word stays to retry', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  await dragTo(page, stake(page), slots(page).first())
  await expect(slots(page).first()).not.toHaveAttribute('data-final')
  await expect(stake(page)).toBeVisible()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/explanations/mae-kok.mp3'])
  await expect(messages(page)).toHaveText('ยังไม่ใช่ ตัวสะกดอยู่ท้ายคำ ลองอีกครั้งนะ')
  // It ends back in its holder.
  await waitUntilStill(stake(page))
  const holder = await stageBox(page, stake(page))
  expect(holder.left).toBeLessThan(560)
  await stake(page).click()
  await slots(page).first().click()
  await expect(stake(page)).toHaveAttribute('aria-pressed', 'false')
  await plantByTap(page)
})

test('walking the six words: คำต่อไป after each, then ไปต่อ finishes the Step and ฝึกอีกรอบ starts over', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  for (const [i, { letters }] of WORDS.entries()) {
    await expect(slots(page)).toHaveText(letters)
    await expect(page.getByText(`คำที่ ${i + 1}/6`)).toBeVisible()
    await plantByTap(page)
    await endCurrent(page)
    await nextWord(page).click()
  }
  await expect(messages(page)).toHaveText('เก่งมาก! ปักตัวสะกดครบ 6 คำแล้ว')
  await page.getByRole('button', { name: 'ฝึกอีกรอบ' }).click()
  await expect(slots(page)).toHaveText(WORDS[0]!.letters)
  for (let i = 0; i < 6; i++) {
    await plantByTap(page)
    await nextWord(page).click()
  }
  await page.getByRole('link', { name: 'ไปต่อ', exact: true }).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/5$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page.getByRole('link', { name: /^ขั้น 4 / })).toHaveAttribute('data-done', 'true')
})

test('without an mp3 the spelling falls back to Web Speech', async ({ page }) => {
  await open(page, 4, { mp3: 'missing' }, 'mae-kok')
  await plantByTap(page)
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/nok.mp3', 'speak:นอ โอะ กอ นก|th-TH'])
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  await plantByTap(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(nextWord(page)).toHaveClass(/pot-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 4 at ${viewport.width}×${viewport.height}: the terrace fills the window, the leaves keep clear of the word and its spelling, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 4, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-terrace', viewport)
    const explain = page.getByRole('button', { name: 'ฟังคำอธิบาย' })
    if (viewport.height === 390) for (const target of [stake(page), explain, ...(await slots(page).all())]) await expectTapTarget(target)
    await plantByTap(page)
    await waitUntilStill(page.getByTestId('bed-word'))
    if (viewport.height === 390) await expectTapTarget(nextWord(page))
    await expectNothingMovingCrosses(page, [page.getByTestId('raised-bed'), page.getByTestId('spelling'), explain, nextWord(page), messages(page)])
    const corners = await Promise.all(['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [page.getByTestId('raised-bed'), nextWord(page), messages(page), explain]) {
      const box = await stageBox(page, target)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: the stake and each letter are named buttons; Enter picks the stake up and plants it', async ({ page }) => {
  await open(page, 4, {}, 'mae-kok')
  await expect(slots(page)).toHaveCount(2)
  await expect(slots(page).first()).toHaveAccessibleName('น ตัวที่ 1')
  await stake(page).focus()
  expect(parseFloat(await stake(page).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(stake(page)).toHaveAttribute('aria-pressed', 'true')
  await finalSlot(page).focus()
  await page.keyboard.press('Enter')
  await expect(finalSlot(page)).toHaveAccessibleName('ก ตัวสะกด')
  await expect(messages(page)).toHaveAttribute('aria-live', 'polite')
})

test('under reduced motion nothing springs, shakes or slides, and the Scene is still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 4, {}, 'mae-kok')
  await stake(page).waitFor()
  await expectSceneStill(page)
  await stake(page).click()
  await slots(page).first().click()
  await expect(stake(page)).toHaveCSS('transform', 'none')
  await plantByTap(page)
  await endCurrent(page)
  await nextWord(page).click()
  await expect(slots(page)).toHaveText(WORDS[1]!.letters)
  await expect.poll(() => running(page)).toBe(0)
})

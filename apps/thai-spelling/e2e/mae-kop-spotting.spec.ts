import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 4, tap the last stone (#75). src/lessons/mae-kop.ts: the words in order, laid one letter per stone.
const WORDS = [
  { text: 'กบ', slug: 'kop', stones: ['ก', 'บ'] },
  { text: 'พับ', slug: 'phap-fold', stones: ['พั', 'บ'] },
  { text: 'จับ', slug: 'chap', stones: ['จั', 'บ'] },
  { text: 'ภาพ', slug: 'phap', stones: ['ภ', 'า', 'พ'] },
  { text: 'เจ็บ', slug: 'chep', stones: ['เ', 'จ็', 'บ'] },
  { text: 'อาบ', slug: 'ap', stones: ['อ', 'า', 'บ'] },
]

const current = (page: Page) => page.getByTestId('stone-word')
const stones = (page: Page) => current(page).getByRole('button')
const stone = (page: Page, letter: string, position: number) => page.getByRole('button', { name: `${letter} ตัวที่ ${position}`, exact: true })
const messages = (page: Page) => page.getByTestId('stone-messages')

/** Taps the word's final stone and waits for the next word to surface. */
async function solve(page: Page, i: number) {
  const word = WORDS[i]!
  await expect(current(page)).toHaveAttribute('data-word', word.text)
  await stone(page, word.stones.at(-1)!, word.stones.length).click()
  if (i < WORDS.length - 1) await expect(current(page)).toHaveAttribute('data-word', WORDS[i + 1]!.text)
}

test('each word is laid on stepping stones one letter per stone, a vowel mark riding with its consonant', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('มาตราแม่กบ มี บ ป พ ฟ ภ เป็นตัวสะกด')
  for (const [i, word] of WORDS.entries()) {
    await expect(current(page)).toHaveAttribute('data-word', word.text)
    await expect(page.getByRole('list', { name: `คำว่า ${word.text}` })).toBeAttached()
    await expect(stones(page)).toHaveText(word.stones)
    await expect(current(page).getByTestId('stone-picture').locator('img')).toHaveAttribute('src', `/assets/comic/word-${word.slug}.webp`)
    await expect(page.getByText(`คำที่ ${i + 1}/6`)).toBeVisible()
    await solve(page, i)
  }
})

test('the final stone plays the word, turns raincoat yellow and dips with a ripple; then the next word surfaces', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  const last = stone(page, 'บ', 2)
  await last.click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/kop.mp3'])
  const found = page.getByRole('button', { name: 'บ ตัวสะกด' })
  await expect(found).toHaveAttribute('aria-pressed', 'true')
  await expect(found.getByTestId('stone')).toHaveCSS('background-color', 'rgb(255, 204, 0)')
  await expect(found.getByTestId('stone-ripple')).toBeAttached()
  await expect(messages(page)).toHaveText('ถูกต้อง! กบ')
  await expect(current(page)).toHaveAttribute('data-word', 'พับ')
})

test('a wrong stone wobbles and plays the spelling as a hint; for ภาพ the hint says the พ sounds like บ', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  await stone(page, 'ก', 1).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/kop.mp3'])
  await expect(stone(page, 'ก', 1).getByTestId('stone')).not.toHaveCSS('background-color', 'rgb(255, 204, 0)')
  await expect(messages(page)).toContainText('ฟังการสะกดคำว่า กบ')
  // It stays on this word until the final is found.
  await expect(current(page)).toHaveAttribute('data-word', 'กบ')
  for (const i of [0, 1, 2]) await solve(page, i)

  await stone(page, 'า', 2).click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/explanations/mae-kop.mp3')
  await expect(messages(page)).toHaveText('ตัว พ ในคำว่า ภาพ ออกเสียงเหมือน บ ลองหาตัวสะกดอีกครั้งนะ')
  await stone(page, 'พ', 3).click()
  await expect(current(page)).toHaveAttribute('data-word', 'เจ็บ')
})

test('all six found: เก่งมาก!, and ฝึกอีกรอบ starts the stream again; the snail plays the explanation', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  for (const i of WORDS.keys()) await solve(page, i)
  await expect(messages(page)).toHaveText('เก่งมาก! หาตัวสะกดครบ 6 คำแล้ว')
  await expect(current(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'ฝึกอีกรอบ' }).click()
  await expect(current(page)).toHaveAttribute('data-word', 'กบ')
  const explain = page.getByRole('button', { name: 'ฟังคำอธิบาย' })
  await expect(explain.locator('[data-art="snail"]')).toBeVisible()
  await explain.click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/explanations/mae-kop.mp3')
})

test('the Game uses only the แม่กบ Kit: nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  await expect(current(page)).toBeVisible()
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(current(page).getByTestId('stone-picture')).toHaveClass(/pocket-card/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 4 at ${viewport.width}×${viewport.height}: the drizzle fills the window, nothing crosses a stone, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 4, {}, 'mae-kop')
    await expectSceneFills(page, 'kop-drizzle', viewport)
    for (const i of [0, 1, 2]) await solve(page, i)
    await waitUntilStill(current(page))
    await stone(page, 'า', 2).click()
    const targets = [...(await stones(page).all()), page.getByRole('button', { name: 'ฟังคำอธิบาย' })]
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    await expectNoDropCrosses(page, [stones(page), page.getByRole('button', { name: 'ฟังคำอธิบาย' }), messages(page), page.getByRole('heading', { level: 2 })])
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const box of [await stageBox(page, messages(page)), await stageBox(page, page.getByTestId('stream'))]) for (const c of corners) expect(overlaps(box, c)).toBe(false)
  })
}

test('keyboard and screen reader: each stone is named with its letter and position, the found one as ตัวสะกด', async ({ page }) => {
  await open(page, 4, {}, 'mae-kop')
  await expect(page.getByTestId('stream')).toHaveAttribute('aria-hidden', 'true')
  await stone(page, 'ก', 1).focus()
  expect(parseFloat(await stone(page, 'ก', 1).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Tab')
  await expect(stone(page, 'บ', 2)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'บ ตัวสะกด' })).toHaveAttribute('aria-pressed', 'true')
  await expect(messages(page)).toHaveAttribute('aria-live', 'polite')
})

test('under reduced motion nothing dips, ripples, wobbles or slides; the colour still shows', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 4, {}, 'mae-kop')
  await current(page).waitFor()
  await expectSceneStill(page)
  await stone(page, 'ก', 1).click()
  await expect(stone(page, 'ก', 1).getByTestId('stone')).toHaveCSS('transform', 'none')
  await stone(page, 'บ', 2).click()
  const found = page.getByRole('button', { name: 'บ ตัวสะกด' })
  await expect(found.getByTestId('stone')).toHaveCSS('background-color', 'rgb(255, 204, 0)')
  await expect(found.getByTestId('stone')).toHaveCSS('transform', 'none')
  await expect(page.getByTestId('stone-ripple')).toHaveCount(0)
  await expect(current(page)).toHaveAttribute('data-word', 'พับ')
  await expect(current(page)).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

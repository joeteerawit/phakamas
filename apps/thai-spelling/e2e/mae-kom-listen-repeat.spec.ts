import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { near, overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'
import { expectNoDrifterCrosses, expectSceneFillsWithCornerButtons, expectSceneStill } from './windyScene.js'

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 3, {}, 'mae-kom')
}

// src/lessons/mae-kom.ts: Step 3's words in order.
const WORDS = ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม']
const SLUGS = ['rom', 'lom', 'som', 'nom', 'phom', 'cham']

const wordCard = (page: Page) => page.getByTestId('listen-word')
const listenButton = (page: Page) => page.getByRole('button', { name: /^(ฟังเสียง|ฟังอีกครั้ง)$/ })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const nextWord = (page: Page) => button(page, 'คำถัดไป')
const progress = (page: Page) => page.getByRole('navigation', { name: 'ลำดับคำ' })
const messages = (page: Page) => page.getByTestId('listen-messages')
const playedRecording = (entries: string[]) => entries.some((entry) => /^play:https?:/.test(entry))

/** Plays the current word and lets it finish. */
async function hear(page: Page) {
  await listenButton(page).click()
  await expect(wordCard(page)).toContainText('กำลังเล่น')
  await endCurrent(page)
}

/** The billboard's blank screen in stage px: 283–974 × 75–402 of the 1200×890 art. */
async function billboardScreen(page: Page) {
  const art = await stageBox(page, page.getByTestId('billboard'))
  const x = (px: number) => art.left + (px / 1200) * art.width
  const y = (px: number) => art.top + (px / 890) * art.height
  return { left: x(283), right: x(974), top: y(75), bottom: y(402) }
}

test('the word is on the billboard screen, the buzzer on the phone booth below it', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page)
  await expect(page.getByTestId('billboard')).toHaveAttribute('src', '/assets/comic/kom-billboard.webp')
  await expect(page.getByTestId('phone-booth')).toHaveAttribute('src', '/assets/comic/kom-phone-booth.webp')
  await waitUntilStill(wordCard(page))

  const screen = await billboardScreen(page)
  const word = await stageBox(page, wordCard(page))
  for (const part of [word, await stageBox(page, wordCard(page).locator('img')), await stageBox(page, wordCard(page).getByRole('heading'))]) {
    expect(part.left).toBeGreaterThanOrEqual(screen.left - 1)
    expect(part.right).toBeLessThanOrEqual(screen.right + 1)
    expect(part.top).toBeGreaterThanOrEqual(screen.top - 1)
    expect(part.bottom).toBeLessThanOrEqual(screen.bottom + 1)
  }
  near((screen.left + screen.right) / 2, 960, 'screen centre')

  // The buzzer sits on the booth, which stands on the street below the screen.
  const booth = await stageBox(page, page.getByTestId('phone-booth'))
  const buzzer = await stageBox(page, button(page, 'ลองอ่านเอง'))
  expect(booth.top).toBeGreaterThan(screen.top)
  expect(buzzer.top).toBeGreaterThan(screen.bottom)
  expect(buzzer.cx).toBeGreaterThan(booth.left)
  expect(buzzer.cx).toBeLessThan(booth.right)
  expect(buzzer.cy).toBeGreaterThan(booth.top)
  expect(buzzer.cy).toBeLessThan(booth.bottom)

  // The word arrows, คำที่ 1/6 and the dots on the roof under the screen.
  const nav = await stageBox(page, progress(page))
  expect(nav.top).toBeGreaterThanOrEqual(screen.bottom)
  near(nav.cx, 960, 'progress centre')
})

test('starts on ร่ม, คำที่ 1/6, without autoplay; คำถัดไป walks the six words', async ({ page }) => {
  await open(page)
  await page.waitForTimeout(300)
  expect(await audioLog(page)).toEqual([])
  for (const [i, word] of WORDS.entries()) {
    await expect(page.getByText(`คำที่ ${i + 1}/6`)).toBeVisible()
    await expect(wordCard(page).getByRole('heading')).toHaveText(word)
    await expect(wordCard(page).locator('img')).toHaveAttribute('src', `/assets/comic/word-${SLUGS[i]}.webp`)
    if (i < WORDS.length - 1) await nextWord(page).click()
  }
  await expect(nextWord(page)).toBeDisabled()
  await button(page, 'คำก่อนหน้า').click()
  await expect(wordCard(page).getByRole('heading')).toHaveText('ผม')
  await progress(page).getByRole('button', { name: /^ส้ม/ }).click()
  await expect(page.getByText('คำที่ 3/6')).toBeVisible()
})

test('listening plays the word as on แม่กง, then น้องส้ม says ถึงตาหนูอ่านแล้ว; changing word stops the sound', async ({ page }) => {
  await open(page)
  await hear(page)
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/rom.mp3'])
  await expect(messages(page).getByText('ถึงตาหนูอ่านแล้ว')).toBeVisible()
  await expect(messages(page).locator('img')).toHaveAttribute('src', /mascot-som-/)
  await expect(listenButton(page)).toHaveAccessibleName('ฟังอีกครั้ง')

  await listenButton(page).click()
  await nextWord(page).click()
  await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/rom.mp3')
  await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
})

test('the buzzer records, counts down and plays back; changing word throws the recording away', async ({ page }) => {
  await open(page)
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByTestId('record-time')).toHaveText(/^(30|29) วินาที$/)
  await button(page, 'หยุดบันทึก').click()
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => playedRecording(await audioLog(page))).toBe(true)
  expect(await audioLog(page)).toEqual(expect.arrayContaining(['mic:request', 'record:start', 'record:stop', 'mic:release']))

  await nextWord(page).click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveCount(0)
  await expect(button(page, 'ลองอ่านเอง')).toBeVisible()
})

test('a denied microphone shows the friendly message', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  // Above the booth, clear of the buzzer (once its tap boing ends).
  await waitUntilStill(button(page, 'ลองอ่านเอง'))
  expect(overlaps(await stageBox(page, page.getByRole('alert')), await stageBox(page, button(page, 'ลองอ่านเอง')))).toBe(false)
})

test('hearing all six words shows ฟังครบ 6 คำแล้ว, and ฝึกอีกรอบ starts again', async ({ page }) => {
  await open(page)
  for (let i = 0; i < WORDS.length; i++) {
    if (i) await nextWord(page).click()
    await hear(page)
  }
  await expect(messages(page).getByText('ฟังครบ 6 คำแล้ว')).toBeVisible()
  await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
  await button(page, 'ฝึกอีกรอบ').click()
  await expect(page.getByText('คำที่ 1/6')).toBeVisible()
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`Step 3 at ${viewport.width}×${viewport.height}: the Scene fills the window, buttons in the corners, nothing moving crosses the words or controls`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await waitUntilStill(wordCard(page))
    await expectSceneFillsWithCornerButtons(page, viewport)

    const step = page.getByRole('main')
    const controls = () => [wordCard(page), step.getByRole('button'), page.getByTestId('listen-label'), page.getByText('กดแล้วอ่านตาม'), progress(page)]
    if (viewport.height === 390) {
      for (const target of await step.getByRole('button').all()) await expectTapTarget(target)
      for (const name of ['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป']) await expectTapTarget(page.getByRole('link', { name }))
    }
    await expectNoDrifterCrosses(page, controls())

    // ถึงตาหนูอ่านแล้ว, then the completion card and the play-back button, stay clear of every control.
    const clear = async () => {
      const box = await stageBox(page, messages(page))
      for (const target of [listenButton(page), page.getByTestId('listen-label'), progress(page), page.getByRole('link', { name: 'ย้อนกลับ' })]) {
        expect(overlaps(box, await stageBox(page, target))).toBe(false)
      }
      expect(box.bottom).toBeLessThanOrEqual(1080)
      await expectNoDrifterCrosses(page, [messages(page)])
    }
    await hear(page)
    await clear()
    for (let i = 1; i < WORDS.length; i++) {
      await nextWord(page).click()
      await hear(page)
    }
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'หยุดบันทึก').click()
    await expect(messages(page)).toContainText('เก่งมาก')
    await clear()
    if (viewport.height === 390) await expectTapTarget(button(page, 'ฝึกอีกรอบ'))
    await expectNoDrifterCrosses(page, controls())
  })
}

test('under reduced motion the Scene and the billboard are still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await expect(wordCard(page)).toBeVisible()
  await expectSceneStill(page)
  await nextWord(page).click()
  await expect(wordCard(page).getByRole('heading')).toHaveText('ลม')
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  expect(moving).toBe(0)
})

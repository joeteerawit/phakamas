import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 3, the frog choir (#74). src/lessons/mae-kop.ts: Step 3's words in order.
const WORDS = ['กบ', 'พับ', 'จับ', 'ภาพ', 'เจ็บ', 'อาบ']
const SLUGS = ['kop', 'phap-fold', 'chap', 'phap', 'chep', 'ap']

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 3, {}, 'mae-kop')
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const listen = (page: Page) => page.getByRole('button', { name: /^(ฟังเสียง|ฟังอีกครั้ง)$/ })
const word = (page: Page) => page.getByTestId('listen-word')
const frogs = (page: Page) => page.getByTestId('choir-frog')
const sing = (page: Page) => button(page, 'ร้องเพลงพร้อมกัน')
const messages = (page: Page) => page.getByTestId('choir-messages')
const recordings = (log: string[]) => log.filter((entry) => /^play:https?:/.test(entry))

/** Records the current word: ลองอ่านเอง, then หยุดบันทึก. */
async function record(page: Page) {
  await button(page, 'ลองอ่านเอง').click()
  await expect(button(page, 'หยุดบันทึก')).toBeVisible()
  await button(page, 'หยุดบันทึก').click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
}

async function recordAll(page: Page) {
  for (let i = 0; i < WORDS.length; i++) {
    await record(page)
    await expect(frogs(page)).toHaveCount(i + 1)
    if (i < WORDS.length - 1) await button(page, 'คำถัดไป').click()
  }
}

test('the word shows on a flat rock and the snail speaker plays it', async ({ page }) => {
  await open(page)
  await expect(word(page).getByRole('heading', { level: 2 })).toHaveText('กบ')
  await expect(word(page).locator('img')).toHaveAttribute('src', '/assets/comic/word-kop.webp')
  await expect(listen(page).locator('[data-art="snail"]')).toBeVisible()
  await listen(page).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/kop.mp3'])
  await expect(listen(page).getByTestId('sound-waves')).toBeVisible()
  await endCurrent(page)
  await expect(messages(page)).toHaveText('ถึงตาหนูอ่านแล้ว')
  await button(page, 'คำถัดไป').click()
  await expect(word(page).getByRole('heading', { level: 2 })).toHaveText('พับ')
  await expect(page.getByText('คำที่ 2/6')).toBeVisible()
})

test('rings spread from the rock while recording, and each word recorded brings one frog to the choir rock', async ({ page }) => {
  await open(page)
  await expect(frogs(page)).toHaveCount(0)
  await expect(page.getByTestId('frog-count')).toHaveText(/0\/6/)
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByTestId('record-rings')).toBeVisible()
  await expect(page.getByTestId('record-time')).toHaveText(/วินาที/)
  await button(page, 'หยุดบันทึก').click()
  await expect(page.getByTestId('record-rings')).toHaveCount(0)
  await expect(frogs(page)).toHaveCount(1)
  // Recording the same word again keeps one frog for it.
  await record(page)
  await expect(frogs(page)).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'กบ (บันทึกแล้ว)' })).toBeVisible()
  await button(page, 'คำถัดไป').click()
  await record(page)
  await expect(frogs(page)).toHaveCount(2)
  await expect(page.getByTestId('frog-count')).toHaveText(/2\/6/)
  await expect(sing(page)).toHaveCount(0)
})

test('with six frogs the choir plays back the six recordings in turn, each frog puffing its throat as it sings', async ({ page }) => {
  await open(page)
  await recordAll(page)
  await expect(messages(page)).toHaveText('เพื่อนกบครบ 6 ตัวแล้ว ร้องเพลงพร้อมกันได้เลย')
  const before = recordings(await audioLog(page)).length
  await sing(page).click()
  for (let i = 0; i < WORDS.length; i++) {
    await expect(frogs(page).nth(i)).toHaveAttribute('data-singing', 'true')
    await expect(page.locator('[data-singing]')).toHaveCount(1)
    await expect.poll(async () => recordings(await audioLog(page)).length - before).toBe(i + 1)
    await endCurrent(page)
  }
  await expect(page.locator('[data-singing]')).toHaveCount(0)
  await expect(sing(page)).toBeVisible()
  // Six different takes, one per frog.
  expect(new Set(recordings(await audioLog(page)).slice(before)).size).toBe(6)

  // หยุด stops the choir part-way.
  await sing(page).click()
  await expect(frogs(page).nth(0)).toHaveAttribute('data-singing', 'true')
  await button(page, 'หยุด').click()
  await expect(page.locator('[data-singing]')).toHaveCount(0)
})

test('the teacher clip stops the choir: one sound at a time', async ({ page }) => {
  await open(page)
  await recordAll(page)
  await sing(page).click()
  await expect(frogs(page).nth(0)).toHaveAttribute('data-singing', 'true')
  await listen(page).click()
  await expect(page.locator('[data-singing]')).toHaveCount(0)
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/ap.mp3')
})

test('if the microphone is refused, hearing a word brings its frog and the choir sings the words', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  for (let i = 0; i < WORDS.length; i++) {
    await listen(page).click()
    await expect(word(page)).toContainText('กำลังเล่น')
    await endCurrent(page)
    await expect(frogs(page)).toHaveCount(i + 1)
    if (i < WORDS.length - 1) await button(page, 'คำถัดไป').click()
  }
  await sing(page).click()
  for (const [i, slug] of SLUGS.entries()) {
    await expect(frogs(page).nth(i)).toHaveAttribute('data-singing', 'true')
    await expect.poll(async () => (await audioLog(page)).at(-1)).toBe(`play:/assets/audio/vocabulary/${slug}.mp3`)
    await endCurrent(page)
  }
  await expect(page.locator('[data-singing]')).toHaveCount(0)
})

test('the Game uses only the แม่กบ Kit: vinyl buttons, a snail speaker, nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page)
  await recordAll(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const name of ['คำก่อนหน้า', 'คำถัดไป', 'ลองอ่านเอง', 'ฟังเสียงตัวเอง', 'ร้องเพลงพร้อมกัน']) await expect(button(page, name)).toHaveClass(/vinyl-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 3 at ${viewport.width}×${viewport.height}: the drizzle fills the window, nothing crosses a control, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kop-drizzle', viewport)
    await recordAll(page)
    await waitUntilStill(...(await frogs(page).all()), word(page))
    const controls = [listen(page), button(page, 'คำก่อนหน้า'), button(page, 'ลองอ่านเอง'), button(page, 'ฟังเสียงตัวเอง'), sing(page), page.getByRole('navigation', { name: 'ลำดับคำ' }).getByRole('button')]
    if (viewport.height === 390) {
      for (const control of controls) for (const one of await control.all()) await expectTapTarget(one)
    }
    await expectNoDropCrosses(page, [...controls, word(page), page.getByTestId('choir-rock'), messages(page)])
    // The choir rock and the controls keep clear of the corner buttons and each other.
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = [await stageBox(page, page.getByTestId('choir-rock')), ...(await Promise.all([listen(page), button(page, 'ลองอ่านเอง'), button(page, 'ฟังเสียงตัวเอง'), sing(page)].map((c) => stageBox(page, c))))]
    for (const box of boxes) for (const c of corners) expect(overlaps(box, c)).toBe(false)
    for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) expect(overlaps(a, b)).toBe(false)
  })
}

test('keyboard and screen reader: every control is named and works from the keyboard; the frogs are decoration', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('choir-rock')).toHaveAttribute('aria-hidden', 'true')
  await button(page, 'ลองอ่านเอง').focus()
  expect(parseFloat(await button(page, 'ลองอ่านเอง').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(button(page, 'หยุดบันทึก')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(frogs(page)).toHaveCount(1)
  await expect(page.getByTestId('frog-count')).toHaveText(/^เพื่อนกบ.*1\/6$/)
  await button(page, 'คำถัดไป').focus()
  await page.keyboard.press('Space')
  await expect(page.getByText('คำที่ 2/6')).toBeVisible()
})

test('under reduced motion frogs simply appear, the ring stands still and the singing throat is puffed without moving', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await word(page).waitFor()
  await expectSceneStill(page)
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByTestId('record-rings').locator('span')).toHaveCount(1)
  await expect(page.getByTestId('record-rings').locator('span')).toHaveCSS('animation-name', 'none')
  await button(page, 'หยุดบันทึก').click()
  await expect(frogs(page)).toHaveCount(1)
  await expect(frogs(page).first()).toHaveCSS('transform', 'none')
  for (let i = 1; i < WORDS.length; i++) {
    await button(page, 'คำถัดไป').click()
    await record(page)
  }
  await sing(page).click()
  const throat = frogs(page).first().getByTestId('frog-throat')
  await expect(throat).toHaveCSS('transform', /matrix\(1\.5/)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

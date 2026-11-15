import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 9, read the order (#108). src/lessons/mae-kon.ts: the two sentences and their pictures.
const SENTENCES = [
  { text: 'แม่วางช้อนบนจาน', images: ['chon', 'chan'] },
  { text: 'คนขายยืนยิ้มหน้าร้าน', images: ['khon', 'ran'] },
]

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 9, {}, 'mae-kon')
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const sign = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ฟังประโยคที่ ${n}:`) })
const boats = (page: Page) => page.getByTestId('noodle-boat')

/** Records the chosen sentence and plays it back once. */
async function readAndPlayBack(page: Page) {
  if (await button(page, 'ลองอ่านเอง').isVisible()) await button(page, 'ลองอ่านเอง').click()
  await button(page, 'เริ่มบันทึก').click()
  await button(page, 'หยุดบันทึก').click()
  await button(page, 'ฟังเสียงตัวเอง').click()
}

test('each sentence hangs on a bamboo sign from the pier beam with its two pictures; tapping a sign reads it, karaoke-style', async ({ page }) => {
  await open(page)
  for (const [i, sentence] of SENTENCES.entries()) {
    await expect(sign(page, i + 1)).toHaveAccessibleName(`ฟังประโยคที่ ${i + 1}: ${sentence.text}`)
    await expect(sign(page, i + 1).locator('img')).toHaveCount(2)
    for (const [k, slug] of sentence.images.entries()) await expect(sign(page, i + 1).locator('img').nth(k)).toHaveAttribute('src', `/assets/comic/word-${slug}.webp`)
  }
  await expect(sign(page, 1)).toHaveAttribute('aria-pressed', 'true')
  await sign(page, 2).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/sentences/mae-kon/sentence-02.mp3'])
  await expect(sign(page, 2)).toHaveAttribute('aria-pressed', 'true')
  await expect(sign(page, 2).locator('[data-active]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('อ่านประโยคที่ 2')
})

test('recording, playing back and re-recording work as on แม่กง', async ({ page }) => {
  await open(page)
  await button(page, 'ลองอ่านเอง').click()
  await button(page, 'เริ่มบันทึก').click()
  await expect.poll(() => audioLog(page)).toContain('record:start')
  await button(page, 'หยุดบันทึก').click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
  await button(page, 'ลองอีกครั้ง').click()
  await expect(page.getByText('อัดทับเสียงเดิมใช่ไหม')).toBeVisible()
  await button(page, 'ยกเลิก').click()
  await button(page, 'ลองอีกครั้ง').click()
  await button(page, 'อัดใหม่เลย').click()
  await expect(button(page, 'หยุดบันทึก')).toBeVisible()
})

test("after the first playback the sign's noodle boat paddles up beside it, its vendor waving, and the sign gets a งอบ stamp", async ({ page }) => {
  await open(page)
  await expect(boats(page)).toHaveCount(0)
  await button(page, 'ลองอ่านเอง').click()
  await button(page, 'เริ่มบันทึก').click()
  await button(page, 'หยุดบันทึก').click()
  // Recording alone does not bring the boat; playing it back does.
  await expect(boats(page)).toHaveCount(0)
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => (await audioLog(page)).some((e) => /^play:https?:/.test(e))).toBe(true)
  await expect(boats(page)).toHaveCount(1)
  await expect(boats(page)).toHaveAttribute('data-sign', '0')
  await expect(boats(page).getByTestId('stall-keeper')).toHaveAttribute('data-waving', 'true')
  await expect(page.getByTestId('sign-stamp')).toHaveCount(1)
  await expect(sign(page, 1)).toHaveAccessibleName(/ได้ตราแล้ว\)$/)

  // Each sign keeps its own boat and stamp.
  await sign(page, 2).click()
  await readAndPlayBack(page)
  await expect(boats(page)).toHaveCount(2)
  await expect(page.getByTestId('sign-stamp')).toHaveCount(2)
  await waitUntilStill(...(await boats(page).all()))
  for (const n of [0, 1]) {
    const boat = await stageBox(page, boats(page).nth(n))
    for (const k of [1, 2]) expect(overlaps(boat, await stageBox(page, sign(page, k)))).toBe(false)
  }
})

test('if the microphone is refused, hearing a sentence to its end brings its boat', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await button(page, 'เริ่มบันทึก').click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  await sign(page, 1).click()
  await expect(sign(page, 1).locator('[data-active]')).toHaveCount(1)
  await endCurrent(page)
  await expect(boats(page)).toHaveCount(1)
})

test('the Game uses only the แม่กน Kit: nothing from another Lesson', async ({ page }) => {
  await open(page)
  await readAndPlayBack(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const name of ['ฟังเสียงตัวเอง', 'ลองอีกครั้ง']) await expect(button(page, name)).toHaveClass(/plank-button/)
  await expect(page.getByTestId('sign-stamp').locator('[data-art="ngob"]')).toBeVisible()
})

for (const viewport of VIEWPORTS) {
  test(`Step 9 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, nothing crosses a sign, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kon-canal', viewport)
    await readAndPlayBack(page)
    const controls = [sign(page, 1), sign(page, 2), button(page, 'ฟังเสียงตัวเอง'), button(page, 'ลองอีกครั้ง')]
    if (viewport.height === 390) for (const c of controls) await expectTapTarget(c)
    await expectNoDrifterCrosses(page, controls)
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [...controls, boats(page)]) {
      const box = await stageBox(page, target)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: the signs are named toggles, Enter reads one, the boats and beam are decoration', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('pier-beam')).toHaveAttribute('aria-hidden', 'true')
  await sign(page, 2).focus()
  expect(parseFloat(await sign(page, 2).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/sentences/mae-kon/sentence-02.mp3'])
  await readAndPlayBack(page)
  await expect(boats(page)).toHaveAttribute('aria-hidden', 'true')
})

test('under reduced motion the noodle boat is simply there and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await sign(page, 1).waitFor()
  await expectSceneStill(page)
  await readAndPlayBack(page)
  await expect(boats(page)).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

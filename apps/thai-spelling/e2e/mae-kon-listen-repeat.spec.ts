import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 3, call and answer across the canal (#102). src/lessons/mae-kon.ts: Step 3's words in order.
const WORDS = ['จาน', 'ช้อน', 'ร้าน', 'กิน', 'คน', 'บ้าน']

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 3, {}, 'mae-kon')
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const listen = (page: Page) => page.getByRole('button', { name: /^(ฟังเสียง|ฟังอีกครั้ง)$/ })
const boat = (page: Page) => page.getByTestId('vendor-boat')
const flowers = (page: Page) => page.getByTestId('garland-flower')
const messages = (page: Page) => page.getByTestId('turn-messages')
const wordList = (page: Page) => page.getByRole('navigation', { name: 'ลำดับคำ' }).getByRole('button')
const heading = (page: Page) => boat(page).getByRole('heading', { level: 2 })

/** Records the current word: ลองอ่านเอง, then หยุดบันทึก. */
async function record(page: Page) {
  await button(page, 'ลองอ่านเอง').click()
  await expect(button(page, 'หยุดบันทึก')).toBeVisible()
  await button(page, 'หยุดบันทึก').click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
}

async function recordAll(page: Page) {
  for (let i = 0; i < WORDS.length; i++) {
    await expect(heading(page)).toHaveText(WORDS[i]!)
    await record(page)
    await expect(flowers(page)).toHaveCount(i + 1)
    if (i < WORDS.length - 1) await button(page, 'เรือลำต่อไป').click()
  }
}

test("a vendor boat glides in with the word on its paddle sign; the speaker plays the call, then it is the child's turn", async ({ page }) => {
  await open(page)
  await expect(heading(page)).toHaveText('จาน')
  await expect(boat(page).locator('img')).toHaveAttribute('src', '/assets/comic/word-chan.webp')
  await expect(page.getByTestId('listen-word')).toHaveClass(/plank-sign/)
  await expect(listen(page).locator('[data-art="leaf-cone"]')).toBeVisible()
  await expect(messages(page)).toHaveText('')
  await listen(page).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/chan.mp3'])
  await expect(listen(page).getByTestId('sound-waves')).toBeVisible()
  await endCurrent(page)
  await expect(messages(page)).toHaveText('ถึงตาหนูอ่านแล้ว')
  // The word list jumps to any word; a new boat brings it.
  await wordList(page).nth(4).click()
  await expect(heading(page)).toHaveText('คน')
  await expect(wordList(page).nth(4)).toHaveAttribute('aria-current', 'step')
})

test('each word recorded threads one marigold onto the garland, and เรือลำต่อไป brings the next boat', async ({ page }) => {
  await open(page)
  await expect(flowers(page)).toHaveCount(0)
  await expect(page.getByTestId('garland')).toContainText('ดอกดาวเรือง 0/6')
  await expect(button(page, 'เรือลำต่อไป')).toHaveCount(0)
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByTestId('record-time')).toHaveText(/วินาที/)
  await button(page, 'หยุดบันทึก').click()
  await expect(flowers(page)).toHaveCount(1)
  // The take can be played back before moving on.
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => (await audioLog(page)).some((e) => /^play:https?:/.test(e))).toBe(true)
  // Recording the same word again keeps one flower for it.
  await record(page)
  await expect(flowers(page)).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'จาน (บันทึกแล้ว)' })).toBeVisible()
  await button(page, 'เรือลำต่อไป').click()
  await expect(heading(page)).toHaveText('ช้อน')
  await expect(button(page, 'เรือลำต่อไป')).toHaveCount(0)
  await record(page)
  await expect(flowers(page)).toHaveCount(2)
  await expect(page.getByTestId('garland')).toContainText('ดอกดาวเรือง 2/6')
})

test("six marigolds close the garland, which is hung on น้องส้ม's bow; ฝึกอีกรอบ starts over", async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('bow-garland')).toHaveCount(0)
  await recordAll(page)
  await expect(messages(page)).toHaveText('ร้อยพวงมาลัยครบ 6 ดอกแล้ว เก่งมาก!')
  await expect(page.getByTestId('bow-garland')).toBeVisible()
  await expect(button(page, 'เรือลำต่อไป')).toHaveCount(0)
  await button(page, 'ฝึกอีกรอบ').click()
  await expect(flowers(page)).toHaveCount(0)
  await expect(heading(page)).toHaveText('จาน')
  await expect(page.getByTestId('bow-garland')).toHaveCount(0)
})

test('if the microphone is refused, hearing a word threads its marigold', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  for (let i = 0; i < WORDS.length; i++) {
    await listen(page).click()
    await expect(boat(page)).toContainText('กำลังเล่น')
    await endCurrent(page)
    await expect(flowers(page)).toHaveCount(i + 1)
    if (i < WORDS.length - 1) await button(page, 'เรือลำต่อไป').click()
  }
  await expect(page.getByTestId('bow-garland')).toBeVisible()
})

test('the Game uses only the แม่กน Kit: plank buttons, a leaf-cone speaker, nothing from another Lesson', async ({ page }) => {
  await open(page)
  await recordAll(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const name of ['ลองอ่านเอง', 'ฟังเสียงตัวเอง', 'ฝึกอีกรอบ']) await expect(button(page, name)).toHaveClass(/plank-button/)
  for (const one of await wordList(page).all()) await expect(one).toHaveClass(/plank-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 3 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, nothing crosses a control, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kon-canal', viewport)
    for (let i = 0; i < WORDS.length - 1; i++) {
      await record(page)
      await button(page, 'เรือลำต่อไป').click()
    }
    await record(page)
    await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
    await waitUntilStill(boat(page), ...(await flowers(page).all()))
    const controls = [listen(page), button(page, 'ลองอ่านเอง'), button(page, 'ฟังเสียงตัวเอง'), button(page, 'ฝึกอีกรอบ'), wordList(page)]
    if (viewport.height === 390) for (const control of controls) for (const one of await control.all()) await expectTapTarget(one)
    await expectNoDrifterCrosses(page, [...controls, page.getByTestId('listen-word'), page.getByTestId('garland'), messages(page)])
    // The boat, the garland and the controls keep clear of the corner buttons and of each other.
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    const boxes = await Promise.all(
      [page.getByTestId('listen-word'), page.getByTestId('garland'), listen(page), button(page, 'ลองอ่านเอง'), button(page, 'ฟังเสียงตัวเอง'), button(page, 'ฝึกอีกรอบ'), page.getByRole('navigation', { name: 'ลำดับคำ' })].map((c) =>
        stageBox(page, c),
      ),
    )
    for (const box of boxes) for (const c of corners) expect(overlaps(box, c)).toBe(false)
    for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) expect(overlaps(a, b)).toBe(false)
  })
}

test('keyboard and screen reader: every control is named and works from the keyboard; the boat art is decoration', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('bow')).toHaveAttribute('aria-hidden', 'true')
  await button(page, 'ลองอ่านเอง').focus()
  expect(parseFloat(await button(page, 'ลองอ่านเอง').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(button(page, 'หยุดบันทึก')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(flowers(page)).toHaveCount(1)
  await button(page, 'เรือลำต่อไป').focus()
  await page.keyboard.press('Space')
  await expect(heading(page)).toHaveText('ช้อน')
  await wordList(page).nth(5).focus()
  await page.keyboard.press('Enter')
  await expect(heading(page)).toHaveText('บ้าน')
})

test('under reduced motion the boat is just there and the marigolds simply appear; nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await boat(page).waitFor()
  await expectSceneStill(page)
  await expect(boat(page)).toHaveCSS('transform', 'none')
  await record(page)
  await expect(flowers(page).first()).toHaveCSS('transform', 'none')
  await button(page, 'เรือลำต่อไป').click()
  await expect(heading(page)).toHaveText('ช้อน', { timeout: 300 })
  await expect(boat(page)).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

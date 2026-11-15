import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 3, valley echo (#88). src/lessons/mae-kok.ts: Step 3's words in order.
const WORDS = ['นก', 'ผัก', 'ดอก', 'เด็ก', 'ปาก', 'แบก']

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 3, {}, 'mae-kok')
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const listen = (page: Page) => page.getByRole('button', { name: /^(ฟังเสียง|ฟังอีกครั้ง)$/ })
const word = (page: Page) => page.getByTestId('listen-word')
const birds = (page: Page) => page.getByTestId('ridge-bird')
const messages = (page: Page) => page.getByTestId('echo-messages')

async function record(page: Page) {
  await button(page, 'ลองอ่านเอง').click()
  await expect(button(page, 'หยุดบันทึก')).toBeVisible()
  await button(page, 'หยุดบันทึก').click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
}

async function recordAll(page: Page) {
  for (let i = 0; i < WORDS.length; i++) {
    await record(page)
    await expect(birds(page)).toHaveCount(i + 1)
    if (i < WORDS.length - 1) await button(page, 'คำถัดไป').click()
  }
}

test('the word is on a seed-packet stake sign beside น้องนก, and the pot-horn speaker plays it, then its echo comes off the far hill', async ({ page }) => {
  await open(page)
  await expect(word(page)).toHaveClass(/seed-packet/)
  await expect(word(page).getByRole('heading', { level: 2 })).toHaveText('นก')
  await expect(word(page).locator('img')).toHaveAttribute('src', '/assets/comic/word-nok.webp')
  await expect(listen(page).locator('[data-art="pot-horn"]')).toBeVisible()
  await expect(page.getByTestId('echo')).toHaveCount(0)
  await listen(page).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/nok.mp3'])
  await expect(listen(page).getByTestId('sound-waves')).toBeVisible()
  await endCurrent(page)
  await expect(messages(page)).toHaveText('ถึงตาหนูอ่านแล้ว')
  // The softer echo hangs off the far hill for a moment, then fades.
  const echo = page.getByTestId('echo')
  await expect(echo).toHaveText('นก… นก…')
  const hill = await stageBox(page, page.getByTestId('far-hill'))
  const box = await stageBox(page, echo)
  expect(box.left).toBeGreaterThanOrEqual(hill.left)
  expect(box.right).toBeLessThanOrEqual(hill.right)
  await expect(echo).toHaveCount(0)
  await button(page, 'คำถัดไป').click()
  await expect(word(page).getByRole('heading', { level: 2 })).toHaveText('ผัก')
  await expect(page.getByText('คำที่ 2/6')).toBeVisible()
})

test('recording works as on แม่กม\'s Step 3, the child\'s voice comes back as the echo, and each word recorded brings a bird to the ridge', async ({ page }) => {
  await open(page)
  await expect(birds(page)).toHaveCount(0)
  await expect(page.getByTestId('bird-count')).toHaveText(/0\/6/)
  await button(page, 'ลองอ่านเอง').click()
  await expect(button(page, 'หยุดบันทึก')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('record-time')).toHaveText(/วินาที/)
  await button(page, 'หยุดบันทึก').click()
  await expect(birds(page)).toHaveCount(1)
  await expect(page.getByTestId('bird-count')).toHaveText(/1\/6/)
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => (await audioLog(page)).some((entry) => /^play:https?:/.test(entry))).toBe(true)
  await expect(page.getByTestId('echo')).toHaveAttribute('data-voice', 'true')
  // The bird rests on the far ridge.
  await waitUntilStill(birds(page).first())
  const bird = await stageBox(page, birds(page).first())
  const hill = await stageBox(page, page.getByTestId('far-hill'))
  expect(bird.cx).toBeGreaterThan(hill.left)
  expect(bird.cx).toBeLessThan(hill.right)
  expect(bird.bottom).toBeLessThan(hill.top + 100)
  // The same word recorded again brings no second bird.
  await record(page)
  await expect(birds(page)).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'นก (บันทึกแล้ว)' })).toBeVisible()
})

test('with all six birds on the ridge they fly one slow loop in the sky band above the hill, and ฝึกอีกรอบ starts over', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page)
  await recordAll(page)
  await expect(page.getByTestId('birds')).toHaveAttribute('data-loop', 'true')
  await expect(messages(page)).toHaveText('อัดครบ 6 คำแล้ว')
  // Mid-loop they are up in the sky band, above the hill and clear of the sign.
  await page.waitForTimeout(1500)
  const sign = await stageBox(page, word(page))
  for (const one of await birds(page).all()) {
    const box = await stageBox(page, one)
    expect(box.bottom, 'in the sky band').toBeLessThan(330)
    expect(overlaps(box, sign)).toBe(false)
  }
  await button(page, 'ฝึกอีกรอบ').click()
  await expect(birds(page)).toHaveCount(0)
  await expect(word(page).getByRole('heading', { level: 2 })).toHaveText('นก')
})

test('with the microphone refused, hearing each word brings its bird instead', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByRole('alert')).toContainText('ไมโครโฟน')
  for (let i = 0; i < WORDS.length; i++) {
    await listen(page).click()
    await expect(listen(page).getByTestId('sound-waves')).toBeVisible()
    await endCurrent(page)
    await expect(birds(page)).toHaveCount(i + 1)
    if (i < WORDS.length - 1) await button(page, 'คำถัดไป').click()
  }
  await expect(messages(page)).toHaveText('อัดครบ 6 คำแล้ว')
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page)
  await record(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveClass(/pot-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 3 at ${viewport.width}×${viewport.height}: the terrace fills the window, nothing moving crosses the Game, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kok-terrace', viewport)
    await record(page)
    await waitUntilStill(word(page))
    const targets = [listen(page), button(page, 'ลองอ่านเอง'), button(page, 'ฟังเสียงตัวเอง'), button(page, 'คำถัดไป'), ...(await page.getByRole('list', { name: 'คำทั้งหมด' }).getByRole('button').all())]
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    await expectNothingMovingCrosses(page, [word(page), ...targets])
    const corners = await Promise.all(['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [word(page), ...targets, page.getByTestId('bird-count')]) {
      const box = await stageBox(page, target)
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: the speaker, recorder and word dots are named buttons that work with Enter', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('birds')).toHaveAttribute('aria-hidden', 'true')
  await listen(page).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/nok.mp3')
  await button(page, 'ลองอ่านเอง').focus()
  expect(parseFloat(await button(page, 'ลองอ่านเอง').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await button(page, 'หยุดบันทึก').focus()
  await page.keyboard.press('Enter')
  await expect(birds(page)).toHaveCount(1)
  await page.getByRole('button', { name: 'ดอก', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(word(page).getByRole('heading', { level: 2 })).toHaveText('ดอก')
})

test('under reduced motion the Scene and birds are still, and the loop holds as a still line in the sky', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await word(page).waitFor()
  await expectSceneStill(page)
  await recordAll(page)
  await expect(page.getByTestId('birds')).toHaveAttribute('data-loop', 'true')
  const tops = await Promise.all((await birds(page).all()).map(async (one) => Math.round((await stageBox(page, one)).top)))
  expect(new Set(tops).size).toBe(1)
  expect(tops[0]).toBeLessThan(330)
  await expect.poll(() => running(page)).toBe(0)
})

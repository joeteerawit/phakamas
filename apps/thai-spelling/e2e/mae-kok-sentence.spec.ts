import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 9, read to the scarecrow (#94). src/lessons/mae-kok.ts: the two sentences and their pictures.
const SENTENCES = [
  { text: 'เด็กแบกผักกลับบ้าน', images: ['baek', 'phak'], clip: 'sentence-01' },
  { text: 'นกอ้าปากกินหนอน', images: ['nok', 'pak'], clip: 'sentence-02' },
]

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 9, {}, 'mae-kok')
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const plank = (page: Page) => page.getByTestId('plank')
const bird = (page: Page) => page.getByTestId('hat-mascot')

async function record(page: Page) {
  await button(page, 'อ่านให้หุ่นฟัง').click()
  await expect(button(page, 'หยุดบันทึก')).toHaveAttribute('aria-pressed', 'true')
  await button(page, 'หยุดบันทึก').click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
}

test('the scarecrow holds a wooden plank with the sentence, and its two pictures hang from its arms', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('scarecrow')).toBeVisible()
  await expect(plank(page)).toContainText(SENTENCES[0]!.text)
  const pictures = page.getByTestId('hanging-picture')
  await expect(pictures).toHaveCount(2)
  for (const [i, slug] of SENTENCES[0]!.images.entries()) await expect(pictures.nth(i).locator('img')).toHaveAttribute('src', `/assets/comic/word-${slug}.webp`)
  await expect(pictures.first().locator('.seed-packet')).toBeVisible()
  await expect(page.getByText('ประโยคที่ 1/2')).toBeVisible()
  await expect(bird(page)).not.toHaveAttribute('data-landed')
})

test('the pot-horn speaker plays the sentence with its words lit karaoke-style', async ({ page }) => {
  await open(page)
  await expect(button(page, 'ฟังประโยคที่ 1').locator('[data-art="pot-horn"]')).toBeVisible()
  await button(page, 'ฟังประโยคที่ 1').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/sentences/mae-kok/sentence-01.mp3'])
  await expect(plank(page).locator('[data-active]')).toHaveCount(1)
  await endCurrent(page)
  await expect(plank(page).locator('[data-active]')).toHaveCount(0)
})

test('after a recording น้องนก lands on the scarecrow\'s hat and claps; the take plays back; then the second sentence', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page)
  await record(page)
  await expect(bird(page)).toHaveAttribute('data-landed', 'true')
  await expect(bird(page).locator('img')).toHaveAttribute('src', /mascot-nok-cheer\.webp$/)
  await expect(page.getByTestId('scarecrow-messages')).toHaveText('น้องนกปรบมือให้แล้ว!')
  // She stands on the hat, clear of the plank.
  await waitUntilStill(bird(page))
  const her = await stageBox(page, bird(page))
  expect(her.cx).toBeGreaterThan(880)
  expect(her.cx).toBeLessThan(1040)
  expect(overlaps(her, await stageBox(page, plank(page)))).toBe(false)
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => (await audioLog(page)).some((entry) => /^play:https?:/.test(entry))).toBe(true)
  await button(page, 'ประโยคถัดไป').click()
  await expect(plank(page)).toContainText(SENTENCES[1]!.text)
  await expect(page.getByTestId('hanging-picture').first().locator('img')).toHaveAttribute('src', '/assets/comic/word-nok.webp')
  await expect(bird(page)).not.toHaveAttribute('data-landed')
  await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveCount(0)
  await record(page)
  await expect(bird(page)).toHaveAttribute('data-landed', 'true')
  await button(page, 'ประโยคก่อนหน้า').click()
  await expect(bird(page)).toHaveAttribute('data-landed', 'true')
})

test('with the microphone refused, hearing the sentence to its end brings her to the hat', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'อ่านให้หุ่นฟัง').click()
  await expect(page.getByRole('alert')).toContainText('ไมโครโฟน')
  await button(page, 'ฟังแล้วอ่านให้หุ่นฟัง').click()
  await expect(plank(page).locator('[data-active]')).toHaveCount(1)
  await endCurrent(page)
  await expect(bird(page)).toHaveAttribute('data-landed', 'true')
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page)
  await record(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveClass(/pot-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 9 at ${viewport.width}×${viewport.height}: the terrace fills the window, nothing moving crosses the sentence, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kok-terrace', viewport)
    await record(page)
    const targets = [button(page, 'ฟังประโยคที่ 1'), button(page, 'อ่านให้หุ่นฟัง'), button(page, 'ฟังเสียงตัวเอง'), button(page, 'ประโยคถัดไป')]
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    await expectNothingMovingCrosses(page, [plank(page), page.getByTestId('hanging-picture'), ...targets])
    const corners = await Promise.all(['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const target of [plank(page), ...targets]) for (const c of corners) expect(overlaps(await stageBox(page, target), c)).toBe(false)
    // The Game's own controls never overlap each other or the pictures.
    const boxes = await Promise.all([plank(page), ...targets, ...(await page.getByTestId('hanging-picture').all())].map((t) => stageBox(page, t)))
    for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) expect(overlaps(a, b)).toBe(false)
  })
}

test('keyboard and screen reader: the sentence is read out, and the speaker, recorder and sentence arrows work with Enter', async ({ page }) => {
  await open(page)
  await expect(plank(page)).toContainText(SENTENCES[0]!.text)
  await expect(bird(page)).toHaveAttribute('aria-hidden', 'true')
  await button(page, 'อ่านให้หุ่นฟัง').focus()
  expect(parseFloat(await button(page, 'อ่านให้หุ่นฟัง').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await button(page, 'หยุดบันทึก').focus()
  await page.keyboard.press('Enter')
  await expect(bird(page)).toHaveAttribute('data-landed', 'true')
  await button(page, 'ประโยคถัดไป').focus()
  await page.keyboard.press('Enter')
  await button(page, 'ฟังประโยคที่ 2').focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => audioLog(page)).toContain(`play:/assets/audio/sentences/mae-kok/${SENTENCES[1]!.clip}.mp3`)
})

test('under reduced motion she is simply on the hat and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await plank(page).waitFor()
  await expectSceneStill(page)
  await record(page)
  await expect(bird(page)).toHaveAttribute('data-landed', 'true')
  await expect.poll(() => running(page)).toBe(0)
})

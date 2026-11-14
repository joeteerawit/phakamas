import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 9, paint the picture (#80). src/lessons/mae-kop.ts: the two sentences and their pictures.
const SENTENCES = [
  { text: 'กบเจ็บ แม่จูบให้หาย', images: ['chep', 'chup'] },
  { text: 'พี่พับภาพเป็นเรือ', images: ['phap-fold', 'phap'] },
]

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 9, {}, 'mae-kop')
}

const easel = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ฟังประโยคที่ ${n}:`) })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const wall = (page: Page) => page.getByTestId('wall-picture')

/** ลองอ่านเอง → เริ่มบันทึก → หยุดบันทึก on the chosen easel. */
async function recordSentence(page: Page) {
  await expect(button(page, 'ลองอ่านเอง').or(button(page, 'เริ่มบันทึก')).or(button(page, 'ลองอีกครั้ง'))).toBeVisible()
  if (await button(page, 'ลองอ่านเอง').count()) await button(page, 'ลองอ่านเอง').click()
  await button(page, 'เริ่มบันทึก').click()
  await button(page, 'หยุดบันทึก').click()
  await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
}

test('each sentence sits under an easel whose canvas shows its two pictures as a grey pencil sketch', async ({ page }) => {
  await open(page)
  for (const [i, sentence] of SENTENCES.entries()) {
    await expect(easel(page, i + 1)).toHaveAccessibleName(`ฟังประโยคที่ ${i + 1}: ${sentence.text}`)
    const canvas = easel(page, i + 1).getByTestId('easel-canvas')
    await expect(canvas.getByTestId('sketch').locator('img')).toHaveCount(2)
    for (const [k, slug] of sentence.images.entries()) {
      await expect(canvas.getByTestId('sketch').locator('img').nth(k)).toHaveAttribute('src', `/assets/comic/word-${slug}.webp`)
    }
    await expect(canvas.getByTestId('sketch').locator('> span')).toHaveCSS('filter', /grayscale\(1\)/)
    await expect(canvas.getByTestId('colour')).not.toHaveAttribute('data-painted')
    await expect(canvas.getByTestId('colour')).toHaveCSS('clip-path', 'inset(0px 100% 0px 0px)')
  }
  await expect(wall(page)).toHaveCount(0)
})

test('tapping an easel chooses it and reads its sentence, the words lit one by one', async ({ page }) => {
  await open(page)
  await easel(page, 2).click()
  await expect(easel(page, 2)).toHaveAttribute('aria-pressed', 'true')
  await expect(easel(page, 1)).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/sentences/mae-kop/sentence-02.mp3'])
  await expect(easel(page, 2).locator('[data-active]')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'บันทึกประโยคที่ 2' })).toBeVisible()
})

test('when the recording ends the sketch fills with colour and the picture hangs on the porch wall; two sentences, two pictures', async ({ page }) => {
  await open(page)
  await recordSentence(page)
  await expect(easel(page, 1)).toHaveAttribute('data-painted', 'true')
  await expect(easel(page, 1).getByTestId('colour')).toHaveCSS('clip-path', 'inset(0px 0% 0px 0px)')
  await expect(easel(page, 1)).toHaveAccessibleName(/\(ระบายสีแล้ว\)$/)
  await expect(wall(page)).toHaveCount(1)
  await expect(page.getByRole('list', { name: 'ภาพที่วาดเสร็จ' })).toContainText('ภาพของประโยคที่ 1')
  await expect(easel(page, 2)).not.toHaveAttribute('data-painted')

  // ฟังเสียงตัวเอง plays the take back; ลองอีกครั้ง asks before recording over it.
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => (await audioLog(page)).some((e) => /^play:https?:/.test(e))).toBe(true)
  await button(page, 'ลองอีกครั้ง').click()
  await expect(page.getByText('อัดทับเสียงเดิมใช่ไหม')).toBeVisible()
  await button(page, 'ยกเลิก').click()

  await easel(page, 2).click()
  await recordSentence(page)
  await expect(easel(page, 2)).toHaveAttribute('data-painted', 'true')
  await expect(wall(page)).toHaveCount(2)
})

test('if the microphone is refused, hearing the sentence to its end paints it instead', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await button(page, 'เริ่มบันทึก').click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  for (const n of [1, 2]) {
    if (n === 2) await easel(page, 2).click()
    else await button(page, 'ฟังแล้วระบายสี').click()
    await expect(easel(page, n).locator('[data-active]')).toHaveCount(1)
    await endCurrent(page)
    await expect(easel(page, n)).toHaveAttribute('data-painted', 'true')
  }
  await expect(wall(page)).toHaveCount(2)
})

test('the Game uses only the แม่กบ Kit: raincoat-pocket canvases and vinyl pills, nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page)
  await recordSentence(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const n of [1, 2]) await expect(easel(page, n).getByTestId('easel-canvas')).toHaveClass(/pocket-card/)
  for (const name of ['ฟังเสียงตัวเอง', 'ลองอีกครั้ง']) await expect(button(page, name)).toHaveClass(/vinyl-button/)
})

for (const viewport of VIEWPORTS) {
  test(`Step 9 at ${viewport.width}×${viewport.height}: the drizzle fills the window, easels, wall and recorder clear of each other and the corners, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kop-drizzle', viewport)
    await recordSentence(page)
    const targets = [easel(page, 1), easel(page, 2), button(page, 'ฟังเสียงตัวเอง'), button(page, 'ลองอีกครั้ง')]
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    await expectNoDropCrosses(page, [...targets, page.getByRole('list', { name: 'ภาพที่วาดเสร็จ' })])
    const boxes = await Promise.all([easel(page, 1), easel(page, 2), page.getByRole('list', { name: 'ภาพที่วาดเสร็จ' }), page.getByRole('heading', { name: /^บันทึกประโยคที่/ }).locator('..')].map((t) => stageBox(page, t)))
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) expect(overlaps(a, b), `part ${i}`).toBe(false)
      for (const c of corners) expect(overlaps(a, c), `part ${i}`).toBe(false)
    }
  })
}

test('keyboard and screen reader: the easels are named toggles and the recorder works from the keyboard', async ({ page }) => {
  await open(page)
  await easel(page, 2).focus()
  expect(parseFloat(await easel(page, 2).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(easel(page, 2)).toHaveAttribute('aria-pressed', 'true')
  await button(page, 'ลองอ่านเอง').focus()
  await page.keyboard.press('Enter')
  await button(page, 'เริ่มบันทึก').focus()
  await page.keyboard.press('Enter')
  await button(page, 'หยุดบันทึก').focus()
  await page.keyboard.press('Enter')
  await expect(easel(page, 2)).toHaveAttribute('data-painted', 'true')
})

test('under reduced motion the colour appears at once and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await easel(page, 1).waitFor()
  await expectSceneStill(page)
  await recordSentence(page)
  await expect(easel(page, 1).getByTestId('colour')).toHaveCSS('clip-path', 'inset(0px 0% 0px 0px)', { timeout: 300 })
  await expect(wall(page)).toHaveCSS('transform', 'none')
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

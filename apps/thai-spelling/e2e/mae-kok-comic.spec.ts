import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 7, the comic on the trellis (#92). src/lessons/mae-kok.ts: the four lines and their แม่กก words.
const LINES = [
  { text: 'น้องนกบินลงแปลงผัก', words: ['นก', 'ผัก'] },
  { text: 'เด็กแบกตะกร้าผัก', words: ['เด็ก', 'แบก', 'ผัก'] },
  { text: 'ดอกสีแดงบานแล้ว', words: ['ดอก'] },
  { text: 'นกอ้าปากร้องเพลง', words: ['นก', 'ปาก'] },
]

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 7, {}, 'mae-kok')
}

const panels = (page: Page) => page.getByTestId('comic-panel')
const panel = (page: Page, i: number) => panels(page).nth(i)
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

/** Turns panel i face up and lets its line play to the end. */
async function readPanel(page: Page, i: number) {
  await button(page, `พลิกภาพที่ ${i + 1}`).click()
  await expect(panel(page, i)).toHaveAttribute('data-current', 'true')
  await endCurrent(page)
  await expect(panel(page, i)).toHaveAttribute('data-read', 'true')
}

test('the four panels hang face down from a bamboo trellis on wooden pegs, and there is no word collecting', async ({ page }) => {
  await open(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('อ่านการ์ตูนแม่กก')
  await expect(page.getByTestId('trellis')).toBeVisible()
  await expect(page.getByTestId('peg')).toHaveCount(8)
  await expect(panels(page)).toHaveCount(4)
  for (let i = 0; i < 4; i++) await expect(panel(page, i)).toHaveAccessibleName(`พลิกภาพที่ ${i + 1}`)
  await expect(page.getByTestId('read-count')).toHaveText('อ่านแล้ว 0/4')
  await expect(page.getByTestId('bean-vine')).not.toHaveAttribute('data-grown')
  await expect(page.getByRole('group', { name: 'คลังคำ' })).toHaveCount(0)
})

test('tapping a panel turns it face up and the teacher reads its line with the words lit; the แม่กก words are terracotta', async ({ page }) => {
  await open(page)
  await button(page, 'พลิกภาพที่ 1').click()
  await expect(panel(page, 0)).toHaveAttribute('data-turned', 'true')
  await expect(panel(page, 0).getByTestId('panel-picture')).toHaveAttribute('src', '/assets/comic/kok-panel-1.webp')
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/rhyme/mae-kok/line-01.mp3'])
  await expect(panel(page, 0).locator('[data-active]')).toHaveCount(1)
  const highlighted = panel(page, 0).locator('[data-rhyme]')
  await expect(highlighted).toHaveText(LINES[0]!.words)
  await expect(highlighted.first().getByTestId('rhyme-word')).toHaveCSS('background-color', 'rgb(176, 79, 41)')
  await expect(panel(page, 0).getByTestId('panel-line')).toContainText(LINES[0]!.text)
  await endCurrent(page)
  await expect(page.getByTestId('read-count')).toHaveText('อ่านแล้ว 1/4')
})

test('tapping a highlighted word plays that word alone; the picture, with its pot-horn speaker, reads the line again', async ({ page }) => {
  await open(page)
  await readPanel(page, 1)
  await button(page, 'ฟังคำว่า แบก').click()
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/baek.mp3')
  await expect(button(page, 'ฟังวรรคที่ 2').locator('[data-art="pot-horn"]')).toBeVisible()
  await button(page, 'ฟังวรรคที่ 2').click()
  await expect.poll(async () => (await audioLog(page)).filter((e) => e === 'play:/assets/audio/rhyme/mae-kok/line-02.mp3').length).toBe(2)
})

test('each line records and plays back on its own panel through the one Recorder', async ({ page }) => {
  await open(page)
  await button(page, 'พลิกภาพที่ 3').click()
  await button(page, 'พลิกภาพที่ 4').click()
  await button(page, 'อ่านวรรคที่ 3').click()
  await expect(button(page, 'หยุดบันทึกวรรคที่ 3')).toHaveAttribute('aria-pressed', 'true')
  await button(page, 'หยุดบันทึกวรรคที่ 3').click()
  await expect(button(page, 'ฟังเสียงตัวเองวรรคที่ 3')).toBeVisible()
  await expect(button(page, 'ฟังเสียงตัวเองวรรคที่ 4')).toHaveCount(0)
  await expect(panel(page, 2)).toHaveAttribute('data-read', 'true')
  await button(page, 'ฟังเสียงตัวเองวรรคที่ 3').click()
  await expect.poll(async () => (await audioLog(page)).some((entry) => /^play:https?:/.test(entry))).toBe(true)
  // Recording panel 4 moves the Recorder to it.
  await button(page, 'อ่านวรรคที่ 4').click()
  await button(page, 'หยุดบันทึกวรรคที่ 4').click()
  await expect(button(page, 'ฟังเสียงตัวเองวรรคที่ 4')).toBeVisible()
  await expect(button(page, 'ฟังเสียงตัวเองวรรคที่ 3')).toHaveCount(0)
})

test('once all four panels are read a bean vine grows along the top of the trellis, above the panels', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page)
  for (let i = 0; i < 4; i++) await readPanel(page, i)
  await expect(page.getByTestId('read-count')).toContainText('อ่านครบแล้ว')
  const vine = page.getByTestId('bean-vine')
  await expect(vine).toHaveAttribute('data-grown', 'true')
  await expect(page.getByTestId('vine-leaf').first()).toBeVisible()
  const top = Math.min(...(await Promise.all((await panels(page).all()).map(async (p) => (await stageBox(page, p)).top))))
  for (const leaf of await page.getByTestId('vine-leaf').all()) expect((await stageBox(page, leaf)).bottom).toBeLessThanOrEqual(top)
})

test('with the microphone refused, hearing the lines still reads every panel', async ({ page }) => {
  await open(page, 'deny')
  await readPanel(page, 0)
  await button(page, 'อ่านวรรคที่ 1').click()
  await expect(page.getByRole('alert')).toContainText('ไมโครโฟน')
  for (let i = 1; i < 4; i++) await readPanel(page, i)
  await expect(page.getByTestId('bean-vine')).toHaveAttribute('data-grown', 'true')
})

test('the Game uses only the แม่กก Kit', async ({ page }) => {
  await open(page)
  for (let i = 0; i < 4; i++) await readPanel(page, i)
  expect(await otherLook(wholeStage(page))).toEqual([])
})

for (const viewport of VIEWPORTS) {
  test(`Step 7 at ${viewport.width}×${viewport.height}: the wash fills the window, the panels clear the corners, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kok-comic', viewport)
    for (let i = 0; i < 4; i++) await readPanel(page, i)
    await waitUntilStill(...(await panels(page).all()))
    const targets = await page.getByRole('main').getByRole('button').all()
    expect(targets.length).toBeGreaterThan(8)
    if (viewport.height === 390) for (const target of targets) await expectTapTarget(target)
    const corners = await Promise.all(
      [page.getByRole('link', { name: 'กลับไปแผนที่' }), page.getByRole('link', { name: 'ย้อนกลับ' }), page.getByRole('link', { name: 'ถัดไป' }), page.getByRole('button', { name: /เพลง$/ })].map((c) =>
        stageBox(page, c),
      ),
    )
    for (const p of await panels(page).all()) for (const c of corners) expect(overlaps(await stageBox(page, p), c)).toBe(false)
  })
}

test('keyboard and screen reader: a face-down panel is a named button, Enter turns it, its line is read out', async ({ page }) => {
  await open(page)
  await button(page, 'พลิกภาพที่ 2').focus()
  expect(parseFloat(await button(page, 'พลิกภาพที่ 2').evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(panel(page, 1).getByTestId('panel-line')).toContainText(LINES[1]!.text)
  await button(page, 'ฟังคำว่า เด็ก').focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/dek.mp3')
})

test('under reduced motion the panels simply show face up, the vine simply stands grown, and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await panels(page).first().waitFor()
  await expectSceneStill(page)
  for (let i = 0; i < 4; i++) await readPanel(page, i)
  await expect(page.getByTestId('bean-vine')).toHaveAttribute('data-grown', 'true')
  await expect.poll(() => running(page)).toBe(0)
})

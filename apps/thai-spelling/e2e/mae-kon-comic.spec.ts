import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectNoDrifterCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKon.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กน Step 7, paddle through the comic (#106). src/lessons/mae-kon.ts: the four lines and their แม่กน words.
const LINES = [
  { text: 'น้องส้มพายเรือไปตลาด พบร้านขายของ', words: ['ร้าน'] },
  { text: 'แม่ค้าขายจานและช้อน', words: ['จาน', 'ช้อน'] },
  { text: 'คนขายขนมยิ้มหวาน', words: ['คน', 'หวาน'] },
  { text: 'กลับบ้านกินข้าวกับแม่', words: ['บ้าน', 'กิน'] },
]
const clip = (n: number) => `play:/assets/audio/rhyme/mae-kon/line-0${n}.mp3`

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 7, {}, 'mae-kon')
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const panels = (page: Page) => page.getByTestId('comic-panel')
const bubble = (page: Page, i: number) => panels(page).nth(i).getByRole('button')
const boat = (page: Page) => page.getByTestId('comic-boat')
const stamps = (page: Page) => page.getByTestId('panel-stamp')

/** Lets line i play until it is reading, then ends it, as the browser would. */
async function hearToEnd(page: Page, i: number) {
  await expect(panels(page).nth(i).locator('[data-active="true"]')).toHaveCount(1)
  await endCurrent(page)
}

test('the four panels form the comic page, each line in its bubble with its แม่กน words in red; the boat waits under the first', async ({ page }) => {
  await open(page)
  await expect(page.getByRole('list', { name: 'การ์ตูนแม่กน' })).toBeAttached()
  await expect(panels(page)).toHaveCount(4)
  for (const [i, line] of LINES.entries()) {
    await expect(bubble(page, i)).toHaveText(line.text.replaceAll(' ', ''))
    await expect(panels(page).nth(i).locator('[data-target]')).toHaveText(line.words)
    await expect(panels(page).nth(i).locator('[data-target]').first()).toHaveCSS('color', 'rgb(169, 49, 31)')
    await expect(panels(page).nth(i).locator('img')).toHaveAttribute('src', `/assets/comic/kon-panel-${i + 1}.webp`)
  }
  // A 2×2 page.
  const boxes = await Promise.all([0, 1, 2, 3].map((i) => stageBox(page, panels(page).nth(i))))
  expect(Math.round(boxes[0]!.top)).toBe(Math.round(boxes[1]!.top))
  expect(boxes[2]!.top).toBeGreaterThan(boxes[0]!.bottom)
  await expect(boat(page)).toHaveAttribute('data-at', '0')
})

test('ฟังครูอ่าน reads each line in turn, the boat paddling to the next panel between lines, and stamps each panel heard', async ({ page }) => {
  await open(page)
  await button(page, 'ฟังครูอ่าน').click()
  for (let i = 0; i < 4; i++) {
    await expect.poll(async () => (await audioLog(page)).at(-1)).toBe(clip(i + 1))
    await expect(boat(page)).toHaveAttribute('data-at', String(i))
    await expect(panels(page).nth(i)).toHaveAttribute('data-current', 'true')
    await expect(panels(page).nth(i).locator('[data-active="true"]')).toHaveCount(1)
    if (i === 0) await expect(button(page, 'หยุดอ่าน')).toBeVisible()
    await endCurrent(page)
    await expect(stamps(page)).toHaveCount(i + 1)
  }
  await expect(page.getByTestId('stamp-count')).toHaveText(/เก่งมาก! ครบ 4 ภาพ/)
  await expect(button(page, 'ฟังครูอ่าน')).toBeVisible()
})

test('the boat waits in the lane below the panel being read, never over its bubble or another panel', async ({ page }) => {
  await open(page)
  for (const i of [3, 1, 2, 0]) {
    await bubble(page, i).click()
    await expect(boat(page)).toHaveAttribute('data-at', String(i))
    await waitUntilStill(boat(page))
    const her = await stageBox(page, boat(page))
    const panel = await stageBox(page, panels(page).nth(i))
    expect(her.top).toBeGreaterThanOrEqual(panel.bottom - 1)
    expect(Math.abs(her.cx - panel.cx)).toBeLessThan(4)
    for (let j = 0; j < 4; j++) expect(overlaps(her, await stageBox(page, panels(page).nth(j)))).toBe(false)
  }
})

test('อ่านตามทีละวรรค walks one line at a time; หยุดอ่าน stops ฟังครูอ่าน', async ({ page }) => {
  await open(page)
  await button(page, 'อ่านตามทีละวรรค').click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe(clip(1))
  await expect(page.getByText('วรรค 1/4')).toBeVisible()
  await expect(button(page, 'วรรคก่อนหน้า')).toBeDisabled()
  await button(page, 'วรรคถัดไป').click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe(clip(2))
  await expect(panels(page).nth(1)).toHaveAttribute('data-current', 'true')
  await expect(boat(page)).toHaveAttribute('data-at', '1')
  // Step mode never runs on by itself.
  await endCurrent(page)
  await expect(page.getByText('วรรค 2/4')).toBeVisible()

  await button(page, 'ฟังครูอ่าน').click()
  await expect(button(page, 'อ่านตามทีละวรรค')).toBeVisible()
  await button(page, 'หยุดอ่าน').click()
  await expect(button(page, 'ฟังครูอ่าน')).toBeVisible()
})

test('recording a line stamps its panel; play-back and อัดใหม่ work as on แม่กง', async ({ page }) => {
  await open(page)
  await bubble(page, 2).click()
  await button(page, 'ลองอ่านเอง').click()
  await expect(button(page, 'หยุดบันทึก')).toBeVisible()
  await button(page, 'หยุดบันทึก').click()
  await expect(panels(page).nth(2).getByTestId('panel-stamp')).toBeVisible()
  await expect(stamps(page)).toHaveCount(1)
  await button(page, 'ฟังเสียงตัวเอง').click()
  await expect.poll(async () => (await audioLog(page)).some((e) => /^play:https?:/.test(e))).toBe(true)
  await button(page, 'อัดใหม่').click()
  await expect(button(page, 'ลองอ่านเอง')).toBeVisible()
})

test('if the microphone is refused, the alert shows and hearing a line still stamps it', async ({ page }) => {
  await open(page, 'deny')
  await button(page, 'ลองอ่านเอง').click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  await bubble(page, 0).click()
  await hearToEnd(page, 0)
  await expect(stamps(page)).toHaveCount(1)
})

test('the Game uses only the แม่กน Kit: nothing from another Lesson', async ({ page }) => {
  await open(page)
  await bubble(page, 0).click()
  await hearToEnd(page, 0)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const one of await panels(page).all()) await expect(one).toHaveClass(/bamboo-tray/)
  for (const name of ['ฟังครูอ่าน', 'อ่านตามทีละวรรค', 'ลองอ่านเอง']) await expect(button(page, name)).toHaveClass(/plank-button/)
  await expect(stamps(page).locator('[data-art="ngob"]')).toBeVisible()
})

for (const viewport of VIEWPORTS) {
  test(`Step 7 at ${viewport.width}×${viewport.height}: the quiet canal fills the window, nothing crosses a panel, all big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kon-canal', viewport)
    await button(page, 'อ่านตามทีละวรรค').click()
    const controls = [button(page, 'ฟังครูอ่าน'), button(page, 'วรรคก่อนหน้า'), button(page, 'วรรคถัดไป'), button(page, 'ลองอ่านเอง'), ...[0, 1, 2, 3].map((i) => bubble(page, i))]
    if (viewport.height === 390) for (const c of controls) await expectTapTarget(c)
    await expectNoDrifterCrosses(page, [panels(page), ...controls])
    const chrome = await Promise.all(
      [...['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => page.getByRole('link', { name })), page.getByRole('button', { name: /เพลง$/ }), page.getByText('ขั้น 7/10'), page.getByRole('heading', { level: 1 }).locator('../..')].map((c) =>
        stageBox(page, c),
      ),
    )
    for (const target of [...(await panels(page).all()), ...controls, page.getByTestId('stamp-count')]) {
      const box = await stageBox(page, target)
      for (const c of chrome) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: every control is named, a bubble reads its line on Enter, the boat is decoration', async ({ page }) => {
  await open(page)
  await expect(boat(page)).toHaveAttribute('aria-hidden', 'true')
  await bubble(page, 1).focus()
  expect(parseFloat(await bubble(page, 1).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe(clip(2))
  await hearToEnd(page, 1)
  await expect(panels(page).nth(1)).toContainText('ได้ตราแล้ว')
})

test('under reduced motion the boat jumps from panel to panel and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await panels(page).first().waitFor()
  await expectSceneStill(page)
  await bubble(page, 3).click()
  const panel = await stageBox(page, panels(page).nth(3))
  await expect.poll(async () => Math.abs((await stageBox(page, boat(page))).cx - panel.cx), { timeout: 300 }).toBeLessThan(4)
  await hearToEnd(page, 3)
  await expect(stamps(page)).toHaveCSS('transform', /matrix/)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

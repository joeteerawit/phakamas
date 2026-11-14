import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'
import { expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { gapBetween, overlaps, stageBox } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 7, read the rain away (#78). src/lessons/mae-kop.ts: the four lines and their แม่กบ words.
const LINES = [
  { text: 'ฝนตกแล้ว กบออกมาอาบฝน', words: ['กบ', 'อาบ'] },
  { text: 'น้องกบพับเรือ ให้ลอยไป', words: ['พับ'] },
  { text: 'ลื่นล้ม แต่ไม่เจ็บ', words: ['เจ็บ'] },
  { text: 'ฝนหยุด วาดภาพสายรุ้ง', words: ['ภาพ'] },
]

async function open(page: Page, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, 7, {}, 'mae-kop')
}

const panels = (page: Page) => page.getByTestId('comic-panel')
const bubble = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ฟังวรรคที่ ${n}:`) })
const record = (page: Page, n: number) => page.getByRole('button', { name: `อ่านวรรคที่ ${n}`, exact: true })
const stop = (page: Page, n: number) => page.getByRole('button', { name: `หยุดบันทึกวรรคที่ ${n}`, exact: true })
const listenAll = (page: Page) => page.getByRole('button', { name: 'ฟังครูอ่าน' })

async function readPanel(page: Page, n: number) {
  await record(page, n).click()
  await stop(page, n).click()
  await expect(panels(page).nth(n - 1)).toHaveAttribute('data-read', 'true')
}

test('the four lines sit in the speech bubbles of a 4-panel comic, their แม่กบ words in raincoat yellow; rain falls on each picture', async ({ page }) => {
  await open(page)
  await expect(panels(page)).toHaveCount(4)
  for (const [i, line] of LINES.entries()) {
    await expect(bubble(page, i + 1)).toHaveAccessibleName(`ฟังวรรคที่ ${i + 1}: ${line.text}`)
    const marked = panels(page).nth(i).locator('[data-rhyme]')
    await expect(marked).toHaveText(line.words)
    for (const one of await marked.all()) await expect(one).toHaveCSS('background-color', 'rgb(255, 204, 0)')
    await expect(panels(page).nth(i).getByTestId('panel-rain')).toBeAttached()
  }
  // The rain stays inside the picture, clear of the bubble.
  for (let i = 0; i < 4; i++) {
    const rain = await stageBox(page, panels(page).nth(i).getByTestId('panel-picture'))
    expect(overlaps(rain, await stageBox(page, bubble(page, i + 1)))).toBe(false)
  }
})

test('ฟังครูอ่าน reads the lines in order with the current line highlighted; a bubble reads just its line', async ({ page }) => {
  await open(page)
  await listenAll(page).click()
  for (let i = 0; i < 4; i++) {
    await expect.poll(async () => (await audioLog(page)).at(-1)).toBe(`play:/assets/audio/rhyme/mae-kop/line-0${i + 1}.mp3`)
    await expect(panels(page).nth(i)).toHaveAttribute('data-current', 'true')
    await expect(panels(page).nth(i).locator('[data-active]')).toHaveCount(1)
    await endCurrent(page)
  }
  await expect(page.locator('[data-current]')).toHaveCount(0)
  await bubble(page, 3).click()
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/rhyme/mae-kop/line-03.mp3')
  await endCurrent(page)
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/rhyme/mae-kop/line-03.mp3')
})

test('reading a line into its own record button stops that panel\'s rain and brightens its sky; all four bring the sun out', async ({ page }) => {
  await open(page)
  const sky = await panels(page).nth(1).getByTestId('panel-picture').evaluate((el) => getComputedStyle(el).backgroundImage)
  await record(page, 2).click()
  await expect(stop(page, 2)).toBeVisible()
  await expect.poll(() => audioLog(page)).toContain('record:start')
  await stop(page, 2).click()
  await expect(panels(page).nth(1)).toHaveAttribute('data-read', 'true')
  await expect(panels(page).nth(1).getByTestId('panel-rain')).toHaveCount(0)
  await expect(panels(page).nth(1).getByTestId('panel-picture')).not.toHaveCSS('background-image', sky)
  await expect(panels(page).nth(0).getByTestId('panel-rain')).toBeAttached()
  await expect(page.getByTestId('read-count')).toHaveText('อ่านแล้ว 1/4')
  await expect(page.getByTestId('panel-sun')).toHaveCount(0)
  for (const n of [1, 3, 4]) await readPanel(page, n)
  await expect(page.getByTestId('panel-sun')).toBeVisible()
  await expect(page.getByTestId('read-count')).toContainText('เก่งมาก! ฝนหยุดแล้ว')
})

test('teacher audio stops a recording without counting it as read', async ({ page }) => {
  await open(page)
  await record(page, 1).click()
  await expect(stop(page, 1)).toBeVisible()
  await listenAll(page).click()
  await expect(record(page, 1)).toBeVisible()
  await expect(panels(page).nth(0)).not.toHaveAttribute('data-read')
})

test('if the microphone is refused, each panel offers ฟังแล้วนับ: hearing its line to the end counts', async ({ page }) => {
  await open(page, 'deny')
  await record(page, 1).click()
  await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  for (let n = 1; n <= 4; n++) {
    await page.getByRole('button', { name: `ฟังแล้วนับวรรคที่ ${n}` }).click()
    // Once it is playing (its words light up), it ends.
    await expect(panels(page).nth(n - 1).locator('[data-active]')).toHaveCount(1)
    await endCurrent(page)
    await expect(panels(page).nth(n - 1)).toHaveAttribute('data-read', 'true')
  }
  await expect(page.getByTestId('panel-sun')).toBeVisible()
})

test('the comic uses only the แม่กบ Kit on its plain gutter: nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page)
  await readPanel(page, 1)
  expect(await otherLook(wholeStage(page))).toEqual([])
  await expect(listenAll(page)).toHaveClass(/vinyl-button/)
  await expect(page.getByTestId('stage-scene')).toHaveAttribute('data-scene', 'kop-gutter')
})

for (const viewport of VIEWPORTS) {
  test(`Step 7 at ${viewport.width}×${viewport.height}: the panels fill the window clear of the chrome, every button big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page)
    await expectSceneFills(page, 'kop-gutter', viewport)
    const boxes = await Promise.all((await panels(page).all()).map((p) => stageBox(page, p)))
    for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) expect(gapBetween(a, b)).toBeGreaterThan(20)
    const chrome = await Promise.all(
      [
        page.getByRole('heading', { level: 1 }).locator('..'),
        page.getByText('ขั้น 7/10'),
        page.getByRole('button', { name: /เพลง$/ }),
        ...['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => page.getByRole('link', { name })),
        listenAll(page),
        page.getByTestId('read-count'),
      ].map((c) => stageBox(page, c)),
    )
    for (const [i, a] of chrome.entries()) {
      for (const p of boxes) expect(overlaps(a, p), `chrome ${i}`).toBe(false)
      for (const b of chrome.slice(i + 1)) expect(overlaps(a, b), `chrome ${i}`).toBe(false)
    }
    if (viewport.height === 390) for (const target of [listenAll(page), ...[1, 2, 3, 4].flatMap((n) => [record(page, n), bubble(page, n)])]) await expectTapTarget(target)
  })
}

test('keyboard and screen reader: the comic is a list of four panels whose bubbles and record buttons are named and work from the keyboard', async ({ page }) => {
  await open(page)
  await expect(page.getByRole('list', { name: 'การ์ตูนแม่กบ' }).getByRole('listitem')).toHaveCount(4)
  await bubble(page, 2).focus()
  expect(parseFloat(await bubble(page, 2).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await audioLog(page)).at(-1)).toBe('play:/assets/audio/rhyme/mae-kop/line-02.mp3')
  await record(page, 2).focus()
  await page.keyboard.press('Enter')
  await expect(stop(page, 2)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('วรรคที่ 2 อ่านแล้ว')).toBeAttached()
})

test('under reduced motion the rain stands still, and the highlight, brightening and sun still show', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await panels(page).first().waitFor()
  await expectSceneStill(page)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
  for (const n of [1, 2, 3, 4]) await readPanel(page, n)
  await expect(page.getByTestId('panel-sun')).toBeVisible()
  await expect(page.getByTestId('panel-sun')).toHaveCSS('transform', 'none')
  await listenAll(page).click()
  await expect(panels(page).nth(0)).toHaveAttribute('data-current', 'true')
})

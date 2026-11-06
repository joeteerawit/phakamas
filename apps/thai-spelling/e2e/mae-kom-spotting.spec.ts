import { expect, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'
import { expectNoDrifterCrosses, expectSceneFillsWithCornerButtons, expectSceneStill } from './windyScene.js'

// src/lessons/mae-kom.ts: Step 4's two sets and their spellings.
const SETS = [
  [
    ['ร่ม', 'รอ-โอะ-มอ-รม-ไม้เอก-ร่ม'],
    ['ลม', 'ลอ-โอะ-มอ-ลม'],
    ['ส้ม', 'สอ-โอะ-มอ-สม-ไม้โท-ส้ม'],
  ],
  [
    ['นม', 'นอ-โอะ-มอ-นม'],
    ['ผม', 'ผอ-โอะ-มอ-ผม'],
    ['ชาม', 'ชอ-อา-มอ-ชาม'],
  ],
] as const
const RED = 'rgb(255, 49, 49)'
const INK = 'rgb(17, 17, 17)'

const sign = (page: Page, word: string) => page.getByRole('button', { name: `ฟังคำว่า ${word}` })
const pill = (page: Page, word: string) => page.getByTestId(`spelling-${word}`)
const setButton = (page: Page, n: number) => page.getByRole('button', { name: `ชุดคำที่ ${n}` })
const signs = (page: Page) => page.getByTestId('bus-stop')

test('the three words sit inside the blank panels of three bus-stop signs, the final ม red in a black signal head', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 4, {}, 'mae-kom')
  await expect(page.getByRole('region', { name: 'คำในมาตราแม่กม' })).toBeVisible()
  await expect(signs(page)).toHaveCount(3)
  for (const img of await signs(page).all()) await expect(img).toHaveAttribute('src', '/assets/comic/kom-bus-stop.webp')

  for (const [i, [word, spelling]] of SETS[0].entries()) {
    const art = await stageBox(page, signs(page).nth(i))
    // The panel is 32–392 × 59–427 of the 425×1200 art.
    const x = (px: number) => art.left + (px / 425) * art.width
    const y = (px: number) => art.top + (px / 1200) * art.height
    for (const part of [sign(page, word), sign(page, word).locator('img').first(), sign(page, word).getByText(word.at(-1)!, { exact: true })]) {
      const box = await stageBox(page, part)
      expect(box.left, word).toBeGreaterThanOrEqual(x(32) - 1)
      expect(box.right, word).toBeLessThanOrEqual(x(392) + 1)
      expect(box.top, word).toBeGreaterThanOrEqual(y(59) - 1)
      expect(box.bottom, word).toBeLessThanOrEqual(y(427) + 1)
    }
    const light = sign(page, word).getByTestId('final-light')
    await expect(light).toHaveText('ม')
    await expect(light).toHaveCSS('color', RED)
    await expect(light).toHaveCSS('background-color', INK)
    await expect(pill(page, word)).toHaveText(spelling)
    // The spelling hangs on the sign's pole, under its panel.
    const spellingBox = await stageBox(page, pill(page, word))
    expect(spellingBox.top).toBeGreaterThan(y(427))
    expect(Math.abs(spellingBox.cx - art.cx)).toBeLessThanOrEqual(2)
  }
  // The middle sign is centred on the window.
  expect(Math.abs((await stageBox(page, sign(page, 'ลม'))).cx - 960)).toBeLessThanOrEqual(2)
})

test("แม่กง's Step 4 is still named for แม่กง", async ({ page }) => {
  await open(page, 4)
  await expect(page.getByRole('region', { name: 'คำในมาตราแม่กง' })).toBeVisible()
})

test('the set switch puts set 2 on the same signs', async ({ page }) => {
  await open(page, 4, {}, 'mae-kom')
  await expect(setButton(page, 1)).toHaveAttribute('aria-pressed', 'true')
  await setButton(page, 2).click()
  await expect(setButton(page, 2)).toHaveAttribute('aria-pressed', 'true')
  for (const [word, spelling] of SETS[1]) {
    await expect(sign(page, word)).toBeVisible()
    await expect(pill(page, word)).toHaveText(spelling)
  }
  await expect(sign(page, 'ร่ม')).toHaveCount(0)
  await expect(signs(page)).toHaveCount(3)
})

test('tapping a sign plays its slow spelling and sweeps it part by part, as on แม่กง', async ({ page }) => {
  await page.clock.install()
  await open(page, 4, {}, 'mae-kom')
  await sign(page, 'ส้ม').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/spelling/som.mp3'])
  await expect(sign(page, 'ส้ม').getByTestId('sound-waves')).toBeVisible()
  const active = pill(page, 'ส้ม').locator('[data-active]')
  await expect(active).toHaveText('สอ')
  await expect(sign(page, 'ส้ม')).toHaveAttribute('data-glowing', 'true')
  await page.clock.runFor(600)
  await expect(active).toHaveText('โอะ')
  await page.clock.runFor(4_000)
  await expect(active).toHaveCount(0)
  await expect(sign(page, 'ส้ม')).not.toHaveAttribute('data-glowing', 'true')
})

test('ฟังคำอธิบาย plays the แม่กม explanation, with a Thai speech fallback', async ({ page }) => {
  await open(page, 4, { mp3: 'missing' }, 'mae-kom')
  await page.getByRole('button', { name: 'ฟังคำอธิบาย' }).click()
  await expect.poll(() => audioLog(page)).toEqual([
    'play:/assets/audio/explanations/mae-kom.mp3',
    expect.stringMatching(/^speak:.*แม่กม.*\|th-TH$/),
  ])
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`Step 4 at ${viewport.width}×${viewport.height}: the Scene fills the window, buttons in the corners, nothing moving crosses a sign`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 4, {}, 'mae-kom')
    await waitUntilStill(sign(page, 'ร่ม'))
    await expectSceneFillsWithCornerButtons(page, viewport)

    const step = page.getByRole('main')
    if (viewport.height === 390) {
      for (const target of await step.getByRole('button').all()) await expectTapTarget(target)
      for (const name of ['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป']) await expectTapTarget(page.getByRole('link', { name }))
    }
    await expectNoDrifterCrosses(page, [step.getByRole('button'), step.locator('[data-testid^="spelling-"]')])
    // A two-line spelling splits evenly, never leaving a lone part on the second line.
    const lines = await pill(page, 'ลม').evaluate((el) => [...el.querySelectorAll(':scope > span > span')].map((s) => s.getBoundingClientRect().top))
    expect(lines.filter((top) => Math.round(top) === Math.round(lines.at(-1)!)).length).toBeGreaterThan(1)
  })
}

test('under reduced motion the Scene is still and the red light does not pulse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 4, {}, 'mae-kom')
  await expect(sign(page, 'ร่ม')).toBeVisible()
  await expectSceneStill(page)
  const moving = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  await sign(page, 'ร่ม').click()
  await expect(sign(page, 'ร่ม')).toHaveAttribute('data-glowing', 'true')
  expect(await moving()).toBe(0)
  await setButton(page, 2).click()
  await expect(sign(page, 'นม')).toBeVisible()
  expect(await moving()).toBe(0)
})

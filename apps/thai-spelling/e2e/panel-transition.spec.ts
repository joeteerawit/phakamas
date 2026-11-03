import { expect, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'

// #36: entering or leaving Step 1 or Step 5 turns a comic panel; other Step changes keep the slide.
type Sample = { panel: number | null; content: number[]; opacity: number[] }

/** Samples every frame while `act` runs: the panel's horizontal offset (null when absent) and each Step content wrapper's. */
async function sampleChange(page: Page, act: () => Promise<void>, ms = 900) {
  await page.evaluate(() => {
    const w = window as unknown as { samples: Sample[]; sampling: boolean }
    w.samples = []
    w.sampling = true
    const x = (el: Element) => {
      const transform = getComputedStyle(el).transform
      return transform === 'none' ? 0 : new DOMMatrix(transform).m41
    }
    const tick = () => {
      const panel = document.querySelector('[data-testid="panel-transition"] [data-panel]')
      const contents = [...document.querySelectorAll('[data-testid="step-content"]')]
      w.samples.push({
        panel: panel ? panel.getBoundingClientRect().x : null,
        content: contents.map(x),
        opacity: contents.map((el) => Number(getComputedStyle(el).opacity)),
      })
      if (w.sampling) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await act()
  await page.waitForTimeout(ms)
  return page.evaluate(() => {
    const w = window as unknown as { samples: Sample[]; sampling: boolean }
    w.sampling = false
    return w.samples
  })
}

const next = (page: Page) => page.getByRole('link', { name: 'ถัดไป' })
const back = (page: Page) => page.getByRole('link', { name: 'ย้อนกลับ' })
// The cover's ▶ reads เรียนต่อ once the Session has moved past Step 1.
const play = (page: Page) => page.getByRole('link', { name: /^(เริ่มเรียน|เรียนต่อ)/ })
const home = (page: Page) => page.getByRole('link', { name: 'กลับไปขั้นแรก' })
const badge = (page: Page) => page.getByText(/^ขั้น \d+\/10$/)
const panel = (page: Page) => page.getByTestId('panel-transition')
const choice = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })

async function settle(page: Page, step: number) {
  await expect(page).toHaveURL(new RegExp(`/lesson/mae-kong/${step}$`))
  await expect(page.getByTestId('step-content')).toHaveCount(1)
  await expect(panel(page)).toHaveCount(0)
}

const PANEL_CHANGES = [
  { from: 1, to: 2, via: 'เริ่มเรียน', act: play, travel: 1 },
  { from: 2, to: 1, via: 'Back', act: back, travel: -1 },
  { from: 4, to: 5, via: 'Next', act: next, travel: 1 },
  { from: 5, to: 6, via: 'Next', act: next, travel: 1 },
  { from: 6, to: 5, via: 'Back', act: back, travel: -1 },
  { from: 5, to: 4, via: 'Back', act: back, travel: -1 },
  { from: 3, to: 1, via: 'Home', act: home, travel: -1 },
]

for (const { from, to, via, act, travel } of PANEL_CHANGES) {
  test(`Step ${from} → ${to} (${via}) turns a comic panel instead of sliding`, async ({ page }) => {
    await open(page, from)
    await settle(page, from)
    const samples = await sampleChange(page, () => act(page).click())
    await settle(page, to)

    const panelAt = samples.flatMap((s) => (s.panel === null ? [] : [s.panel]))
    expect(panelAt.length, 'the panel was drawn').toBeGreaterThan(5)
    // The panel sweeps across in the travel direction: in from the right going forward, from the left going back.
    expect(Math.sign(panelAt[0]! - panelAt.at(-1)!)).toBe(travel)
    // The Step content itself does not slide.
    expect(samples.every((s) => s.content.every((x) => Math.abs(x) < 1))).toBe(true)
  })
}

for (const [from, to] of [
  [2, 3],
  [3, 4],
  [6, 7],
  [7, 6],
] as const) {
  test(`Step ${from} → ${to} keeps the slide and draws no panel`, async ({ page }) => {
    await open(page, from)
    await settle(page, from)
    const samples = await sampleChange(page, () => (to > from ? next(page) : back(page)).click())
    await settle(page, to)
    expect(samples.every((s) => s.panel === null)).toBe(true)
    expect(samples.some((s) => s.content.some((x) => Math.abs(x) > 10))).toBe(true)
  })
}

test('controls work as soon as the new Step is shown', async ({ page }) => {
  await open(page, 1)
  await play(page).click()
  // No waiting for the panel to finish: the first tap on the new Step lands.
  await page.getByRole('button', { name: /^ลิง / }).click()
  await expect(page.getByRole('button', { name: /^ลิง / })).toContainText('กำลังเล่น')

  await page.goto('/lesson/mae-kong/4')
  await settle(page, 4)
  await next(page).click()
  await choice(page, 'ลิง').click()
  await expect(choice(page, 'ลิง')).toHaveAttribute('aria-pressed', 'true')

  await next(page).click()
  const chip = page.getByRole('group', { name: 'คลังคำ' }).getByRole('button', { name: 'ลิง', exact: true })
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
})

test('rapid taps on Next and Back never strand the student between Steps', async ({ page }) => {
  await open(page, 4)
  await settle(page, 4)
  const at = async (name: string) => {
    const box = (await page.getByRole('link', { name }).boundingBox())!
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }
  const [nextAt, backAt] = [await at('ถัดไป'), await at('ย้อนกลับ')]
  // Taps land mid-panel, while the old Step is still leaving.
  for (const point of [nextAt, backAt, nextAt, nextAt, backAt, nextAt]) {
    await page.mouse.click(point.x, point.y)
    await page.waitForTimeout(70)
  }
  await settle(page, 6)
  await expect(badge(page)).toHaveText('ขั้น 6/10')
  await expect(page.getByTestId('stage-scene')).toHaveCSS('background-image', /garden\.webp/)
  const chip = page.getByRole('group', { name: 'คลังคำ' }).getByRole('button', { name: 'ลิง', exact: true })
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')

  // Straight through Step 5 and back again.
  for (const point of [backAt, backAt, nextAt, nextAt, backAt]) {
    await page.mouse.click(point.x, point.y)
    await page.waitForTimeout(40)
  }
  await settle(page, 5)
  await expect(badge(page)).toHaveText('ขั้น 5/10')
  await expect(page.getByTestId('stage-scene')).toHaveCSS('background-image', /step5-scene\.webp/)
  await choice(page, 'รัง').click()
  await expect(choice(page, 'รัง')).toHaveAttribute('aria-pressed', 'true')
})

test('rapid taps on the cover ▶ and Back end on one shown Step', async ({ page }) => {
  await open(page, 1)
  await settle(page, 1)
  await play(page).click()
  await back(page).click()
  await play(page).click()
  await settle(page, 2)
  await expect(page.getByRole('button', { name: /^ลิง / })).toBeVisible()
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  for (const { from, to, act } of [PANEL_CHANGES[0]!, PANEL_CHANGES[2]!, PANEL_CHANGES[4]!]) {
    test(`Step ${from} → ${to} has no panel, only the fade`, async ({ page }) => {
      await open(page, from)
      await settle(page, from)
      const samples = await sampleChange(page, () => act(page).click())
      await settle(page, to)
      expect(samples.every((s) => s.panel === null)).toBe(true)
      expect(samples.every((s) => s.content.every((x) => x === 0))).toBe(true)
      expect(samples.some((s) => s.opacity.some((o) => o < 1))).toBe(true)
    })
  }
})

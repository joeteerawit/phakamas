import { expect, type Locator, type Page, test } from '@playwright/test'
import { audioLog, open } from './audioStub.js'
import { overlaps, stageBox, type StageBox, waitUntilStill } from './stageBox.js'

// #35: game-like check feedback on Step 5.
const MAE_KONG = ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง']
const DISTRACTORS = ['งู', 'บ้าน', 'ก้ม', 'เงา']
const PRAISE = 'play:/assets/audio/feedback/keng-mak.mp3'

const choice = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const restart = (page: Page) => page.getByRole('button', { name: 'เริ่มใหม่' })
const toast = (page: Page) => page.getByRole('status')
const celebration = (page: Page) => page.getByTestId('celebration')
const burst = (page: Page) => page.getByTestId('comic-burst')
const reaction = (page: Page) => page.getByTestId('mascot-reaction')
const counter = (page: Page) => page.getByTestId('star-counter')

async function fullMarks(page: Page) {
  for (const word of MAE_KONG) await choice(page, word).click()
}
async function partialMarks(page: Page) {
  for (const word of MAE_KONG.slice(0, 4)) await choice(page, word).click()
}

/** Samples, every frame for `ms`, the Step's horizontal offset (the shake) and the flying Stars' centre in client px. */
async function sampleEffects(page: Page, act: () => Promise<void>, ms: number) {
  await page.evaluate(() => {
    const w = window as unknown as { fx: { shake: number; stars: { x: number; y: number } | null }[]; sampling: boolean }
    w.fx = []
    w.sampling = true
    const tick = () => {
      const main = document.querySelector('main')!
      const transform = getComputedStyle(main).transform
      const stars = document.querySelector('[data-testid="celebration-stars"]')?.getBoundingClientRect()
      w.fx.push({
        shake: transform === 'none' ? 0 : new DOMMatrix(transform).m41,
        stars: stars ? { x: stars.x + stars.width / 2, y: stars.y + stars.height / 2 } : null,
      })
      if (w.sampling) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await act()
  await page.waitForTimeout(ms)
  return page.evaluate(() => {
    const w = window as unknown as { fx: { shake: number; stars: { x: number; y: number } | null }[]; sampling: boolean }
    w.sampling = false
    return w.fx
  })
}

/** The reaction Mascot's stage box sampled for `ms`, so its jump is checked at every height. */
async function mascotBoxes(page: Page, ms: number) {
  const boxes: StageBox[] = []
  const end = Date.now() + ms
  // The drawn Mascot, which jumps or wiggles inside the reaction's box.
  const mascot = reaction(page).locator('img')
  while (Date.now() < end) {
    const box = await mascot.boundingBox()
    if (box && box.width > 0) boxes.push(await stageBox(page, mascot))
  }
  expect(boxes.length, 'Mascot was sampled').toBeGreaterThan(3)
  return boxes
}

async function expectUncovered(page: Page, boxes: StageBox[], targets: Locator[]) {
  for (const target of targets) {
    const box = await stageBox(page, target)
    const name = (await target.innerText()).trim().split('\n')[0]
    expect(boxes.some((at) => overlaps(at, box)), `Mascot covers ${name}`).toBe(false)
  }
}

test('full marks plays the burst, shake, Star flight and cheer pose; the burst is real Thai text', async ({ page }) => {
  await open(page, 5)
  await fullMarks(page)
  const counterBox = (await counter(page).boundingBox())!
  const samples = await sampleEffects(page, () => check(page).click(), 2200)

  // The burst's เก่งมาก! is live text in the heading font, not part of an image.
  await expect(burst(page)).toBeVisible()
  await expect(burst(page).getByText('เก่งมาก!', { exact: true })).toBeVisible()
  const font = await burst(page).getByText('เก่งมาก!', { exact: true }).evaluate((el) => getComputedStyle(el).fontFamily)
  expect(font).toMatch(/^"?Mali/)
  await expect(reaction(page)).toHaveAttribute('data-pose', 'cheer')
  await expect(reaction(page).locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-cheer\.webp$/)

  // A brief shake: the Step moves sideways, then settles.
  expect(samples.some((s) => Math.abs(s.shake) > 4), 'screen shakes').toBe(true)
  expect(samples.at(-1)!.shake).toBe(0)

  // The Stars fly up and left towards the Star counter.
  const stars = samples.flatMap((s) => (s.stars ? [s.stars] : []))
  const counterAt = { x: counterBox.x + counterBox.width / 2, y: counterBox.y + counterBox.height / 2 }
  const distance = (p: { x: number; y: number }) => Math.hypot(p.x - counterAt.x, p.y - counterAt.y)
  expect(stars.length).toBeGreaterThan(0)
  expect(Math.min(...stars.map(distance)), 'Stars reach the counter').toBeLessThan(distance(stars[0]!) * 0.4)

  await expect.poll(() => audioLog(page)).toContain(PRAISE)
  await expect(counter(page)).toContainText('3/9')
  await expect(toast(page)).toContainText('เก่งมาก! ได้ 12/12 คะแนน')
})

test('below full marks shows only the encouraging Mascot, and the score toast stays', async ({ page }) => {
  await open(page, 5)
  await partialMarks(page)
  const samples = await sampleEffects(page, () => check(page).click(), 1200)

  await expect(reaction(page)).toBeVisible()
  await expect(reaction(page)).toHaveAttribute('data-pose', 'encourage')
  await expect(reaction(page).locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-encourage\.webp$/)
  // No celebration, burst, Stars, confetti or shake.
  await expect(celebration(page)).toHaveCount(0)
  await expect(burst(page)).toHaveCount(0)
  await expect(page.getByTestId('confetti')).toHaveCount(0)
  expect(samples.every((s) => s.shake === 0 && s.stars === null)).toBe(true)

  await expect(toast(page)).toContainText('ได้ 8/12 คะแนน ลองใหม่นะ')
  await page.waitForTimeout(2000)
  await expect(toast(page)).toContainText('ได้ 8/12 คะแนน ลองใหม่นะ')
  // Stars are still earned as before: 8/12 is 2 Stars.
  await expect(counter(page)).toContainText('2/9')
})

for (const viewport of [
  { width: 844, height: 390 },
  { width: 1920, height: 1080 },
]) {
  for (const marks of ['full', 'partial'] as const) {
    test(`${marks} marks at ${viewport.width}×${viewport.height}: effects block no tap or sound, the Mascot covers no card or check button`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, 5)
      await (marks === 'full' ? fullMarks(page) : partialMarks(page))
      const cards = [...MAE_KONG, ...DISTRACTORS].map((word) => choice(page, word))
      await waitUntilStill(...cards)
      await check(page).click()
      await expect(reaction(page)).toBeVisible()
      const boxes = await mascotBoxes(page, 1000)

      // While the effect still plays, a card tap selects and speaks, and the buttons answer.
      const before = (await audioLog(page)).length
      await choice(page, 'เงา').click()
      await expect(reaction(page), 'the effect was still playing').toBeVisible()
      await expect(choice(page, 'เงา')).toHaveAttribute('aria-pressed', 'true')
      await expect.poll(async () => (await audioLog(page)).slice(before)).toContain('play:/assets/audio/vocabulary/ngao.mp3')
      expect(await audioLog(page)).toContain(PRAISE)

      await expectUncovered(page, boxes, [...cards, check(page), restart(page)])
      await restart(page).click()
      await expect(choice(page, 'เงา')).toHaveAttribute('aria-pressed', 'false')
    })
  }
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('full marks: no shake and no Star flight, and the results still show', async ({ page }) => {
    await open(page, 5)
    await fullMarks(page)
    const samples = await sampleEffects(page, () => check(page).click(), 2200)
    await expect(celebration(page)).toContainText('ได้ 3 ดาว')
    await expect(burst(page).getByText('เก่งมาก!', { exact: true })).toBeVisible()
    await expect(page.getByTestId('confetti')).toHaveCount(0)
    expect(samples.every((s) => s.shake === 0), 'no shake').toBe(true)
    const stars = samples.flatMap((s) => (s.stars ? [s.stars] : []))
    expect(stars.length).toBeGreaterThan(0)
    expect(stars.every((s) => Math.abs(s.x - stars[0]!.x) < 1 && Math.abs(s.y - stars[0]!.y) < 1), 'Stars stay put').toBe(true)
    for (const word of MAE_KONG) await expect(choice(page, word)).toHaveAttribute('data-result', 'right')
    await expect(toast(page)).toContainText('12/12')
    await expect(counter(page)).toContainText('3/9')
  })

  test('below full marks: the encouraging Mascot, the toast and the results show', async ({ page }) => {
    await open(page, 5)
    await partialMarks(page)
    await check(page).click()
    await expect(reaction(page)).toHaveAttribute('data-pose', 'encourage')
    await expect(choice(page, 'ค่าง')).toHaveAttribute('data-result', 'missed')
    await expect(toast(page)).toContainText('8/12')
  })
})

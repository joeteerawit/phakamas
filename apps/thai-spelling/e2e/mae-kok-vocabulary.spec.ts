import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'
import { expectNothingMovingCrosses, expectSceneFills, expectSceneStill, otherLook, running, VIEWPORTS, wholeStage } from './maeKok.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กก Step 2, water the plots (#87). src/lessons/mae-kok.ts: the six words in picture order.
const WORDS = ['นก', 'ผัก', 'ดอก', 'เด็ก', 'ปาก', 'แบก']
const SLUGS = ['nok', 'phak', 'dok', 'dek', 'pak', 'baek']

const plots = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const plot = (page: Page, i: number) => plots(page).nth(i)
const status = (page: Page) => page.getByRole('status').filter({ hasText: 'แปลง' })
const ahead = (page: Page) => page.getByRole('link', { name: 'ไปต่อ', exact: true })

async function water(page: Page, i: number) {
  await plot(page, i).click()
  await expect(plot(page, i)).toHaveAttribute('data-grown', 'true')
  // Let the word start playing before ending it, as a real clip would.
  await expect(plot(page, i)).toHaveAccessibleName(/กำลังเล่น$/)
  await endCurrent(page)
}

test('six bare soil plots sit in a row on the terrace, nothing grown yet and the gate shut', async ({ page }) => {
  await open(page, 2, {}, 'mae-kok')
  await expect(plots(page)).toHaveCount(6)
  const boxes = []
  for (let i = 0; i < 6; i++) {
    await expect(plot(page, i)).toHaveAccessibleName(`แปลงที่ ${i + 1} แตะรดน้ำ`)
    await expect(plot(page, i).getByTestId('plot-card')).toHaveCount(0)
    boxes.push(await stageBox(page, plot(page, i)))
  }
  for (let i = 1; i < 6; i++) {
    expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[0]!.top))
    expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
  }
  await expect(page.getByTestId('gate')).not.toHaveAttribute('data-open')
  await expect(ahead(page)).toHaveCount(0)
  await expect(status(page)).toHaveText('แตะแปลงดินให้น้องนกรดน้ำ (0/6)')
})

test('tapping a plot sends น้องนก above it to tip her can, then a seed packet rises with the picture and word, and the word plays', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 2, {}, 'mae-kok')
  for (const i of [3, 0, 5]) {
    await plot(page, i).click()
    await expect(page.getByTestId('watering-mascot')).toHaveAttribute('data-over', String(i))
    await expect(page.getByTestId('watering-can')).toHaveAttribute('data-tipping', 'true')
    await expect(page.getByTestId('water').last()).toBeVisible()
    // She stays in the lane above the row, clear of every packet and its word.
    const her = await stageBox(page, page.getByTestId('watering-mascot'))
    expect(her.bottom).toBeLessThanOrEqual((await stageBox(page, plot(page, i))).top)
    await expect(plot(page, i)).toHaveAttribute('data-grown', 'true')
    await expect.poll(() => audioLog(page)).toContain(`play:/assets/audio/vocabulary/${SLUGS[i]}.mp3`)
    const card = plot(page, i).getByTestId('plot-card')
    await expect(card).toHaveClass(/seed-packet/)
    await expect(card).toContainText(WORDS[i]!)
    await expect(card.locator(`img[src="/assets/comic/word-${SLUGS[i]}.webp"]`)).toHaveJSProperty('complete', true)
    await endCurrent(page)
  }
  await expect(status(page)).toHaveText('แตะแปลงดินให้น้องนกรดน้ำ (3/6)')
})

test('a grown packet plays its word again, stopping any other, with sound lines from its pot-horn speaker', async ({ page }) => {
  await open(page, 2, {}, 'mae-kok')
  await water(page, 0)
  await water(page, 4)
  await plot(page, 0).click()
  await expect(plot(page, 0)).toHaveAccessibleName('นก กำลังเล่น')
  await expect(plot(page, 0).getByTestId('plot-card')).toHaveAttribute('data-highlight', 'true')
  await expect(plot(page, 0).locator('[data-art="pot-horn"]')).toBeVisible()
  await expect(plot(page, 0).getByTestId('sound-waves')).toBeVisible()
  await plot(page, 4).click()
  await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/nok.mp3')
  await endCurrent(page)
  await expect(plot(page, 0)).toHaveAccessibleName('นก ฟังแล้ว')
})

test('the gate opens and ไปต่อ shows only once all six have grown; ไปต่อ finishes the Step', async ({ page }) => {
  await open(page, 2, {}, 'mae-kok')
  for (let i = 0; i < 6; i++) {
    await expect(ahead(page)).toHaveCount(0)
    await water(page, i)
  }
  await expect(status(page)).toHaveText('ผักขึ้นครบ 6 แปลงแล้ว ประตูเปิดแล้ว')
  await expect(page.getByTestId('gate')).toHaveAttribute('data-open', 'true')
  await expect(ahead(page)).toHaveClass(/pot-button/)
  await ahead(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/3$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page.getByRole('link', { name: /^ขั้น 2 / })).toHaveAttribute('data-done', 'true')
})

test('a missing mp3 falls back to Web Speech reading the Thai word', async ({ page }) => {
  await open(page, 2, { mp3: 'missing' }, 'mae-kok')
  await plot(page, 5).click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/baek.mp3', 'speak:แบก|th-TH'])
})

test('the Game uses only the แม่กก Kit: seed packets and a pot-horn speaker, nothing from another Lesson', async ({ page }) => {
  await open(page, 2, {}, 'mae-kok')
  for (let i = 0; i < 6; i++) await water(page, i)
  expect(await otherLook(wholeStage(page))).toEqual([])
})

for (const viewport of VIEWPORTS) {
  test(`Step 2 at ${viewport.width}×${viewport.height}: the terrace fills the window, nothing moving crosses a plot, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 2, {}, 'mae-kok')
    await expectSceneFills(page, 'kok-terrace', viewport)
    for (let i = 0; i < 6; i++) await water(page, i)
    await expect(ahead(page)).toBeVisible()
    await waitUntilStill(...(await page.getByTestId('plot-card').all()))
    if (viewport.height === 390) {
      for (let i = 0; i < 6; i++) await expectTapTarget(plot(page, i))
      for (const target of [ahead(page), ...['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => page.getByRole('link', { name }))]) await expectTapTarget(target)
    }
    await expectNothingMovingCrosses(page, [plots(page), ahead(page), status(page)])
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป', 'กลับไปแผนที่'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const box of [await stageBox(page, ahead(page)), await stageBox(page, status(page)), await stageBox(page, page.getByTestId('watering-mascot'))]) {
      for (const c of corners) expect(overlaps(box, c)).toBe(false)
    }
  })
}

test('keyboard and screen reader: each plot is a named button and Enter waters it', async ({ page }) => {
  await open(page, 2, {}, 'mae-kok')
  await expect(page.getByTestId('watering-mascot')).toHaveAttribute('aria-hidden', 'true')
  for (const [i, word] of WORDS.entries()) {
    await plot(page, i).focus()
    expect(parseFloat(await plot(page, i).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await expect(plot(page, i)).toHaveAttribute('data-grown', 'true')
    await expect(plot(page, i)).toHaveAccessibleName(`${word} กำลังเล่น`)
    await endCurrent(page)
    await expect(plot(page, i)).toHaveAccessibleName(`${word} ฟังแล้ว`)
  }
  await ahead(page).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kok\/3$/)
})

test('under reduced motion the packet appears at once, the can does not tip and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 2, {}, 'mae-kok')
  await plots(page).first().waitFor()
  await expectSceneStill(page)
  for (let i = 0; i < 6; i++) {
    await plot(page, i).click()
    await expect(plot(page, i)).toHaveAttribute('data-grown', 'true', { timeout: 300 })
    await expect(page.getByTestId('water')).toHaveCount(0)
    await expect(page.getByTestId('watering-can')).not.toHaveAttribute('data-tipping')
    await endCurrent(page)
  }
  await expect(ahead(page)).toBeVisible()
  await expect.poll(() => running(page)).toBe(0)
})

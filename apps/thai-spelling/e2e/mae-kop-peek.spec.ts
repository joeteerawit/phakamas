import { expect, type Page, test } from '@playwright/test'
import { audioLog, endCurrent, open } from './audioStub.js'
import { expectNoDropCrosses, expectSceneFills, expectSceneStill, otherLook, VIEWPORTS, wholeStage } from './maeKop.js'
import { overlaps, stageBox, waitUntilStill } from './stageBox.js'
import { expectTapTarget } from './tapTarget.js'

// แม่กบ Step 2, peek under the leaves (#73). src/lessons/mae-kop.ts: the six words in picture order.
const WORDS = ['กบ', 'พับ', 'จับ', 'ภาพ', 'เจ็บ', 'อาบ']
const SLUGS = ['kop', 'phap-fold', 'chap', 'phap', 'chep', 'ap']

const leaves = (page: Page) => page.getByRole('main').getByRole('list').getByRole('button')
const leaf = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word} `) })
const bankStatus = (page: Page) => page.getByRole('status').filter({ hasText: 'ใบบอน' })
const ahead = (page: Page) => page.getByRole('link', { name: 'ไปต่อ', exact: true })

async function liftAll(page: Page) {
  for (const word of WORDS) {
    await leaf(page, word).click()
    await endCurrent(page)
  }
}

test('six closed taro leaves stand along the bank, each with a raindrop on top and its word on a pebble', async ({ page }) => {
  await open(page, 2, {}, 'mae-kop')
  await expect(leaves(page)).toHaveCount(6)
  const boxes = []
  for (const [i, word] of WORDS.entries()) {
    const one = leaves(page).nth(i)
    await expect(one).toHaveAccessibleName(`${word} แตะฟังเสียง`)
    await expect(one).not.toHaveAttribute('data-lifted')
    await expect(one.getByTestId('leaf-drop')).toBeVisible()
    await expect(one.getByTestId('leaf-pocket').locator('img')).toHaveCount(0)
    await expect(one).toContainText(word)
    boxes.push(await stageBox(page, one))
  }
  // One row, left to right in word order.
  for (let i = 1; i < 6; i++) {
    expect(Math.round(boxes[i]!.top)).toBe(Math.round(boxes[0]!.top))
    expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
  }
  await expect(page.getByTestId('ahead-stone')).toHaveCount(0)
  await expect(ahead(page)).toHaveCount(0)
  await expect(bankStatus(page)).toHaveText('แตะใบบอนเพื่อดูภาพข้างใต้ (0/6)')
})

test('tapping a leaf tips its drop off, lifts the leaf to show the picture underneath and plays the word', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page, 2, {}, 'mae-kop')
  for (const i of [3, 0, 5]) {
    const one = leaves(page).nth(i)
    const closed = await stageBox(page, one.getByTestId('taro-leaf'))
    await one.click()
    await expect.poll(() => audioLog(page)).toContain(`play:/assets/audio/vocabulary/${SLUGS[i]}.mp3`)
    await expect(one).toHaveAttribute('data-lifted', 'true')
    await expect(one.getByTestId('leaf-drop')).toHaveCount(0)
    await expect(one.locator(`img[src="/assets/comic/word-${SLUGS[i]}.webp"]`)).toHaveJSProperty('complete', true)
    // The leaf rises off the pocket, up and away from the pebble below.
    await waitUntilStill(one.getByTestId('taro-leaf'))
    const up = await stageBox(page, one.getByTestId('taro-leaf'))
    expect(up.cy).toBeLessThan(closed.cy - 100)
    expect(up.bottom).toBeLessThan((await stageBox(page, one.getByText(WORDS[i]!, { exact: true }))).top)
  }
  await expect(bankStatus(page)).toHaveText('แตะใบบอนเพื่อดูภาพข้างใต้ (3/6)')
  await expect(leaves(page).nth(1)).not.toHaveAttribute('data-lifted')
})

test('the stones rise and ไปต่อ shows only once all six are lifted; ไปต่อ finishes the Step', async ({ page }) => {
  await open(page, 2, {}, 'mae-kop')
  for (const [i, word] of WORDS.entries()) {
    await expect(ahead(page), `before ${word}`).toHaveCount(0)
    await leaf(page, word).click()
    // Tapping a lifted leaf again plays it again but lifts nothing new.
    if (i === 2) await leaf(page, WORDS[0]!).click()
    await endCurrent(page)
  }
  await expect(bankStatus(page)).toHaveText('เปิดใบบอนครบ 6 ใบแล้ว ข้ามก้อนหินไปต่อกันเลย')
  await expect(page.getByTestId('ahead-stone')).toHaveCount(4)
  await expect(ahead(page)).toHaveClass(/vinyl-button/)
  await ahead(page).click()
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/3$/)
  await page.getByRole('link', { name: 'กลับไปแผนที่' }).click()
  await expect(page.getByRole('link', { name: /^ขั้น 2 / })).toHaveAttribute('data-done', 'true')
})

test('a leaf plays its word as on every Lesson: the snail ripples, and tapping another stops the first', async ({ page }) => {
  await open(page, 2, {}, 'mae-kop')
  await leaf(page, 'กบ').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/kop.mp3'])
  await expect(leaf(page, 'กบ')).toContainText('กำลังเล่น')
  await expect(leaf(page, 'กบ').getByTestId('leaf-pocket')).toHaveAttribute('data-highlight', 'true')
  await expect(leaf(page, 'กบ').getByTestId('sound-waves')).toBeVisible()
  await leaf(page, 'อาบ').click()
  await expect.poll(() => audioLog(page)).toEqual([
    'play:/assets/audio/vocabulary/kop.mp3',
    'pause:/assets/audio/vocabulary/kop.mp3',
    'play:/assets/audio/vocabulary/ap.mp3',
  ])
  await endCurrent(page)
  await expect(leaf(page, 'กบ')).toContainText('ฟังแล้ว')
  await expect(leaf(page, 'อาบ')).toContainText('ฟังแล้ว')
  await expect(leaf(page, 'จับ')).toContainText('แตะฟังเสียง')
})

test('a missing mp3 falls back to Web Speech reading the Thai word', async ({ page }) => {
  await open(page, 2, { mp3: 'missing' }, 'mae-kop')
  await leaf(page, 'ภาพ').click()
  await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/phap.mp3', 'speak:ภาพ|th-TH'])
})

test('the Game uses only the แม่กบ Kit: raincoat pockets, a snail speaker, nothing from แม่กง or แม่กม', async ({ page }) => {
  await open(page, 2, {}, 'mae-kop')
  await liftAll(page)
  expect(await otherLook(wholeStage(page))).toEqual([])
  for (const one of await leaves(page).all()) {
    await expect(one.getByTestId('leaf-pocket')).toHaveClass(/pocket-card/)
    await expect(one.locator('[data-art="snail"]')).toBeVisible()
  }
})

for (const viewport of VIEWPORTS) {
  test(`Step 2 at ${viewport.width}×${viewport.height}: the drizzle fills the window, nothing moving crosses a leaf, and all is big enough to tap`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await open(page, 2, {}, 'mae-kop')
    await expectSceneFills(page, 'kop-drizzle', viewport)
    await liftAll(page)
    await expect(ahead(page)).toBeVisible()
    await waitUntilStill(...(await page.getByTestId('taro-leaf').all()))
    if (viewport.height === 390) {
      for (const word of WORDS) await expectTapTarget(leaf(page, word))
      for (const target of [ahead(page), ...['กลับไปแผนที่', 'ย้อนกลับ', 'ถัดไป'].map((name) => page.getByRole('link', { name }))]) await expectTapTarget(target)
    }
    await expectNoDropCrosses(page, [leaves(page), ahead(page), bankStatus(page)])
    // The lifted leaves stay under the title row; ไปต่อ and the status keep clear of the corners and each other.
    const chrome = await Promise.all(
      [page.getByRole('heading', { level: 1 }).locator('..'), page.getByText('ขั้น 2/10'), page.getByRole('link', { name: 'กลับไปแผนที่' }), page.getByRole('button', { name: /เพลง$/ })].map((c) =>
        stageBox(page, c),
      ),
    )
    for (const up of await page.getByTestId('taro-leaf').all()) for (const c of chrome) expect(overlaps(await stageBox(page, up), c)).toBe(false)
    const corners = await Promise.all(['ย้อนกลับ', 'ถัดไป'].map((name) => stageBox(page, page.getByRole('link', { name }))))
    for (const box of [await stageBox(page, ahead(page)), await stageBox(page, bankStatus(page))]) for (const c of corners) expect(overlaps(box, c)).toBe(false)
    expect(overlaps(await stageBox(page, ahead(page)), await stageBox(page, bankStatus(page)))).toBe(false)
  })
}

test('keyboard and screen reader: each leaf is a named button, Enter lifts it, and the stones ahead are announced', async ({ page }) => {
  await open(page, 2, {}, 'mae-kop')
  await expect(page.getByTestId('ahead-stones')).toHaveAttribute('aria-hidden', 'true')
  for (const word of WORDS) {
    await leaf(page, word).focus()
    expect(parseFloat(await leaf(page, word).evaluate((el) => getComputedStyle(el).outlineWidth))).toBeGreaterThan(0)
    await page.keyboard.press('Enter')
    await expect(leaf(page, word)).toHaveAttribute('data-lifted', 'true')
    await endCurrent(page)
    await expect(leaf(page, word)).toHaveAccessibleName(`${word} ฟังแล้ว`)
  }
  await expect(bankStatus(page)).toHaveText('เปิดใบบอนครบ 6 ใบแล้ว ข้ามก้อนหินไปต่อกันเลย')
  await ahead(page).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/lesson\/mae-kop\/3$/)
})

test('under reduced motion the leaf simply shows lifted, the stones simply appear, and nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 2, {}, 'mae-kop')
  await leaves(page).first().waitFor()
  await expectSceneStill(page)
  for (const [i, word] of WORDS.entries()) {
    await leaf(page, word).click()
    await endCurrent(page)
    // Lifted at once: the leaf is up as soon as it shows lifted, without travelling.
    await expect(leaves(page).nth(i)).toHaveAttribute('data-lifted', 'true')
    const pocket = await stageBox(page, leaves(page).nth(i).getByTestId('leaf-pocket'))
    await expect
      .poll(async () => (await stageBox(page, leaves(page).nth(i).getByTestId('taro-leaf'))).cy, { message: word, timeout: 300 })
      .toBeLessThan(pocket.top)
  }
  await expect(page.getByTestId('ahead-stone')).toHaveCount(4)
  await expect(ahead(page)).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
})

import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { near, stageBox, waitUntilStill } from './stageBox.js'

const burst = (page: Page) => page.getByTestId('click-burst')
const vocabularyCard = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word} `) })
const choice = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })

/** The element and its descendants: CSS animation names, and whether any draws a conic-gradient ring. */
const ringOf = (target: Locator) =>
  target.evaluate((root) => {
    const all = [root, ...root.querySelectorAll('*')]
    return {
      spins: root.getAnimations({ subtree: true }).filter((a) => (a as CSSAnimation).animationName === 'card-spin').length,
      ring: all.some((el) => getComputedStyle(el).backgroundImage.includes('conic-gradient')),
      angle: all.map((el) => getComputedStyle(el).getPropertyValue('--card-angle')).find((value) => value && value !== '0deg') ?? '0deg',
    }
  })

/** Animations on `scale` or `rotate` (the boing), not the card ring or Motion transforms. */
const boings = (target: Locator) =>
  target.evaluate(
    (el) =>
      el.getAnimations().filter((a) => {
        const keyframes = (a.effect as KeyframeEffect).getKeyframes()
        return keyframes.some((frame) => 'scale' in frame || 'rotate' in frame)
      }).length,
  )

test.describe('every tap gets a boing and a burst', () => {
  test('a click on a button boings it and shows a burst at the pointer, which is then removed', async ({ page }) => {
    await open(page, 2)
    const card = vocabularyCard(page, 'ลิง')
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    expect(await boings(card)).toBe(1)
    await expect(burst(page)).toHaveCount(1)
    await expect(burst(page)).toHaveCSS('pointer-events', 'none')
    const at = (await burst(page).boundingBox())!
    expect(at.x + at.width / 2).toBeCloseTo(box.x + box.width / 2, -1)
    expect(at.y + at.height / 2).toBeCloseTo(box.y + box.height / 2, -1)
    await page.mouse.up()

    // The tap still did its job, and the burst cleans itself up.
    await expect(card).toContainText('กำลังเล่น')
    await expect(burst(page)).toHaveCount(0)
  })

  test('the burst follows the window size, not the stage scale', async ({ page }) => {
    const sizeAt = async (viewport: { width: number; height: number }) => {
      await page.setViewportSize(viewport)
      await page.goto('/lesson/mae-kong/2')
      const box = (await page.getByRole('link', { name: 'ถัดไป' }).boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      // Layout size: the bounding box also carries the pop's mid-animation scale.
      const size = await burst(page).evaluate((el) => (el as HTMLElement).offsetWidth)
      await page.mouse.up()
      return size
    }
    const phone = await sizeAt({ width: 844, height: 390 })
    const desktop = await sizeAt({ width: 1920, height: 1080 })
    expect(phone).toBeGreaterThanOrEqual(44)
    expect(desktop).toBeGreaterThan(phone)
  })

  test('disabled buttons and Step 6 chips get no boing; chips still drag and drop', async ({ page }) => {
    await open(page, 3)
    const previous = page.getByRole('button', { name: 'คำก่อนหน้า' })
    await expect(previous).toBeDisabled()
    const box = (await previous.boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(burst(page)).toHaveCount(0)

    await page.goto('/lesson/mae-kong/6')
    const chip = page.getByRole('group', { name: 'คลังคำ' }).getByRole('button', { name: 'ลิง', exact: true })
    const slot = page.getByRole('button', { name: /^ช่องที่ 1:/ })
    const a = (await chip.boundingBox())!
    const b = (await slot.boundingBox())!
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    expect(await boings(chip)).toBe(0)
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect(slot).toHaveAccessibleName('ช่องที่ 1: ลิง')
  })

  test('keyboard use still works and gets no burst', async ({ page }) => {
    await open(page, 5)
    await choice(page, 'รัง').focus()
    await page.keyboard.press('Space')
    await expect(choice(page, 'รัง')).toHaveAttribute('aria-pressed', 'true')
    await expect(burst(page)).toHaveCount(0)
  })
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a click gets no boing and no burst', async ({ page }) => {
    await open(page, 2)
    const card = vocabularyCard(page, 'ลิง')
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    expect(await boings(card)).toBe(0)
    await expect(burst(page)).toHaveCount(0)
    await page.mouse.up()
    await expect(card).toContainText('กำลังเล่น')
    await expect(burst(page)).toHaveCount(0)
  })

  test('the card ring is drawn but still', async ({ page }) => {
    await open(page, 2)
    const ring = await ringOf(vocabularyCard(page, 'ลิง'))
    expect(ring).toEqual({ spins: 0, ring: true, angle: '0deg' })
  })
})

test.describe('cards have a moving ring', () => {
  test('a card ring turns', async ({ page }) => {
    await open(page, 2)
    const card = vocabularyCard(page, 'ช้าง')
    const first = await ringOf(card)
    expect(first.spins).toBe(1)
    expect(first.ring).toBe(true)
    await expect.poll(async () => (await ringOf(card)).angle).not.toBe(first.angle)
  })

  test('a selected card turns faster than an unselected one', async ({ page }) => {
    await open(page, 5)
    const duration = (word: string) =>
      choice(page, word).evaluate((el) => {
        const spin = el.getAnimations({ subtree: true }).find((a) => (a as CSSAnimation).animationName === 'card-spin')
        return Number(spin?.effect?.getTiming().duration)
      })
    await choice(page, 'ลิง').click()
    await page.mouse.move(0, 0)
    expect(await duration('ลิง')).toBeLessThan(await duration('เงา'))
  })

  test('right, wrong and missed cards keep their result colours with no ring', async ({ page }) => {
    await open(page, 5)
    for (const word of ['ลิง', 'งู']) await choice(page, word).click()
    await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
    for (const [word, result] of [['ลิง', 'right'], ['งู', 'wrong'], ['ช้าง', 'missed']] as const) {
      await expect(choice(page, word)).toHaveAttribute('data-result', result)
      expect(await ringOf(choice(page, word)), word).toMatchObject({ spins: 0, ring: false })
    }
    // An unchecked card keeps its ring.
    expect(await ringOf(choice(page, 'เงา'))).toMatchObject({ spins: 1, ring: true })
  })
})

test.describe('no pink boxes', () => {
  // The old pill pink and the old cover pill tint; buttons and pills are comic yellow now.
  const PINKS = ['rgb(255, 163, 220)', 'rgb(255, 214, 236)']
  const pinkElements = (page: Page) =>
    page.evaluate(
      (pinks) =>
        [...document.querySelectorAll('*')]
          .filter((el) => pinks.includes(getComputedStyle(el).backgroundColor))
          .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}"`),
      PINKS,
    )

  test('no element on Steps 1 to 10 has a pink background', async ({ page }) => {
    await open(page, 1)
    for (let step = 1; step <= 10; step++) {
      if (step > 1) await page.goto(`/lesson/mae-kong/${step}`)
      await expect(page.getByTestId('stage')).toBeVisible()
      // Steps load lazily: scan once their art and chunks have arrived.
      await page.waitForLoadState('networkidle')
      expect(await pinkElements(page), `Step ${step}`).toEqual([])
    }
  })

  test('the rotate overlay has no pink background', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, 3)
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await pinkElements(page)).toEqual([])
  })
})

test.describe('centred on the stage', () => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
  ]) {
    test(`Step 2's card row and instruction pill are centred on x = 960 at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, 2)
      const cards = page.getByRole('main').getByRole('listitem')
      await expect(cards).toHaveCount(6)
      await waitUntilStill(cards.first(), cards.last())
      const first = await stageBox(page, cards.first())
      const last = await stageBox(page, cards.last())
      near((first.left + last.right) / 2, 960, 'card row centre')
      near(first.top, last.top, 'cards level')
      const pill = await stageBox(page, page.getByText('คลิกที่ภาพเพื่อฟังเสียง', { exact: true }))
      near(pill.cx, 960, 'instruction pill centre')
      expect(pill.bottom, 'pill above the cards').toBeLessThanOrEqual(first.top)
    })

    test(`Step 4's Step badge is centred with set buttons left and the speaker right at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, 4)
      const box = (target: Locator) => stageBox(page, target)
      const badge = await box(page.getByText('ขั้น 4/10', { exact: true }))
      const set1 = await box(page.getByRole('button', { name: 'ชุดคำที่ 1' }))
      const set2 = await box(page.getByRole('button', { name: 'ชุดคำที่ 2' }))
      const speaker = await box(page.getByRole('button', { name: 'ฟังคำอธิบาย' }))
      const plank = await box(page.getByRole('heading', { level: 1 }).locator('..'))
      const music = await box(page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ }))

      near(badge.cx, 960, 'badge centre')
      expect(set1.right, 'set 1 left of set 2').toBeLessThan(set2.left)
      expect(set2.right, 'set 2 left of the badge').toBeLessThan(badge.left)
      expect(speaker.left, 'speaker right of the badge').toBeGreaterThan(badge.right)
      near(badge.left - set2.right, speaker.left - badge.right, 'equal gaps either side of the badge')
      for (const [name, b] of Object.entries({ set1, set2, speaker })) near(b.cy, badge.cy, `${name} level with the badge`)
      expect(set1.left, 'set buttons clear of the title plank').toBeGreaterThan(plank.right)
      expect(speaker.right, 'speaker clear of the music button').toBeLessThan(music.left)
    })
  }
})

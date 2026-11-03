import { expect, type Locator, type Page, test } from '@playwright/test'
import { expectTapTarget } from './tapTarget.js'
import { audioLog, endCurrent, type Mic, open as openStep, stubMic } from './audioStub.js'

async function open(page: Page, step: number, mic: Mic = 'allow') {
  await page.addInitScript(stubMic, mic)
  await openStep(page, step)
}

const words = [
  ['ลิง', 'ling'],
  ['ช้าง', 'chang'],
  ['ดัง', 'dang'],
  ['รัง', 'rang'],
  ['ค่าง', 'khang'],
  ['ผึ้ง', 'phueng'],
] as const

const wordCard = (page: Page) => page.getByTestId('listen-word')
const listenButton = (page: Page) => page.getByRole('button', { name: /^(ฟังเสียง|ฟังอีกครั้ง)$/ })
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const playedRecording = (entries: string[]) => entries.some((entry) => /^play:https?:/.test(entry))
const nextWord = (page: Page) => page.getByRole('button', { name: 'คำถัดไป' })
const progressWord = (page: Page, word: string) =>
  page.getByRole('navigation', { name: 'ลำดับคำ' }).getByRole('button', { name: new RegExp(`^${word}`) })

/** Plays the current word and lets it finish. */
async function hear(page: Page) {
  await listenButton(page).click()
  await expect(wordCard(page)).toContainText('กำลังเล่น')
  await endCurrent(page)
}

test.describe('Step 3 listen and repeat', () => {
  test('starts on ลิง, คำที่ 1/6, without autoplay', async ({ page }) => {
    await open(page, 3)
    await expect(wordCard(page)).toContainText('ลิง')
    await expect(page.getByText('คำที่ 1/6')).toBeVisible()
    await page.waitForTimeout(300)
    expect(await audioLog(page)).toEqual([])
  })

  test('TC-004: คำถัดไป walks the 6 words in order, picture always matching the word', async ({ page }) => {
    await open(page, 3)
    for (const [i, [word, slug]] of words.entries()) {
      await expect(page.getByText(`คำที่ ${i + 1}/6`)).toBeVisible()
      await expect(wordCard(page).getByRole('heading')).toHaveText(word)
      await expect(wordCard(page).locator('img')).toHaveAttribute('src', `/assets/comic/word-${slug}.webp`)
      if (i < words.length - 1) await nextWord(page).click()
    }
    await expect(nextWord(page)).toBeDisabled()
  })

  test('listening plays the current word, then shows ถึงตาหนูอ่านแล้ว; ฟังอีกครั้ง replays it', async ({ page }) => {
    await open(page, 3)
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
    await hear(page)
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toBeVisible()

    await page.getByRole('button', { name: 'ฟังอีกครั้ง' }).click()
    const plays = async () => (await audioLog(page)).filter((entry) => entry.startsWith('play:'))
    await expect.poll(plays).toEqual(['play:/assets/audio/vocabulary/ling.mp3', 'play:/assets/audio/vocabulary/ling.mp3'])
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
  })

  test('tapping a word in the progress jumps to it', async ({ page }) => {
    await open(page, 3)
    await progressWord(page, 'รัง').click()
    await expect(page.getByText('คำที่ 4/6')).toBeVisible()
    await expect(wordCard(page).getByRole('heading')).toHaveText('รัง')
    await expect(progressWord(page, 'รัง')).toHaveAttribute('aria-current', 'step')

    await listenButton(page).click()
    await expect.poll(() => audioLog(page)).toEqual(['play:/assets/audio/vocabulary/rang.mp3'])
  })

  test('changing word stops the sound', async ({ page }) => {
    await open(page, 3)
    await listenButton(page).click()
    await expect(wordCard(page)).toContainText('กำลังเล่น')
    await nextWord(page).click()
    await expect.poll(() => audioLog(page)).toContain('pause:/assets/audio/vocabulary/ling.mp3')
    await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)
  })

  test('a star appears after all 6 words are heard, and practice stays repeatable', async ({ page }) => {
    await open(page, 3)
    const done = page.getByText('ฟังครบ 6 คำแล้ว')
    for (const [i] of words.entries()) {
      await expect(done).toHaveCount(0)
      await hear(page)
      if (i < words.length - 1) await nextWord(page).click()
    }
    await expect(done).toBeVisible()

    await page.getByRole('button', { name: 'ฝึกอีกรอบ' }).click()
    await expect(page.getByText('คำที่ 1/6')).toBeVisible()
    await listenButton(page).click()
    await expect.poll(() => audioLog(page)).toContain('play:/assets/audio/vocabulary/ling.mp3')
    await expect(done).toBeVisible()
  })

  test('sits on the pond scene with a cream word card', async ({ page }) => {
    await open(page, 3)
    await expect(page.getByTestId('stage-scene')).toHaveCSS('background-image', /pond\.webp/)
    await expect(wordCard(page)).toHaveCSS('background-color', 'rgb(255, 248, 231)')
  })

  test('คำก่อนหน้า goes back a word and is disabled on the first', async ({ page }) => {
    await open(page, 3)
    await expect(button(page, 'คำก่อนหน้า')).toBeDisabled()
    await nextWord(page).click()
    await expect(page.getByText('คำที่ 2/6')).toBeVisible()
    await button(page, 'คำก่อนหน้า').click()
    await expect(wordCard(page).getByRole('heading')).toHaveText('ลิง')
  })

  test('the red buzzer records, counts down, and the child can play it back', async ({ page }) => {
    await open(page, 3)
    await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveCount(0)
    await button(page, 'ลองอ่านเอง').click()
    await expect(button(page, 'หยุดบันทึก')).toBeVisible()
    await expect(page.getByTestId('record-time')).toHaveText(/^(30|29) วินาที$/)
    await button(page, 'หยุดบันทึก').click()

    await button(page, 'ฟังเสียงตัวเอง').click()
    await expect.poll(async () => playedRecording(await audioLog(page))).toBe(true)
    expect(await audioLog(page)).toEqual(expect.arrayContaining(['mic:request', 'record:start', 'record:stop', 'mic:release']))
  })

  test('changing word throws the recording away', async ({ page }) => {
    await open(page, 3)
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'หยุดบันทึก').click()
    await expect(button(page, 'ฟังเสียงตัวเอง')).toBeVisible()
    await nextWord(page).click()
    await expect(button(page, 'ฟังเสียงตัวเอง')).toHaveCount(0)
    await expect(button(page, 'ลองอ่านเอง')).toBeVisible()
  })

  test('a denied microphone shows the friendly message', async ({ page }) => {
    await open(page, 3, 'deny')
    await button(page, 'ลองอ่านเอง').click()
    await expect(page.getByRole('alert')).toContainText('ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน')
  })

  test('no horizontal scroll on a 390px-tall landscape phone and targets are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await open(page, 3)
    await hear(page)
    await button(page, 'ลองอ่านเอง').click()
    await button(page, 'หยุดบันทึก').click()
    await expect(wordCard(page)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844)
    for (const target of await page.getByRole('main').getByRole('button').all()) {
      await expectTapTarget(target)
    }
  })

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
  ]) {
    test(`is balanced about x = 960 at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, 3)
      const box = (target: Locator) => stageBox(page, target)
      // The card springs in: measure once it has stopped moving.
      let last = ''
      await expect
        .poll(async () => {
          const now = JSON.stringify(await wordCard(page).boundingBox())
          const still = now === last
          last = now
          return still
        })
        .toBe(true)
      const card = await box(wordCard(page))
      const speaker = await box(listenButton(page))
      const buzzer = await box(button(page, 'ลองอ่านเอง'))
      const previous = await box(button(page, 'คำก่อนหน้า'))
      const next = await box(nextWord(page))
      const near = (a: number, b: number, what: string) => expect(Math.abs(a - b), what).toBeLessThanOrEqual(2)

      near(card.cx, 960, 'card centre')
      // The speaker and the red buzzer mirror each other, and so do their label pills.
      near(speaker.cx + buzzer.cx, 1920, 'speaker and buzzer mirrored')
      near(speaker.cy, buzzer.cy, 'speaker and buzzer level')
      near(speaker.width, buzzer.width, 'speaker and buzzer width')
      near(speaker.height, buzzer.height, 'speaker and buzzer height')
      const listenLabel = await box(page.getByTestId('listen-label'))
      const buzzerLabel = await box(page.getByText('กดแล้วอ่านตาม', { exact: true }))
      near(listenLabel.cx + buzzerLabel.cx, 1920, 'labels mirrored')
      near(listenLabel.cy, buzzerLabel.cy, 'labels level')
      // The arrows sit the same distance from the card, the same size and level, clear of both columns.
      near(card.left - previous.right, next.left - card.right, 'arrows equidistant from the card')
      near(previous.width, next.width, 'arrow widths')
      near(previous.cy, next.cy, 'arrows level')
      expect(previous.left).toBeGreaterThan(speaker.right)
      expect(next.right).toBeLessThan(buzzer.left)
      // คำที่ 1/6 and the dots are one group, centred under the card.
      const progress = await box(page.getByRole('navigation', { name: 'ลำดับคำ' }))
      near(progress.cx, 960, 'progress centre')
      expect(progress.top).toBeGreaterThanOrEqual(card.bottom)
      expect(progress.top - card.bottom).toBeLessThanOrEqual(40)

      // ถึงตาหนูอ่านแล้ว, then the completion card, stay under the speaker's label, clear of every control.
      const clear = async () => {
        const messages = await box(page.getByTestId('listen-messages'))
        for (const [name, other] of Object.entries({ speaker, listenLabel, previous, card })) {
          expect(overlaps(messages, other), `messages clear of ${name}`).toBe(false)
        }
        const back = await box(page.getByRole('link', { name: 'ย้อนกลับ' }))
        expect(overlaps(messages, back), 'messages clear of ย้อนกลับ').toBe(false)
        expect(messages.bottom).toBeLessThanOrEqual(1080)
      }
      await hear(page)
      await expect(page.getByTestId('listen-messages')).toContainText('ถึงตาหนู')
      await clear()
      for (let i = 1; i < words.length; i++) {
        await nextWord(page).click()
        await hear(page)
      }
      await expect(page.getByTestId('listen-messages')).toContainText('เก่งมาก')
      await clear()
    })
  }
})

test.describe('Step 3 once every word is heard', () => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
  ]) {
    test(`shows only the completion box, clear of the dots, at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, 3)
      for (let i = 0; i < words.length; i++) {
        if (i) await nextWord(page).click()
        await hear(page)
        // Until the last word, each ending still says ถึงตาหนูอ่านแล้ว.
        if (i < words.length - 1) await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toBeVisible()
      }
      const messages = page.getByTestId('listen-messages')
      await expect(messages.getByText('ฟังครบ 6 คำแล้ว')).toBeVisible()
      await expect(page.getByText('ถึงตาหนูอ่านแล้ว')).toHaveCount(0)

      const again = page.getByRole('button', { name: 'ฝึกอีกรอบ' })
      await expectTapTarget(again)
      const box = await stageBox(page, messages)
      for (const dot of await page.getByRole('navigation', { name: 'ลำดับคำ' }).getByRole('button').all()) {
        expect(overlaps(box, await stageBox(page, dot)), 'completion box clear of the dots').toBe(false)
      }
    })
  }
})

type StageBox = { left: number; top: number; right: number; bottom: number; width: number; height: number; cx: number; cy: number }

/** The target's box in 1920×1080 stage pixels, whatever the window size. */
async function stageBox(page: Page, target: Locator): Promise<StageBox> {
  const stage = (await page.getByTestId('stage').boundingBox())!
  const box = (await target.boundingBox())!
  const scale = stage.width / 1920
  const left = (box.x - stage.x) / scale
  const top = (box.y - stage.y) / scale
  const width = box.width / scale
  const height = box.height / scale
  return { left, top, right: left + width, bottom: top + height, width, height, cx: left + width / 2, cy: top + height / 2 }
}

const overlaps = (a: StageBox, b: StageBox) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

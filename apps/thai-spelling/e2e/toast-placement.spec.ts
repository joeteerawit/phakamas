import { expect, type Locator, type Page, test } from '@playwright/test'
import { open } from './audioStub.js'
import { overlaps, stageBox, type StageBox } from './stageBox.js'

const MAE_KONG = ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง']
const DISTRACTORS = ['งู', 'บ้าน', 'ก้ม', 'เงา']

const toast = (page: Page) => page.getByRole('status').locator('> div')
const check = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' })
const choice = (page: Page, word: string) => page.getByRole('button', { name: new RegExp(`^${word}(\\s|$)`) })
const slot = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^ช่องที่ ${n}:`) })
const bankChips = (page: Page) => page.getByRole('group', { name: 'คลังคำ' }).getByRole('button')
const buzzer = (page: Page, text: string) => page.getByRole('button', { name: new RegExp(`^${text}`) })

/** The Step chrome every toast must keep clear of. */
const chrome = (page: Page) => [
  page.getByRole('link', { name: 'ย้อนกลับ' }),
  page.getByRole('link', { name: 'ถัดไป' }),
  page.getByRole('link', { name: 'กลับไปขั้นแรก' }),
  page.getByRole('button', { name: /^(ปิดเพลง|เปิดเพลง)$/ }),
]

/** The toast's stage box sampled for `ms`, from its entry onwards, so a moving toast is checked at every point. */
async function toastBoxes(page: Page, ms = 900) {
  const boxes: StageBox[] = []
  const end = Date.now() + ms
  while (Date.now() < end) {
    // A leaving toast and its replacement can both be on screen; neither may cover anything.
    for (const one of await toast(page).all()) {
      // It may have left by now.
      const box = await one.boundingBox({ timeout: 100 }).catch(() => null)
      if (!box || box.width === 0) continue
      const stage = (await page.getByTestId('stage').boundingBox())!
      const scale = stage.width / 1920
      const left = (box.x - stage.x) / scale
      const top = (box.y - stage.y) / scale
      const width = box.width / scale
      const height = box.height / scale
      boxes.push({ left, top, right: left + width, bottom: top + height, width, height, cx: left + width / 2, cy: top + height / 2 })
    }
  }
  expect(boxes.length, 'toast was sampled').toBeGreaterThan(3)
  return boxes
}

async function expectClear(page: Page, boxes: StageBox[], targets: Locator[]) {
  for (const target of targets) {
    for (const element of await target.all()) {
      const box = await stageBox(page, element)
      const name = (await element.getAttribute('aria-label')) ?? (await element.innerText()).trim().slice(0, 20)
      expect(boxes.some((at) => overlaps(at, box)), `toast covers ${name}`).toBe(false)
    }
  }
}

/** How many lines `phrase` is drawn on inside the toast message. */
const linesOf = (target: Locator, phrase: string) =>
  target.evaluate((p, phrase) => {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
    const nodes: [Text, number][] = []
    let text = ''
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      nodes.push([node, text.length])
      text += node.data
    }
    const start = text.indexOf(phrase)
    if (start < 0) return 0
    const end = start + phrase.length
    const range = document.createRange()
    for (const [node, at] of nodes) {
      if (start >= at && start < at + node.data.length) range.setStart(node, start - at)
      if (end > at && end <= at + node.data.length) range.setEnd(node, end - at)
    }
    return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size
  }, phrase)

for (const viewport of [
  { width: 844, height: 390 },
  { width: 1920, height: 1080 },
]) {
  test.describe(`at ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport })

    test('Step 5: the toast covers no card or control, and its Mascot is the comic one', async ({ page }) => {
      await open(page, 5)
      for (const word of [...MAE_KONG.filter((w) => w !== 'ค่าง'), 'งู']) await choice(page, word).click()
      await check(page).click()
      const boxes = await toastBoxes(page)
      await expect(toast(page)).toContainText('10/12')
      await expect(toast(page).locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-encourage\.webp$/)
      const cards = [...MAE_KONG, ...DISTRACTORS].map((word) => choice(page, word))
      await expectClear(page, boxes, [...cards, check(page), page.getByRole('button', { name: 'เริ่มใหม่' }), ...chrome(page)])
    })

    test('Step 5 full marks: the toast shows the cheering Mascot', async ({ page }) => {
      await open(page, 5)
      for (const word of MAE_KONG) await choice(page, word).click()
      await check(page).click()
      await expect(toast(page)).toContainText('12/12')
      await expect(toast(page).locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-cheer\.webp$/)
    })

    test('Step 6: with words left in both bank rows the toast covers no chip, card or control', async ({ page }) => {
      await open(page, 6)
      await bankChips(page).filter({ hasText: /^ลิง$/ }).click()
      await slot(page, 1).click()
      // Five words stay in the bank: three on the top row, two on the lower row.
      await expect(bankChips(page)).toHaveCount(5)
      await check(page).click()
      const boxes = await toastBoxes(page)
      await expect(toast(page)).toContainText('ได้ 1/6 คะแนน กดลองอีกครั้งเพื่อแก้ช่องที่ผิด')
      await expect(toast(page).locator('img')).toHaveAttribute('src', /\/assets\/comic\/mascot-encourage\.webp$/)
      const controls = ['ลองอีกครั้ง', 'ล้างคำตอบ', 'ตรวจคำตอบ'].map((name) => page.getByRole('button', { name }))
      const slots = [1, 2, 3, 4, 5, 6].map((n) => slot(page, n))
      await expectClear(page, boxes, [bankChips(page), ...slots, ...controls, ...chrome(page)])
    })

    test('Step 6: the button name ลองอีกครั้ง stays on one line in the toast', async ({ page }) => {
      await open(page, 6)
      await check(page).click()
      await expect(toast(page)).toContainText('กดลองอีกครั้งเพื่อแก้ช่องที่ผิด')
      expect(await linesOf(toast(page).locator('p'), 'ลองอีกครั้ง')).toBe(1)
    })

    test('Step 8: wrong, right and finished toasts cover no buzzer, card or เริ่มใหม่', async ({ page }) => {
      await open(page, 8)
      const buzzers = ['มอง', 'ฟัง', 'ดัง', 'ร้อง'].map((text) => buzzer(page, text))
      // The drawn buzzers, which bounce or shake inside their buttons.
      const drawn = buzzers.map((b) => b.locator('> span'))
      const targets = () => [...buzzers, ...drawn, page.getByRole('button', { name: 'เริ่มใหม่' }), ...chrome(page)]

      await buzzer(page, 'ดัง').click()
      await buzzer(page, 'ร้อง').click()
      let boxes = await toastBoxes(page)
      await expect(toast(page).filter({ hasText: 'ยังไม่ถูก' }).locator('img')).toHaveAttribute('src', /mascot-encourage\.webp$/)
      await expectClear(page, boxes, targets())

      await buzzer(page, 'ดัง').click()
      await buzzer(page, 'ฟัง').click()
      boxes = await toastBoxes(page)
      await expect(toast(page).filter({ hasText: 'คล้องจองกับ' }).locator('img')).toHaveAttribute('src', /mascot-cheer\.webp$/)
      await expectClear(page, boxes, targets())

      await buzzer(page, 'มอง').click()
      await buzzer(page, 'ร้อง').click()
      boxes = await toastBoxes(page)
      await expect(toast(page).filter({ hasText: 'จับคู่ถูกครบแล้ว' })).toBeVisible()
      const finished = page.getByText('เก่งมาก! จับคู่ถูกครบ', { exact: true }).locator('..')
      await expectClear(page, boxes, [...targets(), finished])
    })
  })
}

import { expect, type Locator, type Page } from '@playwright/test'

export type StageBox = { left: number; top: number; right: number; bottom: number; width: number; height: number; cx: number; cy: number }

/** The target's box in 1920×1080 stage pixels, whatever the window size. */
export async function stageBox(page: Page, target: Locator): Promise<StageBox> {
  const stage = (await page.getByTestId('stage').boundingBox())!
  const box = (await target.boundingBox())!
  const scale = stage.width / 1920
  const left = (box.x - stage.x) / scale
  const top = (box.y - stage.y) / scale
  const width = box.width / scale
  const height = box.height / scale
  return { left, top, right: left + width, bottom: top + height, width, height, cx: left + width / 2, cy: top + height / 2 }
}

/** Waits until the targets' boxes stop changing (they pop or spring in on entry). */
export async function waitUntilStill(...targets: Locator[]) {
  let last = ''
  await expect
    .poll(async () => {
      const now = JSON.stringify(await Promise.all(targets.map((target) => target.boundingBox())))
      const still = now === last
      last = now
      return still
    })
    .toBe(true)
}

export const overlaps = (a: StageBox, b: StageBox) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/** Asserts a and b are within 2 stage px. */
export const near = (a: number, b: number, what: string) => expect(Math.abs(a - b), what).toBeLessThanOrEqual(2)

/** Clear stage px between two boxes that do not overlap (the larger of the horizontal and vertical gaps). */
export const gapBetween = (a: StageBox, b: StageBox) => Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom)

/** The target's font size as drawn on screen in CSS px: its stage-px font size times the stage scale. */
export async function renderedFontSize(page: Page, target: Locator) {
  const stage = (await page.getByTestId('stage').boundingBox())!
  const size = await target.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  return (size * stage.width) / 1920
}

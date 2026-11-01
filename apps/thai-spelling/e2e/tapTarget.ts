import { expect, type Locator } from '@playwright/test'

/** MASTER.md: every tap target is at least 44 CSS px each way (≥ 122 stage px on a 390px-tall phone). */
export async function expectTapTarget(target: Locator) {
  const box = await target.boundingBox()
  expect(box, 'tap target is rendered').not.toBeNull()
  expect(box!.width, 'tap target width').toBeGreaterThanOrEqual(44)
  expect(box!.height, 'tap target height').toBeGreaterThanOrEqual(44)
}

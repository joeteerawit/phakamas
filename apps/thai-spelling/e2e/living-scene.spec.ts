import { expect, type Page, test } from '@playwright/test'

/** Samples the Step content wrappers every frame while `act` runs; returns their transforms and opacities. */
async function sampleTransition(page: Page, act: () => Promise<void>) {
  await page.evaluate(() => {
    const w = window as unknown as { samples: { x: number; opacity: number }[]; sampling: boolean }
    w.samples = []
    w.sampling = true
    const tick = () => {
      for (const el of document.querySelectorAll<HTMLElement>('[data-testid="step-content"]')) {
        const style = getComputedStyle(el)
        w.samples.push({ x: style.transform === 'none' ? 0 : new DOMMatrix(style.transform).m41, opacity: Number(style.opacity) })
      }
      if (w.sampling) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await act()
  await page.waitForTimeout(800)
  return page.evaluate(() => {
    const w = window as unknown as { samples: { x: number; opacity: number }[]; sampling: boolean }
    w.sampling = false
    return w.samples
  })
}

test('Step changes slide in the travel direction', async ({ page }) => {
  await page.goto('/lesson/mae-kong/2')
  await expect(page.getByTestId('step-content')).toHaveCount(1)

  const forward = await sampleTransition(page, () => page.getByRole('link', { name: 'ถัดไป' }).click())
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/3$/)
  // Going forward, content travels left: the old Step leaves to the left, the new one enters from the right.
  expect(forward.some((s) => s.x < -10)).toBe(true)
  expect(forward.some((s) => s.x > 10)).toBe(true)

  const back = await sampleTransition(page, () => page.getByRole('link', { name: 'ย้อนกลับ' }).click())
  await expect(page).toHaveURL(/\/lesson\/mae-kong\/2$/)
  expect(back.some((s) => s.x > 10)).toBe(true)
  expect(back.some((s) => s.x < -10)).toBe(true)
  await expect(page.getByTestId('step-content')).toHaveCount(1)
})

test('the scene drifts: clouds, swaying flowers and the bee animate', async ({ page }) => {
  await page.goto('/lesson/mae-kong/2')
  const ambient = page.getByTestId('ambient')
  for (const cloud of await ambient.getByTestId('ambient-cloud').all()) await expect(cloud).toHaveCSS('animation-name', 'cloud-drift')
  for (const sway of await ambient.getByTestId('ambient-sway').all()) await expect(sway).toHaveCSS('animation-name', 'sway')
  await expect(ambient.getByTestId('ambient-flyer')).toHaveCSS('animation-name', 'fly-across')
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the ambient layer is still and Step changes only fade', async ({ page }) => {
    await page.goto('/lesson/mae-kong/2')
    const ambient = page.getByTestId('ambient')
    for (const cloud of await ambient.getByTestId('ambient-cloud').all()) await expect(cloud).toHaveCSS('animation-name', 'none')
    for (const sway of await ambient.getByTestId('ambient-sway').all()) await expect(sway).toHaveCSS('animation-name', 'none')
    await expect(ambient.getByTestId('ambient-flyer')).toBeHidden()

    const samples = await sampleTransition(page, () => page.getByRole('link', { name: 'ถัดไป' }).click())
    await expect(page).toHaveURL(/\/lesson\/mae-kong\/3$/)
    expect(samples.every((s) => s.x === 0)).toBe(true)
    expect(samples.some((s) => s.opacity < 1)).toBe(true)
  })
})

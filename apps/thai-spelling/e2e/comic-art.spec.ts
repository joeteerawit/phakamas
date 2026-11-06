import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { allLessons } from '../src/lessons/index.ts'

const DIR = 'public/assets/comic'
const files = readdirSync(DIR)
const source = ['src/themes/mae-kong/steps/CoverStep.tsx', 'src/themes/mae-kong/scenes/CoverDecor.tsx'].map((path) => readFileSync(path, 'utf8')).join()
const doc = readFileSync('docs/comic-art.md', 'utf8')

test('the cover uses only comic art files that exist', () => {
  const used = [...source.matchAll(/[\w-]+\.webp/g)].map(([name]) => name)
  expect(used.length).toBeGreaterThan(0)
  expect(used.filter((name) => !files.includes(name))).toEqual([])
})

test('every comic art file is recorded in the art doc, so none is an orphan', () => {
  expect(files.filter((name) => !doc.includes(`\`${name}\``))).toEqual([])
})

// Each Lesson brings its own Theme art, so the budget grows with the Lessons.
test('comic art is all WebP and stays within 3 MB per Lesson', () => {
  expect(files.filter((name) => !name.endsWith('.webp'))).toEqual([])
  const bytes = files.reduce((total, name) => total + statSync(join(DIR, name)).size, 0)
  expect(bytes).toBeLessThanOrEqual(allLessons.length * 3 * 1024 * 1024)
})

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1280, height: 900 },
  { width: 2560, height: 1080 },
  { width: 844, height: 390 },
]) {
  test(`the cover fills ${viewport.width}×${viewport.height}: sign centred, buttons in the corners`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/lesson/mae-kong/1')

    const decor = (await page.getByTestId('cover-decor').boundingBox())!
    expect(decor.x).toBeLessThanOrEqual(0.5)
    expect(decor.y).toBeLessThanOrEqual(0.5)
    expect(decor.x + decor.width).toBeGreaterThanOrEqual(viewport.width - 0.5)
    expect(decor.y + decor.height).toBeGreaterThanOrEqual(viewport.height - 0.5)

    const pill = (await page.getByText(/^แม่ กง/).locator('..').boundingBox())!
    expect(pill.x + pill.width / 2).toBeCloseTo(viewport.width / 2, 0)

    const scale = Math.min(viewport.width / 1920, viewport.height / 1080)
    const speaker = (await page.getByRole('button', { name: 'ปิดเพลง' }).or(page.getByRole('button', { name: 'เปิดเพลง' })).boundingBox())!
    const play = (await page.getByRole('link', { name: 'เริ่มเรียน' }).boundingBox())!
    expect(speaker.x).toBeCloseTo(40 * scale, 0)
    expect(viewport.height - speaker.y - speaker.height).toBeCloseTo(32 * scale, 0)
    expect(viewport.width - play.x - play.width).toBeCloseTo(32 * scale, 0)
    expect(viewport.height - play.y - play.height).toBeCloseTo(24 * scale, 0)
  })
}

test('the cover scene moves, and stops under reduced motion', async ({ page }) => {
  const running = () => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)
  await page.goto('/lesson/mae-kong/1')
  await expect.poll(running).toBeGreaterThan(5)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByTestId('cover-decor').waitFor()
  expect(await running()).toBe(0)
})

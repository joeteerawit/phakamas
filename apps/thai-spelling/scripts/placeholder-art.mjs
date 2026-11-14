// Stand-in art for แม่กบ (docs/mae-kop-spec.md) until the art ticket (#69) lands: flat inked SVG drawings of
// น้องกบ's four poses and the new picture cards, rendered by Playwright's Chromium on a transparent background and
// encoded with cwebp into public/assets/comic/, under the names the real art will replace.
// Usage (from apps/thai-spelling, needs cwebp on PATH): node scripts/placeholder-art.mjs
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = 'public/assets/comic'
const INK = '#111111'
const ink = `stroke="${INK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`
const thin = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`

const GREEN = '#5cbf4f'
const GREEN_DEEP = '#3a9a3a'
const BELLY = '#d9f2a6'
const YELLOW = '#ffd000'
const RED = '#e8322f'
const PINK = '#ff9db0'

const eye = (x, y, r = 50, look = 0) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${GREEN}" ${ink}/>` +
  `<circle cx="${x}" cy="${y + 4}" r="${r * 0.66}" fill="#fff" ${thin}/>` +
  `<circle cx="${x + look}" cy="${y + 8}" r="${r * 0.32}" fill="${INK}"/>` +
  `<circle cx="${x + look + r * 0.12}" cy="${y - r * 0.04}" r="${r * 0.11}" fill="#fff"/>`

/** น้องกบ: a green frog girl in a raincoat-yellow coat and red boots. `arms` and `mouth` make the pose. */
function frog({ arms, mouth, transform = '' }) {
  const smile =
    mouth === 'open'
      ? `<path d="M196 282 Q240 344 284 282 Z" fill="${RED}" ${ink}/>`
      : `<path d="M190 278 Q240 318 290 278" fill="none" ${ink}/>`
  const arm = {
    // Left arm down on the coat, right arm up waving with a three-finger hand.
    wave: `<path d="M140 400 Q96 452 116 500" fill="none" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M140 400 Q96 452 116 500" fill="none" stroke="${GREEN}" stroke-width="28" stroke-linecap="round"/>
      <path d="M340 392 Q400 330 404 250" fill="none" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M340 392 Q400 330 404 250" fill="none" stroke="${GREEN}" stroke-width="28" stroke-linecap="round"/>
      <circle cx="384" cy="226" r="16" fill="${GREEN}" ${thin}/><circle cx="406" cy="214" r="16" fill="${GREEN}" ${thin}/><circle cx="428" cy="230" r="16" fill="${GREEN}" ${thin}/>`,
    // Both arms thrown up.
    up: [
      ['M140 392 Q80 320 74 236', 54, 214],
      ['M340 392 Q400 320 406 236', 426, 214],
    ]
      .map(
        ([d, hx, hy]) =>
          `<path d="${d}" fill="none" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${GREEN}" stroke-width="28" stroke-linecap="round"/>` +
          `<circle cx="${hx - 20}" cy="${hy + 8}" r="16" fill="${GREEN}" ${thin}/><circle cx="${hx}" cy="${hy - 6}" r="16" fill="${GREEN}" ${thin}/><circle cx="${hx + 20}" cy="${hy + 8}" r="16" fill="${GREEN}" ${thin}/>`,
      )
      .join(''),
    // Right fist in front of the coat with the thumb up.
    thumb: `<path d="M140 400 Q96 452 116 500" fill="none" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M140 400 Q96 452 116 500" fill="none" stroke="${GREEN}" stroke-width="28" stroke-linecap="round"/>
      <path d="M340 400 Q392 420 380 360" fill="none" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M340 400 Q392 420 380 360" fill="none" stroke="${GREEN}" stroke-width="28" stroke-linecap="round"/>
      <rect x="352" y="318" width="58" height="52" rx="22" fill="${GREEN}" ${ink}/><rect x="370" y="262" width="24" height="66" rx="12" fill="${GREEN}" ${ink}/>`,
    rest: '',
  }[arms]
  return `<g transform="${transform}">
    <rect x="160" y="520" width="64" height="62" rx="14" fill="${RED}" ${ink}/><rect x="256" y="520" width="64" height="62" rx="14" fill="${RED}" ${ink}/>
    <path d="M140 356 Q240 330 340 356 L364 536 Q240 560 116 536 Z" fill="${YELLOW}" ${ink}/>
    <path d="M240 352 V540" fill="none" ${thin}/><circle cx="260" cy="402" r="9" fill="${INK}"/><circle cx="260" cy="452" r="9" fill="${INK}"/><circle cx="260" cy="502" r="9" fill="${INK}"/>
    <path d="M170 360 Q240 404 310 360 L300 340 Q240 360 180 340 Z" fill="#fff4a8" ${thin}/>
    ${arm}
    <ellipse cx="240" cy="250" rx="150" ry="100" fill="${GREEN}" ${ink}/>
    <ellipse cx="240" cy="296" rx="84" ry="40" fill="${BELLY}"/>
    ${eye(168, 158)}${eye(312, 158)}
    <circle cx="146" cy="268" r="22" fill="${PINK}"/><circle cx="334" cy="268" r="22" fill="${PINK}"/>
    <circle cx="222" cy="232" r="5" fill="${INK}"/><circle cx="258" cy="232" r="5" fill="${INK}"/>
    ${smile}
    <path d="M300 104 Q330 70 360 98 Q336 116 300 104 Z" fill="${RED}" ${thin}/><path d="M300 104 Q312 66 344 76" fill="none" ${thin}/>
  </g>`
}

/** The cover pose: sitting on a lily pad under a taro-leaf umbrella. */
const coverPose = `
  <ellipse cx="240" cy="560" rx="220" ry="34" fill="${GREEN_DEEP}" ${ink}/>
  <path d="M240 560 L330 530" fill="none" ${ink}/>
  <path d="M370 110 V430" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M370 110 V430" fill="none" stroke="#7a5a2f" stroke-width="10" stroke-linecap="round"/>
  ${frog({ arms: 'rest', mouth: 'smile', transform: 'translate(30 100) scale(0.8)' })}
  <path d="M302 414 Q356 400 366 360" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M302 414 Q356 400 366 360" fill="none" stroke="${GREEN}" stroke-width="24" stroke-linecap="round"/>
  <circle cx="368" cy="354" r="18" fill="${GREEN}" ${thin}/>
  <path d="M110 140 Q370 -40 476 150 Q430 120 392 146 Q360 112 320 144 Q272 108 236 146 Q190 112 110 140 Z" fill="${GREEN_DEEP}" ${ink}/>
  <path d="M370 30 V140 M370 70 L290 126 M370 70 L440 126" fill="none" stroke="#b8e6a0" stroke-width="7" stroke-linecap="round"/>
  ${[[56, 250], [96, 340], [446, 290]].map(([x, y]) => `<path d="M${x} ${y} q10 18 0 26 q-10 -8 0 -26 Z" fill="#9fdcf5" ${thin}/>`).join('')}`

// Picture cards, 600×560, the subject large and centred like the comic cards.
const cards = {
  // กบ: a plain green frog sitting.
  kop: `<ellipse cx="300" cy="500" rx="200" ry="30" fill="#9fdcf5" ${thin}/>
    <path d="M150 470 Q130 400 200 380 L400 380 Q470 400 450 470 Z" fill="${GREEN}" ${ink}/>
    <path d="M120 480 Q150 440 200 470 Q170 500 120 480 Z M480 480 Q450 440 400 470 Q430 500 480 480 Z" fill="${GREEN}" ${ink}/>
    <ellipse cx="300" cy="300" rx="190" ry="130" fill="${GREEN}" ${ink}/>
    <ellipse cx="300" cy="360" rx="110" ry="50" fill="${BELLY}"/>
    ${eye(200, 180, 62, 6)}${eye(400, 180, 62, -6)}
    <path d="M220 330 Q300 390 380 330" fill="none" ${ink}/>
    <circle cx="180" cy="320" r="24" fill="${PINK}"/><circle cx="420" cy="320" r="24" fill="${PINK}"/>`,
  // พับ: a sheet of paper with its corner folded over, and a curling arrow.
  'phap-fold': `<path d="M130 120 H420 L470 170 V460 H130 Z" fill="#fff" ${ink}/>
    <path d="M300 120 H420 L470 170 V290 Z" fill="#cfe9ff" ${ink}/>
    <path d="M300 120 L470 290" fill="none" ${thin} stroke-dasharray="18 14"/>
    <path d="M190 400 Q170 250 280 200" fill="none" stroke="${RED}" stroke-width="18" stroke-linecap="round"/>
    <path d="M250 176 L300 196 L262 236" fill="none" stroke="${RED}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`,
  // จับ: two hands catching a ball.
  chap: `<circle cx="300" cy="250" r="110" fill="${RED}" ${ink}/>
    <path d="M190 250 Q300 210 410 250" fill="none" stroke="#fff" stroke-width="22"/><path d="M300 140 Q340 250 300 360" fill="none" stroke="#fff" stroke-width="22"/>
    <path d="M90 470 Q80 330 170 280 L230 300 Q250 360 210 380 L200 470 Z" fill="#f5c08a" ${ink}/>
    <path d="M510 470 Q520 330 430 280 L370 300 Q350 360 390 380 L400 470 Z" fill="#f5c08a" ${ink}/>
    <path d="M170 300 Q150 250 190 230 M430 300 Q450 250 410 230" fill="none" ${ink}/>`,
  // ภาพ: a framed picture of hills and a sun.
  phap: `<rect x="90" y="80" width="420" height="400" rx="10" fill="#c98a3b" ${ink}/>
    <rect x="140" y="130" width="320" height="300" fill="#bde6ff" ${ink}/>
    <circle cx="390" cy="200" r="38" fill="${YELLOW}" ${thin}/>
    <path d="M140 390 Q220 250 300 360 Q360 280 460 370 V430 H140 Z" fill="${GREEN}" ${ink}/>
    <path d="M260 60 L300 20 L340 60" fill="none" ${ink}/>`,
  // เจ็บ: a sad face with a plaster on the forehead and a tear.
  chep: `<circle cx="300" cy="290" r="190" fill="#f5c08a" ${ink}/>
    <g transform="rotate(-20 300 190)"><rect x="220" y="160" width="160" height="56" rx="26" fill="#f2d9b8" ${ink}/><rect x="275" y="160" width="50" height="56" fill="#e2c39c" ${thin}/></g>
    <path d="M200 280 Q230 260 260 280 M340 280 Q370 260 400 280" fill="none" ${ink}/>
    <path d="M230 400 Q300 340 370 400" fill="none" ${ink}/>
    <path d="M390 310 Q410 350 390 370 Q370 350 390 310 Z" fill="#7cc8f0" ${thin}/>
    <path d="M90 140 L130 170 M510 140 L470 170 M80 230 L120 236" fill="none" stroke="${RED}" stroke-width="12" stroke-linecap="round"/>`,
  // อาบ: a child in a bathtub with bubbles under a shower.
  ap: `<path d="M420 40 H470 V120" fill="none" ${ink}/><path d="M420 120 H520 L500 150 H440 Z" fill="#b0bec5" ${ink}/>
    ${[440, 470, 500].map((x) => `<path d="M${x} 180 v30" stroke="#4fb3e8" stroke-width="10" stroke-linecap="round"/>`).join('')}
    <circle cx="300" cy="250" r="90" fill="#f5c08a" ${ink}/>
    <path d="M260 250 Q275 240 290 250 M320 250 Q335 240 350 250" fill="none" ${thin}/><path d="M270 290 Q300 315 330 290" fill="none" ${thin}/>
    <path d="M80 330 H520 Q520 470 400 470 H200 Q80 470 80 330 Z" fill="#fff" ${ink}/>
    <path d="M150 470 L130 520 M450 470 L470 520" fill="none" ${ink}/>
    ${[[150, 320, 40], [215, 300, 34], [390, 305, 38], [455, 325, 36], [300, 330, 30]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#dff4ff" ${thin}/>`).join('')}`,
  // จูบ: red lips blowing a kiss, with hearts.
  chup: `<path d="M120 300 Q190 200 270 250 Q300 230 330 250 Q410 200 480 300 Q400 400 300 400 Q200 400 120 300 Z" fill="${RED}" ${ink}/>
    <path d="M140 300 Q300 330 460 300" fill="none" ${ink}/>
    ${[[160, 140, 1], [420, 120, 1.3], [470, 430, 0.9]].map(([x, y, k]) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 20 C-30 -20 -60 20 0 60 C60 20 30 -20 0 20 Z" fill="${PINK}" ${thin}/>`).join('')}`,
  // ดาบ: a sword.
  dap: `<g transform="rotate(-40 300 280)"><path d="M280 40 L320 40 L320 380 L300 410 L280 380 Z" fill="#dfe7ee" ${ink}/>
    <path d="M300 60 V370" fill="none" stroke="#aab6c0" stroke-width="8"/>
    <rect x="200" y="380" width="200" height="40" rx="16" fill="${YELLOW}" ${ink}/>
    <rect x="280" y="420" width="40" height="100" rx="12" fill="#8a5a2b" ${ink}/>
    <circle cx="300" cy="530" r="24" fill="${YELLOW}" ${ink}/></g>`,
  // ใบไม้: a green leaf.
  'bai-mai': `<path d="M100 460 Q100 140 480 100 Q470 430 100 460 Z" fill="${GREEN}" ${ink}/>
    <path d="M100 460 Q280 290 430 150 M200 360 Q220 270 210 220 M280 290 Q330 300 380 290 M320 240 Q330 190 320 160" fill="none" ${ink}/>
    <path d="M100 460 L60 510" fill="none" ${ink}/>`,
  // ปู: a red crab.
  pu: `<path d="M150 370 L80 430 M170 400 L120 470 M450 370 L520 430 M430 400 L480 470" fill="none" ${ink}/>
    <path d="M190 270 Q120 220 110 150 M410 270 Q480 220 490 150" fill="none" ${ink}/>
    <path d="M60 150 Q80 70 150 100 L120 140 L160 170 Q100 210 60 150 Z M540 150 Q520 70 450 100 L480 140 L440 170 Q500 210 540 150 Z" fill="${RED}" ${ink}/>
    <ellipse cx="300" cy="340" rx="180" ry="110" fill="${RED}" ${ink}/>
    <path d="M250 240 V200 M350 240 V200" fill="none" ${ink}/>
    <circle cx="250" cy="190" r="26" fill="#fff" ${ink}/><circle cx="350" cy="190" r="26" fill="#fff" ${ink}/>
    <circle cx="254" cy="194" r="10" fill="${INK}"/><circle cx="346" cy="194" r="10" fill="${INK}"/>
    <path d="M250 370 Q300 410 350 370" fill="none" ${ink}/>`,
}

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`

const art = {
  'mascot-kop-greet': svg(480, 600, frog({ arms: 'wave', mouth: 'smile' })),
  'mascot-kop-cheer': svg(480, 600, frog({ arms: 'up', mouth: 'open' })),
  'mascot-kop-encourage': svg(480, 600, frog({ arms: 'thumb', mouth: 'smile' })),
  'mascot-kop-cover': svg(480, 600, coverPose),
  ...Object.fromEntries(Object.entries(cards).map(([slug, body]) => [`word-${slug}`, svg(600, 560, body)])),
}

const tmp = mkdtempSync(join(tmpdir(), 'placeholder-art-'))
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const [name, markup] of Object.entries(art)) {
    const [, width, height] = markup.match(/width="(\d+)" height="(\d+)"/).map(Number)
    await page.setViewportSize({ width, height })
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`)
    const png = join(tmp, `${name}.png`)
    await page.locator('svg').screenshot({ path: png, omitBackground: true })
    execFileSync('cwebp', ['-quiet', '-q', '82', '-alpha_q', '90', png, '-o', join(OUT, `${name}.webp`)])
    console.error(`${OUT}/${name}.webp`)
  }
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}

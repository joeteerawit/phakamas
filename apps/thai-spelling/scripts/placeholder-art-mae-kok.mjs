// PLACEHOLDER art for แม่กก (docs/mae-kok-spec.md) until the art ticket (#83) lands: flat inked SVG drawings of
// น้องนก's four poses, the new picture cards, the four Step 7 comic panels and the Scene backdrops, rendered by
// Playwright's Chromium and encoded with cwebp into public/assets/comic/, under the names the real art will replace.
// Usage (from apps/thai-spelling, needs cwebp on PATH): node scripts/placeholder-art-mae-kok.mjs
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = 'public/assets/comic'
const INK = '#111111'
const ink = `stroke="${INK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`
const thin = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`

const SKY_BLUE = '#5bb8e8'
const BELLY = '#fff1d0'
const BEAK = '#f39a1e'
const STRAW = '#e8c25a'
const GREEN = '#4f9a3a'
const GREEN_LIGHT = '#8fcf5a'
const RED = '#e2402f'
const SKIN = '#f5c08a'
const TERRACOTTA = '#c8643b'
const SOIL = '#7a4b2a'
const PINK = '#ff9db0'

/** น้องนก: a round sky-blue bird with a cream belly, an orange beak and a straw hat. `wings` and `mouth` make the pose. */
function bird({ wings, mouth, transform = '' }) {
  const beak =
    mouth === 'open'
      ? `<path d="M226 262 L262 248 L298 262 L262 300 Z" fill="${BEAK}" ${ink}/><path d="M232 266 L292 266" ${thin}/>`
      : `<path d="M228 258 L262 246 L296 258 L262 284 Z" fill="${BEAK}" ${ink}/>`
  const wing = {
    // Left wing down, right wing raised to wave.
    wave: `<path d="M120 360 Q60 420 96 470 Q130 440 150 400 Z" fill="${SKY_BLUE}" ${ink}/>
      <path d="M392 340 Q470 280 456 200 Q420 230 388 300 Z" fill="${SKY_BLUE}" ${ink}/>`,
    // Both wings thrown up.
    up: `<path d="M126 330 Q50 260 70 170 Q110 210 150 290 Z" fill="${SKY_BLUE}" ${ink}/>
      <path d="M394 330 Q470 260 450 170 Q410 210 370 290 Z" fill="${SKY_BLUE}" ${ink}/>`,
    // Right wing curled in front like a thumbs up.
    thumb: `<path d="M120 360 Q60 420 96 470 Q130 440 150 400 Z" fill="${SKY_BLUE}" ${ink}/>
      <path d="M380 400 Q440 380 430 320 L400 316 Q404 350 370 370 Z" fill="${SKY_BLUE}" ${ink}/>
      <rect x="404" y="252" width="28" height="74" rx="14" fill="${SKY_BLUE}" ${ink}/>`,
    // Both wings spread wide to glide.
    spread: `<path d="M150 330 Q40 300 0 220 Q80 250 170 280 Z" fill="${SKY_BLUE}" ${ink}/>
      <path d="M370 330 Q480 300 520 220 Q440 250 350 280 Z" fill="${SKY_BLUE}" ${ink}/>`,
  }[wings]
  return `<g transform="${transform}">
    <path d="M220 540 V586 M300 540 V586 M200 586 H240 M280 586 H320" fill="none" stroke="${BEAK}" stroke-width="14" stroke-linecap="round"/>
    ${wing}
    <ellipse cx="260" cy="380" rx="150" ry="170" fill="${SKY_BLUE}" ${ink}/>
    <ellipse cx="260" cy="430" rx="96" ry="108" fill="${BELLY}" ${thin}/>
    <circle cx="206" cy="220" r="34" fill="#fff" ${thin}/><circle cx="314" cy="220" r="34" fill="#fff" ${thin}/>
    <circle cx="212" cy="226" r="16" fill="${INK}"/><circle cx="308" cy="226" r="16" fill="${INK}"/>
    <circle cx="218" cy="220" r="5" fill="#fff"/><circle cx="314" cy="220" r="5" fill="#fff"/>
    <circle cx="170" cy="270" r="20" fill="${PINK}"/><circle cx="350" cy="270" r="20" fill="${PINK}"/>
    ${beak}
    <ellipse cx="260" cy="170" rx="170" ry="34" fill="${STRAW}" ${ink}/>
    <path d="M170 168 Q180 80 260 78 Q340 80 350 168 Z" fill="${STRAW}" ${ink}/>
    <path d="M176 150 Q260 168 344 150" fill="none" stroke="${RED}" stroke-width="16"/>
    <path d="M200 120 L210 100 M240 110 L244 90 M290 110 L296 92" ${thin}/>
  </g>`
}

/** The cover pose: gliding with her wings spread over a strip of terraces. */
const coverPose = `
  <path d="M0 560 Q120 520 260 540 T520 520 V600 H0 Z" fill="${GREEN_LIGHT}" ${ink}/>
  ${bird({ wings: 'spread', mouth: 'smile', transform: 'translate(0 -30) scale(1)' })}
  <path d="M40 120 q30 -16 60 0 M420 90 q30 -16 60 0" fill="none" ${thin}/>`

// Picture cards, 600×560, the subject large and centred like the comic cards.
const cards = {
  // นก: a little round bird on a twig.
  nok: `<path d="M60 470 H540" fill="none" stroke="#8a5a2b" stroke-width="24" stroke-linecap="round"/>
    <path d="M380 470 l40 -50 M200 470 l-30 -40" fill="none" ${thin}/>
    <path d="M420 300 L520 260 L470 340 Z" fill="#c8643b" ${ink}/>
    <ellipse cx="300" cy="320" rx="160" ry="130" fill="#c8643b" ${ink}/>
    <ellipse cx="270" cy="360" rx="90" ry="70" fill="${BELLY}" ${thin}/>
    <path d="M300 300 Q360 250 420 300 Q370 340 300 300 Z" fill="#a24a28" ${thin}/>
    <circle cx="210" cy="260" r="22" fill="#fff" ${thin}/><circle cx="214" cy="264" r="10" fill="${INK}"/>
    <path d="M150 280 L100 296 L150 310 Z" fill="${BEAK}" ${ink}/>
    <path d="M260 450 V470 M320 450 V470" ${ink}/>`,
  // ผัก: a bunch of green leafy vegetables tied with string.
  phak: `<path d="M300 500 Q240 380 140 300 Q110 200 200 190 Q240 260 300 380 Z" fill="${GREEN_LIGHT}" ${ink}/>
    <path d="M300 500 Q360 380 460 300 Q490 200 400 190 Q360 260 300 380 Z" fill="${GREEN_LIGHT}" ${ink}/>
    <path d="M300 500 Q250 300 300 90 Q350 300 300 500 Z" fill="${GREEN}" ${ink}/>
    <path d="M300 480 V140 M300 330 L240 260 M300 330 L360 260" fill="none" stroke="#d8f0b8" stroke-width="8" stroke-linecap="round"/>
    <rect x="262" y="430" width="76" height="30" rx="10" fill="${RED}" ${thin}/>
    <path d="M280 470 V530 M320 470 V530" stroke="#f2f2e0" stroke-width="14" stroke-linecap="round"/>`,
  // ดอก: a big red flower on its stem.
  dok: `<path d="M300 520 Q290 400 300 300" fill="none" stroke="${GREEN}" stroke-width="22" stroke-linecap="round"/>
    <path d="M300 430 Q220 380 200 420 Q240 460 300 440 Z M300 400 Q380 350 400 390 Q360 430 300 410 Z" fill="${GREEN_LIGHT}" ${ink}/>
    ${[0, 60, 120, 180, 240, 300].map((deg) => `<ellipse transform="rotate(${deg} 300 220)" cx="300" cy="130" rx="60" ry="90" fill="${RED}" ${ink}/>`).join('')}
    <circle cx="300" cy="220" r="56" fill="${STRAW}" ${ink}/>`,
  // เด็ก: a small smiling child, arms open.
  dek: `<path d="M220 300 L380 300 L410 480 H190 Z" fill="#3f7fd0" ${ink}/>
    <path d="M220 320 L130 260 M380 320 L470 260" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M220 320 L130 260 M380 320 L470 260" fill="none" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>
    <path d="M240 480 V540 M360 480 V540" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M240 480 V540 M360 480 V540" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>
    <circle cx="300" cy="190" r="100" fill="${SKIN}" ${ink}/>
    <path d="M200 170 Q220 80 300 86 Q380 80 400 170 Q340 130 300 140 Q260 130 200 170 Z" fill="${INK}"/>
    <circle cx="262" cy="196" r="10" fill="${INK}"/><circle cx="338" cy="196" r="10" fill="${INK}"/>
    <path d="M260 236 Q300 270 340 236" fill="none" ${thin}/>
    <circle cx="236" cy="230" r="14" fill="${PINK}"/><circle cx="364" cy="230" r="14" fill="${PINK}"/>`,
  // ปาก: a big smiling mouth with teeth.
  pak: `<path d="M90 230 Q300 160 510 230 Q480 440 300 450 Q120 440 90 230 Z" fill="${RED}" ${ink}/>
    <path d="M140 250 Q300 220 460 250 L440 300 Q300 280 160 300 Z" fill="#fff" ${thin}/>
    <path d="M200 260 V292 M250 252 V288 M300 250 V286 M350 252 V288 M400 260 V292" ${thin}/>
    <path d="M200 380 Q300 420 400 380 Q300 340 200 380 Z" fill="${PINK}" ${thin}/>`,
  // แบก: a child carrying a big sack on the shoulder.
  baek: `<path d="M230 330 L340 330 L360 480 H210 Z" fill="${TERRACOTTA}" ${ink}/>
    <path d="M240 480 V540 M330 480 V540" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M240 480 V540 M330 480 V540" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>
    <circle cx="270" cy="240" r="80" fill="${SKIN}" ${ink}/>
    <path d="M190 224 Q206 156 270 160 Q334 156 350 224 Q300 196 270 200 Q240 196 190 224 Z" fill="${INK}"/>
    <circle cx="246" cy="250" r="9" fill="${INK}"/><circle cx="296" cy="250" r="9" fill="${INK}"/>
    <path d="M246 286 Q270 304 294 286" fill="none" ${thin}/>
    <path d="M330 220 Q340 120 440 110 Q540 120 530 230 Q520 320 430 320 Q340 310 330 220 Z" fill="#d9b77a" ${ink}/>
    <path d="M420 112 Q440 80 470 96" fill="none" ${ink}/>
    <path d="M330 340 Q380 300 380 250" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M330 340 Q380 300 380 250" fill="none" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>`,
  // หมวก: a straw hat with a red band.
  muak: `<ellipse cx="300" cy="370" rx="240" ry="70" fill="${STRAW}" ${ink}/>
    <path d="M170 360 Q170 170 300 160 Q430 170 430 360 Z" fill="${STRAW}" ${ink}/>
    <path d="M176 320 Q300 350 424 320 L428 290 Q300 316 172 290 Z" fill="${RED}" ${thin}/>
    <path d="M220 230 L240 200 M300 220 V190 M370 230 L356 200" ${thin}/>`,
  // โลก: the globe on a stand.
  lok: `<path d="M300 440 V500 M220 510 H380" fill="none" stroke="#8a5a2b" stroke-width="22" stroke-linecap="round"/>
    <path d="M150 260 A160 160 0 0 0 440 360" fill="none" stroke="#8a5a2b" stroke-width="14" stroke-linecap="round"/>
    <circle cx="300" cy="270" r="160" fill="#4fa8e8" ${ink}/>
    <path d="M200 180 Q260 150 300 190 Q290 250 230 260 Q180 240 200 180 Z M330 280 Q400 250 430 300 Q410 380 350 380 Q310 340 330 280 Z" fill="${GREEN_LIGHT}" ${thin}/>`,
  // ไก่: a hen.
  kai: `<path d="M300 470 V520 M360 470 V520 M280 520 H320 M340 520 H380" fill="none" stroke="${BEAK}" stroke-width="14" stroke-linecap="round"/>
    <path d="M140 300 Q120 470 330 480 Q500 470 480 300 Q470 230 400 250 Q300 300 140 300 Z" fill="#fff" ${ink}/>
    <path d="M440 260 Q520 200 500 120 Q470 160 430 170 Z" fill="${RED}" ${ink}/>
    <circle cx="200" cy="230" r="90" fill="#fff" ${ink}/>
    <path d="M160 150 Q170 110 200 130 Q210 100 240 130 Q260 110 266 150 Z" fill="${RED}" ${ink}/>
    <path d="M110 230 L70 250 L110 266 Z" fill="${BEAK}" ${ink}/>
    <path d="M120 280 Q110 320 136 320 Q150 300 140 276 Z" fill="${RED}" ${thin}/>
    <circle cx="180" cy="220" r="12" fill="${INK}"/>
    <path d="M300 340 Q360 420 430 360" fill="none" ${thin}/>`,
  // แก้ว: a glass of water.
  kaeo: `<path d="M180 120 H420 L390 500 H210 Z" fill="#e9f6ff" ${ink}/>
    <path d="M196 260 H404 L390 500 H210 Z" fill="#8fd0f5" ${thin}/>
    <path d="M230 160 L246 460" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
    <ellipse cx="300" cy="120" rx="120" ry="20" fill="#f6fbff" ${ink}/>`,
}

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`

/** A card's drawing placed into a panel at (x, y) and scale k. */
const place = (slug, x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">${cards[slug]}</g>`
const panelSky = (sky = '#bfe6fb') =>
  `<rect width="800" height="600" fill="${sky}"/><path d="M0 460 Q200 420 400 450 T800 430 V600 H0 Z" fill="${GREEN_LIGHT}" ${ink}/>` +
  `<path d="M0 520 Q200 490 400 510 T800 500 V600 H0 Z" fill="${SOIL}" ${thin}/>`

// Step 7 comic panels, 800×600: one picture per line of the rhyme (docs/mae-kok-spec.md).
const panels = {
  // น้องนกบินลงแปลงผัก: น้องนก flying down to the vegetable plot.
  'kok-panel-1': `${panelSky()}${place('phak', 430, 300, 0.55)}${place('phak', 560, 320, 0.45)}${bird({ wings: 'spread', mouth: 'smile', transform: 'translate(60 20) scale(0.7)' })}`,
  // เด็กแบกตะกร้าผัก: a child carrying a basket of vegetables.
  'kok-panel-2': `${panelSky()}${place('baek', 140, 60, 0.85)}${place('phak', 470, 70, 0.4)}`,
  // ดอกสีแดงบานแล้ว: a red flower blooming in the garden.
  'kok-panel-3': `${panelSky('#d8f1ff')}<circle cx="680" cy="110" r="60" fill="${STRAW}" ${ink}/>${place('dok', 220, 60, 0.85)}`,
  // นกอ้าปากร้องเพลง: น้องนก singing with her beak open, music notes round her.
  'kok-panel-4': `${panelSky()}${bird({ wings: 'up', mouth: 'open', transform: 'translate(250 20) scale(0.85)' })}
    <path d="M140 160 V240 M140 160 L180 150 V230" fill="none" ${ink}/><circle cx="128" cy="240" r="16" fill="${INK}"/><circle cx="168" cy="230" r="16" fill="${INK}"/>
    <path d="M640 120 V200" fill="none" ${ink}/><circle cx="628" cy="200" r="16" fill="${INK}"/>`,
}

const art = {
  'mascot-nok-greet': svg(520, 600, bird({ wings: 'wave', mouth: 'smile' })),
  'mascot-nok-cheer': svg(520, 600, bird({ wings: 'up', mouth: 'open' })),
  'mascot-nok-encourage': svg(520, 600, bird({ wings: 'thumb', mouth: 'smile' })),
  'mascot-nok-cover': svg(520, 600, coverPose),
  ...Object.fromEntries(Object.entries(cards).map(([slug, body]) => [`word-${slug}`, svg(600, 560, body)])),
  ...Object.fromEntries(Object.entries(panels).map(([name, body]) => [name, svg(800, 600, body)])),
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

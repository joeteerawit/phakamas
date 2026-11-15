// Clear labelled placeholders for แม่กน (docs/mae-kon-spec.md) until the art ticket (#97) lands: a plain inked
// pictogram on a dashed placeholder card, with a PLACEHOLDER tag and the file's name, so nobody mistakes it for art.
// The Thai word is never drawn on a card, as Steps 5 and 6 ask the child to name the picture. Rendered by
// Playwright's Chromium on a transparent background and encoded with cwebp into public/assets/comic/, under the
// names the real art will replace.
// Usage (from apps/thai-spelling, needs cwebp on PATH): node scripts/mae-kon-placeholders.mjs [name ...]
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = 'public/assets/comic'
const INK = '#2b1d12'
const ink = `stroke="${INK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`
const thin = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`

const WOOD = '#b9783f'
const LEAF = '#4f9a3a'
const MARIGOLD = '#f59b1b'
const CORAL = '#e5533d'
const SKIN = '#f2c48d'
const CANAL = '#5aa58a'
const PAPER = '#fbf3e1'

/** The placeholder frame: a dashed card with a PLACEHOLDER tag and the file name along the bottom. */
const frame = (width, height, name, body) => `
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="36" fill="${PAPER}" stroke="#9a8a74" stroke-width="8" stroke-dasharray="26 16"/>
  ${body}
  <rect x="${width / 2 - 190}" y="${height - 74}" width="380" height="50" rx="25" fill="#5b5146"/>
  <text x="${width / 2}" y="${height - 40}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#fff" letter-spacing="2">PLACEHOLDER · ${name}</text>`

// Picture cards, 600×560: one plain pictogram, large and centred above the tag.
const cards = {
  // จาน: a round plate seen from a little above.
  chan: `<ellipse cx="300" cy="270" rx="220" ry="120" fill="#fff" ${ink}/><ellipse cx="300" cy="262" rx="140" ry="70" fill="#eaf4fb" ${thin}/>
    <path d="M200 236 Q300 206 400 236" fill="none" stroke="#9ccbe8" stroke-width="10" stroke-linecap="round"/>`,
  // ช้อน: a spoon lying slanted.
  chon: `<g transform="rotate(-35 300 260)"><ellipse cx="300" cy="140" rx="70" ry="96" fill="#dfe6ec" ${ink}/>
    <ellipse cx="300" cy="140" rx="40" ry="62" fill="#c3ced8"/>
    <rect x="286" y="228" width="28" height="230" rx="14" fill="#dfe6ec" ${ink}/></g>`,
  // ร้าน: a market stall with a striped awning and fruit on its counter.
  ran: `<path d="M110 140 H490 L520 210 H80 Z" fill="${CORAL}" ${ink}/>
    <path d="M160 140 L150 210 M240 140 L235 210 M320 140 L325 210 M400 140 L415 210" ${thin} fill="none"/>
    <path d="M80 210 Q120 250 160 210 Q200 250 240 210 Q280 250 320 210 Q360 250 400 210 Q440 250 480 210 Q500 240 520 210" fill="${MARIGOLD}" ${thin}/>
    <rect x="120" y="250" width="22" height="200" fill="${WOOD}" ${thin}/><rect x="458" y="250" width="22" height="200" fill="${WOOD}" ${thin}/>
    <rect x="100" y="360" width="400" height="70" rx="8" fill="${WOOD}" ${ink}/>
    ${[[180, 340], [240, 334], [300, 340], [360, 334], [420, 340]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="26" fill="${[MARIGOLD, LEAF, CORAL, '#f6d13a', LEAF][i]}" ${thin}/>`).join('')}`,
  // กิน: a child's face with a spoon of rice at the open mouth.
  kin: `<circle cx="270" cy="260" r="160" fill="${SKIN}" ${ink}/>
    <path d="M110 230 Q130 90 270 96 Q410 90 430 230 Q370 150 270 150 Q170 150 110 230 Z" fill="#2b1d12"/>
    <circle cx="215" cy="240" r="14" fill="${INK}"/><circle cx="320" cy="240" r="14" fill="${INK}"/>
    <ellipse cx="275" cy="330" rx="46" ry="34" fill="#a3302a" ${ink}/>
    <g transform="rotate(-20 420 330)"><ellipse cx="350" cy="330" rx="46" ry="30" fill="#dfe6ec" ${ink}/><rect x="390" y="318" width="150" height="24" rx="12" fill="#dfe6ec" ${ink}/>
    <circle cx="340" cy="318" r="12" fill="#fff" ${thin}/><circle cx="362" cy="322" r="12" fill="#fff" ${thin}/></g>`,
  // คน: a person standing, arms down.
  khon: `<circle cx="300" cy="130" r="70" fill="${SKIN}" ${ink}/>
    <path d="M230 210 Q300 190 370 210 L392 360 H208 Z" fill="${CANAL}" ${ink}/>
    <path d="M230 222 L180 340 M370 222 L420 340" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/><path d="M230 222 L180 340 M370 222 L420 340" fill="none" stroke="${SKIN}" stroke-width="20" stroke-linecap="round"/>
    <path d="M250 360 V450 M350 360 V450" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M250 360 V450 M350 360 V450" fill="none" stroke="#3d5a80" stroke-width="26" stroke-linecap="round"/>`,
  // ฟัน: one big shiny tooth.
  fan: `<path d="M180 120 Q240 80 300 120 Q360 80 420 120 Q470 170 440 260 Q420 320 410 420 Q400 460 372 430 Q350 340 300 340 Q250 340 228 430 Q200 460 190 420 Q180 320 160 260 Q130 170 180 120 Z" fill="#fff" ${ink}/>
    <path d="M210 160 Q230 140 250 150" fill="none" stroke="#bfe3f5" stroke-width="12" stroke-linecap="round"/>`,
  // แขน: an arm bent at the elbow, showing its muscle.
  khaen: `<path d="M110 420 Q120 300 230 300 L330 300 Q360 200 300 140 Q290 100 330 92 Q400 90 420 160 Q450 260 400 360 Q370 420 300 420 Z" fill="${SKIN}" ${ink}/>
    <path d="M250 330 Q300 260 350 300" fill="none" ${thin}/>
    <path d="M110 420 H300" fill="none" ${ink}/>`,
  // นก: a small bird.
  nok: `<ellipse cx="290" cy="290" rx="170" ry="120" fill="#6fb3e0" ${ink}/>
    <circle cx="420" cy="210" r="76" fill="#6fb3e0" ${ink}/>
    <path d="M488 200 L548 222 L488 240 Z" fill="${MARIGOLD}" ${ink}/>
    <circle cx="436" cy="196" r="12" fill="${INK}"/>
    <path d="M200 280 Q290 210 340 300 Q270 340 200 280 Z" fill="#4a90c2" ${ink}/>
    <path d="M128 280 L60 240 L70 320 Z" fill="#4a90c2" ${ink}/>
    <path d="M260 404 V450 M320 404 V450" fill="none" ${ink}/>`,
  // เรือ: a wooden boat on the water.
  ruea: `<path d="M60 250 Q300 300 540 250 L470 380 Q300 410 130 380 Z" fill="${WOOD}" ${ink}/>
    <path d="M100 290 Q300 330 500 290" fill="none" ${thin}/>
    <path d="M70 430 Q140 400 210 430 T350 430 T490 430" fill="none" stroke="${CANAL}" stroke-width="14" stroke-linecap="round"/>`,
}

// Step 7 comic panels, 1024×768: one scene each, drawn as plainly as the cards.
const scene = (body) => `<rect x="40" y="40" width="944" height="600" rx="20" fill="#cfe9f5" ${thin}/>
  <path d="M40 470 H984 V640 H40 Z" fill="${CANAL}"/>${body}`
const panels = {
  // Paddling to the market past a stall.
  1: scene(`<path d="M600 250 H900 L920 300 H580 Z" fill="${CORAL}" ${ink}/><rect x="600" y="300" width="300" height="170" fill="${WOOD}" ${ink}/>
    <path d="M160 470 Q330 510 500 470 L460 540 Q330 560 200 540 Z" fill="${WOOD}" ${ink}/><circle cx="330" cy="400" r="50" fill="${SKIN}" ${ink}/>
    <path d="M420 360 L360 560" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>`),
  // A vendor selling plates and spoons.
  2: scene(`<rect x="160" y="300" width="700" height="170" rx="10" fill="${WOOD}" ${ink}/>
    ${[260, 420, 580].map((x) => `<ellipse cx="${x}" cy="290" rx="70" ry="30" fill="#fff" ${thin}/>`).join('')}
    <rect x="720" y="230" width="20" height="90" rx="10" fill="#dfe6ec" ${thin}/><ellipse cx="730" cy="222" rx="24" ry="32" fill="#dfe6ec" ${thin}/>
    <circle cx="510" cy="160" r="60" fill="${SKIN}" ${ink}/>`),
  // A sweet-seller smiling.
  3: scene(`<circle cx="512" cy="280" r="120" fill="${SKIN}" ${ink}/><path d="M440 320 Q512 380 584 320" fill="none" ${ink}/>
    <circle cx="470" cy="250" r="12" fill="${INK}"/><circle cx="554" cy="250" r="12" fill="${INK}"/>
    ${[[300, 520], [400, 540], [620, 540], [720, 520]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="40" fill="#f7a8c4" ${thin}/>`).join('')}`),
  // At home eating with mum.
  4: scene(`<path d="M300 180 L512 60 L724 180 V470 H300 Z" fill="#e8c38f" ${ink}/><rect x="460" y="320" width="104" height="150" fill="${WOOD}" ${thin}/>
    <circle cx="200" cy="420" r="44" fill="${SKIN}" ${ink}/><circle cx="830" cy="400" r="56" fill="${SKIN}" ${ink}/>
    <ellipse cx="512" cy="560" rx="120" ry="34" fill="#fff" ${thin}/>`),
}

// น้องส้ม in her wooden boat, 480×600 (the cover pose 640×480): two black braids with red ribbons, an orange top.
// `arms` makes the pose. Placeholders have no card, only the PLACEHOLDER tag under the figure.
const ORANGE = '#f28a1e'
const limb = (d) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${SKIN}" stroke-width="20" stroke-linecap="round"/>`
function girlInBoat({ arms, mouth = 'smile', paddle = false, x = 0 }) {
  const smile = mouth === 'open' ? `<path d="M210 248 Q240 290 270 248 Z" fill="#a3302a" ${thin}/>` : `<path d="M208 246 Q240 270 272 246" fill="none" ${thin}/>`
  const arm = {
    wave: limb('M180 330 Q150 380 170 420') + limb('M300 330 Q350 270 360 200'),
    up: limb('M180 330 Q130 260 128 190') + limb('M300 330 Q350 260 352 190'),
    thumb: limb('M180 330 Q150 380 170 420') + limb('M300 330 Q350 360 340 300') + `<rect x="318" y="268" width="40" height="36" rx="14" fill="${SKIN}" ${thin}/><rect x="330" y="230" width="16" height="44" rx="8" fill="${SKIN}" ${thin}/>`,
    paddle: limb('M180 330 Q220 380 280 380') + limb('M300 330 Q320 370 300 400'),
  }[arms]
  const oar = paddle
    ? `<path d="M380 240 L230 560" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M380 240 L230 560" stroke="${WOOD}" stroke-width="12" stroke-linecap="round"/><path d="M236 548 Q200 600 214 630 Q244 640 260 590 Z" fill="${WOOD}" ${ink}/>`
    : ''
  return `<g transform="translate(${x} 0)">
    ${oar}
    <path d="M150 300 Q240 280 330 300 L350 470 H130 Z" fill="${ORANGE}" ${ink}/>
    <path d="M196 300 Q240 330 284 300" fill="none" stroke="#fff4dc" stroke-width="14" stroke-linecap="round"/>
    ${arm}
    <path d="M160 200 Q150 330 140 360" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/><path d="M320 200 Q330 330 340 360" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
    <circle cx="140" cy="366" r="12" fill="${CORAL}" ${thin}/><circle cx="340" cy="366" r="12" fill="${CORAL}" ${thin}/>
    <circle cx="240" cy="200" r="92" fill="${SKIN}" ${ink}/>
    <path d="M148 196 Q150 96 240 100 Q330 96 332 196 Q300 140 240 140 Q180 140 148 196 Z" fill="${INK}"/>
    <circle cx="206" cy="206" r="10" fill="${INK}"/><circle cx="274" cy="206" r="10" fill="${INK}"/>
    <circle cx="188" cy="236" r="14" fill="#f7a8a0"/><circle cx="292" cy="236" r="14" fill="#f7a8a0"/>
    ${smile}
    <path d="M40 430 Q240 470 440 430 L400 540 Q240 570 80 540 Z" fill="${WOOD}" ${ink}/>
    <path d="M60 462 Q240 500 420 462" fill="none" ${thin}/>
    <path d="M30 580 Q90 556 150 580 T270 580 T390 580 T470 580" fill="none" stroke="${CANAL}" stroke-width="12" stroke-linecap="round"/>
  </g>`
}
const tag = (width, height, name) => `
  <rect x="12" y="${height - 56}" width="${width - 24}" height="46" rx="23" fill="#5b5146"/>
  <text x="${width / 2}" y="${height - 24}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="#fff" letter-spacing="2">PLACEHOLDER · ${name}</text>`
const mascots = {
  'mascot-kon-greet': [480, 660, girlInBoat({ arms: 'wave' })],
  'mascot-kon-cheer': [480, 660, girlInBoat({ arms: 'up', mouth: 'open' })],
  'mascot-kon-encourage': [480, 660, girlInBoat({ arms: 'thumb' })],
  'mascot-kon-cover': [640, 660, girlInBoat({ arms: 'paddle', paddle: true, x: 60 })],
}

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`

const art = {
  ...Object.fromEntries(Object.entries(cards).map(([slug, body]) => [`word-${slug}`, svg(600, 560, frame(600, 560, `word-${slug}`, body))])),
  ...Object.fromEntries(Object.entries(panels).map(([n, body]) => [`kon-panel-${n}`, svg(1024, 768, frame(1024, 768, `kon-panel-${n}`, body))])),
  ...Object.fromEntries(Object.entries(mascots).map(([name, [w, h, body]]) => [name, svg(w, h, body + tag(w, h, name))])),
}

const only = process.argv.slice(2)
const tmp = mkdtempSync(join(tmpdir(), 'mae-kon-placeholders-'))
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const [name, markup] of Object.entries(art)) {
    if (only.length && !only.includes(name)) continue
    const [, width, height] = markup.match(/width="(\d+)" height="(\d+)"/).map(Number)
    await page.setViewportSize({ width, height })
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`)
    const png = join(tmp, `${name}.png`)
    await page.locator('svg').screenshot({ path: png, omitBackground: true })
    execFileSync('cwebp', ['-quiet', '-q', '80', '-alpha_q', '90', png, '-o', join(OUT, `${name}.webp`)])
    console.error(`${OUT}/${name}.webp`)
  }
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}

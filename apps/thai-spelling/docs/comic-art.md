# Comic art

Art for the comic-art experiment (#30). Files live in `public/assets/comic/`. Style prompts describe visual traits only and never name another game or its characters.

## Background scene design

Decided by the owner on 2026-11-03: a plain background is not enough, it must interest children.

- A scene has many objects and they move: animals, plants, sky.
- Steps where students read or choose words stay calmer: fewer objects, moving more slowly (owner decision, 2026-11-03).
- Prefer objects from the Lesson's own words, such as ช้าง and ผึ้ง for แม่กง.
- Scene objects stay behind the sign, words and buttons, so nothing moving crosses what a student reads or taps.
- Movement is gentle and loops. Under reduced motion the scene is still.
- The scene fills the window on every device, with no letterbox. The sign stays centred and buttons stay in the window's corners.
- Cards have a slowly moving colourful ring, and every tap gets a boing and a burst (still under reduced motion).
- แม่กม's cover Scene draws its moving objects over `kom-scene-cover.webp`: CSS snow and gusts, plus the `word-rom.webp` umbrella blown across the sky and the `word-som.webp` orange rolling down the street (#46). Its windy Scene only has a few CSS leaves and snowflakes falling down the window's sides, clear of the cards, and Step 2's shop street, six shops with dark windows that light when tapped and a road barrier, is drawn in CSS (#47, #65). Step 3 draws `kom-billboard.webp` at its own size with the word on its screen, and the record buzzer on `kom-phone-booth.webp` (#48). Step 4's words sit in the blank panels of three `kom-bus-stop.webp` signs, whose poles run on past the stage's bottom (#49).
- แม่กม's Map (#64) draws `kom-map.webp` in its own layer, scaled like the Scene, with each stop's ice-block sign placed in the art's pixels on its landmark and น้องส้ม (`mascot-som-greet.webp`) on the street; only she and the arrow move, and both are still under reduced motion. A window taller than 16:9 shows the whole map, its top and bottom edges fading into the same art behind.
- แม่กม's UI Kit (#63) needs no raster art: the ice-block buttons, frosted window cards, labels and shop banner are CSS utilities in `styles.css`, and the snowy house, street direction signs, red radio, street-name sign and snowflake-star are inline SVG in `src/themes/mae-kom/kit/`, inked to match the art. The bell jingle is synthesised with the Web Audio API.
- แม่กบ's UI Kit (#70) needs no raster art either: the vinyl buttons, raincoat-pocket cards, drop labels and the reed of raindrop Stars are CSS utilities in `styles.css`, and the teal hut, rubber boots, snail speaker, vinyl title tag and raindrop-star are inline SVG in `src/themes/mae-kop/kit/`. The drip plop is synthesised with the Web Audio API.
- แม่กบ's Scenes (#71) are drawn in CSS and inline SVG in `src/themes/mae-kop/scenes/Pond.tsx`, with no backdrop image: a rain-cloud sky over a teal pond with lily pads, reeds and taro leaves at its sides. The cover adds rain, spreading rings, a drifting paper boat and two children in raincoats splashing clear of the panel; the drizzle has six drops falling down the window's sides; after the rain the sky clears and only slow rings move; Step 7 sits on a plain wet-slate gutter. The cover's title panel is the `vinyl-panel` utility.
- แม่กบ's Map (#72) has no Map art yet, so `src/themes/mae-kop/map/PondMap.tsx` draws the pond from above in SVG, in its own layer scaled like a Scene: grassy banks, the pond and stream, lily pads, the stepping stones and boardwalk, and a small landmark per stop, with น้องกบ (`mascot-kop-greet.webp`) hopping between the stones. Only she and the raindrop arrow move, and both are still under reduced motion.
- แม่กบ's Games (#73–#81) draw their props in CSS and inline SVG until #69 lands: taro leaves and pebbles (Step 2), the flat rock and choir frogs (3), the stream and stepping stones (4), washing lines and pegs (5), puddles and paper boats (6), the four comic panels with their rain, whose pictures reuse the Lesson's own cards and `mascot-kop-greet.webp` until a line has its `panel` art (7), rain boots and the porch mat (8), easels and the porch wall (9), and the nine-band rainbow and น้องกบ's hut (10).

## Shared style text

> Comic book art style with thick bold black ink outlines, flat cel-shading with hard-edged shadows, light hand-inked hatching, subtle halftone dots, bright saturated colours. Child-friendly, not dark or gritty. No text.

Cut-outs ask for a plain flat solid white background (magenta for white objects), then the background is removed.

## Files

| File | Source | Subject (plus the shared style text) |
|---|---|---|
| `cover-scene.webp` | Figma `gpt-image-2.5-flare`, node 3:2 | Open sunny meadow, blue sky, hills, small distant trees; no foreground objects |
| `cover-sign.webp` | Figma, node 2:5 | Blank wooden sign with ropes and vines |
| `cover-rope.webp` | Crop of `cover-sign.webp` | Rope tile, runs on above the stage |
| `cover-tree.webp` | Figma, node 2:6 | Tropical foliage and trunk with a hanging vine |
| `cover-bushes.webp` | Figma, node 2:7 | Row of rounded bushes with small flowers |
| `play-button.webp`, `speaker-button.webp` | Figma, nodes 2:8, 2:9 | Round orange play and blue speaker buttons |
| `mascot-swing.webp` | Canva `generate-image`, media `MAHZ04Hy6yg`, reference `MAHZ0iLrjkA` | น้องลิง swinging from a vine; exported at 600 px tall from a Canva preview |
| `mascot-greet.webp` | Figma, node 1:2 | น้องลิง greeting; the reference for the other poses |
| `mascot-cheer.webp`, `mascot-encourage.webp` | Canva, media `MAHZ0kVYjc4`, `MAHZ0rjQEb0`, reference `MAHZ0iLrjkA` | น้องลิง jumping for joy, and a thumbs up; exported at 600 px from Canva previews |
| `mascot-vine.webp` | Crop of `mascot-swing.webp` | Vine tile, runs on above the stage |
| `decor-elephant.webp`, `decor-bee.webp`, `decor-butterfly.webp`, `decor-bird.webp` | Figma, nodes 4:2 to 4:5 | Baby elephant, honey bee, butterfly, bluebird |
| `decor-rabbit.webp`, `decor-flowers.webp`, `decor-sun.webp`, `decor-cloud.webp` | Figma, nodes 4:6 to 4:9 | Sitting rabbit, flower clump, smiling sun, fluffy cloud |
| `word-ngu.webp`, `word-dang.webp`, `word-ban.webp`, `word-kom.webp`, `word-rang.webp`, `word-khang.webp`, `word-ngao.webp` | Figma, nodes 5:2 to 5:5, 5:8 to 5:10 | Picture cards: friendly snake, megaphone with burst lines, cosy house, child bending down, nest with eggs, dusky langur, child with a long shadow |
| `word-lung.webp`, `word-sung.webp`, `word-bang.webp` | Figma, nodes 7:3, 8:2, 8:3 | Picture cards: cute cartoon uncle waving; three trees rising like stairs with a big up arrow; flying squirrel gliding |
| `word-rom.webp`, `word-lom.webp`, `word-som.webp`, `word-nom.webp`, `word-phom.webp`, `word-cham.webp`, `word-kaem.webp`, `word-yim.webp`, `word-maeo.webp`, `word-ma.webp`, `word-mue.webp`, `word-chom.webp` | Figma `gpt-image-2.5-flare`, nodes 9:2 to 9:13 (แม่กม, #40) | Picture cards: red umbrella; cloud face blowing wind with leaves; tangerine with a leaf; glass of milk; girl from behind brushing long black hair; blue patterned bowl; child pointing at a rosy cheek; child with a big toothy smile; orange tabby cat sitting; brown horse; child's open hand; child amazed behind binoculars |
| `mascot-som-greet.webp`, `mascot-som-cheer.webp`, `mascot-som-encourage.webp`, `mascot-som-float.webp` | Figma `gpt-image-2.5-flare`, nodes 10:2, 11:2 to 11:4 | น้องส้ม (แม่กม Mascot): greeting with umbrella, jumping for joy, thumbs up, floating on the wind holding her umbrella. Each prompt repeats her full design (two black braids with red ribbons, orange coat, cream scarf, red boots) since Figma takes no reference |
| `kom-scene-cover.webp`, `kom-scene-windy.webp`, `kom-scene-night.webp` | Figma, nodes 11:5 to 11:7 | แม่กม Scenes, 1920 wide: busy snowy shop street with an open middle; calm windy street with a big quiet sky; snowy city at night with six buildings, windows dark |
| `kom-panel-1.webp`, `kom-panel-2.webp`, `kom-panel-3.webp`, `kom-panel-4.webp` | Figma, nodes 11:8 to 11:11 | แม่กม Step 7 comic: walking with the umbrella; wind blows hair and scarf; umbrella flies away; at home with milk and an orange |
| `kom-shop-sign.webp`, `kom-phone-booth.webp`, `kom-bus-stop.webp`, `kom-apartment.webp`, `kom-sled.webp`, `kom-street-lamp.webp`, `kom-mailbox.webp`, `kom-billboard.webp` | Figma, nodes 11:12 to 11:19 | แม่กม props: blank hanging shop sign; red phone booth; blank bus-stop sign; apartment facade with six blank windows (2×3); empty sled; street lamp; red post box; blank rooftop billboard |
| `kom-map.webp` | Figma `gpt-image-2.5-flare`, node 12:2 | แม่กม Map, 1920 wide: snowy city seen from above, a winding street past a shop row, billboard building, bus stop, apartment block, umbrella square, cinema, lamp street, post office and a house on the hill, with a frozen pond |
| `kom-bus.webp` | Figma, node 12:3 | Orange city bus from the side with snow on the roof and a blank cream panel for the word (Step 4) |
| `mascot-kop-greet.webp`, `mascot-kop-cheer.webp`, `mascot-kop-encourage.webp`, `mascot-kop-cover.webp` | Stand-ins drawn as SVG in `scripts/placeholder-art.mjs` (แม่กบ, #68), until #69 | น้องกบ (แม่กบ Mascot): green frog girl in a yellow raincoat and red boots, greeting, jumping for joy, thumbs up, and sitting on a lily pad under a taro-leaf umbrella |
| `word-kop.webp`, `word-phap-fold.webp`, `word-chap.webp`, `word-phap.webp`, `word-chep.webp`, `word-ap.webp`, `word-chup.webp`, `word-dap.webp`, `word-bai-mai.webp`, `word-pu.webp` | Stand-ins drawn as SVG in `scripts/placeholder-art.mjs` (แม่กบ, #68), until #69 | Picture cards: frog; paper with its corner folded; hands catching a ball; framed picture; sad face with a plaster; child in a bubble bath; red lips with hearts; sword; leaf; crab. แม่กบ reuses `word-ban.webp` and `word-rom.webp` |
| `mascot-nok-greet.webp`, `mascot-nok-cheer.webp`, `mascot-nok-encourage.webp`, `mascot-nok-cover.webp` | PLACEHOLDER drawn as SVG in `scripts/placeholder-art-mae-kok.mjs` (แม่กก, #82), until #83 | น้องนก (แม่กก Mascot): round sky-blue bird with a cream belly, an orange beak and a straw hat, greeting, jumping for joy, thumbs up, and gliding with wings spread over the terraces |
| `word-nok.webp`, `word-phak.webp`, `word-dok.webp`, `word-dek.webp`, `word-pak.webp`, `word-baek.webp`, `word-muak.webp`, `word-lok.webp`, `word-kai.webp`, `word-kaeo.webp` | PLACEHOLDER drawn as SVG in `scripts/placeholder-art-mae-kok.mjs` (แม่กก, #82), until #83 | Picture cards: little bird on a twig; bunch of greens; red flower; small child; smiling mouth; child carrying a sack; straw hat; globe; hen; glass of water. แม่กก reuses `word-kop.webp` and `word-chang.webp` |
| `kok-panel-1.webp`, `kok-panel-2.webp`, `kok-panel-3.webp`, `kok-panel-4.webp` | PLACEHOLDER drawn as SVG in `scripts/placeholder-art-mae-kok.mjs` (แม่กก, #82), until #83 | แม่กก Step 7 comic, 800×600: น้องนก flying down to the greens; a child carrying a sack by the greens; a red flower under the sun; น้องนก singing among music notes |
| `word-ling.webp`, `word-chang.webp`, `word-phueng.webp` | Copies of `mascot-greet.webp`, `decor-elephant.webp`, `decor-bee.webp` | Picture cards reusing the cover art |
| `step5-scene.webp` | Figma, node 5:11 | Calm flower garden with a beehive and fence at the edges; open quiet middle |
| `ui-home.webp`, `ui-buzzer.webp`, `ui-tap.webp` | Figma, nodes 7:4, 7:6, 7:7 | Orange home button, red dome push button, child's finger pressing a button |
| `ui-plank.webp`, `ui-banner.webp`, `ui-signboard.webp` | Figma, nodes 7:5, 7:8, 7:9 | Blank wooden plank, blank yellow banner plate, blank signboard on two posts |

Figma file: "Thai Spelling - comic art test" (`S7EGKiX45AkDbkCuN1mkQD`). Figma cannot take a reference image, so its Mascot drifted between poses; Mascot poses use Canva with the first Figma Mascot (`MAHZ0iLrjkA`) as the reference.

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
- แม่กม's cover Scene draws its moving objects over `kom-scene-cover.webp`: CSS snow and gusts, plus the `word-rom.webp` umbrella blown across the sky and the `word-som.webp` orange rolling down the street (#46). Its windy Scene only has a few CSS leaves and snowflakes falling down the window's sides, clear of the cards, and Step 2's building row is drawn in CSS (#47). Step 3 draws `kom-billboard.webp` at its own size with the word on its screen, and the record buzzer on `kom-phone-booth.webp` (#48). Step 4's words sit in the blank panels of three `kom-bus-stop.webp` signs, whose poles run on past the stage's bottom (#49).
- แม่กม's UI Kit (#63) needs no raster art: the ice-block buttons, frosted window cards, labels and shop banner are CSS utilities in `styles.css`, and the snowy house, street direction signs, red radio, street-name sign and snowflake-star are inline SVG in `src/themes/mae-kom/kit/`, inked to match the art. The bell jingle is synthesised with the Web Audio API.

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
| `word-ling.webp`, `word-chang.webp`, `word-phueng.webp` | Copies of `mascot-greet.webp`, `decor-elephant.webp`, `decor-bee.webp` | Picture cards reusing the cover art |
| `step5-scene.webp` | Figma, node 5:11 | Calm flower garden with a beehive and fence at the edges; open quiet middle |
| `ui-home.webp`, `ui-buzzer.webp`, `ui-tap.webp` | Figma, nodes 7:4, 7:6, 7:7 | Orange home button, red dome push button, child's finger pressing a button |
| `ui-plank.webp`, `ui-banner.webp`, `ui-signboard.webp` | Figma, nodes 7:5, 7:8, 7:9 | Blank wooden plank, blank yellow banner plate, blank signboard on two posts |

Figma file: "Thai Spelling - comic art test" (`S7EGKiX45AkDbkCuN1mkQD`). Figma cannot take a reference image, so its Mascot drifted between poses; Mascot poses use Canva with the first Figma Mascot (`MAHZ0iLrjkA`) as the reference.

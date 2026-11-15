# แม่กก Lesson Specification

The fourth Lesson. It has the same 10 Steps, rules and scoring as `mae-kong-spec.md`. This file lists only what differs: content, Theme, Scenes, Map, Games and UI Kit (ADR-0002, `game-concept.md`). Epic #60.

## Naming

- Lesson id `mae-kok`, URL `/lesson/mae-kok/1`. A teacher shares the link directly; `/` still opens แม่กง.
- Student-facing text uses the curriculum name **แม่กก**. Its finals are ก ข ค ฆ.

## Content

Words are fixed in `src/lessons/mae-kok.ts` for now. Later a Session will draw them from the Word Catalog (see GLOSSARY).

| Item | Content |
|---|---|
| Cover | Title "คำแม่กกเที่ยวสวนผักบนดอย", subtitle "แม่ กก (ก ข ค ฆ)", same grade line |
| Intro | "สวัสดีเด็ก ๆ วันนี้น้องนกจะพาไปเที่ยวสวนผักบนดอย และเรียนรู้คำในมาตราแม่กกกัน พร้อมแล้วกดเริ่มเรียนได้เลย" |
| Vocabulary (Steps 2, 3, 4, 6) | นก นอ-โอะ-กอ-นก · ผัก ผอ-อะ-กอ-ผัก · ดอก ดอ-ออ-กอ-ดอก · เด็ก ดอ-เอะ-กอ-เด็ก · ปาก ปอ-อา-กอ-ปาก · แบก บอ-แอ-กอ-แบก |
| Teaching point | ข ค ฆ at the end of a word sound like ก, so those words are in แม่กก too. All six Target Words end in ก, so no Target Word is an exception |
| Step 4 narration | The same pattern as แม่กง, with these six words; it names ก as their final and names ข ค ฆ once, as the other finals that sound like ก |
| Step 5 "แม่กกอยู่ไหน?" | Correct: the six words plus หมวก and โลก. Distractors: ไก่, แก้ว (ก is their initial), กบ (แม่กบ), ช้าง (แม่กง) |
| Step 6 "กล่องคำแม่กก" | Word Bank = the six words |
| Step 7 "อ่านการ์ตูนแม่กก" | A 4-panel comic with one line per panel; the highlighted words are in brackets: น้องนกบินลงแปลงผัก [นก ผัก] · เด็กแบกตะกร้าผัก [เด็ก แบก ผัก] · ดอกสีแดงบานแล้ว [ดอก] · นกอ้าปากร้องเพลง [นก ปาก] |
| Step 8 | Pairs ผัก ↔ ตัก, ดอก ↔ บอก |
| Step 9 | "เด็กแบกผักกลับบ้าน" (แบก + ผัก), "นกอ้าปากกินหนอน" (นก + ปาก) |

Rules: a Target Word has every syllable in แม่กก, so ไก่ and แก้ว are left out. Words with ำ (น้ำ, ทำ) never appear as content, but they may appear in Scene backdrops. Audio uses `scripts/gen-audio.sh` (edge-tts, Premwadee), as for แม่กง; กบ and ช้าง reuse their clips and pictures.

## Mascot: น้องนก

A small round bird with a sky-blue body, a cream belly, an orange beak and a straw farmer's hat, with big eyes and rosy cheeks. Four poses: greeting, jumping for joy, thumbs up (a wing up), and gliding with her wings spread (the cover pose). Until the art ticket (#83) lands, the poses, the new picture cards, the comic panels and the Scene backdrops are flat inked stand-ins drawn as SVG in `scripts/placeholder-art-mae-kok.mjs` and exported to webp, each marked PLACEHOLDER (`docs/comic-art.md`).

## Scenes

The palette is fired terracotta, kraft paper and garden green under blue mountains; no other Lesson uses it. The rules in `comic-art.md` hold: objects stay behind words, motion loops gently, and under reduced motion the Scene is still. Each Scene's still backdrop is a webp (a placeholder until #83) and its moving objects are CSS and inline SVG (`src/themes/mae-kok/scenes/`).

| Scene | Steps | Mood |
|---|---|---|
| Busy terraced hillside (`kok-cover`) | 1 | Drifting clouds, a sprinkler arc, swaying vegetable leaves, a child carrying a basket along a far terrace, a worm peeking from the soil |
| Calm terrace (`kok-terrace`) | 2–6, 8, 9 | One terrace under a quiet sky; a few leaves sway at the window's sides |
| Comic wash (`kok-comic`) | 7 | No Scene; a flat sky-to-soil wash behind the trellis |
| Hillside at sunset (`kok-sunset`) | 10 | Warm sky over the terraces; the Step draws the nine terraces that ripen |

## Map

The Map is the terraced hillside seen from the side, following `game-concept.md`. The cover's ▶ opens it. A zigzag footpath climbs the stepped green terraces past the eight stops (Steps 2–9) to the bamboo hut at the top (Step 10), with blue mountains behind. Each stop is a wooden garden stake with a seed-packet label from the Kit. Every stop is open. A terracotta arrow marks the recommended next stop, a done stop grows a green sprout, and Activity stops show their seed-stars, all from the Session. น้องนก hops up the path to the chosen stop and then its Step opens. Under reduced motion she is simply there. Until `kok-map.webp` lands the Map is drawn in CSS and SVG.

## Games

No Game has a timer, and every one has a still version under reduced motion.

| Step | Stop | Game |
|---|---|---|
| 1 | Cover | The busy hillside cover: the title on a staked kraft seed-packet signboard, with น้องนก gliding over the terraces; ▶ (a plant-marker stake) opens the Map |
| 2 | Bare plots | **Water the plots:** six bare soil plots sit in a row on the terrace. Tapping a plot makes น้องนก tip her watering can over it (above the row, never over a word). Then a seed-packet card rises from the soil with the picture and word, and the word plays. Tapping a grown card plays it again. When all six have grown, the gate on the path to the next stop opens. Under reduced motion the card appears at once |
| 3 | Valley lookout | **Valley echo:** น้องนก stands on the terrace edge, and the word is on a stake sign beside her. Tapping the speaker plays the word, then a softer echo rises off the far hill. The student records the word and hears their own voice come back as the echo; recording works as on แม่กม's Step 3. Each word recorded brings one bird to rest on the far ridge; with six, they fly one slow loop in the sky band above the hill |
| 4 | Raised bed | **Stake the final:** the word is written large in the soil of a raised bed. The student drags a small "ตัวสะกด" marker stake (or taps it, then taps a letter) and plants it under the final consonant. Right: the stake stays, the ก turns terracotta red and the spelling line plays with highlighting, then the next word. Wrong: the stake springs back to its holder and a hint plays |
| 5 | Harvest terrace (Activity) | **Harvest the แม่กก plants:** twelve vegetable plants stand still in two terrace rows of six, each with a picture tag. Tapping a plant harvests it where it stands: it lifts, roots showing, into a woven basket at its foot. Tapping again plants it back. ตรวจคำตอบ checks. One plant = one Decision, scored out of 12 as before |
| 6 | Potting shed (Activity) | **Pot the seedlings:** six terracotta pots on a potting shelf each show a picture. The six words are on seedlings in a seed tray. The student drags (or taps, then taps) each seedling into the pot with the matching picture; a potted seedling opens one leaf. ตรวจคำตอบ checks the six pots, scored out of 6 as before. Clearing and retrying work as on แม่กง |
| 7 | Bean trellis | **Comic on the trellis:** the four panels hang face down from a bamboo trellis with wooden pegs. Tapping a panel turns it face up, and the teacher's voice reads its line with highlighting. Tapping a highlighted word plays that word alone. The student can record each line and play it back. When all four panels are read, a bean vine grows along the top of the trellis, above the panels. There is no word collecting |
| 8 | Terrace steps (Activity) | **Balance the carrying pole:** a child stands with a shoulder pole (คานหาบ) and two empty baskets. The four words lie on vegetable bundles along the terrace edge. Tapping a word puts it in the left basket; tapping a second puts it in the right. If they rhyme, the pole balances level, the correct sound plays, and the pair is locked and shown on a sign at the hut. If not, the pole tips and the second word slides back to its bundle. Scored per pair as before, with wrong tries counted. The child walks in a lane above the words; under reduced motion the pair simply appears on the sign |
| 9 | Scarecrow | **Read to the scarecrow:** the scarecrow holds a wooden plank with the sentence, and the two word pictures hang from its arms. The speaker plays the sentence with highlighting. The student records it and plays it back; after a recording, น้องนก lands on the scarecrow's hat and claps. Then the second sentence |
| 10 | Bamboo hut (summary) | The hillside at sunset; one terrace's crop ripens from bare soil to green for each Star, out of the nine the Lesson can give. เก่งมาก!, each Activity's seed-stars, and เรียนอีกครั้ง in the แม่กก Kit. Under reduced motion the earned terraces simply stand ripe |

Where a microphone is refused or missing, playing the word or line counts instead, so every recording Game can still be finished.

## UI Kit

แม่กก's own controls, under `src/themes/mae-kok/kit/`. None may look like แม่กง's clay buttons, comic cards and comic-panel transition, แม่กม's ice blocks, frosted windows and snow flurry, or แม่กบ's vinyl pills, raincoat pockets and ripple.

| Part | แม่กก |
|---|---|
| Buttons | Matte fired-terracotta flowerpots with a rolled rim; the main one sprouts a leaf |
| Home / Back / Next | Home is a wooden birdhouse; Back and Next are plant-marker stakes leaning the way they go, with a burned-in chevron |
| Speaker | A terracotta pot on its side like a horn, with sound lines while it plays |
| Cards | Kraft seed packets with a crimped top |
| Feedback | A kraft leaf-shaped bubble, with น้องนก rising on a garden stake from the window's bottom edge |
| Stars display | Seed-stars in a long wooden planter box; an earned seed-star is terracotta with a sprout |
| Step change | One pass of a hoe sweeping turned soil across the window; a plain crossfade under reduced motion |
| Tap | A hollow clay-pot "tok" (Web Audio) and a burst of seeds and leaf bits at the pointer |

## Art

What the art ticket (#83) makes, in the shared comic style, replacing the stand-ins under the same names. Everything stays within the 3 MB art budget.

| File | Subject |
|---|---|
| `mascot-nok-greet.webp`, `mascot-nok-cheer.webp`, `mascot-nok-encourage.webp`, `mascot-nok-cover.webp` | น้องนก greeting, jumping for joy, thumbs up, gliding with wings spread |
| `word-nok.webp`, `word-phak.webp`, `word-dok.webp`, `word-dek.webp`, `word-pak.webp`, `word-baek.webp` | Picture cards: little bird; bunch of green vegetables; red flower; small child; smiling mouth; child carrying a sack on the shoulder |
| `word-muak.webp`, `word-lok.webp`, `word-kai.webp`, `word-kaeo.webp` | Picture cards: straw hat; globe; hen; drinking glass. กบ and ช้าง reuse `word-kop.webp` and `word-chang.webp` |
| `kok-panel-1.webp` … `kok-panel-4.webp` | Step 7 comic: น้องนก flying down to the vegetable plot; a child carrying a basket of vegetables; a red flower blooming; น้องนก singing with her beak open |
| `kok-scene-cover.webp`, `kok-scene-terrace.webp`, `kok-scene-sunset.webp` | Scenes, 1920 wide: busy terraced hillside with an open middle; one calm terrace under a big quiet sky; the terraced hillside at sunset with nine bare terraces and a bamboo hut |
| `kok-map.webp` | The Map, 1920 wide: the terraced hillside from the side with a zigzag footpath, blue mountains and the bamboo hut at the top |
| `kok-watering-can.webp`, `kok-far-hill.webp`, `kok-raised-bed.webp`, `kok-basket.webp`, `kok-pot.webp`, `kok-trellis.webp`, `kok-carrying-pole.webp`, `kok-scarecrow.webp` | Props for Steps 2–9: watering can; far hill across the valley; wooden raised bed; woven basket; terracotta pot; bamboo trellis; shoulder pole with two baskets; scarecrow in a straw hat |

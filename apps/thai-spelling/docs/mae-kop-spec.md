# แม่กบ Lesson Specification

The third Lesson. It has the same 10 Steps, rules and scoring as `mae-kong-spec.md`. This file lists only what differs: content, Theme, Scenes, Map, Games and UI Kit (ADR-0002, `game-concept.md`). Epic #62.

## Naming

- Lesson id `mae-kop`, URL `/lesson/mae-kop/1`. A teacher shares the link directly; `/` still opens แม่กง.
- Student-facing text uses the curriculum name **แม่กบ**. Its finals are บ ป พ ฟ ภ.

## Content

Words are fixed in `src/lessons/mae-kop.ts` for now. Later a Session will draw them from the Word Catalog (see GLOSSARY).

| Item | Content |
|---|---|
| Cover | Title "คำแม่กบหลบฝน", subtitle "แม่ กบ (บ ป พ ฟ ภ)", same grade line |
| Intro | "สวัสดีเด็ก ๆ วันนี้ฝนตก น้องกบจะพาไปเที่ยวบึงบัว และเรียนรู้คำในมาตราแม่กบกัน พร้อมแล้วกดเริ่มเรียนได้เลย" |
| Vocabulary (Steps 2, 3, 4, 6) | กบ กอ-โอะ-บอ-กบ · พับ พอ-อะ-บอ-พับ · จับ จอ-อะ-บอ-จับ · ภาพ ภอ-อา-พอ-ภาพ · เจ็บ จอ-เอะ-บอ-เจ็บ · อาบ ออ-อา-บอ-อาบ |
| Teaching point | ภาพ ends in พ, which sounds like บ, so it is in แม่กบ too. It is the only Target Word whose final is not บ |
| Step 4 narration | The same pattern as แม่กง, with these six words; it names บ as their final and says the พ of ภาพ sounds like บ |
| Step 5 "แม่กบอยู่ไหน?" | Correct: the six words plus จูบ and ดาบ. Distractors: ใบไม้, ปู, บ้าน (บ or ป is their initial), ร่ม (แม่กม) |
| Step 6 "กล่องคำแม่กบ" | Word Bank = the six words; instruction `ลากเรือคำไปวางในแอ่งน้ำใต้ภาพให้ถูกต้อง`, since the child sails a word boat into a puddle rather than filling a blank (#116) |
| Step 7 "อ่านการ์ตูนแม่กบ" | A 4-panel comic telling one story, one line per panel in a speech bubble (#117); the highlighted words are in brackets: ฝนตกแล้ว กบออกมาอาบฝน [กบ อาบ] · กบพับเรือกระดาษ ปล่อยลอยไป [กบ พับ] · วิ่งไปจับเรือ ลื่นล้มเจ็บเข่า [จับ เจ็บ] · ฝนหยุด กบวาดภาพเรือกับสายรุ้ง [กบ ภาพ] |
| Step 8 | Pairs กบ ↔ จบ, จับ ↔ รับ |
| Step 9 | "กบเจ็บ แม่จูบให้หาย" (เจ็บ + จูบ), "พี่พับภาพเป็นเรือ" (พับ + ภาพ) |

Rules: a Target Word has every syllable in แม่กบ, so ใบไม้ and ปู are left out. Words with ำ (น้ำ, ทำ) never appear as content, but they may appear in Scene backdrops. Audio uses `scripts/gen-audio.sh` (edge-tts, Premwadee), as for แม่กง; บ้าน and ร่ม reuse their clips and pictures.

## Mascot: น้องกบ

A small green frog girl in a raincoat-yellow hood and red rubber boots, with big eyes, rosy cheeks and a wide smile. Four poses: greeting, jumping for joy, thumbs up, and sitting on a lily pad under a taro-leaf umbrella (the cover pose). Until the art ticket (#69) lands, the poses and the new picture cards are flat inked stand-ins drawn as SVG in `scripts/placeholder-art.mjs` and exported to webp (`docs/comic-art.md`).

## Scenes

The palette is pond teal, rain-cloud slate and raincoat yellow; no other Lesson uses it. The rules in `comic-art.md` hold: objects stay behind words, motion loops gently, and under reduced motion the Scene is still. The Scenes are drawn in CSS and inline SVG (`src/themes/mae-kop/scenes/`), so they need no raster art.

| Scene | Steps | Mood |
|---|---|---|
| Busy rainy pond | 1 | Rain, rings on the puddles, swaying reeds, a paper boat drifting, children in raincoats splashing at the edges |
| Calm drizzle | 2–6, 8, 9 | A few drops falling down the window's sides and slow rings on the pond |
| Pond after the rain | 10 | Clear sky and slow rings; the Step draws the nine-band rainbow |
| Comic panels | 7 | No Scene; the four panels fill the window |

## Map

The Map is the rainy pond seen from above, following `game-concept.md`. The cover's ▶ opens it. A path of stepping stones and a boardwalk joins the eight stops (Steps 2–9) from the taro bank to น้องกบ's hut on stilts (Step 10). Every stop is open. A raindrop arrow marks the recommended next stop, a done stop has a paper boat moored by it, and Activity stops show their Stars. น้องกบ hops stone to stone to the chosen stop. Under reduced motion she is simply there.

## Games

No Game has a timer, and every one has a still version under reduced motion.

| Step | Stop | Game |
|---|---|---|
| 1 | Cover | The rainy-pond cover: title on a yellow raincoat-vinyl panel, น้องกบ in the cover pose; ▶ opens the Map |
| 2 | Taro bank | **Peek under the leaves:** six big taro leaves stand on their stalks along the bank, each with a raindrop beaded on top. Tapping a leaf tips the drop off its far edge, away from the words, and the leaf lifts to show the picture sheltering underneath, with the word on a pebble, and plays the word. When all six are lifted, stepping stones to the next stop rise from the water. Still version: the leaf simply shows lifted |
| 3 | Choir rock | **Frog choir:** the word shows on a flat rock and the snail speaker plays it. The student records the word, as on แม่กม's Step 3; while recording, rings spread from the rock. Each word recorded adds one frog friend to the choir rock. With six frogs, the choir plays back the child's six recordings in turn, each frog puffing its throat as it sings |
| 4 | Stepping-stone stream | **Tap the last stone:** each word is laid on stepping stones, one letter per stone (a vowel mark rides with its consonant, so เจ็บ is เ · จ็ · บ). The student taps the stone with the final consonant. It turns raincoat yellow and dips with a ripple, then the next word's stones surface. A wrong tap makes that stone wobble and plays a hint. For ภาพ the hint says the พ sounds like บ |
| 5 | Washing line (Activity) | **Bring in the washing:** rain is coming. Twelve picture cards hang still on two washing lines of six, each on a grey peg. Tapping a card swaps its peg for a yellow one and puts a small laundry-basket badge on it (brought in); tapping again undoes it. Nothing moves across the lines. ตรวจคำตอบ scores each card as one Decision, out of 12 as before |
| 6 | Puddle path (Activity) | **Paper boats to the puddles:** six puddles on the path each show a picture reflected in them. The words ride on six paper boats at the bank (the Word Bank). Drag a boat, or tap a boat then a puddle, to float it in the puddle with the matching picture; on tap-tap the boat leaves the bank and appears in the puddle without travelling. Tapping a floating boat sends it back. Checked by the button only, one point per puddle, out of 6 |
| 7 | Rain shelter | **Read the rain away:** the 4-panel comic, with gentle CSS rain falling over each panel's picture but never over its speech bubble. ฟังครูอ่าน reads along with the current line highlighted and the bracketed words in yellow. Each panel has its own record button; when the child finishes reading that line, the rain in that panel stops and its sky brightens. All four read, and the last panel's sun comes out |
| 8 | Boot rack (Activity) | **Find the pair of boots:** four grey rain boots stand on the porch mat, each with a word on its side, in an order where no pair stands side by side. Tap one boot (it lifts a little), then tap the boot whose word rhymes. A right pair turns the same colour (teal or yellow), clops, splashes at its feet and is locked; the boots stay where they stand. A wrong pair wobbles and both turn back to grey. Scored per pair, out of 2, counting wrong tries |
| 9 | Painting porch | **Paint the picture:** each sentence sits under an easel whose canvas shows the sentence's two word pictures as a grey pencil sketch. The student listens, then records the sentence. When the recording ends, the sketch fills with colour and the finished picture hangs on the porch wall. Two sentences give two pictures. Still version: the colour appears at once |
| 10 | น้องกบ's hut (summary) | The pond after the rain. The rainbow has nine bands, one for each Star the Lesson can give; each Star earned fills one band with colour, the rest stay pale outlines. เก่งมาก!, each Activity's raindrop Stars, and เรียนอีกครั้ง in the แม่กบ Kit. Under reduced motion the earned bands simply stand filled |

Where a microphone is refused or missing, playing the word or line counts instead, so every recording Game can still be finished.

## UI Kit

แม่กบ's own controls, under `src/themes/mae-kop/kit/`. None may look like แม่กง's clay buttons, comic cards and comic-panel transition, or แม่กม's ice blocks, frosted windows and snow flurry.

| Part | แม่กบ |
|---|---|
| Buttons | Glossy raincoat-yellow vinyl pills with a white shine streak, a stitched seam and a teal rubber rim; they squash like rubber when pressed |
| Home / Back / Next | Home is a small teal vinyl hut with a drip off its roof; Back and Next are slate-grey rubber boots pointing the way, with a tread on the sole |
| Speaker | A snail on a pebble; its spiral shell is the speaker, with ripple rings while it plays |
| Cards | Raincoat pockets: pale teal vinyl with a yellow stitched seam and two snap buttons |
| Feedback | น้องกบ pops up from a puddle at the window's edge with a ring of splash; her bubble is drop-shaped |
| Stars display | Raindrops hung from a slate-grey reed; an earned drop is raincoat yellow with a star glint |
| Step change | A ripple spreads out from the centre to cover the window, then clears onto the next Step |
| Tap | A soft drip "plop" (Web Audio) and a ring of splashing droplets at the pointer |

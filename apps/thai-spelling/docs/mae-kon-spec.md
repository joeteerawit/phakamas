# แม่กน Lesson Specification

The fourth Lesson. It has the same 10 Steps, rules and scoring as `mae-kong-spec.md`. This file lists only what differs: content, Theme, Scenes, Map, Games and UI Kit (ADR-0002, `game-concept.md`). Epic #59.

Rewritten from the epic, the bodies of its sub-issues (#96–#109) and their closing comments, after the first `lesson/mae-kon` branch was lost. Where neither held the content (the cover title, the intro, the four comic lines, Step 5's extra words and distractors), it was filled in for the rebuild and is marked _rebuilt_ below.

## Naming

- Lesson id `mae-kon`, URL `/lesson/mae-kon/1`. A teacher shares the link directly; `/` still opens แม่กง.
- Student-facing text uses the curriculum name **แม่กน**. Its finals are น ญ ณ ร ล ฬ; every Target Word in this Lesson ends in น.

## Content

Words are fixed in `src/lessons/mae-kon.ts` for now. Later a Session will draw them from the Word Catalog (see GLOSSARY).

| Item | Content |
|---|---|
| Cover | Title "คำแม่กนล่องเรือชมตลาด" (_rebuilt_), subtitle "แม่ กน (น ญ ณ ร ล ฬ)", same grade line |
| Intro | "สวัสดีเด็ก ๆ วันนี้น้องส้มจะพายเรือพาไปเที่ยวตลาดริมคลอง และเรียนรู้คำในมาตราแม่กนกัน พร้อมแล้วกดเริ่มเรียนได้เลย" (_rebuilt_) |
| Vocabulary (Steps 2, 3, 4, 6) | จาน จอ-อา-นอ-จาน · ช้อน ชอ-ออ-นอ-ชอน-ไม้โท-ช้อน · ร้าน รอ-อา-นอ-ราน-ไม้โท-ร้าน · กิน กอ-อิ-นอ-กิน · คน คอ-โอะ-นอ-คน · บ้าน บอ-อา-นอ-บาน-ไม้โท-บ้าน |
| Step 4 narration | The same pattern as แม่กง, with these six words and น as their final; it adds that a final ญ ณ ร ล or ฬ sounds like น too |
| Step 5 "แม่กนอยู่ไหน?" | Correct: the six words plus ฟัน and แขน. Distractors: นก (น is its initial), เรือ (ร is its initial, no final), นม and ชาม (แม่กม) (_rebuilt_ from the words #96 added audio for) |
| Step 6 "กล่องคำแม่กน" | Word Bank = the six words, in the order บ้าน กิน จาน คน ช้อน ร้าน, so no board sits over its own boat |
| Step 7 "อ่านการ์ตูนแม่กน" | A 4-panel comic with one line per panel in a speech bubble; the highlighted words are in brackets (_rebuilt_): น้องส้มพายเรือไปตลาด พบร้านขายของ [ร้าน] · แม่ค้าขายจานและช้อน [จาน ช้อน] · คนขายขนมยิ้มหวาน [คน หวาน] · กลับบ้านกินข้าวกับแม่ [บ้าน กิน] |
| Step 8 | Pairs จาน ↔ หวาน, ช้อน ↔ ร้อน |
| Step 9 | "แม่วางช้อนบนจาน" (ช้อน + จาน), "คนขายยืนยิ้มหน้าร้าน" (คน + ร้าน) |
| Step 10 review words | Section A: the six words. Section B: the two rhyming pairs จาน–หวาน, ช้อน–ร้อน |

Rules: a Target Word has every syllable ending in น, so ขนุน (ขะ-หนุน) and ทุเรียน (ทุ-เรียน) are left out. Words with ำ (น้ำ, ทำ) never appear as content, but they may appear in Scene backdrops; so the content says ตลาดริมคลอง, never ตลาดน้ำ. Audio uses `scripts/gen-audio.sh` (edge-tts, Premwadee), as for แม่กง; บ้าน reuses แม่กง's clip and picture, นม and ชาม reuse แม่กม's.

## Mascot: น้องส้ม

The tickets name น้องส้ม as this Lesson's Mascot (#96, #97, #99–#109): she paddles a small wooden boat through the market. In the Lesson's own art she sits in her boat; on the cover she paddles in. Until the art ticket (#97) lands, #96 borrows her แม่กม poses, and from #99 her boat poses are clear labelled placeholders (`docs/comic-art.md`).

## Scenes

The palette is warm teak wood, canal green, banana-leaf green, marigold orange and coral rope red, with lotus pink at dusk; no other Lesson uses it. The rules in `comic-art.md` hold: objects stay behind words, motion loops gently, and under reduced motion the Scene is still. The Scenes are drawn in CSS and inline SVG (`src/themes/mae-kon/scenes/`), so they need no raster art until #97.

| Scene | Steps | Mood |
|---|---|---|
| Busy floating market | 1 | Vendor boats piled with fruit and flowers bobbing down the canal, a few birds crossing the sky, ripples on the water |
| Quiet canal | 2–9 | Calm: a few lotus pads drifting slowly down the window's sides, clear of the cards |
| Canal at dusk | 10 | A warm evening sky over still water; the Step draws the nine lotus buds |

## Map

The Map is the floating market seen from above, following `game-concept.md`. The cover's ▶ opens it. A winding canal climbs from the bottom-left past eight wooden piers (Steps 2–9) to น้องส้ม's stilt house (Step 10). Every stop is open. A paddle-shaped arrow marks the recommended next stop, a done stop hangs a marigold garland on its pier, and Activity stops show their Stars. Tapping a stop paddles น้องส้ม's boat along the canal to its pier, then opens the Step. Under reduced motion she is simply there. Each Step's Home goes back to the Map.

## Games

No Game has a timer, and every one has a still version under reduced motion.

| Step | Stop | Game |
|---|---|---|
| 1 | Cover | **The floating-market cover:** น้องส้ม paddles in and stops below the title, which is carved on a long boat-plank sign. ▶ opens the Map. Under reduced motion she is already there |
| 2 | Leaf-parcel stall | **Unwrap the leaf parcels:** six banana-leaf parcels (ห่อใบตอง) sit on a tray, three by two. Tapping a parcel unfolds its leaf: the picture and word show inside and the word plays. Open parcels stay open and can be tapped again. When all six are open, the stall-keeper waves and น้องส้ม cheers. Under reduced motion the leaf is simply open |
| 3 | Vendor boat | **Call and answer across the canal:** a vendor boat glides in with one word on a big paddle sign. The speaker plays the vendor's call, then "ถึงตาหนูอ่านแล้ว" shows on น้องส้ม's side of the canal. The student records the word and may play it back; recording works as on แม่กม's Step 3. Each word recorded threads one marigold onto a garland at the top of the screen, and the next boat glides in. Six flowers close the garland, which is hung on น้องส้ม's bow. The word list below lets the child jump to any word. Under reduced motion the boat is just there |
| 4 | Hat stall | **Hat on the final:** each word card shows its letters on wooden tiles. The student drags a small red งอบ (or taps the hat, then taps a tile) onto the final consonant. On the น, the hat stays, the น turns red and the spelling line plays. On any other tile, the hat goes back to the stack and a short hint plays. Two sets of three words, as on แม่กง. "แสดงตัวสะกด" puts a hat on every น |
| 5 | Fruit boats (Activity) | **Fill the shopping basket:** two vendor boats are moored still, one above the other, each with six goods (picture and word). Tap a good to put a banana-leaf tag on it, meaning "into my basket"; tap again to take it out. "ตรวจคำตอบ" checks all twelve. One good = one Decision, scored out of 12. Wrong ones get a red ring, as on แม่กง |
| 6 | Mooring (Activity) | **Name the boats:** six boats are tied at the mooring, each carrying one picture as cargo and a blank name board on its side. The Word Bank is a bundle of wooden name boards on a pier post. Drag a board to a boat (or tap, then tap). "ตรวจคำตอบ" checks all six. One board = one point, scored out of 6, with "ลองอีกครั้ง" and "ล้างคำตอบ" as before. A correct boat raises a little coral flag |
| 7 | Comic pier | **Paddle through the comic:** the four panels stand in a row along the canal bank, in a 2×2 grid on a narrow phone. น้องส้ม's boat waits below the panel being read (below its bubble, never over it). "ฟังครูอ่าน" reads each line in turn with the words highlighted, and the boat paddles to the next panel between lines. "อ่านตามทีละวรรค", recording and playback work as on แม่กง. Each panel heard or read gets a small งอบ stamp in its corner. Under reduced motion the boat jumps from panel to panel |
| 8 | Raft landing (Activity) | **Raft the rhyming boats:** four small boats float in two columns, each with one word and its speaker. Tap two boats that rhyme: a rope ties them and they drift together into a raft at the landing, then lock. A wrong pair: the rope goes slack and falls, the boats stay, and the miss is counted. Two pairs, scored out of 2. The boats slide only along their own lane and never over another boat's word. Under reduced motion the rope just appears and the boats stay put |
| 9 | Noodle-boat pier | **Read the order:** each sentence is written on a hanging bamboo sign at the pier, with its two pictures. The speaker reads it. The student records, plays back and re-records as on แม่กง. After the first playback, the noodle boat paddles up beside the sign, its vendor waves, and the sign gets a งอบ stamp. Under reduced motion the noodle boat is simply there |
| 10 | Stilt house (summary) | **Lotus at dusk:** the canal at dusk with nine lotus buds. One lotus opens for each Star the Lesson gave, out of nine. "เก่งมาก!", each Activity's Stars, the review words and a paddle-shaped "เรียนอีกครั้ง" in the แม่กน Kit. Under reduced motion the earned lotuses are simply open |

Where a microphone is refused or missing, playing the word or line counts instead, so every recording Game can still be finished.

## UI Kit

แม่กน's own controls, under `src/themes/mae-kon/kit/`, drawn in CSS and inline SVG with no raster art. None may look like แม่กง's clay buttons, comic cards and comic-panel transition, แม่กม's ice blocks, frosted windows and snow flurry, or แม่กบ's vinyl, raincoat pockets and ripple.

| Part | แม่กน |
|---|---|
| Buttons | Warm-wood boat planks with ink grain and coral-red rope lashed round both ends; they dip into the water when pressed |
| Home / Back / Next | Home is a woven งอบ hat; Back and Next are wooden paddles, the blade pointing the way |
| Speaker | A rolled banana-leaf cone (กรวยใบตอง) with sound lines while a clip plays |
| Cards | Woven bamboo trays lined with a banana leaf |
| Feedback | A round woven tray that น้องส้ม holds up from her boat at the window's left edge, with a ✓/✗ badge, never colour alone |
| Stars display | Gold stars painted on a paddle blade, on a canal-water plaque |
| Step change | Two banana leaves sweep in from the sides, meet, then part; a quick fade under reduced motion |
| Tap | A soft water "plop" (Web Audio) and a ring of ripples with droplets; no boing |

## Art list

Made by the art ticket (#97) in the shared comic style; until then every one is a clear labelled placeholder or a CSS/SVG stand-in.

| File | Subject |
|---|---|
| `mascot-kon-greet.webp`, `mascot-kon-cheer.webp`, `mascot-kon-encourage.webp`, `mascot-kon-cover.webp` | น้องส้ม in her wooden boat: greeting, jumping for joy, thumbs up, and paddling (the cover pose) |
| `word-chan.webp`, `word-chon.webp`, `word-ran.webp`, `word-kin.webp`, `word-khon.webp`, `word-fan.webp`, `word-khaen.webp`, `word-nok.webp`, `word-ruea.webp` | Picture cards: plate, spoon, market stall, child eating, person, tooth, arm, bird, boat. `word-ban.webp`, `word-nom.webp` and `word-cham.webp` are reused |
| `kon-panel-1.webp` … `kon-panel-4.webp` | Step 7 comic: paddling to the market past a stall; a vendor selling plates and spoons; a sweet-seller smiling; at home eating with mum |
| `kon-scene-cover.webp`, `kon-scene-canal.webp`, `kon-scene-dusk.webp` | The three Scenes |
| `kon-map.webp` | The floating market from above |
| `kon-noodle-boat.webp`, `kon-bamboo-sign.webp` | Step 9 props |

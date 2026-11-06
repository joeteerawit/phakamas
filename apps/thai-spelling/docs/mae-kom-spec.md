# แม่กม Lesson Specification

The second Lesson. It has the same 10 Steps, rules and scoring as `mae-kong-spec.md`. This file lists only what differs: content, Theme, Scenes and Step layouts. Layouts belong to the Theme (ADR-0001). Decided with the owner on 2026-11-06.

## Naming

- Lesson id `mae-kom`, URL `/lesson/mae-kom/1`. A teacher shares the link directly; `/` still opens แม่กง.
- Student-facing text uses the standard name **แม่กม**, because that is what the Grade 2 curriculum calls it ("แม่กลม" was only how we said it while planning).

## Content

Words are fixed in `src/lessons/mae-kom.ts` for now. Later a Session will draw them from the Word Catalog (see GLOSSARY).

| Item | Content |
|---|---|
| Cover | Title "คำแม่กมชมเมืองหิมะ", subtitle "แม่ กม (ม)", same grade line |
| Intro | "สวัสดีเด็ก ๆ วันนี้น้องส้มจะพาไปเที่ยวเมืองหิมะ และเรียนรู้คำในมาตราแม่กมกัน พร้อมแล้วกดเริ่มเรียนได้เลย" |
| Vocabulary (Steps 2, 3, 4, 6) | ร่ม รอ-โอะ-มอ-รม-ไม้เอก-ร่ม · ลม ลอ-โอะ-มอ-ลม · ส้ม สอ-โอะ-มอ-สม-ไม้โท-ส้ม · นม นอ-โอะ-มอ-นม · ผม ผอ-โอะ-มอ-ผม · ชาม ชอ-อา-มอ-ชาม |
| Step 4 narration | The same pattern as แม่กง, with these six words and ม as the final consonant |
| Step 5 "แม่กมอยู่ไหน?" | Correct: the six words plus แก้ม and ยิ้ม. Distractors: แมว, ม้า, มือ (ม is their initial), ลิง (แม่กง) |
| Step 6 "กล่องคำแม่กม" | Word Bank = the six words |
| Step 7 "อ่านการ์ตูนแม่กม" | A 4-panel comic with one line per panel in a speech bubble; the highlighted words are in brackets: น้องส้มกางร่มเดินเล่น [ร่ม] · ลมพัดแรง ผมปลิว [ลม ผม] · ร่มลอยขึ้นฟ้า! [ร่ม] · กลับบ้านกินส้มกับนม ยิ้มแก้มแดง [ส้ม นม ยิ้ม แก้ม] |
| Step 8 | Pairs ร่ม ↔ ชม, ลม ↔ ผม |
| Step 9 | "น้องส้มกางร่มกันลม" (ร่ม + ลม), "แม่เทนมใส่ชาม" (นม + ชาม) |

Rules: a Target Word has every syllable ending in ม, so ขนม and ผ้าห่ม are left out. Words with ำ (น้ำ, ดำ) never appear as content, but they may appear in Scene backdrops. The Mascot's name never shares a sentence with the fruit ส้ม. Audio uses `scripts/gen-audio.sh` (edge-tts, Premwadee), as for แม่กง.

## Mascot: น้องส้ม

A Thai girl of about 8 with long braided hair, a red umbrella, an orange coat, rosy cheeks and a smile (ผม ร่ม ส้ม แก้ม ยิ้ม). She has four poses: greeting, jumping for joy, thumbs up, and floating on the wind holding her umbrella (on the cover, in place of the vine swing). Make the poses with Canva `generate-image` from one reference image, and use the shared comic style text from `comic-art.md`.

## Scenes

The palette is blue, purple and snow white. The rules in `comic-art.md` hold: objects stay behind words, motion loops gently, and under reduced motion the Scene is still.

| Scene | Steps | Mood |
|---|---|---|
| Snowy city street, daytime | 1 | Busy: people with umbrellas, scarves in the wind, an orange rolling |
| Windy city street | 2–6, 8, 9 | Calm: a few leaves and snowflakes drifting slowly |
| Snowy city at night | 10 | Building lights switch on, one for each Star earned |
| Comic panels | 7 | No Scene; the four panels fill the window |

## Map

The Map is a snowy city map, following `game-concept.md`. The cover's ▶ opens it. A winding street joins the eight stops (Steps 2–9) and ends at น้องส้ม's home (Step 10). Every stop is open. An arrow marks the recommended next stop, a done stop shows a lit window, and Activity stops show their Stars. น้องส้ม walks along the street to the chosen stop. Under reduced motion she appears there directly.

## Games

Decided with the owner on 2026-11-06. No Game has a timer, and every one has a still version under reduced motion.

| Step | Stop | Game |
|---|---|---|
| 1 | Cover | The snowy-street cover (#46); ▶ opens the Map |
| 2 | Shop street | **Window shopping:** น้องส้ม walks past the shops. Tapping a shop lights its window, shows the picture and plays the word. When all six are lit, the street ahead opens |
| 3 | Billboard | **Billboard karaoke:** the word shows on the billboard and the student records at the phone booth. Each word recorded lights one bulb around the screen; six bulbs set off fireworks on the screen |
| 4 | Bus stop | **Find the ม for the bus:** a bus stops showing one word. The student taps the final consonant (the ม). Then the bus leaves and the next one arrives. A wrong tap leaves the bus where it is and plays a hint |
| 5 | Umbrella square (Activity) | **Catch the umbrellas:** twelve picture umbrellas drift down slowly and loop until each one is decided. Tap to catch the แม่กม ones; let the others drift by. One umbrella = one Decision, scored out of 12 as before. Under reduced motion the umbrellas stand in rows |
| 6 | Apartment block (Activity) | **Sled delivery:** words ride on the sled. Drag (or tap, then tap) each word to the window with the matching picture; a delivered window lights up |
| 7 | Comic cinema | **4-panel comic:** read along with highlighting, then tap each highlighted แม่กม word in a panel to collect it |
| 8 | Lamp street (Activity) | **Light the street:** tap two lamps whose words rhyme; a string of lights joins them |
| 9 | Post office | **Send a postcard:** read the sentence on the postcard, record it, then drop the postcard into the post box |
| 10 | Home (summary) | The city at night; one building light switches on for each Star |

## UI Kit

แม่กม's own controls. None may look like แม่กง's clay buttons, comic cards or comic-panel transition.

| Part | แม่กม |
|---|---|
| Buttons | Rounded ice blocks with a snow cap, in pale blue and white with ink outlines |
| Home / Back / Next | Home is a small house with a snowy roof; Back and Next are arrow-shaped street direction signs |
| Speaker | A red vintage radio |
| Cards | Frosted window frames |
| Feedback | A speech bubble from น้องส้ม, who peeks in at the screen edge |
| Stars display | Snowflake-stars on a shop banner |
| Step change | A snow flurry wipes across the screen |
| Tap | A soft bell jingle and a puff of snow |

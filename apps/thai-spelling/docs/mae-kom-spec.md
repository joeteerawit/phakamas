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

## Step layouts

Buttons stay in the window corners on every Step.

| Step | Layout |
|---|---|
| 1 | A shop sign hung between buildings, with น้องส้ม floating on the wind |
| 2 | Six cards as lit shop windows, two floors of a building row |
| 3 | The word on a billboard screen; the microphone in a phone booth below |
| 4 | Words on three bus-stop signs, the ม red like a traffic light |
| 5 | Twelve cards as umbrellas held by a crowd; a tap opens the umbrella |
| 6 | Pictures in apartment windows; the Word Bank on a snow sled |
| 7 | 4-panel comic |
| 8 | The buzzers are four street lamps; a locked pair is joined by a string of lights |
| 9 | Sentences on postcards pinned to a mailbox wall |
| 10 | Building lights, one for each Star |

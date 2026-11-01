# Website Functional Specification

**Project:** คำคล้องจองพาเพลิน – มาตราแม่กง (ง)  
**Version:** 1.0  
**Audience:** Developer / UI Designer / QA  
**Target users:** นักเรียนประถมศึกษาปีที่ 2 และครูผู้สอน  
**Reference:** https://chatgpt.com/s/m_6ae59e859a6c81919235bb895993eb1f

## 1. Project Overview

เว็บไซต์สื่อการเรียนรู้แบบ Interactive ประกอบด้วย 10 หน้า ภาพประกอบ เสียงอ่าน เกม และแบบประเมินการอ่าน

### 1.1 Page Flow

1. หน้าปก — เริ่มบทเรียน
2. ดูภาพเรียนรู้คำ — คำศัพท์ 6 คำ
3. ฟังแล้วอ่านตาม — ฝึกออกเสียง 6 คำ
4. สังเกตตัวสะกด — เรียนรู้ตัวสะกด ง
5. แม่กงอยู่ไหน? — เกมจำแนกคำ 12 ภาพ
6. กล่องคำแม่กง — เกมเติมคำ 6 ข้อ
7. อ่านร้องคล้องคำ — ฝึกอ่าน 4 วรรค
8. จับคู่ดูคำ — จับคู่ 2 คู่
9. อ่านออก บอกได้ — ฝึกอ่าน 2 ประโยค

เนื้อหา (คำ ประโยค ชื่อขั้น) ยึดตามงานออกแบบ Canva `DAHZj0Nxyxs`; ถ้าขัดกับเอกสารนี้ ให้ยึดงานออกแบบ
10. สรุปและประเมิน — สรุปบทเรียนและครูประเมิน

### 1.2 Global Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | รองรับ Desktop / Tablet / Mobile |
| FR-002 | มี 10 หน้าตามลำดับ |
| FR-003 | รองรับปุ่ม Back / Next |
| FR-004 | มี Home กลับหน้าปก |
| FR-005 | เล่นเสียงอ่านภาษาไทยจากไฟล์เสียง |
| FR-006 | Animation ตอบสนองการกด |
| FR-007 | ตรวจคำตอบเกมพร้อม Feedback |
| FR-008 | บันทึกความคืบหน้าและคะแนน |
| FR-009 | ทำกิจกรรมซ้ำได้ |
| FR-010 | รองรับการบันทึกเสียงเมื่ออนุญาตสิทธิ์ |
| FR-011 | ~~โหมดประเมินไม่เปิดเสียงเฉลย~~ (Phase 2) |
| FR-012 | รองรับ Mouse, Keyboard และ Touch |

### 1.3 Shared Layout

ทุก Step อยู่บน **Stage ขนาดคงที่ 1920×1080** (ตาม Canva design `DAHZj0Nxyxs`) ที่ย่อ/ขยายตามขนาดหน้าต่างแบบคงสัดส่วน จัดกึ่งกลาง และเติมขอบ (letterbox) ด้วยสีฟ้า→เขียวของฉาก หน้าเว็บไม่มี scrollbar และไม่มี layout แยกสำหรับมือถือ บน Stage มี:

- ป้ายไม้ชื่อ Step มุมซ้ายบน (ข้อความจาก Lesson data, สีน้ำเงิน `#1800ad`), ป้าย "ขั้น X/10", ปุ่มปิดเสียง และปุ่ม Home ไม้มุมขวาบน
- ปุ่มย้อนกลับ (ลูกศรส้ม) มุมซ้ายล่าง และปุ่มถัดไปมุมขวาล่าง; หน้าแรกไม่มี Back และ Home; หน้าสุดท้ายปุ่มขวาล่างเป็น "กลับหน้าแรก"
- **Home กลับไปหน้าปก (Step 1) และเก็บความคืบหน้า Session ไว้** (หน้าปกแสดง "เรียนต่อ (ขั้น X)"); ถ้ามีคำตอบที่ยังไม่ตรวจ ถามยืนยันก่อน
- ฉากพื้นหลัง: สวน (ค่าเริ่มต้น) หรือสระน้ำ ที่ Step เลือกได้

**หมุนจอ:** ถ้าหน้าต่างเป็นแนวตั้ง (สูง > กว้าง) แสดง overlay เต็มจอ (สีสวน, รูปโทรศัพท์หมุน 90° วนซ้ำ, น้องลิง, ข้อความ "กรุณาหมุนจอเป็นแนวนอน") ปิดกั้นการกดทุกอย่างด้านหลัง และหายไปทันทีเมื่อเป็นแนวนอน; ถ้าผู้ใช้ตั้ง reduced motion รูปโทรศัพท์ไม่หมุน

Theme: Canva garden (ดู §6) ปุ่ม การ์ด และข้อความยังเป็น HTML UI ที่คลิกได้ แยกจากภาพพื้นหลัง

---

## 2. Detailed Pages

### Page 01 — หน้าปก

**Route:** `/lesson/mae-kong/1`  
**Objective:** แนะนำบทเรียน

**UI:** Background สวน, ตัวการ์ตูนลิง, Title `คำคล้องจองพาเพลิน`, Subtitle `แม่ กง (ง)`, ข้อความ `วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒`, ปุ่ม `เริ่มเรียน`, `ฟังคำแนะนำ`

| Click/Event | Behavior |
|---|---|
| เริ่มเรียน | ไปหน้า 2, บันทึกเวลาเริ่ม, แสดง Transition |
| ฟังคำแนะนำ | เล่นเสียงครูแนะนำ |
| กดเสียงซ้ำขณะเล่น | Toggle: หยุดเสียง |
| คลิกรูปลิง | เล่น Animation ทักทาย ไม่คิดคะแนน |

**Audio script:** “สวัสดีเด็ก ๆ วันนี้เราจะมาเรียนรู้คำคล้องจองในมาตราแม่กงกัน พร้อมแล้วกดเริ่มเรียนได้เลย”

**States:** `idle`, `introPlaying`, `introPaused`, `loadingAudio`, `audioError`  
**Acceptance:** กดเริ่มเรียนแล้วไปหน้า 2 ได้ทันที ไม่ต้องรอเสียงจบ

### Page 02 — ดูภาพเรียนรู้คำ

**Route:** `/lesson/mae-kong/2`  
**Objective:** เชื่อมโยงภาพกับคำและเสียง

**UI:** Card Grid 6 คำ ได้แก่ `ลิง`, `ช้าง`, `ดัง`, `รัง`, `ค่าง`, `ผึ้ง` (Target Word ทั้งหมด); แต่ละ Card มีภาพ คำศัพท์ และไอคอนลำโพง

| Click/Event | Behavior |
|---|---|
| คลิก Card หรือ Speaker | Highlight Card แล้วเล่นเสียงตรงคำ |
| คลิก Card อื่นระหว่างเล่นเสียง | หยุดเสียงเดิมและเล่นเสียงใหม่ |
| ถัดไป | ไปหน้า 3 |
| ย้อนกลับ | ไปหน้า 1 |

**States/Card:** `visited`, `playing`, `completed`; active Card ได้ครั้งละหนึ่งใบ  
**Rule:** ฟังซ้ำไม่จำกัด ไม่บังคับฟังครบก่อน Next

### Page 03 — ฟังแล้วอ่านตาม

**Route:** `/lesson/mae-kong/3`  
**Objective:** ฟังและฝึกอ่านคำตามลำดับ

**UI:** ภาพและคำขนาดใหญ่, Speaker, ลำดับคำ `ลิง → ช้าง → ดัง → รัง → ค่าง → ผึ้ง`, Progress `คำที่ X/6`, ปุ่ม `ฟังอีกครั้ง`, `คำถัดไป`, Back/Next

| Click/Event | Behavior |
|---|---|
| เข้าหน้าครั้งแรก | แสดงลิง ไม่เล่นเสียงอัตโนมัติ |
| ฟังเสียง | เล่นเสียงคำปัจจุบัน |
| เสียงจบ | แสดง “ถึงตาหนูอ่านแล้ว” และเว้นจังหวะฝึก |
| คำถัดไป | เปลี่ยนภาพและคำ |
| คลิกคำใน Progress | ไปคำที่เลือก |
| ฟังอีกครั้ง | เล่นเสียงคำเดิม |
| ถัดไป | ไปหน้า 4 |

**Animation:** Fade/Slide ของ Card และ Highlight คำระหว่างเสียง  
**State:** `currentWordIndex`, `isAudioPlaying`, `visitedWords`, `repeatCount`  
**Completion:** ฟังครบ 6 คำแสดงข้อความ/ดาว แต่กลับมาฝึกซ้ำได้

### Page 04 — สังเกตตัวสะกด

**Route:** `/lesson/mae-kong/4`  
**Objective:** สังเกต ง ตัวสะกด

**UI:** Heading `มาตราแม่กง (ง) มี ง เป็นตัวสะกด`, Mascot น้องลิง, Card 2 ชุด ชุดละ 3 คำ: `ลิง`, `ช้าง`, `ดัง` และ `รัง`, `ค่าง`, `ผึ้ง` พร้อมเน้นอักษร ง (ตัวสะกดสีแดง) และบรรทัดสะกดคำ, ปุ่ม `ฟังคำอธิบาย`, `แสดงตัวสะกด`

| Click/Event | Behavior |
|---|---|
| ฟังคำอธิบาย | เล่นเสียงอธิบายแม่กง |
| คลิก Card | เล่นเสียงคำและ Highlight ง |
| แสดงตัวสะกด | Toggle Highlight ทุกคำ |
| ถัดไป | ไปหน้า 5 |

**Spelling lines:** ลอ-อิ-งอ-ลิง; ชอ-อา-งอ-ชาง-ไม้โท-ช้าง; ดอ-อะ-งอ-ดัง; รอ-อะ-งอ-รัง; คอ-อา-งอ-คาง-ไม้เอก-ค่าง; ผอ-อึ-งอ-ผึง-ไม้โท-ผึ้ง  
**Rule:** ระบุตำแหน่งอักษรในข้อมูลคำศัพท์ ไม่ค้นหาเฉพาะอักษรสุดท้าย; ให้ครูตรวจทานคำอธิบายและการแบ่งพยางค์ก่อนเผยแพร่

### Page 05 — แม่กงอยู่ไหน?

**Route:** `/lesson/mae-kong/5`  
**Objective:** จำแนกคำแม่กง

**UI:** คำถาม `แม่กงอยู่ไหน?` พร้อมคำสั่งสั้น ๆ, การ์ดภาพ 12 ใบ (มีภาพและเสียง) 2 แถว: `งู`, `ดัง`, `บ้าน`, `ก้ม`, `สูง`, `ผึ้ง` / `ลิง`, `ช้าง`, `ลุง`, `รัง`, `ค่าง`, `เงา`, ปุ่ม `ตรวจคำตอบ`, `เริ่มใหม่`, Back/Next

| Click/Event | Behavior |
|---|---|
| คลิกคำที่ยังไม่เลือก | เพิ่มเข้า Selected Set |
| คลิกคำที่เลือกแล้ว | ยกเลิกการเลือก |
| ตรวจคำตอบ | เปรียบเทียบทุกตัวเลือกกับเฉลย |
| ถูกครบ | แสดง “เก่งมาก!” และเสียงชื่นชม |
| ผิด | Highlight จุดผิดและให้ลองใหม่ |
| เริ่มใหม่ | ล้าง Selected Set และ Feedback |
| ถัดไป | บันทึกผลล่าสุดและไปหน้า 6 |

**Correct choices:** ลิง, ช้าง, ดัง, รัง, ค่าง, ผึ้ง, สูง, ลุง  
**Distractors:** งู, เงา (ง เป็นพยัญชนะต้น ไม่ใช่ตัวสะกด), บ้าน (สะกดด้วย น), ก้ม (สะกดด้วย ม)  
**Scoring:** 12 Decision (เลือกถูก 8 คำ + ไม่เลือกถูก 4 คำ) รวม 12 คะแนนต่อการตรวจ; เก็บ `attemptCount` และ `bestScore`

### Page 06 — กล่องคำแม่กง

**Route:** `/lesson/mae-kong/6`  
**Objective:** จับคู่คำกับภาพ

**UI:** คำสั่ง `เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง`; Word Bank `รัง`, `ดัง`, `ผึ้ง`, `ลิง`, `ช้าง`, `ค่าง`; ภาพ 6 ภาพ (`ลิง`, `ช้าง`, `ดัง`, `รัง`, `ค่าง`, `ผึ้ง`) พร้อมช่องว่าง; ปุ่ม `ตรวจคำตอบ`, `ล้างคำตอบ`, `ลองอีกครั้ง`, Back/Next

| Click/Event | Behavior |
|---|---|
| คลิกคำใน Word Bank | เลือกคำปัจจุบัน |
| คลิกช่องว่าง | นำคำที่เลือกมาวาง |
| Drag คำไปช่องว่าง | วางผ่าน Drag & Drop |
| คลิกคำในช่อง | คืนคำเข้า Word Bank |
| ตรวจคำตอบ | ตรวจ 6 ช่องและแสดงถูก/ผิด |
| ลองอีกครั้ง | ล้างเฉพาะคำที่ผิด |
| ล้างคำตอบ | เคลียร์ทุกช่อง คืนทุกคำ |
| ถัดไป | บันทึกผลและไปหน้า 7 |

**Rules:** คำหนึ่งใช้ได้เพียงครั้งเดียว, ย้ายคำระหว่างช่องได้, รองรับ Tap-to-select บนมือถือ, ตรวจเมื่อกดปุ่มเท่านั้น  
**Scoring:** ช่องละ 1 รวม 6 คะแนน พร้อมนับจำนวนครั้งที่ตรวจ

### Page 07 — อ่านร้องคล้องคำ

**Route:** `/lesson/mae-kong/7`  
**Objective:** อ่านบทร้อยกรองให้ถูกต้องมีจังหวะ

**Content:**

> ลิงน้อยนั่งมอง  
> ช้างร้องเสียงดัง  
> นกบินกลับรัง  
> ฟังเพลงเพลินใจ

คำคล้องจองที่เน้นสี: มอง, ร้อง, ดัง, รัง, ฟัง

**UI:** กรอบบทคล้องจอง, ภาพลิงและสวน, ปุ่ม `ฟังครูอ่าน`, `อ่านตามทีละวรรค`, `ลองอ่านเอง`, `หยุดเสียง`, `วรรคก่อนหน้า`, `วรรคถัดไป`, `หยุดบันทึก`, `ฟังเสียงตัวเอง`, `อัดใหม่`

| Click/Event | Behavior |
|---|---|
| ฟังครูอ่าน | เล่น `line-01..04.mp3` ต่อกันทีละวรรค |
| ระหว่างเสียงเล่น | Highlight วรรคของไฟล์ที่กำลังเล่น |
| หยุดเสียง | Pause เสียง |
| อ่านตามทีละวรรค | เข้า Step Mode |
| วรรคก่อนหน้า/ถัดไป | เปลี่ยนวรรคและเล่นเสียงวรรคนั้น |
| ลองอ่านเอง | ขอสิทธิ์ไมโครโฟนและบันทึกเสียง |
| หยุดบันทึก | จบ Recording พร้อมให้ Playback |
| ฟังเสียงตัวเอง | เล่น Recording ที่บันทึก |
| อัดใหม่ | รีเซ็ต Recording ของรอบนี้ |
| ถัดไป | ไปหน้า 8 |

**Flow:** `IDLE → PLAYING_FULL → IDLE` หรือ `IDLE → STEP_MODE` หรือ `IDLE → MIC_PERMISSION → RECORDING → PLAYBACK_READY`; สิทธิ์ถูกปฏิเสธแสดง Error  
**Scope:** MVP ให้ฟังเสียงตัวเอง ไม่ประเมินด้วย AI

### Page 08 — จับคู่ดูคำ

**Route:** `/lesson/mae-kong/8`  
**Objective:** จับคู่คำคล้องจอง 2 คู่

**UI:** ปุ่มคำ 4 ปุ่ม `มอง`, `ฟัง`, `ดัง`, `ร้อง`; พื้นที่วาดเส้นเชื่อม, ปุ่ม `เริ่มใหม่`, Back/Next

| Click/Event | Behavior |
|---|---|
| คลิกคำซ้าย | เลือกต้นทาง Highlight |
| คลิกคำขวา | สร้างคู่กับคำซ้ายที่เลือก |
| Drag คำซ้ายไปคำขวา | วาดเส้นเชื่อม |
| คู่ถูก | เส้นสีเขียว/เสียงถูก/Lock คู่ |
| คู่ผิด | เส้นแดงชั่วคราวแล้วหาย |
| ถูกครบ | แสดงดาว 3 ดวงและข้อความสำเร็จ |
| เริ่มใหม่ | ลบคู่ทั้งหมดและสุ่มคำขวาใหม่ |
| ถัดไป | บันทึกผลและไปหน้า 9 |

**Correct pairs:** มอง–ร้อง, ดัง–ฟัง  
**Rules:** 1 คำต่อ 1 คู่, คู่ถูก Lock, คู่ผิดลองใหม่ได้, รองรับแตะสองครั้งบนมือถือ  
**Score:** 2 คะแนน (คู่ละ 1); เก็บจำนวนครั้งที่ผิด

### Page 09 — อ่านออก บอกได้

**Route:** `/lesson/mae-kong/9`  
**Objective:** ฝึกอ่านประโยค

**UI:** Card 2 ประโยคพร้อมภาพและ Speaker:

1. `ลิงน้อยนั่งมองช้าง`
2. `บ่างวิ่งไล่ตามมา`

มีปุ่ม `ลองอ่านเอง`, `เริ่มบันทึก`, `หยุดบันทึก`, `ฟังเสียงตัวเอง`, `ลองอีกครั้ง`, Back/Next

| Click/Event | Behavior |
|---|---|
| Speaker ประโยค 1/2 | เล่นเสียงเฉพาะประโยคนั้น |
| ลองอ่านเอง | เปิดโหมดบันทึกเสียง |
| เริ่มบันทึก | บันทึกประโยคที่เลือก |
| หยุดบันทึก | จบ Recording |
| ฟังเสียงตัวเอง | Playback |
| ลองอีกครั้ง | อัดทับ Recording ปัจจุบันหลังยืนยันตาม UI |
| ถัดไป | ไปหน้า 10 |

**State:** `currentSentenceId`, `playbackStatus`, `recordingStatus`, `recordings`, `practicedSentences`  
**Rule:** อัดสูงสุด 30 วินาที/รอบ (Step 7 และ 9); ไม่อนุญาตไมค์ให้แสดงข้อความแนะนำ ส่วนอื่นของ Step ใช้ได้ปกติ; เปลี่ยนประโยคต้องหยุด Recording เดิมอย่างปลอดภัย

### Page 10 — สรุปและประเมิน

**Route:** `/lesson/mae-kong/10`  
**Objective:** ทบทวนและให้ครูประเมินอ่านออกเสียง

**Section A — คำสำคัญ:** ลิง ช้าง ดัง รัง ค่าง ผึ้ง  
**Section B — คู่คล้องจอง:** มอง–ร้อง, ดัง–ฟัง  
**Section C — ประเมิน (ย้ายไป Phase 2 รอยืนยันกับผู้ใช้):** คำทดสอบ 6 คำ, ผ่าน/ไม่ผ่านรายข้อ, คะแนนรวม, ปุ่มบันทึกผล/กลับเมนูหลัก

| Click/Event | Behavior |
|---|---|
| ดูคำสำคัญ | แสดงคำศัพท์สำหรับทบทวน |
| เริ่มประเมิน | เข้าสู่ Assessment Mode และซ่อนเสียงเฉลย |
| ผ่าน | ให้ 1 คะแนนในข้อนั้น |
| ไม่ผ่าน | ให้ 0 คะแนน |
| บันทึกผล | Validate ว่าประเมินครบแล้วบันทึก |
| ดูผลคะแนน | แสดง `bestScore` ของแต่ละ Activity และคะแนนรวม /20; Activity ที่ `skipped` แสดง “ยังไม่ได้ทำ” พร้อมลิงก์กลับไปทำ |
| เรียนอีกครั้ง | ยืนยันก่อนล้าง Session |
| กลับหน้าแรก | ไปหน้า 1 |
| ย้อนกลับ | ไปหน้า 9 |

**Assessment words (initial proposal):** ลิง ช้าง ดัง รัง ค่าง ผึ้ง (ครูแก้ชุดคำได้ก่อนใช้จริง)  
**Scoring:** ผ่าน 1, ไม่ผ่าน 0, ยังไม่ประเมินไม่คิดคะแนน; คะแนนเต็ม 6 แยกจากคะแนนเกม  
**Completion:** บันทึกผลประเมินแล้วเป็น `completed`; ถ้าเรียนด้วยตนเองแสดง `รอครูประเมิน`

---

## 3. Global Navigation & Events

| Event | Behavior |
|---|---|
| Home | ถ้ามีกิจกรรมยังไม่บันทึกแสดง Confirm ก่อนกลับ |
| Back | ย้อนหน้าโดยรักษาความคืบหน้า |
| Next | บันทึก State และไปหน้าถัดไป |
| Speaker | เล่นเสียงตาม Audio ID |
| Mute | Toggle เสียงทั้งหมด |
| Replay | เล่นเสียงเดิมใหม่ |
| Reset | ล้างข้อมูลกิจกรรมเฉพาะหน้า |
| Check Answer | ตรวจคำตอบและให้ Feedback |
| Retry | กลับไปแก้คำตอบ |
| Mic | ขอสิทธิ์และเริ่มบันทึก |
| Refresh Browser | กู้คืน Progress ที่จัดเก็บ |
| Browser Back | ย้อนกลับและรักษา State |
| Page Unload | หยุดเสียงและ Recording |

**Root `/`:** Redirect ไป `/lesson/mae-kong/1` จนกว่าจะมีบทเรียนที่สอง; ถ้ามี Session ค้าง หน้า 1 แสดงปุ่ม “เรียนต่อ (ขั้น X)” และ “เริ่มใหม่”

**Navigation rules:** หน้า 1 ไม่มี Back; หน้า 10 ไม่มี Next; ก่อนออกเกมบันทึกผล; ข้ามกิจกรรมได้แต่เก็บ `skipped`; กลับมาเรียนต่อจากหน้าล่าสุดหรือเริ่มใหม่ได้

---

## 4. State Management

```ts
type LessonSession = {
  sessionId: string;
  lessonId: "mae-kong";
  currentPage: number;
  startedAt: string;
  completedAt?: string;
  visitedPages: number[];
  completedPages: number[];
  activities: {
    wordSelection?: ActivityResult;
    wordFilling?: ActivityResult;
    rhymeMatching?: ActivityResult;
  };
  readingAssessment?: {
    status: "pending" | "completed";
    scores: Record<string, 0 | 1>;
  };
};

type ActivityResult = {
  status: "not_started" | "in_progress" | "completed" | "skipped";
  score: number;
  maxScore: number;
  attemptCount: number;
  answers: unknown;
};
```

| Activity | Max Score |
|---|---:|
| Page 05: แม่กงอยู่ไหน? | 12 |
| Page 06: กล่องคำแม่กง | 6 |
| Page 08: จับคู่ดูคำ | 2 |
| **เกมทั้งหมด** | **20** |
| Page 10: ประเมินการอ่าน | 6 (แยก) |

Activity เก็บเฉพาะ `bestScore` และ `attemptCount`; ข้าม Activity (กด Next โดยไม่ตรวจ) ได้สถานะ `skipped` คะแนน 0

---

## 5. Audio & Recording Specification

| ID | Requirement |
|---|---|
| AUD-001 | ใช้เสียงครูอ่านภาษาไทยจริงเป็นหลัก |
| AUD-002 | ใช้ไฟล์ MP3 หรือรูปแบบที่ Browser รองรับ |
| AUD-003 | เล่นเสียงได้ครั้งละหนึ่งไฟล์ |
| AUD-004 | เปลี่ยนหน้าแล้วหยุดเสียงเดิม |
| AUD-005 | แสดง Loading ขณะโหลดเสียง |
| AUD-006 | แสดง Retry เมื่อโหลดไม่ได้ |
| AUD-007 | Highlight ข้อความตามเสียง |
| AUD-008 | Replay ไม่จำกัด |
| AUD-009 | ใช้ไมโครโฟนหลังผู้ใช้อนุญาตเท่านั้น |
| AUD-010 | ไม่อัปโหลดเสียงเด็กไป Server ถ้ายังไม่มีระบบความยินยอม/จัดการข้อมูล |

```text
public/assets/
├── images/
│   ├── backgrounds/
│   └── characters/
├── canva/
│   └── vocabulary/        # ภาพคำศัพท์ <slug>.webp
└── audio/
    ├── intro.mp3
    ├── vocabulary/
    │   ├── ling.mp3, chang.mp3, dang.mp3, rang.mp3, khang.mp3, phueng.mp3
    │   └── ngu.mp3, ban.mp3, kom.mp3, sung.mp3, lung.mp3, ngao.mp3
    ├── rhyme/
    │   ├── line-01.mp3
    │   ├── line-02.mp3
    │   ├── line-03.mp3
    │   └── line-04.mp3
    ├── sentences/
    │   ├── sentence-01.mp3
    │   └── sentence-02.mp3
    └── feedback/
        ├── correct.mp3
        ├── incorrect.mp3
        └── completed.mp3
```

ใช้ `AudioManager` ส่วนกลางป้องกันเสียงซ้อน

**Placeholder assets (ก่อนได้ของจริง):**
- เสียง: สร้าง mp3 ล่วงหน้าด้วย PyThaiTTS + FastThaiG2P ผ่าน `scripts/gen-audio.py` ที่อ่านข้อความจาก `src/lessons/mae-kong.ts` แล้ว commit ไฟล์เข้า repo (ถ้า license ของ dataset ไม่ชัด ให้สลับไป KhanomTan v1.1) ต้องแทนด้วยเสียงครูจริงก่อนเปิดใช้งาน (AUD-001)
- ภาพ: ภาพคำศัพท์อยู่ที่ `public/assets/canva/vocabulary/<slug>.webp` ซึ่งจะแทนด้วยภาพจาก Canva; ระหว่างนี้ใช้ Microsoft Fluent Emoji 3D (MIT) เมื่อมีภาพที่ตรง และภาพว่างกลาง ๆ สำหรับคำที่เหลือ (unit test ตรวจว่าทุกไฟล์ที่อ้างถึงมีอยู่จริง)

---

## 6. UI/UX

> **Source of truth:** Canva design `DAHZj0Nxyxs` ("คำคล้องจองพาเพลิน") and `apps/thai-spelling/design-system/thai-spelling/MASTER.md` section "Style: Canva garden" (1920×1080 stage, palette, Canva-exported chrome, rotate overlay, Mali/Anuphan, Mascot น้องลิง, motion budget). Assets exported from Canva are logged in `docs/canva-assets.md`. The table below is the original brief; the breakpoints no longer apply (one stage layout, portrait shows the rotate overlay).

| Property | Spec |
|---|---|
| Theme | Cartoon Garden / Nature / Pastel |
| Colors | เขียวอ่อน ฟ้า เหลือง ชมพู |
| Background | สวน ต้นไม้ ท้องฟ้า ดอกไม้ |
| Fonts | Sarabun หรือ Anuphan |
| Heading | 32–48px Desktop |
| Vocabulary | 32–44px |
| Body | 20–26px สำหรับข้อความสำคัญ |
| Buttons | สูงอย่างน้อย 48px, Rounded/Pill |
| Animation | Fade, Scale, Bounce สั้น ๆ |
| Touch Target | ประมาณ 44×44px ขึ้นไป |
| Accessibility | Focus State, Screen Reader Label, ไม่สื่อถูก/ผิดด้วยสีเพียงอย่างเดียว |

**Breakpoints:** Desktop ≥1024px (3 Columns vocabulary), Tablet 768–1023px (2–3 Columns), Mobile ≤767px (1–2 Columns, Tap-friendly)

ปุ่ม Card คำศัพท์ และคำตอบต้องเป็น HTML/React UI จริง ไม่ฝังเป็นภาพเดียวกับ Background

---

## 7. Technical Architecture

**MVP:** Frontend-only SPA สาธารณะ ไม่มี Login ไม่ขอข้อมูลผู้ใช้ เปิดเว็บแล้วเล่นได้ทันที; 1 Session ต่อ Browser

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS v4, ฟอนต์ Anuphan (`@fontsource/anuphan`, self-host) |
| Animation | Motion (`motion`) |
| State | Zustand (`persist` → LocalStorage) |
| Routing | TanStack Router |
| Audio | HTMLAudioElement; ไม่มีไฟล์/โหลดไม่ได้ → fallback Web Speech API (`speechSynthesis`, th-TH) → ไม่มีเสียงไทย → Retry |
| Recording | MediaRecorder API |
| Persistence | LocalStorage (Progress); เสียงที่นักเรียนอัดเก็บใน memory เท่านั้น |
| Hosting | Vercel (SPA rewrite → `index.html`) |
| Monorepo | pnpm workspaces + Turborepo, app อยู่ที่ `apps/thai-spelling` |
| Testing | Vitest + Testing Library (logic), Playwright headless (QA flow) |
| Analytics | Vercel Web Analytics (cookieless, ไม่เก็บข้อมูลส่วนบุคคล) |

**Drag & Drop:** Pointer Events เขียนเอง (Step 6, 8); Tap-to-select เป็นทางหลักและใช้ Keyboard ได้

**Lesson data:** เนื้อหาทั้งหมดอยู่ใน `src/lessons/mae-kong.ts` (typed) มาตราใหม่ = เพิ่มไฟล์ใหม่

Architecture: `React Pages → Lesson Engine / Media Engine → Static Assets + Local Persistence`

**Phase 2:** Login นักเรียน, Database คะแนนรายคน, Teacher Dashboard, AI อ่านออกเสียง, Export PDF/Excel; ต้องเพิ่ม Backend และพิจารณาความเป็นส่วนตัวสำหรับข้อมูลเด็ก

---

## 8. QA Acceptance Tests

| ID | Scenario | Expected |
|---|---|---|
| TC-001 | คลิกเริ่มเรียน | ไปหน้า 2 |
| TC-002 | คลิกภาพลิงหน้า 2 | เล่นเสียงและ Highlight |
| TC-003 | คลิกสองคำติดกัน | หยุดเสียงเก่าก่อนเสียงใหม่ |
| TC-004 | คำถัดไปหน้า 3 | ภาพและคำตรงกัน |
| TC-005 | Card ผึ้งหน้า 4 | เน้น ง ตัวสะกด |
| TC-006 | หน้า 5 เลือกถูกครบ | ได้ 12 คะแนน |
| TC-007 | หน้า 5 เลือกผิด | Feedback และแก้ไขได้ |
| TC-008 | หน้า 6 วางคำ | คำหายจาก Word Bank |
| TC-009 | หน้า 6 ตรวจคำตอบ | Feedback ถูกผิด |
| TC-010 | หน้า 7 เล่นเสียง | Highlight ตรงวรรค |
| TC-011 | ปฏิเสธไมค์ | แสดง Error ไม่ค้าง |
| TC-012 | หน้า 8 จับคู่ผิด | เส้นหายและลองใหม่ได้ |
| TC-013 | หน้า 8 จับคู่ถูกครบ | ได้ 3 คะแนน |
| TC-014 | หน้า 9 เล่นเสียงประโยค 2 | เล่นเฉพาะเสียงประโยค 2 |
| TC-015 | ~~หน้า 10 เริ่มประเมิน~~ | Phase 2 |
| TC-016 | ~~ประเมินไม่ครบแล้วบันทึก~~ | Phase 2 |
| TC-017 | Refresh | คืนค่า Progress และคะแนน |
| TC-018 | Mobile | Layout ไม่ล้นจอ |
| TC-019 | Home ระหว่างเกม | ยืนยันก่อนออก |
| TC-020 | Reset Game | รีเซ็ตเฉพาะเกมที่เลือก |

---

## 9. Development Priorities

### MVP

- [ ] ทำครบ 10 หน้าและ Responsive
- [ ] แสดงภาพ Background / Character / Vocabulary
- [ ] เล่นเสียงคำ วรรค และประโยค
- [ ] สร้างเกม 3 แบบพร้อม Scoring และ Feedback
- [ ] บันทึก Progress ใน Browser
- [ ] บันทึกและเล่นเสียงอ่านของนักเรียน
- [ ] จัดการ Error เสียงและ Microphone

### Phase 2

- [ ] Authentication / Student Accounts
- [ ] Database คะแนนรายคน
- [ ] Teacher Dashboard
- [ ] AI Pronunciation Assessment
- [ ] Export PDF / Excel
- [ ] Reading Assessment โดยครู (Page 10 Section C) — ต้องยืนยันกับผู้ใช้ก่อนว่ายังต้องการ

---

## 10. Definition of Done

- [ ] แสดงทั้ง 10 หน้าตามลำดับและธีมต้นแบบ
- [ ] ทุกปุ่มและพื้นที่ Clickable ทำงานจริง
- [ ] เสียงตรงคำและไม่เล่นซ้อน
- [ ] เกมทั้ง 3 แบบตรวจคำตอบถูกต้อง
- [ ] คะแนน/Progress ไม่หายเมื่อ Refresh
- [ ] จัดการกรณีโหลดเสียงผิดพลาดหรือไม่อนุญาตไมค์
- [ ] ใช้งานได้บน Desktop, Tablet และ Mobile
- [ ] ครูตรวจทานคำศัพท์/บทอ่าน/เสียงก่อนใช้งาน

## 11. Suggested Future Design

แนะนำให้ทำบทเรียนแบบ **Data-driven Lesson Components** แทน Hardcode เพื่อใช้ชุด UI/Logic เดิมกับแม่กม แม่เกย แม่เกอว แม่กก แม่กด แม่กบ และแม่กน โดยเปลี่ยน Dataset, Asset และ Game Config เท่านั้น

> **Scope note:** คะแนน, Progress, Recording และข้อกำหนดด้านเทคนิคเป็นรายละเอียดเสนอเพิ่มเติมสำหรับการพัฒนา ไม่ใช่ฟังก์ชันที่ภาพต้นแบบทำงานได้เอง

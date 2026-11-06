import type { Lesson, SpottingWord, VocabularyWord, WordSelectionActivity } from './types.ts'

// Comic picture cards (docs/comic-art.md).
const image = (slug: string) => `/assets/comic/word-${slug}.webp`

const word = (text: string, slug: string): VocabularyWord => ({
  word: text,
  image: image(slug),
  audio: { id: `vocabulary/${slug}`, text },
})

const rom = word('ร่ม', 'rom')
const lom = word('ลม', 'lom')
const som = word('ส้ม', 'som')
const nom = word('นม', 'nom')
const phom = word('ผม', 'phom')
const cham = word('ชาม', 'cham')

// One-syllable words: `final` is the index of the ม; the spelling line is copied from the spec.
const spot = ({ audio }: VocabularyWord, final: number, spelling: string): SpottingWord => ({
  syllables: [{ text: audio.text, final }],
  spelling: spelling.split('-'),
  audio,
  spellingAudio: { id: audio.id.replace('vocabulary/', 'spelling/'), text: spelling.replaceAll('-', ' ') },
})

// Two rows of six, Target Words and distractors mixed. แมว, ม้า and มือ start with ม but do not end in it; ลิง is แม่กง.
const wordSelection = {
  question: 'แม่กมอยู่ไหน?',
  instruction: 'แตะภาพคำที่มี ม เป็นตัวสะกด',
  choices: [
    { ...word('แมว', 'maeo'), correct: false },
    { ...rom, correct: true },
    { ...word('ยิ้ม', 'yim'), correct: true },
    { ...lom, correct: true },
    { ...word('ม้า', 'ma'), correct: false },
    { ...som, correct: true },
    { ...nom, correct: true },
    { ...word('ลิง', 'ling'), correct: false },
    { ...word('แก้ม', 'kaem'), correct: true },
    { ...phom, correct: true },
    { ...word('มือ', 'mue'), correct: false },
    { ...cham, correct: true },
  ],
  praise: { id: 'feedback/keng-mak', text: 'เก่งมาก!' },
} satisfies WordSelectionActivity

/** แม่กม (ม). Content follows docs/mae-kom-spec.md. */
export const maeKom = {
  id: 'mae-kom',
  theme: 'mae-kom',
  title: 'คำแม่กมชมเมืองหิมะ',
  finalGroup: 'แม่กม',
  subtitle: 'แม่ กม (ม)',
  gradeLine: 'วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒',
  steps: [
    { title: 'หน้าปก' },
    { title: 'ดูภาพเรียนรู้คำ' },
    { title: 'ฟังแล้วอ่านตาม' },
    { title: 'สังเกตตัวสะกด' },
    { title: 'แม่กมอยู่ไหน?' },
    { title: 'กล่องคำแม่กม' },
    { title: 'อ่านการ์ตูนแม่กม' },
    { title: 'จับคู่ดูคำ' },
    { title: 'อ่านออก บอกได้' },
    { title: 'สรุปและประเมิน' },
  ],
  // Lesson narration is named after the Lesson; word, spelling and feedback clips are shared by id.
  intro: {
    id: 'explanations/mae-kom-intro',
    text: 'สวัสดีเด็ก ๆ วันนี้น้องส้มจะพาไปเที่ยวเมืองหิมะ และเรียนรู้คำในมาตราแม่กมกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
  },
  vocabulary: [rom, lom, som, nom, phom, cham],
  listenAndRepeat: [rom, lom, som, nom, phom, cham],
  spotting: {
    heading: 'มาตราแม่กม (ม) มี ม เป็นตัวสะกด',
    explanation: {
      id: 'explanations/mae-kom',
      text: 'เด็ก ๆ ลองสังเกตนะ คำว่า ร่ม ลม ส้ม นม ผม ชาม มีตัว ม อยู่ท้ายคำ เราเรียกว่าตัวสะกด คำที่มี ม เป็นตัวสะกด อยู่ในมาตราแม่กมจ้ะ',
    },
    sets: [
      [spot(rom, 2, 'รอ-โอะ-มอ-รม-ไม้เอก-ร่ม'), spot(lom, 1, 'ลอ-โอะ-มอ-ลม'), spot(som, 2, 'สอ-โอะ-มอ-สม-ไม้โท-ส้ม')],
      [spot(nom, 1, 'นอ-โอะ-มอ-นม'), spot(phom, 1, 'ผอ-โอะ-มอ-ผม'), spot(cham, 2, 'ชอ-อา-มอ-ชาม')],
    ],
  },
  wordSelection,
  // No bank word sits under its own picture, so the order gives nothing away.
  wordFilling: {
    instruction: 'เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง',
    bank: ['นม', 'ชาม', 'ร่ม', 'ผม', 'ส้ม', 'ลม'],
    pictures: [rom, lom, som, nom, phom, cham].map(({ word, image }) => ({ image, answer: word })),
  },
  rhymeMatching: {
    // Each pair sits on a diagonal of the buzzer grid, as on แม่กง.
    pairs: [
      { left: 'ร่ม', right: 'ชม' },
      { left: 'ลม', right: 'ผม' },
    ],
    words: [rom.audio, phom.audio, lom.audio, { id: 'vocabulary/chom', text: 'ชม' }],
    sounds: {
      correct: { id: 'feedback/correct', text: 'ถูกต้อง' },
    },
  },
  // One comic panel per line; `panel` stays unset until the Step 7 comic art exists (#54).
  rhyme: [
    { id: 'rhyme/mae-kom/line-01', text: 'น้องส้มกางร่มเดินเล่น', rhymeWords: ['ร่ม'] },
    { id: 'rhyme/mae-kom/line-02', text: 'ลมพัดแรง ผมปลิว', rhymeWords: ['ลม', 'ผม'] },
    { id: 'rhyme/mae-kom/line-03', text: 'ร่มลอยขึ้นฟ้า!', rhymeWords: ['ร่ม'] },
    { id: 'rhyme/mae-kom/line-04', text: 'กลับบ้านกินส้มกับนม ยิ้มแก้มแดง', rhymeWords: ['ส้ม', 'นม', 'ยิ้ม', 'แก้ม'] },
  ],
  sentences: [
    { images: [image('rom'), image('lom')], audio: { id: 'sentences/mae-kom/sentence-01', text: 'น้องส้มกางร่มกันลม' } },
    { images: [image('nom'), image('cham')], audio: { id: 'sentences/mae-kom/sentence-02', text: 'แม่เทนมใส่ชาม' } },
  ],
} as const satisfies Lesson

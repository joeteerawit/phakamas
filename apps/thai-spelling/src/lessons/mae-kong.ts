import type { Lesson, SpottingWord, VocabularyWord, WordSelectionActivity } from './types.ts'

// shortcut: some pictures are emoji or blank placeholders, the Step tickets overwrite them with Canva exports.
const image = (slug: string) => `/assets/canva/vocabulary/${slug}.webp`

const word = (text: string, slug: string): VocabularyWord => ({
  word: text,
  image: image(slug),
  audio: { id: `vocabulary/${slug}`, text },
})

const ling = word('ลิง', 'ling')
const chang = word('ช้าง', 'chang')
const dang = word('ดัง', 'dang')
const rang = word('รัง', 'rang')
const khang = word('ค่าง', 'khang')
const phueng = word('ผึ้ง', 'phueng')

// One-syllable words: `final` is the index of the ง; the spelling line is copied from the design.
const spot = ({ audio }: VocabularyWord, final: number, spelling: string): SpottingWord => ({
  syllables: [{ text: audio.text, final }],
  spelling: spelling.split('-'),
  audio,
})

// Design order, two rows of six. งู and เงา start with ง but do not end in it.
const wordSelection = {
  question: 'แม่กงอยู่ไหน?',
  instruction: 'แตะภาพคำที่มี ง เป็นตัวสะกด',
  choices: [
    { ...word('งู', 'ngu'), correct: false },
    { ...dang, correct: true },
    { ...word('บ้าน', 'ban'), correct: false },
    { ...word('ก้ม', 'kom'), correct: false },
    { ...word('สูง', 'sung'), correct: true },
    { ...phueng, correct: true },
    { ...ling, correct: true },
    { ...chang, correct: true },
    { ...word('ลุง', 'lung'), correct: true },
    { ...rang, correct: true },
    { ...khang, correct: true },
    { ...word('เงา', 'ngao'), correct: false },
  ],
  praise: { id: 'feedback/keng-mak', text: 'เก่งมาก!' },
} satisfies WordSelectionActivity

/** แม่กง (ง). Content follows the Canva design DAHZj0Nxyxs. */
export const maeKong = {
  id: 'mae-kong',
  title: 'คำคล้องจองพาเพลิน',
  subtitle: 'แม่ กง (ง)',
  course: 'วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒',
  steps: [
    { title: 'หน้าปก' },
    { title: 'ดูภาพเรียนรู้คำ' },
    { title: 'ฟังแล้วอ่านตาม' },
    { title: 'สังเกตตัวสะกด' },
    { title: 'แม่กงอยู่ไหน?' },
    { title: 'กล่องคำแม่กง' },
    { title: 'อ่านร้องคล้องคำ' },
    { title: 'จับคู่ดูคำ' },
    { title: 'อ่านออก บอกได้' },
    { title: 'สรุปและประเมิน' },
  ],
  intro: {
    id: 'intro',
    text: 'สวัสดีเด็ก ๆ วันนี้เราจะมาเรียนรู้คำคล้องจองในมาตราแม่กงกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
  },
  vocabulary: [ling, chang, dang, rang, khang, phueng],
  listenAndRepeat: [ling, chang, dang, rang, khang, phueng],
  spotting: {
    heading: 'มาตราแม่กง (ง) มี ง เป็นตัวสะกด',
    explanation: {
      id: 'explanations/mae-kong',
      text: 'เด็ก ๆ ลองสังเกตนะ คำว่า ลิง ช้าง ดัง รัง ค่าง ผึ้ง มีตัว ง อยู่ท้ายคำ เราเรียกว่าตัวสะกด คำที่มี ง เป็นตัวสะกด อยู่ในมาตราแม่กงจ้ะ',
    },
    sets: [
      [spot(ling, 2, 'ลอ-อิ-งอ-ลิง'), spot(chang, 3, 'ชอ-อา-งอ-ชาง-ไม้โท-ช้าง'), spot(dang, 2, 'ดอ-อะ-งอ-ดัง')],
      [spot(rang, 2, 'รอ-อะ-งอ-รัง'), spot(khang, 3, 'คอ-อา-งอ-คาง-ไม้เอก-ค่าง'), spot(phueng, 3, 'ผอ-อึ-งอ-ผึง-ไม้โท-ผึ้ง')],
    ],
  },
  wordSelection,
  // Pictures and bank in design order; they differ, so the order gives nothing away.
  wordFilling: {
    instruction: 'เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง',
    bank: ['รัง', 'ดัง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ค่าง'],
    pictures: [ling, chang, dang, rang, khang, phueng].map(({ word, image }) => ({ image, answer: word })),
  },
  rhymeMatching: {
    // Design shows the buttons as มอง, ฟัง / ดัง, ร้อง.
    pairs: [
      { left: 'มอง', right: 'ร้อง' },
      { left: 'ดัง', right: 'ฟัง' },
    ],
    sounds: {
      correct: { id: 'feedback/correct', text: 'ถูกต้อง' },
      completed: { id: 'feedback/completed', text: 'เก่งมาก จับคู่ถูกครบแล้ว' },
    },
  },
  rhyme: [
    { id: 'rhyme/line-01', text: 'ลิงน้อยนั่งมอง', rhymeWords: ['มอง'] },
    { id: 'rhyme/line-02', text: 'ช้างร้องเสียงดัง', rhymeWords: ['ร้อง', 'ดัง'] },
    { id: 'rhyme/line-03', text: 'นกบินกลับรัง', rhymeWords: ['รัง'] },
    { id: 'rhyme/line-04', text: 'ฟังเพลงเพลินใจ', rhymeWords: ['ฟัง'] },
  ],
  sentences: [
    { images: [image('ling'), image('chang')], audio: { id: 'sentences/sentence-01', text: 'ลิงน้อยนั่งมองช้าง' } },
    { images: [image('bang')], audio: { id: 'sentences/sentence-02', text: 'บ่างวิ่งไล่ตามมา' } },
  ],
} as const satisfies Lesson

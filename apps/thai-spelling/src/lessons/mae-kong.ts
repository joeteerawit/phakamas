import type { AudioClip, Lesson, SpottingWord, VocabularyWord } from './types.ts'

const image = (name: string) => `/assets/images/vocabulary/${name}_3d.png`

const word = (text: string, slug: string, picture: string): VocabularyWord => ({
  word: text,
  image: image(picture),
  audio: { id: `vocabulary/${slug}`, text },
})

const ling = word('ลิง', 'ling', 'monkey')
const chang = word('ช้าง', 'chang', 'elephant')
const rang = word('รัง', 'rang', 'nest_with_eggs')
const kangKeng = word('กางเกง', 'kang-keng', 'jeans')
const dang = word('ดัง', 'dang', 'loudspeaker')

// Syllable splits and the explanation need teacher review before release (spec Page 04 Rule).
const spot = ({ audio }: { audio: AudioClip }, ...syllables: [text: string, final: number][]): SpottingWord => ({
  syllables: syllables.map(([text, final]) => ({ text, final })),
  audio,
})

/** แม่กง (ง). Step titles follow spec §1.1. */
export const maeKong = {
  id: 'mae-kong',
  title: 'คำคล้องจองพาเพลิน',
  subtitle: 'มาตราแม่กง (ง)',
  steps: [
    { title: 'หน้าปก' },
    { title: 'ดูภาพเรียนรู้คำ' },
    { title: 'ฟังแล้วอ่านตาม' },
    { title: 'สังเกตตัวสะกด' },
    { title: 'เลือกคำในมาตรา' },
    { title: 'เติมคำตรงภาพ' },
    { title: 'อ่านคำคล้องจอง' },
    { title: 'เกมจับคู่เสียง' },
    { title: 'ฝึกอ่านประโยค' },
    { title: 'สรุปและประเมิน' },
  ],
  intro: {
    id: 'intro',
    text: 'สวัสดีเด็ก ๆ วันนี้เราจะมาเรียนรู้คำคล้องจองในมาตราแม่กงกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
  },
  // ค้างคาว is a Supporting Word: คาว ends in ว, only ค้าง is แม่กง.
  vocabulary: [ling, chang, rang, kangKeng, dang, word('ค้างคาว', 'khang-khao', 'bat')],
  listenAndRepeat: [ling, chang, rang, kangKeng, dang],
  spotting: {
    heading: 'มาตราแม่กง (ง) มี ง เป็นตัวสะกด',
    explanation: {
      id: 'explanations/mae-kong',
      text: 'เด็ก ๆ ลองสังเกตนะ คำว่า ลิง ช้าง รัง มีตัว ง อยู่ท้ายคำ เราเรียกว่าตัวสะกด คำที่มี ง เป็นตัวสะกด อยู่ในมาตราแม่กง ส่วนคำว่า กางเกง มีสองพยางค์ คือ กาง กับ เกง จึงมีตัว ง สะกดถึงสองตัวเลยจ้ะ',
    },
    words: [spot(ling, ['ลิง', 2]), spot(chang, ['ช้าง', 3]), spot(rang, ['รัง', 2]), spot(kangKeng, ['กาง', 2], ['เกง', 2])],
  },
  // Pictures are shuffled against the bank so the order gives nothing away.
  wordFilling: {
    bank: ['ลิง', 'ช้าง', 'รัง', 'กางเกง', 'ดัง', 'ค้างคาว'],
    pictures: [
      { image: image('elephant'), answer: 'ช้าง' },
      { image: image('loudspeaker'), answer: 'ดัง' },
      { image: image('monkey'), answer: 'ลิง' },
      { image: image('bat'), answer: 'ค้างคาว' },
      { image: image('nest_with_eggs'), answer: 'รัง' },
      { image: image('jeans'), answer: 'กางเกง' },
    ],
  },
  rhymeMatching: {
    pairs: [
      { left: 'ดัง', right: 'ฟัง' },
      { left: 'รัง', right: 'นั่ง' },
      { left: 'กาง', right: 'วาง' },
    ],
    sounds: {
      correct: { id: 'feedback/correct', text: 'ถูกต้อง' },
      completed: { id: 'feedback/completed', text: 'เก่งมาก จับคู่ถูกครบแล้ว' },
    },
  },
  rhyme: ['ลิงน้อยนั่งมอง', 'ช้างร้องเสียงดัง', 'นกบินกลับรัง', 'ฟังเพลงเพลินใจ'].map((text, i) => ({
    id: `rhyme/line-0${i + 1}`,
    text,
  })),
  sentences: [
    { images: [image('monkey'), image('elephant')], audio: { id: 'sentences/sentence-01', text: 'ลิงน้อยนั่งมองช้าง' } },
    { images: [image('bat'), image('nest_with_eggs')], audio: { id: 'sentences/sentence-02', text: 'ค้างคาวบินกลับรัง' } },
  ],
} as const satisfies Lesson

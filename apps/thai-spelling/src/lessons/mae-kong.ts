import type { Lesson, VocabularyWord } from './types.ts'

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
} as const satisfies Lesson

import type { Lesson, VocabularyWord } from './types'

const word = (text: string, slug: string, image: string): VocabularyWord => ({
  word: text,
  image: `/assets/images/vocabulary/${image}_3d.png`,
  audio: { id: `vocabulary/${slug}`, text },
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
  vocabulary: [
    word('ลิง', 'ling', 'monkey'),
    word('ช้าง', 'chang', 'elephant'),
    word('รัง', 'rang', 'nest_with_eggs'),
    word('กางเกง', 'kang-keng', 'jeans'),
    word('ดัง', 'dang', 'loudspeaker'),
    word('ค้างคาว', 'khang-khao', 'bat'),
  ],
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
} as const satisfies Lesson

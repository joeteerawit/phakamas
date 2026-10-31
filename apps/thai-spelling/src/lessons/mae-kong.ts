import type { Lesson } from './types'

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
} as const satisfies Lesson

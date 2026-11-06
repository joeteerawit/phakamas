import { describe, expect, it } from 'vitest'
import { DEFAULT_LESSON_ID, getLesson, parseStepNumber } from './index'
import { maeKong } from './mae-kong'

const picture = (slug: string) => `/assets/comic/word-${slug}.webp`

describe('mae-kong lesson data (Canva design DAHZj0Nxyxs)', () => {
  it('has the cover title, subtitle and grade line', () => {
    expect(maeKong.id).toBe('mae-kong')
    expect(maeKong.title).toBe('คำคล้องจองพาเพลิน')
    expect(maeKong.subtitle).toBe('แม่ กง (ง)')
    expect(maeKong.gradeLine).toBe('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  })

  it('has the 10 Step titles of the design, in order', () => {
    expect(maeKong.steps.map((step) => step.title)).toEqual([
      'หน้าปก',
      'ดูภาพเรียนรู้คำ',
      'ฟังแล้วอ่านตาม',
      'สังเกตตัวสะกด',
      'แม่กงอยู่ไหน?',
      'กล่องคำแม่กง',
      'อ่านร้องคล้องคำ',
      'จับคู่ดูคำ',
      'อ่านออก บอกได้',
      'สรุปและประเมิน',
    ])
  })

  it('is the default Lesson and can be looked up by id', () => {
    expect(DEFAULT_LESSON_ID).toBe('mae-kong')
    expect(getLesson('mae-kong')).toBe(maeKong)
    expect(getLesson('no-such-lesson')).toBeUndefined()
    expect(getLesson('constructor')).toBeUndefined()
  })

  it('accepts only integer Step numbers 1–10', () => {
    expect(parseStepNumber(maeKong, '1')).toBe(1)
    expect(parseStepNumber(maeKong, '10')).toBe(10)
    for (const raw of ['0', '01', '11', '99', '-1', '1.5', 'abc', '', ' 2', '1e1']) {
      expect(parseStepNumber(maeKong, raw)).toBeUndefined()
    }
  })

  it('Steps 2 and 3 show the 6 Target Words with their picture and audio', () => {
    const expected = [
      ['ลิง', picture('ling'), 'vocabulary/ling'],
      ['ช้าง', picture('chang'), 'vocabulary/chang'],
      ['ดัง', picture('dang'), 'vocabulary/dang'],
      ['รัง', picture('rang'), 'vocabulary/rang'],
      ['ค่าง', picture('khang'), 'vocabulary/khang'],
      ['ผึ้ง', picture('phueng'), 'vocabulary/phueng'],
    ]
    expect(maeKong.vocabulary.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    expect(maeKong.listenAndRepeat.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    for (const { word, audio } of maeKong.vocabulary) expect(audio.text).toBe(word)
  })

  it('Step 4 spots the final ง in two sets of three, with the design spelling lines', () => {
    const { sets } = maeKong.spotting
    expect(
      sets.map((set) =>
        set.map(({ audio, syllables, spelling }) => [
          audio.id,
          syllables.map(({ text, final }) => `${text.slice(0, final)}[${text[final]}]${text.slice(final + 1)}`).join('|'),
          spelling.join('-'),
        ]),
      ),
    ).toEqual([
      [
        ['vocabulary/ling', 'ลิ[ง]', 'ลอ-อิ-งอ-ลิง'],
        ['vocabulary/chang', 'ช้า[ง]', 'ชอ-อา-งอ-ชาง-ไม้โท-ช้าง'],
        ['vocabulary/dang', 'ดั[ง]', 'ดอ-อะ-งอ-ดัง'],
      ],
      [
        ['vocabulary/rang', 'รั[ง]', 'รอ-อะ-งอ-รัง'],
        ['vocabulary/khang', 'ค่า[ง]', 'คอ-อา-งอ-คาง-ไม้เอก-ค่าง'],
        ['vocabulary/phueng', 'ผึ้[ง]', 'ผอ-อึ-งอ-ผึง-ไม้โท-ผึ้ง'],
      ],
    ])
    for (const { syllables, audio } of sets.flat()) expect(syllables.map(({ text }) => text).join('')).toBe(audio.text)
    expect(maeKong.spotting.explanation.text).toMatch(/แม่กง/)
  })

  it('Step 5 asks แม่กงอยู่ไหน? over 12 picture cards in design order', () => {
    const { question, instruction, choices } = maeKong.wordSelection
    expect(question).toBe('แม่กงอยู่ไหน?')
    expect(instruction).toMatch(/ง/)
    expect(choices.map(({ word, correct }) => [word, correct])).toEqual([
      ['งู', false],
      ['ดัง', true],
      ['บ้าน', false],
      ['ก้ม', false],
      ['สูง', true],
      ['ผึ้ง', true],
      ['ลิง', true],
      ['ช้าง', true],
      ['ลุง', true],
      ['รัง', true],
      ['ค่าง', true],
      ['เงา', false],
    ])
    for (const { word, image, audio } of choices) {
      expect(image).toMatch(/^\/assets\/comic\/word-[a-z-]+\.webp$/)
      expect(audio.text).toBe(word)
    }
  })

  it('Step 6 fills the 6 pictures from the bank in design order', () => {
    const { bank, pictures, instruction } = maeKong.wordFilling
    expect(instruction).toBe('เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง')
    expect(bank).toEqual(['รัง', 'ดัง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ค่าง'])
    expect(pictures.map(({ image, answer }) => [image, answer])).toEqual([
      [picture('ling'), 'ลิง'],
      [picture('chang'), 'ช้าง'],
      [picture('dang'), 'ดัง'],
      [picture('rang'), 'รัง'],
      [picture('khang'), 'ค่าง'],
      [picture('phueng'), 'ผึ้ง'],
    ])
  })

  it('Step 7 has the 4 rhyme lines with their rhyme words marked', () => {
    expect(maeKong.rhyme.map(({ id, text, rhymeWords }) => [id, text, rhymeWords])).toEqual([
      ['rhyme/line-01', 'ลิงน้อยนั่งมอง', ['มอง']],
      ['rhyme/line-02', 'ช้างร้องเสียงดัง', ['ร้อง', 'ดัง']],
      ['rhyme/line-03', 'นกบินกลับรัง', ['รัง']],
      ['rhyme/line-04', 'ฟังเพลงเพลินใจ', ['ฟัง']],
    ])
    for (const { text, rhymeWords } of maeKong.rhyme) for (const w of rhymeWords) expect(text).toContain(w)
  })

  it('Step 8 matches มอง↔ร้อง and ดัง↔ฟัง', () => {
    expect(maeKong.rhymeMatching.pairs).toEqual([
      { left: 'มอง', right: 'ร้อง' },
      { left: 'ดัง', right: 'ฟัง' },
    ])
  })

  it('Step 8 has a word clip for every buzzer', () => {
    expect(maeKong.rhymeMatching.words.map(({ id, text }) => [id, text])).toEqual([
      ['vocabulary/mong', 'มอง'],
      ['vocabulary/fang', 'ฟัง'],
      ['vocabulary/dang', 'ดัง'],
      ['vocabulary/rong', 'ร้อง'],
    ])
  })

  it('Step 9 reads the two design sentences', () => {
    expect(maeKong.sentences.map(({ audio }) => [audio.id, audio.text])).toEqual([
      ['sentences/sentence-01', 'ลิงน้อยนั่งมองช้าง'],
      ['sentences/sentence-02', 'บ่างวิ่งไล่ตามมา'],
    ])
  })
})

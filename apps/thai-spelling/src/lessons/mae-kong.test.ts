import { describe, expect, it } from 'vitest'
import { DEFAULT_LESSON_ID, getLesson, parseStepNumber } from './index'
import { maeKong } from './mae-kong'

describe('mae-kong lesson data', () => {
  it('has the cover title and subtitle', () => {
    expect(maeKong.id).toBe('mae-kong')
    expect(maeKong.title).toBe('คำคล้องจองพาเพลิน')
    expect(maeKong.subtitle).toBe('มาตราแม่กง (ง)')
  })

  it('has the 10 Steps from spec §1.1, in order, each with a Thai title', () => {
    expect(maeKong.steps.map((step) => step.title)).toEqual([
      'หน้าปก',
      'ดูภาพเรียนรู้คำ',
      'ฟังแล้วอ่านตาม',
      'สังเกตตัวสะกด',
      'เลือกคำในมาตรา',
      'เติมคำตรงภาพ',
      'อ่านคำคล้องจอง',
      'เกมจับคู่เสียง',
      'ฝึกอ่านประโยค',
      'สรุปและประเมิน',
    ])
    for (const step of maeKong.steps) {
      expect(step.title).toMatch(/^[\u0E00-\u0E7F ]+$/)
    }
  })

  it('is the default Lesson and can be looked up by id', () => {
    expect(DEFAULT_LESSON_ID).toBe('mae-kong')
    expect(getLesson('mae-kong')).toBe(maeKong)
    expect(getLesson('mae-kom')).toBeUndefined()
    expect(getLesson('constructor')).toBeUndefined()
  })

  it('accepts only integer Step numbers 1–10', () => {
    expect(parseStepNumber(maeKong, '1')).toBe(1)
    expect(parseStepNumber(maeKong, '10')).toBe(10)
    for (const raw of ['0', '01', '11', '99', '-1', '1.5', 'abc', '', ' 2', '1e1']) {
      expect(parseStepNumber(maeKong, raw)).toBeUndefined()
    }
  })

  it('has the intro clip and the 6 vocabulary words with audio IDs and Thai text (spec §2, §5)', () => {
    expect(maeKong.intro).toEqual({
      id: 'intro',
      text: 'สวัสดีเด็ก ๆ วันนี้เราจะมาเรียนรู้คำคล้องจองในมาตราแม่กงกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
    })
    expect(maeKong.vocabulary.map(({ word, audio }) => [word, audio.id, audio.text])).toEqual([
      ['ลิง', 'vocabulary/ling', 'ลิง'],
      ['ช้าง', 'vocabulary/chang', 'ช้าง'],
      ['รัง', 'vocabulary/rang', 'รัง'],
      ['กางเกง', 'vocabulary/kang-keng', 'กางเกง'],
      ['ดัง', 'vocabulary/dang', 'ดัง'],
      ['ค้างคาว', 'vocabulary/khang-khao', 'ค้างคาว'],
    ])
  })

  it('practises the 5 Target Words in Step 3 order, each with its own picture and audio', () => {
    expect(maeKong.listenAndRepeat.map(({ word, image, audio }) => [word, image, audio.id])).toEqual([
      ['ลิง', '/assets/images/vocabulary/monkey_3d.png', 'vocabulary/ling'],
      ['ช้าง', '/assets/images/vocabulary/elephant_3d.png', 'vocabulary/chang'],
      ['รัง', '/assets/images/vocabulary/nest_with_eggs_3d.png', 'vocabulary/rang'],
      ['กางเกง', '/assets/images/vocabulary/jeans_3d.png', 'vocabulary/kang-keng'],
      ['ดัง', '/assets/images/vocabulary/loudspeaker_3d.png', 'vocabulary/dang'],
    ])
  })

  it('marks every final ง by explicit per-syllable position, both in กางเกง (spec Page 04, TC-005)', () => {
    const { spotting } = maeKong
    expect(spotting.heading).toBe('มาตราแม่กง (ง) มี ง เป็นตัวสะกด')
    expect(spotting.explanation.id).toBe('explanations/mae-kong')
    expect(spotting.explanation.text).toMatch(/แม่กง/)
    expect(
      spotting.words.map(({ audio, syllables }) => [
        audio.id,
        syllables.map(({ text, final }) => `${text.slice(0, final)}[${text[final]}]${text.slice(final + 1)}`).join('|'),
      ]),
    ).toEqual([
      ['vocabulary/ling', 'ลิ[ง]'],
      ['vocabulary/chang', 'ช้า[ง]'],
      ['vocabulary/rang', 'รั[ง]'],
      ['vocabulary/kang-keng', 'กา[ง]|เก[ง]'],
    ])
    for (const { syllables, audio } of spotting.words) expect(syllables.map(({ text }) => text).join('')).toBe(audio.text)
  })

  it('word filling: 6 bank words, each the answer of exactly one picture', () => {
    const { bank, pictures } = maeKong.wordFilling
    expect(bank).toEqual(['ลิง', 'ช้าง', 'รัง', 'กางเกง', 'ดัง', 'ค้างคาว'])
    expect(pictures.map((p) => p.answer).toSorted()).toEqual([...bank].sort())
    expect(pictures.map((p) => p.answer)).not.toEqual(bank)
  })

  it('has the 4 rhyme lines with line-01..04 audio IDs (spec §2 Step 7, §5)', () => {
    expect(maeKong.rhyme).toEqual([
      { id: 'rhyme/line-01', text: 'ลิงน้อยนั่งมอง' },
      { id: 'rhyme/line-02', text: 'ช้างร้องเสียงดัง' },
      { id: 'rhyme/line-03', text: 'นกบินกลับรัง' },
      { id: 'rhyme/line-04', text: 'ฟังเพลงเพลินใจ' },
    ])
  })
})


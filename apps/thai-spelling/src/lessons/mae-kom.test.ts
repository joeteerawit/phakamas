import { describe, expect, it } from 'vitest'
import { splitWords } from '../steps/karaoke'
import { getTheme } from '../themes'
import { getLesson, parseStepNumber } from './index'
import { maeKom } from './mae-kom'

const picture = (slug: string) => `/assets/comic/word-${slug}.webp`

/** Every string anywhere in the Lesson data. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(strings)
}

const targetWords = [
  ...new Set([
    ...maeKom.vocabulary.map(({ word }) => word),
    ...maeKom.wordSelection.choices.filter(({ correct }) => correct).map(({ word }) => word),
    ...maeKom.wordFilling.bank,
    ...maeKom.rhymeMatching.words.map(({ text }) => text),
    ...maeKom.rhyme.flatMap(({ rhymeWords }) => rhymeWords),
  ]),
]

// Written text has no syllable breaks, so each Target Word's syllables are spelled out here; a new word needs an
// entry. ขนม (['ขะ', 'หนม']) or ผ้าห่ม (['ผ้า', 'ห่ม']) would fail, as the spec says.
const syllablesOf: Record<string, string[]> = {
  ร่ม: ['ร่ม'],
  ลม: ['ลม'],
  ส้ม: ['ส้ม'],
  นม: ['นม'],
  ผม: ['ผม'],
  ชาม: ['ชาม'],
  แก้ม: ['แก้ม'],
  ยิ้ม: ['ยิ้ม'],
  ชม: ['ชม'],
}

describe('mae-kom lesson data (docs/mae-kom-spec.md)', () => {
  it('has the cover title, subtitle and grade line', () => {
    expect(maeKom.id).toBe('mae-kom')
    expect(maeKom.theme).toBe('mae-kom')
    expect(maeKom.title).toBe('คำแม่กมชมเมืองหิมะ')
    expect(maeKom.subtitle).toBe('แม่ กม (ม)')
    expect(maeKom.gradeLine).toBe('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  })

  it('has the 10 Step titles, in order', () => {
    expect(maeKom.steps.map((step) => step.title)).toEqual([
      'หน้าปก',
      'ดูภาพเรียนรู้คำ',
      'ฟังแล้วอ่านตาม',
      'สังเกตตัวสะกด',
      'แม่กมอยู่ไหน?',
      'กล่องคำแม่กม',
      'อ่านการ์ตูนแม่กม',
      'จับคู่ดูคำ',
      'อ่านออก บอกได้',
      'สรุปและประเมิน',
    ])
  })

  it('can be looked up by id and accepts Step numbers 1–10', () => {
    expect(getLesson('mae-kom')).toBe(maeKom)
    expect(parseStepNumber(maeKom, '1')).toBe(1)
    expect(parseStepNumber(maeKom, '10')).toBe(10)
    expect(parseStepNumber(maeKom, '11')).toBeUndefined()
  })

  it('names the แม่กม Theme, whose Mascot is น้องส้ม', () => {
    expect(getTheme(maeKom.theme).id).toBe('mae-kom')
    expect(getTheme(maeKom.theme).mascot.name).toBe('น้องส้ม')
  })

  it('plays the spec intro on the cover', () => {
    expect(maeKom.intro.text).toBe(
      'สวัสดีเด็ก ๆ วันนี้น้องส้มจะพาไปเที่ยวเมืองหิมะ และเรียนรู้คำในมาตราแม่กมกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
    )
  })

  it('Steps 2 and 3 show the 6 Target Words with their picture and audio', () => {
    const expected = [
      ['ร่ม', picture('rom'), 'vocabulary/rom'],
      ['ลม', picture('lom'), 'vocabulary/lom'],
      ['ส้ม', picture('som'), 'vocabulary/som'],
      ['นม', picture('nom'), 'vocabulary/nom'],
      ['ผม', picture('phom'), 'vocabulary/phom'],
      ['ชาม', picture('cham'), 'vocabulary/cham'],
    ]
    expect(maeKom.vocabulary.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    expect(maeKom.listenAndRepeat.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    for (const { word, audio } of maeKom.vocabulary) expect(audio.text).toBe(word)
  })

  it('Step 4 spots the final ม in two sets of three, with the spec spelling lines', () => {
    const { sets } = maeKom.spotting
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
        ['vocabulary/rom', 'ร่[ม]', 'รอ-โอะ-มอ-รม-ไม้เอก-ร่ม'],
        ['vocabulary/lom', 'ล[ม]', 'ลอ-โอะ-มอ-ลม'],
        ['vocabulary/som', 'ส้[ม]', 'สอ-โอะ-มอ-สม-ไม้โท-ส้ม'],
      ],
      [
        ['vocabulary/nom', 'น[ม]', 'นอ-โอะ-มอ-นม'],
        ['vocabulary/phom', 'ผ[ม]', 'ผอ-โอะ-มอ-ผม'],
        ['vocabulary/cham', 'ชา[ม]', 'ชอ-อา-มอ-ชาม'],
      ],
    ])
    for (const { syllables, audio } of sets.flat()) expect(syllables.map(({ text }) => text).join('')).toBe(audio.text)
    expect(maeKom.spotting.heading).toBe('มาตราแม่กม (ม) มี ม เป็นตัวสะกด')
    expect(maeKom.spotting.explanation.text).toMatch(/แม่กม/)
    expect(maeKom.spotting.explanation.text).toContain('ร่ม ลม ส้ม นม ผม ชาม')
  })

  it('Step 5 asks แม่กมอยู่ไหน? over the six words, แก้ม, ยิ้ม and the four distractors', () => {
    const { question, instruction, choices } = maeKom.wordSelection
    expect(question).toBe('แม่กมอยู่ไหน?')
    expect(instruction).toMatch(/ม/)
    expect(choices).toHaveLength(12)
    expect(choices.filter(({ correct }) => correct).map(({ word }) => word).toSorted()).toEqual(
      ['ร่ม', 'ลม', 'ส้ม', 'นม', 'ผม', 'ชาม', 'แก้ม', 'ยิ้ม'].toSorted(),
    )
    expect(choices.filter(({ correct }) => !correct).map(({ word }) => word).toSorted()).toEqual(
      ['แมว', 'ม้า', 'มือ', 'ลิง'].toSorted(),
    )
    for (const { word, image, audio } of choices) {
      expect(image).toMatch(/^\/assets\/comic\/word-[a-z-]+\.webp$/)
      expect(audio.text).toBe(word)
    }
    // ลิง reuses the แม่กง card and clip.
    expect(choices.find(({ word }) => word === 'ลิง')).toMatchObject({ image: picture('ling'), audio: { id: 'vocabulary/ling' } })
  })

  it('Step 6 fills the 6 pictures from the bank, no word under its own picture', () => {
    const { bank, pictures, instruction } = maeKom.wordFilling
    expect(instruction).toBe('เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง')
    expect(bank.toSorted()).toEqual(maeKom.vocabulary.map(({ word }) => word).toSorted())
    expect(pictures.map(({ image, answer }) => [image, answer])).toEqual(
      maeKom.vocabulary.map(({ word, image }) => [image, word]),
    )
    bank.forEach((word, i) => expect(word).not.toBe(pictures[i]!.answer))
  })

  it('Step 7 has the 4 comic lines with their highlighted words marked', () => {
    expect(maeKom.rhyme.map(({ text, rhymeWords }) => [text, rhymeWords])).toEqual([
      ['น้องส้มกางร่มเดินเล่น', ['ร่ม']],
      ['ลมพัดแรง ผมปลิว', ['ลม', 'ผม']],
      ['ร่มลอยขึ้นฟ้า!', ['ร่ม']],
      ['กลับบ้านกินส้มกับนม ยิ้มแก้มแดง', ['ส้ม', 'นม', 'ยิ้ม', 'แก้ม']],
    ])
    // The layout highlights whole words as the segmenter splits them.
    for (const { text, rhymeWords } of maeKom.rhyme) for (const w of rhymeWords) expect(splitWords(text)).toContain(w)
  })

  it('Step 8 matches ร่ม↔ชม and ลม↔ผม, with a word clip for every buzzer', () => {
    expect(maeKom.rhymeMatching.pairs).toEqual([
      { left: 'ร่ม', right: 'ชม' },
      { left: 'ลม', right: 'ผม' },
    ])
    expect(maeKom.rhymeMatching.words.map(({ id, text }) => [id, text])).toEqual([
      ['vocabulary/rom', 'ร่ม'],
      ['vocabulary/phom', 'ผม'],
      ['vocabulary/lom', 'ลม'],
      ['vocabulary/chom', 'ชม'],
    ])
  })

  it('Step 9 reads the two spec sentences with their pictures', () => {
    expect(maeKom.sentences.map(({ images, audio }) => [audio.text, images])).toEqual([
      ['น้องส้มกางร่มกันลม', [picture('rom'), picture('lom')]],
      ['แม่เทนมใส่ชาม', [picture('nom'), picture('cham')]],
    ])
  })

  it('every syllable of every Target Word ends in ม', () => {
    expect(targetWords.filter((word) => !Object.hasOwn(syllablesOf, word))).toEqual([])
    for (const word of targetWords) {
      const syllables = syllablesOf[word]!
      expect(syllables.join(''), word).toBe(word)
      for (const syllable of syllables) expect(syllable, word).toMatch(/ม$/)
    }
    for (const { syllables } of maeKom.spotting.sets.flat()) {
      for (const { text, final } of syllables) {
        expect(text[final], text).toBe('ม')
        expect(final, text).toBe(text.length - 1)
      }
    }
  })

  it('no content word uses ำ', () => {
    const content = [
      ...targetWords,
      ...maeKom.wordSelection.choices.map(({ word }) => word),
      ...maeKom.rhyme.map(({ text }) => text),
      ...maeKom.sentences.map(({ audio }) => audio.text),
    ]
    expect(content.filter((text) => text.includes('ำ'))).toEqual([])
  })

  it("the Mascot's name never shares a sentence with the fruit ส้ม", () => {
    const name = getTheme(maeKom.theme).mascot.name
    const withName = strings(maeKom).filter((text) => text.includes(name))
    expect(withName.length).toBeGreaterThan(0)
    expect(withName.filter((text) => text.replaceAll(name, '').includes('ส้ม'))).toEqual([])
  })
})

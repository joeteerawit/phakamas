import { describe, expect, it } from 'vitest'
import { splitWords } from '../steps/karaoke'
import { getTheme } from '../themes'
import { getLesson, parseStepNumber } from './index'
import { maeKop } from './mae-kop'

const picture = (slug: string) => `/assets/comic/word-${slug}.webp`

/** มาตราแม่กบ: a syllable ends in one of these. */
const FINALS = ['บ', 'ป', 'พ', 'ฟ', 'ภ']
/** The spec's teaching point: the one Target Word whose final is not บ (its พ sounds like บ). */
const TEACHING_POINT = 'ภาพ'

const targetWords = [
  ...new Set([
    ...maeKop.vocabulary.map(({ word }) => word),
    ...maeKop.wordSelection.choices.filter(({ correct }) => correct).map(({ word }) => word),
    ...maeKop.wordFilling.bank,
    ...maeKop.rhymeMatching.words.map(({ text }) => text),
    ...maeKop.rhyme.flatMap(({ rhymeWords }) => rhymeWords),
  ]),
]

// Written text has no syllable breaks, so each Target Word's syllables are spelled out here; a new word needs an
// entry. ใบไม้ (['ใบ', 'ไม้']) would fail, as the spec says.
const syllablesOf: Record<string, string[]> = {
  กบ: ['กบ'],
  พับ: ['พับ'],
  จับ: ['จับ'],
  ภาพ: ['ภาพ'],
  เจ็บ: ['เจ็บ'],
  อาบ: ['อาบ'],
  จูบ: ['จูบ'],
  ดาบ: ['ดาบ'],
  จบ: ['จบ'],
  รับ: ['รับ'],
}

describe('mae-kop lesson data (docs/mae-kop-spec.md)', () => {
  it('has the cover title, subtitle and grade line', () => {
    expect(maeKop.id).toBe('mae-kop')
    expect(maeKop.theme).toBe('mae-kop')
    expect(maeKop.title).toBe('คำแม่กบหลบฝน')
    expect(maeKop.finalGroup).toBe('แม่กบ')
    expect(maeKop.subtitle).toBe('แม่ กบ (บ ป พ ฟ ภ)')
    expect(maeKop.gradeLine).toBe('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  })

  it('has the 10 Step titles, in order', () => {
    expect(maeKop.steps.map((step) => step.title)).toEqual([
      'หน้าปก',
      'ดูภาพเรียนรู้คำ',
      'ฟังแล้วอ่านตาม',
      'สังเกตตัวสะกด',
      'แม่กบอยู่ไหน?',
      'กล่องคำแม่กบ',
      'อ่านการ์ตูนแม่กบ',
      'จับคู่ดูคำ',
      'อ่านออก บอกได้',
      'สรุปและประเมิน',
    ])
  })

  it('can be looked up by id and accepts Step numbers 1–10', () => {
    expect(getLesson('mae-kop')).toBe(maeKop)
    expect(parseStepNumber(maeKop, '1')).toBe(1)
    expect(parseStepNumber(maeKop, '10')).toBe(10)
    expect(parseStepNumber(maeKop, '11')).toBeUndefined()
  })

  it('names the แม่กบ Theme, whose Mascot is น้องกบ', () => {
    expect(getTheme(maeKop.theme).id).toBe('mae-kop')
    expect(getTheme(maeKop.theme).mascot.name).toBe('น้องกบ')
  })

  it('plays the spec intro on the cover', () => {
    expect(maeKop.intro.text).toBe(
      'สวัสดีเด็ก ๆ วันนี้ฝนตก น้องกบจะพาไปเที่ยวบึงบัว และเรียนรู้คำในมาตราแม่กบกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
    )
  })

  it('Steps 2 and 3 show the 6 Target Words with their picture and audio', () => {
    const expected = [
      ['กบ', picture('kop'), 'vocabulary/kop'],
      ['พับ', picture('phap-fold'), 'vocabulary/phap-fold'],
      ['จับ', picture('chap'), 'vocabulary/chap'],
      ['ภาพ', picture('phap'), 'vocabulary/phap'],
      ['เจ็บ', picture('chep'), 'vocabulary/chep'],
      ['อาบ', picture('ap'), 'vocabulary/ap'],
    ]
    expect(maeKop.vocabulary.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    expect(maeKop.listenAndRepeat.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    for (const { word, audio } of maeKop.vocabulary) expect(audio.text).toBe(word)
  })

  it('Step 4 spots the final consonant in two sets of three, with the spec spelling lines', () => {
    const { sets } = maeKop.spotting
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
        ['vocabulary/kop', 'ก[บ]', 'กอ-โอะ-บอ-กบ'],
        ['vocabulary/phap-fold', 'พั[บ]', 'พอ-อะ-บอ-พับ'],
        ['vocabulary/chap', 'จั[บ]', 'จอ-อะ-บอ-จับ'],
      ],
      [
        ['vocabulary/phap', 'ภา[พ]', 'ภอ-อา-พอ-ภาพ'],
        ['vocabulary/chep', 'เจ็[บ]', 'จอ-เอะ-บอ-เจ็บ'],
        ['vocabulary/ap', 'อา[บ]', 'ออ-อา-บอ-อาบ'],
      ],
    ])
    for (const { syllables, audio } of sets.flat()) expect(syllables.map(({ text }) => text).join('')).toBe(audio.text)
    expect(maeKop.spotting.heading).toBe('มาตราแม่กบ มี บ ป พ ฟ ภ เป็นตัวสะกด')
    // The narration teaches ภาพ's พ as sounding like บ.
    expect(maeKop.spotting.explanation.text).toContain('กบ พับ จับ เจ็บ อาบ')
    expect(maeKop.spotting.explanation.text).toMatch(/ภาพ มีตัว พ เป็นตัวสะกด แต่ออกเสียงเหมือน บ/)
  })

  it('Step 5 asks แม่กบอยู่ไหน? over the six words, จูบ, ดาบ and the four distractors', () => {
    const { question, instruction, choices } = maeKop.wordSelection
    expect(question).toBe('แม่กบอยู่ไหน?')
    expect(instruction).toMatch(/บ ป พ ฟ ภ/)
    expect(choices).toHaveLength(12)
    expect(choices.filter(({ correct }) => correct).map(({ word }) => word).toSorted()).toEqual(
      ['กบ', 'พับ', 'จับ', 'ภาพ', 'เจ็บ', 'อาบ', 'จูบ', 'ดาบ'].toSorted(),
    )
    expect(choices.filter(({ correct }) => !correct).map(({ word }) => word).toSorted()).toEqual(['ใบไม้', 'ปู', 'บ้าน', 'ร่ม'].toSorted())
    for (const { word, image, audio } of choices) {
      expect(image).toMatch(/^\/assets\/comic\/word-[a-z-]+\.webp$/)
      expect(audio.text).toBe(word)
    }
    // บ้าน and ร่ม reuse the แม่กง and แม่กม cards and clips.
    expect(choices.find(({ word }) => word === 'บ้าน')).toMatchObject({ image: picture('ban'), audio: { id: 'vocabulary/ban' } })
    expect(choices.find(({ word }) => word === 'ร่ม')).toMatchObject({ image: picture('rom'), audio: { id: 'vocabulary/rom' } })
  })

  it('Step 6 fills the 6 pictures from the bank, no word under its own picture', () => {
    const { bank, pictures, instruction } = maeKop.wordFilling
    expect(instruction).toBe('เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง')
    expect(bank.toSorted()).toEqual(maeKop.vocabulary.map(({ word }) => word).toSorted())
    expect(pictures.map(({ image, answer }) => [image, answer])).toEqual(maeKop.vocabulary.map(({ word, image }) => [image, word]))
    bank.forEach((word, i) => expect(word).not.toBe(pictures[i]!.answer))
  })

  it('Step 7 has the 4 comic lines with their highlighted words marked', () => {
    expect(maeKop.rhyme.map(({ text, rhymeWords }) => [text, rhymeWords])).toEqual([
      ['ฝนตกแล้ว กบออกมาอาบฝน', ['กบ', 'อาบ']],
      ['กบพับเรือกระดาษ ปล่อยลอยไป', ['กบ', 'พับ']],
      ['วิ่งไปจับเรือ ลื่นล้มเจ็บเข่า', ['จับ', 'เจ็บ']],
      ['ฝนหยุด กบวาดภาพเรือกับสายรุ้ง', ['กบ', 'ภาพ']],
    ])
    // The layout highlights whole words as the segmenter splits them.
    for (const { text, rhymeWords } of maeKop.rhyme) for (const w of rhymeWords) expect(splitWords(text)).toContain(w)
  })

  it('Step 8 matches กบ↔จบ and จับ↔รับ, with a word clip for every boot', () => {
    expect(maeKop.rhymeMatching.pairs).toEqual([
      { left: 'กบ', right: 'จบ' },
      { left: 'จับ', right: 'รับ' },
    ])
    expect(maeKop.rhymeMatching.words.map(({ id, text }) => [id, text])).toEqual([
      ['vocabulary/kop', 'กบ'],
      ['vocabulary/chap', 'จับ'],
      ['vocabulary/rap', 'รับ'],
      ['vocabulary/chop', 'จบ'],
    ])
  })

  it('Step 9 reads the two spec sentences with their pictures', () => {
    expect(maeKop.sentences.map(({ images, audio }) => [audio.text, images])).toEqual([
      ['กบเจ็บ แม่จูบให้หาย', [picture('chep'), picture('chup')]],
      ['พี่พับภาพเป็นเรือ', [picture('phap-fold'), picture('phap')]],
    ])
    // Each sentence holds the words its two pictures show.
    for (const { images, audio } of maeKop.sentences) {
      for (const src of images) {
        const word = [...maeKop.vocabulary, ...maeKop.wordSelection.choices].find(({ image }) => image === src)!.word
        expect(splitWords(audio.text), src).toContain(word)
      }
    }
  })

  it('every syllable of every Target Word is in แม่กบ, ending in บ except the teaching-point word ภาพ', () => {
    expect(targetWords.filter((word) => !Object.hasOwn(syllablesOf, word))).toEqual([])
    for (const word of targetWords) {
      const syllables = syllablesOf[word]!
      expect(syllables.join(''), word).toBe(word)
      for (const syllable of syllables) {
        expect(FINALS, word).toContain(syllable.at(-1))
        if (word !== TEACHING_POINT) expect(syllable, word).toMatch(/บ$/)
      }
    }
    expect(syllablesOf[TEACHING_POINT]).toEqual(['ภาพ'])
    for (const { syllables } of maeKop.spotting.sets.flat()) {
      for (const { text, final } of syllables) {
        expect(FINALS, text).toContain(text[final])
        expect(final, text).toBe(text.length - 1)
      }
    }
  })

  it('no content word uses ำ', () => {
    const content = [
      ...targetWords,
      ...maeKop.wordSelection.choices.map(({ word }) => word),
      ...maeKop.rhyme.map(({ text }) => text),
      ...maeKop.sentences.map(({ audio }) => audio.text),
    ]
    expect(content.filter((text) => text.includes('ำ'))).toEqual([])
  })
})

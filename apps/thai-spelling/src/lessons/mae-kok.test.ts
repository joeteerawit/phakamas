import { describe, expect, it } from 'vitest'
import { splitWords } from '../steps/karaoke'
import { getTheme } from '../themes'
import { audioClips } from './audio-clips'
import { getLesson, parseStepNumber } from './index'
import { maeKok } from './mae-kok'

const picture = (slug: string) => `/assets/comic/word-${slug}.webp`
// Keys look like /public/assets/comic/word-nok.webp.
const files = Object.keys(import.meta.glob('/public/assets/**/*.webp'))

/** มาตราแม่กก: a syllable ends in one of these. */
const FINALS = ['ก', 'ข', 'ค', 'ฆ']

const targetWords = [
  ...new Set([
    ...maeKok.vocabulary.map(({ word }) => word),
    ...maeKok.wordSelection.choices.filter(({ correct }) => correct).map(({ word }) => word),
    ...maeKok.wordFilling.bank,
    ...maeKok.rhymeMatching.words.map(({ text }) => text),
    ...maeKok.rhyme.flatMap(({ rhymeWords }) => rhymeWords),
  ]),
]

// Written text has no syllable breaks, so each Target Word's syllables are spelled out here; a new word needs an
// entry. ไก่ (no final) and แก้ว (ends in ว) would fail, as the spec says.
const syllablesOf: Record<string, string[]> = {
  นก: ['นก'],
  ผัก: ['ผัก'],
  ดอก: ['ดอก'],
  เด็ก: ['เด็ก'],
  ปาก: ['ปาก'],
  แบก: ['แบก'],
  หมวก: ['หมวก'],
  โลก: ['โลก'],
  ตัก: ['ตัก'],
  บอก: ['บอก'],
}

describe('mae-kok lesson data (docs/mae-kok-spec.md)', () => {
  it('has the cover title, subtitle and grade line', () => {
    expect(maeKok.id).toBe('mae-kok')
    expect(maeKok.theme).toBe('mae-kok')
    expect(maeKok.title).toBe('คำแม่กกเที่ยวสวนผักบนดอย')
    expect(maeKok.finalGroup).toBe('แม่กก')
    expect(maeKok.subtitle).toBe('แม่ กก (ก ข ค ฆ)')
    expect(maeKok.gradeLine).toBe('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  })

  it('has the 10 Step titles, in order', () => {
    expect(maeKok.steps.map((step) => step.title)).toEqual([
      'หน้าปก',
      'ดูภาพเรียนรู้คำ',
      'ฟังแล้วอ่านตาม',
      'สังเกตตัวสะกด',
      'แม่กกอยู่ไหน?',
      'กล่องคำแม่กก',
      'อ่านการ์ตูนแม่กก',
      'จับคู่ดูคำ',
      'อ่านออก บอกได้',
      'สรุปและประเมิน',
    ])
  })

  it('can be looked up by id and accepts Step numbers 1–10', () => {
    expect(getLesson('mae-kok')).toBe(maeKok)
    expect(parseStepNumber(maeKok, '1')).toBe(1)
    expect(parseStepNumber(maeKok, '10')).toBe(10)
    expect(parseStepNumber(maeKok, '11')).toBeUndefined()
  })

  it('names the แม่กก Theme, whose Mascot is น้องนก', () => {
    expect(getTheme(maeKok.theme).id).toBe('mae-kok')
    expect(getTheme(maeKok.theme).mascot.name).toBe('น้องนก')
  })

  it('plays the spec intro on the cover', () => {
    expect(maeKok.intro.text).toBe(
      'สวัสดีเด็ก ๆ วันนี้น้องนกจะพาไปเที่ยวสวนผักบนดอย และเรียนรู้คำในมาตราแม่กกกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
    )
  })

  it('Steps 2 and 3 show the 6 Target Words with their picture and audio', () => {
    const expected = [
      ['นก', picture('nok'), 'vocabulary/nok'],
      ['ผัก', picture('phak'), 'vocabulary/phak'],
      ['ดอก', picture('dok'), 'vocabulary/dok'],
      ['เด็ก', picture('dek'), 'vocabulary/dek'],
      ['ปาก', picture('pak'), 'vocabulary/pak'],
      ['แบก', picture('baek'), 'vocabulary/baek'],
    ]
    expect(maeKok.vocabulary.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    expect(maeKok.listenAndRepeat.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    for (const { word, audio } of maeKok.vocabulary) expect(audio.text).toBe(word)
  })

  it('Step 4 spots the final consonant in two sets of three, with the spec spelling lines', () => {
    const { sets } = maeKok.spotting
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
        ['vocabulary/nok', 'น[ก]', 'นอ-โอะ-กอ-นก'],
        ['vocabulary/phak', 'ผั[ก]', 'ผอ-อะ-กอ-ผัก'],
        ['vocabulary/dok', 'ดอ[ก]', 'ดอ-ออ-กอ-ดอก'],
      ],
      [
        ['vocabulary/dek', 'เด็[ก]', 'ดอ-เอะ-กอ-เด็ก'],
        ['vocabulary/pak', 'ปา[ก]', 'ปอ-อา-กอ-ปาก'],
        ['vocabulary/baek', 'แบ[ก]', 'บอ-แอ-กอ-แบก'],
      ],
    ])
    for (const { syllables, audio } of sets.flat()) expect(syllables.map(({ text }) => text).join('')).toBe(audio.text)
    expect(maeKok.spotting.heading).toBe('มาตราแม่กก มี ก ข ค ฆ เป็นตัวสะกด')
    // The narration names the six words and names ข ค ฆ once, as finals that sound like ก.
    const narration = maeKok.spotting.explanation.text
    expect(narration).toContain('นก ผัก ดอก เด็ก ปาก แบก')
    for (const letter of ['ข', 'ค', 'ฆ']) expect(narration.split(` ${letter} `).length - 1, letter).toBe(1)
    expect(narration).toMatch(/ออกเสียงเหมือน ก/)
  })

  it('Step 5 asks แม่กกอยู่ไหน? over the six words, หมวก, โลก and the four distractors', () => {
    const { question, instruction, choices } = maeKok.wordSelection
    expect(question).toBe('แม่กกอยู่ไหน?')
    expect(instruction).toMatch(/ก ข ค ฆ/)
    expect(choices).toHaveLength(12)
    expect(choices.filter(({ correct }) => correct).map(({ word }) => word).toSorted()).toEqual(
      ['นก', 'ผัก', 'ดอก', 'เด็ก', 'ปาก', 'แบก', 'หมวก', 'โลก'].toSorted(),
    )
    expect(choices.filter(({ correct }) => !correct).map(({ word }) => word).toSorted()).toEqual(['ไก่', 'แก้ว', 'กบ', 'ช้าง'].toSorted())
    for (const { word, image, audio } of choices) {
      expect(image).toMatch(/^\/assets\/comic\/word-[a-z-]+\.webp$/)
      expect(audio.text).toBe(word)
    }
    // กบ and ช้าง reuse the แม่กบ and แม่กง cards and clips.
    expect(choices.find(({ word }) => word === 'กบ')).toMatchObject({ image: picture('kop'), audio: { id: 'vocabulary/kop' } })
    expect(choices.find(({ word }) => word === 'ช้าง')).toMatchObject({ image: picture('chang'), audio: { id: 'vocabulary/chang' } })
  })

  it('Step 6 fills the 6 pictures from the bank, no word under its own picture', () => {
    const { bank, pictures, instruction } = maeKok.wordFilling
    expect(instruction).toBe('เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง')
    expect(bank.toSorted()).toEqual(maeKok.vocabulary.map(({ word }) => word).toSorted())
    expect(pictures.map(({ image, answer }) => [image, answer])).toEqual(maeKok.vocabulary.map(({ word, image }) => [image, word]))
    bank.forEach((word, i) => expect(word).not.toBe(pictures[i]!.answer))
  })

  it('Step 7 has the 4 comic lines with their highlighted words marked, each on its own panel', () => {
    expect(maeKok.rhyme.map(({ text, rhymeWords }) => [text, rhymeWords])).toEqual([
      ['น้องนกบินลงแปลงผัก', ['นก', 'ผัก']],
      ['เด็กแบกตะกร้าผัก', ['เด็ก', 'แบก', 'ผัก']],
      ['ดอกสีแดงบานแล้ว', ['ดอก']],
      ['นกอ้าปากร้องเพลง', ['นก', 'ปาก']],
    ])
    expect(maeKok.rhyme.map(({ panel }) => panel)).toEqual([1, 2, 3, 4].map((n) => `/assets/comic/kok-panel-${n}.webp`))
    // The layout highlights whole words as the segmenter splits them, and each highlighted word has its own clip.
    const clips = maeKok.vocabulary.map(({ word }) => word)
    for (const { text, rhymeWords } of maeKok.rhyme) {
      for (const w of rhymeWords) {
        expect(splitWords(text)).toContain(w)
        expect(clips).toContain(w)
      }
    }
  })

  it('Step 8 matches ผัก↔ตัก and ดอก↔บอก, with a word clip for every word', () => {
    expect(maeKok.rhymeMatching.pairs).toEqual([
      { left: 'ผัก', right: 'ตัก' },
      { left: 'ดอก', right: 'บอก' },
    ])
    expect(maeKok.rhymeMatching.words.map(({ id, text }) => [id, text])).toEqual([
      ['vocabulary/phak', 'ผัก'],
      ['vocabulary/dok', 'ดอก'],
      ['vocabulary/bok', 'บอก'],
      ['vocabulary/tak', 'ตัก'],
    ])
  })

  it('Step 9 reads the two spec sentences with their pictures', () => {
    expect(maeKok.sentences.map(({ images, audio }) => [audio.text, images])).toEqual([
      ['เด็กแบกผักกลับบ้าน', [picture('baek'), picture('phak')]],
      ['นกอ้าปากกินหนอน', [picture('nok'), picture('pak')]],
    ])
    // Each sentence holds the words its two pictures show.
    for (const { images, audio } of maeKok.sentences) {
      for (const src of images) {
        const word = maeKok.vocabulary.find(({ image }) => image === src)!.word
        expect(splitWords(audio.text), src).toContain(word)
      }
    }
  })

  it('every syllable of every Target Word is in แม่กก and ends in ก (no Target Word is an exception)', () => {
    expect(targetWords.filter((word) => !Object.hasOwn(syllablesOf, word))).toEqual([])
    for (const word of targetWords) {
      const syllables = syllablesOf[word]!
      expect(syllables.join(''), word).toBe(word)
      for (const syllable of syllables) {
        expect(FINALS, word).toContain(syllable.at(-1))
        expect(syllable, word).toMatch(/ก$/)
      }
    }
    for (const { syllables } of maeKok.spotting.sets.flat()) {
      for (const { text, final } of syllables) {
        expect(FINALS, text).toContain(text[final])
        expect(final, text).toBe(text.length - 1)
      }
    }
  })

  it('no content word uses ำ', () => {
    const content = [
      ...targetWords,
      ...maeKok.wordSelection.choices.map(({ word }) => word),
      ...maeKok.rhyme.map(({ text }) => text),
      ...maeKok.sentences.map(({ audio }) => audio.text),
    ]
    expect(content.filter((text) => text.includes('ำ'))).toEqual([])
  })

  it('finds every แม่กก AudioClip, reusing the shared word and feedback clips', () => {
    expect(audioClips(maeKok).map((clip) => clip.id)).toEqual([
      'explanations/mae-kok-intro',
      'vocabulary/nok',
      'vocabulary/phak',
      'vocabulary/dok',
      'vocabulary/dek',
      'vocabulary/pak',
      'vocabulary/baek',
      'explanations/mae-kok',
      'spelling/nok',
      'spelling/phak',
      'spelling/dok',
      'spelling/dek',
      'spelling/pak',
      'spelling/baek',
      'vocabulary/kai',
      'vocabulary/muak',
      'vocabulary/kaeo',
      'vocabulary/kop',
      'vocabulary/lok',
      'vocabulary/chang',
      'feedback/keng-mak',
      'vocabulary/bok',
      'vocabulary/tak',
      'feedback/correct',
      'rhyme/mae-kok/line-01',
      'rhyme/mae-kok/line-02',
      'rhyme/mae-kok/line-03',
      'rhyme/mae-kok/line-04',
      'sentences/mae-kok/sentence-01',
      'sentences/mae-kok/sentence-02',
    ])
  })

  it('has a file on disk for every picture, panel and Mascot pose', () => {
    const theme = getTheme(maeKok.theme)
    const images = [
      ...maeKok.wordSelection.choices.map(({ image }) => image),
      ...maeKok.rhyme.map(({ panel }) => panel),
      ...Object.values(theme.mascot.poses),
    ]
    expect(images.filter((src) => !files.includes(`/public${src}`))).toEqual([])
  })
})

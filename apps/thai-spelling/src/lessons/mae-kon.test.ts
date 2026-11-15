import { describe, expect, it } from 'vitest'
import { splitWords } from '../steps/karaoke'
import { getTheme } from '../themes'
import { audioClips } from './audio-clips'
import { getLesson, parseStepNumber } from './index'
import { maeKon } from './mae-kon'

const picture = (slug: string) => `/assets/comic/word-${slug}.webp`

/** มาตราแม่กน: a syllable ends in one of these. */
const FINALS = ['น', 'ญ', 'ณ', 'ร', 'ล', 'ฬ']

const targetWords = [
  ...new Set([
    ...maeKon.vocabulary.map(({ word }) => word),
    ...maeKon.wordSelection.choices.filter(({ correct }) => correct).map(({ word }) => word),
    ...maeKon.wordFilling.bank,
    ...maeKon.rhymeMatching.words.map(({ text }) => text),
    ...maeKon.rhyme.flatMap(({ rhymeWords }) => rhymeWords),
  ]),
]

// Written text has no syllable breaks, so each Target Word's syllables are spelled out here; a new word needs an
// entry. ขนุน (['ขะ', 'หนุน']) would fail, as the spec says.
const syllablesOf: Record<string, string[]> = {
  จาน: ['จาน'],
  ช้อน: ['ช้อน'],
  ร้าน: ['ร้าน'],
  กิน: ['กิน'],
  คน: ['คน'],
  บ้าน: ['บ้าน'],
  ฟัน: ['ฟัน'],
  แขน: ['แขน'],
  หวาน: ['หวาน'],
  ร้อน: ['ร้อน'],
}

describe('mae-kon lesson data (docs/mae-kon-spec.md)', () => {
  it('has the cover title, subtitle and grade line', () => {
    expect(maeKon.id).toBe('mae-kon')
    expect(maeKon.theme).toBe('mae-kon')
    expect(maeKon.title).toBe('คำแม่กนล่องเรือชมตลาด')
    expect(maeKon.finalGroup).toBe('แม่กน')
    expect(maeKon.subtitle).toBe('แม่ กน (น ญ ณ ร ล ฬ)')
    expect(maeKon.gradeLine).toBe('วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒')
  })

  it('has the 10 Step titles, in order', () => {
    expect(maeKon.steps.map((step) => step.title)).toEqual([
      'หน้าปก',
      'ดูภาพเรียนรู้คำ',
      'ฟังแล้วอ่านตาม',
      'สังเกตตัวสะกด',
      'แม่กนอยู่ไหน?',
      'กล่องคำแม่กน',
      'อ่านการ์ตูนแม่กน',
      'จับคู่ดูคำ',
      'อ่านออก บอกได้',
      'สรุปและประเมิน',
    ])
  })

  it('can be looked up by id and accepts Step numbers 1–10', () => {
    expect(getLesson('mae-kon')).toBe(maeKon)
    expect(parseStepNumber(maeKon, '1')).toBe(1)
    expect(parseStepNumber(maeKon, '10')).toBe(10)
    expect(parseStepNumber(maeKon, '11')).toBeUndefined()
  })

  it('names the แม่กน Theme, whose Mascot is น้องส้ม', () => {
    expect(getTheme(maeKon.theme).id).toBe('mae-kon')
    expect(getTheme(maeKon.theme).mascot.name).toBe('น้องส้ม')
  })

  it('plays the spec intro on the cover', () => {
    expect(maeKon.intro.text).toBe(
      'สวัสดีเด็ก ๆ วันนี้น้องส้มจะพายเรือพาไปเที่ยวตลาดริมคลอง และเรียนรู้คำในมาตราแม่กนกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
    )
  })

  it('Steps 2 and 3 show the 6 Target Words with their picture and audio', () => {
    const expected = [
      ['จาน', picture('chan'), 'vocabulary/chan'],
      ['ช้อน', picture('chon'), 'vocabulary/chon'],
      ['ร้าน', picture('ran'), 'vocabulary/ran'],
      ['กิน', picture('kin'), 'vocabulary/kin'],
      ['คน', picture('khon'), 'vocabulary/khon'],
      ['บ้าน', picture('ban'), 'vocabulary/ban'],
    ]
    expect(maeKon.vocabulary.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    expect(maeKon.listenAndRepeat.map(({ word, image, audio }) => [word, image, audio.id])).toEqual(expected)
    for (const { word, audio } of maeKon.vocabulary) expect(audio.text).toBe(word)
  })

  it('Step 4 spots the final น in two sets of three, with the spec spelling lines', () => {
    const { sets } = maeKon.spotting
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
        ['vocabulary/chan', 'จา[น]', 'จอ-อา-นอ-จาน'],
        ['vocabulary/chon', 'ช้อ[น]', 'ชอ-ออ-นอ-ชอน-ไม้โท-ช้อน'],
        ['vocabulary/ran', 'ร้า[น]', 'รอ-อา-นอ-ราน-ไม้โท-ร้าน'],
      ],
      [
        ['vocabulary/kin', 'กิ[น]', 'กอ-อิ-นอ-กิน'],
        ['vocabulary/khon', 'ค[น]', 'คอ-โอะ-นอ-คน'],
        ['vocabulary/ban', 'บ้า[น]', 'บอ-อา-นอ-บาน-ไม้โท-บ้าน'],
      ],
    ])
    for (const { syllables, audio } of sets.flat()) expect(syllables.map(({ text }) => text).join('')).toBe(audio.text)
    expect(maeKon.spotting.heading).toBe('มาตราแม่กน มี น ญ ณ ร ล ฬ เป็นตัวสะกด')
    expect(maeKon.spotting.explanation.text).toContain('จาน ช้อน ร้าน กิน คน บ้าน มีตัว น อยู่ท้ายคำ')
    // The narration teaches that the other finals of แม่กน sound like น.
    expect(maeKon.spotting.explanation.text).toMatch(/ญ ณ ร ล หรือ ฬ ก็ออกเสียงเหมือน น/)
  })

  it('Step 5 asks แม่กนอยู่ไหน? over the six words, ฟัน, แขน and the four distractors', () => {
    const { question, instruction, choices } = maeKon.wordSelection
    expect(question).toBe('แม่กนอยู่ไหน?')
    expect(instruction).toMatch(/น ญ ณ ร ล ฬ/)
    expect(choices).toHaveLength(12)
    expect(choices.filter(({ correct }) => correct).map(({ word }) => word).toSorted()).toEqual(
      ['จาน', 'ช้อน', 'ร้าน', 'กิน', 'คน', 'บ้าน', 'ฟัน', 'แขน'].toSorted(),
    )
    expect(choices.filter(({ correct }) => !correct).map(({ word }) => word).toSorted()).toEqual(['นก', 'เรือ', 'นม', 'ชาม'].toSorted())
    for (const { word, image, audio } of choices) {
      expect(image).toMatch(/^\/assets\/comic\/word-[a-z-]+\.webp$/)
      expect(audio.text).toBe(word)
    }
    // บ้าน reuses แม่กง's card and clip; นม and ชาม reuse แม่กม's.
    expect(choices.find(({ word }) => word === 'บ้าน')).toMatchObject({ image: picture('ban'), audio: { id: 'vocabulary/ban' } })
    expect(choices.find(({ word }) => word === 'นม')).toMatchObject({ image: picture('nom'), audio: { id: 'vocabulary/nom' } })
    expect(choices.find(({ word }) => word === 'ชาม')).toMatchObject({ image: picture('cham'), audio: { id: 'vocabulary/cham' } })
  })

  it('Step 6 fills the 6 pictures from the bank in the spec order, no word under its own picture', () => {
    const { bank, pictures, instruction } = maeKon.wordFilling
    expect(instruction).toBe('เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง')
    expect(bank).toEqual(['บ้าน', 'กิน', 'จาน', 'คน', 'ช้อน', 'ร้าน'])
    expect(pictures.map(({ image, answer }) => [image, answer])).toEqual(maeKon.vocabulary.map(({ word, image }) => [image, word]))
    bank.forEach((word, i) => expect(word).not.toBe(pictures[i]!.answer))
  })

  it('Step 7 has the 4 comic lines with their highlighted words and a panel each', () => {
    expect(maeKon.rhyme.map(({ text, rhymeWords }) => [text, rhymeWords])).toEqual([
      ['น้องส้มพายเรือไปตลาด พบร้านขายของ', ['ร้าน']],
      ['แม่ค้าขายจานและช้อน', ['จาน', 'ช้อน']],
      ['คนขายขนมยิ้มหวาน', ['คน', 'หวาน']],
      ['กลับบ้านกินข้าวกับแม่', ['บ้าน', 'กิน']],
    ])
    expect(maeKon.rhyme.map(({ panel }) => panel)).toEqual([1, 2, 3, 4].map((n) => `/assets/comic/kon-panel-${n}.webp`))
    // The layout highlights whole words as the segmenter splits them.
    for (const { text, rhymeWords } of maeKon.rhyme) for (const w of rhymeWords) expect(splitWords(text)).toContain(w)
  })

  it('Step 8 matches จาน↔หวาน and ช้อน↔ร้อน, with a word clip for every boat', () => {
    expect(maeKon.rhymeMatching.pairs).toEqual([
      { left: 'จาน', right: 'หวาน' },
      { left: 'ช้อน', right: 'ร้อน' },
    ])
    expect(maeKon.rhymeMatching.words.map(({ id, text }) => [id, text])).toEqual([
      ['vocabulary/chan', 'จาน'],
      ['vocabulary/chon', 'ช้อน'],
      ['vocabulary/ron', 'ร้อน'],
      ['vocabulary/wan', 'หวาน'],
    ])
  })

  it('Step 9 reads the two spec sentences with their pictures', () => {
    expect(maeKon.sentences.map(({ images, audio }) => [audio.text, images])).toEqual([
      ['แม่วางช้อนบนจาน', [picture('chon'), picture('chan')]],
      ['คนขายยืนยิ้มหน้าร้าน', [picture('khon'), picture('ran')]],
    ])
    // Each sentence holds the words its two pictures show.
    for (const { images, audio } of maeKon.sentences) {
      for (const src of images) {
        const word = [...maeKon.vocabulary, ...maeKon.wordSelection.choices].find(({ image }) => image === src)!.word
        expect(splitWords(audio.text), src).toContain(word)
      }
    }
  })

  it('every syllable of every Target Word is in แม่กน, ending in น', () => {
    expect(targetWords.filter((word) => !Object.hasOwn(syllablesOf, word))).toEqual([])
    for (const word of targetWords) {
      const syllables = syllablesOf[word]!
      expect(syllables.join(''), word).toBe(word)
      for (const syllable of syllables) {
        expect(FINALS, word).toContain(syllable.at(-1))
        expect(syllable, word).toMatch(/น$/)
      }
    }
    for (const { syllables } of maeKon.spotting.sets.flat()) {
      for (const { text, final } of syllables) {
        expect(text[final], text).toBe('น')
        expect(final, text).toBe(text.length - 1)
      }
    }
  })

  it('no content word uses ำ', () => {
    const content = [
      ...targetWords,
      ...maeKon.wordSelection.choices.map(({ word }) => word),
      ...maeKon.rhyme.map(({ text }) => text),
      ...maeKon.sentences.map(({ audio }) => audio.text),
    ]
    expect(content.filter((text) => text.includes('ำ'))).toEqual([])
  })

  it('finds every แม่กน AudioClip, reusing the shared word and feedback clips', () => {
    expect(audioClips(maeKon).map((clip) => clip.id)).toEqual([
      'explanations/mae-kon-intro',
      'vocabulary/chan',
      'vocabulary/chon',
      'vocabulary/ran',
      'vocabulary/kin',
      'vocabulary/khon',
      'vocabulary/ban',
      'explanations/mae-kon',
      'spelling/chan',
      'spelling/chon',
      'spelling/ran',
      'spelling/kin',
      'spelling/khon',
      'spelling/ban',
      'vocabulary/nok',
      'vocabulary/fan',
      'vocabulary/nom',
      'vocabulary/ruea',
      'vocabulary/khaen',
      'vocabulary/cham',
      'feedback/keng-mak',
      'vocabulary/ron',
      'vocabulary/wan',
      'feedback/correct',
      'rhyme/mae-kon/line-01',
      'rhyme/mae-kon/line-02',
      'rhyme/mae-kon/line-03',
      'rhyme/mae-kon/line-04',
      'sentences/mae-kon/sentence-01',
      'sentences/mae-kon/sentence-02',
    ])
  })
})

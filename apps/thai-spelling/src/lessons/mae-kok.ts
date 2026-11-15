import type { Lesson, SpottingWord, VocabularyWord, WordSelectionActivity } from './types.ts'

// Comic picture cards (docs/comic-art.md); the new ones are placeholders until the art ticket (#83) lands.
const image = (slug: string) => `/assets/comic/word-${slug}.webp`

const word = (text: string, slug: string): VocabularyWord => ({
  word: text,
  image: image(slug),
  audio: { id: `vocabulary/${slug}`, text },
})

const nok = word('นก', 'nok')
const phak = word('ผัก', 'phak')
const dok = word('ดอก', 'dok')
const dek = word('เด็ก', 'dek')
const pak = word('ปาก', 'pak')
const baek = word('แบก', 'baek')

// One-syllable words: `final` is the index of the ก; the spelling line is copied from the spec.
const spot = ({ audio }: VocabularyWord, final: number, spelling: string): SpottingWord => ({
  syllables: [{ text: audio.text, final }],
  spelling: spelling.split('-'),
  audio,
  spellingAudio: { id: audio.id.replace('vocabulary/', 'spelling/'), text: spelling.replaceAll('-', ' ') },
})

// Two rows of six, Target Words and distractors mixed. ไก่ and แก้ว start with ก but do not end in แม่กก; กบ is
// แม่กบ and ช้าง แม่กง. กบ and ช้าง reuse their cards and clips.
const wordSelection = {
  question: 'แม่กกอยู่ไหน?',
  instruction: 'แตะภาพคำที่มี ก ข ค ฆ เป็นตัวสะกด',
  choices: [
    { ...word('ไก่', 'kai'), correct: false },
    { ...nok, correct: true },
    { ...word('หมวก', 'muak'), correct: true },
    { ...phak, correct: true },
    { ...word('แก้ว', 'kaeo'), correct: false },
    { ...dok, correct: true },
    { ...dek, correct: true },
    { ...word('กบ', 'kop'), correct: false },
    { ...word('โลก', 'lok'), correct: true },
    { ...pak, correct: true },
    { ...word('ช้าง', 'chang'), correct: false },
    { ...baek, correct: true },
  ],
  praise: { id: 'feedback/keng-mak', text: 'เก่งมาก!' },
} satisfies WordSelectionActivity

/** แม่กก (ก ข ค ฆ). Content follows docs/mae-kok-spec.md. */
export const maeKok = {
  id: 'mae-kok',
  theme: 'mae-kok',
  title: 'คำแม่กกเที่ยวสวนผักบนดอย',
  finalGroup: 'แม่กก',
  subtitle: 'แม่ กก (ก ข ค ฆ)',
  gradeLine: 'วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒',
  steps: [
    { title: 'หน้าปก' },
    { title: 'ดูภาพเรียนรู้คำ' },
    { title: 'ฟังแล้วอ่านตาม' },
    { title: 'สังเกตตัวสะกด' },
    { title: 'แม่กกอยู่ไหน?' },
    { title: 'กล่องคำแม่กก' },
    { title: 'อ่านการ์ตูนแม่กก' },
    { title: 'จับคู่ดูคำ' },
    { title: 'อ่านออก บอกได้' },
    { title: 'สรุปและประเมิน' },
  ],
  // Lesson narration is named after the Lesson; word, spelling and feedback clips are shared by id.
  intro: {
    id: 'explanations/mae-kok-intro',
    text: 'สวัสดีเด็ก ๆ วันนี้น้องนกจะพาไปเที่ยวสวนผักบนดอย และเรียนรู้คำในมาตราแม่กกกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
  },
  vocabulary: [nok, phak, dok, dek, pak, baek],
  listenAndRepeat: [nok, phak, dok, dek, pak, baek],
  spotting: {
    heading: 'มาตราแม่กก มี ก ข ค ฆ เป็นตัวสะกด',
    // The teaching point: ข ค ฆ at the end of a word sound like ก, named once.
    explanation: {
      id: 'explanations/mae-kok',
      text: 'เด็ก ๆ ลองสังเกตนะ คำว่า นก ผัก ดอก เด็ก ปาก แบก มีตัว ก อยู่ท้ายคำ เราเรียกว่าตัวสะกด ถ้าท้ายคำเป็นตัว ข ค หรือ ฆ ก็ออกเสียงเหมือน ก คำเหล่านี้อยู่ในมาตราแม่กกจ้ะ',
    },
    sets: [
      [spot(nok, 1, 'นอ-โอะ-กอ-นก'), spot(phak, 2, 'ผอ-อะ-กอ-ผัก'), spot(dok, 2, 'ดอ-ออ-กอ-ดอก')],
      [spot(dek, 3, 'ดอ-เอะ-กอ-เด็ก'), spot(pak, 2, 'ปอ-อา-กอ-ปาก'), spot(baek, 2, 'บอ-แอ-กอ-แบก')],
    ],
  },
  wordSelection,
  // No bank word sits under its own picture, so the order gives nothing away.
  wordFilling: {
    instruction: 'เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง',
    bank: ['ปาก', 'แบก', 'นก', 'ผัก', 'เด็ก', 'ดอก'],
    pictures: [nok, phak, dok, dek, pak, baek].map(({ word, image }) => ({ image, answer: word })),
  },
  rhymeMatching: {
    // Each pair sits on a diagonal of the fallback buzzer grid (TL, TR, BL, BR), as on แม่กง.
    pairs: [
      { left: 'ผัก', right: 'ตัก' },
      { left: 'ดอก', right: 'บอก' },
    ],
    words: [phak.audio, dok.audio, { id: 'vocabulary/bok', text: 'บอก' }, { id: 'vocabulary/tak', text: 'ตัก' }],
    sounds: {
      correct: { id: 'feedback/correct', text: 'ถูกต้อง' },
    },
  },
  // One comic panel per line; the panels are placeholders until the art ticket (#83) lands.
  rhyme: [
    { id: 'rhyme/mae-kok/line-01', text: 'น้องนกบินลงแปลงผัก', rhymeWords: ['นก', 'ผัก'], panel: '/assets/comic/kok-panel-1.webp' },
    { id: 'rhyme/mae-kok/line-02', text: 'เด็กแบกตะกร้าผัก', rhymeWords: ['เด็ก', 'แบก', 'ผัก'], panel: '/assets/comic/kok-panel-2.webp' },
    { id: 'rhyme/mae-kok/line-03', text: 'ดอกสีแดงบานแล้ว', rhymeWords: ['ดอก'], panel: '/assets/comic/kok-panel-3.webp' },
    { id: 'rhyme/mae-kok/line-04', text: 'นกอ้าปากร้องเพลง', rhymeWords: ['นก', 'ปาก'], panel: '/assets/comic/kok-panel-4.webp' },
  ],
  sentences: [
    { images: [image('baek'), image('phak')], audio: { id: 'sentences/mae-kok/sentence-01', text: 'เด็กแบกผักกลับบ้าน' } },
    { images: [image('nok'), image('pak')], audio: { id: 'sentences/mae-kok/sentence-02', text: 'นกอ้าปากกินหนอน' } },
  ],
} as const satisfies Lesson

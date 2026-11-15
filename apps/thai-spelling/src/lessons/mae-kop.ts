import type { Lesson, SpottingWord, VocabularyWord, WordSelectionActivity } from './types.ts'

// Comic picture cards (docs/comic-art.md); the new ones are stand-ins until the art ticket (#69) lands.
const image = (slug: string) => `/assets/comic/word-${slug}.webp`

const word = (text: string, slug: string): VocabularyWord => ({
  word: text,
  image: image(slug),
  audio: { id: `vocabulary/${slug}`, text },
})

// พับ and ภาพ are both "phap"; the fold gets its own slug.
const kop = word('กบ', 'kop')
const phapFold = word('พับ', 'phap-fold')
const chap = word('จับ', 'chap')
const phap = word('ภาพ', 'phap')
const chep = word('เจ็บ', 'chep')
const ap = word('อาบ', 'ap')

// One-syllable words: `final` is the index of the final consonant; the spelling line is copied from the spec.
const spot = ({ audio }: VocabularyWord, final: number, spelling: string): SpottingWord => ({
  syllables: [{ text: audio.text, final }],
  spelling: spelling.split('-'),
  audio,
  spellingAudio: { id: audio.id.replace('vocabulary/', 'spelling/'), text: spelling.replaceAll('-', ' ') },
})

// Two lines of six, Target Words and distractors mixed. ใบไม้, ปู and บ้าน start with บ or ป but do not end in
// แม่กบ; ร่ม is แม่กม. บ้าน and ร่ม reuse their cards and clips.
const wordSelection = {
  question: 'แม่กบอยู่ไหน?',
  instruction: 'แตะภาพคำที่มี บ ป พ ฟ ภ เป็นตัวสะกด',
  choices: [
    { ...word('ใบไม้', 'bai-mai'), correct: false },
    { ...kop, correct: true },
    { ...word('จูบ', 'chup'), correct: true },
    { ...phapFold, correct: true },
    { ...word('ปู', 'pu'), correct: false },
    { ...chap, correct: true },
    { ...phap, correct: true },
    { ...word('ร่ม', 'rom'), correct: false },
    { ...word('ดาบ', 'dap'), correct: true },
    { ...chep, correct: true },
    { ...word('บ้าน', 'ban'), correct: false },
    { ...ap, correct: true },
  ],
  praise: { id: 'feedback/keng-mak', text: 'เก่งมาก!' },
} satisfies WordSelectionActivity

/** แม่กบ (บ ป พ ฟ ภ). Content follows docs/mae-kop-spec.md. */
export const maeKop = {
  id: 'mae-kop',
  theme: 'mae-kop',
  title: 'คำแม่กบหลบฝน',
  finalGroup: 'แม่กบ',
  subtitle: 'แม่ กบ (บ ป พ ฟ ภ)',
  gradeLine: 'วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒',
  steps: [
    { title: 'หน้าปก' },
    { title: 'ดูภาพเรียนรู้คำ' },
    { title: 'ฟังแล้วอ่านตาม' },
    { title: 'สังเกตตัวสะกด' },
    { title: 'แม่กบอยู่ไหน?' },
    { title: 'กล่องคำแม่กบ' },
    { title: 'อ่านการ์ตูนแม่กบ' },
    { title: 'จับคู่ดูคำ' },
    { title: 'อ่านออก บอกได้' },
    { title: 'สรุปและประเมิน' },
  ],
  // Lesson narration is named after the Lesson; word, spelling and feedback clips are shared by id.
  intro: {
    id: 'explanations/mae-kop-intro',
    text: 'สวัสดีเด็ก ๆ วันนี้ฝนตก น้องกบจะพาไปเที่ยวบึงบัว และเรียนรู้คำในมาตราแม่กบกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
  },
  vocabulary: [kop, phapFold, chap, phap, chep, ap],
  listenAndRepeat: [kop, phapFold, chap, phap, chep, ap],
  spotting: {
    heading: 'มาตราแม่กบ มี บ ป พ ฟ ภ เป็นตัวสะกด',
    // The teaching point: ภาพ ends in พ, which sounds like บ.
    explanation: {
      id: 'explanations/mae-kop',
      text: 'เด็ก ๆ ลองสังเกตนะ คำว่า กบ พับ จับ เจ็บ อาบ มีตัว บ อยู่ท้ายคำ เราเรียกว่าตัวสะกด ส่วนคำว่า ภาพ มีตัว พ เป็นตัวสะกด แต่ออกเสียงเหมือน บ คำเหล่านี้อยู่ในมาตราแม่กบจ้ะ',
    },
    sets: [
      [spot(kop, 1, 'กอ-โอะ-บอ-กบ'), spot(phapFold, 2, 'พอ-อะ-บอ-พับ'), spot(chap, 2, 'จอ-อะ-บอ-จับ')],
      [spot(phap, 2, 'ภอ-อา-พอ-ภาพ'), spot(chep, 3, 'จอ-เอะ-บอ-เจ็บ'), spot(ap, 2, 'ออ-อา-บอ-อาบ')],
    ],
  },
  wordSelection,
  // No bank word sits under its own picture, so the order gives nothing away.
  wordFilling: {
    instruction: 'เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง',
    bank: ['ภาพ', 'อาบ', 'กบ', 'เจ็บ', 'จับ', 'พับ'],
    pictures: [kop, phapFold, chap, phap, chep, ap].map(({ word, image }) => ({ image, answer: word })),
  },
  rhymeMatching: {
    // Each pair sits on a diagonal of the fallback buzzer grid (TL, TR, BL, BR), as on แม่กง.
    pairs: [
      { left: 'กบ', right: 'จบ' },
      { left: 'จับ', right: 'รับ' },
    ],
    words: [kop.audio, chap.audio, { id: 'vocabulary/rap', text: 'รับ' }, { id: 'vocabulary/chop', text: 'จบ' }],
    sounds: {
      correct: { id: 'feedback/correct', text: 'ถูกต้อง' },
    },
  },
  // One comic panel per line; the Step 7 Game draws its panels until the art ticket (#69) lands.
  rhyme: [
    { id: 'rhyme/mae-kop/line-01', text: 'ฝนตกแล้ว กบออกมาอาบฝน', rhymeWords: ['กบ', 'อาบ'] },
    { id: 'rhyme/mae-kop/line-02', text: 'กบพับเรือกระดาษ ปล่อยลอยไป', rhymeWords: ['กบ', 'พับ'] },
    { id: 'rhyme/mae-kop/line-03', text: 'วิ่งไปจับเรือ ลื่นล้มเจ็บเข่า', rhymeWords: ['จับ', 'เจ็บ'] },
    { id: 'rhyme/mae-kop/line-04', text: 'ฝนหยุด กบวาดภาพเรือกับสายรุ้ง', rhymeWords: ['กบ', 'ภาพ'] },
  ],
  sentences: [
    { images: [image('chep'), image('chup')], audio: { id: 'sentences/mae-kop/sentence-01', text: 'กบเจ็บ แม่จูบให้หาย' } },
    { images: [image('phap-fold'), image('phap')], audio: { id: 'sentences/mae-kop/sentence-02', text: 'พี่พับภาพเป็นเรือ' } },
  ],
} as const satisfies Lesson

import type { Lesson, SpottingWord, VocabularyWord, WordSelectionActivity } from './types.ts'

// Comic picture cards (docs/comic-art.md); the new ones are labelled placeholders until the art ticket (#97) lands.
const image = (slug: string) => `/assets/comic/word-${slug}.webp`

const word = (text: string, slug: string): VocabularyWord => ({
  word: text,
  image: image(slug),
  audio: { id: `vocabulary/${slug}`, text },
})

const chan = word('จาน', 'chan')
const chon = word('ช้อน', 'chon')
const ran = word('ร้าน', 'ran')
const kin = word('กิน', 'kin')
const khon = word('คน', 'khon')
// บ้าน reuses แม่กง's card and clip.
const ban = word('บ้าน', 'ban')

// One-syllable words: `final` is the index of the น; the spelling line is copied from the spec.
const spot = ({ audio }: VocabularyWord, final: number, spelling: string): SpottingWord => ({
  syllables: [{ text: audio.text, final }],
  spelling: spelling.split('-'),
  audio,
  spellingAudio: { id: audio.id.replace('vocabulary/', 'spelling/'), text: spelling.replaceAll('-', ' ') },
})

// Two boats of six, Target Words and distractors mixed. นก starts with น and เรือ with ร but neither ends in แม่กน;
// นม and ชาม are แม่กม and reuse its cards and clips.
const wordSelection = {
  question: 'แม่กนอยู่ไหน?',
  instruction: 'แตะภาพคำที่มี น ญ ณ ร ล ฬ เป็นตัวสะกด',
  choices: [
    { ...word('นก', 'nok'), correct: false },
    { ...chan, correct: true },
    { ...word('ฟัน', 'fan'), correct: true },
    { ...kin, correct: true },
    { ...word('นม', 'nom'), correct: false },
    { ...ran, correct: true },
    { ...khon, correct: true },
    { ...word('เรือ', 'ruea'), correct: false },
    { ...word('แขน', 'khaen'), correct: true },
    { ...chon, correct: true },
    { ...word('ชาม', 'cham'), correct: false },
    { ...ban, correct: true },
  ],
  praise: { id: 'feedback/keng-mak', text: 'เก่งมาก!' },
} satisfies WordSelectionActivity

// Step 7's comic panels are labelled placeholders until the art ticket (#97) lands.
const panel = (n: number) => `/assets/comic/kon-panel-${n}.webp`

/** แม่กน (น ญ ณ ร ล ฬ). Content follows docs/mae-kon-spec.md. */
export const maeKon = {
  id: 'mae-kon',
  theme: 'mae-kon',
  title: 'คำแม่กนล่องเรือชมตลาด',
  finalGroup: 'แม่กน',
  subtitle: 'แม่ กน (น ญ ณ ร ล ฬ)',
  gradeLine: 'วิชาภาษาไทย ชั้นประถมศึกษาปีที่ ๒',
  steps: [
    { title: 'หน้าปก' },
    { title: 'ดูภาพเรียนรู้คำ' },
    { title: 'ฟังแล้วอ่านตาม' },
    { title: 'สังเกตตัวสะกด' },
    { title: 'แม่กนอยู่ไหน?' },
    { title: 'กล่องคำแม่กน' },
    { title: 'อ่านการ์ตูนแม่กน' },
    { title: 'จับคู่ดูคำ' },
    { title: 'อ่านออก บอกได้' },
    { title: 'สรุปและประเมิน' },
  ],
  // Lesson narration is named after the Lesson; word, spelling and feedback clips are shared by id.
  intro: {
    id: 'explanations/mae-kon-intro',
    text: 'สวัสดีเด็ก ๆ วันนี้น้องส้มจะพายเรือพาไปเที่ยวตลาดริมคลอง และเรียนรู้คำในมาตราแม่กนกัน พร้อมแล้วกดเริ่มเรียนได้เลย',
  },
  vocabulary: [chan, chon, ran, kin, khon, ban],
  listenAndRepeat: [chan, chon, ran, kin, khon, ban],
  spotting: {
    heading: 'มาตราแม่กน มี น ญ ณ ร ล ฬ เป็นตัวสะกด',
    explanation: {
      id: 'explanations/mae-kon',
      text: 'เด็ก ๆ ลองสังเกตนะ คำว่า จาน ช้อน ร้าน กิน คน บ้าน มีตัว น อยู่ท้ายคำ เราเรียกว่าตัวสะกด คำที่มี น เป็นตัวสะกด อยู่ในมาตราแม่กนจ้ะ ถ้าตัวสะกดเป็น ญ ณ ร ล หรือ ฬ ก็ออกเสียงเหมือน น และอยู่ในมาตราแม่กนเหมือนกัน',
    },
    sets: [
      [spot(chan, 2, 'จอ-อา-นอ-จาน'), spot(chon, 3, 'ชอ-ออ-นอ-ชอน-ไม้โท-ช้อน'), spot(ran, 3, 'รอ-อา-นอ-ราน-ไม้โท-ร้าน')],
      [spot(kin, 2, 'กอ-อิ-นอ-กิน'), spot(khon, 1, 'คอ-โอะ-นอ-คน'), spot(ban, 3, 'บอ-อา-นอ-บาน-ไม้โท-บ้าน')],
    ],
  },
  wordSelection,
  // No bank word sits under its own picture, so the order gives nothing away.
  wordFilling: {
    instruction: 'เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง',
    bank: ['บ้าน', 'กิน', 'จาน', 'คน', 'ช้อน', 'ร้าน'],
    pictures: [chan, chon, ran, kin, khon, ban].map(({ word, image }) => ({ image, answer: word })),
  },
  rhymeMatching: {
    // Each pair sits on a diagonal of the fallback buzzer grid (TL, TR, BL, BR), as on แม่กง.
    pairs: [
      { left: 'จาน', right: 'หวาน' },
      { left: 'ช้อน', right: 'ร้อน' },
    ],
    words: [chan.audio, chon.audio, { id: 'vocabulary/ron', text: 'ร้อน' }, { id: 'vocabulary/wan', text: 'หวาน' }],
    sounds: {
      correct: { id: 'feedback/correct', text: 'ถูกต้อง' },
    },
  },
  // One comic panel per line.
  rhyme: [
    { id: 'rhyme/mae-kon/line-01', text: 'น้องส้มพายเรือไปตลาด พบร้านขายของ', rhymeWords: ['ร้าน'], panel: panel(1) },
    { id: 'rhyme/mae-kon/line-02', text: 'แม่ค้าขายจานและช้อน', rhymeWords: ['จาน', 'ช้อน'], panel: panel(2) },
    { id: 'rhyme/mae-kon/line-03', text: 'คนขายขนมยิ้มหวาน', rhymeWords: ['คน', 'หวาน'], panel: panel(3) },
    { id: 'rhyme/mae-kon/line-04', text: 'กลับบ้านกินข้าวกับแม่', rhymeWords: ['บ้าน', 'กิน'], panel: panel(4) },
  ],
  sentences: [
    { images: [image('chon'), image('chan')], audio: { id: 'sentences/mae-kon/sentence-01', text: 'แม่วางช้อนบนจาน' } },
    { images: [image('khon'), image('ran')], audio: { id: 'sentences/mae-kon/sentence-02', text: 'คนขายยืนยิ้มหน้าร้าน' } },
  ],
} as const satisfies Lesson

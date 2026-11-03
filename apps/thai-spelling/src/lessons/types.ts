/** One ordered stage of a Lesson. Its Step number is its 1-based position. */
export type LessonStep = {
  title: string
}

/**
 * A sound the AudioManager plays from `/assets/audio/<id>.mp3`;
 * if that fails, Web Speech (th-TH) reads `text` aloud instead.
 */
export type AudioClip = {
  id: string
  text: string
}

/** A picture card on the vocabulary Step. */
export type VocabularyWord = {
  word: string
  /** Comic picture card, /assets/comic/word-<slug>.webp. */
  image: string
  audio: AudioClip
}

/** One syllable of a spotting word; `final` is the index of its final consonant in `text`. */
export type Syllable = {
  text: string
  final: number
}

/** A word on the final-consonant Step. Positions are explicit, never found by searching. */
export type SpottingWord = {
  syllables: readonly Syllable[]
  /** Spelling read aloud part by part, e.g. ลอ, อิ, งอ, ลิง. */
  spelling: readonly string[]
  audio: AudioClip
  /** The spelling read slowly, one equal-length slot per part (see scripts/gen-audio.sh). */
  spellingAudio: AudioClip
}

/** The final-consonant spotting Step: heading, explanation narration and marked words. */
export type Spotting = {
  heading: string
  explanation: AudioClip
  /** Words shown a set at a time, in order. */
  sets: readonly (readonly SpottingWord[])[]
}

/** The word-filling Activity: drag or tap bank words into the blank under each picture. */
export type WordFilling = {
  instruction: string
  /** Word Bank, in display order. */
  bank: readonly string[]
  /** Pictures in display order; `answer` is the bank word that belongs in its blank. */
  pictures: readonly { image: string; answer: string }[]
}

/** A picture card on the word-selection Step; `correct` = it belongs to this มาตรา. */
export type WordChoice = VocabularyWord & {
  correct: boolean
}

/** Step 5: pick the words of this มาตรา among distractors. */
export type WordSelectionActivity = {
  question: string
  instruction: string
  choices: readonly WordChoice[]
  /** Played when every Decision is right. */
  praise: AudioClip
}

/** The rhyme-matching Activity: link each left word to the word it rhymes with. */
export type RhymeMatching = {
  pairs: readonly { left: string; right: string }[]
  /** One buzzer per word, in design reading order (top-left, top-right, bottom-left, bottom-right). */
  words: readonly AudioClip[]
  /** Played when a pair locks; matching every pair plays the shared เก่งมาก! praise. */
  sounds: { correct: AudioClip }
}

/** A line of the Step 7 rhyme; `rhymeWords` are the words in it the UI highlights. */
export type RhymeLine = AudioClip & {
  rhymeWords: readonly string[]
}

/** A sentence on Step 9, illustrated by several pictures side by side. */
export type Sentence = {
  /** Comic picture cards, /assets/comic/word-<slug>.webp (บ่าง is still a Canva picture). */
  images: readonly string[]
  /** `text` is the sentence shown on its card. */
  audio: AudioClip
}

/** A complete Lesson for one final-consonant group (มาตราตัวสะกด). */
export type Lesson = {
  id: string
  title: string
  subtitle: string
  /** Subject and grade line on the cover. */
  gradeLine: string
  steps: readonly LessonStep[]
  /** Teacher introduction played on the cover Step. */
  intro: AudioClip
  vocabulary: readonly VocabularyWord[]
  wordFilling: WordFilling
  /** Step 3 ฟังแล้วอ่านตาม: words practised one at a time, in order. */
  listenAndRepeat: readonly VocabularyWord[]
  spotting: Spotting
  wordSelection: WordSelectionActivity
  rhymeMatching: RhymeMatching
  /** The rhyme read on Step 7, one clip per line, in reading order. */
  rhyme: readonly RhymeLine[]
  /** Step 9 ฝึกอ่านประโยค, in display order. */
  sentences: readonly Sentence[]
}

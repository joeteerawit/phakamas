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
  /** Fluent Emoji 3D picture under /assets/images/vocabulary/. */
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
  audio: AudioClip
}

/** The final-consonant spotting Step: heading, explanation narration and marked words. */
export type Spotting = {
  heading: string
  explanation: AudioClip
  words: readonly SpottingWord[]
}

/** The word-filling Activity: drag or tap bank words into the blank under each picture. */
export type WordFilling = {
  /** Word Bank, in display order. */
  bank: readonly string[]
  /** Pictures in display order; `answer` is the bank word that belongs in its blank. */
  pictures: readonly { image: string; answer: string }[]
}

/** A word on the word-selection Step; `correct` = it belongs to this มาตรา. */
export type WordChoice = {
  word: string
  correct: boolean
}

/** Step 5: pick the words of this มาตรา among distractors. */
export type WordSelectionActivity = {
  question: string
  choices: readonly WordChoice[]
  /** Played when every Decision is right. */
  praise: AudioClip
}

/** The rhyme-matching Activity: link each left word to the word it rhymes with. */
export type RhymeMatching = {
  pairs: readonly { left: string; right: string }[]
  /** Played when a pair locks, and when every pair is matched. */
  sounds: { correct: AudioClip; completed: AudioClip }
}

/** A complete course for one final-consonant group (มาตราตัวสะกด). */
export type Lesson = {
  id: string
  title: string
  subtitle: string
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
  rhyme: readonly AudioClip[]
}

/** One ordered stage of a Lesson. Its Step number is its 1-based position. */
export type LessonStep = {
  title: string
  /** The scored Activity on this Step; leaving with ถัดไป unchecked records it as skipped. */
  activity?: { id: string; maxScore: number }
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

/** A complete course for one final-consonant group (มาตราตัวสะกด). */
export type Lesson = {
  id: string
  title: string
  subtitle: string
  steps: readonly LessonStep[]
  /** Teacher introduction played on the cover Step. */
  intro: AudioClip
  vocabulary: readonly VocabularyWord[]
  wordSelection: WordSelectionActivity
}

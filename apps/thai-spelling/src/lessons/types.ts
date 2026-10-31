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

/** A complete course for one final-consonant group (มาตราตัวสะกด). */
export type Lesson = {
  id: string
  title: string
  subtitle: string
  steps: readonly LessonStep[]
  /** Teacher introduction played on the cover Step. */
  intro: AudioClip
  vocabulary: readonly VocabularyWord[]
  /** Step 3 ฟังแล้วอ่านตาม: words practised one at a time, in order. */
  listenAndRepeat: readonly VocabularyWord[]
  spotting: Spotting
}

/** One ordered stage of a Lesson. Its Step number is its 1-based position. */
export type LessonStep = {
  title: string
}

/** A complete course for one final-consonant group (มาตราตัวสะกด). */
export type Lesson = {
  id: string
  title: string
  subtitle: string
  steps: readonly LessonStep[]
}

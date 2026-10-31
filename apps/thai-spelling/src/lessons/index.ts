import { maeKong } from './mae-kong'
import type { Lesson } from './types'

export type { AudioClip, Lesson, LessonStep, RhymeMatching, SpottingWord, VocabularyWord, WordFilling } from './types'

const lessons: Readonly<Record<string, Lesson>> = {
  [maeKong.id]: maeKong,
}

/** Where `/` and invalid lesson URLs land until there is a second Lesson. */
export const DEFAULT_LESSON_ID = maeKong.id

export function getLesson(lessonId: string): Lesson | undefined {
  return Object.hasOwn(lessons, lessonId) ? lessons[lessonId] : undefined
}

/**
 * Parses a `$step` URL param into a 1-based Step number for `lesson`.
 * Returns undefined unless it is a canonical integer (no sign, decimals or
 * leading zeros) within the Lesson's Steps.
 */
export function parseStepNumber(lesson: Lesson, raw: string): number | undefined {
  if (!/^[1-9]\d*$/.test(raw)) return undefined
  const step = Number(raw)
  return step >= 1 && step <= lesson.steps.length ? step : undefined
}

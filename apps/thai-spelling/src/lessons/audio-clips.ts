import type { AudioClip, Lesson } from './types.ts'

/**
 * Every AudioClip anywhere in `lesson`, in data order, de-duplicated by id.
 * Walks the data generically so clips added by later Steps are picked up
 * by scripts/gen-audio.py without touching this file.
 */
export function audioClips(lesson: Lesson): AudioClip[] {
  const clips = new Map<string, AudioClip>()
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (typeof value !== 'object' || value === null) return
    const { id, text } = value as Partial<AudioClip>
    if (typeof id === 'string' && typeof text === 'string') {
      if (!clips.has(id)) clips.set(id, { id, text })
      return
    }
    Object.values(value).forEach(visit)
  }
  visit(lesson)
  return [...clips.values()]
}

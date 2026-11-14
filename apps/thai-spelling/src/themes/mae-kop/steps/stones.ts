import type { SpottingWord } from '../../../lessons'

const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })

/** One stepping stone: the letters on it, and whether it holds the word's final consonant. */
export type Stone = { text: string; final: boolean }

/**
 * A word laid on stepping stones, one letter per stone (docs/mae-kop-spec.md Step 4): a vowel or tone mark rides with
 * the consonant it sits on, so เจ็บ is เ · จ็ · บ and ภาพ is ภ · า · พ. The final consonant's stone comes from the
 * word's explicit `final` position, never from searching for a letter; a longer word has one final per syllable.
 */
export function stonesOf(word: SpottingWord): Stone[] {
  return word.syllables.flatMap(({ text, final }) =>
    [...graphemes.segment(text)].map(({ segment, index }) => ({ text: segment, final: final >= index && final < index + segment.length })),
  )
}

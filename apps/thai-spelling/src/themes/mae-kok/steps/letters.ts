import type { SpottingWord } from '../../../lessons'

const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })

/** One letter slot in the raised bed: the letters in it, and whether it holds the word's final consonant. */
export type Letter = { text: string; final: boolean }

/**
 * A word written in the soil one letter per slot (แม่กก Step 4): a vowel or tone mark stays with the consonant it sits
 * on, so เด็ก is เ · ด็ · ก and ผัก is ผั · ก. The final consonant's slot comes from the word's explicit `final`
 * position, never from searching for a letter; a longer word has one final per syllable.
 */
export function lettersOf(word: SpottingWord): Letter[] {
  return word.syllables.flatMap(({ text, final }) =>
    [...graphemes.segment(text)].map(({ segment, index }) => ({ text: segment, final: final >= index && final < index + segment.length })),
  )
}

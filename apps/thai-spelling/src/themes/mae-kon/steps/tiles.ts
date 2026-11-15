import type { SpottingWord } from '../../../lessons'

const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })

/** One wooden tile: the letters on it, and whether it holds the word's final consonant. */
export type Tile = { text: string; final: boolean }

/**
 * A word spelled on wooden tiles, one letter per tile (docs/mae-kon-spec.md Step 4): a vowel or tone mark hangs on the
 * consonant it sits on, so ช้อน is ช้ · อ · น and a final น is always its own tile. The final's tile comes from the
 * word's explicit `final` position, never from searching for a letter.
 */
export function tilesOf(word: SpottingWord): Tile[] {
  return word.syllables.flatMap(({ text, final }) =>
    [...graphemes.segment(text)].map(({ segment, index }) => ({ text: segment, final: final >= index && final < index + segment.length })),
  )
}

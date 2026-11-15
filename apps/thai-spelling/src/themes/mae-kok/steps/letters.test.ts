import { describe, expect, it } from 'vitest'
import { maeKok } from '../../../lessons/mae-kok'
import { lettersOf } from './letters'

const show = (word: (typeof maeKok.spotting.sets)[number][number]) => lettersOf(word).map(({ text, final }) => (final ? `[${text}]` : text))

describe('แม่กก Step 4 letters', () => {
  it('writes each word one letter per slot, marks stay with their consonant, the final ก marked from its position', () => {
    expect(maeKok.spotting.sets.flat().map(show)).toEqual([
      ['น', '[ก]'],
      ['ผั', '[ก]'],
      ['ด', 'อ', '[ก]'],
      ['เ', 'ด็', '[ก]'],
      ['ป', 'า', '[ก]'],
      ['แ', 'บ', '[ก]'],
    ])
  })

  it('marks one final per syllable of a longer word', () => {
    const word = { syllables: [{ text: 'นก', final: 1 }, { text: 'ผัก', final: 2 }], spelling: [], audio: { id: 'x', text: 'นกผัก' }, spellingAudio: { id: 'y', text: '' } }
    expect(lettersOf(word).filter(({ final }) => final).map(({ text }) => text)).toEqual(['ก', 'ก'])
  })
})

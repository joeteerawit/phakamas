import { describe, expect, it } from 'vitest'
import { maeKop } from '../../../lessons/mae-kop'
import { stonesOf } from './stones'

const lay = (text: string) => {
  const word = maeKop.spotting.sets.flat().find(({ audio }) => audio.text === text)!
  return stonesOf(word).map(({ text, final }) => (final ? `[${text}]` : text)).join(' · ')
}

describe('stonesOf (แม่กบ Step 4)', () => {
  it('lays one letter per stone, a vowel mark riding with its consonant, and marks the final consonant', () => {
    expect(lay('กบ')).toBe('ก · [บ]')
    expect(lay('พับ')).toBe('พั · [บ]')
    expect(lay('จับ')).toBe('จั · [บ]')
    expect(lay('ภาพ')).toBe('ภ · า · [พ]')
    expect(lay('เจ็บ')).toBe('เ · จ็ · [บ]')
    expect(lay('อาบ')).toBe('อ · า · [บ]')
  })

  it('every word has exactly one final stone, its last, and the stones spell the word', () => {
    for (const word of maeKop.spotting.sets.flat()) {
      const stones = stonesOf(word)
      expect(stones.filter(({ final }) => final), word.audio.text).toHaveLength(1)
      expect(stones.at(-1)!.final, word.audio.text).toBe(true)
      expect(stones.map(({ text }) => text).join('')).toBe(word.audio.text)
    }
  })

  it('marks one final per syllable in a longer word', () => {
    const word = { ...maeKop.spotting.sets[0]![0]!, syllables: [{ text: 'กบ', final: 1 }, { text: 'จับ', final: 2 }] }
    expect(stonesOf(word).map(({ final }) => final)).toEqual([false, true, false, true])
  })
})

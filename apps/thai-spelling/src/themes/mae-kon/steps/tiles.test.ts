import { describe, expect, it } from 'vitest'
import { maeKon } from '../../../lessons/mae-kon'
import { tilesOf } from './tiles'

describe('แม่กน Step 4 tiles', () => {
  it('spells each word one letter per tile, tone marks on their consonant, the final น always its own tile', () => {
    expect(maeKon.spotting.sets.flat().map((word) => tilesOf(word).map(({ text, final }) => (final ? `[${text}]` : text)).join(' '))).toEqual([
      'จ า [น]',
      'ช้ อ [น]',
      'ร้ า [น]',
      'กิ [น]',
      'ค [น]',
      'บ้ า [น]',
    ])
  })
})

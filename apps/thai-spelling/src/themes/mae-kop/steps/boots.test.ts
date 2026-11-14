import { describe, expect, it } from 'vitest'
import { maeKop } from '../../../lessons/mae-kop'
import { bootOrder } from './boots'

describe('bootOrder (แม่กบ Step 8)', () => {
  it('stands the boots กบ · จับ · จบ · รับ, so no rhyming pair is side by side', () => {
    const order = bootOrder(maeKop.rhymeMatching.pairs)
    expect(order).toEqual(['กบ', 'จับ', 'จบ', 'รับ'])
    const partner = new Map<string, string>(maeKop.rhymeMatching.pairs.flatMap(({ left, right }) => [[left, right], [right, left]]))
    for (let i = 1; i < order.length; i++) expect(partner.get(order[i - 1]!)).not.toBe(order[i])
  })

  it('has a boot for every word of the Lesson, each with its clip', () => {
    const order = bootOrder(maeKop.rhymeMatching.pairs)
    expect(order.toSorted()).toEqual(maeKop.rhymeMatching.words.map(({ text }) => text).toSorted())
  })
})

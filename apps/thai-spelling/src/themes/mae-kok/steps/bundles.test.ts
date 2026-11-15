import { describe, expect, it } from 'vitest'
import { maeKok } from '../../../lessons/mae-kok'
import { bundleOrder } from './bundles'

describe('แม่กก Step 8 bundles', () => {
  it('lays the four words along the edge as ผัก บอก ดอก ตัก', () => {
    expect(bundleOrder(maeKok.rhymeMatching.pairs)).toEqual(['ผัก', 'บอก', 'ดอก', 'ตัก'])
  })

  it('keeps every word once for any number of pairs', () => {
    const pairs = [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }, { left: 'e', right: 'f' }]
    expect(bundleOrder(pairs).toSorted()).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })
})

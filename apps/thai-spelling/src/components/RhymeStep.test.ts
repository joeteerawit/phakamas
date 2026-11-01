import { describe, expect, it } from 'vitest'
import { karaokeWord, splitWords } from './RhymeStep'

describe('splitWords', () => {
  it('splits a rhyme line into its Thai words', () => {
    expect(splitWords('ช้างร้องเสียงดัง')).toEqual(['ช้าง', 'ร้อง', 'เสียง', 'ดัง'])
    expect(splitWords('ฟังเพลงเพลินใจ')).toEqual(['ฟัง', 'เพลง', 'เพลิน', 'ใจ'])
  })
})

describe('karaokeWord', () => {
  it('spreads the words evenly over the clip', () => {
    expect(karaokeWord(0, 1000, 4)).toBe(0)
    expect(karaokeWord(249, 1000, 4)).toBe(0)
    expect(karaokeWord(250, 1000, 4)).toBe(1)
    expect(karaokeWord(760, 1000, 4)).toBe(3)
  })

  it('stays on the last word once the clip has run its length', () => {
    expect(karaokeWord(1000, 1000, 4)).toBe(3)
    expect(karaokeWord(5000, 1000, 4)).toBe(3)
  })
})

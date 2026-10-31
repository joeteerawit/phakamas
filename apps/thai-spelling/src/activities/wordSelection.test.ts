import { describe, expect, it } from 'vitest'
import { maeKong } from '../lessons/mae-kong'
import { checkWordSelection } from './wordSelection'

const { choices } = maeKong.wordSelection
const check = (...selected: string[]) => checkWordSelection(choices, new Set(selected))

describe('Step 5 word selection scoring (7 Decisions)', () => {
  it('has the spec choices: 4 แม่กง words and 3 distractors', () => {
    expect(choices.map(({ word, correct }) => [word, correct])).toEqual([
      ['ลิง', true],
      ['ช้าง', true],
      ['รัง', true],
      ['กางเกง', true],
      ['แมว', false],
      ['นก', false],
      ['บ้าน', false],
    ])
  })

  it('TC-006: selecting exactly the 4 แม่กง words scores 7', () => {
    expect(check('ลิง', 'ช้าง', 'รัง', 'กางเกง')).toEqual({ score: 7, wrong: [] })
  })

  it('nothing selected still earns the 3 distractor decisions', () => {
    expect(check()).toEqual({ score: 3, wrong: ['ลิง', 'ช้าง', 'รัง', 'กางเกง'] })
  })

  it('selecting everything earns only the 4 แม่กง decisions', () => {
    expect(check('ลิง', 'ช้าง', 'รัง', 'กางเกง', 'แมว', 'นก', 'บ้าน')).toEqual({ score: 4, wrong: ['แมว', 'นก', 'บ้าน'] })
  })

  it('TC-007: one distractor picked and one word missed costs one point each', () => {
    expect(check('ลิง', 'ช้าง', 'รัง', 'นก')).toEqual({ score: 5, wrong: ['กางเกง', 'นก'] })
  })

  it('selecting only the distractors scores 0', () => {
    expect(check('แมว', 'นก', 'บ้าน')).toEqual({ score: 0, wrong: ['ลิง', 'ช้าง', 'รัง', 'กางเกง', 'แมว', 'นก', 'บ้าน'] })
  })
})

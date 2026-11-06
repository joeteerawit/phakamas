import { describe, expect, it } from 'vitest'
import { maeKong } from '../../lessons/mae-kong'
import { checkWordSelection } from './wordSelection'

const { choices } = maeKong.wordSelection
const check = (...selected: string[]) => checkWordSelection(choices, new Set(selected))

const MAE_KONG = ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง']
const DISTRACTORS = ['งู', 'บ้าน', 'ก้ม', 'เงา']

describe('Step 5 word selection scoring (12 Decisions)', () => {
  it('TC-006: selecting exactly the 8 แม่กง words scores 12', () => {
    expect(check(...MAE_KONG)).toEqual({ score: 12, wrong: [] })
  })

  it('nothing selected still earns the 4 distractor decisions', () => {
    expect(check()).toEqual({ score: 4, wrong: ['ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง', 'ค่าง'] })
  })

  it('selecting everything earns only the 8 แม่กง decisions', () => {
    expect(check(...MAE_KONG, ...DISTRACTORS)).toEqual({ score: 8, wrong: ['งู', 'บ้าน', 'ก้ม', 'เงา'] })
  })

  it('TC-007: one distractor picked and one word missed costs one point each', () => {
    expect(check('งู', 'ดัง', 'สูง', 'ผึ้ง', 'ลิง', 'ช้าง', 'ลุง', 'รัง')).toEqual({ score: 10, wrong: ['งู', 'ค่าง'] })
  })

  it('selecting only the distractors scores 0', () => {
    expect(check(...DISTRACTORS).score).toBe(0)
  })
})

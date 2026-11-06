import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { maeKong } from '../../../lessons/mae-kong'
import { Stage } from '../../../ui/stage/Stage'
import { WordFillingStep } from './WordFillingStep'

function renderStep() {
  const onFeedback = vi.fn()
  render(
    <Stage>
      <main>
        <WordFillingStep lesson={maeKong} onFeedback={onFeedback} />
      </main>
    </Stage>,
  )
  return { onFeedback }
}

describe('WordFillingStep (design page 6)', () => {
  it('lays the Activity out on the stage itself, outside the scrolling Step area', () => {
    renderStep()
    const heading = screen.getByText('เลือกคำในกล่องคำเติมในช่องว่างให้ถูกต้อง')
    expect(heading.closest('main')).toBeNull()
    expect(screen.getByTestId('stage')).toContainElement(heading)
  })

  it('a tapped word moves from the bank into the slot, and checking scores it', () => {
    const { onFeedback } = renderStep()
    const bank = screen.getByRole('group', { name: 'คลังคำ' })

    fireEvent.click(within(bank).getByRole('button', { name: 'ลิง' }))
    fireEvent.click(screen.getByRole('button', { name: 'ช่องที่ 1: ว่าง' }))
    expect(within(bank).queryByRole('button', { name: 'ลิง' })).toBeNull()
    expect(screen.getByRole('button', { name: 'ช่องที่ 1: ลิง' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ตรวจคำตอบ' }))
    expect(screen.getByRole('button', { name: 'ช่องที่ 1: ลิง ถูก' })).toBeInTheDocument()
    expect(onFeedback).toHaveBeenLastCalledWith(expect.objectContaining({ message: expect.stringContaining('1/6') }))
  })
})

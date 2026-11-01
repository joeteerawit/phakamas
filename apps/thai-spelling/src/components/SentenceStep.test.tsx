import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stopAudio, useAudio } from '../audio/audioManager'
import { maeKong } from '../lessons/mae-kong'
import { SentenceStep } from './SentenceStep'

vi.mock('../audio/audioManager', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../audio/audioManager')>()),
  playClip: vi.fn(),
}))

const board = (n: number) => screen.getByRole('button', { name: new RegExp(`^ฟังประโยคที่ ${n}`) })
const highlighted = () => document.querySelector('mark')?.textContent ?? null

describe('Step 9 sentence boards', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    stopAudio()
    vi.useRealTimers()
  })

  it('shows each sentence on its board with its pictures (บ่าง for sentence 2)', () => {
    render(<SentenceStep lesson={maeKong} />)
    expect(board(1)).toHaveTextContent('ลิงน้อยนั่งมองช้าง')
    expect(board(2)).toHaveTextContent('บ่างวิ่งไล่ตามมา')
    expect(within(board(1)).getAllByRole('presentation').map((img) => img.getAttribute('src'))).toEqual([
      '/assets/canva/vocabulary/ling.webp',
      '/assets/canva/vocabulary/chang.webp',
    ])
    expect(within(board(2)).getByRole('presentation')).toHaveAttribute('src', '/assets/canva/vocabulary/bang.webp')
  })

  it('highlights the words one by one, evenly over the clip, while the sentence plays', () => {
    render(<SentenceStep lesson={maeKong} />)
    fireEvent.click(board(2))
    expect(highlighted()).toBeNull()

    act(() => useAudio.setState({ clipId: 'sentences/sentence-02', status: 'playing' }))
    expect(highlighted()).toBe('บ่าง')
    // No clip length in tests, so 300 ms per word; 320 lands on the first animation frame past it.
    act(() => vi.advanceTimersByTime(320))
    expect(highlighted()).toBe('วิ่ง')
    act(() => vi.advanceTimersByTime(300 * 10))
    expect(highlighted()).toBe('มา')

    act(() => useAudio.setState({ status: 'idle' }))
    expect(highlighted()).toBeNull()
  })
})

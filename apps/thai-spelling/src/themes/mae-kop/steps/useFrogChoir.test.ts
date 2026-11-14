import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecorder } from '../../../audio/recorder'
import { maeKop } from '../../../lessons/mae-kop'
import { useFrogChoir } from './useFrogChoir'

const words = maeKop.listenAndRepeat

describe('useFrogChoir (แม่กบ Step 3)', () => {
  beforeEach(() => {
    let n = 0
    vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['take']) })))
    URL.createObjectURL = vi.fn(() => `blob:take-${++n}`)
    URL.revokeObjectURL = vi.fn()
    useRecorder.setState({ status: 'idle', url: null, playing: false })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('each finished take brings the current word its frog, copied into a URL the choir owns', async () => {
    const { result, rerender } = renderHook(({ current }) => useFrogChoir(words, current, () => false), { initialProps: { current: words[0]! } })
    expect(result.current.frogs).toEqual([])
    act(() => useRecorder.setState({ status: 'ready', url: 'blob:recorder-1' }))
    await waitFor(() => expect(result.current.frogs).toEqual([words[0]]))
    expect(fetch).toHaveBeenCalledWith('blob:recorder-1')

    // A second take of the same word replaces the first; a take of the next word brings a second frog.
    act(() => useRecorder.setState({ status: 'ready', url: 'blob:recorder-2' }))
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1'))
    expect(result.current.frogs).toHaveLength(1)
    rerender({ current: words[3]! })
    act(() => useRecorder.setState({ status: 'ready', url: 'blob:recorder-3' }))
    await waitFor(() => expect(result.current.frogs).toEqual([words[0], words[3]]))
    expect(result.current.complete).toBe(false)
  })

  it('with the microphone refused, every word heard brings its frog, so the choir can still be complete', () => {
    const heard = new Set(words.slice(0, 2).map((w) => w.audio.id))
    const { result, rerender } = renderHook(() => useFrogChoir(words, words[0]!, (w) => heard.has(w.audio.id)))
    expect(result.current.frogs).toEqual([])
    act(() => useRecorder.setState({ status: 'denied' }))
    expect(result.current.micBlocked).toBe(true)
    expect(result.current.frogs).toEqual(words.slice(0, 2))
    for (const w of words) heard.add(w.audio.id)
    rerender()
    expect(result.current.complete).toBe(true)
  })
})

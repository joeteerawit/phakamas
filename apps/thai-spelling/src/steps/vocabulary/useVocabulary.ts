import { useState } from 'react'
import { playClip, useClipStatus, type AudioStatus } from '../../audio/audioManager'
import type { VocabularyWord } from '../../lessons'

// Visually hidden; keeps the card's state in its accessible name.
const statusText: Record<AudioStatus | 'visited', string> = {
  idle: 'แตะฟังเสียง',
  visited: 'ฟังแล้ว',
  loading: 'กำลังโหลด',
  playing: 'กำลังเล่น',
  error: 'ลองอีกครั้ง',
}

/** Step 2's behaviour, shared by every Theme: tapping a picture plays its word and marks it heard. */
export function useVocabulary() {
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set())
  return {
    visited: (item: VocabularyWord) => visited.has(item.audio.id),
    play: (item: VocabularyWord) => {
      setVisited((old) => new Set(old).add(item.audio.id))
      playClip(item.audio)
    },
  }
}

/** One picture's clip status, and its state in words for the card's accessible name. */
export function useVocabularyCard(item: VocabularyWord, visited: boolean) {
  const status = useClipStatus(item.audio.id)
  return { status, statusText: statusText[status === 'idle' && visited ? 'visited' : status] }
}

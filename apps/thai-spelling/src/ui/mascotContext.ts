import { createContext, useContext } from 'react'

/** A Theme's Mascot: its name and the image of each pose. */
export type MascotArt = {
  name: string
  /**
   * Greeting; jumping for joy, for celebrations and right answers; a thumbs up, for answers not right yet;
   * and the cover pose (น้องลิง swinging on a vine, น้องส้ม floating on the wind).
   */
  poses: { greet: string; cheer: string; encourage: string; cover: string }
}

/** The Lesson's Mascot, provided by the Step route from the Lesson's Theme. */
export const MascotContext = createContext<MascotArt | null>(null)

export function useMascot(): MascotArt {
  const mascot = useContext(MascotContext)
  if (!mascot) throw new Error('useMascot needs a MascotContext provider')
  return mascot
}

import { createContext, useContext } from 'react'

/** A Theme's Mascot: its name and the image of each pose. */
export type MascotArt = {
  name: string
  /** Greeting; jumping for joy, for celebrations and right answers; a thumbs up, for answers not right yet. */
  poses: { greet: string; cheer: string; encourage: string }
}

/** The Lesson's Mascot, provided by the Step route from the Lesson's Theme. */
export const MascotContext = createContext<MascotArt | null>(null)

export function useMascot(): MascotArt {
  const mascot = useContext(MascotContext)
  if (!mascot) throw new Error('useMascot needs a MascotContext provider')
  return mascot
}

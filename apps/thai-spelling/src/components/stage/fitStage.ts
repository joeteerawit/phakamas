/** Design size of the Canva stage; every Step is laid out in these pixels. */
export const STAGE_WIDTH = 1920
export const STAGE_HEIGHT = 1080

/** Uniform scale and offset that fit the stage inside the window, centred; the scene covers the rest of the window. */
export function fitStage(viewportWidth: number, viewportHeight: number) {
  const scale = Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT)
  return {
    scale,
    left: (viewportWidth - STAGE_WIDTH * scale) / 2,
    top: (viewportHeight - STAGE_HEIGHT * scale) / 2,
  }
}

/** Portrait windows get the rotate-to-landscape overlay. */
export const isPortrait = (viewportWidth: number, viewportHeight: number) => viewportHeight > viewportWidth

import { Smartphone } from 'lucide-react'
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { SnowyStreet } from '../../themes/mae-kom/scenes/SnowyStreet'
import { useMascot } from '../mascotContext'
import { Ambient } from './Ambient'
import { ClickFeedback } from './ClickFeedback'
import { fitStage, isPortrait, STAGE_HEIGHT, STAGE_WIDTH } from './fitStage'

export type Scene = 'garden' | 'pond' | 'summary' | 'step5' | 'cover' | 'kom-cover'

const sceneSrc: Record<Exclude<Scene, 'cover'>, string> = {
  garden: '/assets/canva/backgrounds/garden.webp',
  pond: '/assets/canva/backgrounds/pond.webp',
  summary: '/assets/canva/backgrounds/cover.webp',
  // Calm comic flower garden (docs/comic-art.md).
  step5: '/assets/comic/step5-scene.webp',
  // แม่กม (docs/mae-kom-spec.md): busy snowy shop street.
  'kom-cover': '/assets/comic/kom-scene-cover.webp',
}

/** What moves in a Scene: แม่กม's Scenes have their own objects, the rest share the garden's. */
function SceneMotion({ scene }: { scene: Exclude<Scene, 'cover'> }) {
  if (scene === 'kom-cover') return <SnowyStreet />
  return <Ambient scene={scene} />
}

const StageScale = createContext(1)
/** Current stage scale; client-pixel pointer travel ÷ scale = stage pixels. */
export const useStageScale = () => useContext(StageScale)

const StageBleed = createContext({ scale: 1, x: 0, y: 0, inset: '0' })
/**
 * How the window extends past the stage: `scale` about the stage centre makes a decor layer cover
 * the window, `x`/`y` are the stage pixels between each stage edge and the window edge, and `inset`
 * stretches a layer to the window's edges, clear of any notch, for buttons to sit in its corners.
 */
export const useStageBleed = () => useContext(StageBleed)

const subscribe = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/**
 * The fixed 1920×1080 Canva stage, scaled uniformly to fit the window (spec §1.3). The scene is
 * scaled further to cover the window, so there is no letterbox. Children are positioned in stage pixels. Portrait windows get a blocking rotate overlay instead.
 */
export function Stage({ scene = 'garden', children }: { scene?: Scene; children: ReactNode }) {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth)
  const height = useSyncExternalStore(subscribe, () => window.innerHeight)
  const portrait = isPortrait(width, height)
  const { scale, left, top } = fitStage(width, height)
  const x = (width / scale - STAGE_WIDTH) / 2
  const y = (height / scale - STAGE_HEIGHT) / 2
  const edge = (side: string, gap: number) => `calc(env(safe-area-inset-${side}, 0px) / ${scale} - ${gap}px)`
  const bleed = {
    scale: Math.max(width / STAGE_WIDTH, height / STAGE_HEIGHT) / scale,
    x,
    y,
    inset: `${edge('top', y)} ${edge('right', x)} ${edge('bottom', y)} ${edge('left', x)}`,
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-linear-to-b from-letterbox-sky to-letterbox-grass">
      <div
        data-testid="stage"
        inert={portrait}
        className="absolute origin-top-left"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          left,
          top,
          transform: `scale(${scale})`,
        }}
      >
        {/* The comic cover draws its own scene and decor. */}
        {scene !== 'cover' && (
          <div
            data-testid="stage-scene"
            className="absolute inset-0 bg-cover"
            style={{ transform: `scale(${bleed.scale})`, backgroundImage: `url(${sceneSrc[scene]})` }}
          >
            <SceneMotion scene={scene} />
          </div>
        )}
        <StageScale.Provider value={scale}>
          <StageBleed.Provider value={bleed}>{children}</StageBleed.Provider>
        </StageScale.Provider>
      </div>
      {portrait && <RotateOverlay />}
      <ClickFeedback />
    </div>
  )
}

function RotateOverlay() {
  const { poses } = useMascot()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-message"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-(--space-md) bg-linear-to-b from-letterbox-sky to-letterbox-grass p-(--space-md) text-center"
    >
      <Smartphone
        aria-hidden="true"
        data-testid="rotate-phone"
        className="size-24 animate-rotate-phone text-card motion-reduce:animate-none"
        strokeWidth={2}
      />
      <img src={poses.greet} alt="" draggable={false} className="pointer-events-none h-40 w-auto object-contain select-none" />
      <p
        id="rotate-message"
        className="rounded-full border-4 border-comic-ink bg-pill px-(--space-md) py-(--space-sm) shadow-comic font-heading text-body-lg font-bold whitespace-nowrap text-navy"
      >
        กรุณาหมุนจอเป็นแนวนอน
      </p>
    </div>
  )
}

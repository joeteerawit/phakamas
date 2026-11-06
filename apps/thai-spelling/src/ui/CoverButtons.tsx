import { Link } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toggleMusic } from '../audio/music'
import type { Cover } from '../steps/cover/useCover'
import { cx, pressable as pressFeedback } from './clay/buttonClass'
import { useStageBleed } from './stage/Stage'

const COMIC = '/assets/comic'
const pressable = cx(pressFeedback, 'absolute block')
const loop = { repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const

/** The cover's music speaker, เริ่มใหม่ and pulsing ▶, in the window's corners whatever its shape; ▶ is still under reduced motion. */
export function CoverButtons({ cover }: { cover: Cover }) {
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const { lessonId, resumeStep, musicOn, restart, start } = cover

  return (
    <div className="absolute" style={{ inset: bleed.inset }}>
      {/* Background music on/off (#20); the choice is saved with the Session store. */}
      <button
        type="button"
        aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
        aria-pressed={musicOn}
        onClick={toggleMusic}
        className={`${pressable} bottom-[32px] left-[40px] h-[139px] w-[135px] rounded-full`}
      >
        <img
          src={`${COMIC}/speaker-button.webp`}
          alt=""
          draggable={false}
          className={`pointer-events-none size-full object-contain transition-[filter] ${musicOn ? '' : 'opacity-70 grayscale'}`}
        />
        {!musicOn && (
          <span
            data-testid="music-off"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[14px] w-[150px] -translate-1/2 -rotate-45 rounded-full border-4 border-card bg-final"
          />
        )}
      </button>

      {resumeStep && (
        <button
          type="button"
          onClick={restart}
          className={`${pressable} right-[248px] bottom-[32px] flex h-[136px] items-center gap-[16px] rounded-full border-[6px] border-card bg-pill px-[44px] font-heading text-[52px] font-bold text-navy`}
        >
          <RotateCcw aria-hidden="true" className="size-[56px]" strokeWidth={2.5} />
          เริ่มใหม่
        </button>
      )}

      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId, step: String(resumeStep ?? 2) }}
        onClick={start}
        className={`${pressable} right-[32px] bottom-[24px] size-[187px] rounded-full`}
      >
        <span className="sr-only">{resumeStep ? `เรียนต่อ (ขั้น ${resumeStep})` : 'เริ่มเรียน'}</span>
        <motion.img
          src={`${COMIC}/play-button.webp`}
          alt=""
          draggable={false}
          className="pointer-events-none size-full object-contain"
          animate={still ? undefined : { scale: [1, 1.08] }}
          transition={{ duration: 0.8, ...loop }}
        />
      </Link>
    </div>
  )
}

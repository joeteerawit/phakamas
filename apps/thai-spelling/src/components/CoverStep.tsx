import { Link } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { playClip } from '../audio/audioManager'
import { toggleMusic } from '../audio/music'
import { useLessonSession } from '../session/lessonSession'
import { cx, pressable as pressFeedback } from './clay/buttonClass'
import type { StepProps } from './stepProps'
import { useRestartLesson } from './useRestartLesson'

/** Cover layers split from the design's cover image (docs/canva-assets.md, #19). */
const COVER = '/assets/canva/cover'

const layer = 'pointer-events-none absolute select-none'
const pressable = cx(pressFeedback, 'absolute block')

const loop = { repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const

/**
 * Step 1, design DAHZj0Nxyxs page 1, in stage pixels (cover image 1672×941 scaled ×1.148).
 * The sign drops in and swings, the vine sways, the Mascot swings on it and ▶ pulses; all still under reduced motion.
 */
export function CoverStep({ lesson }: StepProps) {
  const still = useReducedMotion()
  const restart = useRestartLesson(lesson.id)
  const resumeStep = useLessonSession(({ session }) =>
    session?.lessonId === lesson.id && session.currentStep > 1 ? session.currentStep : null,
  )
  const musicOn = useLessonSession((state) => state.musicOn)

  return (
    <section data-full-stage className="pointer-events-none absolute inset-0">
      <motion.img
        src={`${COVER}/tree-left.webp`}
        alt=""
        draggable={false}
        className={`${layer} top-0 left-0 h-[653px] w-[458px] origin-top`}
        animate={still ? undefined : { rotate: [-1, 1] }}
        transition={{ duration: 2, ...loop }}
      />
      <img src={`${COVER}/tree-right.webp`} alt="" draggable={false} className={`${layer} top-0 left-[1348px] h-[564px] w-[572px]`} />

      <motion.div
        data-testid="cover-sign"
        className="absolute inset-0 origin-[1109px_45px]"
        initial={still ? false : { y: -1080, rotate: 6 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{
          y: { type: 'spring', stiffness: 140, damping: 14 },
          rotate: { type: 'spring', stiffness: 50, damping: 3, delay: 0.4 },
        }}
      >
        <img src={`${COVER}/sign.webp`} alt="" draggable={false} className={`${layer} top-[45px] left-[411px] h-[698px] w-[1395px]`} />
        <h2 className="absolute top-[206px] left-[532px] w-[1167px] rotate-[1.66deg] text-center font-heading text-[112px] leading-[1.53] font-bold tracking-tight whitespace-nowrap text-navy">
          {lesson.title}
        </h2>
        <p className="absolute top-[377px] left-[798px] flex h-[192px] w-[584px] items-center justify-center rounded-full border-[10px] border-card bg-cover-pill">
          <span className="rotate-[1.66deg] font-heading text-[105px] leading-[1.2] font-bold whitespace-nowrap text-final">
            {lesson.subtitle}
          </span>
        </p>
        <p className="absolute top-[684px] left-[762px] flex h-[85px] w-[584px] items-center justify-center rounded-full border-4 border-card bg-cream font-sans text-[40px] font-bold whitespace-nowrap text-navy">
          {lesson.gradeLine}
        </p>
      </motion.div>

      {/* Pendulum about the top of the vine (stage 264, 0). */}
      <motion.div
        data-testid="cover-mascot"
        className="absolute top-[359px] left-[45px] h-[564px] w-[596px] origin-[219px_-359px]"
        animate={still ? undefined : { rotate: [-3, 3] }}
        transition={{ duration: 1.5, ...loop }}
      >
        <img src={`${COVER}/monkey.webp`} alt="" draggable={false} className={`${layer} inset-0 size-full`} />
      </motion.div>

      <img src={`${COVER}/bushes-left.webp`} alt="" draggable={false} className={`${layer} top-[675px] left-0 h-[405px] w-[869px]`} />
      <img src={`${COVER}/bushes-right.webp`} alt="" draggable={false} className={`${layer} top-[788px] left-[1371px] h-[293px] w-[549px]`} />

      {/* Background music on/off (#20); the choice is saved with the Session store. */}
      <button
        type="button"
        aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
        aria-pressed={musicOn}
        onClick={toggleMusic}
        className={`${pressable} top-[902px] left-[40px] h-[139px] w-[135px]`}
      >
        <img
          src={`${COVER}/speaker-button.webp`}
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
          className={`${pressable} top-[905px] left-[1330px] flex h-[136px] items-center gap-[16px] rounded-full border-[6px] border-card bg-pill px-[44px] font-heading text-[52px] font-bold text-navy`}
        >
          <RotateCcw aria-hidden="true" className="size-[56px]" strokeWidth={2.5} />
          เริ่มใหม่
        </button>
      )}

      <Link
        to="/lesson/$lessonId/$step"
        params={{ lessonId: lesson.id, step: String(resumeStep ?? 2) }}
        // The cover speaker is the music toggle, so the teacher intro plays on the Session's first ▶ instead.
        onClick={resumeStep ? undefined : () => playClip(lesson.intro)}
        className={`${pressable} top-[878px] left-[1702px] size-[187px]`}
      >
        <span className="sr-only">{resumeStep ? `เรียนต่อ (ขั้น ${resumeStep})` : 'เริ่มเรียน'}</span>
        <motion.img
          src={`${COVER}/play-button.webp`}
          alt=""
          draggable={false}
          className="pointer-events-none size-full object-contain"
          animate={still ? undefined : { scale: [1, 1.08] }}
          transition={{ duration: 0.8, ...loop }}
        />
      </Link>
    </section>
  )
}

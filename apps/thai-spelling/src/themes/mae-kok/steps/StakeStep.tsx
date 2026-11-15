import { Link } from '@tanstack/react-router'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import { playClip, useClipStatus } from '../../../audio/audioManager'
import { useLessonSession } from '../../../session/lessonSession'
import { spottingPicture, useSpellingPlaying, useSpotting } from '../../../steps/spotting/useSpotting'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { usePointerDrag } from '../../../ui/usePointerDrag'
import { lettersOf } from './letters'

// Stage pixels. The raised bed (580–1600 × 360–700) with the word written in its soil, one letter per 200 px slot,
// 30 apart, centred on x = 1090; the word's picture on a seed packet at its left (330–530 × 380–620) and the stake's
// holder under it (350–510 × 690–860). The spelling line runs under the bed (730–820), clear of the leaves at the
// window's sides.
const BED = { left: 580, top: 360, width: 1020, height: 340 }
const SLOT = { width: 200, height: 260, gap: 30, top: 400 }
const slotLeft = (i: number, count: number) => 1090 - (count * SLOT.width + (count - 1) * SLOT.gap) / 2 + i * (SLOT.width + SLOT.gap)
const HOLDER = { left: 350, top: 690, width: 160, height: 170 }
const STAKE = { width: 130, height: 150 }
const label = 'kraft-label px-[28px] font-heading text-[38px] leading-[1.4] font-bold whitespace-nowrap text-soil-deep'

type Wrong = { slot: number; round: number }

/**
 * แม่กก Step 4, stake the final (docs/mae-kok-spec.md), over the kok-terrace Scene. Each word is written large in the soil
 * of a raised bed, one letter per slot. The student drags the small "ตัวสะกด" marker stake from its holder, or taps it
 * and then taps a letter, to plant it under the final consonant. Right: the stake stays, the ก turns terracotta red and
 * the slow spelling plays with its parts lit one by one (Step 4's shared behaviour); คำต่อไป brings the next word. Wrong:
 * the stake springs back to its holder and the มาตราแม่กก explanation plays as a hint, the word left to retry. The
 * pot-horn speaker plays the explanation at any time. No timer; under reduced motion nothing springs or slides.
 */
export function StakeStep({ lesson }: StepProps) {
  const { heading, explanation, sets } = lesson.spotting
  const words = sets.flat()
  const spotting = useSpotting(lesson)
  const reduceMotion = !!useReducedMotion()
  const { card, Button } = useKit()
  const [index, setIndex] = useState(0)
  const [found, setFound] = useState<ReadonlySet<number>>(() => new Set())
  const [picked, setPicked] = useState(false)
  const [wrong, setWrong] = useState<Wrong | null>(null)
  const explaining = useClipStatus(explanation.id) === 'playing'
  const done = index >= words.length
  const word = words[Math.min(index, words.length - 1)]!
  const letters = lettersOf(word)
  const wordFound = letters.every((letter, i) => !letter.final || found.has(i))
  const activePart = spotting.activePart(word)
  const spelling = useSpellingPlaying(word)

  const plant = (i: number) => {
    setPicked(false)
    if (wordFound) return
    if (letters[i]!.final) {
      const next = new Set(found).add(i)
      setFound(next)
      setWrong(null)
      if (letters.every((letter, j) => !letter.final || next.has(j))) spotting.play(word)
      return
    }
    setWrong((old) => ({ slot: i, round: (old?.round ?? 0) + 1 }))
    playClip(explanation)
  }

  const nextWord = () => {
    setIndex((i) => i + 1)
    setFound(new Set())
    setWrong(null)
    setPicked(false)
  }
  const again = () => {
    setIndex(0)
    setFound(new Set())
    setWrong(null)
  }

  const root = useRef<HTMLElement>(null)
  const drag = usePointerDrag((_, x, y) => {
    const slot = [...(root.current?.querySelectorAll<HTMLElement>('[data-slot]') ?? [])].find((el) => {
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    })
    if (slot) plant(Number(slot.dataset.slot))
  })
  const dragging = drag.dragging?.id === 'stake' ? drag.dragging : null

  return (
    <section ref={root} data-full-stage aria-label={`คำในมาตรา${lesson.finalGroup}`} className="relative size-full font-heading text-soil-deep">
      <h2 className={cx(label, 'absolute top-[166px] left-1/2 -translate-x-1/2')}>{heading}</h2>

      <div className="absolute top-[160px] left-[330px] flex w-[200px] flex-col items-center gap-[4px]">
        <div className="relative h-[124px] w-[140px]">
          <SpeakerButton label="ฟังคำอธิบาย" onClick={() => playClip(explanation)} playing={explaining} className="inset-0 size-full" />
        </div>
        <p aria-hidden="true" className={cx(label, 'px-[18px] text-[28px]')}>
          ฟังคำอธิบาย
        </p>
      </div>

      {/* The wooden raised bed, its soil still, so nothing moving runs under the letters. */}
      <div
        aria-hidden="true"
        data-testid="raised-bed"
        className="pointer-events-none absolute rounded-[20px] border-[8px] border-soil-deep bg-[repeating-linear-gradient(180deg,var(--color-plank)_0_40px,#8c5c2c_40px_46px)] p-[26px]"
        style={BED}
      >
        <div className="size-full rounded-[10px] border-[5px] border-soil-deep bg-[radial-gradient(circle_at_30%_40%,rgb(255_255_255/0.06)_0_3px,transparent_4px)_0_0/22px_22px,var(--color-soil)]" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!done && (
          <motion.div
            key={word.audio.id}
            data-testid="bed-word"
            data-word={word.audio.text}
            className="pointer-events-none absolute inset-0"
            initial={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { y: -30, opacity: 0, transition: { duration: 0.25 } }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20 }}
          >
            <span data-testid="bed-picture" className={cx('absolute top-[380px] left-[330px] block h-[240px] w-[200px]', card)}>
              <img src={spottingPicture(word)} alt="" draggable={false} className="absolute top-[40px] left-[20px] size-[160px] object-contain" />
            </span>
            <ol aria-label={`คำว่า ${word.audio.text}`}>
              {letters.map((letter, i) => (
                <li key={i}>
                  <button
                    type="button"
                    data-slot={i}
                    data-final={found.has(i) || undefined}
                    aria-label={found.has(i) ? `${letter.text} ตัวสะกด` : `${letter.text} ตัวที่ ${i + 1}`}
                    aria-pressed={found.has(i)}
                    onClick={() => plant(i)}
                    className="pointer-events-auto absolute cursor-pointer rounded-[24px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    style={{ left: slotLeft(i, letters.length), top: SLOT.top, width: SLOT.width, height: SLOT.height }}
                  >
                    <motion.span
                      key={wrong?.slot === i ? wrong.round : 0}
                      data-testid="bed-letter"
                      className={cx(
                        'absolute inset-x-0 top-0 flex h-[190px] items-center justify-center text-[150px] leading-[1.3] font-bold transition-colors duration-200 motion-reduce:transition-none',
                        found.has(i) ? 'text-terracotta [text-shadow:0_0_24px_rgb(255_255_255/0.6)]' : 'text-kraft-light',
                        picked && !wordFound && 'rounded-[24px] outline-4 outline-dashed outline-kraft',
                      )}
                      initial={false}
                      animate={wrong?.slot === i && !reduceMotion ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
                      transition={{ duration: 0.4 }}
                    >
                      {letter.text}
                    </motion.span>
                    {found.has(i) && (
                      <span data-testid="planted-stake" className="absolute top-[180px] left-1/2 -translate-x-1/2 scale-[0.8] origin-top">
                        <MarkerStake />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The spelling line under the bed: the parts lit one by one while the slow spelling plays. */}
      {!done && wordFound && (
        <p data-testid="spelling" data-playing={spelling || undefined} className="absolute top-[730px] left-[580px] flex w-[1020px] justify-center gap-[18px]">
          {word.spelling.map((part, i) => (
            <span
              key={i}
              data-active={activePart === i || undefined}
              className={cx('kraft-label px-[20px] text-[48px] leading-[1.4] font-bold', activePart === i && 'bg-terracotta text-kraft-light')}
            >
              {part}
            </span>
          ))}
        </p>
      )}

      {/* The holder the stake waits in, and the stake itself while it is not planted. */}
      <div aria-hidden="true" className="pointer-events-none absolute rounded-[16px_16px_40px_40px] border-[6px] border-soil-deep bg-terracotta" style={{ ...HOLDER, top: HOLDER.top + 100, height: HOLDER.height - 100 }} />
      {!done && !wordFound && (
        <motion.button
          key={wrong?.round ?? 0}
          type="button"
          aria-label="ป้ายตัวสะกด"
          aria-pressed={picked}
          data-testid="stake"
          onClick={drag.click(() => setPicked((p) => !p))}
          {...drag.handlers('stake')}
          className={cx(
            'pointer-events-auto absolute flex cursor-grab touch-none items-start justify-center rounded-[20px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
            picked && 'outline-6 outline-sprout',
          )}
          style={{
            left: HOLDER.left + (HOLDER.width - STAKE.width) / 2 - 10,
            top: HOLDER.top - 30,
            width: STAKE.width + 20,
            height: STAKE.height + 20,
            zIndex: dragging ? 40 : undefined,
          }}
          // A wrong try springs it back from the letter it was planted at.
          initial={wrong && !reduceMotion ? { x: slotLeft(wrong.slot, letters.length) - HOLDER.left, y: SLOT.top - HOLDER.top + 80 } : false}
          animate={{ x: 0, y: picked && !reduceMotion ? -16 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          {/* While dragged, the stake follows the pointer. */}
          <span className="pointer-events-none block pt-[10px]" style={dragging ? { transform: `translate(${dragging.dx}px, ${dragging.dy}px)` } : undefined}>
            <MarkerStake />
          </span>
        </motion.button>
      )}

      <p className={cx(label, 'absolute top-[900px] left-[330px]')}>{done ? `ครบ ${words.length} คำ` : `คำที่ ${index + 1}/${words.length}`}</p>
      <div role="status" aria-live="polite" data-testid="stake-messages" className="absolute top-[850px] left-[640px] flex w-[640px] flex-col items-center justify-center text-center">
        {done ? (
          <p className={cx(label, 'text-[36px]')}>เก่งมาก! ปักตัวสะกดครบ {words.length} คำแล้ว</p>
        ) : wordFound ? (
          <p className={cx(label, 'text-[36px]')}>ถูกต้อง! ก คือตัวสะกดของ {word.audio.text}</p>
        ) : wrong ? (
          <p className={cx(label, 'text-[30px] whitespace-normal text-balance')}>ยังไม่ใช่ ตัวสะกดอยู่ท้ายคำ ลองอีกครั้งนะ</p>
        ) : (
          <p className={cx(label, 'text-[30px]')}>{picked ? 'แตะตัวสะกดของคำนี้' : 'ลากป้ายไปปักใต้ตัวสะกด'}</p>
        )}
      </div>

      {!done && wordFound && (
        <Button data-main onClick={nextWord} className="absolute top-[880px] left-[1300px] flex h-[124px] w-[300px] items-center justify-center gap-[8px] text-[40px] font-bold">
          <span className="relative mt-[10px]">{index === words.length - 1 ? 'เสร็จแล้ว' : 'คำต่อไป'}</span>
          <ChevronRight aria-hidden="true" className="relative mt-[10px] size-[44px]" strokeWidth={3} />
        </Button>
      )}
      {done && (
        <>
          <Button onClick={again} className="absolute top-[480px] left-[790px] flex h-[124px] w-[300px] items-center justify-center gap-[12px] text-[40px] font-bold">
            <RotateCcw aria-hidden="true" className="relative mt-[10px] size-[44px]" strokeWidth={3} />
            <span className="relative mt-[10px]">ฝึกอีกรอบ</span>
          </Button>
          <Link
            to="/lesson/$lessonId/$step"
            params={{ lessonId: lesson.id, step: '5' }}
            onClick={() => useLessonSession.getState().completeStep(4)}
            data-main
            className="pot-button pointer-events-auto absolute top-[480px] left-[1130px] flex h-[124px] w-[260px] cursor-pointer items-center justify-center font-heading text-[44px] font-bold whitespace-nowrap select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="relative mt-[10px]">ไปต่อ</span>
            <ChevronRight aria-hidden="true" className="relative mt-[10px] size-[42px]" strokeWidth={3.5} />
          </Link>
        </>
      )}
    </section>
  )
}

/** The small wooden "ตัวสะกด" plant-marker stake. */
function MarkerStake() {
  return (
    <span className="pointer-events-none relative block" style={STAKE}>
      <span className="absolute top-[64px] left-1/2 h-[86px] w-[22px] -translate-x-1/2 border-x-[4px] border-b-[4px] border-soil-deep bg-plank [clip-path:polygon(0_0,100%_0,100%_80%,50%_100%,0_80%)]" />
      <span className="absolute inset-x-0 top-0 flex h-[70px] items-center justify-center rounded-[10px] border-[4px] border-soil-deep bg-kraft text-[26px] leading-none font-bold whitespace-nowrap text-soil-deep">
        ตัวสะกด
      </span>
    </span>
  )
}

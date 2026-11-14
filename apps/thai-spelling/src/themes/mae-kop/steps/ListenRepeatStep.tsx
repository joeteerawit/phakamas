import { ChevronLeft, ChevronRight, Mic, Music, Play, Square } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useListenRepeat, useListenRepeatRecorder } from '../../../steps/listen-repeat/useListenRepeat'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { useFrogChoir } from './useFrogChoir'

// Every target here is ≥ 124 stage px: 44 CSS px on a 390px-tall landscape phone.
const round = 'flex size-[130px] items-center justify-center'
const label = 'drop-label px-[24px] text-[34px] leading-[1.4] font-bold whitespace-nowrap'
// The choir rock along the bottom (400–1520 × 810–1030), six frog places on it.
const CHOIR = { left: 400, top: 810, width: 1120, height: 220 }
const FROG = { width: 150, height: 150, first: 465, step: 170 }

/**
 * แม่กบ Step 3, the frog choir (docs/mae-kop-spec.md), in stage pixels over the kop-drizzle Scene, all between x = 320
 * and 1610, clear of the drops down the window's sides. The word shows on a flat rock (560–1360 × 270–520) and the
 * snail speaker at its left plays it; the student records at the right as on แม่กม's Step 3 (Step 3's shared
 * behaviour), and rings spread from the rock while the microphone is open. Each word recorded brings one frog to the
 * choir rock along the bottom; with six, ร้องเพลงพร้อมกัน plays the six takes in turn, each frog puffing its throat
 * as it sings. If the microphone is refused, hearing a word brings its frog. Every control is from the แม่กบ Kit.
 */
export function ListenRepeatStep({ lesson }: StepProps) {
  const { words, index, direction, current, yourTurn, playing, listenLabel, goTo, listen, ...step } = useListenRepeat(lesson)
  const choir = useFrogChoir(words, current, step.heard)
  const recorder = useListenRepeatRecorder()
  const reduceMotion = !!useReducedMotion()
  const { Button } = useKit()
  const slide = reduceMotion ? 0 : 160
  const brought = (i: number) => choir.frogs.includes(words[i]!)

  return (
    <section data-full-stage className="relative size-full font-heading text-pond-deep">
      {/* Rings spread from the rock while the microphone is open; one still ring under reduced motion. */}
      {recorder.recording && (
        <div aria-hidden="true" data-testid="record-rings" className="pointer-events-none absolute top-[270px] left-[560px] h-[250px] w-[800px]">
          {(reduceMotion ? [0] : [0, 1, 2]).map((i) => (
            <span
              key={i}
              className={cx(
                'absolute inset-0 rounded-[50%] border-[6px] border-pond-light',
                !reduceMotion && 'animate-ring-spread [animation-duration:2.4s]',
                reduceMotion && 'scale-110',
              )}
              style={{ animationDelay: `${-i * 0.8}s` }}
            />
          ))}
        </div>
      )}

      {/* The flat rock: picture and word side by side, the clip's status under the word. */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[270px] left-[560px] h-[250px] w-[800px] rounded-[50%] border-[6px] border-rubber-deep bg-[radial-gradient(ellipse_at_40%_30%,#d6dde4,#9aa8b5)] shadow-[0_12px_0_rgb(51_63_75/0.45)]" />
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.audio.id}
          data-testid="listen-word"
          custom={direction}
          variants={{
            enter: (d: number) => (d === 0 ? { opacity: 0, scale: reduceMotion ? 1 : 0.6 } : { opacity: 0, x: d * slide }),
            center: { opacity: 1, scale: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: -d * slide, transition: { duration: reduceMotion ? 0 : 0.15 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.35 }}
          className="absolute top-[280px] left-[620px] flex h-[220px] w-[680px] items-center justify-center gap-[32px]"
        >
          <img src={current.image} alt="" width={200} height={200} draggable={false} className="size-[200px] object-contain" />
          <div className="relative">
            <h2 className="text-[120px] leading-[1.3] font-bold text-rubber-deep">{current.word}</h2>
            <p className="absolute inset-x-0 top-full text-center text-[30px] leading-[1.2] font-semibold whitespace-nowrap">{step.statusText}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-[290px] left-[330px] flex w-[200px] flex-col items-center gap-[12px]">
        <div className="relative h-[170px] w-[190px]">
          <SpeakerButton label={listenLabel} onClick={listen} playing={playing} className="inset-0 size-full" />
        </div>
        {/* The button's own name already says this. */}
        <p aria-hidden="true" data-testid="listen-label" className={label}>
          {listenLabel}
        </p>
      </div>
      <p data-testid="frog-count" className={cx(label, 'absolute top-[600px] left-[330px] flex w-[200px] items-center justify-center gap-[8px]')}>
        <span className="sr-only">เพื่อนกบ</span>
        <span aria-hidden="true">🐸</span>
        {choir.frogs.length}/{words.length}
      </p>

      <Recorder />

      {/* Under the rock: ‹ คำที่ n/6 › and a dot per word, a frog's green for each word recorded. */}
      <nav aria-label="ลำดับคำ" className="absolute top-[540px] left-[588px] flex w-[744px] flex-col items-center">
        <div className="flex items-center gap-[24px]">
          <Button aria-label="คำก่อนหน้า" disabled={index === 0} onClick={() => goTo(index - 1)} className={cx('relative', round)}>
            <ChevronLeft aria-hidden="true" className="relative size-[80px]" strokeWidth={3} />
          </Button>
          <p className={cx(label, 'text-[40px]')}>
            คำที่ {index + 1}/{words.length}
          </p>
          <Button aria-label="คำถัดไป" disabled={index === words.length - 1} onClick={() => goTo(index + 1)} className={cx('relative', round)}>
            <ChevronRight aria-hidden="true" className="relative size-[80px]" strokeWidth={3} />
          </Button>
        </div>
        <ol className="flex">
          {words.map((item, i) => (
            <li key={item.audio.id}>
              <button
                type="button"
                aria-label={brought(i) ? `${item.word} (บันทึกแล้ว)` : item.word}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
                className={`${pressable} flex size-[124px] items-center justify-center`}
              >
                <span
                  className={cx(
                    'block rounded-full border-[5px] border-pond-deep transition-all duration-200 motion-reduce:transition-none',
                    i === index ? 'size-[48px] bg-raincoat' : 'size-[32px]',
                    i !== index && (brought(i) ? 'bg-lily' : 'bg-card'),
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Above the rock: whose turn it is, the recorder's messages, and the choir's news. */}
      <div role="status" aria-live="polite" data-testid="choir-messages" className="absolute top-[166px] left-[560px] flex w-[800px] flex-col items-center gap-[8px] text-center">
        {choir.complete ? (
          <p className={cx(label, 'text-[38px]')}>เพื่อนกบครบ {words.length} ตัวแล้ว ร้องเพลงพร้อมกันได้เลย</p>
        ) : (
          yourTurn && <p className={cx(label, 'text-[38px]')}>ถึงตาหนูอ่านแล้ว</p>
        )}
      </div>
      <div className="absolute top-[166px] left-[560px] w-[800px] rounded-[28px] text-[26px] leading-[1.35] has-[p:empty:only-child]:hidden [&_[role=alert]]:border-pond-deep [&_[role=alert]]:bg-raincoat-light [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>

      {choir.complete && (
        <Button
          onClick={choir.singing === null ? choir.sing : choir.stop}
          className="absolute top-[640px] left-[1350px] flex h-[124px] w-[260px] items-center justify-center gap-[10px] text-[32px] font-bold"
        >
          {choir.singing === null ? (
            <Music aria-hidden="true" className="relative size-[44px] shrink-0" strokeWidth={3} />
          ) : (
            <Square aria-hidden="true" className="relative size-[40px] shrink-0 fill-current" strokeWidth={3} />
          )}
          <span className="relative whitespace-nowrap">{choir.singing === null ? 'ร้องเพลงพร้อมกัน' : 'หยุด'}</span>
        </Button>
      )}

      <ChoirRock frogs={choir.frogs.map((word) => word.audio.id)} singing={choir.singing} still={reduceMotion} />
    </section>
  )
}

/** The record pill at the right of the rock (centre x = 1475), and the play-back pill under it once a take is ready. */
function Recorder() {
  const { status, recording, secondsLeft, toggle, playBack } = useListenRepeatRecorder()
  const { Button } = useKit()
  return (
    <>
      <p className={cx(label, 'absolute top-[230px] left-[1340px] flex w-[270px] justify-center')}>
        {recording ? <span data-testid="record-time">{secondsLeft} วินาที</span> : 'กดแล้วอ่านตาม'}
      </p>
      <Button
        aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
        disabled={status === 'requesting'}
        onClick={toggle}
        aria-pressed={recording}
        className="absolute top-[310px] left-[1395px] flex h-[150px] w-[160px] items-center justify-center"
      >
        {recording ? (
          <Square aria-hidden="true" className="relative size-[64px] fill-current" strokeWidth={3} />
        ) : (
          <Mic aria-hidden="true" className="relative size-[80px] text-comic-red" strokeWidth={3} />
        )}
      </Button>
      {status === 'ready' && (
        <Button aria-label="ฟังเสียงตัวเอง" onClick={playBack} className={cx(round, 'absolute top-[480px] left-[1410px]')}>
          <Play aria-hidden="true" className="relative size-[70px] fill-current" strokeWidth={3} />
        </Button>
      )}
    </>
  )
}

/** The choir rock along the bottom: a frog joins for each word, in word order; the singing frog puffs its throat. */
function ChoirRock({ frogs, singing, still }: { frogs: readonly string[]; singing: number | null; still: boolean }) {
  return (
    <div aria-hidden="true" data-testid="choir-rock" className="pointer-events-none absolute" style={CHOIR}>
      <div className="absolute inset-x-0 top-[110px] bottom-0 rounded-[50%] border-[6px] border-rubber-deep bg-[radial-gradient(ellipse_at_40%_30%,#c9d3dc,#8796a4)]" />
      {frogs.map((id, i) => (
        <motion.div
          key={id}
          data-testid="choir-frog"
          data-singing={singing === i || undefined}
          className="absolute"
          style={{ left: FROG.first - CHOIR.left + i * FROG.step - FROG.width / 2, top: 20, width: FROG.width, height: FROG.height }}
          initial={still ? false : { y: -120, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <ChoirFrog singing={singing === i} still={still} />
        </motion.div>
      ))}
    </div>
  )
}

const ink = { stroke: 'var(--color-rubber-deep)', strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** A frog friend; while it sings its throat puffs out (a still, puffed throat under reduced motion). */
function ChoirFrog({ singing, still }: { singing: boolean; still: boolean }) {
  return (
    <svg viewBox="0 0 150 150" className="size-full overflow-visible">
      <path d="M20 140 Q10 90 40 70 H110 Q140 90 130 140 Z" fill="var(--color-lily)" {...ink} />
      <ellipse cx="75" cy="70" rx="58" ry="40" fill="var(--color-lily)" {...ink} />
      {[44, 106].map((x) => (
        <g key={x}>
          <circle cx={x} cy="38" r="18" fill="var(--color-lily)" {...ink} />
          <circle cx={x} cy="40" r="10" fill="#fff" />
          <circle cx={x} cy="42" r="5" fill="var(--color-rubber-deep)" />
        </g>
      ))}
      <motion.ellipse
        data-testid="frog-throat"
        cx="75"
        cy="98"
        rx="26"
        ry="16"
        fill="#e8f6c8"
        {...ink}
        strokeWidth={4}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={singing ? (still ? { scale: 1.5 } : { scale: [1, 1.6, 1] }) : { scale: 1 }}
        transition={singing && !still ? { duration: 0.5, repeat: Infinity } : { duration: 0 }}
      />
      <path d="M55 78 Q75 90 95 78" fill="none" {...ink} strokeWidth={4} />
      {singing && <path d="M128 30 q12 -6 10 -20 M138 46 q14 -2 18 -14" fill="none" stroke="var(--color-pond-deep)" strokeWidth={5} strokeLinecap="round" />}
    </svg>
  )
}

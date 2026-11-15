import { ChevronLeft, ChevronRight, Mic, Play, RotateCcw, Square } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useRecorder } from '../../../audio/recorder'
import { useListenRepeat, useListenRepeatRecorder } from '../../../steps/listen-repeat/useListenRepeat'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { ink } from '../kit/ink'

// Every target here is ≥ 124 stage px: 44 CSS px on a 390 px-tall landscape phone.
const round = 'flex size-[130px] items-center justify-center'
const label = 'kraft-label px-[24px] text-[34px] leading-[1.4] font-bold whitespace-nowrap'
// The far hill across the valley (1060–1620 × 330–580), the six spots on its ridge where the birds come to rest, and
// the sky band above it (170–300) where they fly their loop, clear of the title row and every word.
const HILL = { left: 1060, top: 330, width: 560, height: 250 }
const PERCH = [1170, 1250, 1330, 1410, 1490, 1570].map((x, i) => ({ x, y: 392 + (i % 2) * 14 }))
const BIRD = 56
/** How long the echo hangs off the far hill once the word ends. */
const ECHO_MS = 1600
/** The birds' one slow loop round the sky band. */
const LOOP_S = 4

/**
 * แม่กก Step 3, valley echo (docs/mae-kok-spec.md), in stage pixels over the kok-terrace Scene, all between x = 320 and
 * 1620, clear of the leaves at the window's sides. น้องนก stands on the terrace edge and the word is on a seed-packet
 * stake sign beside her. The pot-horn speaker plays the word (Step 3's shared behaviour); then a softer echo of it
 * rises off the far hill across the valley. The student records on the terracotta pot as on แม่กม's Step 3 and hears
 * their own voice come back as the echo. Each word recorded brings one bird to rest on the far ridge; with all six they
 * fly one slow loop in the sky band above the hill. If the microphone is refused, hearing a word brings its bird.
 * Under reduced motion the birds are still and the loop holds as a still line in the sky.
 */
export function ListenRepeatStep({ lesson }: StepProps) {
  const { words, index, current, yourTurn, playing, listenLabel, goTo, listen, heard, ...step } = useListenRepeat(lesson)
  const recorder = useListenRepeatRecorder()
  const reduceMotion = !!useReducedMotion()
  const { Button, card } = useKit()
  const { poses } = useMascot()
  const voiceBack = useRecorder((state) => state.playing)

  // Each finished take records its word; with the microphone refused, hearing a word counts instead.
  const [recorded, setRecorded] = useState<ReadonlySet<string>>(() => new Set())
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (recorder.status === 'denied' || recorder.status === 'unsupported')) setMicBlocked(true)
  const currentId = useRef(current.audio.id)
  useEffect(() => {
    currentId.current = current.audio.id
  }, [current.audio.id])
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        if (next.status === 'ready' && prev.status === 'recording') setRecorded((old) => new Set(old).add(currentId.current))
      }),
    [],
  )
  const perched = words.filter((word) => recorded.has(word.audio.id) || (micBlocked && heard(word)))
  const complete = perched.length === words.length

  // The echo: once the word ends, it comes back softly off the far hill for a moment.
  // `echo` counts the word's endings; `echoShown` is the one on the hill now, 0 once it has faded.
  const [echo, setEcho] = useState(0)
  const [echoShown, setEchoShown] = useState(0)
  const [wasTurn, setWasTurn] = useState(yourTurn)
  if (yourTurn !== wasTurn) {
    setWasTurn(yourTurn)
    if (yourTurn) {
      setEcho(echo + 1)
      setEchoShown(echo + 1)
    }
  }
  useEffect(() => {
    if (echoShown === 0) return
    const timer = setTimeout(() => setEchoShown(0), ECHO_MS)
    return () => clearTimeout(timer)
  }, [echoShown])

  const again = () => {
    setRecorded(new Set())
    goTo(0)
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-soil-deep">
      <FarHill />
      <AnimatePresence>
        {(echoShown > 0 || voiceBack) && (
          <motion.p
            key={voiceBack ? 'voice' : echoShown}
            data-testid="echo"
            data-voice={voiceBack || undefined}
            aria-hidden="true"
            className="pointer-events-none absolute top-[452px] left-[1100px] w-[480px] text-center text-[72px] leading-[1.3] font-bold text-soil-deep/45"
            initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { y: -20, opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeOut' }}
          >
            {voiceBack ? '♪ ♪ ♪' : `${current.word}… ${current.word}…`}
          </motion.p>
        )}
      </AnimatePresence>
      <Birds perched={perched.length} loop={complete} still={reduceMotion} />

      {/* น้องนก on the terrace edge, beside the stake sign. */}
      <img src={poses.greet} alt="" draggable={false} className="pointer-events-none absolute top-[420px] left-[320px] h-[200px] w-[160px] object-contain select-none" />
      <span aria-hidden="true" className="pointer-events-none absolute top-[550px] left-[600px] h-[70px] w-[30px] rounded-b-[8px] border-[5px] border-soil-deep bg-plank" />
      <AnimatePresence mode="wait">
        <motion.div
          key={current.audio.id}
          data-testid="listen-word"
          className={cx('absolute top-[300px] left-[490px] flex h-[260px] w-[460px] items-center justify-center gap-[24px] pt-[16px]', card)}
          initial={reduceMotion ? false : { rotate: -6, opacity: 0, y: 30 }}
          animate={{ rotate: 0, opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, rotate: 6, transition: { duration: 0.15 } }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.35 }}
        >
          <img src={current.image} alt="" width={170} height={170} draggable={false} className="relative size-[170px] object-contain" />
          <div className="relative">
            <h2 className="text-[110px] leading-[1.3] font-bold">{current.word}</h2>
            <p className="absolute inset-x-0 top-full text-center text-[28px] leading-[1.2] font-semibold whitespace-nowrap">{step.statusText}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-[600px] left-[490px] flex w-[190px] flex-col items-center gap-[8px]">
        <div className="relative h-[130px] w-[150px]">
          <SpeakerButton label={listenLabel} onClick={listen} playing={playing} className="inset-0 size-full" />
        </div>
        <p aria-hidden="true" data-testid="listen-label" className={cx(label, 'text-[28px]')}>
          {listenLabel}
        </p>
      </div>
      <Recorder />

      <p data-testid="bird-count" className={cx(label, 'absolute top-[606px] left-[1080px] flex items-center gap-[8px]')}>
        <span className="sr-only">นกบนสันเขา</span>
        <span aria-hidden="true">🐦</span>
        {perched.length}/{words.length}
      </p>
      <div role="status" aria-live="polite" data-testid="echo-messages" className="absolute top-[606px] left-[1240px] flex w-[380px] flex-col items-start gap-[8px]">
        {complete ? (
          <p className={cx(label, 'text-[32px]')}>อัดครบ {words.length} คำแล้ว</p>
        ) : (
          yourTurn && <p className={cx(label, 'text-[32px]')}>ถึงตาหนูอ่านแล้ว</p>
        )}
      </div>
      <div className="absolute top-[700px] left-[1080px] w-[540px] text-[24px] leading-[1.35] has-[p:empty:only-child]:hidden [&_[role=alert]]:border-soil [&_[role=alert]]:bg-kraft-light [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>
      {complete && (
        <Button onClick={again} className="absolute top-[700px] left-[1320px] flex h-[124px] w-[290px] items-center justify-center gap-[10px] text-[36px] font-bold">
          <RotateCcw aria-hidden="true" className="relative mt-[10px] size-[40px] shrink-0" strokeWidth={3} />
          <span className="relative mt-[10px]">ฝึกอีกรอบ</span>
        </Button>
      )}

      {/* Along the bottom: ‹ คำที่ n/6 › and a dot per word, green for each word recorded. */}
      <nav aria-label="ลำดับคำ" className="absolute top-[815px] left-[588px] flex w-[744px] flex-col items-center">
        <div className="flex items-center gap-[24px]">
          <Button aria-label="คำก่อนหน้า" disabled={index === 0} onClick={() => goTo(index - 1)} className={cx('relative', round)}>
            <ChevronLeft aria-hidden="true" className="relative mt-[12px] size-[76px]" strokeWidth={3} />
          </Button>
          <p className={cx(label, 'text-[40px]')}>
            คำที่ {index + 1}/{words.length}
          </p>
          <Button aria-label="คำถัดไป" disabled={index === words.length - 1} onClick={() => goTo(index + 1)} className={cx('relative', round)}>
            <ChevronRight aria-hidden="true" className="relative mt-[12px] size-[76px]" strokeWidth={3} />
          </Button>
        </div>
      </nav>
      <ol aria-label="คำทั้งหมด" className="absolute top-[948px] left-[588px] flex w-[744px] justify-center">
        {words.map((item, i) => {
          const done = perched.includes(item)
          return (
            <li key={item.audio.id}>
              <button
                type="button"
                aria-label={done ? `${item.word} (บันทึกแล้ว)` : item.word}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
                className={`${pressable} flex size-[124px] items-center justify-center`}
              >
                <span
                  className={cx(
                    'block rounded-full border-[5px] border-soil-deep',
                    i === index ? 'size-[44px] bg-terracotta' : 'size-[30px]',
                    i !== index && (done ? 'bg-sprout' : 'bg-kraft-light'),
                  )}
                />
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** The record pot beside the speaker (it glows red while recording), and the play-back pot once a take is ready. */
function Recorder() {
  const { status, recording, secondsLeft, toggle, playBack } = useListenRepeatRecorder()
  const { Button } = useKit()
  return (
    <>
      <Button
        aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
        disabled={status === 'requesting'}
        onClick={toggle}
        aria-pressed={recording}
        data-main
        className={cx('absolute top-[600px] left-[770px] flex h-[140px] w-[150px] items-center justify-center', recording && 'shadow-[0_0_40px_14px_rgb(212_20_26/0.6)]')}
      >
        {recording ? (
          <Square aria-hidden="true" className="relative mt-[14px] size-[56px] fill-current" strokeWidth={3} />
        ) : (
          <Mic aria-hidden="true" className="relative mt-[14px] size-[72px]" strokeWidth={3} />
        )}
      </Button>
      <p className={cx(label, 'absolute top-[748px] left-[845px] -translate-x-1/2 text-center text-[26px]')}>
        {recording ? <span data-testid="record-time">{secondsLeft} วินาที</span> : 'กดแล้วอ่านตาม'}
      </p>
      {status === 'ready' && (
        <Button aria-label="ฟังเสียงตัวเอง" onClick={playBack} className={cx(round, 'absolute top-[605px] left-[950px]')}>
          <Play aria-hidden="true" className="relative mt-[12px] size-[60px] fill-current" strokeWidth={3} />
        </Button>
      )}
    </>
  )
}

/** The far hill across the valley, its ridge where the birds come to rest. */
function FarHill() {
  return (
    <svg aria-hidden="true" data-testid="far-hill" viewBox={`0 0 ${HILL.width} ${HILL.height}`} className="pointer-events-none absolute overflow-visible" style={HILL}>
      <path d="M0 250 C60 160 110 70 200 66 C280 60 330 90 400 70 C470 52 520 120 560 250 Z" fill="var(--color-ridge)" {...ink} />
      <path d="M40 250 C110 180 170 140 260 150 C350 160 430 130 520 250 Z" fill="#7cc356" {...ink} strokeWidth={4} />
    </svg>
  )
}

/**
 * The birds on the far ridge, one for each word recorded. With all six, they fly one slow loop through the sky band
 * above the hill and come back to rest; under reduced motion they stand in a still line in the sky instead.
 */
function Birds({ perched, loop, still }: { perched: number; loop: boolean; still: boolean }) {
  return (
    <div aria-hidden="true" data-testid="birds" data-loop={loop || undefined} className="pointer-events-none absolute inset-0">
      {PERCH.slice(0, perched).map((perch, i) => {
        const line = { x: 780 + i * 90, y: 210 }
        return (
          <motion.span
            key={i}
            data-testid="ridge-bird"
            className="absolute top-0 left-0"
            style={{ width: BIRD, height: BIRD }}
            initial={still ? false : { x: perch.x - BIRD / 2, y: perch.y - 200, opacity: 0 }}
            animate={
              loop && still
                ? { x: line.x, y: line.y, opacity: 1 }
                : loop
                  ? {
                      x: [perch.x, 1300 - i * 40, 900 - i * 30, 700 + i * 20, 1000 + i * 30, perch.x].map((x) => x - BIRD / 2),
                      y: [perch.y, 200, 180 + (i % 2) * 40, 250, 280, perch.y].map((y) => y - BIRD),
                      opacity: 1,
                    }
                  : { x: perch.x - BIRD / 2, y: perch.y - BIRD, opacity: 1 }
            }
            transition={loop && !still ? { duration: LOOP_S, delay: i * 0.12, ease: 'easeInOut' } : still ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 14 }}
          >
            <svg viewBox="0 0 56 56" className="size-full overflow-visible">
              <ellipse cx="28" cy="34" rx="20" ry="16" fill="var(--color-terracotta)" {...ink} strokeWidth={3.5} />
              <circle cx="40" cy="22" r="10" fill="var(--color-terracotta)" {...ink} strokeWidth={3.5} />
              <path d="M49 20 L56 23 L49 26 Z" fill="#f39a1e" stroke="var(--color-soil-deep)" strokeWidth={2} />
              <circle cx="42" cy="20" r="2.5" fill="var(--color-soil-deep)" />
              <path d="M14 30 Q24 22 32 34" fill="none" {...ink} strokeWidth={3} />
            </svg>
          </motion.span>
        )
      })}
    </div>
  )
}

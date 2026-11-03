import { ChevronLeft, ChevronRight, Mic, Play, RotateCcw, Square, Star } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip, stopAudio, useAudio, useClipStatus, type AudioStatus } from '../audio/audioManager'
import {
  discardRecording,
  MAX_RECORDING_MS,
  playRecording,
  startRecording,
  stopRecording,
  useRecorder,
} from '../audio/recorder'
import { creamCard, cx, pressable } from './clay/buttonClass'
import { Mascot } from './Mascot'
import { RecorderMessages } from './RecorderMessages'
import { SpeakerButton } from './SpeakerButton'
import type { StepProps } from './stepProps'

const statusText: Partial<Record<AudioStatus, string>> = {
  loading: 'กำลังโหลด',
  playing: 'กำลังเล่น',
  error: 'เล่นเสียงไม่ได้ ลองอีกครั้ง',
}

// Every target here is ≥ 122 stage px: 44 CSS px on a 390px-tall landscape phone. Ink on orange for contrast.
const roundOrange = `${pressable} flex size-[130px] items-center justify-center rounded-full border-[6px] border-comic-ink bg-orange text-comic-ink shadow-comic`
const inkPill = 'rounded-full border-[5px] border-comic-ink bg-pill px-[28px] text-[40px] leading-[1.4] font-bold whitespace-nowrap shadow-comic'
// The speaker (left) and the buzzer (right) mirror each other about x = 960: same column, same button box, label pill under it.
const sideColumn = 'absolute top-[210px] flex w-[340px] flex-col items-center gap-[12px]'
const bigButton = 'h-[242px] w-[280px]'

/**
 * Step 3 ฟังแล้วอ่านตาม (not in the Canva design; built from its kit on the pond scene, #22).
 * One cream word card at a time in the middle, played only on demand by the speaker at the left; when the
 * clip ends the Mascot says ถึงตาหนูอ่านแล้ว under it and the red buzzer at the right records the child.
 * Hearing every word earns a star. Positions are stage pixels over the whole stage (data-full-stage).
 */
export function ListenRepeatStep({ lesson }: StepProps) {
  const words = lesson.listenAndRepeat
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  // 0 = first card (pops in); ±1 = slide from the next/previous side.
  const [direction, setDirection] = useState(0)
  const [heard, setHeard] = useState<ReadonlySet<string>>(() => new Set())
  const [endedId, setEndedId] = useState<string | null>(null)
  const current = words[index] ?? words[0]!
  const status = useClipStatus(current.audio.id)
  const complete = words.every((item) => heard.has(item.audio.id))

  // A clip ended on its own (playing → idle, same clip); stopAudio clears clipId instead.
  useEffect(
    () =>
      useAudio.subscribe((next, prev) => {
        if (prev.status !== 'playing' || next.status !== 'idle' || !next.clipId || next.clipId !== prev.clipId) return
        const id = next.clipId
        setHeard((old) => new Set(old).add(id))
        setEndedId(id)
      }),
    [],
  )
  useEffect(() => discardRecording, [])

  const goTo = (i: number) => {
    stopAudio()
    discardRecording()
    setEndedId(null)
    setDirection(i >= index ? 1 : -1)
    setIndex(i)
  }
  // Teacher audio never plays into a recording (as on Steps 7 and 9).
  const listen = () => {
    stopRecording()
    playClip(current.audio)
  }
  const yourTurn = endedId === current.audio.id && status === 'idle'
  const playing = status === 'playing'
  const slide = reduceMotion ? 0 : 240
  const listenLabel = heard.has(current.audio.id) ? 'ฟังอีกครั้ง' : 'ฟังเสียง'

  return (
    <section data-full-stage className="relative size-full font-heading text-navy">
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
          className={cx(
            creamCard,
            'absolute top-[210px] left-[750px] flex h-[560px] w-[420px] flex-col items-center justify-center',
          )}
        >
          <img src={current.image} alt="" width={300} height={300} draggable={false} className="size-[300px] object-contain" />
          <h2 className="text-[110px] leading-[1.4] font-bold">{current.word}</h2>
          {/* Out of the flow, so the picture and word stay centred; it sits below the word's glyphs. */}
          <p className="absolute inset-x-0 bottom-[10px] text-center text-[30px] leading-[1.3] font-semibold">{statusText[status]}</p>
        </motion.div>
      </AnimatePresence>

      <div className={cx(sideColumn, 'left-[200px]')}>
        <div className={cx('relative', bigButton)}>
          <SpeakerButton label={listenLabel} onClick={listen} playing={playing} className="inset-0 size-full" />
        </div>
        {/* The button's own name already says this. */}
        <p aria-hidden="true" data-testid="listen-label" className={inkPill}>
          {listenLabel}
        </p>
      </div>

      <button
        type="button"
        aria-label="คำก่อนหน้า"
        disabled={index === 0}
        onClick={() => goTo(index - 1)}
        className={`${roundOrange} absolute top-[425px] left-[580px]`}
      >
        <ChevronLeft aria-hidden="true" className="size-[80px]" strokeWidth={3} />
      </button>
      <button
        type="button"
        aria-label="คำถัดไป"
        disabled={index === words.length - 1}
        onClick={() => goTo(index + 1)}
        className={`${roundOrange} absolute top-[425px] left-[1210px]`}
      >
        <ChevronRight aria-hidden="true" className="size-[80px]" strokeWidth={3} />
      </button>

      <nav aria-label="ลำดับคำ" className="absolute top-[790px] left-[588px] flex w-[744px] flex-col items-center">
        <p className={inkPill}>
          คำที่ {index + 1}/{words.length}
        </p>
        <ol className="flex">
          {words.map((item, i) => (
            <li key={item.audio.id}>
              <button
                type="button"
                aria-label={heard.has(item.audio.id) ? `${item.word} (ฟังแล้ว)` : item.word}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
                className={`${pressable} flex size-[124px] justify-center pt-[16px]`}
              >
                {/* Dots at the top of their tap targets, so they sit just under the pill. */}
                <span className="flex h-[48px] items-center">
                  <span
                    className={cx(
                      'block rounded-full border-[5px] border-comic-ink transition-all duration-200 motion-reduce:transition-none',
                      i === index ? 'size-[48px] bg-navy' : 'size-[32px]',
                      i !== index && (heard.has(item.audio.id) ? 'bg-primary' : 'bg-cream'),
                    )}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Recorder />

      {/* Under the speaker's label, centred on the speaker's column (x = 370): clear of the arrows, the dots and the Back button. */}
      {/* Once every word is heard only the completion box shows, so the column stays uncrowded. */}
      <div
        role="status"
        aria-live="polite"
        data-testid="listen-messages"
        className="absolute top-[556px] left-[170px] flex w-[400px] flex-col items-center gap-[16px] text-center"
      >
        {yourTurn && !complete && (
          <motion.p
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex w-[340px] items-center justify-center gap-[12px] rounded-[40px] border-[6px] border-comic-ink bg-pill px-[16px] py-[12px] text-[40px] leading-[1.3] font-bold shadow-comic"
          >
            <Mascot decorative className="size-[100px] shrink-0" />
            <span>
              ถึงตาหนู
              <br />
              อ่านแล้ว
            </span>
          </motion.p>
        )}
        {complete && (
          // 42px text (about 15 CSS px on a 390px-tall phone), the Star beside เก่งมาก! so the first line has the full width.
          <div className={cx(creamCard, 'flex w-full flex-col items-center gap-[12px] px-[12px] py-[14px]')}>
            <p className="flex flex-col items-center text-[42px] leading-[1.3] font-bold whitespace-nowrap">
              <span>ฟังครบ {words.length} คำแล้ว</span>
              <span className="flex items-center gap-[10px]">
                <motion.span
                  className="shrink-0"
                  initial={reduceMotion ? false : { scale: 0.4, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.5 }}
                >
                  <Star aria-hidden="true" className="size-[60px] fill-accent text-on-accent" strokeWidth={2} />
                </motion.span>
                เก่งมาก!
              </span>
            </p>
            <button
              type="button"
              onClick={() => goTo(0)}
              className={`${pressable} flex min-h-[124px] w-full items-center justify-center gap-[12px] rounded-full border-[6px] border-comic-ink bg-orange px-[24px] text-[42px] font-bold whitespace-nowrap text-comic-ink shadow-comic`}
            >
              <RotateCcw aria-hidden="true" className="size-[52px]" strokeWidth={3} />
              ฝึกอีกรอบ
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/** Red comic buzzer to record, the remaining time, and an orange play-back button. */
function Recorder() {
  const status = useRecorder((state) => state.status)
  const reduceMotion = useReducedMotion()
  const recording = status === 'recording'
  const secondsLeft = useSecondsLeft(recording)

  return (
    <div className={cx(sideColumn, 'left-[1380px]')}>
      <button
        type="button"
        aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
        disabled={status === 'requesting'}
        onClick={recording ? stopRecording : () => void startRecording()}
        className={cx(pressable, 'relative', bigButton)}
      >
        {recording && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-[20px] top-[10px] bottom-[60px] rounded-full bg-final blur-[30px]"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1, repeat: Infinity }}
          />
        )}
        <img src="/assets/comic/ui-buzzer.webp" alt="" draggable={false} className="relative size-full object-contain" />
        <span className="absolute inset-x-0 top-[40px] flex justify-center text-card drop-shadow-[4px_5px_0_var(--color-comic-ink)]">
          {recording ? (
            <Square aria-hidden="true" className="size-[80px] fill-card" strokeWidth={3} />
          ) : (
            <Mic aria-hidden="true" className="size-[90px]" strokeWidth={3} />
          )}
        </span>
      </button>

      <p className={inkPill}>
        {recording ? <span data-testid="record-time">{secondsLeft} วินาที</span> : 'กดแล้วอ่านตาม'}
      </p>

      {status === 'ready' && (
        <button type="button" aria-label="ฟังเสียงตัวเอง" onClick={playRecording} className={roundOrange}>
          <Play aria-hidden="true" className="size-[70px] fill-card" strokeWidth={3} />
        </button>
      )}

      <div className="w-[340px] rounded-[32px] bg-card/85 text-[30px] leading-[1.4] has-[p:empty:only-child]:bg-transparent">
        <RecorderMessages />
      </div>
    </div>
  )
}

/** Whole seconds left of MAX_RECORDING_MS while recording. */
function useSecondsLeft(recording: boolean) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!recording) return
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 250)
    return () => {
      clearInterval(id)
      setElapsed(0)
    }
  }, [recording])
  return Math.max(0, Math.ceil((MAX_RECORDING_MS - elapsed) / 1000))
}

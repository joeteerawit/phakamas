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

// Every target here is ≥ 122 stage px: 44 CSS px on a 390px-tall landscape phone.
const roundOrange = `${pressable} flex size-[130px] items-center justify-center rounded-full border-[6px] border-card bg-orange text-card shadow-[0_8px_0_rgb(0_0_0/0.2)]`

/**
 * Step 3 ฟังแล้วอ่านตาม (not in the Canva design; built from its kit on the pond scene, #22).
 * One cream word card at a time, played only on demand; when the clip ends the Mascot says
 * ถึงตาหนูอ่านแล้ว and the red buzzer records the child. Hearing every word earns a star.
 * Positions are stage pixels over the whole stage (data-full-stage).
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
            'absolute top-[210px] left-[750px] flex h-[560px] w-[420px] flex-col items-center justify-center gap-[8px] shadow-[0_12px_0_rgb(0_0_0/0.15)]',
          )}
        >
          <img src={current.image} alt="" width={300} height={300} draggable={false} className="size-[300px] object-contain" />
          <h2 className="text-[110px] leading-[1.4] font-bold">{current.word}</h2>
          <p className="h-[40px] text-[30px] font-semibold">{statusText[status]}</p>
        </motion.div>
      </AnimatePresence>

      <SpeakerButton
        label={heard.has(current.audio.id) ? 'ฟังอีกครั้ง' : 'ฟังเสียง'}
        onClick={listen}
        playing={playing}
        className="top-[180px] left-[1100px] size-[140px] rounded-full"
      />

      <button
        type="button"
        aria-label="คำก่อนหน้า"
        disabled={index === 0}
        onClick={() => goTo(index - 1)}
        className={`${roundOrange} absolute top-[425px] left-[570px]`}
      >
        <ChevronLeft aria-hidden="true" className="size-[80px]" strokeWidth={3} />
      </button>
      <button
        type="button"
        aria-label="คำถัดไป"
        disabled={index === words.length - 1}
        onClick={() => goTo(index + 1)}
        className={`${roundOrange} absolute top-[425px] left-[1220px]`}
      >
        <ChevronRight aria-hidden="true" className="size-[80px]" strokeWidth={3} />
      </button>

      <nav aria-label="ลำดับคำ" className="absolute top-[790px] left-[588px] flex w-[744px] flex-col items-center">
        <p className="rounded-full border-[5px] border-card bg-pill px-[28px] text-[40px] leading-[1.4] font-bold">
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
                className={`${pressable} flex size-[124px] items-center justify-center`}
              >
                <span
                  className={cx(
                    'block rounded-full border-[5px] border-card transition-all duration-200 motion-reduce:transition-none',
                    i === index ? 'size-[48px] bg-navy' : 'size-[32px]',
                    i !== index && (heard.has(item.audio.id) ? 'bg-primary' : 'bg-cream'),
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Recorder />

      <div role="status" aria-live="polite" className="absolute top-[220px] left-[200px] flex w-[340px] flex-col items-center gap-[24px] text-center">
        {yourTurn && (
          <motion.p
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-[8px] rounded-[40px] border-[6px] border-card bg-pill p-[20px] text-[44px] leading-[1.4] font-bold"
          >
            <Mascot decorative className="size-[140px]" />
            ถึงตาหนูอ่านแล้ว
          </motion.p>
        )}
        {complete && (
          <div className={cx(creamCard, 'flex w-full flex-col items-center gap-[12px] p-[20px]')}>
            <motion.span
              initial={reduceMotion ? false : { scale: 0.4, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.5 }}
            >
              <Star aria-hidden="true" className="size-[90px] fill-accent text-on-accent" strokeWidth={2} />
            </motion.span>
            <p className="text-[36px] leading-[1.4] font-bold">ฟังครบ {words.length} คำแล้ว เก่งมาก!</p>
            <button
              type="button"
              onClick={() => goTo(0)}
              className={`${pressable} flex min-h-[124px] items-center gap-[12px] rounded-full border-[6px] border-card bg-orange px-[32px] text-[36px] font-bold text-card`}
            >
              <RotateCcw aria-hidden="true" className="size-[48px]" strokeWidth={3} />
              ฝึกอีกรอบ
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/** Red buzzer (Canva design page 8) to record, the remaining time, and an orange play-back button. */
function Recorder() {
  const status = useRecorder((state) => state.status)
  const reduceMotion = useReducedMotion()
  const recording = status === 'recording'
  const secondsLeft = useSecondsLeft(recording)

  return (
    <div className="absolute top-[240px] left-[1380px] flex w-[340px] flex-col items-center gap-[12px]">
      <button
        type="button"
        aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
        disabled={status === 'requesting'}
        onClick={recording ? stopRecording : () => void startRecording()}
        className={`${pressable} relative h-[242px] w-[280px]`}
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
        <img src="/assets/canva/ui/buzzer.webp" alt="" draggable={false} className="relative size-full object-contain" />
        <span className="absolute inset-x-0 top-[40px] flex justify-center text-card">
          {recording ? (
            <Square aria-hidden="true" className="size-[80px] fill-card" strokeWidth={3} />
          ) : (
            <Mic aria-hidden="true" className="size-[90px]" strokeWidth={3} />
          )}
        </span>
      </button>

      <p className="rounded-full border-[5px] border-card bg-pill px-[28px] text-[40px] leading-[1.4] font-bold">
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

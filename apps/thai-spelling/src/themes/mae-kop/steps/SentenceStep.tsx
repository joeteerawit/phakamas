import { Mic, Play, RotateCcw, Square, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playClip, useAudio, useClipStatus } from '../../../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../../../audio/recorder'
import type { Sentence } from '../../../lessons'
import { splitWords, useKaraokeWord } from '../../../steps/karaoke'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { RecorderMessages } from '../../../ui/RecorderMessages'

// Stage pixels. Two easels side by side (300–900 and 1020–1620) on the painting porch, the finished pictures hung on the
// wall above them (160–300), and the recorder along the bottom (300–1620 × 870–1030), clear of the corner buttons and of
// the drops down the window's sides.
const EASELS = [300, 1020]
const EASEL = { top: 320, width: 600, height: 470 }
const FRAMES = [650, 1070]
const pill = 'relative flex h-[124px] items-center justify-center gap-[12px] px-[30px] text-[38px] font-bold whitespace-nowrap'
const icon = 'relative size-[48px] shrink-0'

/**
 * แม่กบ Step 9, paint the picture (docs/mae-kop-spec.md): each sentence sits under an easel whose canvas shows the
 * sentence's two word pictures as a grey pencil sketch. Tapping an easel chooses it and reads its sentence, the words lit
 * karaoke-style. The student listens, then records the sentence with the shared recorder steps (ลองอ่านเอง → เริ่มบันทึก →
 * หยุดบันทึก → ฟังเสียงตัวเอง / ลองอีกครั้ง). When the recording ends, the sketch fills with colour and the finished
 * picture hangs on the porch wall; two sentences give two pictures. If the microphone is refused, hearing the sentence
 * to its end paints it instead. Under reduced motion the colour appears at once.
 */
export function SentenceStep({ lesson }: StepProps) {
  const { sentences } = lesson
  const [selected, setSelected] = useState(0)
  const [painted, setPainted] = useState<ReadonlySet<number>>(() => new Set())
  const recorderStatus = useRecorder((state) => state.status)
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (recorderStatus === 'denied' || recorderStatus === 'unsupported')) setMicBlocked(true)
  const chosen = useRef(selected)
  const blocked = useRef(micBlocked)
  useEffect(() => {
    chosen.current = selected
    blocked.current = micBlocked
  })

  // A recording ending paints the chosen easel; with the microphone refused, a sentence heard to its end paints it.
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        if (next.status === 'ready' && prev.status === 'recording') setPainted((old) => new Set(old).add(chosen.current))
      }),
    [],
  )
  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        const ended = sentences.findIndex(({ audio }) => audio.id === state.clipId)
        if (ended < 0 || !blocked.current || state.status !== 'idle' || prev.clipId !== state.clipId || prev.status !== 'playing') return
        setPainted((old) => new Set(old).add(ended))
      }),
    [sentences],
  )
  useEffect(() => discardRecording, [])

  const choose = (i: number) => {
    // Another easel throws the old recording away; the same easel just ends it.
    if (i !== selected) discardRecording()
    else stopRecording()
    setSelected(i)
    playClip(sentences[i]!.audio)
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-pond-deep">
      {/* The porch wall, where each finished picture hangs. */}
      <ul aria-label="ภาพที่วาดเสร็จ" className="absolute top-[156px] left-[600px] flex h-[150px] w-[720px] items-center justify-center rounded-[20px] border-[5px] border-mud bg-[repeating-linear-gradient(90deg,#c9a46a_0_40px,#bf9a5f_40px_44px)]">
        {sentences.map((sentence, i) => (
          <li key={sentence.audio.id} className="absolute" style={{ left: FRAMES[i]! - 600, top: 4 }}>
            <WallPicture sentence={sentence} index={i} hung={painted.has(i)} />
          </li>
        ))}
      </ul>

      <ul>
        {sentences.map((sentence, i) => (
          <li key={sentence.audio.id} className="absolute" style={{ left: EASELS[i % EASELS.length], top: EASEL.top, width: EASEL.width, height: EASEL.height }}>
            <Easel sentence={sentence} index={i} selected={i === selected} painted={painted.has(i)} onPlay={() => choose(i)} />
          </li>
        ))}
      </ul>

      <Recorder number={selected + 1} micBlocked={micBlocked} onListen={() => choose(selected)} />
    </section>
  )
}

/** The sentence's two pictures side by side: a grey pencil sketch, with the colour layer swept in once painted. */
function Canvas({ sentence, painted, small = false }: { sentence: Sentence; painted: boolean; small?: boolean }) {
  const still = !!useReducedMotion()
  const size = small ? 'size-[100px]' : 'size-[200px]'
  const row = (className: string) => (
    <span className={cx('absolute inset-0 flex items-center justify-center gap-[16px]', className)}>
      {sentence.images.map((src) => (
        <img key={src} src={src} alt="" draggable={false} className={cx(size, 'object-contain')} />
      ))}
    </span>
  )
  return (
    <>
      <span data-testid="sketch" className="contents">
        {row('[filter:grayscale(1)_contrast(0.7)_brightness(1.15)] opacity-70')}
      </span>
      <motion.span
        data-testid="colour"
        data-painted={painted || undefined}
        className="absolute inset-0"
        initial={false}
        animate={{ clipPath: painted ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
        transition={still || !painted ? { duration: 0 } : { duration: 1.2, ease: 'easeInOut' }}
      >
        {row('')}
      </motion.span>
    </>
  )
}

type EaselProps = { sentence: Sentence; index: number; selected: boolean; painted: boolean; onPlay: () => void }

/** One easel: its canvas, the sentence under it, and the legs it stands on; the whole easel reads the sentence. */
function Easel({ sentence, index, selected, painted, onPlay }: EaselProps) {
  const { card } = useKit()
  const playing = useClipStatus(sentence.audio.id) === 'playing'
  const words = splitWords(sentence.audio.text)
  const current = useKaraokeWord(playing, words.length)

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`ฟังประโยคที่ ${index + 1}: ${sentence.audio.text}${painted ? ' (ระบายสีแล้ว)' : ''}`}
      data-painted={painted || undefined}
      onClick={onPlay}
      className="pointer-events-auto relative block size-full cursor-pointer rounded-[30px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {/* The easel's legs behind its canvas. */}
      <svg aria-hidden="true" viewBox="0 0 600 470" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <path d="M180 60 L110 470 M420 60 L490 470 M300 30 V470" stroke="var(--color-mud)" strokeWidth={16} strokeLinecap="round" />
      </svg>
      <span
        data-testid="easel-canvas"
        data-highlight={selected || undefined}
        className={cx('absolute top-[20px] left-[40px] block h-[270px] w-[520px] overflow-hidden', card)}
      >
        <Canvas sentence={sentence} painted={painted} />
      </span>
      <span className="drop-label absolute top-[318px] left-[10px] flex h-[110px] w-[580px] items-center justify-center text-[52px] leading-[1.3] font-bold text-rubber-deep">
        {words.map((w, i) => (
          <span key={i} data-active={i === current || undefined} className={cx('inline-block rounded-[10px] px-[2px]', i === current && 'bg-raincoat')}>
            {w}
          </span>
        ))}
      </span>
    </button>
  )
}

/** A finished picture hung on the wall in a small frame; an empty hook until its sentence is painted. */
function WallPicture({ sentence, index, hung }: { sentence: Sentence; index: number; hung: boolean }) {
  const still = !!useReducedMotion()
  return (
    <div className="relative h-[136px] w-[230px]">
      <span aria-hidden="true" className="absolute top-[-2px] left-1/2 size-[14px] -translate-x-1/2 rounded-full bg-rubber-deep" />
      <AnimatePresence>
        {hung && (
          <motion.div
            data-testid="wall-picture"
            className="absolute inset-x-0 top-[10px] bottom-0 overflow-hidden rounded-[10px] border-[6px] border-mud bg-card"
            initial={still ? false : { y: -40, rotate: -8, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          >
            <Canvas sentence={sentence} painted small />
            <span className="sr-only">ภาพของประโยคที่ {index + 1}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** ลองอ่านเอง → เริ่มบันทึก → หยุดบันทึก → ฟังเสียงตัวเอง / ลองอีกครั้ง (after confirming), in the แม่กบ Kit. */
function Recorder({ number, micBlocked, onListen }: { number: number; micBlocked: boolean; onListen: () => void }) {
  const { Button } = useKit()
  const status = useRecorder((state) => state.status)
  const [practising, setPractising] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const record = () => {
    setConfirming(false)
    void startRecording()
  }

  return (
    <div className="pointer-events-auto absolute top-[862px] left-[300px] flex h-[176px] w-[1320px] items-center justify-center gap-[20px] rounded-[44px] border-[6px] border-pond-deep bg-pond-light px-[28px]">
      <h2 className="text-[40px] font-bold whitespace-nowrap">บันทึกประโยคที่ {number}</h2>
      <div className="flex items-center gap-[14px]">
        {micBlocked ? (
          <Button className={pill} onClick={onListen}>
            <Play aria-hidden="true" className={icon} strokeWidth={3} />
            <span className="relative">ฟังแล้วระบายสี</span>
          </Button>
        ) : !practising ? (
          <Button className={pill} onClick={() => setPractising(true)}>
            <Mic aria-hidden="true" className={icon} strokeWidth={3} />
            <span className="relative">ลองอ่านเอง</span>
          </Button>
        ) : status === 'recording' ? (
          <Button className={pill} onClick={stopRecording}>
            <Square aria-hidden="true" className={cx(icon, 'fill-current')} strokeWidth={3} />
            <span className="relative">หยุดบันทึก</span>
          </Button>
        ) : status === 'ready' && confirming ? (
          <>
            <p className="text-[32px] font-semibold whitespace-nowrap">อัดทับเสียงเดิมใช่ไหม</p>
            <Button className={pill} onClick={record}>
              <Mic aria-hidden="true" className={icon} strokeWidth={3} />
              <span className="relative">อัดใหม่เลย</span>
            </Button>
            <Button className={pill} onClick={() => setConfirming(false)}>
              <X aria-hidden="true" className={icon} strokeWidth={3} />
              <span className="relative">ยกเลิก</span>
            </Button>
          </>
        ) : status === 'ready' ? (
          <>
            <Button className={pill} onClick={playRecording}>
              <Play aria-hidden="true" className={icon} strokeWidth={3} />
              <span className="relative">ฟังเสียงตัวเอง</span>
            </Button>
            <Button className={pill} onClick={() => setConfirming(true)}>
              <RotateCcw aria-hidden="true" className={icon} strokeWidth={3} />
              <span className="relative">ลองอีกครั้ง</span>
            </Button>
          </>
        ) : (
          <Button className={pill} onClick={record} disabled={status === 'requesting'}>
            <Mic aria-hidden="true" className={icon} strokeWidth={3} />
            <span className="relative">เริ่มบันทึก</span>
          </Button>
        )}
      </div>
      {/* With no message the status line is empty: cancel its gap so the heading and buttons stay centred. */}
      <div className="max-w-[520px] text-[24px] leading-[1.3] has-[p:empty:only-child]:-ms-[20px] [&_[role=alert]]:border-pond-deep [&_[role=alert]]:bg-raincoat-light [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>
    </div>
  )
}

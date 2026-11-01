import { Mic, Play, RotateCcw, Square, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip, useClipStatus } from '../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../audio/recorder'
import type { Sentence } from '../lessons'
import { Button } from './clay/Button'
import { cx } from './clay/buttonClass'
import { RecorderMessages } from './RecorderMessages'
import type { StepProps } from './stepProps'

const icon = 'size-[56px] shrink-0'
// Stage-scale recorder buttons: ≥ 44 CSS px tall on a 360px-tall landscape phone.
const stageButton = 'min-h-[136px]! px-[48px]! text-[44px]!'
/** Karaoke pace: one word every 500 ms while the sentence plays (no word timings in the audio). */
const WORD_MS = 500

// Boards at design DAHZj0Nxyxs page 9 coordinates (stage pixels).
const boards = [
  { left: 452, top: 255 },
  { left: 466, top: 576 },
]

/** Step 9: tapping a board plays only its sentence; the student records the selected one. */
export function SentenceStep({ lesson }: StepProps) {
  const [selected, setSelected] = useState(0)
  useEffect(() => discardRecording, [])

  const choose = (i: number) => {
    // Switching sentence throws the old recording away (and releases the mic); the same board just ends it.
    if (i !== selected) discardRecording()
    else stopRecording()
    setSelected(i)
    playClip(lesson.sentences[i]!.audio)
  }

  return (
    <section data-full-stage className="relative size-full">
      <ul>
        {lesson.sentences.map((sentence, i) => (
          <li key={sentence.audio.id} className="absolute" style={boards[i % boards.length]}>
            <SentenceBoard sentence={sentence} index={i} selected={i === selected} onPlay={() => choose(i)} />
          </li>
        ))}
      </ul>

      <SentenceRecorder number={selected + 1} />
    </section>
  )
}

const words = (text: string) => [...new Intl.Segmenter('th', { granularity: 'word' }).segment(text)].map((s) => s.segment)

/** Index of the word to highlight while `playing`, advancing evenly; -1 when not playing. */
function useKaraoke(playing: boolean, count: number) {
  const [word, setWord] = useState(0)
  useEffect(() => {
    if (!playing) return
    setWord(0)
    const timer = setInterval(() => setWord((w) => Math.min(w + 1, count - 1)), WORD_MS)
    return () => clearInterval(timer)
  }, [playing, count])
  return playing ? word : -1
}

type SentenceBoardProps = { sentence: Sentence; index: number; selected: boolean; onPlay: () => void }

function SentenceBoard({ sentence, index, selected, onPlay }: SentenceBoardProps) {
  const playing = useClipStatus(sentence.audio.id) === 'playing'
  const reduceMotion = useReducedMotion()
  const text = words(sentence.audio.text)
  const current = useKaraoke(playing, text.length)
  const delay = index * 0.35

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={`ฟังประโยคที่ ${index + 1}: ${sentence.audio.text}`}
      onClick={onPlay}
      // Boards slide in from alternate sides.
      initial={reduceMotion ? false : { opacity: 0, x: index % 2 ? 900 : -900 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, x: { delay, type: 'spring', stiffness: 120, damping: 16 }, opacity: { delay, duration: 0.2 } }}
      className={cx(
        'pointer-events-auto relative block h-[285px] w-[934px] cursor-pointer select-none',
        'transition-[filter] duration-150 active:brightness-95 motion-reduce:transition-none',
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
        selected && 'drop-shadow-[0_0_18px_#ffffff]',
      )}
    >
      {/* The inner board bobs while idle, so the button itself stays still for taps. */}
      <motion.span
        className="absolute inset-0 flex items-center justify-center bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/canva/ui/sentence-board.webp)' }}
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ delay: delay + 0.8, duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="-mt-[20px] font-heading text-[102px] leading-[1.4] font-bold text-navy">
          {text.map((word, w) =>
            w === current ? (
              <mark
                key={w}
                className="inline-block scale-110 bg-transparent text-card transition-transform duration-150 motion-reduce:scale-100 motion-reduce:transition-none"
              >
                {word}
              </mark>
            ) : (
              <span key={w} className="inline-block">
                {word}
              </span>
            ),
          )}
        </span>
        <span className="absolute top-1/2 left-[calc(100%+16px)] flex w-max -translate-y-1/2 gap-[8px]">
          {sentence.images.map((src) => (
            <img key={src} src={src} alt="" draggable={false} className="pointer-events-none size-[148px] object-contain" />
          ))}
        </span>
      </motion.span>
    </motion.button>
  )
}

/** ลองอ่านเอง → เริ่มบันทึก → หยุดบันทึก → ฟังเสียงตัวเอง / ลองอีกครั้ง (after confirming). */
function SentenceRecorder({ number }: { number: number }) {
  const status = useRecorder((state) => state.status)
  const [practising, setPractising] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const record = () => {
    setConfirming(false)
    void startRecording()
  }

  return (
    <div className="pointer-events-auto absolute inset-x-[200px] top-[892px] flex h-[152px] items-center justify-center gap-[24px] rounded-full border-[6px] border-card bg-pill/90 px-[32px] text-[36px] text-navy">
      <h2 className="font-heading text-[44px] font-bold whitespace-nowrap">บันทึกประโยคที่ {number}</h2>
      <div className="flex items-center gap-[16px]">
        {!practising ? (
          <Button className={stageButton} onClick={() => setPractising(true)}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            ลองอ่านเอง
          </Button>
        ) : status === 'recording' ? (
          <Button className={stageButton} onClick={stopRecording}>
            <Square aria-hidden="true" className={icon} strokeWidth={2.5} />
            หยุดบันทึก
          </Button>
        ) : status === 'ready' && confirming ? (
          <>
            <p className="font-semibold whitespace-nowrap">อัดทับเสียงเดิมใช่ไหม</p>
            <Button className={stageButton} onClick={record}>
              <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
              อัดใหม่เลย
            </Button>
            <Button className={stageButton} variant="ghost" onClick={() => setConfirming(false)}>
              <X aria-hidden="true" className={icon} strokeWidth={2.5} />
              ยกเลิก
            </Button>
          </>
        ) : status === 'ready' ? (
          <>
            <Button className={stageButton} onClick={playRecording}>
              <Play aria-hidden="true" className={icon} strokeWidth={2.5} />
              ฟังเสียงตัวเอง
            </Button>
            <Button className={stageButton} variant="ghost" onClick={() => setConfirming(true)}>
              <RotateCcw aria-hidden="true" className={icon} strokeWidth={2.5} />
              ลองอีกครั้ง
            </Button>
          </>
        ) : (
          <Button className={stageButton} onClick={record} disabled={status === 'requesting'}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            เริ่มบันทึก
          </Button>
        )}
      </div>

      <div className="max-w-[600px] text-[26px] leading-[1.3]">
        <RecorderMessages />
      </div>
    </div>
  )
}

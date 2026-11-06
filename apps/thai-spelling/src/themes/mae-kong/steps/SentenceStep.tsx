import { Mic, Play, RotateCcw, Square, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { playClip, useClipStatus } from '../../../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../../../audio/recorder'
import type { Sentence } from '../../../lessons'
import { cx, orangeButton } from '../../../ui/clay/buttonClass'
import { splitWords, useKaraokeWord } from '../../../steps/karaoke'
import { popIn } from '../../../ui/motion/PopIn'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import type { StepProps } from '../../../steps/stepProps'

const icon = 'size-[56px] shrink-0'

// Board tops at design DAHZj0Nxyxs page 9 coordinates (stage pixels).
const boardTops = [255, 576]
const BOARD_WIDTH = 934
const PICTURE = 148
const PICTURE_GAP = 8
const PICTURES_OFFSET = 16
/** Left edge that centres a board and its pictures on x = 960 as one group. */
const groupLeft = (pictures: number) =>
  960 - (BOARD_WIDTH + PICTURES_OFFSET + pictures * PICTURE + Math.max(0, pictures - 1) * PICTURE_GAP) / 2

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
          <li
            key={sentence.audio.id}
            className="absolute"
            style={{ top: boardTops[i % boardTops.length], left: groupLeft(sentence.images.length) }}
          >
            <SentenceBoard sentence={sentence} index={i} selected={i === selected} onPlay={() => choose(i)} />
          </li>
        ))}
      </ul>

      <SentenceRecorder number={selected + 1} />
    </section>
  )
}

type SentenceBoardProps = { sentence: Sentence; index: number; selected: boolean; onPlay: () => void }

function SentenceBoard({ sentence, index, selected, onPlay }: SentenceBoardProps) {
  const playing = useClipStatus(sentence.audio.id) === 'playing'
  const reduceMotion = useReducedMotion()
  const text = splitWords(sentence.audio.text)
  const current = useKaraokeWord(playing, text.length)
  // The shared card stagger, plus a slide in from alternate sides.
  const pop = popIn(index, !!reduceMotion)
  const delay = pop.transition.delay

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={`ฟังประโยคที่ ${index + 1}: ${sentence.audio.text}`}
      onClick={onPlay}
      // Boards slide in from alternate sides.
      initial={reduceMotion ? pop.initial : { ...pop.initial, x: index % 2 ? 900 : -900 }}
      animate={{ ...pop.animate, x: 0 }}
      transition={pop.transition}
      className={cx(
        'pointer-events-auto relative block h-[285px] w-[934px] cursor-pointer select-none',
        'transition-[filter] duration-150 active:brightness-95 motion-reduce:transition-none',
        'focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
        selected && 'drop-shadow-[8px_10px_0_var(--color-comic-ink)]',
      )}
    >
      {/* The inner board bobs while idle, so the button itself stays still for taps. */}
      <motion.span
        className="absolute inset-0 flex items-center justify-center bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/comic/ui-banner.webp)' }}
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ delay: delay + 0.8, duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 92px keeps the longest sentence clear of the banner's rounded ends; -mt centres it on the yellow face. */}
        <span className="-mt-[16px] font-heading text-[92px] leading-[1.4] font-bold text-navy">
          {text.map((word, w) =>
            w === current ? (
              <mark
                key={w}
                className="inline-block scale-110 bg-transparent text-card text-inked transition-transform duration-150 motion-reduce:scale-100 motion-reduce:transition-none"
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
        {/* Keep these sizes (and the board's 934px) in step with groupLeft, which centres board + pictures. */}
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
    <div className="pointer-events-auto absolute inset-x-[200px] top-[892px] flex h-[152px] items-center justify-center gap-[24px] rounded-full border-[6px] border-comic-ink bg-pill px-[32px] text-[36px] text-navy shadow-comic">
      <h2 className="font-heading text-[44px] font-bold whitespace-nowrap">บันทึกประโยคที่ {number}</h2>
      <div className="flex items-center gap-[16px]">
        {!practising ? (
          <button type="button" className={orangeButton} onClick={() => setPractising(true)}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            ลองอ่านเอง
          </button>
        ) : status === 'recording' ? (
          <button type="button" className={orangeButton} onClick={stopRecording}>
            <Square aria-hidden="true" className={icon} strokeWidth={2.5} />
            หยุดบันทึก
          </button>
        ) : status === 'ready' && confirming ? (
          <>
            <p className="font-semibold whitespace-nowrap">อัดทับเสียงเดิมใช่ไหม</p>
            <button type="button" className={orangeButton} onClick={record}>
              <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
              อัดใหม่เลย
            </button>
            <button type="button" className={orangeButton} onClick={() => setConfirming(false)}>
              <X aria-hidden="true" className={icon} strokeWidth={2.5} />
              ยกเลิก
            </button>
          </>
        ) : status === 'ready' ? (
          <>
            <button type="button" className={orangeButton} onClick={playRecording}>
              <Play aria-hidden="true" className={icon} strokeWidth={2.5} />
              ฟังเสียงตัวเอง
            </button>
            <button type="button" className={orangeButton} onClick={() => setConfirming(true)}>
              <RotateCcw aria-hidden="true" className={icon} strokeWidth={2.5} />
              ลองอีกครั้ง
            </button>
          </>
        ) : (
          <button type="button" className={orangeButton} onClick={record} disabled={status === 'requesting'}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            เริ่มบันทึก
          </button>
        )}
      </div>

      {/* With no message the status line is empty: cancel its gap so the heading and buttons stay centred. */}
      <div className="max-w-[600px] text-[26px] leading-[1.3] has-[p:empty:only-child]:-ms-[24px]">
        <RecorderMessages />
      </div>
    </div>
  )
}

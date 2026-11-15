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
import { ink } from '../kit/ink'
import { NgobArt } from '../kit/parts'
import { StallKeeper } from './StallKeeper'

// Stage pixels. The pier beam across the top (170–196), two bamboo signs hung from it side by side (330–930 and
// 990–1590 × 230–600), the canal under them where each sign's noodle boat comes up (640–860), and the recorder along
// the bottom (330–1590 × 880–1040), clear of the corner controls and of the lotus pads down the window's sides.
const SIGNS = [330, 990]
const SIGN = { top: 230, width: 600, height: 370 }
const NOODLE = { top: 630, width: 380, height: 230, from: 760 }
const button = 'relative flex h-[124px] items-center justify-center gap-[12px] px-[30px] text-[36px] font-bold whitespace-nowrap'
const icon = 'relative size-[46px] shrink-0'

/**
 * แม่กน Step 9, read the order (docs/mae-kon-spec.md), at the noodle-boat pier over the quiet canal. Each sentence is
 * written on a bamboo sign hung from the pier beam, with its two pictures. Tapping a sign chooses it and reads its
 * sentence with the words lit karaoke-style. The student records, plays back and re-records as on แม่กง, with the shared
 * recorder (ลองอ่านเอง → เริ่มบันทึก → หยุดบันทึก → ฟังเสียงตัวเอง / ลองอีกครั้ง). After the first playback of a sign's
 * reading, its noodle boat paddles up beside it, clear of the words, its vendor waves, and the sign gets a งอบ stamp;
 * each sign keeps its own boat and stamp. If the microphone is refused, hearing the sentence to its end counts instead.
 * Under reduced motion the noodle boat is simply there.
 */
export function SentenceStep({ lesson }: StepProps) {
  const { sentences } = lesson
  const [selected, setSelected] = useState(0)
  const [served, setServed] = useState<ReadonlySet<number>>(() => new Set())
  const serve = (i: number) => setServed((old) => (old.has(i) ? old : new Set(old).add(i)))
  const recorderStatus = useRecorder((state) => state.status)
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (recorderStatus === 'denied' || recorderStatus === 'unsupported')) setMicBlocked(true)
  const blocked = useRef(micBlocked)
  useEffect(() => {
    blocked.current = micBlocked
  })

  // With the microphone refused, a sentence heard to its end brings its boat.
  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        const ended = sentences.findIndex(({ audio }) => audio.id === state.clipId)
        if (ended < 0 || !blocked.current || state.status !== 'idle' || prev.clipId !== state.clipId || prev.status !== 'playing') return
        serve(ended)
      }),
    [sentences],
  )
  useEffect(() => discardRecording, [])

  const choose = (i: number) => {
    // Another sign throws the old recording away; the same sign just ends it.
    if (i !== selected) discardRecording()
    else stopRecording()
    setSelected(i)
    playClip(sentences[i]!.audio)
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-kon-ink">
      {/* The pier beam the signs hang from. */}
      <span aria-hidden="true" data-testid="pier-beam" className="pointer-events-none absolute top-[170px] left-[310px] h-[26px] w-[1300px] rounded-[10px] border-[5px] border-kon-ink bg-teak-deep" />

      <ul>
        {sentences.map((sentence, i) => (
          <li key={sentence.audio.id} className="absolute" style={{ left: SIGNS[i % SIGNS.length], top: SIGN.top, width: SIGN.width, height: SIGN.height }}>
            <BambooSign sentence={sentence} index={i} selected={i === selected} stamped={served.has(i)} onPlay={() => choose(i)} />
          </li>
        ))}
      </ul>

      {sentences.map((sentence, i) => (
        <NoodleBoat key={sentence.audio.id} index={i} here={served.has(i)} />
      ))}

      <Recorder number={selected + 1} onPlayBack={() => serve(selected)} />
    </section>
  )
}

type BambooSignProps = { sentence: Sentence; index: number; selected: boolean; stamped: boolean; onPlay: () => void }

/** One bamboo sign hung from the beam: its two pictures and its sentence (the sign is the button), and its งอบ stamp. */
function BambooSign({ sentence, index, selected, stamped, onPlay }: BambooSignProps) {
  const still = !!useReducedMotion()
  const playing = useClipStatus(sentence.audio.id) === 'playing'
  const words = splitWords(sentence.audio.text)
  const current = useKaraokeWord(playing, words.length)

  return (
    <>
      {/* The two cords from the beam. */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-[40px] right-[90px] left-[90px] h-[44px] border-x-[5px] border-kon-ink" />
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`ฟังประโยคที่ ${index + 1}: ${sentence.audio.text}${stamped ? ' (ได้ตราแล้ว)' : ''}`}
        onClick={onPlay}
        data-testid="bamboo-sign"
        data-highlight={selected || undefined}
        className={cx(
          'pointer-events-auto absolute inset-0 cursor-pointer rounded-[30px] border-[6px] border-kon-ink select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring',
          'bg-[repeating-linear-gradient(90deg,#f3dfa9_0_36px,var(--color-bamboo)_36px_40px,#e2c47f_40px_42px)] shadow-[0_10px_0_rgb(43_29_18/0.4)]',
          selected && 'outline-[8px] outline-marigold',
        )}
      >
        <span className="absolute inset-x-0 top-[20px] flex justify-center gap-[24px]">
          {sentence.images.map((src) => (
            <img key={src} src={src} alt="" draggable={false} className="pointer-events-none size-[150px] object-contain" />
          ))}
        </span>
        <span className="absolute inset-x-[20px] top-[186px] text-center text-[60px] leading-[1.4] font-bold text-balance">
          {words.map((word, w) => (
            <span key={w} data-active={w === current || undefined} className={cx('inline-block rounded-[12px]', w === current && 'bg-marigold')}>
              {word}
            </span>
          ))}
        </span>
      </button>
      {stamped && (
        <motion.span
          data-testid="sign-stamp"
          aria-hidden="true"
          className="pointer-events-none absolute top-[8px] right-[8px] block h-[80px] w-[100px] rounded-[16px] border-[4px] border-coral-deep bg-card/80 p-[4px]"
          initial={still ? false : { scale: 1.8, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 8, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          <NgobArt colour="var(--color-coral)" />
        </motion.span>
      )}
    </>
  )
}

/** A sign's noodle boat: a steaming pot and a waving vendor, paddling up under its sign from the window's side. */
function NoodleBoat({ index, here }: { index: number; here: boolean }) {
  const still = !!useReducedMotion()
  const left = SIGNS[index]! + (SIGN.width - NOODLE.width) / 2
  const from = (index % 2 ? 1 : -1) * NOODLE.from
  return (
    <AnimatePresence>
      {here && (
        <motion.div
          data-testid="noodle-boat"
          data-sign={index}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ left, top: NOODLE.top, width: NOODLE.width, height: NOODLE.height }}
          initial={still ? false : { x: from }}
          animate={{ x: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          <StallKeeper waving shirt="var(--color-coral)" className="absolute top-[0px] left-[220px] h-[150px] w-[100px]" />
          <svg viewBox="0 0 380 230" className="absolute inset-0 size-full overflow-visible">
            {/* The noodle pot and its steam. */}
            <path d="M80 112 Q78 92 96 86 Q86 70 100 56 M120 112 Q118 92 136 86 Q126 70 140 56" fill="none" stroke="var(--color-card)" strokeWidth={7} strokeLinecap="round" />
            <rect x="60" y="112" width="110" height="60" rx="14" fill="var(--color-rubber)" {...ink} />
            <path d="M6 150 Q190 186 374 146 L330 222 Q190 240 50 222 Z" fill="var(--color-coral)" {...ink} />
            <path d="M30 170 Q190 204 350 166" fill="none" stroke="var(--color-coral-deep)" strokeWidth={5} />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** The recorder along the bottom, as on แม่กง: ลองอ่านเอง → เริ่มบันทึก → หยุดบันทึก → ฟังเสียงตัวเอง / ลองอีกครั้ง (after confirming). */
function Recorder({ number, onPlayBack }: { number: number; onPlayBack: () => void }) {
  const { Button } = useKit()
  const status = useRecorder((state) => state.status)
  const [practising, setPractising] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const record = () => {
    setConfirming(false)
    void startRecording()
  }

  return (
    <div className="absolute top-[880px] left-[330px] flex h-[160px] w-[1260px] items-center justify-center gap-[22px] rounded-[40px] border-[6px] border-kon-ink bg-honey-light/95 px-[28px] text-[32px] shadow-[0_8px_0_rgb(43_29_18/0.4)]">
      <h2 className="text-[40px] font-bold whitespace-nowrap">อ่านประโยคที่ {number}</h2>
      <div className="flex items-center gap-[14px]">
        {!practising ? (
          <Button className={button} onClick={() => setPractising(true)}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            <span className="relative">ลองอ่านเอง</span>
          </Button>
        ) : status === 'recording' ? (
          <Button className={button} onClick={stopRecording}>
            <Square aria-hidden="true" className={cx(icon, 'fill-current')} strokeWidth={2.5} />
            <span className="relative">หยุดบันทึก</span>
          </Button>
        ) : status === 'ready' && confirming ? (
          <>
            <p className="font-semibold whitespace-nowrap">อัดทับเสียงเดิมใช่ไหม</p>
            <Button className={button} onClick={record}>
              <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
              <span className="relative">อัดใหม่เลย</span>
            </Button>
            <Button className={button} onClick={() => setConfirming(false)}>
              <X aria-hidden="true" className={icon} strokeWidth={2.5} />
              <span className="relative">ยกเลิก</span>
            </Button>
          </>
        ) : status === 'ready' ? (
          <>
            <Button
              className={button}
              onClick={() => {
                playRecording()
                onPlayBack()
              }}
            >
              <Play aria-hidden="true" className={cx(icon, 'fill-current')} strokeWidth={2.5} />
              <span className="relative">ฟังเสียงตัวเอง</span>
            </Button>
            <Button className={button} onClick={() => setConfirming(true)}>
              <RotateCcw aria-hidden="true" className={icon} strokeWidth={2.5} />
              <span className="relative">ลองอีกครั้ง</span>
            </Button>
          </>
        ) : (
          <Button className={button} onClick={record} disabled={status === 'requesting'}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            <span className="relative">เริ่มบันทึก</span>
          </Button>
        )}
      </div>
      {/* With no message the status line is empty: cancel its gap so the heading and buttons stay centred. */}
      <div className="max-w-[460px] text-[24px] leading-[1.3] has-[p:empty:only-child]:-ms-[22px] [&_[role=alert]]:border-kon-ink [&_[role=alert]]:bg-card [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>
    </div>
  )
}

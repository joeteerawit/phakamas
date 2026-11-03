import { ChevronLeft, ChevronRight, ListOrdered, Mic, Play, RotateCcw, Square, Volume2, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playClip, stopAudio, useAudio } from '../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../audio/recorder'
import type { RhymeLine } from '../lessons/types'
import { cx } from './clay/buttonClass'
import { splitWords, useKaraokeWord } from './karaoke'
import { RecorderMessages } from './RecorderMessages'
import type { StepProps } from './stepProps'

// 200 px columns centred 660 px either side of x = 960; the 40 px gap keeps the rows level on both sides.
const sideColumn = 'absolute top-[260px] flex w-[200px] flex-col items-center gap-[40px]'

/**
 * Step 7 (design page 7): the rhyme on the swaying signboard in the pond. ฟังครูอ่าน plays every line in
 * order; step mode (or tapping a line) plays one line; the playing line's words light up karaoke-style.
 */
export function RhymeStep({ lesson }: StepProps) {
  const lines = lesson.rhyme
  // Step mode's selected line; null outside step mode.
  const [stepLine, setStepLine] = useState<number | null>(null)
  // Index of the line ฟังครูอ่าน is on; when that line ends, the next one plays.
  const sequence = useRef<number | null>(null)
  // The line หยุดเสียง paused ฟังครูอ่าน on; the next ฟังครูอ่าน resumes there.
  const paused = useRef<number | null>(null)
  const reduceMotion = useReducedMotion()

  const audio = useAudio()
  const playingIndex = lines.findIndex((line) => line.id === audio.clipId)
  const busy = playingIndex >= 0 && (audio.status === 'loading' || audio.status === 'playing')
  const highlighted = stepLine ?? (busy ? playingIndex : null)

  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        const i = sequence.current
        // A clip "ends" when it goes idle without being stopped (stop clears clipId).
        if (i === null || state.clipId !== lines[i]?.id || state.status !== 'idle' || prev.clipId !== state.clipId) return
        const next = lines[i + 1]
        sequence.current = next ? i + 1 : null
        if (next) playClip(next)
      }),
    [lines],
  )
  useEffect(() => discardRecording, [])

  // Teacher audio never plays into a recording (as on Step 9): stop it first.
  const playAll = () => {
    stopRecording()
    const start = paused.current ?? 0
    paused.current = null
    setStepLine(null)
    sequence.current = start
    playClip(lines[start]!)
  }
  const goToLine = (i: number) => {
    stopRecording()
    paused.current = null
    sequence.current = null
    setStepLine(i)
    playClip(lines[i]!)
  }
  // Pause keeps AudioManager's one-sound rule: stop the clip, remember the line here.
  const pause = () => {
    paused.current = sequence.current
    sequence.current = null
    stopAudio()
  }

  return (
    <section data-full-stage className="absolute inset-0 *:pointer-events-auto">
      {/* Comic signboard on its posts (972×1009 art), swaying around the post base, which stays on the stage. */}
      <motion.div
        data-testid="rhyme-sign"
        className="absolute top-[100px] left-[490px] h-[975px] w-[939px] origin-bottom bg-contain bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/comic/ui-signboard.webp)' }}
        animate={reduceMotion ? undefined : { rotate: [-1.5, 1.5] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      >
        {/* The lines fill the board (56–546 px down the sign); 52px keeps both columns inside its ragged edges. */}
        <ol
          aria-label="บทคล้องจอง"
          className="absolute inset-x-[40px] top-[56px] grid h-[490px] grid-cols-[auto_auto] content-center justify-center gap-x-[32px] text-[52px]"
        >
          {lines.map((line, i) => (
            <li key={line.id} aria-current={i === highlighted} className={i % 2 ? 'justify-self-start' : 'justify-self-end'}>
              <button
                type="button"
                onClick={() => goToLine(i)}
                className="min-h-[124px] rounded-[24px] px-[8px] font-heading leading-[1.4] font-bold whitespace-nowrap focus-visible:outline-8 focus-visible:outline-ring"
              >
                <LineWords line={line} playing={playingIndex === i && audio.status === 'playing'} reduceMotion={!!reduceMotion} />
              </button>
            </li>
          ))}
        </ol>
      </motion.div>

      {playingIndex >= 0 && audio.status === 'error' && (
        <p role="status" className="absolute top-[150px] left-1/2 -translate-x-1/2 rounded-full border-[5px] border-comic-ink bg-pill px-[32px] shadow-comic font-heading text-[36px] font-semibold whitespace-nowrap text-navy">
          เปิดเสียงไม่ได้ กด “ฟังครูอ่าน” เพื่อลองอีกครั้ง
        </p>
      )}

      {/* Two buttons each side of the board, mirrored about x = 960 in shared rows: listening on the left,
          หยุดเสียง then the recorder on the right (still the reading and tab order). */}
      <div className={cx(sideColumn, 'left-[200px]')}>
        <RoundButton label="ฟังครูอ่าน" icon={Volume2} onClick={playAll} tone="bg-orange" large />
        <RoundButton label="อ่านตามทีละวรรค" icon={ListOrdered} onClick={() => goToLine(stepLine ?? 0)} />
      </div>
      <div className={cx(sideColumn, 'left-[1520px]')}>
        <RoundButton label="หยุดเสียง" icon={Square} onClick={pause} disabled={!busy} />
        <RecorderControls />
      </div>

      {stepLine !== null && (
        <div className="absolute top-[790px] left-[760px] flex gap-[140px]">
          <RoundButton label="วรรคก่อนหน้า" icon={ChevronLeft} onClick={() => goToLine(stepLine - 1)} disabled={stepLine === 0} />
          <RoundButton
            label="วรรคถัดไป"
            icon={ChevronRight}
            onClick={() => goToLine(stepLine + 1)}
            disabled={stepLine === lines.length - 1}
          />
        </div>
      )}
    </section>
  )
}

/** One rhyme line as words: rhyme words in red, the karaoke word lit while the line plays. */
function LineWords({ line, playing, reduceMotion }: { line: RhymeLine; playing: boolean; reduceMotion: boolean }) {
  const words = splitWords(line.text)
  const current = useKaraokeWord(playing, words.length)
  return words.map((word, i) => {
    const rhyme = line.rhymeWords.includes(word)
    const active = i === current
    return (
      <motion.span
        key={i}
        data-active={active}
        className={cx(
          'inline-block rounded-[16px] transition-colors duration-150',
          rhyme ? 'text-final' : 'text-navy',
          active && 'bg-tint-yellow',
        )}
        animate={{ scale: active && rhyme && !reduceMotion ? 1.15 : 1 }}
      >
        {word}
      </motion.span>
    )
  })
}

type RoundButtonProps = {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  /** Circle colour class. */
  tone?: string
  large?: boolean
}

/**
 * A round icon button in stage pixels with its caption underneath; ≥ 122 stage px stays ≥ 44 CSS px on a 390px-tall phone.
 * The circle sits in a 150 px box whatever its size, so circles and captions line up across a row.
 * Disabled, it turns cream with a faded icon but keeps its ink outline and caption, so it stays recognisable.
 */
function RoundButton({ label, icon: Icon, onClick, disabled, tone = 'bg-pill', large }: RoundButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-[6px] transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 motion-reduce:transition-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <span className="flex h-[150px] items-center">
        <span
          className={cx(
            'flex items-center justify-center rounded-full border-[6px] border-comic-ink text-navy shadow-comic group-disabled:bg-cream',
            tone,
            large ? 'size-[150px]' : 'size-[124px]',
          )}
        >
          <Icon aria-hidden="true" className={cx(large ? 'size-[80px]' : 'size-[64px]', 'group-disabled:opacity-35')} strokeWidth={2.5} />
        </span>
      </span>
      <span className="rounded-full border-4 border-comic-ink bg-pill px-[16px] font-heading text-[28px] leading-[1.5] font-bold whitespace-nowrap text-navy group-disabled:bg-cream">
        {label}
      </span>
    </button>
  )
}

/** ลองอ่านเอง → หยุดบันทึก → ฟังเสียงตัวเอง / อัดใหม่, under หยุดเสียง on the right of the pond. */
function RecorderControls() {
  const status = useRecorder((state) => state.status)

  return (
    <div className="contents font-heading text-[28px] text-navy">
      {status === 'recording' ? (
        <RoundButton label="หยุดบันทึก" icon={Square} onClick={stopRecording} tone="bg-red" />
      ) : status === 'ready' ? (
        <>
          <RoundButton label="ฟังเสียงตัวเอง" icon={Play} onClick={playRecording} tone="bg-hill" />
          <RoundButton label="อัดใหม่" icon={RotateCcw} onClick={discardRecording} />
        </>
      ) : (
        <RoundButton label="ลองอ่านเอง" icon={Mic} onClick={() => void startRecording()} disabled={status === 'requesting'} tone="bg-hill" />
      )}

      <RecorderMessages />
    </div>
  )
}

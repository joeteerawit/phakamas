import { ChevronLeft, ChevronRight, ListOrdered, Mic, Play, RotateCcw, Square, Volume2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playClip, stopAudio, useAudio } from '../../../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../../../audio/recorder'
import type { RhymeLine } from '../../../lessons/types'
import { splitWords, useKaraokeWord } from '../../../steps/karaoke'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { NgobArt } from '../kit/parts'

// Stage pixels. The four panels stand on the comic pier as a 2×2 page (330–950 and 970–1590; 160–460 and 560–860),
// all clear of the lotus pads down the window's sides. Under each row runs the canal lane where น้องส้ม's boat waits
// (460–560 and 860–952), below the panel's bubble and picture. ฟังครูอ่าน and the line steps sit in the top bar by
// the Step badge; the recorder and its messages along the bottom (956–1076), between Back and Next.
const PANEL = { width: 620, height: 300 }
const PANELS = [
  { left: 330, top: 160 },
  { left: 970, top: 160 },
  { left: 330, top: 560 },
  { left: 970, top: 560 },
]
const BOAT = { width: 70, height: 92 }
const boatAt = (i: number) => ({ x: PANELS[i]!.left + PANEL.width / 2 - BOAT.width / 2, y: PANELS[i]!.top + PANEL.height + 2 })
const control = 'absolute flex h-[124px] items-center justify-center gap-[10px] px-[30px] font-heading text-[34px] font-bold whitespace-nowrap'

/**
 * แม่กน Step 7, paddle through the comic (docs/mae-kon-spec.md), over the quiet canal: the four panels of the comic,
 * each its picture with its line in a speech bubble at the top. น้องส้ม's boat waits in the lane below the panel being
 * read, never over its bubble. ฟังครูอ่าน reads the lines in turn with the words lit karaoke-style and the แม่กน words in
 * red, and the boat paddles on to the next panel between lines; tapping a bubble reads just that line. อ่านตามทีละวรรค
 * walks one line at a time; recording and playing back work as on แม่กง, with the shared recorder. Each panel heard to
 * its end, or read by the child (a recording made on its line), gets a small งอบ stamp in its corner. Under reduced
 * motion the boat jumps from panel to panel.
 */
export function RhymeStep({ lesson }: StepProps) {
  const lines = lesson.rhyme
  const { Button, Star } = useKit()
  const { poses } = useMascot()
  const still = !!useReducedMotion()
  // Step mode's line; null outside step mode.
  const [stepLine, setStepLine] = useState<number | null>(null)
  // The line last read or tapped: where the boat waits, and the line a recording is for.
  const [at, setAt] = useState(0)
  const [stamped, setStamped] = useState<ReadonlySet<number>>(() => new Set())
  const stamp = (i: number) => setStamped((old) => (old.has(i) ? old : new Set(old).add(i)))
  // The line ฟังครูอ่าน is on; when it ends, the next one plays.
  const sequence = useRef<number | null>(null)
  // ฟังครูอ่าน is reading the lines in turn (its button reads หยุดอ่าน meanwhile).
  const [readingAll, setReadingAll] = useState(false)
  const atRef = useRef(at)
  useEffect(() => {
    atRef.current = at
  }, [at])

  const audio = useAudio()
  const playingIndex = lines.findIndex((line) => line.id === audio.clipId)
  const busy = playingIndex >= 0 && (audio.status === 'loading' || audio.status === 'playing')
  const recorder = useRecorder((state) => state.status)

  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        // A line "ends" when it goes idle on its own (stop clears clipId): that panel is heard.
        const ended = lines.findIndex((line) => line.id === state.clipId)
        if (ended < 0 || state.status !== 'idle' || prev.clipId !== state.clipId || prev.status !== 'playing') return
        stamp(ended)
        if (sequence.current !== ended) return
        const next = lines[ended + 1]
        sequence.current = next ? ended + 1 : null
        if (next) {
          setAt(ended + 1)
          playClip(next)
        } else setReadingAll(false)
      }),
    [lines],
  )
  // A recording finished on a line: the child has read that panel.
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        if (next.status === 'ready' && next.url && next.url !== prev.url) stamp(atRef.current)
      }),
    [],
  )
  useEffect(() => discardRecording, [])

  // Teacher audio never plays into a recording (as on Step 9): stop it first.
  const playAll = () => {
    stopRecording()
    setStepLine(null)
    sequence.current = 0
    setReadingAll(true)
    setAt(0)
    playClip(lines[0]!)
  }
  const stopAll = () => {
    sequence.current = null
    setReadingAll(false)
    stopAudio()
  }
  const goToLine = (i: number) => {
    stopRecording()
    sequence.current = null
    setReadingAll(false)
    setStepLine(i)
    setAt(i)
    playClip(lines[i]!)
  }
  const playLine = (i: number) => {
    stopRecording()
    sequence.current = null
    setReadingAll(false)
    if (stepLine !== null) setStepLine(i)
    setAt(i)
    playClip(lines[i]!)
  }
  const boat = boatAt(at)

  return (
    <section data-full-stage className="relative size-full font-heading text-kon-ink">
      {/* In the top bar, between the title and the Step badge, and right of the badge. */}
      <Button onClick={readingAll ? stopAll : playAll} className={cx(control, 'top-[28px] left-[455px] w-[360px] text-[38px]')}>
        {readingAll ? (
          <Square aria-hidden="true" className="relative size-[44px] shrink-0 fill-current" strokeWidth={3} />
        ) : (
          <Volume2 aria-hidden="true" className="relative size-[52px] shrink-0" strokeWidth={3} />
        )}
        <span className="relative">{readingAll ? 'หยุดอ่าน' : 'ฟังครูอ่าน'}</span>
      </Button>
      {stepLine === null ? (
        <Button onClick={() => goToLine(0)} className={cx(control, 'top-[28px] left-[1120px] w-[440px]')}>
          <ListOrdered aria-hidden="true" className="relative size-[48px] shrink-0" strokeWidth={3} />
          <span className="relative">อ่านตามทีละวรรค</span>
        </Button>
      ) : (
        <nav aria-label="อ่านทีละวรรค" className="absolute top-[28px] left-[1110px] flex items-center gap-[12px]">
          <Button aria-label="วรรคก่อนหน้า" disabled={stepLine === 0} onClick={() => goToLine(stepLine - 1)} className="relative flex size-[124px] items-center justify-center">
            <ChevronLeft aria-hidden="true" className="relative size-[70px]" strokeWidth={3} />
          </Button>
          <p className="bamboo-label px-[22px] text-[34px] leading-[1.6] font-bold whitespace-nowrap">
            วรรค {stepLine + 1}/{lines.length}
          </p>
          <Button
            aria-label="วรรคถัดไป"
            disabled={stepLine === lines.length - 1}
            onClick={() => goToLine(stepLine + 1)}
            className="relative flex size-[124px] items-center justify-center"
          >
            <ChevronRight aria-hidden="true" className="relative size-[70px]" strokeWidth={3} />
          </Button>
        </nav>
      )}

      <ol aria-label={`การ์ตูน${lesson.finalGroup}`}>
        {lines.map((line, i) => (
          <li key={line.id}>
            <Panel
              line={line}
              index={i}
              stamped={stamped.has(i)}
              current={(stepLine ?? (busy ? playingIndex : null)) === i}
              playing={playingIndex === i && audio.status === 'playing'}
              still={still}
              onPlay={() => playLine(i)}
            />
          </li>
        ))}
      </ol>

      {/* น้องส้ม's boat in the lane under the panel being read; it paddles along to the next one. */}
      <motion.img
        data-testid="comic-boat"
        data-at={at}
        src={poses.greet}
        alt=""
        draggable={false}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 object-contain select-none"
        style={{ width: BOAT.width, height: BOAT.height }}
        initial={false}
        animate={{ x: boat.x, y: boat.y }}
        transition={still ? { duration: 0 } : { duration: 0.9, ease: 'easeInOut' }}
      />

      {/* Along the bottom: the recorder's messages and the count, then the recorder as on แม่กง. */}
      <div className="absolute top-[956px] left-[330px] flex h-[124px] w-[620px] items-center gap-[16px] text-[26px] leading-[1.3] [&_[role=alert]]:border-kon-ink [&_[role=alert]]:bg-honey-light [&_[role=alert]]:py-[2px] [&_[role=alert]]:shadow-none">
        <p data-testid="stamp-count" className="bamboo-label flex shrink-0 items-center gap-[8px] px-[20px] text-[32px] leading-[1.6] font-bold whitespace-nowrap">
          {stamped.size === lines.length ? (
            <>
              <span className="text-[38px] leading-none">
                <Star />
              </span>
              เก่งมาก! ครบ {lines.length} ภาพ
            </>
          ) : (
            `ประทับตราแล้ว ${stamped.size}/${lines.length}`
          )}
        </p>
        <div className="min-w-0 flex-1">
          <RecorderMessages />
        </div>
      </div>
      <div className="absolute top-[956px] left-[980px] flex w-[610px] justify-end gap-[14px]">
        {recorder === 'recording' ? (
          <Button onClick={stopRecording} className={cx(control, 'relative')}>
            <Square aria-hidden="true" className="relative size-[40px] shrink-0 fill-current" strokeWidth={3} />
            <span className="relative">หยุดบันทึก</span>
          </Button>
        ) : recorder === 'ready' ? (
          <>
            <Button onClick={playRecording} className={cx(control, 'relative')}>
              <Play aria-hidden="true" className="relative size-[40px] shrink-0 fill-current" strokeWidth={3} />
              <span className="relative">ฟังเสียงตัวเอง</span>
            </Button>
            <Button onClick={discardRecording} className={cx(control, 'relative')}>
              <RotateCcw aria-hidden="true" className="relative size-[40px] shrink-0" strokeWidth={3} />
              <span className="relative">อัดใหม่</span>
            </Button>
          </>
        ) : (
          <Button onClick={() => {
              sequence.current = null
              setReadingAll(false)
              void startRecording()
            }} disabled={recorder === 'requesting'} className={cx(control, 'relative')}>
            <Mic aria-hidden="true" className="relative size-[44px] shrink-0 text-coral-deep" strokeWidth={3} />
            <span className="relative">ลองอ่านเอง</span>
          </Button>
        )}
      </div>
    </section>
  )
}

type PanelProps = {
  line: RhymeLine
  index: number
  stamped: boolean
  /** ฟังครูอ่าน or step mode is on this line now. */
  current: boolean
  playing: boolean
  still: boolean
  onPlay: () => void
}

/** One comic panel on the pier: its picture, its line in a speech bubble (a button that reads it), and its งอบ stamp. */
function Panel({ line, index, stamped, current, playing, still, onPlay }: PanelProps) {
  const { card } = useKit()
  const { left, top } = PANELS[index]!
  return (
    <div
      data-testid="comic-panel"
      data-current={current || undefined}
      data-highlight={current || undefined}
      className={cx('absolute overflow-hidden', card)}
      style={{ left, top, width: PANEL.width, height: PANEL.height }}
    >
      {line.panel && <img src={line.panel} alt="" draggable={false} className="pointer-events-none absolute inset-x-0 bottom-0 h-[160px] w-full object-contain" />}
      <button
        type="button"
        onClick={onPlay}
        className="pointer-events-auto absolute inset-x-[10px] top-[8px] min-h-[124px] cursor-pointer rounded-[36px] border-[5px] border-kon-ink bg-card px-[18px] py-[6px] text-left select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <span className="text-[40px] leading-[1.45] font-bold">
          <LineWords line={line} playing={playing} still={still} />
        </span>
      </button>
      {stamped && (
        <motion.span
          data-testid="panel-stamp"
          aria-hidden="true"
          className="pointer-events-none absolute right-[8px] bottom-[6px] block h-[70px] w-[90px] rounded-[16px] border-[4px] border-coral-deep bg-card/80 p-[4px]"
          initial={still ? false : { scale: 1.8, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          <NgobArt colour="var(--color-coral)" />
        </motion.span>
      )}
      {stamped && <span className="sr-only"> (ได้ตราแล้ว)</span>}
    </div>
  )
}

/** One line as words: the แม่กน words in red, the karaoke word lit while the line plays. */
function LineWords({ line, playing, still }: { line: RhymeLine; playing: boolean; still: boolean }) {
  const words = splitWords(line.text)
  const current = useKaraokeWord(playing, words.length)
  return words.map((word, i) => {
    const target = line.rhymeWords.includes(word)
    const active = i === current
    return (
      <motion.span
        key={i}
        data-active={active}
        data-target={target || undefined}
        className={cx('inline-block rounded-[12px] transition-colors duration-150 motion-reduce:transition-none', target ? 'text-coral-deep' : 'text-kon-ink', active && 'bg-marigold/60')}
        animate={{ scale: active && target && !still ? 1.12 : 1 }}
      >
        {word}
      </motion.span>
    )
  })
}

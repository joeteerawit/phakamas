import { Check, Mic, Play, Square } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playClip, useAudio, useClipStatus } from '../../../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../../../audio/recorder'
import type { AudioClip, Lesson, RhymeLine } from '../../../lessons/types'
import { splitWords, useKaraokeWord } from '../../../steps/karaoke'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { ink } from '../kit/ink'

// Stage pixels. The bamboo trellis has two rails (y = 236 and 646), each holding two 740×370 panels on wooden pegs
// (200–940 and 980–1720); the bean vine grows along the top rail, above the panels (160–236). The recorder's messages
// sit in the top bar between the title and the Step badge, the read count right of the badge.
const RAILS = [236, 646]
const PANEL = { width: 740, height: 370, columns: [200, 980] }
const label = 'kraft-label px-[22px] font-heading leading-[1.4] font-bold whitespace-nowrap text-soil-deep'

/** Each word of the Lesson that has its own clip, by its text. */
const wordClips = (lesson: Lesson) => {
  const clips = new Map<string, AudioClip>()
  for (const { word, audio } of [...lesson.vocabulary, ...lesson.wordSelection.choices]) clips.set(word, audio)
  return clips
}

/**
 * แม่กก Step 7, the comic on the trellis (docs/mae-kok-spec.md): the four panels hang face down from a bamboo trellis on
 * wooden pegs. Tapping a panel turns it face up and the teacher's voice reads its line, its words lit karaoke-style; the
 * แม่กก words stay terracotta, and tapping one plays that word alone. Each panel can record its line and play it back
 * through the one shared Recorder, kept to its own panel. A panel counts as read once its line has been heard to the
 * end or recorded; when all four are read, a bean vine grows along the top of the trellis, above the panels. There is
 * no word collecting. Under reduced motion the panels simply show face up and the vine simply stands grown.
 */
export function ComicStep({ lesson }: StepProps) {
  const lines = lesson.rhyme
  const clips = wordClips(lesson)
  const { Star } = useKit()
  const still = !!useReducedMotion()
  const [turned, setTurned] = useState<ReadonlySet<number>>(() => new Set())
  const [read, setRead] = useState<ReadonlySet<number>>(() => new Set())
  // The panel the Recorder is working for: recording now, or holding its take.
  const [recorderPanel, setRecorderPanel] = useState<number | null>(null)
  const panelRef = useRef(recorderPanel)
  useEffect(() => {
    panelRef.current = recorderPanel
  }, [recorderPanel])
  const allRead = read.size === lines.length

  // A line heard to its end, or a recording finished, reads its panel.
  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        const ended = lines.findIndex((line) => line.id === state.clipId)
        if (ended < 0 || state.status !== 'idle' || prev.clipId !== state.clipId || prev.status !== 'playing') return
        setRead((old) => new Set(old).add(ended))
      }),
    [lines],
  )
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        const panel = panelRef.current
        if (panel !== null && next.status === 'ready' && prev.status === 'recording') setRead((old) => new Set(old).add(panel))
      }),
    [],
  )
  useEffect(() => discardRecording, [])

  // Teacher audio never plays into a recording: it ends the take first.
  const playLine = (i: number) => {
    stopRecording()
    playClip(lines[i]!)
  }
  const turn = (i: number) => {
    setTurned((old) => new Set(old).add(i))
    playLine(i)
  }
  const record = (i: number) => {
    if (recorderPanel === i && useRecorder.getState().status === 'recording') return stopRecording()
    setRecorderPanel(i)
    void startRecording()
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-soil-deep">
      <p data-testid="read-count" className={cx(label, 'absolute top-[50px] left-[1110px] flex h-[80px] items-center gap-[10px] text-[36px]')}>
        {allRead ? (
          <>
            <span className="text-[44px] leading-none">
              <Star />
            </span>
            อ่านครบแล้ว ถั่วเลื้อยขึ้นซุ้มแล้ว
          </>
        ) : (
          `อ่านแล้ว ${read.size}/${lines.length}`
        )}
      </p>

      <Trellis />
      <BeanVine grown={allRead} still={still} />

      <ol aria-label={`การ์ตูน${lesson.finalGroup}`}>
        {lines.map((line, i) => (
          <li key={line.id}>
            <Panel
              line={line}
              index={i}
              clips={clips}
              turned={turned.has(i)}
              read={read.has(i)}
              ownsRecorder={recorderPanel === i}
              still={still}
              onTurn={() => turn(i)}
              onPlay={() => playLine(i)}
              onRecord={() => record(i)}
            />
          </li>
        ))}
      </ol>

      <div
        data-testid="comic-messages"
        className="pointer-events-none absolute top-[28px] left-[450px] flex h-[124px] w-[400px] items-center justify-center text-[22px] leading-[1.3] [&_[role=alert]]:w-auto [&_[role=alert]]:border-soil [&_[role=alert]]:bg-kraft-light [&_[role=alert]]:px-[20px] [&_[role=alert]]:py-[2px] [&_[role=alert]]:shadow-none"
      >
        <RecorderMessages />
      </div>
    </section>
  )
}

/** The bamboo trellis: two posts and two bamboo rails, with the pegs each panel hangs from. */
function Trellis() {
  return (
    <svg aria-hidden="true" data-testid="trellis" viewBox="0 0 1920 1080" className="pointer-events-none absolute inset-0 size-full overflow-visible">
      {[170, 1750].map((x) => (
        <rect key={x} x={x} y="200" width="24" height="820" rx="10" fill="#c9b25a" {...ink} />
      ))}
      {RAILS.map((y) => (
        <g key={y}>
          <rect x="150" y={y - 12} width="1640" height="24" rx="12" fill="#d9c27a" {...ink} />
          {[400, 800, 1200, 1600].map((x) => (
            <path key={x} d={`M${x} ${y - 10} V${y + 10}`} stroke="#a88e46" strokeWidth={4} />
          ))}
          {PANEL.columns.flatMap((left) => [left + 60, left + PANEL.width - 60]).map((x) => (
            <rect key={x} data-testid="peg" x={x - 9} y={y - 6} width="18" height="40" rx="5" fill="var(--color-plank)" {...ink} strokeWidth={3.5} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** The bean vine along the top rail, above the panels: grown once all four are read (simply there under reduced motion). */
function BeanVine({ grown, still }: { grown: boolean; still: boolean }) {
  const d = 'M170 236 C300 170 420 250 560 196 S820 170 960 210 S1240 250 1380 196 S1640 170 1770 236'
  return (
    <svg aria-hidden="true" data-testid="bean-vine" data-grown={grown || undefined} viewBox="0 0 1920 1080" className="pointer-events-none absolute inset-0 size-full overflow-visible">
      <AnimatePresence>
        {grown && (
          <g>
            <motion.path
              d={d}
              fill="none"
              stroke="var(--color-sprout-deep)"
              strokeWidth={10}
              strokeLinecap="round"
              initial={still ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
            />
            {[300, 520, 760, 1000, 1240, 1480, 1700].map((x, i) => (
              <motion.path
                key={x}
                data-testid="vine-leaf"
                d={`M${x} 200 q-30 -10 -34 -40 q30 4 34 40 Z M${x} 200 q26 -18 54 -10 q-20 24 -54 10 Z`}
                fill="var(--color-sprout)"
                {...ink}
                strokeWidth={3.5}
                initial={still ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: still ? 0 : 0.2 + i * 0.18, duration: 0.3 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
              />
            ))}
          </g>
        )}
      </AnimatePresence>
    </svg>
  )
}

type PanelProps = {
  line: RhymeLine
  index: number
  clips: ReadonlyMap<string, AudioClip>
  turned: boolean
  read: boolean
  ownsRecorder: boolean
  still: boolean
  onTurn: () => void
  onPlay: () => void
  onRecord: () => void
}

/** One comic panel hanging from the trellis: face down until tapped, then its picture, its line and its recorder. */
function Panel({ line, index, clips, turned, read, ownsRecorder, still, onTurn, onPlay, onRecord }: PanelProps) {
  const { Button, card } = useKit()
  const { poses } = useMascot()
  const status = useClipStatus(line.id)
  const recorderStatus = useRecorder((state) => state.status)
  const playing = status === 'playing'
  const words = splitWords(line.text)
  const current = useKaraokeWord(playing, words.length)
  const recording = ownsRecorder && recorderStatus === 'recording'
  const left = PANEL.columns[index % 2]!
  const top = RAILS[Math.floor(index / 2)]! + 24

  if (!turned) {
    return (
      <button
        type="button"
        data-testid="comic-panel"
        aria-label={`พลิกภาพที่ ${index + 1}`}
        onClick={onTurn}
        className="pointer-events-auto absolute flex cursor-pointer flex-col items-center justify-center gap-[10px] rounded-[22px] border-[6px] border-soil-deep bg-kraft select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
        style={{
          left,
          top,
          width: PANEL.width,
          height: PANEL.height,
          // Its back is kraft paper scattered with seeds.
          backgroundImage: 'radial-gradient(circle, var(--color-kraft-deep) 0 5px, transparent 6px)',
          backgroundSize: '48px 48px',
        }}
      >
        <span aria-hidden="true" className="flex size-[110px] items-center justify-center rounded-full border-[6px] border-soil-deep bg-kraft-light text-[66px] leading-none font-bold">
          {index + 1}
        </span>
        <span aria-hidden="true" className={cx(label, 'text-[34px]')}>
          แตะเพื่อพลิกภาพ
        </span>
      </button>
    )
  }

  return (
    <motion.div
      data-testid="comic-panel"
      data-turned
      data-read={read || undefined}
      data-current={playing || undefined}
      className={cx('absolute overflow-hidden rounded-[22px] border-[6px] border-soil-deep bg-kraft-light', playing && 'outline-[10px] outline-sprout')}
      style={{ left, top, width: PANEL.width, height: PANEL.height }}
      initial={still ? false : { rotateY: 90 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* The picture: tapping it reads the line again, the pot-horn speaker in its corner. */}
      <button
        type="button"
        aria-label={`ฟังวรรคที่ ${index + 1}`}
        onClick={onPlay}
        className="pointer-events-auto absolute top-[14px] left-[14px] h-[210px] w-[300px] cursor-pointer overflow-hidden rounded-[14px] border-[5px] border-soil-deep select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <img src={line.panel ?? poses.greet} alt="" draggable={false} data-testid="panel-picture" className="size-full object-cover" />
        <SpeakerButton className="right-[6px] bottom-[6px] size-[72px]" playing={playing} loading={status === 'loading'} />
      </button>
      {read && (
        <span data-testid="panel-read" className="pointer-events-none absolute top-[4px] left-[4px] flex size-[56px] items-center justify-center rounded-full border-4 border-soil-deep bg-correct text-card">
          <Check aria-hidden="true" className="size-[34px]" strokeWidth={4} />
          <span className="sr-only">วรรคที่ {index + 1} อ่านแล้ว</span>
        </span>
      )}

      {/* The speech bubble: the แม่กก words stay terracotta and play alone; the word being read is underlined. */}
      <p
        data-testid="panel-line"
        className={cx('absolute top-[14px] left-[330px] flex h-[342px] w-[396px] flex-wrap content-center items-center gap-x-[4px] rounded-[36px_36px_36px_8px] px-[20px] text-[46px] leading-none font-bold', card)}
      >
        <span className="sr-only">{line.text}</span>
        {words.map((w, i) => {
          const clip = line.rhymeWords.includes(w) ? clips.get(w) : undefined
          const active = i === current
          const look = cx('relative inline-block rounded-[12px] px-[4px] py-[8px]', active && 'underline decoration-[6px] underline-offset-[10px] decoration-sprout-deep')
          return clip ? (
            // Each แม่กก word is a whole 124 px tap target; its terracotta highlight sits in the middle.
            <button
              key={i}
              type="button"
              aria-label={`ฟังคำว่า ${w}`}
              data-rhyme
              data-active={active || undefined}
              onClick={() => playClip(clip)}
              className="pointer-events-auto relative flex h-[124px] min-w-[124px] cursor-pointer items-center justify-center rounded-[16px] focus-visible:outline-6 focus-visible:outline-ring"
            >
              <span data-testid="rhyme-word" className={cx(look, 'bg-terracotta text-kraft-light')}>
                {w}
              </span>
            </button>
          ) : (
            <span key={i} aria-hidden="true" data-active={active || undefined} className={cx(look, 'flex h-[124px] items-center')}>
              {w}
            </span>
          )
        })}
      </p>

      <div className="absolute top-[234px] left-[14px] flex items-center gap-[8px]">
        <Button
          aria-label={recording ? `หยุดบันทึกวรรคที่ ${index + 1}` : `อ่านวรรคที่ ${index + 1}`}
          aria-pressed={recording}
          disabled={ownsRecorder && recorderStatus === 'requesting'}
          onClick={onRecord}
          className="relative flex size-[124px] shrink-0 items-center justify-center"
        >
          {recording ? (
            <Square aria-hidden="true" className="relative mt-[12px] size-[48px] fill-current" strokeWidth={3} />
          ) : (
            <Mic aria-hidden="true" className="relative mt-[12px] size-[60px]" strokeWidth={3} />
          )}
        </Button>
        {ownsRecorder && recorderStatus === 'ready' && (
          <Button aria-label={`ฟังเสียงตัวเองวรรคที่ ${index + 1}`} onClick={playRecording} className="relative flex size-[124px] shrink-0 items-center justify-center">
            <Play aria-hidden="true" className="relative mt-[12px] size-[54px] fill-current" strokeWidth={3} />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

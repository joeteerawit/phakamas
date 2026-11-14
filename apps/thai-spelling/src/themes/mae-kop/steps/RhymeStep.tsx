import { Check, Mic, Square, Volume2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playClip, stopAudio, useAudio } from '../../../audio/audioManager'
import { discardRecording, startRecording, stopRecording, useRecorder } from '../../../audio/recorder'
import type { RhymeLine } from '../../../lessons/types'
import { splitWords, useKaraokeWord } from '../../../steps/karaoke'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { RecorderMessages } from '../../../ui/RecorderMessages'

// Stage pixels. Four 740×400 panels in two rows (200–940 and 980–1720; 180–580 and 660–1060) over the kop-gutter, with
// the recorder's messages in the strip between the rows; ฟังครูอ่าน and the count sit in the top bar by the Step badge.
const PANELS = [
  { left: 200, top: 180 },
  { left: 980, top: 180 },
  { left: 200, top: 660 },
  { left: 980, top: 660 },
]
const label = 'drop-label px-[22px] font-heading leading-[1.4] font-bold whitespace-nowrap text-pond-deep'
// Until the comic art lands (#69), each panel's picture is a stand-in drawn from the Lesson's own cards.
const STAND_IN = ['', '/assets/comic/word-phap-fold.webp', '/assets/comic/word-chep.webp', '/assets/comic/word-phap.webp']

/**
 * แม่กบ Step 7, read the rain away (docs/mae-kop-spec.md): the 4-panel comic, one line per panel in a speech bubble, with
 * gentle CSS rain over each panel's picture but never over its bubble. ฟังครูอ่าน reads the lines in order with the
 * current line highlighted and its words lit karaoke-style; the แม่กบ words of each line stay raincoat yellow; tapping a
 * bubble reads just that line. Each panel has its own record button: when the child has read the line (record, then
 * stop), the rain in that panel stops and its sky brightens. With all four read, the last panel's sun comes out. If the
 * microphone is refused, hearing a line to its end counts instead. Under reduced motion the rain stands still.
 */
export function RhymeStep({ lesson }: StepProps) {
  const lines = lesson.rhyme
  const { Button, Star } = useKit()
  const [read, setRead] = useState<ReadonlySet<number>>(() => new Set())
  const [recordingPanel, setRecordingPanel] = useState<number | null>(null)
  const recorderStatus = useRecorder((state) => state.status)
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (recorderStatus === 'denied' || recorderStatus === 'unsupported')) setMicBlocked(true)
  // The line ฟังครูอ่าน is on; when it ends, the next one plays.
  const sequence = useRef<number | null>(null)
  const blocked = useRef(micBlocked)
  useEffect(() => {
    blocked.current = micBlocked
  }, [micBlocked])

  const audio = useAudio()
  const playingIndex = lines.findIndex((line) => line.id === audio.clipId)
  const busy = playingIndex >= 0 && (audio.status === 'loading' || audio.status === 'playing')
  const allRead = read.size === lines.length

  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        // A line "ends" when it goes idle on its own (stop clears clipId).
        const ended = lines.findIndex((line) => line.id === state.clipId)
        if (ended < 0 || state.status !== 'idle' || prev.clipId !== state.clipId || prev.status !== 'playing') return
        if (blocked.current) setRead((old) => new Set(old).add(ended))
        if (sequence.current !== ended) return
        const next = lines[ended + 1]
        sequence.current = next ? ended + 1 : null
        if (next) playClip(next)
      }),
    [lines],
  )
  useEffect(() => discardRecording, [])

  // Teacher audio never plays into a recording: stop it first, without counting it as read.
  const cancelRecording = () => {
    setRecordingPanel(null)
    discardRecording()
  }
  const playAll = () => {
    cancelRecording()
    sequence.current = 0
    playClip(lines[0]!)
  }
  const stopAll = () => {
    sequence.current = null
    stopAudio()
  }
  const playLine = (i: number) => {
    cancelRecording()
    sequence.current = null
    playClip(lines[i]!)
  }
  const toggleRecord = (i: number) => {
    if (recordingPanel === i && recorderStatus === 'recording') {
      stopRecording()
      setRecordingPanel(null)
      return setRead((old) => new Set(old).add(i))
    }
    sequence.current = null
    setRecordingPanel(i)
    void startRecording()
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-pond-deep">
      {/* In the top bar, between the title and the Step badge, and right of the badge. */}
      <div className="pointer-events-none absolute top-[28px] left-[455px] h-[124px] w-[340px]">
        <Button onClick={busy ? stopAll : playAll} className="absolute inset-0 flex items-center justify-center gap-[12px] text-[40px] font-bold">
          {busy ? <Square aria-hidden="true" className="relative size-[44px] fill-current" strokeWidth={3} /> : <Volume2 aria-hidden="true" className="relative size-[52px]" strokeWidth={3} />}
          <span className="relative">{busy ? 'หยุดเสียง' : 'ฟังครูอ่าน'}</span>
        </Button>
      </div>
      <p data-testid="read-count" className={cx(label, 'absolute top-[50px] left-[1110px] flex h-[80px] items-center gap-[10px] text-[38px]')}>
        {allRead ? (
          <>
            <span className="text-[44px] leading-none">
              <Star />
            </span>
            เก่งมาก! ฝนหยุดแล้ว
          </>
        ) : (
          `อ่านแล้ว ${read.size}/${lines.length}`
        )}
      </p>

      <ol aria-label="การ์ตูนแม่กบ">
        {lines.map((line, i) => (
          <li key={line.id}>
            <Panel
              line={line}
              index={i}
              read={read.has(i)}
              current={playingIndex === i && busy}
              playing={playingIndex === i && audio.status === 'playing'}
              recording={recordingPanel === i && recorderStatus === 'recording'}
              requesting={recordingPanel === i && recorderStatus === 'requesting'}
              sun={i === lines.length - 1 && allRead}
              onPlay={() => playLine(i)}
              onRecord={() => toggleRecord(i)}
              micBlocked={micBlocked}
            />
          </li>
        ))}
      </ol>

      <div data-testid="comic-messages" className="pointer-events-none absolute top-[588px] left-[200px] flex h-[64px] w-[1520px] items-center justify-center gap-[20px] text-[26px] leading-[1.3] text-card [&_[role=alert]]:w-auto [&_[role=alert]]:border-pond-deep [&_[role=alert]]:bg-raincoat-light [&_[role=alert]]:px-[20px] [&_[role=alert]]:py-[4px] [&_[role=alert]]:text-pond-deep [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>
    </section>
  )
}

type PanelProps = {
  line: RhymeLine
  index: number
  read: boolean
  /** ฟังครูอ่าน or a tap is on this line now. */
  current: boolean
  playing: boolean
  recording: boolean
  requesting: boolean
  sun: boolean
  micBlocked: boolean
  onPlay: () => void
  onRecord: () => void
}

/** One comic panel: the line in a bubble (a button that reads it), its record button, and its rainy picture. */
function Panel({ line, index, read, current, playing, recording, requesting, sun, micBlocked, onPlay, onRecord }: PanelProps) {
  const { Button } = useKit()
  const { poses } = useMascot()
  const still = !!useReducedMotion()
  const words = splitWords(line.text)
  const word = useKaraokeWord(playing, words.length)
  const picture = line.panel ?? (STAND_IN[index] || poses.greet)
  const { left, top } = PANELS[index]!

  return (
    <div
      data-testid="comic-panel"
      data-read={read || undefined}
      data-current={current || undefined}
      className={cx(
        'absolute h-[400px] w-[740px] overflow-hidden rounded-[26px] border-[6px] border-rubber-deep bg-raincoat-light',
        current && 'outline-[10px] outline-raincoat',
      )}
      style={{ left, top }}
    >
      {/* The picture: a rainy sky that brightens once the line is read, the rain over it alone, never over the bubble. */}
      <div
        data-testid="panel-picture"
        className={cx(
          'absolute top-[12px] right-[12px] bottom-[12px] w-[278px] overflow-hidden rounded-[18px] border-[5px] border-rubber-deep transition-[background] duration-700 motion-reduce:transition-none',
          read ? 'bg-[linear-gradient(180deg,#8fd3f5,#e3f6ff_70%,#9be08f_70%)]' : 'bg-[linear-gradient(180deg,#6f879b,#b7c6d3_70%,#6f9a76_70%)]',
        )}
      >
        <img src={picture} alt="" draggable={false} className="absolute bottom-[30px] left-1/2 h-[200px] w-[200px] -translate-x-1/2 object-contain" />
        <AnimatePresence>
          {sun && (
            <motion.svg
              data-testid="panel-sun"
              aria-hidden="true"
              viewBox="-60 -60 120 120"
              className="absolute top-[10px] right-[10px] size-[110px] overflow-visible"
              initial={still ? false : { scale: 0, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 12 }}
            >
              {Array.from({ length: 8 }, (_, r) => (
                <path key={r} transform={`rotate(${r * 45})`} d="M0 -56 V-40" stroke="var(--color-raincoat-deep)" strokeWidth={8} strokeLinecap="round" />
              ))}
              <circle r="32" fill="var(--color-raincoat)" stroke="var(--color-rubber-deep)" strokeWidth={5} />
            </motion.svg>
          )}
        </AnimatePresence>
        {!read && <Rain still={still} />}
      </div>

      {/* The speech bubble: tapping it reads this line; the แม่กบ words stay raincoat yellow, the word being read lit. */}
      <button
        type="button"
        onClick={onPlay}
        aria-label={`ฟังวรรคที่ ${index + 1}: ${line.text}`}
        className="pointer-events-auto absolute top-[16px] left-[16px] flex h-[236px] w-[420px] cursor-pointer items-center rounded-[40px_40px_40px_10px] border-[5px] border-rubber-deep bg-card px-[22px] text-left select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <span aria-hidden="true" className="text-[48px] leading-[1.5] font-bold text-rubber-deep">
          {words.map((w, i) => (
            <span
              key={i}
              data-rhyme={line.rhymeWords.includes(w) || undefined}
              data-active={i === word || undefined}
              className={cx(
                'inline-block rounded-[12px] px-[2px] transition-colors duration-150 motion-reduce:transition-none',
                line.rhymeWords.includes(w) && 'bg-raincoat',
                i === word && 'text-pond underline decoration-[6px] underline-offset-[10px]',
              )}
            >
              {w}
            </span>
          ))}
        </span>
      </button>

      <div className="absolute top-[266px] left-[16px] flex w-[420px] items-center gap-[16px]">
        <Button
          aria-label={micBlocked ? `ฟังแล้วนับวรรคที่ ${index + 1}` : recording ? `หยุดบันทึกวรรคที่ ${index + 1}` : `อ่านวรรคที่ ${index + 1}`}
          aria-pressed={recording}
          disabled={requesting}
          onClick={micBlocked ? onPlay : onRecord}
          className="relative flex size-[124px] shrink-0 items-center justify-center"
        >
          {micBlocked ? (
            <Volume2 aria-hidden="true" className="relative size-[60px]" strokeWidth={3} />
          ) : recording ? (
            <Square aria-hidden="true" className="relative size-[52px] fill-current" strokeWidth={3} />
          ) : (
            <Mic aria-hidden="true" className="relative size-[64px] text-comic-red" strokeWidth={3} />
          )}
        </Button>
        <p aria-hidden="true" className={cx(label, 'text-[32px]')}>
          {read ? (
            <span className="flex items-center gap-[6px]">
              <Check className="size-[36px] text-correct" strokeWidth={4} />
              อ่านแล้ว
            </span>
          ) : micBlocked ? (
            'ฟังแล้วนับ'
          ) : recording ? (
            'อ่านจบแล้วกดหยุด'
          ) : (
            'กดแล้วอ่าน'
          )}
        </p>
        {read && <span className="sr-only">วรรคที่ {index + 1} อ่านแล้ว</span>}
      </div>
    </div>
  )
}

// Rain over a panel's picture: streaks spread evenly but out of order, each started part-way.
const DROPS = Array.from({ length: 12 }, (_, i) => ({ left: (i * 47) % 270, delay: -((i * 0.31) % 1.4), height: 26 + (i % 3) * 10 }))

/** Gentle rain inside its picture box only; still under reduced motion. */
function Rain({ still }: { still: boolean }) {
  return (
    <div aria-hidden="true" data-testid="panel-rain" className="pointer-events-none absolute inset-0">
      {DROPS.map((drop) => (
        <span
          key={drop.left}
          className={cx('absolute top-0 w-[4px] rounded-full bg-card/80', !still && 'animate-rain-fall [animation-duration:1.6s]')}
          style={{ left: drop.left, height: drop.height, animationDelay: `${drop.delay}s`, top: still ? (drop.left * 1.3) % 300 : 0 }}
        />
      ))}
    </div>
  )
}

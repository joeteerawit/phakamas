import { ChevronLeft, ChevronRight, Mic, Play, Square } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playClip, useAudio, useClipStatus } from '../../../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../../../audio/recorder'
import { splitWords, useKaraokeWord } from '../../../steps/karaoke'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { ink } from '../kit/ink'

// Stage pixels. The scarecrow stands in the middle of the terrace (its hat 230–330 on x = 960, its arms across at
// y = 470 from 560 to 1360), the two pictures hanging from its arms' ends (520–740 and 1180–1400) and the plank with the
// sentence held across its body (600–1320 × 720–850). The speaker stands at its left, the recorder at its right and
// ‹ ประโยคที่ n/2 › along the bottom, all clear of the leaves at the window's sides.
const HAT = { x: 960, y: 232 }
const PICTURES = [520, 1180]
const round = 'relative flex size-[130px] shrink-0 items-center justify-center'
const label = 'kraft-label px-[22px] font-heading leading-[1.4] font-bold whitespace-nowrap text-soil-deep'

/**
 * แม่กก Step 9, read to the scarecrow (docs/mae-kok-spec.md): the scarecrow holds a wooden plank with the sentence, and
 * the sentence's two word pictures hang from its arms. The pot-horn speaker plays the sentence with the words lit
 * karaoke-style. The student records it on the Kit's terracotta pot and plays it back through the shared Recorder;
 * after a recording, น้องนก flies down to land on the scarecrow's hat and claps. Then ‹ ประโยคที่ n/2 › leads to the
 * second sentence. If the microphone is refused, hearing the sentence to its end brings her instead. Under reduced
 * motion she is simply on the hat and nothing moves.
 */
export function SentenceStep({ lesson }: StepProps) {
  const { sentences } = lesson
  const { Button } = useKit()
  const still = !!useReducedMotion()
  const [index, setIndex] = useState(0)
  const [landed, setLanded] = useState<ReadonlySet<number>>(() => new Set())
  const sentence = sentences[index]!
  const status = useClipStatus(sentence.audio.id)
  const playing = status === 'playing'
  const words = splitWords(sentence.audio.text)
  const current = useKaraokeWord(playing, words.length)
  const recorder = useRecorder((state) => state.status)
  const recording = recorder === 'recording'
  const [micBlocked, setMicBlocked] = useState(false)
  if (!micBlocked && (recorder === 'denied' || recorder === 'unsupported')) setMicBlocked(true)
  const chosen = useRef(index)
  const blocked = useRef(micBlocked)
  useEffect(() => {
    chosen.current = index
    blocked.current = micBlocked
  })

  // A finished recording brings น้องนก to the hat; with the microphone refused, the sentence heard to its end does.
  useEffect(
    () =>
      useRecorder.subscribe((next, prev) => {
        if (next.status === 'ready' && prev.status === 'recording') setLanded((old) => new Set(old).add(chosen.current))
      }),
    [],
  )
  useEffect(
    () =>
      useAudio.subscribe((state, prev) => {
        const ended = sentences.findIndex(({ audio }) => audio.id === state.clipId)
        if (ended < 0 || !blocked.current || state.status !== 'idle' || prev.clipId !== state.clipId || prev.status !== 'playing') return
        setLanded((old) => new Set(old).add(ended))
      }),
    [sentences],
  )
  useEffect(() => discardRecording, [])

  const listen = () => {
    stopRecording()
    playClip(sentence.audio)
  }
  const goTo = (i: number) => {
    discardRecording()
    setIndex(i)
  }

  return (
    <section data-full-stage className="relative size-full font-heading text-soil-deep">
      <Scarecrow />
      <AnimatePresence mode="wait">
        <motion.div key={sentence.audio.id} className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {sentence.images.map((src, i) => (
            <HangingPicture key={src} src={src} left={PICTURES[i] ?? PICTURES[0]!} />
          ))}
          {/* The wooden plank the scarecrow holds, the sentence on it. */}
          <p
            data-testid="plank"
            className="absolute top-[720px] left-[600px] flex h-[130px] w-[720px] items-center justify-center rounded-[16px] border-[6px] border-soil-deep bg-[repeating-linear-gradient(180deg,#d9a868_0_30px,#c4925a_30px_34px)] px-[20px] text-[64px] leading-[1.3] font-bold"
          >
            <span className="sr-only">{sentence.audio.text}</span>
            {words.map((w, i) => (
              <span
                key={i}
                aria-hidden="true"
                data-active={i === current || undefined}
                className={cx('inline-block rounded-[10px] px-[3px]', i === current && 'bg-terracotta text-kraft-light')}
              >
                {w}
              </span>
            ))}
          </p>
        </motion.div>
      </AnimatePresence>
      <HatMascot landed={landed.has(index)} still={still} />

      <div className="absolute top-[722px] left-[330px] flex w-[200px] flex-col items-center gap-[6px]">
        <div className="relative size-[140px]">
          <SpeakerButton label={`ฟังประโยคที่ ${index + 1}`} onClick={listen} playing={playing} loading={status === 'loading'} className="inset-0 size-full" />
        </div>
        <p aria-hidden="true" className={cx(label, 'text-[28px]')}>
          ฟังประโยค
        </p>
      </div>

      <div className="absolute top-[722px] left-[1420px] flex w-[200px] flex-col items-center gap-[8px]">
        {micBlocked ? (
          <Button aria-label="ฟังแล้วอ่านให้หุ่นฟัง" onClick={listen} className="relative flex h-[140px] w-[150px] items-center justify-center">
            <Play aria-hidden="true" className="relative mt-[14px] size-[60px] fill-current" strokeWidth={3} />
          </Button>
        ) : (
          <Button
            aria-label={recording ? 'หยุดบันทึก' : 'อ่านให้หุ่นฟัง'}
            aria-pressed={recording}
            disabled={recorder === 'requesting'}
            onClick={recording ? stopRecording : () => void startRecording()}
            data-main
            className={cx('relative flex h-[140px] w-[150px] items-center justify-center', recording && 'shadow-[0_0_40px_14px_rgb(212_20_26/0.6)]')}
          >
            {recording ? (
              <Square aria-hidden="true" className="relative mt-[14px] size-[56px] fill-current" strokeWidth={3} />
            ) : (
              <Mic aria-hidden="true" className="relative mt-[14px] size-[70px]" strokeWidth={3} />
            )}
          </Button>
        )}
        <p aria-hidden="true" className={cx(label, 'text-[26px]')}>
          {micBlocked ? 'ฟังแล้วอ่านตาม' : recording ? 'อ่านจบแล้วกดหยุด' : 'กดแล้วอ่าน'}
        </p>
      </div>
      {recorder === 'ready' && (
        <Button aria-label="ฟังเสียงตัวเอง" onClick={playRecording} className={cx(round, 'absolute top-[900px] left-[1455px]')}>
          <Play aria-hidden="true" className="relative mt-[12px] size-[60px] fill-current" strokeWidth={3} />
        </Button>
      )}

      <nav aria-label="ลำดับประโยค" className="absolute top-[886px] left-[660px] flex w-[600px] items-center justify-center gap-[24px]">
        <Button aria-label="ประโยคก่อนหน้า" disabled={index === 0} onClick={() => goTo(index - 1)} className={round}>
          <ChevronLeft aria-hidden="true" className="relative mt-[12px] size-[76px]" strokeWidth={3} />
        </Button>
        <p className={cx(label, 'text-[40px]')}>
          ประโยคที่ {index + 1}/{sentences.length}
        </p>
        <Button aria-label="ประโยคถัดไป" disabled={index === sentences.length - 1} onClick={() => goTo(index + 1)} className={round}>
          <ChevronRight aria-hidden="true" className="relative mt-[12px] size-[76px]" strokeWidth={3} />
        </Button>
      </nav>

      <div role="status" aria-live="polite" data-testid="scarecrow-messages" className="absolute top-[160px] left-[1180px] w-[440px] text-center">
        {landed.has(index) && <p className={cx(label, 'inline-block text-[32px]')}>น้องนกปรบมือให้แล้ว!</p>}
      </div>
      <div className="absolute top-[250px] left-[1180px] w-[440px] text-[24px] leading-[1.35] has-[p:empty:only-child]:hidden [&_[role=alert]]:border-soil [&_[role=alert]]:bg-kraft-light [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>
    </section>
  )
}

/** The scarecrow: a straw hat, a sack-cloth head, a checked shirt on a cross of bamboo, its post in the soil. */
function Scarecrow() {
  return (
    <svg aria-hidden="true" data-testid="scarecrow" viewBox="0 0 1920 1080" className="pointer-events-none absolute inset-0 size-full overflow-visible">
      <path d="M960 420 V1060" {...ink} strokeWidth={22} />
      <path d="M960 420 V1060" stroke="#c9b25a" strokeWidth={12} />
      <path d="M560 470 H1360" {...ink} strokeWidth={22} />
      <path d="M560 470 H1360" stroke="#c9b25a" strokeWidth={12} />
      <path d="M850 450 H1070 L1100 720 H820 Z" fill="var(--color-terracotta)" {...ink} />
      <path d="M850 520 H1080 M840 600 H1090 M900 450 V720 M1020 450 V720" stroke="var(--color-terracotta-deep)" strokeWidth={5} opacity={0.5} />
      <path d="M820 470 L700 500 L720 520 L840 500 Z M1100 470 L1220 500 L1200 520 L1080 500 Z" fill="var(--color-terracotta)" {...ink} strokeWidth={4} />
      <circle cx="960" cy="380" r="62" fill="var(--color-kraft)" {...ink} />
      <path d="M936 372 l12 12 M948 372 l-12 12 M972 372 l12 12 M984 372 l-12 12" {...ink} strokeWidth={4} />
      <path d="M934 410 Q960 426 986 410" fill="none" {...ink} strokeWidth={4} />
      <ellipse cx={HAT.x} cy={HAT.y + 92} rx="120" ry="24" fill="#e8c25a" {...ink} />
      <path d={`M${HAT.x - 64} ${HAT.y + 90} Q${HAT.x - 60} ${HAT.y} ${HAT.x} ${HAT.y} Q${HAT.x + 60} ${HAT.y} ${HAT.x + 64} ${HAT.y + 90} Z`} fill="#e8c25a" {...ink} />
      <path d={`M${HAT.x - 62} ${HAT.y + 72} Q${HAT.x} ${HAT.y + 86} ${HAT.x + 62} ${HAT.y + 72}`} fill="none" stroke="var(--color-comic-red)" strokeWidth={12} />
    </svg>
  )
}

/** One of the sentence's word pictures, hanging by a string from the scarecrow's arm on a seed-packet card. */
function HangingPicture({ src, left }: { src: string; left: number }) {
  const { card } = useKit()
  return (
    <div data-testid="hanging-picture" className="absolute top-[470px] h-[240px] w-[220px]" style={{ left }}>
      <span className="absolute top-0 left-1/2 h-[30px] w-[4px] -translate-x-1/2 bg-soil-deep" />
      <span className={cx('absolute top-[26px] left-0 block h-[210px] w-[220px]', card)}>
        <img src={src} alt="" draggable={false} className="absolute top-[30px] left-[30px] size-[160px] object-contain" />
      </span>
    </div>
  )
}

/** น้องนก flies down to land on the scarecrow's hat and claps; until then she waits up in the sky at the right. */
function HatMascot({ landed, still }: { landed: boolean; still: boolean }) {
  const { poses } = useMascot()
  const away = { x: 1520, y: 150, opacity: 0 }
  const hat = { x: HAT.x - 60, y: HAT.y - 120, opacity: 1 }
  return (
    <motion.div
      data-testid="hat-mascot"
      data-landed={landed || undefined}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 h-[140px] w-[120px]"
      initial={false}
      animate={landed ? hat : away}
      transition={still ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 14 }}
    >
      <motion.img
        src={landed ? poses.cheer : poses.greet}
        alt=""
        draggable={false}
        className="size-full object-contain select-none"
        animate={landed && !still ? { scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] } : undefined}
        transition={{ delay: 0.6, duration: 0.5, repeat: 3 }}
      />
    </motion.div>
  )
}

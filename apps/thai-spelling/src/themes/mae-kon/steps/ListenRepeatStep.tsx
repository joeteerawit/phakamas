import { ChevronRight, Mic, Play, RotateCcw, Square } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useListenRepeat, useListenRepeatRecorder } from '../../../steps/listen-repeat/useListenRepeat'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { useMascot } from '../../../ui/mascotContext'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { ink } from '../kit/ink'
import { useGarland } from './useGarland'

// Every target here is ≥ 124 stage px: 44 CSS px on a 390px-tall landscape phone.
const label = 'bamboo-label px-[24px] text-[34px] leading-[1.4] font-bold whitespace-nowrap'
// Stage pixels, all between x = 320 and 1610, clear of the lotus pads down the window's sides. The garland is strung
// across the top (470–1450 × 150–262); the vendor boat and its paddle sign float in the middle of the canal
// (600–1320 × 280–650); the word list runs under it (650–774); น้องส้ม's side of the canal is the bottom row.
const GARLAND = { left: 470, top: 150, width: 980, height: 112 }
const BOAT = { left: 600, top: 280, width: 720, height: 370 }
const GLIDE_PX = 1100

/**
 * แม่กน Step 3, call and answer across the canal (docs/mae-kon-spec.md), over the quiet canal. A vendor boat glides in
 * with one word on a big paddle sign; the leaf-cone speaker plays the vendor's call, and once it ends ถึงตาหนูอ่านแล้ว
 * shows on น้องส้ม's side of the canal. The student records the word and may play it back, with the shared recorder
 * as on แม่กม's Step 3 (Step 3's shared behaviour). Each word recorded threads one marigold onto the garland across
 * the top; then เรือลำต่อไป brings the next word's boat gliding in, and the word list jumps to any word. Six marigolds close the
 * garland, which is hung on น้องส้ม's bow, with เก่งมาก! and ฝึกอีกรอบ. If the microphone is refused, hearing a word
 * threads its marigold. Under reduced motion the boat is just there and the flowers simply appear.
 */
export function ListenRepeatStep({ lesson }: StepProps) {
  const { words, index, direction, current, yourTurn, playing, listenLabel, goTo, listen, statusText } = useListenRepeat(lesson)
  const garland = useGarland(words, current)
  const still = !!useReducedMotion()
  const { Button } = useKit()
  const { poses } = useMascot()
  const next = words.findIndex((word, i) => i > index && !garland.threaded(word))
  const glide = still ? 0 : GLIDE_PX

  return (
    <section data-full-stage className="relative size-full font-heading text-kon-ink">
      <Garland count={garland.flowers.length} of={words.length} still={still} />

      {/* The vendor boat with the word on its paddle sign glides in from the right and away to the left. */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.audio.id}
          data-testid="vendor-boat"
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: (d === 0 ? 1 : d) * glide, opacity: still ? 1 : 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: -(d === 0 ? 1 : d) * glide, opacity: still ? 1 : 0, transition: { duration: still ? 0 : 0.35, ease: 'easeIn' } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={still ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
          className="pointer-events-none absolute"
          style={BOAT}
        >
          <VendorBoat />
          <div data-testid="listen-word" className="plank-sign absolute top-0 left-[110px] flex h-[250px] w-[500px] items-center justify-center gap-[20px] [--rope-inset:-6px] [--rope:14px]">
            <img src={current.image} alt="" width={170} height={170} draggable={false} className="relative size-[170px] object-contain" />
            <div className="relative">
              <h2 className="text-[110px] leading-[1.3] font-bold">{current.word}</h2>
              <p className="absolute inset-x-0 top-full -mt-[10px] text-center text-[28px] leading-[1.2] font-semibold whitespace-nowrap">{statusText}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* The vendor's call: the speaker at the left of the canal. */}
      <div className="absolute top-[300px] left-[330px] flex w-[230px] flex-col items-center gap-[12px]">
        <div className="relative h-[170px] w-[200px]">
          <SpeakerButton label={listenLabel} onClick={listen} playing={playing} className="inset-0 size-full" />
        </div>
        {/* The button's own name already says this. */}
        <p aria-hidden="true" data-testid="listen-label" className={label}>
          {listenLabel}
        </p>
      </div>

      <Recorder />

      {/* The word list: jump to any word; a marigold dot for each word threaded. */}
      <nav aria-label="ลำดับคำ" className="absolute top-[660px] left-[470px] w-[980px]">
        <ol className="flex justify-between">
          {words.map((item, i) => (
            <li key={item.audio.id}>
              <Button
                aria-label={garland.threaded(item) ? `${item.word} (บันทึกแล้ว)` : item.word}
                aria-current={i === index ? 'step' : undefined}
                aria-pressed={i === index}
                onClick={() => goTo(i)}
                className="relative flex h-[124px] w-[150px] items-center justify-center text-[44px] font-bold"
              >
                <span className="relative">{item.word}</span>
                {garland.threaded(item) && (
                  <span aria-hidden="true" className="absolute -top-[16px] -right-[10px] size-[40px]">
                    <Marigold />
                  </span>
                )}
              </Button>
            </li>
          ))}
        </ol>
      </nav>

      {/* น้องส้ม's side of the canal, along the bottom: her turn to read, the recorder's messages, then the full garland on her bow. */}
      <div role="status" aria-live="polite" data-testid="turn-messages" className="absolute top-[820px] left-[340px] flex h-[170px] w-[940px] items-center justify-center gap-[24px]">
        {garland.complete ? (
          <p className={cx(label, 'text-[40px]')}>ร้อยพวงมาลัยครบ {words.length} ดอกแล้ว เก่งมาก!</p>
        ) : (
          yourTurn && (
            <motion.p initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cx(label, 'text-[42px]')}>
              ถึงตาหนูอ่านแล้ว
            </motion.p>
          )
        )}
      </div>
      {/* Once this word is threaded, the next boat waits to glide in. */}
      {!garland.complete && garland.threaded(current) && next !== -1 && (
        <Button onClick={() => goTo(next)} className="absolute top-[852px] left-[1300px] flex h-[124px] items-center gap-[8px] px-[44px] text-[40px] font-bold whitespace-nowrap">
          <span className="relative">เรือลำต่อไป</span>
          <ChevronRight aria-hidden="true" className="relative size-[48px]" strokeWidth={3.5} />
        </Button>
      )}
      {garland.complete && (
        <Button onClick={() => (garland.restart(), goTo(0))} className="absolute top-[852px] left-[1300px] flex h-[124px] items-center gap-[12px] px-[44px] text-[40px] font-bold whitespace-nowrap">
          <RotateCcw aria-hidden="true" className="relative size-[48px]" strokeWidth={3} />
          <span className="relative">ฝึกอีกรอบ</span>
        </Button>
      )}
      <div className="absolute top-[562px] left-[330px] w-[240px] text-[24px] leading-[1.35] has-[p:empty:only-child]:hidden [&_[role=alert]]:border-kon-ink [&_[role=alert]]:bg-honey-light [&_[role=alert]]:shadow-none">
        <RecorderMessages />
      </div>
      <div aria-hidden="true" data-testid="bow" className="pointer-events-none absolute top-[800px] left-[190px] h-[200px] w-[146px]">
        <img src={poses.greet} alt="" draggable={false} className="size-full object-contain select-none" />
        {garland.complete && (
          <motion.span
            data-testid="bow-garland"
            className="absolute bottom-[36px] left-[6px] block h-[52px] w-[134px]"
            initial={still ? false : { y: -400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          >
            <svg viewBox="0 0 134 52" className="size-full overflow-visible">
              <path d="M4 6 Q67 60 130 6" fill="none" stroke="var(--color-banana-deep)" strokeWidth={3} />
              {Array.from({ length: 6 }, (_, i) => {
                const t = (i + 0.5) / 6
                return <circle key={i} cx={4 + 126 * t} cy={6 + 54 * t * (1 - t) * 2} r="9" fill="var(--color-marigold)" stroke="var(--color-kon-ink)" strokeWidth={2.5} />
              })}
            </svg>
          </motion.span>
        )}
      </div>
    </section>
  )
}

/** A marigold seen from the front, filling its box: two rings of orange petals round a deep centre. */
export function Marigold() {
  return (
    <svg viewBox="-50 -50 100 100" className="size-full overflow-visible">
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-28" rx="13" ry="20" transform={`rotate(${i * 30})`} fill="var(--color-marigold)" {...ink} strokeWidth={4} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-16" rx="10" ry="14" transform={`rotate(${i * 45 + 22})`} fill="var(--color-marigold-deep)" {...ink} strokeWidth={3} />
      ))}
      <circle r="10" fill="var(--color-teak-deep)" />
    </svg>
  )
}

/** The garland strung across the top: six marigold places on a cord, one threaded for each word recorded. */
function Garland({ count, of, still }: { count: number; of: number; still: boolean }) {
  const step = GARLAND.width / of
  return (
    <div data-testid="garland" className="pointer-events-none absolute" style={GARLAND}>
      <p className="sr-only">
        ดอกดาวเรือง {count}/{of}
      </p>
      <svg aria-hidden="true" viewBox={`0 0 ${GARLAND.width} ${GARLAND.height}`} className="absolute inset-0 size-full overflow-visible">
        <path d={`M0 10 Q${GARLAND.width / 2} ${GARLAND.height + 30} ${GARLAND.width} 10`} fill="none" stroke="var(--color-banana-deep)" strokeWidth={6} strokeLinecap="round" />
        {Array.from({ length: of }, (_, i) => {
          const t = (i + 0.5) / of
          const y = 10 + (GARLAND.height + 20) * 2 * t * (1 - t) - 40
          return <circle key={i} cx={i * step + step / 2} cy={y + 40} r="30" fill="none" stroke="var(--color-kon-ink)" strokeWidth={4} strokeDasharray="8 8" opacity={0.5} />
        })}
      </svg>
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / of
        const y = 10 + (GARLAND.height + 20) * 2 * t * (1 - t)
        return (
          <motion.span
            key={i}
            data-testid="garland-flower"
            aria-hidden="true"
            className="absolute block size-[76px]"
            style={{ left: i * step + step / 2 - 38, top: y - 38 }}
            initial={still ? false : { y: -120, scale: 0.4, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          >
            <Marigold />
          </motion.span>
        )
      })}
    </div>
  )
}

/** The vendor's long wooden boat on the canal, with its vendor in a งอบ at the stern and the paddle sign's pole. */
function VendorBoat() {
  return (
    <svg aria-hidden="true" viewBox="0 0 720 370" className="absolute inset-0 size-full overflow-visible">
      <path d="M360 250 V300" stroke="var(--color-teak-deep)" strokeWidth={14} />
      {[90, 140, 190].map((x, i) => (
        <circle key={x} cx={x} cy={300} r="22" fill={['var(--color-marigold)', 'var(--color-coral)', 'var(--color-banana)'][i]} {...ink} strokeWidth={4} />
      ))}
      <circle cx="610" cy="262" r="26" fill="#f2c48d" {...ink} strokeWidth={4} />
      <path d="M570 258 Q610 210 650 258 Z" fill="var(--color-bamboo)" {...ink} strokeWidth={4} />
      <path d="M592 284 H628 V318 H592 Z" fill="var(--color-coral)" {...ink} strokeWidth={4} />
      <path d="M10 300 Q360 350 710 290 L650 362 Q360 384 70 362 Z" fill="var(--color-teak)" {...ink} />
      <path d="M40 318 Q360 362 690 312" fill="none" stroke="var(--color-teak-deep)" strokeWidth={5} />
    </svg>
  )
}

/**
 * The recorder at the right of the canal (centre x = 1475): its label, the record plank, and once a take is ready
 * the play-back plank under it.
 */
function Recorder() {
  const { status, recording, secondsLeft, toggle, playBack } = useListenRepeatRecorder()
  const { Button } = useKit()
  return (
    <>
      <p className={cx(label, 'absolute top-[290px] left-[1340px] flex w-[270px] justify-center')}>
        {recording ? <span data-testid="record-time">{secondsLeft} วินาที</span> : 'กดแล้วอ่านตาม'}
      </p>
      <Button
        aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
        disabled={status === 'requesting'}
        onClick={toggle}
        aria-pressed={recording}
        className="absolute top-[370px] left-[1395px] flex h-[140px] w-[160px] items-center justify-center"
      >
        {recording ? (
          <Square aria-hidden="true" className="relative size-[60px] fill-current" strokeWidth={3} />
        ) : (
          <Mic aria-hidden="true" className="relative size-[76px] text-coral-deep" strokeWidth={3} />
        )}
      </Button>
      {status === 'ready' && (
        <Button aria-label="ฟังเสียงตัวเอง" onClick={playBack} className="absolute top-[526px] left-[1413px] flex size-[124px] items-center justify-center">
          <Play aria-hidden="true" className="relative size-[60px] fill-current" strokeWidth={3} />
        </Button>
      )}
    </>
  )
}

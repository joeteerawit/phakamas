import { ChevronLeft, ChevronRight, Mic, Play, RotateCcw, Square } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useListenRepeat, useListenRepeatRecorder } from '../../../steps/listen-repeat/useListenRepeat'
import type { StepProps } from '../../../steps/stepProps'
import { cx, pressable } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { Mascot } from '../../../ui/Mascot'
import { RecorderMessages } from '../../../ui/RecorderMessages'
import { SpeakerButton } from '../../../ui/SpeakerButton'

const layer = 'pointer-events-none absolute select-none'
// Every target here is ≥ 122 stage px: 44 CSS px on a 390px-tall landscape phone.
const iceRound = 'flex size-[130px] items-center justify-center'
const label = 'frost-label px-[24px] text-[36px] leading-[1.4] font-bold whitespace-nowrap'

/**
 * แม่กม Step 3 (docs/mae-kom-spec.md), in stage pixels over the kom-windy Scene. kom-billboard.webp is drawn at
 * its own size (1200×890) on a building rising from the bottom of the stage; the word is on its blank screen
 * (615–1306 × 265–592, centred on x = 960), with the word arrows, คำที่ n/6 and the dots on the roof under it.
 * The radio speaker stands at the left and the record button on kom-phone-booth.webp at the right, down on the
 * street; ถึงตาหนูอ่านแล้ว and the completion card show on the building front under the dots. Every control is
 * from the Theme's UI Kit.
 * Everything a student reads or taps stays between x = 318 and 1633, clear of the leaves and snowflakes
 * falling down the window's sides.
 */
export function ListenRepeatStep({ lesson }: StepProps) {
  const { words, index, direction, current, complete, yourTurn, playing, listenLabel, goTo, listen, ...step } = useListenRepeat(lesson)
  const reduceMotion = useReducedMotion()
  const { Button, card, Star } = useKit()
  const slide = reduceMotion ? 0 : 180

  return (
    <section data-full-stage className="relative size-full font-heading text-navy">
      <img
        src="/assets/comic/kom-billboard.webp"
        alt=""
        draggable={false}
        data-testid="billboard"
        className={`${layer} top-[190px] left-[332px] h-[890px] w-[1200px]`}
      />
      <img
        src="/assets/comic/kom-phone-booth.webp"
        alt=""
        draggable={false}
        data-testid="phone-booth"
        className={`${layer} top-[456px] left-[1365px] h-[604px] w-[250px]`}
      />

      {/* The billboard screen: picture and word side by side, the clip's status under the word. */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.audio.id}
          data-testid="listen-word"
          custom={direction}
          variants={{
            enter: (d: number) => (d === 0 ? { opacity: 0, scale: reduceMotion ? 1 : 0.6 } : { opacity: 0, x: d * slide }),
            center: { opacity: 1, scale: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: -d * slide, transition: { duration: reduceMotion ? 0 : 0.15 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.35 }}
          className="absolute top-[265px] left-[615px] flex h-[328px] w-[692px] items-center justify-center gap-[32px]"
        >
          <img src={current.image} alt="" width={260} height={260} draggable={false} className="size-[260px] object-contain" />
          <div className="relative">
            <h2 className="text-[120px] leading-[1.3] font-bold">{current.word}</h2>
            <p className="absolute inset-x-0 top-full text-center text-[30px] leading-[1.3] font-semibold whitespace-nowrap">{step.statusText}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-[310px] left-[318px] flex w-[264px] flex-col items-center gap-[12px]">
        <div className="relative h-[190px] w-[220px]">
          <SpeakerButton label={listenLabel} onClick={listen} playing={playing} className="inset-0 size-full" />
        </div>
        {/* The button's own name already says this. */}
        <p aria-hidden="true" data-testid="listen-label" className={label}>
          {listenLabel}
        </p>
      </div>

      {/* On the roof under the screen: ‹ คำที่ n/6 › and a dot per word. */}
      <nav aria-label="ลำดับคำ" className="absolute top-[640px] left-[588px] flex w-[744px] flex-col items-center">
        <div className="flex items-center gap-[24px]">
          <Button aria-label="คำก่อนหน้า" disabled={index === 0} onClick={() => goTo(index - 1)} className={cx('relative', iceRound)}>
            <ChevronLeft aria-hidden="true" className="size-[80px]" strokeWidth={3} />
          </Button>
          <p className={cx(label, 'text-[40px]')}>
            คำที่ {index + 1}/{words.length}
          </p>
          <Button aria-label="คำถัดไป" disabled={index === words.length - 1} onClick={() => goTo(index + 1)} className={cx('relative', iceRound)}>
            <ChevronRight aria-hidden="true" className="size-[80px]" strokeWidth={3} />
          </Button>
        </div>
        <ol className="flex">
          {words.map((item, i) => (
            <li key={item.audio.id}>
              <button
                type="button"
                aria-label={step.heard(item) ? `${item.word} (ฟังแล้ว)` : item.word}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => goTo(i)}
                className={`${pressable} flex size-[124px] items-center justify-center`}
              >
                <span
                  className={cx(
                    'block rounded-full border-[5px] border-comic-ink transition-all duration-200 motion-reduce:transition-none',
                    i === index ? 'size-[48px] bg-sign-blue' : 'size-[32px]',
                    i !== index && (step.heard(item) ? 'bg-ice-deep' : 'bg-card'),
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Recorder />

      {/* On the building front under the dots, centred, clear of the booth and the Back button. */}
      <div
        role="status"
        aria-live="polite"
        data-testid="listen-messages"
        className="absolute top-[896px] left-[560px] flex w-[800px] justify-center text-center"
      >
        {yourTurn && !complete && (
          <motion.p
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="frost-label flex items-center gap-[16px] px-[28px] py-[8px] text-[44px] leading-[1.3] font-bold whitespace-nowrap"
          >
            <Mascot decorative className="size-[100px] shrink-0" />
            ถึงตาหนูอ่านแล้ว
          </motion.p>
        )}
        {complete && (
          <div className={cx(card, 'relative flex items-center gap-[24px] px-[24px] py-[14px]')}>
            <p className="flex flex-col items-center text-[42px] leading-[1.3] font-bold whitespace-nowrap">
              <span>ฟังครบ {words.length} คำแล้ว</span>
              <span className="flex items-center gap-[10px]">
                <motion.span
                  className="shrink-0 text-[56px] leading-none"
                  initial={reduceMotion ? false : { scale: 0.4, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.5 }}
                >
                  <Star />
                </motion.span>
                เก่งมาก!
              </span>
            </p>
            <Button onClick={() => goTo(0)} className="relative flex h-[124px] items-center justify-center gap-[12px] px-[32px] text-[42px] font-bold whitespace-nowrap">
              <RotateCcw aria-hidden="true" className="size-[52px]" strokeWidth={3} />
              ฝึกอีกรอบ
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * The phone booth's recorder (booth centre x = 1490): the label and the recorder's messages above the booth,
 * the record ice block on its glass, glowing red while it records, and the play-back ice block under it.
 */
function Recorder() {
  const { status, recording, secondsLeft, toggle, playBack } = useListenRepeatRecorder()
  const { Button } = useKit()
  const reduceMotion = useReducedMotion()

  return (
    <>
      <div className="absolute top-[190px] left-[1350px] flex w-[280px] flex-col items-center gap-[12px]">
        <p className={label}>{recording ? <span data-testid="record-time">{secondsLeft} วินาที</span> : 'กดแล้วอ่านตาม'}</p>
        <div className="w-full rounded-[32px] bg-card/85 text-[28px] leading-[1.4] has-[p:empty:only-child]:bg-transparent">
          <RecorderMessages />
        </div>
      </div>

      {/* On the booth's glass: ลองอ่านเอง records, หยุดบันทึก stops. */}
      {recording && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-[628px] left-[1410px] h-[150px] w-[160px] rounded-[30px] bg-final blur-[26px]"
          initial={{ opacity: 0.5 }}
          animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0.4, 0.9, 0.4] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1, repeat: Infinity }}
        />
      )}
      <Button
        aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
        disabled={status === 'requesting'}
        onClick={toggle}
        className="absolute top-[628px] left-[1410px] flex h-[150px] w-[160px] items-center justify-center"
      >
        {recording ? (
          <Square aria-hidden="true" className="size-[64px] fill-comic-red text-comic-red" strokeWidth={3} />
        ) : (
          <Mic aria-hidden="true" className="size-[80px] text-comic-red" strokeWidth={3} />
        )}
      </Button>

      {status === 'ready' && (
        <Button aria-label="ฟังเสียงตัวเอง" onClick={playBack} className={cx(iceRound, 'absolute top-[805px] left-[1425px]')}>
          <Play aria-hidden="true" className="size-[70px] fill-current" strokeWidth={3} />
        </Button>
      )}
    </>
  )
}

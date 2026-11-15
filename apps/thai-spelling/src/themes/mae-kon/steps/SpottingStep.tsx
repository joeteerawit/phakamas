import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { SpottingWord } from '../../../lessons'
import { spottingPicture, useSpellingPlaying, useSpotting } from '../../../steps/spotting/useSpotting'
import type { StepProps } from '../../../steps/stepProps'
import { cx } from '../../../ui/clay/buttonClass'
import { useKit } from '../../../ui/kit'
import { SpeakerButton } from '../../../ui/SpeakerButton'
import { usePointerDrag } from '../../../ui/usePointerDrag'
import { NgobArt } from '../kit/parts'
import { tilesOf } from './tiles'

const label = 'bamboo-label px-[28px] font-heading text-[34px] leading-[1.4] font-bold whitespace-nowrap text-kon-ink'
// Stage pixels: three cards 420 wide, 10 apart, across 320–1600, clear of the lotus pads down the window's sides.
// In each card: the picture (16–146), the word's tiles (196–320, each 124 square, 8 apart), the spelling line
// (330–380) and the hat's peg (386–510). The controls run along the bottom (836–960), the hints above the cards.
const CARD = { left: 320, top: 300, width: 420, height: 520, gap: 10 }
const TILE = { size: 124, gap: 8, top: 196 }
const HAT = { width: 130, height: 124, top: 386 }
const tileLeft = (i: number, count: number) => CARD.width / 2 - (count * TILE.size + (count - 1) * TILE.gap) / 2 + i * (TILE.size + TILE.gap)
const hatLeft = CARD.width / 2 - HAT.width / 2

type Hint = { word: string; message: string }

/**
 * แม่กน Step 4, hat on the final (docs/mae-kon-spec.md), over the quiet canal. Three bamboo-tray cards at the hat stall
 * each spell their word on wooden tiles, with a small red งอบ resting on the card's peg. The student drags the hat onto
 * the final consonant, or taps the hat to lift it (or just a tile) and then the tile. On the น the hat stays, the น turns
 * red and the word's slow spelling plays and sweeps part by part (Step 4's shared behaviour); on any other tile the hat
 * drops back to its peg and the Step's narration plays again as a short hint. Two sets of three words, as on แม่กง;
 * แสดงตัวสะกด puts a hat on every น at once. No timer; under reduced motion the hat jumps straight to its place.
 */
export function SpottingStep({ lesson }: StepProps) {
  const { heading } = lesson.spotting
  const spotting = useSpotting(lesson)
  const { sets, setIndex, words, explaining, explain, showSet } = spotting
  const { Button } = useKit()
  const [placed, setPlaced] = useState<ReadonlySet<string>>(() => new Set())
  const [lifted, setLifted] = useState<string | null>(null)
  const [hint, setHint] = useState<Hint | null>(null)
  const done = words.every((word) => placed.has(word.audio.id))

  const place = (word: SpottingWord, tile: number) => {
    setLifted(null)
    if (placed.has(word.audio.id)) return spotting.play(word)
    if (tilesOf(word)[tile]!.final) {
      setPlaced((old) => new Set(old).add(word.audio.id))
      setHint(null)
      return spotting.play(word)
    }
    setHint({ word: word.audio.text, message: `ยังไม่ใช่ ตัวสะกดของคำว่า ${word.audio.text} อยู่ท้ายคำ ลองใหม่นะ` })
    explain()
  }

  const showAll = () => {
    setLifted(null)
    setHint(null)
    setPlaced((old) => new Set([...old, ...words.map((word) => word.audio.id)]))
  }

  const goToSet = (i: number) => {
    setLifted(null)
    setHint(null)
    showSet(i)
  }

  return (
    <section data-full-stage aria-label={`คำในมาตรา${lesson.finalGroup}`} className="relative size-full font-heading text-kon-ink">
      <h2 className={cx(label, 'absolute top-[150px] left-1/2 -translate-x-1/2 text-[38px]')}>{heading}</h2>

      <div role="status" aria-live="polite" data-testid="hat-messages" className="absolute top-[232px] left-[320px] flex h-[60px] w-[1280px] items-center justify-center text-center">
        {hint ? (
          <p className="text-[32px] leading-[1.3] font-bold text-coral-deep">{hint.message}</p>
        ) : (
          done && <p className="text-[34px] leading-[1.3] font-bold text-canal-deep">เก่งมาก! ใส่หมวกบนตัวสะกดครบ {words.length} คำแล้ว</p>
        )}
      </div>

      <ul>
        {words.map((word, i) => (
          <li key={word.audio.id} className="absolute" style={{ left: CARD.left + i * (CARD.width + CARD.gap), top: CARD.top, width: CARD.width, height: CARD.height }}>
            <HatCard
              word={word}
              placed={placed.has(word.audio.id)}
              lifted={lifted === word.audio.id}
              activePart={spotting.activePart(word)}
              onLift={() => setLifted((old) => (old === word.audio.id ? null : word.audio.id))}
              onPlace={(tile) => place(word, tile)}
            />
          </li>
        ))}
      </ul>

      {/* Along the bottom: the narration, the sets, and แสดงตัวสะกด. */}
      <div className="absolute top-[836px] left-[330px] flex items-center gap-[14px]">
        <div className="relative size-[124px]">
          <SpeakerButton label="ฟังคำอธิบาย" onClick={explain} playing={explaining} className="inset-0 size-full" />
        </div>
        <p aria-hidden="true" className={cx(label, 'px-[18px] text-[30px]')}>
          ฟังคำอธิบาย
        </p>
      </div>
      <nav aria-label="ชุดคำ" className="absolute top-[836px] left-[760px] flex items-center gap-[16px]">
        <Button aria-label="ชุดก่อนหน้า" disabled={setIndex === 0} onClick={() => goToSet(setIndex - 1)} className="relative flex size-[124px] items-center justify-center">
          <ChevronLeft aria-hidden="true" className="relative size-[72px]" strokeWidth={3} />
        </Button>
        <p className={label}>
          ชุดที่ {setIndex + 1}/{sets.length}
        </p>
        <Button
          aria-label="ชุดถัดไป"
          disabled={setIndex === sets.length - 1}
          onClick={() => goToSet(setIndex + 1)}
          className="relative flex size-[124px] items-center justify-center"
        >
          <ChevronRight aria-hidden="true" className="relative size-[72px]" strokeWidth={3} />
        </Button>
      </nav>
      <Button onClick={showAll} disabled={done} className="absolute top-[836px] left-[1240px] flex h-[124px] w-[360px] items-center justify-center gap-[10px] px-[30px] text-[34px] font-bold whitespace-nowrap">
        <Eye aria-hidden="true" className="relative size-[46px]" strokeWidth={3} />
        <span className="relative">แสดงตัวสะกด</span>
      </Button>
    </section>
  )
}

type HatCardProps = {
  word: SpottingWord
  placed: boolean
  lifted: boolean
  activePart: number | null
  onLift: () => void
  onPlace: (tile: number) => void
}

/** One word's card: its picture, its letters on wooden tiles, its spelling line and its red งอบ. */
function HatCard({ word, placed, lifted, activePart, onLift, onPlace }: HatCardProps) {
  const { card } = useKit()
  const still = !!useReducedMotion()
  const playing = useSpellingPlaying(word)
  const tiles = tilesOf(word)
  const finalAt = tiles.findIndex((tile) => tile.final)
  const drag = usePointerDrag((_, x, y) => {
    const tile = document.elementsFromPoint(x, y).find((el) => el instanceof HTMLElement && el.dataset.tile !== undefined) as HTMLElement | undefined
    if (tile && tile.dataset.word === word.audio.id) onPlace(Number(tile.dataset.tile))
  })
  const dragging = drag.dragging?.id === word.audio.id ? drag.dragging : null

  return (
    <div data-testid="hat-card" data-word={word.audio.text} data-placed={placed || undefined} data-highlight={playing || undefined} className={cx('relative size-full', card)}>
      <img src={spottingPicture(word)} alt="" draggable={false} className="pointer-events-none absolute top-[2px] left-1/2 h-[130px] w-[150px] -translate-x-1/2 object-contain" />

      <ol aria-label={`คำว่า ${word.audio.text}`}>
        {tiles.map((tile, i) => {
          const isFinal = placed && i === finalAt
          return (
            <li key={i}>
              <button
                type="button"
                data-tile={i}
                data-word={word.audio.id}
                aria-label={isFinal ? `${tile.text} ตัวสะกด` : `${tile.text} ตัวที่ ${i + 1}`}
                aria-pressed={isFinal}
                onClick={() => onPlace(i)}
                className="pointer-events-auto absolute cursor-pointer rounded-[18px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
                style={{ left: tileLeft(i, tiles.length) - 14, top: TILE.top - 14, width: TILE.size, height: TILE.size }}
              >
                <span data-testid="wooden-tile" className="wooden-tile absolute inset-0 flex items-center justify-center">
                  <span className={cx('font-heading text-[84px] leading-[1.3] font-bold', isFinal ? 'text-coral-deep' : 'text-kon-ink')}>{tile.text}</span>
                </span>
                {/* The hat resting on the final once it is found. */}
                {isFinal && (
                  <motion.span
                    data-testid="placed-hat"
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-[56px] left-1/2 block h-[66px] w-[100px] -translate-x-1/2"
                    initial={still ? false : { y: -40, scale: 1.2 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 16 }}
                  >
                    <NgobArt colour="var(--color-coral)" />
                  </motion.span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {/* The spelling line, swept part by part while it plays. */}
      <p aria-hidden="true" data-testid="spelling-line" className="pointer-events-none absolute inset-x-0 top-[316px] text-center text-[30px] leading-[1.4] font-bold whitespace-nowrap">
        {placed &&
          word.spelling.map((part, i) => (
            <span key={i} data-active={activePart === i || undefined} className={cx('mx-[4px] rounded-[10px] px-[4px]', activePart === i && 'bg-marigold text-kon-ink')}>
              {part}
            </span>
          ))}
      </p>

      {/* The peg and its hat: drag it onto a tile, or tap it to lift it and then tap a tile. Gone once placed. */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 block h-[20px] w-[24px] -translate-x-1/2 rounded-[8px] border-[4px] border-kon-ink bg-teak-deep" style={{ top: HAT.top + HAT.height - 34 }} />
      {!placed && (
        <motion.button
          type="button"
          aria-label={`หมวกงอบของคำว่า ${word.audio.text}`}
          aria-pressed={lifted}
          data-testid="hat"
          {...drag.handlers(word.audio.id)}
          onClick={drag.click(onLift)}
          className="pointer-events-auto absolute cursor-grab touch-none rounded-[24px] select-none focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-ring"
          style={{ left: hatLeft - 14, top: HAT.top - 14, width: HAT.width, height: HAT.height, zIndex: dragging ? 20 : undefined }}
          initial={false}
          animate={dragging ? { x: dragging.dx, y: dragging.dy, scale: 1.1 } : lifted ? { x: 0, y: still ? 0 : -14, scale: still ? 1 : 1.08 } : { x: 0, y: 0, scale: 1 }}
          transition={dragging || still ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 20 }}
        >
          <NgobArt colour="var(--color-coral)" className={cx(lifted && 'drop-shadow-[0_10px_0_rgb(43_29_18/0.35)]')} />
        </motion.button>
      )}
    </div>
  )
}

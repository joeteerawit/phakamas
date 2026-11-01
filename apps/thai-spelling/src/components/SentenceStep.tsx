import { Check, Mic, Play, RotateCcw, Square, Volume2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { playClip, useClipStatus } from '../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../audio/recorder'
import type { Sentence } from '../lessons'
import { Button } from './clay/Button'
import { cx } from './clay/buttonClass'
import { Card, cardClass, toneAt } from './clay/Card'
import { RecorderMessages } from './RecorderMessages'
import type { StepProps } from './stepProps'

const icon = 'size-7 shrink-0'

/** Step 9: each sentence card plays only its own sentence; the student records the selected one. */
export function SentenceStep({ lesson }: StepProps) {
  const [selected, setSelected] = useState(0)
  useEffect(() => discardRecording, [])

  const choose = (i: number) => {
    // Switching sentence throws the old recording away (and releases the mic); the same card just ends it.
    if (i !== selected) discardRecording()
    else stopRecording()
    setSelected(i)
    playClip(lesson.sentences[i]!.audio)
  }

  return (
    <section className="flex flex-1 flex-col items-center gap-(--space-lg)">

      <ul className="grid w-full max-w-3xl gap-(--space-md) sm:grid-cols-2">
        {lesson.sentences.map((sentence, i) => (
          <li key={sentence.audio.id}>
            <SentenceCard sentence={sentence} index={i} selected={i === selected} onPlay={() => choose(i)} />
          </li>
        ))}
      </ul>

      <SentenceRecorder number={selected + 1} />
    </section>
  )
}

type SentenceCardProps = { sentence: Sentence; index: number; selected: boolean; onPlay: () => void }

function SentenceCard({ sentence, index, selected, onPlay }: SentenceCardProps) {
  const status = useClipStatus(sentence.audio.id)
  const active = status === 'loading' || status === 'playing'

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPlay}
      className={cx(
        cardClass({ tone: toneAt(index), selected, playing: status === 'playing' }),
        'flex w-full cursor-pointer select-none flex-col items-center gap-(--space-xs) p-(--space-sm) sm:p-(--space-md)',
        'transition-[transform,box-shadow] duration-150 ease-out active:translate-y-1 active:shadow-clay-pressed motion-reduce:transition-none',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <span className="flex items-center gap-(--space-xs) font-semibold">
        <Volume2 aria-hidden="true" className={cx('size-6 shrink-0', active && 'motion-safe:animate-pulse')} strokeWidth={2.5} />
        ฟังประโยคที่ {index + 1}
      </span>
      <span className="flex justify-center gap-(--space-xs)">
        {sentence.images.map((src) => (
          <img key={src} src={src} alt="" width={256} height={256} draggable={false} className="pointer-events-none size-20 object-contain sm:size-24" />
        ))}
      </span>
      <span className="font-heading text-heading font-bold">{sentence.audio.text}</span>
      {/* Selection is shown by text and icon, not by the pink border alone. */}
      <span className={cx('flex items-center gap-(--space-xs) font-semibold', !selected && 'invisible')}>
        <Check aria-hidden="true" className="size-5 shrink-0" strokeWidth={3} />
        ประโยคที่เลือก
      </span>
    </button>
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
    <Card className="flex w-full max-w-xl flex-col items-center gap-(--space-sm)">
      <h2 className="font-heading text-heading font-semibold">บันทึกประโยคที่ {number}</h2>
      <div className="flex flex-wrap justify-center gap-(--space-sm)">
        {!practising ? (
          <Button onClick={() => setPractising(true)}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            ลองอ่านเอง
          </Button>
        ) : status === 'recording' ? (
          <Button onClick={stopRecording}>
            <Square aria-hidden="true" className={icon} strokeWidth={2.5} />
            หยุดบันทึก
          </Button>
        ) : status === 'ready' && confirming ? (
          <>
            <p className="w-full text-center font-semibold">อัดทับเสียงเดิมใช่ไหม</p>
            <Button onClick={record}>
              <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
              อัดใหม่เลย
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              <X aria-hidden="true" className={icon} strokeWidth={2.5} />
              ยกเลิก
            </Button>
          </>
        ) : status === 'ready' ? (
          <>
            <Button onClick={playRecording}>
              <Play aria-hidden="true" className={icon} strokeWidth={2.5} />
              ฟังเสียงตัวเอง
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              <RotateCcw aria-hidden="true" className={icon} strokeWidth={2.5} />
              ลองอีกครั้ง
            </Button>
          </>
        ) : (
          <Button onClick={record} disabled={status === 'requesting'}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            เริ่มบันทึก
          </Button>
        )}
      </div>

      <RecorderMessages />
    </Card>
  )
}

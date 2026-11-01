import { ChevronLeft, ChevronRight, ListOrdered, Mic, Play, RotateCcw, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { playClip, stopAudio, useAudio } from '../audio/audioManager'
import { discardRecording, playRecording, startRecording, stopRecording, useRecorder } from '../audio/recorder'
import { Button } from './clay/Button'
import { cx } from './clay/buttonClass'
import { Card } from './clay/Card'
import { Mascot } from './Mascot'
import { RecorderMessages } from './RecorderMessages'
import type { StepProps } from './stepProps'

const icon = 'size-7 shrink-0'

/** Step 7: ฟังครูอ่าน plays every line in order; step mode plays one line at a time; the student records themself. */
export function RhymeStep({ lesson }: StepProps) {
  const lines = lesson.rhyme
  // Step mode's selected line; null outside step mode.
  const [stepLine, setStepLine] = useState<number | null>(null)
  // Index of the line ฟังครูอ่าน is on; when that line ends, the next one plays.
  const sequence = useRef<number | null>(null)
  // The line หยุดเสียง paused ฟังครูอ่าน on; the next ฟังครูอ่าน resumes there.
  const paused = useRef<number | null>(null)

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
    <section className="flex flex-1 flex-col items-center gap-(--space-lg)">

      <Card tone="mint" className="flex w-full max-w-xl flex-col items-center gap-(--space-md) sm:flex-row sm:items-center">
        <Mascot size="md" decorative />
        <ol aria-label="บทคล้องจอง" className="flex w-full flex-col gap-(--space-sm)">
          {lines.map((line, i) => {
            const current = i === highlighted
            return (
              <li
                key={line.id}
                aria-current={current}
                className={cx(
                  'flex items-center gap-(--space-sm) rounded-2xl border-[3px] px-(--space-xs) font-heading text-body-lg font-semibold whitespace-nowrap transition-colors sm:px-(--space-sm) sm:text-heading duration-200 motion-reduce:transition-none',
                  current ? 'border-highlight bg-tint-yellow' : 'border-transparent',
                )}
              >
                <Volume2 aria-hidden="true" className={cx(icon, !current && 'invisible')} strokeWidth={2.5} />
                {line.text}
              </li>
            )
          })}
        </ol>
      </Card>

      {playingIndex >= 0 && audio.status === 'error' && (
        <p role="status" className="font-semibold">
          เปิดเสียงไม่ได้ กด “ฟังครูอ่าน” เพื่อลองอีกครั้ง
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-(--space-sm)">
        <Button variant="secondary" onClick={playAll}>
          <Volume2 aria-hidden="true" className={icon} strokeWidth={2.5} />
          ฟังครูอ่าน
        </Button>
        <Button variant="secondary" onClick={() => goToLine(stepLine ?? 0)}>
          <ListOrdered aria-hidden="true" className={icon} strokeWidth={2.5} />
          อ่านตามทีละวรรค
        </Button>
        <Button variant="ghost" onClick={pause} disabled={!busy}>
          <Square aria-hidden="true" className={icon} strokeWidth={2.5} />
          หยุดเสียง
        </Button>
      </div>

      {stepLine !== null && (
        <div className="flex flex-wrap justify-center gap-(--space-sm)">
          <Button variant="ghost" onClick={() => goToLine(stepLine - 1)} disabled={stepLine === 0}>
            <ChevronLeft aria-hidden="true" className={icon} strokeWidth={2.5} />
            วรรคก่อนหน้า
          </Button>
          <Button variant="ghost" onClick={() => goToLine(stepLine + 1)} disabled={stepLine === lines.length - 1}>
            วรรคถัดไป
            <ChevronRight aria-hidden="true" className={icon} strokeWidth={2.5} />
          </Button>
        </div>
      )}

      <RecorderControls />
    </section>
  )
}

/** ลองอ่านเอง → หยุดบันทึก → ฟังเสียงตัวเอง / อัดใหม่. */
function RecorderControls() {
  const status = useRecorder((state) => state.status)

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-(--space-sm)">
      <div className="flex flex-wrap justify-center gap-(--space-sm)">
        {status === 'recording' ? (
          <Button onClick={stopRecording}>
            <Square aria-hidden="true" className={icon} strokeWidth={2.5} />
            หยุดบันทึก
          </Button>
        ) : status === 'ready' ? (
          <>
            <Button onClick={playRecording}>
              <Play aria-hidden="true" className={icon} strokeWidth={2.5} />
              ฟังเสียงตัวเอง
            </Button>
            <Button variant="ghost" onClick={discardRecording}>
              <RotateCcw aria-hidden="true" className={icon} strokeWidth={2.5} />
              อัดใหม่
            </Button>
          </>
        ) : (
          <Button onClick={() => void startRecording()} disabled={status === 'requesting'}>
            <Mic aria-hidden="true" className={icon} strokeWidth={2.5} />
            ลองอ่านเอง
          </Button>
        )}
      </div>

      <RecorderMessages />
    </div>
  )
}

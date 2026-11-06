import { Mic, Square } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cx, pressable } from './clay/buttonClass'

type RecordBuzzerProps = {
  recording: boolean
  disabled: boolean
  onClick: () => void
  /** Stage position, if any; the buzzer is drawn 280×242 (scale a wrapper to draw it smaller). */
  className?: string
}

/** Step 3's red comic buzzer: ลองอ่านเอง records, หยุดบันทึก stops; it glows while recording. */
export function RecordBuzzer({ recording, disabled, onClick, className }: RecordBuzzerProps) {
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      aria-label={recording ? 'หยุดบันทึก' : 'ลองอ่านเอง'}
      disabled={disabled}
      onClick={onClick}
      className={cx(pressable, 'relative h-[242px] w-[280px]', className)}
    >
      {recording && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-[20px] top-[10px] bottom-[60px] rounded-full bg-final blur-[30px]"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1, repeat: Infinity }}
        />
      )}
      <img src="/assets/comic/ui-buzzer.webp" alt="" draggable={false} className="relative size-full object-contain" />
      <span className="absolute inset-x-0 top-[40px] flex justify-center text-card drop-shadow-[4px_5px_0_var(--color-comic-ink)]">
        {recording ? (
          <Square aria-hidden="true" className="size-[80px] fill-card" strokeWidth={3} />
        ) : (
          <Mic aria-hidden="true" className="size-[90px]" strokeWidth={3} />
        )}
      </span>
    </button>
  )
}

import { useEffect, useRef } from 'react'
import { Mascot } from '../Mascot'
import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Clay confirm on a native modal `<dialog>`: focus trap, Esc = cancel, focus returns to the opener. */
export function ConfirmDialog({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-message"
      onClose={onCancel}
      className="m-auto w-[min(28rem,calc(100%-2*var(--space-md)))] rounded-clay border-[3px] border-border bg-card p-(--space-md) text-foreground shadow-clay backdrop:bg-foreground/40 open:starting:scale-95 open:starting:opacity-0 transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none"
    >
      <div className="flex flex-col items-center gap-(--space-md) text-center">
        <Mascot size="sm" decorative />
        <p id="confirm-message" className="font-heading text-heading font-semibold">
          {message}
        </p>
        <div className="flex w-full flex-col-reverse gap-(--space-sm) sm:flex-row sm:justify-center">
          {/* Safe choice first in focus order: showModal focuses the first button. */}
          <Button variant="primary" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant="ghost" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

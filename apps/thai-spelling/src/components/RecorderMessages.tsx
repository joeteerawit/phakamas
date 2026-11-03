import { recorderErrors, useRecorder } from '../audio/recorder'

/** The recorder's live status line and its mic error alert, shared by Steps 7 and 9. */
export function RecorderMessages() {
  const status = useRecorder((state) => state.status)

  return (
    <>
      <p role="status" className="min-h-[1.6em] text-center font-semibold">
        {status === 'requesting' && 'กำลังขอใช้ไมโครโฟน…'}
        {status === 'recording' && (
          <span className="inline-flex items-center gap-(--space-xs)">
            <span aria-hidden="true" className="size-3 rounded-full bg-wrong motion-safe:animate-pulse" />
            กำลังบันทึก (ไม่เกิน 30 วินาที)
          </span>
        )}
      </p>
      {(status === 'denied' || status === 'unsupported') && (
        <p role="alert" className="w-full rounded-clay border-4 border-comic-ink bg-tint-peach shadow-comic p-(--space-sm) text-center font-semibold">
          {recorderErrors[status]}
        </p>
      )}
    </>
  )
}

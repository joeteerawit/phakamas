import { createFileRoute, redirect } from '@tanstack/react-router'
import { DEFAULT_LESSON_ID } from '../lessons'

// Spec §3: `/` goes to Step 1 of แม่กง until there is a Lesson picker (#43); แม่กม is shared by its link.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/lesson/$lessonId/$step',
      params: { lessonId: DEFAULT_LESSON_ID, step: '1' },
      replace: true,
    })
  },
})

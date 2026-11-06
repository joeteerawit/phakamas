import { createFileRoute, redirect } from '@tanstack/react-router'
import { getTheme } from '../themes'
import { KitContext } from '../ui/kit'
import { MascotContext } from '../ui/mascotContext'
import { DEFAULT_LESSON_ID, getLesson } from '../lessons'

// A Lesson's Map (docs/game-concept.md); a Lesson whose Theme has none (แม่กง) lands on its cover.
export const Route = createFileRoute('/lesson/$lessonId/map')({
  beforeLoad: ({ params }) => {
    const lesson = getLesson(params.lessonId)
    if (!lesson || !getTheme(lesson.theme).map) {
      throw redirect({
        to: '/lesson/$lessonId/$step',
        params: { lessonId: lesson?.id ?? DEFAULT_LESSON_ID, step: '1' },
        replace: true,
      })
    }
    return { lesson }
  },
  component: MapPage,
})

function MapPage() {
  const { lesson } = Route.useRouteContext()
  const theme = getTheme(lesson.theme)
  const LessonMap = theme.map
  if (!LessonMap) return null
  return (
    <MascotContext.Provider value={theme.mascot}>
      <KitContext.Provider value={theme.kit}>
        {/* oxlint-disable-next-line react/static-components -- the Theme's Map is a module-level component, not a new one. */}
        <LessonMap lesson={lesson} />
      </KitContext.Provider>
    </MascotContext.Provider>
  )
}

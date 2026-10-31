import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import { MotionConfig } from 'motion/react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <Outlet />
      <Analytics />
    </MotionConfig>
  )
}

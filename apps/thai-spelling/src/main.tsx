// Self-hosted Thai subsets (MASTER.md): Anuphan 400/600 for body, Mali 600/700 for headings.
import '@fontsource/anuphan/thai-400.css'
import '@fontsource/anuphan/thai-600.css'
import '@fontsource/mali/thai-600.css'
import '@fontsource/mali/thai-700.css'
import './styles.css'
// Installs the background-music first-gesture listener on every entry route.
import './audio/music'

import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

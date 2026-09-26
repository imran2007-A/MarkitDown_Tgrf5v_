import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Toaster } from './components/Toaster'
import { Splash } from './components/Splash'
import './index.css'

if (window.mdify) document.documentElement.dataset.desktop = window.mdify.platform

// Desktop: every launch. Web: once per browser session.
function shouldSplash(): boolean {
  if (window.mdify) return true
  try {
    if (sessionStorage.getItem('mdify.splash')) return false
    sessionStorage.setItem('mdify.splash', '1')
  } catch { /* storage unavailable */ }
  return true
}

function Root() {
  const [splash, setSplash] = useState(shouldSplash)
  const [appReady, setAppReady] = useState(!splash)
  return (
    <Toaster>
      {appReady && <App />}
      {splash && <Splash onLeaving={() => setAppReady(true)} onDone={() => setSplash(false)} />}
    </Toaster>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

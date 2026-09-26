import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Toaster } from './components/Toaster'
import './index.css'

if (window.mdify) document.documentElement.dataset.desktop = window.mdify.platform

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster>
      <App />
    </Toaster>
  </StrictMode>,
)

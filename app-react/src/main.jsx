import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MobileWrapper from './components/MobileWrapper.jsx'

const isMobile = window.innerWidth < 1080

// Android/Chrome: evita saltos de 100vh cuando aparecen/desaparecen barras
const setViewportVars = () => {
  const vv = window.visualViewport
  const height = (vv?.height || window.innerHeight) * 0.01
  document.documentElement.style.setProperty('--app-vh', `${height}px`)
}
setViewportVars()
window.addEventListener('resize', setViewportVars)
window.visualViewport?.addEventListener('resize', setViewportVars)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isMobile ? (
      <MobileWrapper>
        <App />
      </MobileWrapper>
    ) : (
      <App />
    )}
  </StrictMode>,
)

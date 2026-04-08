import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MobileWrapper from './components/MobileWrapper.jsx'

const isMobile = window.innerWidth < 1080

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

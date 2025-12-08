import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'


console.log('%c NEXUSBOOK v3.2 - Stable ', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

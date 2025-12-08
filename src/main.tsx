import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'


console.log('%c NEXUSBOOK v3.1 ', 'background: #7c3aed; color: white; padding: 4px 8px; border-radius: 4px;')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

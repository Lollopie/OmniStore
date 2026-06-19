import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Register from './Register.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen">
      <Register />
    </div>
  </StrictMode>,
)

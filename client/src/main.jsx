import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font bundled into the site instead of fetched from a CDN. Loading it from
// Google's servers made every visitor's browser contact Google, which therefore
// saw their IP address: a third party receiving personal data for a decorative
// asset. Compiled in, no external request is made and none has to be declared.
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import './index.css'
import App from './App.jsx'

/**
 * ENTRY POINT
 * Initializes the React application and attaches it to the DOM root.
 * StrictMode is enabled for development-time safety checks.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

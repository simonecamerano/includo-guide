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
import PrivacyPolicy from './PrivacyPolicy.jsx'

/**
 * ENTRY POINT
 * Initializes the React application and attaches it to the DOM root.
 * StrictMode is enabled for development-time safety checks.
 *
 * Routing is a single path check rather than a router library: there are two
 * pages, the legal one is read once, and plain links that reload the page are
 * both simpler and more robust than client-side navigation. The server's SPA
 * fallback serves index.html for /privacy, so the deep link works on its own.
 */
const isPrivacyPage = window.location.pathname.replace(/\/+$/, '') === '/privacy'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPrivacyPage ? <PrivacyPolicy /> : <App />}
  </StrictMode>,
)

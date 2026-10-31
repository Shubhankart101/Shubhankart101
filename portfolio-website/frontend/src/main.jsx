import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'
import App from './Portfolio.jsx'
import RecoveryPage, { PortfolioErrorBoundary } from './RecoveryPage.jsx'

const appPath = import.meta.env.BASE_URL.replace(/\/+$/, '')
const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
const isPortfolioPath = currentPath === '/' || currentPath === '/index.html' || currentPath === appPath || currentPath === `${appPath}/index.html`

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortfolioErrorBoundary>
      {isPortfolioPath ? <App /> : <RecoveryPage code="404" />}
    </PortfolioErrorBoundary>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Register from './Register.jsx'
import Warden from './Warden.jsx'
import Deputy_warden from './Deputy_warden.jsx'
import Office from './Hostel_office.jsx'
// import Login from './Login.jsx'
import AuthWrapper from './AuthWrapper.jsx'
import MessReductionPage from './MessReductionPage.jsx'
import Deputy_warden_side from './Deputy_warden_side.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Set backend URL from environment variables, fallback to backend Vercel URL in production
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://smart-laundry-backend.vercel.app' : '');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

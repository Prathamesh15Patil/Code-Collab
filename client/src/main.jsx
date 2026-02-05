import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import.meta.env.VITE_BACKEND_URL

import {BrowserRouter as Router} from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <Router>
    <App/>
  </Router>,
)

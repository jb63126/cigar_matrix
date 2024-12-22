import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProductsPage from './components/ProductsPage.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'

createRoot(document.getElementById('root')).render(
  <Router>
    <Routes>
      <Route path='/' element={<App><ProductsPage /></App>} />
      <Route path="/:id" element={<App><ProductsPage /></App>} />
      <Route path='/privacy-policy' element={<App><PrivacyPolicy /></App>} />
    </Routes>
  </Router>
)

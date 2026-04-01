import React from 'react'
import ReactDOM from 'react-dom/client'
import WorldCupDashboard from './App'
import './index.css'

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <WorldCupDashboard />
    </React.StrictMode>
  )
}

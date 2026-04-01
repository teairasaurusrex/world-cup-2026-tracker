import React from 'react'
import ReactDOM from 'react-dom/client'
import WorldCupDashboard from './App' // Changed 'App' to the actual function name
import './index.css'

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <WorldCupDashboard />
    </React.StrictMode>,
  )
}

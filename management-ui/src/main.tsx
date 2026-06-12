import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ToastManager } from './components/ToastManager'
import { AppRoutes } from './routes/AppRoutes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
        <ToastManager />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>,
)


import './i18n'; 
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. استيراد React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. إنشاء الـ client
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3. تغليف تطبيقك بالـ Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
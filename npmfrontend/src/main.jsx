import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// React Query in 100 Seconds
//  https://www.youtube.com/watch?v=novnyCaa7To
// Learn React Query In 50 Minutes
//  https://www.youtube.com/watch?v=r8Dg0KVnfMA
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)

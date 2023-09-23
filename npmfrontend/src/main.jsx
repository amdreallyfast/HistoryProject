import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { stateStore } from './AppState/stateStore.jsx'
import { Provider as ReduxProvider } from 'react-redux'

// React Query in 100 Seconds
//  https://www.youtube.com/watch?v=novnyCaa7To
// Learn React Query In 50 Minutes
//  https://www.youtube.com/watch?v=r8Dg0KVnfMA
import { QueryClient as ReactQueryClient, QueryClientProvider as ReactQueryClientProvider } from '@tanstack/react-query'

const reactQueryClient = new ReactQueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactQueryClientProvider client={reactQueryClient}>
      <ReduxProvider store={stateStore}>
        <App />
      </ReduxProvider>
    </ReactQueryClientProvider>
  </React.StrictMode>,
)

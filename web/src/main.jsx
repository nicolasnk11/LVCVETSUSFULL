import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Sem StrictMode para não travar o mapa
createRoot(document.getElementById('root')).render(
  <App />
)
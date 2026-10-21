import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Inter (variable) — chỉ nạp subset latin + vietnamese để giữ nhẹ.
import '@fontsource-variable/inter/wght.css'
import './styles/theme.css' // bảng màu teal-zinc (nguồn màu duy nhất)
import './index.css'
import { initTheme } from './lib/theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

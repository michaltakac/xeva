import React from 'react'
import ReactDOM from 'react-dom/client'
// import XevaDemo from './XevaDemo'
import XevaUIDemo from './xeva-demo' // UIKit demo without XEVA

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <XevaUIDemo />
  </React.StrictMode>
)
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"
import "./index.css"
import Lenis from "lenis"
import { useEffect } from "react"

function ScrollProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      duration: 1.05,
      lerp: 0.08,
    })

    let frameId = 0

    const raf = (time) => {
      lenis.raf(time)
      frameId = window.requestAnimationFrame(raf)
    }

    frameId = window.requestAnimationFrame(raf)

    return () => {
      window.cancelAnimationFrame(frameId)
      lenis.destroy()
    }
  }, [])

  return children
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ScrollProvider>
        <App />
      </ScrollProvider>
    </AuthProvider>
  </React.StrictMode>
)
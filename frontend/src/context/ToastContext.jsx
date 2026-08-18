import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import './ToastContext.css'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message, type = 'info', duration = 3200) => {
      const id = ++counter.current
      setToasts((t) => [...t, { id, message, type }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info
            return (
              <motion.div
                key={t.id}
                className={`toast toast-${t.type}`}
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                onClick={() => dismiss(t.id)}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{t.message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

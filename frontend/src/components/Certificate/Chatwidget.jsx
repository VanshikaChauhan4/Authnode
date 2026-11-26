import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, ShieldCheck } from 'lucide-react'
import { askChatbot } from '../lib/api'
import './ChatWidget.css'

const WELCOME = {
  role: 'assistant',
  text: "Hi, I'm the AuthNode Assistant. Ask me about issuing, verifying, or how certificate trust works.",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSend(e) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await askChatbot(question, sessionId)
      if (res.sessionId) setSessionId(res.sessionId)
      setMessages((prev) => [...prev, { role: 'assistant', text: res.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I couldn't reach the assistant service. Please try again in a moment.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-widget">
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="chat-panel-header">
              <div className="chat-panel-title">
                <ShieldCheck size={16} strokeWidth={2.2} />
                <span>AuthNode Assistant</span>
              </div>
              <button
                className="chat-panel-close"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="chat-panel-body" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">
                  <Loader2 size={14} className="chat-spinner" />
                  Thinking&hellip;
                </div>
              )}
            </div>

            <form className="chat-panel-input" onSubmit={handleSend}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask a question&hellip;"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
              />
              <button type="submit" aria-label="Send" disabled={loading || !input.trim()}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="chat-toggle"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { askChatbot } from '../lib/ledger'
import './ChatWidget.css'

const WELCOME = {
  role: 'assistant',
  text: "Hi! I'm the AuthNode Assistant. Ask me why a certificate isn't verifying, how issuing works, or anything about the app.",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const data = await askChatbot(text)
      setMessages((m) => [...m, { role: 'assistant', text: data.answer, mode: data.mode, sources: data.sources || [] }])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "I can't reach the chatbot right now. Start the chatbot service on port 8000, or check the FAQ in the Verify flow.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="chat-header">
              <span>AuthNode Assistant</span>
              <span className="chat-status">
                <span className="chat-dot" /> RAG helper
              </span>
            </div>

            <div className="chat-body" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                  {m.text}
                  {m.sources?.length > 0 && (
                    <div className="chat-sources">
                      Sources: {m.sources.map((source) => source.source).join(', ')}
                    </div>
                  )}
                  {m.mode && <div className="chat-mode">{m.mode}</div>}
                </div>
              ))}
              {loading && <div className="chat-bubble chat-bubble-assistant chat-typing">···</div>}
            </div>

            <form className="chat-input-row" onSubmit={handleSend}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Why isn't my certificate verifying?"
                disabled={loading}
              />
              <button type="submit" aria-label="Send" disabled={loading}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the UIUJEF AI Assistant. How can I help you today?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat({ role: 'user', content: userMessage }).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      
      if (response.ok && data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again later.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center rounded-full bg-[#F26522] text-white shadow-xl hover:shadow-[#F26522]/30 transition-all duration-300 hover:scale-105",
          isOpen ? "size-12" : "size-14"
        )}
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-7" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#F26522] to-[#d5581e] p-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Bot className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">UIUJEF Assistant</h3>
                <p className="text-white/80 text-xs">
                  Created by <a href="https://shaikhjubair.me" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors font-medium">Jubair</a>
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="size-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                {msg.role === 'assistant' && (
                  <div className="size-8 rounded-full bg-[#F26522]/10 flex items-center justify-center shrink-0 border border-[#F26522]/20">
                    <Bot className="size-4 text-[#F26522]" />
                  </div>
                )}
                <div className={cn(
                  "px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm",
                  msg.role === 'user' 
                    ? "bg-[#F26522] text-white rounded-tr-sm" 
                    : "bg-white border border-border/50 text-navy rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="size-8 rounded-full bg-[#F26522]/10 flex items-center justify-center shrink-0 border border-[#F26522]/20">
                  <Bot className="size-4 text-[#F26522]" />
                </div>
                <div className="bg-white border border-border/50 text-navy rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-[#F26522]" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-border/50">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask something about UIUJEF..."
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-border/50 bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-[#F26522]/50 text-sm"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-[#F26522] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d5581e] transition-colors"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

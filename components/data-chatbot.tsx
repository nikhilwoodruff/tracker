'use client'

import { useState, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { Send, Bot, User, Loader } from 'lucide-react'
import { Card, Button } from './styled'
import { createClient } from '@/lib/supabase/client'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const ChatContainer = styled(Card)`
  max-width: 100%;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.5s ease-out;
`

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const ChatTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`

const MessagesContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Message = styled.div<{ role: 'user' | 'assistant' }>`
  display: flex;
  gap: 8px;
  animation: ${fadeIn} 0.3s ease-out;
  align-items: flex-start;
`

const MessageIcon = styled.div<{ role: 'user' | 'assistant' }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, role }) => 
    role === 'user' ? theme.primary : theme.secondary};
  color: ${({ theme, role }) => 
    role === 'user' ? theme.primaryForeground : theme.secondaryForeground};
  flex-shrink: 0;
`

const MessageContent = styled.div`
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.foreground};
  
  p {
    margin: 0 0 8px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
  }
  
  code {
    background: ${({ theme }) => theme.secondary};
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 12px;
  }
`

const InputContainer = styled.form`
  display: flex;
  gap: 8px;
`

const ChatInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.foreground};
  font-size: 13px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  
  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.mutedForeground};
    animation: bounce 1.4s infinite ease-in-out both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function DataChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchRecentData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', tenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching data:', error)
      return null
    }

    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const recentData = await fetchRecentData()
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: recentData,
          history: messages
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>
          <Bot size={16} />
          Ask about your data
        </ChatTitle>
      </ChatHeader>

      {messages.length === 0 && (
        <MessageContent style={{ opacity: 0.7, fontSize: '12px' }}>
          Ask me questions about your tracked data from the last 10 days. For example:
          <ul style={{ marginTop: '8px' }}>
            <li>"What's my average calorie intake?"</li>
            <li>"How has my mood been this week?"</li>
            <li>"What days did I exercise?"</li>
            <li>"Analyze my sleep patterns"</li>
          </ul>
        </MessageContent>
      )}

      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} role={message.role}>
            <MessageIcon role={message.role}>
              {message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </MessageIcon>
            <MessageContent dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
          </Message>
        ))}
        {loading && (
          <Message role="assistant">
            <MessageIcon role="assistant">
              <Bot size={12} />
            </MessageIcon>
            <MessageContent>
              <LoadingDots>
                <span />
                <span />
                <span />
              </LoadingDots>
            </MessageContent>
          </Message>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer onSubmit={handleSubmit}>
        <ChatInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your health metrics, patterns, or trends..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </InputContainer>
    </ChatContainer>
  )
}
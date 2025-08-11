'use client'

import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatInterface from '@/components/chat-interface'
import MetricsDashboard from '@/components/metrics-dashboard'
import DataChatbot from '@/components/data-chatbot'
import { LogOut, BarChart3, MessageSquare } from 'lucide-react'
import {
  Container,
  Header,
  HeaderContent,
  Logo,
  UserSection,
  UserEmail,
  Button,
  Main,
  Section,
  SectionHeader,
  SectionTitle
} from '@/components/styled'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/login')
      }
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (loading) return null

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Logo>tracker</Logo>
          <UserSection>
            <UserEmail>{user?.email}</UserEmail>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut size={12} />
              sign out
            </Button>
          </UserSection>
        </HeaderContent>
      </Header>

      <Main>
        <DataChatbot />
        
        <Section>
          <SectionHeader>
            <MessageSquare size={16} />
            <SectionTitle>Log entry</SectionTitle>
          </SectionHeader>
          <ChatInterface />
        </Section>

        <Section>
          <SectionHeader>
            <BarChart3 size={16} />
            <SectionTitle>Metrics</SectionTitle>
          </SectionHeader>
          <MetricsDashboard />
        </Section>
      </Main>
    </Container>
  )
}
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { Container, Card, Input, Button } from '@/components/styled'

const LoginContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
`

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: 32px;
`

const Title = styled.h2`
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ToggleButton = styled.button`
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
  background: none;
  border: none;
  margin-top: 16px;
  cursor: pointer;
  
  &:hover {
    color: ${({ theme }) => theme.foreground};
  }
`

const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: 8px;
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <LoginContainer>
      <LoginCard>
        <Title>{isSignUp ? 'sign up' : 'sign in'}</Title>
        <Form onSubmit={handleAuth}>
          <Input
            type="email"
            required
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'loading...' : isSignUp ? 'sign up' : 'sign in'}
          </SubmitButton>
        </Form>
        <ToggleButton onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'already have an account? sign in' : "don't have an account? sign up"}
        </ToggleButton>
      </LoginCard>
    </LoginContainer>
  )
}
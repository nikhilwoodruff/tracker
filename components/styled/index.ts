import styled from 'styled-components'

export const Container = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
`

export const Header = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.card};
  padding: 12px 0;
`

export const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const Logo = styled.h1`
  font-size: 18px;
  font-weight: 600;
`

export const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

export const UserEmail = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
`

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'ghost' }>`
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  background-color: ${({ theme, variant = 'primary' }) => 
    variant === 'primary' ? theme.primary : 
    variant === 'secondary' ? theme.secondary : 
    'transparent'};
  color: ${({ theme, variant = 'primary' }) => 
    variant === 'primary' ? theme.primaryForeground : 
    variant === 'secondary' ? theme.secondaryForeground : 
    theme.foreground};
  
  &:hover {
    opacity: 0.9;
    background-color: ${({ theme, variant = 'primary' }) => 
      variant === 'ghost' ? theme.secondary : undefined};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Main = styled.main`
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 16px;
  
  @media (min-width: 768px) {
    padding: 32px;
  }
`

export const Section = styled.div`
  margin-bottom: 32px;
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`

export const SectionTitle = styled.h2`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.mutedForeground};
`

export const Card = styled.div`
  background-color: ${({ theme }) => theme.card};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 16px;
`

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.foreground};
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.ring};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.foreground};
  font-size: 14px;
  resize: none;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.ring};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Form = styled.form`
  display: flex;
  gap: 8px;
`

export const Grid = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ cols = 1 }) => cols}, 1fr);
  gap: 16px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

export const MetricCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.mutedForeground};
`

export const MetricContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
`

export const Certainty = styled.span`
  opacity: 0.6;
  margin-left: 4px;
`
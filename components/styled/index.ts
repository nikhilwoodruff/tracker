import styled, { keyframes } from 'styled-components'

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

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  animation: ${fadeIn} 0.5s ease-out;
`

export const Header = styled.header`
  background: ${({ theme }) => theme.glass};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.glassBorder};
  padding: 16px 0;
  animation: ${slideDown} 0.6s ease-out;
  position: sticky;
  top: 0;
  z-index: 100;
`

export const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  
  @media (min-width: 768px) {
    padding: 0 24px;
  }
`

export const Logo = styled.h1`
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (min-width: 768px) {
    font-size: 24px;
  }
`

export const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (min-width: 768px) {
    gap: 16px;
  }
`

export const UserEmail = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.mutedForeground};
  font-family: 'JetBrains Mono', monospace;
  display: none;
  
  @media (min-width: 480px) {
    display: inline;
    font-size: 12px;
  }
  
  @media (min-width: 768px) {
    font-size: 13px;
  }
`

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'ghost' }>`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme, variant = 'primary' }) => 
    variant === 'ghost' ? 'transparent' : theme.glassBorder};
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-family: 'JetBrains Mono', monospace;
  
  background: ${({ theme, variant = 'primary' }) => 
    variant === 'primary' ? theme.primary : 
    variant === 'secondary' ? theme.secondary : 
    theme.glass};
  
  color: ${({ theme, variant = 'primary' }) => 
    variant === 'ghost' ? theme.foreground : '#ffffff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme, variant = 'primary' }) => 
      variant === 'primary' ? `${theme.primary}40` : 
      variant === 'secondary' ? `${theme.secondary}40` : 
      'rgba(255, 255, 255, 0.1)'};
    
    background: ${({ theme, variant = 'primary' }) => 
      variant === 'primary' ? `${theme.primary}dd` : 
      variant === 'secondary' ? `${theme.secondary}dd` : 
      'rgba(255, 255, 255, 0.1)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

export const Main = styled.main`
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px;
  
  @media (min-width: 480px) {
    padding: 24px 20px;
  }
  
  @media (min-width: 768px) {
    padding: 32px 24px;
  }
  
  @media (min-width: 1024px) {
    padding: 48px 32px;
  }
`

export const Section = styled.div`
  margin-bottom: 32px;
  animation: ${fadeIn} 0.8s ease-out;
  animation-fill-mode: both;
  
  @media (min-width: 768px) {
    margin-bottom: 48px;
  }
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  @media (min-width: 768px) {
    gap: 12px;
    margin-bottom: 24px;
  }
`

export const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.mutedForeground};
  font-family: 'JetBrains Mono', monospace;
`

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

export const Card = styled.div`
  background: ${({ theme }) => theme.glass};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.glassBorder};
  border-radius: 12px;
  padding: 16px;
  animation: ${scaleIn} 0.5s ease-out;
  transition: all 0.3s ease;
  
  @media (min-width: 768px) {
    padding: 20px;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    border-color: ${({ theme }) => theme.primary}33;
  }
`

export const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.glassBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.glass};
  backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.foreground};
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.primary}22;
    background: ${({ theme }) => theme.muted};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.mutedForeground};
    opacity: 0.5;
  }
`

export const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.glassBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.glass};
  backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.foreground};
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.primary}22;
    background: ${({ theme }) => theme.muted};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.mutedForeground};
    opacity: 0.5;
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media (min-width: 480px) {
    flex-direction: row;
    gap: 12px;
  }
`

export const Grid = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(${({ cols = 1 }) => Math.min(2, cols)}, 1fr);
    gap: 20px;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(${({ cols = 1 }) => cols}, 1fr);
    gap: 24px;
  }
`

export const MetricCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${scaleIn} 0.6s ease-out;
  animation-fill-mode: both;
  
  &:nth-child(1) { animation-delay: 0.05s; }
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.15s; }
  &:nth-child(4) { animation-delay: 0.2s; }
  &:nth-child(5) { animation-delay: 0.25s; }
  &:nth-child(6) { animation-delay: 0.3s; }
`

export const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.mutedForeground};
  font-family: 'JetBrains Mono', monospace;
`

export const MetricContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  
  span:first-child {
    color: ${({ theme }) => theme.mutedForeground};
    opacity: 0.7;
  }
  
  span:last-child {
    color: ${({ theme }) => theme.foreground};
    font-weight: 500;
  }
`

export const Certainty = styled.span`
  opacity: 0.5;
  margin-left: 4px;
  font-size: 11px;
`
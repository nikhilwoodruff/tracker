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
  background-color: ${({ theme }) => theme.background};
  animation: ${fadeIn} 0.5s ease-out;
`

export const Header = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.card};
  padding: 12px 0;
  animation: ${slideDown} 0.6s ease-out;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
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
    transform: scale(1.05);
    background-color: ${({ theme, variant = 'primary' }) => 
      variant === 'ghost' ? theme.secondary : undefined};
  }
  
  &:active {
    transform: scale(0.98);
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
  animation: ${fadeIn} 0.8s ease-out;
  animation-fill-mode: both;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
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
  background-color: ${({ theme }) => theme.card};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 16px;
  animation: ${scaleIn} 0.5s ease-out;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.foreground};
  font-size: 14px;
  transition: all 0.3s ease;
  
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
  transition: all 0.3s ease;
  
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
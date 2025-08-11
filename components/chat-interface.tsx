'use client'

import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { Send, Activity, Brain, Moon, Clock, Utensils, Weight, Calendar } from 'lucide-react'
import { Form, TextArea, Button, Card, Grid, MetricCard, MetricHeader, MetricContent, MetricRow, Certainty } from './styled'

const ChatForm = styled(Form)`
  width: 100%;
`

const DateSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
`

const DateInput = styled.input`
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.foreground};
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }
`

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const ResponseCard = styled(Card)`
  margin-top: 16px;
  font-size: 14px;
  animation: ${slideUp} 0.5s ease-out;
`

const SuccessMessage = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
  margin-bottom: 12px;
`

const Summary = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.border};
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
`

export default function ChatInterface() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    try {
      // Import dynamically to work with static export
      const { processEntry } = await import('@/lib/process-entry')
      const data = await processEntry(message, selectedDate)
      
      if (data.success) {
        setResponse(data.data)
        setMessage('')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        alert('Failed to log entry')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <DateSelector>
        <Calendar size={12} />
        <span>Entry date:</span>
        <DateInput 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
        <span style={{ fontSize: '10px', opacity: 0.7 }}>(will overwrite existing entry)</span>
      </DateSelector>
      
      <ChatForm onSubmit={handleSubmit}>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Log your day... (e.g., 'Woke up at 7am feeling good. Had eggs and toast for breakfast. Worked from 9-5 on the new feature. Ran 5k at 6pm. Had chicken and rice for dinner. Mood was great today, energy level 8/10. Weighed 75kg.')"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !message.trim()}>
          <Send size={16} />
        </Button>
      </ChatForm>

      {response && (
        <ResponseCard>
          <SuccessMessage>✓ Entry logged successfully</SuccessMessage>
          
          <Grid cols={2}>
            {response.nutrition && (
              <MetricCard>
                <MetricHeader>
                  <Utensils size={12} />
                  Nutrition
                </MetricHeader>
                <MetricContent>
                  {response.nutrition.calories && (
                    <MetricRow>
                      <span>Calories:</span>
                      <span>{response.nutrition.calories} kcal
                        {response.nutrition.calories_certainty < 1 && 
                          <Certainty>({Math.round(response.nutrition.calories_certainty * 100)}%)</Certainty>
                        }
                      </span>
                    </MetricRow>
                  )}
                  {response.nutrition.protein_g && (
                    <MetricRow>
                      <span>Protein:</span>
                      <span>{response.nutrition.protein_g}g</span>
                    </MetricRow>
                  )}
                  {response.nutrition.carbs_g && (
                    <MetricRow>
                      <span>Carbs:</span>
                      <span>{response.nutrition.carbs_g}g</span>
                    </MetricRow>
                  )}
                  {response.nutrition.fat_g && (
                    <MetricRow>
                      <span>Fat:</span>
                      <span>{response.nutrition.fat_g}g</span>
                    </MetricRow>
                  )}
                </MetricContent>
              </MetricCard>
            )}

            {response.exercise && response.exercise.minutes && (
              <MetricCard>
                <MetricHeader>
                  <Activity size={12} />
                  Exercise
                </MetricHeader>
                <MetricContent>
                  <MetricRow>
                    <span>Duration:</span>
                    <span>{response.exercise.minutes} min</span>
                  </MetricRow>
                  {response.exercise.types?.length > 0 && (
                    <MetricRow>
                      <span>Type:</span>
                      <span>{response.exercise.types.join(', ')}</span>
                    </MetricRow>
                  )}
                  {response.exercise.intensity && (
                    <MetricRow>
                      <span>Intensity:</span>
                      <span>{response.exercise.intensity}</span>
                    </MetricRow>
                  )}
                </MetricContent>
              </MetricCard>
            )}

            {response.mood && response.mood.score && (
              <MetricCard>
                <MetricHeader>
                  <Brain size={12} />
                  Mood & Energy
                </MetricHeader>
                <MetricContent>
                  <MetricRow>
                    <span>Mood:</span>
                    <span>{response.mood.score}/10
                      {response.mood.certainty < 1 && 
                        <Certainty>({Math.round(response.mood.certainty * 100)}%)</Certainty>
                      }
                    </span>
                  </MetricRow>
                  {response.mood.energy_level && (
                    <MetricRow>
                      <span>Energy:</span>
                      <span>{response.mood.energy_level}/10</span>
                    </MetricRow>
                  )}
                </MetricContent>
              </MetricCard>
            )}

            {response.sleep && response.sleep.hours && (
              <MetricCard>
                <MetricHeader>
                  <Moon size={12} />
                  Sleep
                </MetricHeader>
                <MetricContent>
                  <MetricRow>
                    <span>Duration:</span>
                    <span>{response.sleep.hours} hours</span>
                  </MetricRow>
                  {response.sleep.quality && (
                    <MetricRow>
                      <span>Quality:</span>
                      <span>{response.sleep.quality}/10</span>
                    </MetricRow>
                  )}
                </MetricContent>
              </MetricCard>
            )}

            {response.productive_hours && (
              <MetricCard>
                <MetricHeader>
                  <Clock size={12} />
                  Productivity
                </MetricHeader>
                <MetricContent>
                  <MetricRow>
                    <span>Productive hours:</span>
                    <span>{response.productive_hours}h</span>
                  </MetricRow>
                </MetricContent>
              </MetricCard>
            )}

            {response.weight && (response.weight.kg || response.weight.lbs) && (
              <MetricCard>
                <MetricHeader>
                  <Weight size={12} />
                  Weight
                </MetricHeader>
                <MetricContent>
                  {response.weight.kg && (
                    <MetricRow>
                      <span>Kilograms:</span>
                      <span>{response.weight.kg} kg
                        {response.weight.certainty < 1 && 
                          <Certainty>({Math.round(response.weight.certainty * 100)}%)</Certainty>
                        }
                      </span>
                    </MetricRow>
                  )}
                  {response.weight.lbs && (
                    <MetricRow>
                      <span>Pounds:</span>
                      <span>{response.weight.lbs} lbs</span>
                    </MetricRow>
                  )}
                </MetricContent>
              </MetricCard>
            )}
          </Grid>

          {response.summary && (
            <Summary>Summary: {response.summary}</Summary>
          )}
        </ResponseCard>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LineChart from './charts/line-chart'
import { format } from 'date-fns'
import styled from 'styled-components'
import { Card, Grid } from './styled'

const RecentEntriesCard = styled(Card)`
  margin-top: 24px;
`

const EntryTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
`

const Entry = styled.div`
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  
  &:last-child {
    border-bottom: none;
  }
`

const EntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`

const EntryDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
`

const CategoryBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.secondary};
  color: ${({ theme }) => theme.secondaryForeground};
`

const EntryContent = styled.p`
  font-size: 14px;
  margin-bottom: 8px;
`

const EntryMetrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
`

const LoadingMessage = styled.div`
  padding: 16px;
`

export default function MetricsDashboard() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchEntries()

    const channel = supabase
      .channel('entries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => fetchEntries()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: true })
      .limit(30)

    if (!error && data) {
      setEntries(data)
    }
    setLoading(false)
  }

  if (loading) return <LoadingMessage>Loading metrics...</LoadingMessage>

  const caloriesData = entries
    .filter(e => e.calories)
    .map(e => ({
      date: new Date(e.date),
      value: e.calories,
      certainty: e.calories_certainty
    }))

  const proteinData = entries
    .filter(e => e.protein_g)
    .map(e => ({
      date: new Date(e.date),
      value: e.protein_g,
      certainty: e.protein_certainty
    }))

  const moodData = entries
    .filter(e => e.mood_score)
    .map(e => ({
      date: new Date(e.date),
      value: e.mood_score,
      certainty: e.mood_certainty
    }))

  const exerciseData = entries
    .filter(e => e.exercise_minutes)
    .map(e => ({
      date: new Date(e.date),
      value: e.exercise_minutes,
      certainty: 1
    }))

  const sleepData = entries
    .filter(e => e.sleep_hours)
    .map(e => ({
      date: new Date(e.date),
      value: e.sleep_hours,
      certainty: 1
    }))

  const productiveData = entries
    .filter(e => e.productive_hours)
    .map(e => ({
      date: new Date(e.date),
      value: e.productive_hours,
      certainty: 1
    }))

  const weightData = entries
    .filter(e => e.weight_kg)
    .map(e => ({
      date: new Date(e.date),
      value: e.weight_kg,
      certainty: e.weight_certainty || 1
    }))

  return (
    <div>
      <Grid cols={2}>
        {caloriesData.length > 0 && (
          <LineChart
            data={caloriesData}
            title="Calories"
            yLabel="kcal"
            color="#ef4444"
            showCertainty
          />
        )}
        {proteinData.length > 0 && (
          <LineChart
            data={proteinData}
            title="Protein intake"
            yLabel="grams"
            color="#3b82f6"
            showCertainty
          />
        )}
        {moodData.length > 0 && (
          <LineChart
            data={moodData}
            title="Mood score"
            yLabel="score (1-10)"
            color="#10b981"
            showCertainty
          />
        )}
        {exerciseData.length > 0 && (
          <LineChart
            data={exerciseData}
            title="Exercise"
            yLabel="minutes"
            color="#f59e0b"
          />
        )}
        {sleepData.length > 0 && (
          <LineChart
            data={sleepData}
            title="Sleep"
            yLabel="hours"
            color="#8b5cf6"
          />
        )}
        {productiveData.length > 0 && (
          <LineChart
            data={productiveData}
            title="Productive hours"
            yLabel="hours"
            color="#06b6d4"
          />
        )}
        {weightData.length > 0 && (
          <LineChart
            data={weightData}
            title="Weight"
            yLabel="kg"
            color="#ec4899"
            showCertainty
          />
        )}
      </Grid>

      <RecentEntriesCard>
        <EntryTitle>Recent entries</EntryTitle>
        {entries.slice(0, 5).map((entry) => (
          <Entry key={entry.id}>
            <EntryHeader>
              <EntryDate>{format(new Date(entry.date), 'MMM d, yyyy')}</EntryDate>
              {entry.category && <CategoryBadge>{entry.category}</CategoryBadge>}
            </EntryHeader>
            <EntryContent>{entry.content}</EntryContent>
            <EntryMetrics>
              {entry.calories && (
                <span>
                  {entry.calories} cal
                  {entry.calories_certainty && entry.calories_certainty < 1 && 
                    <span style={{ opacity: 0.6 }}> ({Math.round(entry.calories_certainty * 100)}%)</span>
                  }
                </span>
              )}
              {entry.protein_g && <span>{entry.protein_g}g protein</span>}
              {entry.mood_score && <span>mood: {entry.mood_score}/10</span>}
              {entry.exercise_minutes && <span>{entry.exercise_minutes} min exercise</span>}
              {entry.weight_kg && <span>{entry.weight_kg} kg</span>}
            </EntryMetrics>
          </Entry>
        ))}
        {entries.length === 0 && (
          <p style={{ textAlign: 'center', color: '#737373', padding: '32px 0' }}>
            No entries yet. Start logging your activities above.
          </p>
        )}
      </RecentEntriesCard>
    </div>
  )
}
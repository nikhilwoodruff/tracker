'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LineChart from './charts/line-chart'
import MacroChart from './charts/macro-chart'
import ActivityHeatmap from './charts/activity-heatmap'
import SleepChart from './charts/sleep-chart'
import WeightForecast from './charts/weight-forecast'
import { format } from 'date-fns'
import styled from 'styled-components'
import { Card, Grid, Button } from './styled'
import { RefreshCw } from 'lucide-react'

const DashboardSection = styled.div`
  margin-bottom: 32px;
`

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.mutedForeground};
`

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

const EntryActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const RerunButton = styled(Button)`
  padding: 2px 6px;
  font-size: 10px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.mutedForeground};
  
  &:hover {
    background: ${({ theme }) => theme.secondary};
    color: ${({ theme }) => theme.foreground};
  }
  
  svg {
    width: 10px;
    height: 10px;
    margin-right: 4px;
  }
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const StatCard = styled(Card)`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.mutedForeground};
`

export default function MetricsDashboard() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rerunning, setRerunning] = useState<string | null>(null)
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

  const handleRerun = async (entry: any) => {
    if (!entry.content) return
    
    setRerunning(entry.id)
    try {
      const { processEntry } = await import('@/lib/process-entry')
      const data = await processEntry(entry.content, entry.date)
      
      if (data.success) {
        // Refresh entries to show updated data
        await fetchEntries()
      } else {
        alert('Failed to reprocess entry')
      }
    } catch (error) {
      console.error('Error reprocessing:', error)
      alert('Failed to reprocess entry')
    } finally {
      setRerunning(null)
    }
  }

  if (loading) return <LoadingMessage>Loading metrics...</LoadingMessage>

  // Calculate averages for stats cards
  const avgCalories = Math.round(
    entries.reduce((sum, e) => sum + (e.calories || 0), 0) / entries.length || 0
  )
  const avgProtein = Math.round(
    entries.reduce((sum, e) => sum + (e.protein_g || 0), 0) / entries.length || 0
  )
  const avgMood = (
    entries.reduce((sum, e) => sum + (e.mood_score || 0), 0) / entries.length || 0
  ).toFixed(1)
  const avgSleep = (
    entries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / entries.length || 0
  ).toFixed(1)
  const totalExercise = entries.reduce((sum, e) => sum + (e.exercise_minutes || 0), 0)
  const avgSteps = Math.round(
    entries.reduce((sum, e) => sum + (e.steps || 0), 0) / entries.length || 0
  )

  // Prepare data for charts
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

  const carbsData = entries
    .filter(e => e.carbs_g)
    .map(e => ({
      date: new Date(e.date),
      value: e.carbs_g,
      certainty: e.carbs_certainty
    }))

  const fatData = entries
    .filter(e => e.fat_g)
    .map(e => ({
      date: new Date(e.date),
      value: e.fat_g,
      certainty: e.fat_certainty
    }))

  const macroData = entries
    .filter(e => e.protein_g || e.carbs_g || e.fat_g)
    .map(e => ({
      date: new Date(e.date),
      protein: e.protein_g || 0,
      carbs: e.carbs_g || 0,
      fat: e.fat_g || 0,
      fiber: e.fiber_g || 0
    }))

  const moodData = entries
    .filter(e => e.mood_score)
    .map(e => ({
      date: new Date(e.date),
      value: e.mood_score,
      certainty: e.mood_certainty
    }))

  const energyData = entries
    .filter(e => e.energy_level)
    .map(e => ({
      date: new Date(e.date),
      value: e.energy_level,
      certainty: 1
    }))

  const exerciseData = entries
    .filter(e => e.exercise_minutes)
    .map(e => ({
      date: new Date(e.date),
      value: e.exercise_minutes,
      certainty: 1
    }))

  const stepsData = entries
    .filter(e => e.steps)
    .map(e => ({
      date: new Date(e.date),
      value: e.steps,
      certainty: 1
    }))

  const sleepData = entries
    .map(e => ({
      date: new Date(e.date),
      hours: e.sleep_hours || 0,
      quality: e.sleep_quality || 0
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
      <StatsGrid>
        <StatCard>
          <StatValue>{avgCalories}</StatValue>
          <StatLabel>Avg calories/day</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{avgProtein}g</StatValue>
          <StatLabel>Avg protein/day</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{avgMood}/10</StatValue>
          <StatLabel>Avg mood score</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{avgSleep}h</StatValue>
          <StatLabel>Avg sleep/night</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalExercise}</StatValue>
          <StatLabel>Total exercise (min)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{avgSteps}</StatValue>
          <StatLabel>Avg steps/day</StatLabel>
        </StatCard>
      </StatsGrid>

      {weightData.length > 2 && (
        <DashboardSection>
          <SectionTitle>Weight forecast</SectionTitle>
          <WeightForecast entries={entries} />
        </DashboardSection>
      )}

      <DashboardSection>
        <SectionTitle>Nutrition</SectionTitle>
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
          {macroData.length > 0 && (
            <MacroChart data={macroData} />
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
          {carbsData.length > 0 && (
            <LineChart
              data={carbsData}
              title="Carbohydrates"
              yLabel="grams"
              color="#f59e0b"
              showCertainty
            />
          )}
          {fatData.length > 0 && (
            <LineChart
              data={fatData}
              title="Fat intake"
              yLabel="grams"
              color="#ef4444"
              showCertainty
            />
          )}
        </Grid>
      </DashboardSection>

      <DashboardSection>
        <SectionTitle>Activity & Exercise</SectionTitle>
        <Grid cols={2}>
          {entries.length > 0 && (
            <ActivityHeatmap data={entries} />
          )}
          {exerciseData.length > 0 && (
            <LineChart
              data={exerciseData}
              title="Exercise duration"
              yLabel="minutes"
              color="#10b981"
            />
          )}
          {stepsData.length > 0 && (
            <LineChart
              data={stepsData}
              title="Daily steps"
              yLabel="steps"
              color="#06b6d4"
            />
          )}
          {productiveData.length > 0 && (
            <LineChart
              data={productiveData}
              title="Productive hours"
              yLabel="hours"
              color="#8b5cf6"
            />
          )}
        </Grid>
      </DashboardSection>

      <DashboardSection>
        <SectionTitle>Wellness</SectionTitle>
        <Grid cols={2}>
          {sleepData.length > 0 && (
            <SleepChart data={sleepData} />
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
          {energyData.length > 0 && (
            <LineChart
              data={energyData}
              title="Energy level"
              yLabel="level (1-10)"
              color="#f59e0b"
            />
          )}
          {weightData.length > 0 && (
            <LineChart
              data={weightData}
              title="Body weight"
              yLabel="kg"
              color="#ec4899"
              showCertainty
            />
          )}
        </Grid>
      </DashboardSection>

      <RecentEntriesCard>
        <EntryTitle>Recent entries</EntryTitle>
        {entries.slice(-5).reverse().map((entry) => (
          <Entry key={entry.id}>
            <EntryHeader>
              <EntryDate>{format(new Date(entry.date), 'MMM d, yyyy')}</EntryDate>
              <EntryActions>
                {entry.category && <CategoryBadge>{entry.category}</CategoryBadge>}
                <RerunButton 
                  onClick={() => handleRerun(entry)}
                  disabled={rerunning === entry.id}
                  title="Rerun AI analysis"
                >
                  <RefreshCw />
                  {rerunning === entry.id ? 'Processing...' : 'Rerun'}
                </RerunButton>
              </EntryActions>
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
              {entry.carbs_g && <span>{entry.carbs_g}g carbs</span>}
              {entry.fat_g && <span>{entry.fat_g}g fat</span>}
              {entry.mood_score && <span>mood: {entry.mood_score}/10</span>}
              {entry.exercise_minutes && <span>{entry.exercise_minutes} min exercise</span>}
              {entry.steps && <span>{entry.steps} steps</span>}
              {entry.sleep_hours && <span>{entry.sleep_hours}h sleep</span>}
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
'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import styled from 'styled-components'
import { format, addDays, differenceInDays, subDays } from 'date-fns'

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  height: 450px;
  position: relative;
`

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`

const ChartTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
`

const Summary = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.mutedForeground};
  opacity: 0.7;
`

const ChartContainer = styled.div`
  width: 100%;
  height: calc(100% - 80px);
  position: relative;
`

const Legend = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.7;
`

const LegendColor = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${props => props.$color};
`

const BacktestStats = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ theme }) => theme.mutedForeground};
  opacity: 0.5;
  text-align: right;
`

const Tooltip = styled.div`
  position: absolute;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: white;
  pointer-events: none;
  z-index: 10;
  display: none;
  
  &.visible {
    display: block;
  }
`

interface WeightForecastProps {
  entries: any[]
}

export default function WeightForecast({ entries }: WeightForecastProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [forecastSummary, setForecastSummary] = useState<{
    current: number
    projected: number
    change: number
  } | null>(null)

  useEffect(() => {
    if (!svgRef.current || entries.length === 0) return

    // Filter entries with weight data and sort by date
    const weightEntries = entries
      .filter(e => e.weight_kg)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (weightEntries.length < 3) return // Need at least 3 data points

    // Prepare data for modeling
    const modelData = entries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        date: new Date(e.date),
        weight: e.weight_kg || null,
        calories: e.calories || 0,
        protein: e.protein_g || 0,
        carbs: e.carbs_g || 0,
        fat: e.fat_g || 0,
        exercise: e.exercise_minutes || 0,
        steps: e.steps || 0
      }))

    // Simple metabolic model parameters
    const CALORIES_PER_KG = 7700 // Approximate calories per kg of body weight
    const BMR_MULTIPLIER = 24 // Simplified BMR calculation (kcal per kg per day)
    const EXERCISE_CALORIES_PER_MIN = 8 // Average calories burned per minute of exercise
    const STEPS_CALORIES_PER_1000 = 40 // Calories burned per 1000 steps
    const PROTEIN_TEF = 0.25 // Thermic effect of food for protein
    const CARBS_TEF = 0.10 // Thermic effect of food for carbs
    const FAT_TEF = 0.03 // Thermic effect of food for fat

    // Function to predict weight change
    const predictWeightChange = (
      currentWeight: number,
      calories: number,
      protein: number,
      carbs: number,
      fat: number,
      exercise: number,
      steps: number,
      days: number = 1
    ) => {
      // Calculate total energy expenditure
      const bmr = currentWeight * BMR_MULTIPLIER
      const exerciseCalories = exercise * EXERCISE_CALORIES_PER_MIN
      const stepsCalories = (steps / 1000) * STEPS_CALORIES_PER_1000
      
      // Calculate thermic effect of food
      const proteinCalories = protein * 4
      const carbsCalories = carbs * 4
      const fatCalories = fat * 9
      const tef = proteinCalories * PROTEIN_TEF + carbsCalories * CARBS_TEF + fatCalories * FAT_TEF
      
      const totalExpenditure = bmr + exerciseCalories + stepsCalories + tef
      const netCalories = calories - totalExpenditure
      const weightChange = (netCalories * days) / CALORIES_PER_KG
      
      return currentWeight + weightChange
    }

    // Backtesting: Test model on historical data
    const backtest = () => {
      const errors: number[] = []
      const predictions: { date: Date, actual: number, predicted: number }[] = []
      
      for (let i = 7; i < modelData.length; i++) {
        if (!modelData[i].weight) continue
        
        // Use past 7 days to predict current weight
        const pastWeek = modelData.slice(Math.max(0, i - 7), i)
        const lastKnownWeight = pastWeek.filter(d => d.weight).slice(-1)[0]?.weight
        
        if (!lastKnownWeight) continue
        
        // Calculate averages for past week
        const avgCalories = pastWeek.reduce((sum, d) => sum + d.calories, 0) / pastWeek.length
        const avgProtein = pastWeek.reduce((sum, d) => sum + d.protein, 0) / pastWeek.length
        const avgCarbs = pastWeek.reduce((sum, d) => sum + d.carbs, 0) / pastWeek.length
        const avgFat = pastWeek.reduce((sum, d) => sum + d.fat, 0) / pastWeek.length
        const avgExercise = pastWeek.reduce((sum, d) => sum + d.exercise, 0) / pastWeek.length
        const avgSteps = pastWeek.reduce((sum, d) => sum + d.steps, 0) / pastWeek.length
        
        const daysSinceLastWeight = differenceInDays(modelData[i].date, pastWeek.filter(d => d.weight).slice(-1)[0].date)
        const predicted = predictWeightChange(
          lastKnownWeight,
          avgCalories,
          avgProtein,
          avgCarbs,
          avgFat,
          avgExercise,
          avgSteps,
          daysSinceLastWeight
        )
        
        const error = Math.abs(predicted - modelData[i].weight)
        errors.push(error)
        predictions.push({
          date: modelData[i].date,
          actual: modelData[i].weight,
          predicted
        })
      }
      
      return {
        errors,
        predictions,
        mae: errors.reduce((a, b) => a + b, 0) / errors.length,
        rmse: Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length),
        std: Math.sqrt(errors.reduce((sum, e) => {
          const mean = errors.reduce((a, b) => a + b, 0) / errors.length
          return sum + Math.pow(e - mean, 2)
        }, 0) / errors.length)
      }
    }

    const backtestResults = backtest()
    const confidenceMultiplier = 1.96 // 95% confidence interval

    // Generate forecast
    const lastWeight = weightEntries[weightEntries.length - 1].weight_kg
    const lastDate = new Date(weightEntries[weightEntries.length - 1].date)
    
    // Calculate recent averages (last 14 days)
    const recentEntries = entries
      .filter(e => new Date(e.date) >= subDays(lastDate, 14))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const avgCalories = recentEntries.reduce((sum, e) => sum + (e.calories || 0), 0) / recentEntries.length || 2000
    const avgProtein = recentEntries.reduce((sum, e) => sum + (e.protein_g || 0), 0) / recentEntries.length || 80
    const avgCarbs = recentEntries.reduce((sum, e) => sum + (e.carbs_g || 0), 0) / recentEntries.length || 250
    const avgFat = recentEntries.reduce((sum, e) => sum + (e.fat_g || 0), 0) / recentEntries.length || 70
    const avgExercise = recentEntries.reduce((sum, e) => sum + (e.exercise_minutes || 0), 0) / recentEntries.length || 30
    const avgSteps = recentEntries.reduce((sum, e) => sum + (e.steps || 0), 0) / recentEntries.length || 8000

    // Generate 90-day forecast
    const forecastDays = 90
    const forecast = []
    let currentWeight = lastWeight
    
    for (let i = 1; i <= forecastDays; i++) {
      currentWeight = predictWeightChange(
        currentWeight,
        avgCalories,
        avgProtein,
        avgCarbs,
        avgFat,
        avgExercise,
        avgSteps,
        1
      )
      
      const forecastDate = addDays(lastDate, i)
      const uncertainty = backtestResults.std * Math.sqrt(i) * 0.1 // Uncertainty grows with time
      
      forecast.push({
        date: forecastDate,
        weight: currentWeight,
        lower: currentWeight - uncertainty * confidenceMultiplier,
        upper: currentWeight + uncertainty * confidenceMultiplier
      })
    }

    // Set forecast summary
    setForecastSummary({
      current: lastWeight,
      projected: forecast[forecast.length - 1].weight,
      change: forecast[forecast.length - 1].weight - lastWeight
    })

    // Combine historical and forecast data
    const historicalData = weightEntries.map(e => ({
      date: new Date(e.date),
      weight: e.weight_kg
    }))

    // Set up D3 chart
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 150, bottom: 40, left: 50 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleTime()
      .domain([
        d3.min(historicalData, d => d.date) as Date,
        d3.max(forecast, d => d.date) as Date
      ])
      .range([0, width])

    const allWeights = [
      ...historicalData.map(d => d.weight),
      ...forecast.map(d => d.weight),
      ...forecast.map(d => d.lower),
      ...forecast.map(d => d.upper)
    ]

    const yScale = d3.scaleLinear()
      .domain([
        (d3.min(allWeights) as number) - 2,
        (d3.max(allWeights) as number) + 2
      ])
      .range([height, 0])

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => ''))
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.1)
      .style('stroke', 'rgba(255, 255, 255, 0.1)')

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => ''))
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.1)
      .style('stroke', 'rgba(255, 255, 255, 0.1)')

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => format(d as Date, 'MMM d')))
      .style('color', 'rgba(255, 255, 255, 0.7)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '11px')

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d} kg`))
      .style('color', 'rgba(255, 255, 255, 0.7)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '11px')

    // Add confidence band
    const area = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.lower))
      .y1(d => yScale(d.upper))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(forecast)
      .attr('fill', 'rgba(59, 130, 246, 0.1)')
      .attr('d', area)

    // Add historical line
    const historicalLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.weight))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(historicalData)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(16, 185, 129)')
      .attr('stroke-width', 2)
      .attr('d', historicalLine)

    // Add forecast line
    const forecastLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.weight))
      .curve(d3.curveMonotoneX)

    // Connect historical to forecast
    const connectionData = [
      historicalData[historicalData.length - 1],
      { date: forecast[0].date, weight: forecast[0].weight }
    ]

    g.append('path')
      .datum(connectionData)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(59, 130, 246)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', historicalLine)

    g.append('path')
      .datum(forecast)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(59, 130, 246)')
      .attr('stroke-width', 2)
      .attr('d', forecastLine)

    // Add dots for historical data with hover
    g.selectAll('.historical-dot')
      .data(historicalData)
      .enter().append('circle')
      .attr('class', 'historical-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.weight))
      .attr('r', 4)
      .attr('fill', 'rgb(16, 185, 129)')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6)
        const tooltip = d3.select(tooltipRef.current)
        tooltip.classed('visible', true)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div style="color: rgb(16, 185, 129)">Historical</div>
            <div>${format(d.date, 'MMM d, yyyy')}</div>
            <div>${d.weight.toFixed(1)} kg</div>
          `)
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4)
        d3.select(tooltipRef.current).classed('visible', false)
      })

    // Add invisible dots for forecast with hover
    g.selectAll('.forecast-dot')
      .data(forecast.filter((_, i) => i % 5 === 0)) // Every 5th day for performance
      .enter().append('circle')
      .attr('class', 'forecast-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.weight))
      .attr('r', 8)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Add visible dot on hover
        g.append('circle')
          .attr('class', 'hover-dot')
          .attr('cx', xScale(d.date))
          .attr('cy', yScale(d.weight))
          .attr('r', 4)
          .attr('fill', 'rgb(59, 130, 246)')
        
        const tooltip = d3.select(tooltipRef.current)
        tooltip.classed('visible', true)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div style="color: rgb(59, 130, 246)">Forecast</div>
            <div>${format(d.date, 'MMM d, yyyy')}</div>
            <div>${d.weight.toFixed(1)} kg</div>
            <div style="opacity: 0.7; font-size: 10px">
              95% CI: ${d.lower.toFixed(1)} - ${d.upper.toFixed(1)} kg
            </div>
          `)
      })
      .on('mouseout', function() {
        g.selectAll('.hover-dot').remove()
        d3.select(tooltipRef.current).classed('visible', false)
      })

    // Add backtesting dots if available
    if (backtestResults.predictions.length > 0) {
      g.selectAll('.backtest-dot')
        .data(backtestResults.predictions.slice(-10)) // Show last 10 backtests
        .enter().append('circle')
        .attr('class', 'backtest-dot')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.predicted))
        .attr('r', 2)
        .attr('fill', 'rgba(239, 68, 68, 0.5)')
    }

    // Add vertical line for "today"
    g.append('line')
      .attr('x1', xScale(lastDate))
      .attr('x2', xScale(lastDate))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

  }, [entries])

  // Calculate backtest stats for display
  const backtestStats = () => {
    const weightEntries = entries
      .filter(e => e.weight_kg)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (weightEntries.length < 10) return null

    const errors: number[] = []
    
    for (let i = 7; i < weightEntries.length; i++) {
      const pastWeek = entries
        .filter(e => new Date(e.date) >= subDays(new Date(weightEntries[i].date), 7) && 
                     new Date(e.date) < new Date(weightEntries[i].date))
      
      if (pastWeek.length === 0) continue
      
      const lastKnownWeight = pastWeek
        .filter(e => e.weight_kg)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight_kg
      
      if (!lastKnownWeight) continue
      
      const avgCalories = pastWeek.reduce((sum, e) => sum + (e.calories || 2000), 0) / pastWeek.length
      const predictedChange = (avgCalories - 2000) * 7 / 7700
      const predicted = lastKnownWeight + predictedChange
      
      errors.push(Math.abs(predicted - weightEntries[i].weight_kg))
    }

    if (errors.length === 0) return null

    return {
      mae: (errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(2),
      samples: errors.length
    }
  }

  const stats = backtestStats()

  return (
    <ChartCard>
      <ChartHeader>
        <div>
          <ChartTitle>Weight forecast</ChartTitle>
          {forecastSummary && (
            <Summary>
              Your weight is projected to be {forecastSummary.projected.toFixed(1)} kg 
              ({forecastSummary.change > 0 ? '+' : ''}{forecastSummary.change.toFixed(1)}) 
              in three months under recent macro trends
            </Summary>
          )}
        </div>
      </ChartHeader>
      <ChartContainer>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        <Tooltip ref={tooltipRef} />
      </ChartContainer>
      <Legend>
        <LegendItem>
          <LegendColor $color="rgb(16, 185, 129)" />
          <span>Historical</span>
        </LegendItem>
        <LegendItem>
          <LegendColor $color="rgb(59, 130, 246)" />
          <span>Forecast</span>
        </LegendItem>
        <LegendItem>
          <LegendColor $color="rgba(59, 130, 246, 0.1)" />
          <span>95% CI</span>
        </LegendItem>
      </Legend>
      {stats && (
        <BacktestStats>
          Backtest MAE: {stats.mae} kg (n={stats.samples})
        </BacktestStats>
      )}
    </ChartCard>
  )
}
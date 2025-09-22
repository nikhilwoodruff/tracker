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
  padding: 16px;
  height: 400px;
  position: relative;
  
  @media (min-width: 768px) {
    padding: 24px;
    height: 450px;
  }
  
  @media (max-width: 480px) {
    height: 350px;
  }
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
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null)

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

    // Generate forecast
    const lastWeight = weightEntries[weightEntries.length - 1].weight_kg
    const lastDate = new Date(weightEntries[weightEntries.length - 1].date)
    
    // Calculate today's macros
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEntry = entries.find(e => {
      const entryDate = new Date(e.date)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === today.getTime()
    })
    
    const todayCalories = todayEntry?.calories || 2000
    const todayProtein = todayEntry?.protein_g || 80
    const todayCarbs = todayEntry?.carbs_g || 250
    const todayFat = todayEntry?.fat_g || 70
    const todayExercise = todayEntry?.exercise_minutes || 30
    const todaySteps = todayEntry?.steps || 8000
    
    // Calculate weekly averages (last 7 days)
    const weekEntries = entries
      .filter(e => new Date(e.date) >= subDays(lastDate, 7))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const weekCalories = weekEntries.reduce((sum, e) => sum + (e.calories || 0), 0) / weekEntries.length || 2000
    const weekProtein = weekEntries.reduce((sum, e) => sum + (e.protein_g || 0), 0) / weekEntries.length || 80
    const weekCarbs = weekEntries.reduce((sum, e) => sum + (e.carbs_g || 0), 0) / weekEntries.length || 250
    const weekFat = weekEntries.reduce((sum, e) => sum + (e.fat_g || 0), 0) / weekEntries.length || 70
    const weekExercise = weekEntries.reduce((sum, e) => sum + (e.exercise_minutes || 0), 0) / weekEntries.length || 30
    const weekSteps = weekEntries.reduce((sum, e) => sum + (e.steps || 0), 0) / weekEntries.length || 8000

    // Generate 90-day forecasts for both scenarios
    const forecastDays = 90
    const todayForecast: any[] = []
    const weekForecast: any[] = []
    let todayWeight = lastWeight
    let weekWeight = lastWeight
    
    for (let i = 1; i <= forecastDays; i++) {
      // Today's macros forecast
      todayWeight = predictWeightChange(
        todayWeight,
        todayCalories,
        todayProtein,
        todayCarbs,
        todayFat,
        todayExercise,
        todaySteps,
        1
      )
      
      // Weekly average macros forecast
      weekWeight = predictWeightChange(
        weekWeight,
        weekCalories,
        weekProtein,
        weekCarbs,
        weekFat,
        weekExercise,
        weekSteps,
        1
      )
      
      const forecastDate = addDays(lastDate, i)
      
      todayForecast.push({
        date: forecastDate,
        weight: todayWeight
      })
      
      weekForecast.push({
        date: forecastDate,
        weight: weekWeight
      })
    }

    // Function to interpolate weight for a given date
    const interpolateWeight = (targetDate: Date) => {
      const targetTime = targetDate.getTime()
      
      // Find surrounding weight entries
      let before = null
      let after = null
      
      for (let i = 0; i < weightEntries.length; i++) {
        const entryTime = new Date(weightEntries[i].date).getTime()
        
        if (entryTime <= targetTime) {
          before = weightEntries[i]
        }
        if (entryTime >= targetTime && !after) {
          after = weightEntries[i]
        }
      }
      
      if (!before && after) return after.weight_kg
      if (before && !after) return before.weight_kg
      if (!before && !after) return lastWeight
      
      if (before && after) {
        if (before === after) return before.weight_kg
        
        // Linear interpolation
        const beforeTime = new Date(before.date).getTime()
        const afterTime = new Date(after.date).getTime()
        const ratio = (targetTime - beforeTime) / (afterTime - beforeTime)
        return before.weight_kg + (after.weight_kg - before.weight_kg) * ratio
      }
      
      return lastWeight
    }

    // Generate forecasts from past 3 days
    const historicalForecasts: any[] = []
    for (let daysAgo = 1; daysAgo <= 3; daysAgo++) {
      const historicalDate = subDays(lastDate, daysAgo)
      
      // Interpolate weight for this date
      const interpolatedWeight = interpolateWeight(historicalDate)
      
      // Get the macros from that day
      const dayEntry = entries.find(e => {
        const entryDate = new Date(e.date)
        entryDate.setHours(0, 0, 0, 0)
        const targetDate = new Date(historicalDate)
        targetDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === targetDate.getTime()
      })
      
      const dayCalories = dayEntry?.calories || 2000
      const dayProtein = dayEntry?.protein_g || 80
      const dayCarbs = dayEntry?.carbs_g || 250
      const dayFat = dayEntry?.fat_g || 70
      const dayExercise = dayEntry?.exercise_minutes || 30
      const daySteps = dayEntry?.steps || 8000
      
      // Generate forecast from that day
      const forecast = []
      let weight = interpolatedWeight
      const startDate = historicalDate
      
      for (let i = 1; i <= forecastDays + daysAgo; i++) {
        weight = predictWeightChange(
          weight,
          dayCalories,
          dayProtein,
          dayCarbs,
          dayFat,
          dayExercise,
          daySteps,
          1
        )
        
        const forecastDate = addDays(startDate, i)
        if (forecastDate <= weekForecast[weekForecast.length - 1].date) {
          forecast.push({
            date: forecastDate,
            weight: weight
          })
        }
      }
      
      if (forecast.length > 0) {
        historicalForecasts.push({
          startDate: startDate,
          startWeight: interpolatedWeight,
          daysAgo: daysAgo,
          data: forecast
        })
      }
    }

    // Set forecast summary (using weekly average as default)
    setForecastSummary({
      current: lastWeight,
      projected: weekForecast[weekForecast.length - 1].weight,
      change: weekForecast[weekForecast.length - 1].weight - lastWeight
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

    // Create clip path for zooming
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create continuous date range with gaps for missing data first
    const firstDate = historicalData[0].date
    const lastHistoricalDate = historicalData[historicalData.length - 1].date
    const daysBetween = differenceInDays(lastHistoricalDate, firstDate)

    const continuousData = []
    for (let i = 0; i <= daysBetween; i++) {
      const currentDate = addDays(firstDate, i)
      const existingEntry = historicalData.find(d => {
        const entryDate = new Date(d.date)
        entryDate.setHours(0, 0, 0, 0)
        const compareDate = new Date(currentDate)
        compareDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === compareDate.getTime()
      })

      continuousData.push({
        date: currentDate,
        weight: existingEntry ? existingEntry.weight : null
      })
    }

    // Create a content group that will be clipped
    const content = g.append('g')
      .attr('clip-path', 'url(#clip)')

    // Scales
    const xScale = d3.scaleTime()
      .domain([
        continuousData[0].date,
        todayForecast[todayForecast.length - 1].date
      ])
      .range([0, width])

    const allWeights = [
      ...historicalData.map(d => d.weight),
      ...todayForecast.map(d => d.weight),
      ...weekForecast.map(d => d.weight),
      ...historicalForecasts.flatMap((f: any) => f.data.map((d: any) => d.weight))
    ]

    const yScale = d3.scaleLinear()
      .domain([
        (d3.min(allWeights) as number) - 2,
        (d3.max(allWeights) as number) + 2
      ])
      .range([height, 0])

    // Store original scales for zoom reset
    const xScaleOriginal = xScale.copy()
    const yScaleOriginal = yScale.copy()

    // Add grid lines
    const gridX = g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => ''))
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.1)
      .style('stroke', 'rgba(255, 255, 255, 0.1)')

    const gridY = g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => ''))
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.1)
      .style('stroke', 'rgba(255, 255, 255, 0.1)')

    // Add axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => format(d as Date, 'MMM d')))
      .style('color', 'rgba(255, 255, 255, 0.7)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '11px')

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d} kg`))
      .style('color', 'rgba(255, 255, 255, 0.7)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '11px')

    // Add historical line with gap handling
    const historicalLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.weight))
      .defined(d => d.weight !== null) // Only draw line where data exists
      .curve(d3.curveMonotoneX)

    content.append('path')
      .datum(continuousData)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(16, 185, 129)')
      .attr('stroke-width', 2)
      .attr('d', historicalLine)

    // Add forecast lines
    const forecastLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.weight))
      .curve(d3.curveMonotoneX)

    // Connect historical to forecasts - use last actual data point
    const lastActualData = historicalData[historicalData.length - 1]
    const todayConnectionData = [
      lastActualData,
      { date: todayForecast[0].date, weight: todayForecast[0].weight }
    ]

    const weekConnectionData = [
      lastActualData,
      { date: weekForecast[0].date, weight: weekForecast[0].weight }
    ]

    // Today's macros forecast (red)
    content.append('path')
      .datum(todayConnectionData)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(239, 68, 68)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', historicalLine)

    content.append('path')
      .datum(todayForecast)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(239, 68, 68)')
      .attr('stroke-width', 2)
      .attr('d', forecastLine)
    
    // Weekly average forecast (blue)
    content.append('path')
      .datum(weekConnectionData)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(59, 130, 246)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', historicalLine)

    content.append('path')
      .datum(weekForecast)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(59, 130, 246)')
      .attr('stroke-width', 2)
      .attr('d', forecastLine)

    // Add historical forecast lines (from past 3 days)
    const historicalColors = [
      'rgba(168, 85, 247, 0.5)',  // Purple for 1 day ago
      'rgba(236, 72, 153, 0.5)',  // Pink for 2 days ago
      'rgba(251, 146, 60, 0.5)'   // Orange for 3 days ago
    ]
    
    historicalForecasts.forEach((forecast, index) => {
      // Connect from historical point to forecast
      const connectionData = [
        { date: forecast.startDate, weight: forecast.startWeight },
        forecast.data[0]
      ]
      
      content.append('path')
        .datum(connectionData)
        .attr('fill', 'none')
        .attr('stroke', historicalColors[index])
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', historicalLine)
      
      // Draw the forecast line
      content.append('path')
        .datum(forecast.data)
        .attr('fill', 'none')
        .attr('stroke', historicalColors[index])
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', forecastLine)
        .style('opacity', 0.7)
    })

    // Add dots for historical data with hover
    content.selectAll('.historical-dot')
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
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4)
      })

    // Add subtle markers for days with missing data
    const missingDays = continuousData.filter(d => d.weight === null)
    content.selectAll('.missing-day-marker')
      .data(missingDays)
      .enter().append('line')
      .attr('class', 'missing-day-marker')
      .attr('x1', d => xScale(d.date))
      .attr('x2', d => xScale(d.date))
      .attr('y1', height - 10)
      .attr('y2', height)
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 1)

    // Remove the invisible hover dots since we now have a hover line for all data

    // Add backtesting dots if available
    if (backtestResults.predictions.length > 0) {
      content.selectAll('.backtest-dot')
        .data(backtestResults.predictions.slice(-10)) // Show last 10 backtests
        .enter().append('circle')
        .attr('class', 'backtest-dot')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.predicted))
        .attr('r', 2)
        .attr('fill', 'rgba(239, 68, 68, 0.5)')
    }

    // Add vertical line for "today"
    content.append('line')
      .attr('x1', xScale(lastDate))
      .attr('x2', xScale(lastDate))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    // Add zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .extent([[0, 0], [width, height]])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScaleOriginal)
        const newYScale = event.transform.rescaleY(yScaleOriginal)
        
        // Update scales
        xScale.domain(newXScale.domain())
        yScale.domain(newYScale.domain())
        
        // Update axes
        xAxis.call(d3.axisBottom(xScale).tickFormat(d => format(d as Date, 'MMM d')))
        yAxis.call(d3.axisLeft(yScale).tickFormat(d => `${d} kg`))
        
        // Update grid lines
        gridX.call(d3.axisBottom(xScale)
          .tickSize(-height)
          .tickFormat(() => ''))
        gridY.call(d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => ''))
        
        // Update all paths
        content.selectAll('path')
          .filter(function() { 
            return d3.select(this).datum() !== null 
          })
          .attr('d', function(this: any) {
            const data = d3.select(this).datum()
            if (Array.isArray(data)) {
              return data[0]?.weight !== undefined ? forecastLine(data) : historicalLine(data)
            }
            return null
          })
        
        // Update dots
        content.selectAll('.historical-dot')
          .attr('cx', (d: any) => xScale(d.date))
          .attr('cy', (d: any) => yScale(d.weight))

        content.selectAll('.backtest-dot')
          .attr('cx', (d: any) => xScale(d.date))
          .attr('cy', (d: any) => yScale(d.predicted))

        // Update missing day markers
        content.selectAll('.missing-day-marker')
          .attr('x1', (d: any) => xScale(d.date))
          .attr('x2', (d: any) => xScale(d.date))
        
        // Update vertical line
        content.select('line')
          .attr('x1', xScale(lastDate))
          .attr('x2', xScale(lastDate))
        
        setZoomTransform(event.transform)
      })

    // Add marquee zoom
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on('end', function(event) {
        if (!event.selection) return
        
        const [[x0, y0], [x1, y1]] = event.selection
        
        // Remove the brush
        d3.select(this).call(brush.move, null)
        
        // Calculate zoom to fit the selection
        const k = Math.min(width / (x1 - x0), height / (y1 - y0))
        
        // Calculate translation to align the zoomed area with the viewport
        const tx = -x0 * k
        const ty = -y0 * k
        
        // Create and apply the transform
        const transform = d3.zoomIdentity.translate(tx, ty).scale(k)
        
        // Apply the zoom transform with animation
        svg.transition()
          .duration(750)
          .call(zoom.transform, transform)
      })
    
    // Add brush layer
    const brushLayer = g.append('g')
      .attr('class', 'brush')
      .call(brush)
    
    // Style the brush
    brushLayer.selectAll('.selection')
      .style('fill', 'rgba(59, 130, 246, 0.2)')
      .style('stroke', 'rgb(59, 130, 246)')
      .style('stroke-width', 1)
    
    // Add zoom behavior to svg
    svg.call(zoom)
    
    // Add double-click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity)
    })

    // Add hover line for all forecasts
    const hoverLine = content.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', 'rgba(255, 255, 255, 0.3)')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '2,2')
      .style('display', 'none')
    
    // Add mouse tracking
    svg.on('mousemove', function(event) {
      const [mx, my] = d3.pointer(event, g.node())
      
      if (mx >= 0 && mx <= width && my >= 0 && my <= height) {
        hoverLine
          .style('display', 'block')
          .attr('x1', mx)
          .attr('x2', mx)
        
        // Find closest data point for all lines
        const date = xScale.invert(mx)
        const bisector = d3.bisector((d: any) => d.date).left
        
        // Show values at this date in tooltip
        const tooltip = d3.select(tooltipRef.current)
        const values = []
        
        // Check historical data
        const historicalIndex = bisector(historicalData, date, 1)
        if (historicalIndex < historicalData.length) {
          const d0 = historicalData[historicalIndex - 1]
          const d1 = historicalData[historicalIndex]
          const closest = date.getTime() - d0?.date.getTime() > d1?.date.getTime() - date.getTime() ? d1 : d0
          if (closest && Math.abs(closest.date.getTime() - date.getTime()) < 86400000) {
            values.push(`<div style="color: rgb(16, 185, 129)">Historical: ${closest.weight.toFixed(1)} kg</div>`)
          }
        }
        
        // Check forecast data
        const forecastIndex = bisector(todayForecast, date, 1)
        if (forecastIndex < todayForecast.length) {
          const d = todayForecast[forecastIndex]
          if (d) {
            values.push(`<div style="color: rgb(239, 68, 68)">Today's: ${d.weight.toFixed(1)} kg</div>`)
          }
        }
        
        const weekIndex = bisector(weekForecast, date, 1)
        if (weekIndex < weekForecast.length) {
          const d = weekForecast[weekIndex]
          if (d) {
            values.push(`<div style="color: rgb(59, 130, 246)">Weekly: ${d.weight.toFixed(1)} kg</div>`)
          }
        }
        
        // Check historical forecasts
        historicalForecasts.forEach((forecast, i) => {
          const index = bisector(forecast.data, date, 1)
          if (index < forecast.data.length) {
            const d = forecast.data[index]
            if (d) {
              const colors = ['rgb(168, 85, 247)', 'rgb(236, 72, 153)', 'rgb(251, 146, 60)']
              values.push(`<div style="color: ${colors[i]}">${forecast.daysAgo}d ago: ${d.weight.toFixed(1)} kg</div>`)
            }
          }
        })
        
        if (values.length > 0) {
          tooltip.classed('visible', true)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(`
              <div>${format(date, 'MMM d, yyyy')}</div>
              ${values.join('')}
            `)
        } else {
          tooltip.classed('visible', false)
        }
      } else {
        hoverLine.style('display', 'none')
        d3.select(tooltipRef.current).classed('visible', false)
      }
    })
    .on('mouseleave', function() {
      hoverLine.style('display', 'none')
      d3.select(tooltipRef.current).classed('visible', false)
    })

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
          <LegendColor $color="rgb(239, 68, 68)" />
          <span>Today's macros</span>
        </LegendItem>
        <LegendItem>
          <LegendColor $color="rgb(59, 130, 246)" />
          <span>Weekly average</span>
        </LegendItem>
        <LegendItem style={{ opacity: 0.5 }}>
          <LegendColor $color="rgba(168, 85, 247, 0.7)" />
          <span>1 day ago</span>
        </LegendItem>
        <LegendItem style={{ opacity: 0.5 }}>
          <LegendColor $color="rgba(236, 72, 153, 0.7)" />
          <span>2 days ago</span>
        </LegendItem>
        <LegendItem style={{ opacity: 0.5 }}>
          <LegendColor $color="rgba(251, 146, 60, 0.7)" />
          <span>3 days ago</span>
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
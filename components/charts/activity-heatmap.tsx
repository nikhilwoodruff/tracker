'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import styled from 'styled-components'
import { Card } from '../styled'

const ChartCard = styled(Card)`
  padding: 16px;
`

const ChartTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`

interface ActivityData {
  date: string
  hour: number
  activity: string
}

interface ActivityHeatmapProps {
  data: any[]
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    // Transform data
    const activities: ActivityData[] = []
    data.forEach(entry => {
      if (entry.hourly_activities) {
        Object.entries(entry.hourly_activities).forEach(([hour, activity]) => {
          activities.push({
            date: entry.date,
            hour: parseInt(hour),
            activity: activity as string
          })
        })
      }
    })

    if (!activities.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 30, bottom: 60, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get unique dates and hours
    const dates = Array.from(new Set(activities.map(d => d.date))).sort()
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const x = d3.scaleBand()
      .domain(dates.map(d => d3.timeFormat('%m/%d')(new Date(d))))
      .range([0, width])
      .padding(0.05)

    const y = d3.scaleBand()
      .domain(hours.map(String))
      .range([0, height])
      .padding(0.05)

    // Activity type colors
    const activityColors: Record<string, string> = {
      'work': '#3b82f6',
      'exercise': '#10b981',
      'sleep': '#8b5cf6',
      'meal': '#f59e0b',
      'leisure': '#06b6d4',
      'commute': '#737373',
      'default': '#a3a3a3'
    }

    const getActivityColor = (activity: string) => {
      const lower = activity.toLowerCase()
      for (const [key, color] of Object.entries(activityColors)) {
        if (lower.includes(key)) return color
      }
      if (lower.includes('work') || lower.includes('meeting')) return activityColors.work
      if (lower.includes('run') || lower.includes('gym') || lower.includes('walk')) return activityColors.exercise
      if (lower.includes('sleep') || lower.includes('rest')) return activityColors.sleep
      if (lower.includes('eat') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner')) return activityColors.meal
      return activityColors.default
    }

    g.selectAll('.cell')
      .data(activities)
      .enter().append('rect')
      .attr('x', d => x(d3.timeFormat('%m/%d')(new Date(d.date)))!)
      .attr('y', d => y(String(d.hour))!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => getActivityColor(d.activity))
      .attr('opacity', 0.8)
      .append('title')
      .text(d => `${d.hour}:00 - ${d.activity}`)

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style('font-size', '10px')
      .style('color', '#737373')
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `${d}:00`))
      .style('font-size', '10px')
      .style('color', '#737373')

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#737373')
      .text('Hour of day')

  }, [data])

  return (
    <ChartCard>
      <ChartTitle>Daily activity patterns</ChartTitle>
      <svg ref={svgRef} width="600" height="300" style={{ width: '100%', height: 'auto', maxWidth: '100%' }} viewBox="0 0 600 300" />
    </ChartCard>
  )
}
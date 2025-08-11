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

const Tooltip = styled.div`
  position: absolute;
  padding: 8px;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  &.visible {
    opacity: 1;
  }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  font-size: 11px;
  color: ${({ theme }) => theme.mutedForeground};
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const LegendColor = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  background: ${({ color }) => color};
  border-radius: 2px;
  opacity: 0.8;
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
  const tooltipRef = useRef<HTMLDivElement>(null)

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
      'personal': '#ec4899',
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
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 1)
          .attr('transform', 'scale(1.1)')
        
        if (tooltipRef.current) {
          const rect = (event.target as Element).getBoundingClientRect()
          tooltipRef.current.style.left = `${rect.left + rect.width / 2}px`
          tooltipRef.current.style.top = `${rect.top - 40}px`
          tooltipRef.current.innerHTML = `
            <div><strong>${d3.timeFormat('%b %d')(new Date(d.date))}</strong></div>
            <div>${d.hour}:00 - ${d.hour + 1}:00</div>
            <div style="margin-top: 4px; color: ${getActivityColor(d.activity)}">${d.activity}</div>
          `
          tooltipRef.current.classList.add('visible')
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8)
          .attr('transform', 'scale(1)')
        
        if (tooltipRef.current) {
          tooltipRef.current.classList.remove('visible')
        }
      })
      .transition()
      .delay((d, i) => i * 5)
      .duration(500)
      .attr('opacity', 0.8)

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
      <Legend>
        <LegendItem>
          <LegendColor color="#8b5cf6" />
          <span>Sleep</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#3b82f6" />
          <span>Work</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#10b981" />
          <span>Exercise</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#f59e0b" />
          <span>Meals</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#06b6d4" />
          <span>Leisure</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#737373" />
          <span>Commute</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#ec4899" />
          <span>Personal</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#a3a3a3" />
          <span>Other</span>
        </LegendItem>
      </Legend>
      <Tooltip ref={tooltipRef} />
    </ChartCard>
  )
}
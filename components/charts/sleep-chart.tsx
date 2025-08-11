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

interface SleepData {
  date: Date
  hours: number
  quality: number
}

interface SleepChartProps {
  data: SleepData[]
}

export default function SleepChart({ data }: SleepChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 60, bottom: 40, left: 50 }
    const width = 600 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width])

    const yHours = d3.scaleLinear()
      .domain([0, 12])
      .nice()
      .range([height, 0])

    const yQuality = d3.scaleLinear()
      .domain([0, 10])
      .range([height, 0])

    // Sleep hours bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.date) - 10)
      .attr('y', d => yHours(d.hours))
      .attr('width', 20)
      .attr('height', d => height - yHours(d.hours))
      .attr('fill', '#8b5cf6')
      .attr('opacity', 0.6)

    // Sleep quality line
    const line = d3.line<SleepData>()
      .x(d => x(d.date))
      .y(d => yQuality(d.quality))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data.filter(d => d.quality))
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Quality dots
    g.selectAll('.dot')
      .data(data.filter(d => d.quality))
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => yQuality(d.quality))
      .attr('r', 4)
      .attr('fill', '#10b981')

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%m/%d') as any))
      .style('color', '#737373')
      .style('font-size', '10px')

    // Y axis for hours (left)
    g.append('g')
      .call(d3.axisLeft(yHours))
      .style('color', '#8b5cf6')
      .style('font-size', '10px')

    // Y axis for quality (right)
    g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yQuality))
      .style('color', '#10b981')
      .style('font-size', '10px')

    // Labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#8b5cf6')
      .text('Hours of sleep')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', width + 45)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#10b981')
      .text('Sleep quality (1-10)')

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(20, 10)`)

    legend.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#8b5cf6')
      .attr('opacity', 0.6)

    legend.append('text')
      .attr('x', 16)
      .attr('y', 10)
      .style('font-size', '11px')
      .style('fill', '#737373')
      .text('Hours')

    legend.append('circle')
      .attr('cx', 80)
      .attr('cy', 6)
      .attr('r', 4)
      .attr('fill', '#10b981')

    legend.append('text')
      .attr('x', 88)
      .attr('y', 10)
      .style('font-size', '11px')
      .style('fill', '#737373')
      .text('Quality')

  }, [data])

  return (
    <ChartCard>
      <ChartTitle>Sleep tracking</ChartTitle>
      <svg ref={svgRef} width="600" height="300" style={{ width: '100%', height: 'auto', maxWidth: '100%' }} viewBox="0 0 600 300" />
    </ChartCard>
  )
}
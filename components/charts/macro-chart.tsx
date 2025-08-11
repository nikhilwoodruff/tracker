'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import styled from 'styled-components'
import { Card } from '../styled'
import { useInView } from '@/lib/use-in-view'

const ChartCard = styled(Card)`
  padding: 16px;
`

const ChartTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`

interface MacroData {
  date: Date
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface MacroChartProps {
  data: MacroData[]
}

export default function MacroChart({ data }: MacroChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { ref: containerRef, isInView } = useInView(0.2)

  useEffect(() => {
    if (!svgRef.current || !data.length || !isInView) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 100, bottom: 40, left: 50 }
    const width = 600 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(data.map(d => d3.timeFormat('%m/%d')(d.date)))
      .range([0, width])
      .padding(0.1)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.protein + d.carbs + d.fat + d.fiber) || 0])
      .nice()
      .range([height, 0])

    const stack = d3.stack<MacroData>()
      .keys(['protein', 'carbs', 'fat', 'fiber'])

    const colors = {
      protein: '#3b82f6',
      carbs: '#f59e0b',
      fat: '#ef4444',
      fiber: '#10b981'
    }

    const series = stack(data)

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr('class', 'text-xs')
      .style('color', '#737373')

    g.append('g')
      .call(d3.axisLeft(y))
      .attr('class', 'text-xs')
      .style('color', '#737373')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('class', 'text-xs')
      .style('fill', '#737373')
      .text('Grams')

    const groups = g.selectAll('.serie')
      .data(series)
      .enter().append('g')
      .attr('class', 'serie')
      .attr('fill', d => colors[d.key as keyof typeof colors])

    groups.selectAll('rect')
      .data(d => d)
      .enter().append('rect')
      .attr('x', d => x(d3.timeFormat('%m/%d')(d.data.date))!)
      .attr('y', height)
      .attr('height', 0)
      .attr('width', x.bandwidth())
      .transition()
      .delay((d, i) => i * 50)
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width + 10}, 20)`)

    Object.entries(colors).forEach(([key, color], i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`)

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color)

      legendRow.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .style('font-size', '12px')
        .style('fill', '#737373')
        .text(key)
    })

  }, [data, isInView])

  return (
    <ChartCard ref={containerRef}>
      <ChartTitle>Macronutrients breakdown</ChartTitle>
      <svg ref={svgRef} width="600" height="300" style={{ width: '100%', height: 'auto', maxWidth: '100%' }} viewBox="0 0 600 300" />
    </ChartCard>
  )
}
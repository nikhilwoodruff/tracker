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

interface DataPoint {
  date: Date
  value: number
  certainty?: number
}

interface LineChartProps {
  data: DataPoint[]
  title: string
  yLabel: string
  color?: string
  showCertainty?: boolean
}

export default function LineChart({ data, title, yLabel, color = '#3b82f6', showCertainty = false }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = 600 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number])
      .nice()
      .range([height, 0])

    const line = d3.line<DataPoint>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%m/%d') as any))
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
      .text(yLabel)

    if (showCertainty) {
      const area = d3.area<DataPoint>()
        .x(d => x(d.date))
        .y0(d => y(d.value * (1 - (1 - (d.certainty || 1)) * 0.2)))
        .y1(d => y(d.value * (1 + (1 - (d.certainty || 1)) * 0.2)))
        .curve(d3.curveMonotoneX)

      g.append('path')
        .datum(data)
        .attr('fill', color)
        .attr('fill-opacity', 0.1)
        .attr('d', area)
    }

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line)

    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 3)
      .attr('fill', color)

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '4px 8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')

    g.selectAll('.dot')
      .on('mouseover', function(event, d: any) {
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`${d.value}${d.certainty ? ` (${Math.round(d.certainty * 100)}% certain)` : ''}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        tooltip.transition().duration(500).style('opacity', 0)
      })

    return () => {
      d3.select('body').selectAll('.tooltip').remove()
    }
  }, [data, yLabel, color, showCertainty])

  return (
    <ChartCard>
      <ChartTitle>{title}</ChartTitle>
      <svg ref={svgRef} width="600" height="300" style={{ width: '100%', height: 'auto', maxWidth: '100%' }} viewBox="0 0 600 300" />
    </ChartCard>
  )
}
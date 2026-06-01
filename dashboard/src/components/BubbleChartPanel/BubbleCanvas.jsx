import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { categoryCentroids } from './categories.config';
import Tooltip from './Tooltip';

export default function BubbleCanvas({ data }) {
  const svgRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const width = 960;
  const height = 560;

  // SVG Quadrants boundaries outline
  const boundaries = [
    { x: 10, y: 10, w: 460, h: 260, label: 'Technology', labelX: 25, labelY: 32, color: 'stroke-indigo-500/15 fill-indigo-500/[0.01]', textColor: 'fill-indigo-400' },
    { x: 490, y: 10, w: 460, h: 260, label: 'Financials & Macro', labelX: 505, labelY: 32, color: 'stroke-purple-500/15 fill-purple-500/[0.01]', textColor: 'fill-purple-400' },
    { x: 10, y: 290, w: 460, h: 260, label: 'Energy & Industrials', labelX: 25, labelY: 312, color: 'stroke-emerald-500/15 fill-emerald-500/[0.01]', textColor: 'fill-emerald-400' },
    { x: 490, y: 290, w: 460, h: 260, label: 'Consumer & Others', labelX: 505, labelY: 312, color: 'stroke-amber-500/15 fill-amber-500/[0.01]', textColor: 'fill-amber-400' }
  ];

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Deep copy data for D3 force mutation
    const nodes = data.map(d => ({ ...d }));

    // Define radius scale
    const minVol = d3.min(nodes, d => d.dollarVolume) || 1;
    const maxVol = d3.max(nodes, d => d.dollarVolume) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([minVol, maxVol])
      .range([24, 76]);

    // Attach radius to each node
    nodes.forEach(d => {
      d.r = radiusScale(d.dollarVolume);
    });

    // Helper to calculate diverging bubble color scale
    const getColor = (changePct) => {
      if (changePct > 0) {
        const t = Math.min(changePct / 3.0, 1.0);
        return d3.interpolateLab('#334155', '#10b981')(t);
      } else {
        const t = Math.min(Math.abs(changePct) / 3.0, 1.0);
        return d3.interpolateLab('#334155', '#f43f5e')(t);
      }
    };

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('x', d3.forceX(d => {
        const centroid = categoryCentroids[d.category] || categoryCentroids['Consumer & Others'];
        return centroid.x;
      }).strength(0.12))
      .force('y', d3.forceY(d => {
        const centroid = categoryCentroids[d.category] || categoryCentroids['Consumer & Others'];
        return centroid.y;
      }).strength(0.12))
      .force('charge', d3.forceManyBody().strength(-12))
      .force('collision', d3.forceCollide(d => d.r + 4))
      .alpha(1)
      .restart();

    const svg = d3.select(svgRef.current);
    
    // Clear any previous nodes
    svg.selectAll('.node-group').remove();

    // Node container
    const nodeGroup = svg.append('g').attr('class', 'node-group');

    // Create selection
    const nodeSelection = nodeGroup.selectAll('.node')
      .data(nodes, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        setTooltipPos({ x: d.x, y: d.y - d.r - 10 });
      })
      .on('mousemove', (event, d) => {
        setTooltipPos({ x: d.x, y: d.y - d.r - 10 });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Append circles
    nodeSelection.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => getColor(d.changePct))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', '1.5px')
      .attr('opacity', 0.85)
      .style('transition', 'stroke 0.2s, opacity 0.2s')
      .on('mouseover', function() {
        d3.select(this)
          .attr('opacity', 1.0)
          .attr('stroke', '#818cf8')
          .attr('stroke-width', '3px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.85)
          .attr('stroke', '#1e293b')
          .attr('stroke-width', '1.5px');
      });

    // Add Ticker label (Line 1)
    nodeSelection.append('text')
      .attr('dy', d => d.r >= 45 ? '-12' : d.r >= 32 ? '-4' : '3')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', d => d.r >= 45 ? '13px' : '10px')
      .attr('font-weight', '900') // extra bold for ticker
      .attr('pointer-events', 'none')
      .text(d => d.ticker);

    // Add Keyword sub-label (Line 2)
    nodeSelection.filter(d => d.r >= 32)
      .append('text')
      .attr('dy', d => d.r >= 45 ? '2' : '8')
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', d => d.r >= 45 ? '9px' : '8px')
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text(d => {
        const maxChars = Math.max(5, Math.floor(d.r / 3.5));
        if (d.keyword.length > maxChars) {
          return d.keyword.substring(0, maxChars - 1) + '..';
        }
        return d.keyword;
      });

    // Add Change % label (Line 3)
    nodeSelection.filter(d => d.r >= 45)
      .append('text')
      .attr('dy', '14')
      .attr('text-anchor', 'middle')
      .attr('fill', '#f8fafc')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('pointer-events', 'none')
      .text(d => `${d.changePct > 0 ? '+' : ''}${d.changePct.toFixed(2)}%`);

    // Add Volume label (Line 4)
    nodeSelection.filter(d => d.r >= 60)
      .append('text')
      .attr('dy', '24')
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none')
      .text(d => `$${(d.dollarVolume / 1e9).toFixed(1)}B`);

    // Update positions during ticks
    simulation.on('tick', () => {
      nodeSelection.attr('transform', d => {
        // Constrain to boundary quadrants
        d.x = Math.max(d.r + 15, Math.min(width - d.r - 15, d.x));
        d.y = Math.max(d.r + 15, Math.min(height - d.r - 15, d.y));
        return `translate(${d.x}, ${d.y})`;
      });
    });

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="relative w-full overflow-x-auto flex justify-center bg-slate-950/20 border border-slate-900/60 rounded-xl p-1 shadow-inner">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="block select-none"
      >
        {/* Background Quadrants */}
        {boundaries.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={12}
              className={`category-boundary ${b.color}`}
              strokeWidth={1.5}
            />
            <text
              x={b.labelX}
              y={b.labelY}
              className={`category-label ${b.textColor} text-[10px] font-black uppercase tracking-wider`}
            >
              {b.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      <Tooltip node={hoveredNode} pos={tooltipPos} />
    </div>
  );
}

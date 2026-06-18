import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Tooltip from './Tooltip';

export default function BubbleCanvas({ data }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, showBelow: false });
  const [dimensions, setDimensions] = useState({ width: 960, height: 560, isMobile: false });
  const nodePositionsRef = useRef({});

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const containerWidth = entry.contentRect.width;
        const isMobile = containerWidth < 800;
        if (isMobile) {
          setDimensions({
            width: containerWidth,
            height: 1040, // 4 quadrants * 240px + 3 gaps * 16px + 20px padding
            isMobile: true
          });
        } else {
          setDimensions({
            width: Math.min(960, containerWidth),
            height: 560,
            isMobile: false
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height, isMobile } = dimensions;

  // Dynamic SVG boundaries outline
  const boundaries = !isMobile
    ? [
        {
          x: 10,
          y: 10,
          w: width / 2 - 20,
          h: height / 2 - 20,
          label: 'Technology',
          labelX: 25,
          labelY: 32,
          color: 'stroke-indigo-500/15 fill-indigo-500/[0.01]',
          textColor: 'fill-indigo-400'
        },
        {
          x: width / 2 + 10,
          y: 10,
          w: width / 2 - 20,
          h: height / 2 - 20,
          label: 'Financials & Macro',
          labelX: width / 2 + 25,
          labelY: 32,
          color: 'stroke-purple-500/15 fill-purple-500/[0.01]',
          textColor: 'fill-purple-400'
        },
        {
          x: 10,
          y: height / 2 + 10,
          w: width / 2 - 20,
          h: height / 2 - 20,
          label: 'Energy & Industrials',
          labelX: 25,
          labelY: height / 2 + 32,
          color: 'stroke-emerald-500/15 fill-emerald-500/[0.01]',
          textColor: 'fill-emerald-400'
        },
        {
          x: width / 2 + 10,
          y: height / 2 + 10,
          w: width / 2 - 20,
          h: height / 2 - 20,
          label: 'Consumer & Others',
          labelX: width / 2 + 25,
          labelY: height / 2 + 32,
          color: 'stroke-amber-500/15 fill-amber-500/[0.01]',
          textColor: 'fill-amber-400'
        }
      ]
    : [
        {
          x: 10,
          y: 10,
          w: width - 20,
          h: 240,
          label: 'Technology',
          labelX: 25,
          labelY: 32,
          color: 'stroke-indigo-500/15 fill-indigo-500/[0.01]',
          textColor: 'fill-indigo-400'
        },
        {
          x: 10,
          y: 266,
          w: width - 20,
          h: 240,
          label: 'Financials & Macro',
          labelX: 25,
          labelY: 288,
          color: 'stroke-purple-500/15 fill-purple-500/[0.01]',
          textColor: 'fill-purple-400'
        },
        {
          x: 10,
          y: 522,
          w: width - 20,
          h: 240,
          label: 'Energy & Industrials',
          labelX: 25,
          labelY: 544,
          color: 'stroke-emerald-500/15 fill-emerald-500/[0.01]',
          textColor: 'fill-emerald-400'
        },
        {
          x: 10,
          y: 778,
          w: width - 20,
          h: 240,
          label: 'Consumer & Others',
          labelX: 25,
          labelY: 800,
          color: 'stroke-amber-500/15 fill-amber-500/[0.01]',
          textColor: 'fill-amber-400'
        }
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
      .range([18, 56]);

    // Attach radius and initial/cached coordinates to each node
    nodes.forEach(d => {
      d.r = radiusScale(d.dollarVolume);
      
      // Calculate previous radius if dollarVolumePrev is available
      if (d.dollarVolumePrev && d.dollarVolumePrev > 0) {
        d.rPrev = Math.max(2, radiusScale(d.dollarVolumePrev));
      } else {
        d.rPrev = 0;
      }

      // Check if we have cached position and velocity for this node
      const cached = nodePositionsRef.current[d.id];
      if (cached) {
        d.x = cached.x;
        d.y = cached.y;
        d.vx = cached.vx;
        d.vy = cached.vy;
      } else {
        // Initialize x and y near the centroid to avoid force explosion
        if (!isMobile) {
          d.x = d.category === 'Technology' || d.category === 'Energy & Industrials' ? width / 4 : (3 * width) / 4;
          d.y = d.category === 'Technology' || d.category === 'Financials & Macro' ? height / 4 : (3 * height) / 4;
        } else {
          let idx = 3;
          if (d.category === 'Technology') idx = 0;
          else if (d.category === 'Financials & Macro') idx = 1;
          else if (d.category === 'Energy & Industrials') idx = 2;
          d.x = width / 2;
          d.y = idx * 256 + 10 + 120;
        }
      }
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

    // Helper to calculate boundaries dynamically
    const getBounds = (category) => {
      if (!isMobile) {
        const halfW = width / 2;
        const halfH = height / 2;
        if (category === 'Technology') {
          return { xMin: 10, xMax: halfW - 10, yMin: 10, yMax: halfH - 10 };
        } else if (category === 'Financials & Macro') {
          return { xMin: halfW + 10, xMax: width - 10, yMin: 10, yMax: halfH - 10 };
        } else if (category === 'Energy & Industrials') {
          return { xMin: 10, xMax: halfW - 10, yMin: halfH + 10, yMax: height - 10 };
        } else {
          return { xMin: halfW + 10, xMax: width - 10, yMin: halfH + 10, yMax: height - 10 };
        }
      } else {
        let idx = 3;
        if (category === 'Technology') idx = 0;
        else if (category === 'Financials & Macro') idx = 1;
        else if (category === 'Energy & Industrials') idx = 2;
        const yStart = idx * 256 + 10;
        return {
          xMin: 10,
          xMax: width - 10,
          yMin: yStart,
          yMax: yStart + 240
        };
      }
    };

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('x', d3.forceX(d => {
        if (!isMobile) {
          if (d.category === 'Technology' || d.category === 'Energy & Industrials') return width / 4;
          return (3 * width) / 4;
        } else {
          return width / 2;
        }
      }).strength(0.15))
      .force('y', d3.forceY(d => {
        if (!isMobile) {
          if (d.category === 'Technology' || d.category === 'Financials & Macro') return height / 4;
          return (3 * height) / 4;
        } else {
          let idx = 3;
          if (d.category === 'Technology') idx = 0;
          else if (d.category === 'Financials & Macro') idx = 1;
          else if (d.category === 'Energy & Industrials') idx = 2;
          return idx * 256 + 10 + 120;
        }
      }).strength(0.15))
      .force('charge', d3.forceManyBody().strength(-10))
      .force('collision', d3.forceCollide(d => d.r + 2))
      .alpha(1)
      .restart();

    const svg = d3.select(svgRef.current);
    
    // Select or create Node container
    let nodeGroup = svg.select('.node-group');
    if (nodeGroup.empty()) {
      nodeGroup = svg.append('g').attr('class', 'node-group');
    }

    // Create selection with D3 .join() pattern
    const nodeSelection = nodeGroup.selectAll('.node')
      .data(nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .attr('opacity', 0); // start transparent

          // Set up hover event listeners once on enter
          g.on('mouseenter', (event, d) => {
            setHoveredNode(d);
            const showBelow = d.y - d.r - 180 < 0;
            const clampedX = Math.max(136, Math.min(width - 136, d.x));
            setTooltipPos({ 
              x: clampedX, 
              y: showBelow ? d.y + d.r + 10 : d.y - d.r - 10,
              showBelow 
            });
          })
          .on('mousemove', (event, d) => {
            const showBelow = d.y - d.r - 180 < 0;
            const clampedX = Math.max(136, Math.min(width - 136, d.x));
            setTooltipPos({ 
              x: clampedX, 
              y: showBelow ? d.y + d.r + 10 : d.y - d.r - 10,
              showBelow 
            });
          })
          .on('mouseleave', () => {
            setHoveredNode(null);
          });

          // Append circles (initial radius 0 for smooth pop-in transition)
          g.append('circle')
            .attr('class', 'main-circle')
            .attr('r', 0)
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

          // Append previous size dashed circle if available
          g.append('circle')
            .attr('class', 'prev-circle')
            .attr('r', 0)
            .attr('fill', 'none')
            .attr('stroke', d => d.rPrev > d.r ? '#a5b4fc' : 'rgba(255, 255, 255, 0.45)')
            .attr('stroke-width', d => d.rPrev > d.r ? '1.5px' : '1.2px')
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0)
            .attr('pointer-events', 'none');

          // Add Ticker label (Line 1)
          g.append('text')
            .attr('class', 'ticker-label')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', '900')
            .attr('pointer-events', 'none');

          // Add Keyword sub-label (Line 2)
          g.append('text')
            .attr('class', 'keyword-label')
            .attr('text-anchor', 'middle')
            .attr('fill', '#cbd5e1')
            .attr('font-weight', '500')
            .attr('pointer-events', 'none');

          // Add Change % label (Line 3)
          g.append('text')
            .attr('class', 'change-label')
            .attr('text-anchor', 'middle')
            .attr('fill', '#f8fafc')
            .attr('font-weight', '700')
            .attr('pointer-events', 'none');

          // Add Volume label (Line 4)
          g.append('text')
            .attr('class', 'volume-label')
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-family', 'monospace')
            .attr('pointer-events', 'none');

          return g;
        },
        update => update,
        exit => exit.transition().duration(250).attr('opacity', 0).remove()
      );

    // Fade in / stabilize the main selection opacity
    nodeSelection.transition().duration(250).attr('opacity', 1);

    // Update main circles with transition
    nodeSelection.select('.main-circle')
      .transition()
      .duration(300)
      .attr('r', d => d.r)
      .attr('fill', d => getColor(d.changePct));

    // Update previous size circles with transition
    nodeSelection.select('.prev-circle')
      .transition()
      .duration(300)
      .attr('r', d => d.rPrev)
      .attr('stroke', d => d.rPrev > d.r ? '#a5b4fc' : 'rgba(255, 255, 255, 0.45)')
      .attr('stroke-width', d => d.rPrev > d.r ? '1.5px' : '1.2px')
      .attr('opacity', d => d.rPrev > 0 ? (d.rPrev > d.r ? 0.75 : 0.5) : 0);

    // Update Ticker label
    nodeSelection.select('.ticker-label')
      .text(d => d.ticker)
      .transition()
      .duration(300)
      .attr('dy', d => d.r >= 38 ? '-10' : d.r >= 28 ? '-2' : '3')
      .attr('font-size', d => d.r >= 38 ? '12px' : '9px');

    // Update Keyword sub-label
    nodeSelection.select('.keyword-label')
      .text(d => {
        if (d.r < 28) return '';
        const maxChars = Math.max(5, Math.floor(d.r / 3.5));
        if (d.keyword.length > maxChars) {
          return d.keyword.substring(0, maxChars - 1) + '..';
        }
        return d.keyword;
      })
      .transition()
      .duration(300)
      .attr('dy', d => d.r >= 38 ? '2' : '8')
      .attr('font-size', d => d.r >= 38 ? '8.5px' : '7.5px');

    // Update Change % label
    nodeSelection.select('.change-label')
      .text(d => d.r >= 38 ? `${d.changePct > 0 ? '+' : ''}${d.changePct.toFixed(2)}%` : '')
      .transition()
      .duration(300)
      .attr('dy', '12')
      .attr('font-size', '8.5px');

    // Update Volume label
    nodeSelection.select('.volume-label')
      .text(d => d.r >= 48 ? `$${(d.dollarVolume / 1e9).toFixed(1)}B` : '')
      .transition()
      .duration(300)
      .attr('dy', '22')
      .attr('font-size', '8px');

    // Update positions during ticks
    simulation.on('tick', () => {
      nodeSelection.attr('transform', d => {
        const bounds = getBounds(d.category);
        const padding = 6;
        const maxRadius = Math.max(d.r, d.rPrev || 0);
        d.x = Math.max(bounds.xMin + maxRadius + padding, Math.min(bounds.xMax - maxRadius - padding, d.x));
        d.y = Math.max(bounds.yMin + maxRadius + padding, Math.min(bounds.yMax - maxRadius - padding, d.y));
        
        // Cache current coordinates and velocities
        nodePositionsRef.current[d.id] = { x: d.x, y: d.y, vx: d.vx, vy: d.vy };
        
        return `translate(${d.x}, ${d.y})`;
      });
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, isMobile]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-slate-950/20 border border-slate-900/60 rounded-xl p-1 shadow-inner overflow-hidden flex justify-center"
    >
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

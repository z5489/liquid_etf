# Bubble Chart Panel — Architecture

## Overview

An embedded panel inside the existing ETF Momentum Tracker dashboard. It visualises key stocks/keywords by dollar volume using sized bubbles, grouped by sector category, coloured by price change direction.

---

## Component Structure

```
<BubbleChartPanel>
  ├── <PanelHeader />               # Title + last-updated timestamp
  ├── <BubbleCanvas>                # Main D3 force-layout canvas
  │   ├── <CategoryGroup>           # One per sector (Semis, Tech, Energy…)
  │   │   ├── <GroupBoundary />     # Soft dashed border + label
  │   │   └── <Bubble> (×N)        # One per stock/keyword
  │   │       ├── circle            # Size = dollar volume
  │   │       ├── text: ticker      # e.g. AMD
  │   │       ├── text: keyword     # e.g. Semiconductors
  │   │       ├── text: $ volume    # e.g. $2.4B
  │   │       └── text: % change    # e.g. +3.2%
  │   └── <Tooltip />               # On hover: full stats card
  └── <Legend />                    # Color scale: deep red → neutral → deep green
```

---

## Data Layer

### Source
Pull from existing dashboard data — no new API calls. The ETF holdings data already contains:
- Ticker symbol
- Dollar volume
- Price / % price change

### Keyword Mapping
ETF tickers are generalised to human-readable keywords via a static lookup map:

```
SOXX, SMH, SOXS → "Semiconductors"
QQQ, XLK         → "Tech"
AMD, NVDA        → "AMD", "NVIDIA"         ← individual large-caps kept as-is
XLE, OIH         → "Energy"
XLF, KRE         → "Financials"
GLD, SLV         → "Commodities"
...
```

### Category Assignment
Each keyword maps to a parent category group. Category memberships are defined in a separate `categories.config.js` file so they can be updated without touching chart logic.

---

## Visual Encoding

| Visual property | Data field              |
|-----------------|-------------------------|
| Bubble size     | Dollar volume (scaled with `d3.scaleSqrt`) |
| Bubble colour   | % price change (red = down, green = up, neutral grey = flat) |
| Label line 1    | Ticker symbol           |
| Label line 2    | Keyword label           |
| Label line 3    | Dollar volume ($B)      |
| Label line 4    | % price change          |

### Colour Scale
Diverging scale anchored at 0%:
- `> +3%` → strong green
- `0%` → neutral grey (matches dashboard dark theme)
- `< -3%` → strong red

---

## Layout

### Group Arrangement
- Force-directed layout scoped **per category group**
- Each group occupies a defined zone on the canvas (e.g. Semis: top-left, Tech: top-right)
- Groups are separated by soft dashed boundary rectangles with a visible label above

### Bubble Sizing
- Min bubble radius: `24px` (smallest by volume)
- Max bubble radius: `80px` (largest by volume)
- Scaled via `d3.scaleSqrt` to avoid over-emphasising large values

### Overlap Prevention
- D3 force simulation with `forceCollide` (radius = bubble radius + 4px padding)
- Bubbles within a group repel each other but are attracted to their group centroid

---

## Interaction

### Hover
- Tooltip appears anchored to bubble
- Shows: full name, ticker, keyword, dollar volume, % change, category

### No click behaviour (v1)
- Intentionally simple for the embedded panel context

---

## Theming

- Inherits the dashboard's existing dark theme CSS variables
- Background: transparent (panel sits inside the dashboard card grid)
- Text: dashboard's primary/secondary text tokens
- Borders: dashboard's border-tertiary (dashed, low opacity for group boundaries)

---

## File Structure

```
/components
  /BubbleChartPanel
    index.jsx                  # Panel shell (header + canvas + legend)
    BubbleCanvas.jsx           # D3 force simulation + SVG render
    Tooltip.jsx                # Hover tooltip card
    Legend.jsx                 # Colour legend
    useBubbleData.js           # Data transform hook (ETF → keywords)
    categories.config.js       # Keyword → category mapping
    bubbleChart.css            # Panel-scoped styles
```

---

## Dependencies

| Library     | Purpose                        | Already in project? |
|-------------|--------------------------------|---------------------|
| `d3`        | Force layout, scale, SVG       | Likely yes          |
| `d3-scale-chromatic` | Diverging colour scale | Bundled with d3     |

No new dependencies required beyond D3.

---

## Out of Scope (v1)

- Click to expand constituent ETFs
- Time window toggle (today vs 5d vs 30d)
- Animated bubble transitions on data refresh
- Mobile responsive layout

These can be added in v2 once the panel is embedded and validated.

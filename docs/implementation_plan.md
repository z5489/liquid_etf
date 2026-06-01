# Implementation Plan - Bubble Chart Panel

We will implement a D3 force-directed Bubble Chart Panel to visualize sector and holding concentration by dollar volume. It will sit above the main ETF table on the dashboard, react dynamically to any applied search query or filters, and support hover tooltips with detailed constituent breakdowns.

## Proposed Changes

---

### Dependencies

#### [MODIFY] [package.json](file:///c:/Users/ziyen/liquid_etf/dashboard/package.json)
- Add `d3` version `^7.9.0` to the dependencies list. We will run `npm install d3` in the terminal to download it.

---

### Component Configuration

#### [NEW] [categories.config.js](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/categories.config.js)
- Maps prominent tickers (like `SOXX`, `SMH`, `QQQ`, `XLK`, `AMD`, `NVDA`, etc.) to human-readable keywords.
- Maps keywords to 4 major category groups:
  1. **Technology** (Quadrant: Top-Left)
  2. **Financials & Macro** (Quadrant: Top-Right)
  3. **Energy & Industrials** (Quadrant: Bottom-Left)
  4. **Consumer & Others** (Quadrant: Bottom-Right)
- Specifies the centroid target coordinate zones for the D3 force simulation.

---

### Data Aggregation Hook

#### [NEW] [useBubbleData.js](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/useBubbleData.js)
- Processes the filtered ETF dataset to aggregate holdings by keyword (summing dollar volume, calculating weighted average price change, listing constituent tickers).
- Falls back to `Focus` or `AssetClass` categories for unmapped tickers.
- Returns the top 45 keywords sorted by volume to prevent visualization clutter.

---

### Visual Components

#### [NEW] [Tooltip.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/Tooltip.jsx)
- Renders an absolute-positioned hovered bubble details card including the category header, total volume, average change, number of constituent ETFs, and constituent tickers.

#### [NEW] [Legend.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/Legend.jsx)
- Displays a horizontal gradient bar illustrating the diverging color scale (-3% or lower is rose-500 red, 0% is slate-700 gray, +3% or higher is emerald-500 green).

#### [NEW] [BubbleCanvas.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/BubbleCanvas.jsx)
- Configures the D3 force simulation with attraction to category centroids, charge repulsion, and collision radius padding to prevent overlapping.
- Renders 4 dashed quadrant boundary panels with native SVG labels.
- Handles hover mouse events to update the tooltip positioning and bubble highlight styling.

#### [NEW] [bubbleChart.css](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/bubbleChart.css)
- Stylings for SVG boundary rectangles, category titles, and animations.

#### [NEW] [index.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/index.jsx)
- Integrates the header, canvas, tooltip, and legend components into a single embedded card.

---

### Dashboard Integration

#### [MODIFY] [App.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/App.jsx)
- Import and insert `<BubbleChartPanel etfs={sortedETFs} />` directly above the table.

## Verification Plan

### Automated / Build Checks
- Run `npm install d3` to install the dependency.
- Run `npm run build` to verify successful client bundling with the new D3 code.

### Manual Verification
- Launch the development server `npm run dev`.
- Hover over various bubbles to confirm:
  - Circle diameters represent relative dollar volume.
  - Hover states show the correct absolute-positioned card tooltip with correct constituents.
  - Changing filter options (e.g. typing a ticker or selecting an Asset Class) triggers smooth D3 force rearrangements of the bubbles in real time.

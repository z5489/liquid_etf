# Walkthrough - Historical Date Selection & Ticker Bubble Chart

We have successfully added the capability to load/toggle historical screening data and visualize individual ETF concentration map using a D3 force-directed bubble chart.

## Key Changes

### 1. Data Fetching & Indexing
- Modified `scripts/fetch_etf_data.py`:
  - Saves a date-stamped copy to `data/etf_momentum_YYYY-MM-DD.csv` in addition to the main `data/etf_momentum.csv`.
  - Re-scans `data/` and updates `data/available_dates.json` with the sorted list of available date strings.

### 2. Frontend Configuration
- Updated `dashboard/package.json`:
  - Modified `dev` and `build` scripts to automatically copy all `.csv` and `.json` files from `../data/` to `public/data/` before serving.

### 3. Dashboard UI & Date Selection
- Updated `dashboard/src/App.jsx`:
  - Loads available dates on page mount and defaults to the most recent date in the index (the last business day).
  - Features a custom Glassmorphic dropdown in the header next to "Last Updated" to switch historical dates dynamically.
  - Defaults the grid sorting column to **Dollar Volume** (`DollarVolume`).

### 4. D3 Ticker Bubble Chart Panel
- Implemented a concentration bubble map under `dashboard/src/components/BubbleChartPanel/`:
  - **Ticker Bubbles**: Instead of grouping by keyword, each individual ETF is rendered as its own bubble.
  - **Sizing**: Circle radius is scaled to the ETF's `DollarVolume` (minimum 24px, maximum 76px) using `d3.scaleSqrt` to maintain proportional area.
  - **Coloring**: Diverging color interpolation between deep red (`#f43f5e`), neutral gray (`#334155`), and green (`#10b981`) represents the ETF's `% Change`.
  - **D3 Simulation**: Nodes repel each other and are attracted to their category quadrant centroids (Technology, Financials & Macro, Energy & Industrials, Consumer & Others).
  - **Label Density**: Text labels are automatically adapted to circle radius:
    - Small (`r < 32`): Ticker only (e.g. `SMH`).
    - Medium (`32 <= r < 45`): Ticker + keyword Focus sub-label (e.g. `SMH` / `Semiconductors`).
    - Large (`45 <= r < 60`): Ticker + keyword + Change % (e.g. `NVDA` / `NVIDIA` / `+15.41%`).
    - Extra-large (`r >= 60`): Adds the Dollar Volume line (e.g. `$2.4B`).
  - **Stats Tooltip**: Floating absolute-positioned card shows full ETF Name, Ticker, Focus keyword, Category, AUM, Volume, and Change %.

### 5. GitHub Workflows
- Updated `fetch_batch1.yml`, `fetch_batch2.yml`, and `fetch_batch3.yml` to stage the new date-stamped files and the `available_dates.json` index:
  ```yaml
  git add data/etf_momentum.csv data/etf_momentum_*.csv data/available_dates.json
  ```

## Verification
- Bundling and client compiling completes successfully.
- Changing search filters or selecting different historical dates triggers reactive animations as bubbles rearrange and scale dynamically.

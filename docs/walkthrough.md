# Walkthrough - Historical Date Selection

We have successfully added the capability to load and toggle historical screening data on the dashboard. The application now automatically defaults to the last available business day from the dates index.

## Key Changes

### 1. Data Fetching & Indexing
- Modified `scripts/fetch_etf_data.py`:
  - When new ETF screening data is fetched, the script writes a copy to `data/etf_momentum_YYYY-MM-DD.csv` in addition to `data/etf_momentum.csv`.
  - The script scans the `data/` directory for all date-stamped CSVs and updates `data/available_dates.json` containing the sorted array of date strings.

### 2. Frontend Configuration
- Updated `dashboard/package.json`:
  - The `dev` and `build` scripts were updated to automatically copy all `.csv` and `.json` files from `../data/` to `public/data/` so they are accessible by Vite.

### 3. Dashboard UI
- Updated `dashboard/src/App.jsx`:
  - The dashboard now reads `/data/available_dates.json` on page load to find all available historical dates.
  - The default state loads the first item in the list (the latest business day, e.g. `2026-06-01`).
   - Added a beautifully formatted Glassmorphic date selector dropdown in the header next to the "Last Updated" display. When a date is selected, the application dynamically updates the CSV URL and re-fetches the dataset.
  - Set the default sorting column of the ETF table to **Dollar Volume** (`DollarVolume`).

### 4. GitHub Workflows
- Updated `fetch_batch1.yml`, `fetch_batch2.yml`, and `fetch_batch3.yml` to stage the new date-stamped files and the `available_dates.json` index:
  ```yaml
  git add data/etf_momentum.csv data/etf_momentum_*.csv data/available_dates.json
  ```

## Verification

### 1. Build Verification
Running `npm run build` inside `dashboard/` completes successfully and copies:
- `available_dates.json`
- `etf_momentum.csv`
- `etf_momentum_2026-05-23.csv`
- `etf_momentum_2026-06-01.csv`

### 2. Running Locally
When running the development server (`npm run dev`), the files are copied and loaded correctly. Since the dates array contains `["2026-06-01", "2026-05-23"]`, the UI:
- Defaults to loading the June 1st dataset.
- Defaults to sorting the ETF grid by **Dollar Volume** (descending).
- Allows the user to select the May 23rd dataset from the dropdown, which updates the "Last Updated" metadata.

---

# Bubble Chart Panel Implementation

We have successfully integrated the **Sector & Holding Concentration Map** (D3 force-directed bubble chart) into the dashboard as specified by the bubble chart architecture document.

## Architecture & Layout
- The new components are organized cleanly under `dashboard/src/components/BubbleChartPanel/`:
  - [categories.config.js](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/categories.config.js): Handles mapping lookup and quadrant centroids coordinate layout.
  - [useBubbleData.js](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/useBubbleData.js): Aggregates dollar volumes and calculates weighted price change per keyword. Falls back to metadata categories for unmapped tickers.
  - [BubbleCanvas.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/BubbleCanvas.jsx): Integrates D3 force simulations (`forceCollide`, centroids force attraction, repulsion) with SVG boundaries and hover handlers.
  - [Tooltip.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/Tooltip.jsx): Custom HTML/Tailwind floating tooltip.
  - [Legend.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/Legend.jsx): Visualizes average price change color scale.
  - [index.jsx](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/index.jsx): Entry point panel layout.

## Verification
- Running `npm run build` completes successfully, verifying bundling size and dependency resolution for `d3`.
- In the browser, the bubbles are grouped into 4 quadrant groups based on technology, financials & macro, energy & industrials, or consumer & others, separated by thin dashed rectangles with sector titles.
- Toggling search keywords or filters causes the D3 simulation to smoothly regroup and animate the circles in real-time.

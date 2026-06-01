# Walkthrough - Historical Date Selection & Ticker Bubble Chart

We have successfully added the capability to load/toggle historical screening data and visualize underlying stock ticker concentration map using a D3 force-directed bubble chart.

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
  - **Collapsible UI Panel**: Added a collapse state (defaulting to collapsed) with a premium toggle button in the header. Expanding mounts the D3 canvas and starts the force simulation with a smooth entrance animation, saving initial load CPU and space.
  - **Stock Ticker Aggregation**: Resolved single-stock leveraged/derivative ETFs to their underlying stock ticker. Built an automated Python parser (`scripts/generate_js_config.py`) to scan `data/etf_momentum.csv`, resolve ticker mappings, and dynamically generate `categories.config.js`.
  - **Broad Market Index Filtering**: Excluded broad market indices (e.g. `SPY`, `QQQ`, `VTI`, `BND`, `AGG`, `IWM`, `BIL`, `SGOV`) and broad asset category Focus types (like `"Large cap"`, `"Total market"`, `"Mid cap"`, `"Small cap"`, `"Investment grade"`) from the bubble map. This prevents multi-billion-dollar index funds from drowning out single-stock underlying assets and guarantees that individual company tickers (like `PLTR`, `MRVL`, `NOW`, `IONQ`, `ARM`, etc.) remain visible even when filtering by "All".
  - **Capital Letter Ticker Parsing**: Created a dynamic uppercase word search parser in [useBubbleData.js](file:///c:/Users/ziyen/liquid_etf/dashboard/src/components/BubbleChartPanel/useBubbleData.js). It scans the ETF's Name for 2-5 consecutive uppercase letters (e.g. `TSM` in `"Direxion Daily TSM Bull 2X ETF"`, or `PANW` in `"Yieldmax PANW Option..."`), filters out common uppercase financial words (like `ETF`, `USD`, `INC`, `PLC`, etc.), and extracts the stock ticker automatically.
  - **Comprehensive Mapping Coverage**: Resolved previously unmapped tickers to their clean names and correct quadrants:
    - **Cerebras Systems (`CBRS`)**: AI chipmaker mapped to **Technology**.
    - **Webull (`BULL`)**: Retail brokerage mapped to **Financials & Macro**.
    - **Block (`XYZ`)**: Square/Cash App fintech mapped to **Financials & Macro**.
    - **AST SpaceMobile (`ASTS`)**: Satellite telecom mapped to **Technology**.
    - **Rocket Lab (`RKLB`)**, **Redwire (`RDW`)**, **Intuitive Machines (`LUNR`)**: Mapped to **Energy & Industrials**.
    - **Palantir (`PLTR`)**, **Marvell (`MRVL`)**, **ServiceNow (`NOW`)**, **Arm (`ARM`)**: Properly mapped to **Technology** instead of falling back to default categories.
    - Cleaned up raw dynamic names (e.g. `Aal Daily` -> `American Airlines`, `Abnb` -> `Airbnb`, etc.) via a comprehensive mapping dictionary.
  - **Strict Quadrant Boundaries Constraint**: Modified the D3 simulation ticks to enforce strict boundary containment coordinates for each category quadrant. Bubbles are constrained to stay within their respective 460x260 bounding box quadrants, entirely preventing overflow or mixing between sectors.
  - **Optimized Sizing**: Scale circles to `DollarVolume` with an optimized radius range `[18, 56]` (minimum 18px, maximum 56px) and reduced collision padding `+2`. This ensures that even in highly concentrated sectors (like Technology), all bubbles fit perfectly and float elegantly within their respective quadrants without overlap or congestion.
  - **Coloring**: Diverging color interpolation between deep red (`#f43f5e`), neutral gray (`#334155`), and green (`#10b981`) represents the weighted average `% Change`.
  - **Label Density**: Text labels adapt dynamically to circle radius for readability:
    - Small (`r < 28`): Ticker only (e.g. `MU`).
    - Medium (`28 <= r < 38`): Ticker + keyword Focus sub-label (e.g. `MU` / `Micron Technology`).
    - Large (`38 <= r < 48`): Ticker + keyword + Change % (e.g. `NVDA` / `NVIDIA` / `+15.41%`).
    - Extra-large (`r >= 48`): Adds the Dollar Volume line (e.g. `$2.4B`).
  - **Stats Tooltip**: Floating absolute-positioned card shows the underlying stock ticker, full ETF Name, Focus keyword, Category, AUM, Volume, Change %, and a list of all contributing ETFs (e.g. `MUU`).

### 5. GitHub Workflows
- Updated `fetch_batch1.yml`, `fetch_batch2.yml`, and `fetch_batch3.yml` to stage the new date-stamped files and the `available_dates.json` index:
  ```yaml
  git add data/etf_momentum.csv data/etf_momentum_*.csv data/available_dates.json
  ```
- **Workflow Serialization & Concurrency Fix**: Configured the same `concurrency` group `fetch-etf-data` with `cancel-in-progress: false` across all three batch workflows (and `split_batches.yml`). Also forced the checkout step to pull `ref: main`. This ensures sequential queueing of all repo-modifying tasks and prevents concurrent rebases/pushes from causing merge conflicts in `data/etf_momentum.csv`.

## Verification
- Bundling and client compiling completes successfully.
- Changing search filters or selecting different historical dates triggers reactive animations as bubbles rearrange and scale dynamically.

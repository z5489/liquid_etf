# ETF Momentum Tracker

An automated ETF screening and monitoring system. It downloads metadata and daily prices from Yahoo Finance, filters for ETFs that show strong momentum and volatility, and displays the results in an interactive React dashboard.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      YOUR MACHINE                        │
│  universe.csv  ──►  split_batches.py  ──►  batch1.json  │
│                                           batch2.json    │
│                                           batch3.json    │
└───────────────────────────┬─────────────────────────────┘
                            │ git push /data/*.json
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     GITHUB REPO                          │
│                                                          │
│  /data/batch1.json   ◄──────────────────────────┐       │
│  /data/batch2.json                               │       │
│  /data/batch3.json                               │       │
│  /data/etf_momentum.csv  ◄── fetch_etf_data.py │       │
│                                                  │       │
│  GitHub Actions                                  │       │
│  ├── split_batches.yml  (manual dispatch)        │       │
│  ├── fetch_batch1.yml   (cron 21:00 UTC) ────────┤       │
│  ├── fetch_batch2.yml   (cron 21:15 UTC) ────────┤       │
│  └── fetch_batch3.yml   (cron 21:30 UTC) ────────┘       │
└───────────────────────────┬─────────────────────────────┘
                            │ GitHub raw URL
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  REACT DASHBOARD (Vercel)                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Loads etf_momentum.csv on page load + Refresh  │   │
│  │  Ranked table (Change% desc, filterable/sortable)│   │
│  │  Bubble chart history comparison (AUM/Vol/Flows) │   │
│  │  Row click → detail drawer                       │   │
│  │  Export to CSV                                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Project Directory Structure

```
etf-momentum-tracker/
│
├── data/
│   ├── batch1.json              # Batch 1 ETF tickers (1/3 of universe)
│   ├── batch2.json              # Batch 2 ETF tickers (1/3 of universe)
│   ├── batch3.json              # Batch 3 ETF tickers (1/3 of universe)
│   └── etf_momentum.csv        # Excel workbook containing screened ETFs
│
├── scripts/
│   ├── split_batches.py         # Splits universe.csv into 3 JSON files
│   └── fetch_etf_data.py        # Fetches Yahoo Finance daily data & merges Excel
│
├── .github/
│   └── workflows/
│       ├── split_batches.yml    # GHA Manual dispatch to split batches
│       ├── fetch_batch1.yml     # Cron workflow for Batch 1 (21:00 UTC)
│       ├── fetch_batch2.yml     # Cron workflow for Batch 2 (21:15 UTC)
│       └── fetch_batch3.yml     # Cron workflow for Batch 3 (21:30 UTC)
│
├── dashboard/                   # React dashboard project (Vite)
│   ├── src/
│   │   ├── App.jsx              # App layout, state, fetch & export handlers
│   │   ├── index.css            # Stylesheets & Tailwind setup
│   │   ├── main.jsx             # React mounting script
│   │   └── components/
│   │       ├── ETFTable.jsx     # Ranked, sortable & filterable ETF table
│   │       ├── DetailDrawer.jsx # Slide-out drawer displaying profile details
│   │       ├── Toolbar.jsx      # Controls: search, drop filters, download CSV
│   │       └── ETFHistoryPanel.jsx # Fund size and flow history timeline grid
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── postcss.config.js        # PostCSS configuration (Tailwind v4 PostCSS integration)
│   ├── package.json             # NPM project definitions
│   └── index.html               # Entry HTML (with Google Font imports)
│
├── universe.csv                 # Primary ETF universe input file
└── README.md
```

---

## 2. Technical & Metrics Specifications

### Metrics Calculations
- **Change %**: `(close_today - close_yesterday) / close_yesterday * 100` (computed using the two most recent trading sessions).
- **Perf 1W (1-Week Return)**: `(close_today - open_same_weekday_prior_week) / abs(open_same_weekday_prior_week) * 100`. (If last week's same weekday is a holiday, we fall back to the closest trading session).
- **Vol 1M (Average Intraday Volatility)**: `sum((high - low) / abs(low) * 100) / numBars` for all trading bars inside the last 30 calendar days.
- **Dollar Volume**: `volume_today * close_today`
- **Relative Volume (RelVolume)**: `volume_today / avg_volume_30d` (average volume is calculated over all trading sessions inside the last 30 calendar days).
- **AUM**: Retrieved from the Yahoo Finance Ticker Info dictionary under `totalAssets` (or fallbacks `netAssets` / `total_assets`).

### Screening Criteria
An ETF must satisfy all three filters to be recorded in the final spreadsheet:
1. `Perf 1W` > 10%
2. `Vol 1M` > 2%
3. `AUM` > $10,000,000

---

## 3. Local Setup & Testing

### 3.1 Python Data Pipeline
Ensure you have Python 3.11+ installed. Install the requirements:
```bash
pip install pandas yfinance openpyxl
```

1. **Split the Universe into batches**:
   ```bash
   python scripts/split_batches.py
   ```
   This reads `universe.csv` and outputs `data/batch1.json`, `data/batch2.json`, and `data/batch3.json`.

2. **Fetch data for a batch (e.g. Batch 1)**:
   ```bash
   python scripts/fetch_etf_data.py --batch 1
   ```
   This downloads historical data, filters the tickers, and writes to `data/etf_momentum.csv`. Run sequentially for batches 2 and 3 to test the merging and upserting logic.

### 3.2 React Dashboard (Vite)
Navigate to the dashboard directory:
```bash
cd dashboard
```

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the local development server**:
   ```bash
   npm run dev
   ```

3. **Production build**:
   ```bash
   npm run build
   ```

---

## 4. GitHub Actions Workflows & Deployment

To deploy this in production:
1. **GitHub Repository**: Commit and push this codebase to a repository on GitHub.
2. **Workflows Configuration**:
   - Ensure the repository has read/write permissions enabled for workflows (Settings > Actions > General > Workflow permissions > select **Read and write permissions**).
   - This allows GitHub Actions to commit and push changes to `data/etf_momentum.csv` automatically.
3. **Raw URL Configuration**:
   - For Vercel hosting, configure the `VITE_EXCEL_URL` environment variable to point to your repository's raw URL:
     `https://raw.githubusercontent.com/<your-username>/<your-repo-name>/main/data/etf_momentum.csv`
   - Vercel will build and host the static dashboard using the raw URL to load spreadsheet data on page load.

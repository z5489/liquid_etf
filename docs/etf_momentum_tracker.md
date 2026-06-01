# ETF Momentum Tracker — Architecture & User Stories

---

## 1. Overview

A fully automated ETF screening and monitoring system. A Python pipeline runs daily via GitHub Actions, downloads price/metadata from Yahoo Finance, applies momentum filters, and commits a single Excel file to the repo. A React dashboard hosted on Vercel reads that Excel file and presents a ranked, interactive table to the user.

---

## 2. System Architecture

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
│  /data/etf_momentum.xlsx  ◄── fetch_etf_data.py │       │
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
│  │  Loads etf_momentum.xlsx on page load + Refresh  │   │
│  │  Ranked table (Change% desc, filterable/sortable)│   │
│  │  Row click → detail drawer                       │   │
│  │  Export to CSV                                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Repo Structure

```
etf-momentum-tracker/
│
├── data/
│   ├── batch1.json              # ~1/3 of ticker universe
│   ├── batch2.json              # ~1/3 of ticker universe
│   ├── batch3.json              # ~1/3 of ticker universe
│   └── etf_momentum.xlsx        # output — committed by CI
│
├── scripts/
│   ├── split_batches.py         # ad hoc: splits CSV → 3 JSONs
│   └── fetch_etf_data.py        # scheduled: fetches Yahoo Finance, writes Excel
│
├── .github/
│   └── workflows/
│       ├── split_batches.yml    # manual workflow_dispatch
│       ├── fetch_batch1.yml     # cron 21:00 UTC
│       ├── fetch_batch2.yml     # cron 21:15 UTC
│       └── fetch_batch3.yml     # cron 21:30 UTC
│
├── dashboard/                   # React app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ETFTable.jsx
│   │   │   ├── DetailDrawer.jsx
│   │   │   └── Toolbar.jsx
│   └── package.json
│
├── universe.csv                 # your input file (committed to repo)
└── README.md
```

---

## 4. Input CSV Format

The user provides a CSV file (`universe.csv`) with the following columns:

| Column | Required | Example |
|---|---|---|
| Ticker | ✅ | SPY |
| Name | ✅ | SPDR S&P 500 ETF Trust |
| AssetClass | ✅ | Equity |
| Leverage | ✅ | 1x |
| WeightScheme | ✅ | Market Cap |
| FundFlow1M | ⬜ Optional | 1200000000 |

If `FundFlow1M` column is absent from the CSV, it is omitted from Excel output and hidden in the dashboard entirely.

---

## 5. Data & Metrics Definitions

### Change %
```
Change % = (close_today - close_yesterday) / close_yesterday × 100
```
Default sort column in the dashboard (descending).

### Perf 1W
```
Perf 1W = (currentClose - openOfSameBarOneWeekAgo) / abs(openOfSameBarOneWeekAgo) × 100
```
"One week ago bar" = same weekday, prior week. e.g. if today is Tuesday, use last Tuesday's daily open.

### Vol 1M (Volatility)
Based on TradingView Pine Script logic:
```
For each bar in the last 30 calendar days:
    barVol = (high - low) / abs(low) × 100

Vol 1M = sum(barVol / numBars)   over all bars in 30 calendar days
```
Measures average intraday range as a percentage — not annualised standard deviation.

### Volume × Price (Dollar Volume)
```
DollarVolume = volume × close
```

### Relative Volume
```
RelVolume = today_volume / avg_volume_30d
```

### AUM
Sourced from `yf.Ticker(ticker).info["totalAssets"]`.

### Fund Flow 1M
Net creation/redemption flows over the past 30 days. Provided manually in `universe.csv`. Optional — displayed only when present.

---

## 6. Screening Filters

All three filters must pass for an ETF to appear in the output:

| Filter | Condition |
|---|---|
| Perf 1W | > 10% |
| Vol 1M | > 2% |
| AUM | > $10,000,000 |

Filtering is applied in Python before writing to Excel. The dashboard shows only pre-filtered results.

---

## 7. Excel Output (`etf_momentum.xlsx`)

- **Single sheet** named `ETF_Momentum`
- One row per ETF that passes all filters
- All 3 batches merged into one sheet
- Includes a `LastUpdated` timestamp cell (top of sheet)
- Columns (in order):

```
Ticker | Name | Change% | Perf1W | Vol1M | DollarVolume | RelVolume |
AUM | AssetClass | Leverage | WeightScheme | [FundFlow1M]
```

`FundFlow1M` column included only if present in source CSV.

---

## 8. GitHub Actions Workflows

### 8.1 `split_batches.yml` — Manual / Ad Hoc

**Trigger:** `workflow_dispatch` (manual button in GitHub UI)

**Steps:**
1. Checkout repo
2. Set up Python
3. Run `split_batches.py` with `universe.csv` as input
4. Commit and push `data/batch1.json`, `data/batch2.json`, `data/batch3.json`

**Purpose:** Run once whenever you update `universe.csv` with new tickers.

---

### 8.2 `fetch_batch1.yml` — Daily at 21:00 UTC

**Trigger:** `cron: '0 21 * * 1-5'` (weekdays only)

**Steps:**
1. Checkout repo
2. Set up Python + install `yfinance`, `openpyxl`, `pandas`
3. Run `fetch_etf_data.py --batch 1`
4. Commit and push updated `data/etf_momentum.xlsx`

---

### 8.3 `fetch_batch2.yml` — Daily at 21:15 UTC

**Trigger:** `cron: '15 21 * * 1-5'`

Same steps as above with `--batch 2`. Merges into existing Excel file.

---

### 8.4 `fetch_batch3.yml` — Daily at 21:30 UTC

**Trigger:** `cron: '30 21 * * 1-5'`

Same steps as above with `--batch 3`. Merges into existing Excel file.

---

## 9. User Stories

---

### EPIC 1 — Universe Management

**Story 1.1 — Split Universe into Batches**
> As a user, I want to run a one-time script that splits my `universe.csv` into three equal batches stored as JSON files, so that the daily fetch jobs can process them in parallel without hitting Yahoo Finance rate limits.

**Acceptance Criteria:**
- `split_batches.py` reads `universe.csv` from repo root
- Splits tickers into 3 roughly equal groups
- Outputs `data/batch1.json`, `data/batch2.json`, `data/batch3.json`
- Each JSON contains array of objects: `{ticker, name, assetClass, leverage, weightScheme, fundFlow1M?}`
- Script is triggerable via GitHub Actions `workflow_dispatch`
- If `FundFlow1M` column absent from CSV, field is omitted from JSON

---

**Story 1.2 — Update Universe**
> As a user, I want to update `universe.csv` and re-run the split workflow via GitHub UI, so that new tickers are included in the next daily fetch without any code changes.

**Acceptance Criteria:**
- Pushing a new `universe.csv` and triggering `split_batches.yml` overwrites the batch JSONs
- Next scheduled fetch picks up the new batches automatically

---

### EPIC 2 — Daily Data Pipeline

**Story 2.1 — Fetch Batch and Compute Metrics**
> As a system, I want to fetch OHLCV data from Yahoo Finance for each batch of ETFs, compute all momentum metrics, apply screening filters, and write results to Excel, so that the dashboard always has fresh end-of-day data.

**Acceptance Criteria:**
- `fetch_etf_data.py --batch N` reads `data/batchN.json`
- Downloads sufficient history (minimum 35 calendar days) via `yfinance`
- Computes: Change%, Perf1W, Vol1M, DollarVolume, RelVolume, AUM
- Applies filters: Perf1W > 10%, Vol1M > 2%, AUM > $10M
- Merges results with existing batches in `etf_momentum.xlsx` (upserts by Ticker)
- Writes `LastUpdated` timestamp to Excel
- Commits and pushes Excel back to repo

---

**Story 2.2 — Staggered Batch Scheduling**
> As a user, I want Batch 1 to run at 21:00 UTC, Batch 2 at 21:15, and Batch 3 at 21:30, so that Yahoo Finance API calls are spread out and rate limit errors are avoided.

**Acceptance Criteria:**
- Three separate workflow files with correct cron schedules
- Each workflow independently commits its portion of results
- All three merge into a single `etf_momentum.xlsx` sheet

---

**Story 2.3 — Handle Missing or Delisted Tickers Gracefully**
> As a system, I want failed ticker fetches to be logged and skipped without crashing the entire batch, so that one bad ticker doesn't block the rest.

**Acceptance Criteria:**
- Try/except per ticker
- Failed tickers logged to stdout with reason
- Batch continues processing remaining tickers
- Summary at end: X succeeded, Y failed

---

### EPIC 3 — React Dashboard

**Story 3.1 — Load Data on Page Load**
> As a user, I want the dashboard to automatically load the latest `etf_momentum.xlsx` from GitHub when I open it, so I always see the most recent screened results without any manual steps.

**Acceptance Criteria:**
- Fetches Excel from GitHub raw URL on mount
- Parses with `xlsx` (SheetJS) library
- Displays a loading spinner while fetching
- Shows `Last Updated: <timestamp>` from Excel

---

**Story 3.2 — Refresh Button**
> As a user, I want a Refresh button that re-fetches the Excel file on demand, so I can manually pull the latest data after a batch run completes.

**Acceptance Criteria:**
- Button visible in toolbar
- Re-fetches and re-parses Excel
- Updates table and timestamp

---

**Story 3.3 — Ranked Momentum Table**
> As a user, I want to see all screened ETFs in a table sorted by Change% descending by default, so the highest momentum ETFs appear at the top.

**Acceptance Criteria:**
- Columns: Ticker, Name, Change%, Perf1W, Vol1M, Dollar Volume, Rel Volume, AUM, Asset Class, Leverage, Weight Scheme, [Fund Flow 1M if present]
- Default sort: Change% descending
- Click any column header to sort ascending/descending
- Sortable and filterable

---

**Story 3.4 — Row Click Detail Drawer**
> As a user, I want to click any row to open a detail drawer showing all fields for that ETF, so I can review the full data without the table becoming too wide.

**Acceptance Criteria:**
- Clicking a row opens a side drawer or modal
- Displays all columns including optional FundFlow1M
- Drawer closeable via X button or clicking outside
- Fund Flow 1M row hidden in drawer if column not present in data

---

**Story 3.5 — Export to CSV**
> As a user, I want to export the currently displayed (filtered/sorted) table to a CSV file, so I can analyse it further in Excel or share it.

**Acceptance Criteria:**
- Export button in toolbar
- Exports exactly what is visible in the table (respects active filters/sort)
- Filename: `etf_momentum_YYYY-MM-DD.csv`

---

**Story 3.6 — Hide Fund Flow Column When Not Present**
> As a user, I want the Fund Flow 1M column to be completely hidden if the source data doesn't include it, so the UI doesn't show empty or broken columns.

**Acceptance Criteria:**
- Dashboard detects presence/absence of FundFlow1M in parsed Excel
- Column and drawer row conditionally rendered
- No placeholder or "N/A" shown — column simply does not appear

---

## 10. Metrics Summary Table

| Metric | Formula | Filter Threshold |
|---|---|---|
| Change % | `(close - prev_close) / prev_close × 100` | — (sort column) |
| Perf 1W | `(close_today - open_same_weekday_last_week) / abs(open_same_weekday_last_week) × 100` | > 10% |
| Vol 1M | `sum((high - low) / abs(low) × 100 / numBars, 30 cal. days)` | > 2% |
| Dollar Volume | `volume × close` | — |
| Rel Volume | `today_volume / avg_volume_30d` | — |
| AUM | `yf.info["totalAssets"]` | > $10,000,000 |
| Fund Flow 1M | From CSV (optional) | — |

---

## 11. Technology Stack

| Layer | Technology |
|---|---|
| Data fetch | Python 3.11+, `yfinance`, `pandas`, `openpyxl` |
| CI/CD | GitHub Actions |
| Data store | Excel file committed to GitHub repo |
| Frontend | React + SheetJS (xlsx) |
| Hosting | Vercel |
| Styling | Tailwind CSS |

---

## 12. Out of Scope (v1)

- Real-time / intraday data
- User authentication
- Alerts or notifications
- Historical performance tracking
- Backtesting
- Fund Flow scraping from ETF.com / etfdb.com

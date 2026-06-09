# Changelog - ETF Momentum Tracker

All notable changes to this project are documented below. This project follows git commit logs and historical updates.

---

## [Unreleased] - 2026-06-09

### Added
- **Animate History Toggle Button**: Added a toggle button in the card header. Animate Mode is disabled by default, keeping the map exactly as it was originally (synced with global table filters). Clicking "Animate History" reveals the timeline and comparison indicators.
- **Custom Visual Timeline**: Redesigned timeline showing styled tick dots for all available dates and clear date labels underneath so the user knows exactly where intermediate date points reside.
- **Timeline Navigator Knob**: Interactive navigator thumb (custom white-bordered indigo dot) that can be clicked or dragged to snap to any date point.
- **Autoplay Timeline Loop**: Auto-play control that plays through the timeline step-by-step and automatically halts when reaching the latest date. If play is clicked while at the latest date, it restarts playback from the oldest date.
- **Isolated Status Filter**: Segmented pill toggle button in the card header for switching between **Passed Only** and **All Statuses** independently of the main dashboard table.
- **Concentric Size Change Visualizations**: 
  - *Yesterday Larger (Shrunk Today)*: Renders a dashed outer ring (indigo `#a5b4fc`) representing the previous day's larger volume.
  - *Yesterday Smaller (Grew Today)*: Renders a dashed inner ring (translucent white) representing the previous day's smaller volume.
- **Size Change Legend**: Dual-column sub-legend added explaining the concentric dashed line visual cues.
- **Data Caching**: Caching structure (`cacheRef`) inside the component so that sliding back and forth between dates loads data instantly.



---

## [Historical Commits]

### 2026-06-01
- **d7fa6a7** - Update Bubble View
- **d93609d** - Fix github action
- **5487a07** - Fix ticker based bubble
- **4ce442e** - Make panel collapsable
- **a24a4d1** - Ticker based bubble
- **5212c19** - Ticker based bubble
- **b5ee7bc** - Ticker based bubble
- **57db73f** - Add bubble image for iquid ETF
- **a3966ba** - Add sort by dollar volume
- **e622a72** - Introduce historical date selection
- **aced3f1** - Update README.md

### 2026-05-29
- **7cde607** - Update ETF momentum data (Batch 1)
- **c072931** - Update ETF momentum data (Batch 3)
- **8083777** - Update ETF momentum data (Batch 2)
- **d1b50eb** - Update ETF momentum data (Batch 1)

### 2026-05-27
- **e3a19c2** - Update ETF momentum data (Batch 1)

### 2026-05-26
- **9e47919** - Update ETF momentum data (Batch 2)
- **d6eefd2** - Update ETF momentum data (Batch 1)

### 2026-05-25
- **a912e3a** - Update ETF momentum data (Batch 3)
- **0a1c7ce** - Update ETF momentum data (Batch 1)

### 2026-05-23
- **0851cf9** - Update ETF momentum data (Batch 3)
- **2e2fbcc** - Make filters collapsible on mobile and allow ETF Name to wrap for full visibility
- **aaf30d6** - Update ETF momentum data (Batch 2)
- **4880ab9** - Add Vercel deployment link to README
- **0b8a00e** - Change default filter to Passed and update responsive UI skill
- **85478c8** - Compact ETF table styling to fit all columns without scrolling
- **a2f9ffe** - Make ETF table scrollable with sticky headers to ensure horizontal scrollbar is visible
- **c484eff** - Fix desktop toolbar stretching and prevent wrap on large screens
- **828b0e9** - Update batch update schedule
- **0996192** - Update ETF momentum data (Batch 1)
- **c9d8b7f** - Add mobile UI optimization skill file
- **8c9aa06** - Optimize dashboard layout for mobile devices
- **c9af33f** - Update build script for Vercel deployment
- **0e91484** - Add requirements.txt for GitHub Actions cache
- **cdf8821** - Initial commit with data pipeline and React dashboard

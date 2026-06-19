import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, X, Activity, TrendingUp, TrendingDown, Info, DollarSign, Calendar, ChevronDown, ChevronUp, Loader2, Plus, Sparkles, SlidersHorizontal, Check } from 'lucide-react';

export default function ETFHistoryPanel({ etfs = [], availableDates = [], excelUrl }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [loadedHistory, setLoadedHistory] = useState({}); // date -> { ticker -> etfItem }
  const [loadedCount, setLoadedCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [prevEtfs, setPrevEtfs] = useState(null);
  
  // Customization states
  const [sizeMetric, setSizeMetric] = useState('AUM'); // 'AUM' | 'DollarVolume'
  const [colorMetric, setColorMetric] = useState('Change%'); // 'Change%' | 'Perf1W' | 'FundFlow1M'
  const [hoveredBubble, setHoveredBubble] = useState(null); // { x, y, etfData, date, ticker }
  
  const cacheRef = useRef({});
  const dropdownRef = useRef(null);
  
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Chronological list of dates (oldest first)
  const chronologicalDates = useMemo(() => {
    return [...availableDates].reverse();
  }, [availableDates]);

  // Set default selected ETFs (top 20 by dollar volume from active list)
  if (etfs !== prevEtfs) {
    setPrevEtfs(etfs);
    if (etfs.length > 0) {
      const topTickers = [...etfs]
        .filter(e => e.Ticker && e.DollarVolume > 0)
        .sort((a, b) => b.DollarVolume - a.DollarVolume)
        .map(e => e.Ticker)
        .filter((ticker, index, self) => self.indexOf(ticker) === index)
        .slice(0, 20);
      setSelectedTickers(topTickers);
    }
  }

  // Handle click outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to resolve URL for a given date
  const getExcelUrlForDate = (date) => {
    const baseUrl = excelUrl || '/data/etf_momentum.csv';
    if (!date) return baseUrl;
    if (baseUrl.endsWith('etf_momentum.csv')) {
      return baseUrl.replace('etf_momentum.csv', `etf_momentum_${date}.csv`);
    }
    return `/data/etf_momentum_${date}.csv`;
  };

  // Fetch and parse CSV data for a specific date
  const fetchDateData = async (date) => {
    if (cacheRef.current[date]) {
      return cacheRef.current[date];
    }
    
    const url = getExcelUrlForDate(date);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load data for date: ${date}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error(`No sheets found in data file for date: ${date}`);
    }
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { range: 2 });
    
    const mapped = {};
    rawRows.forEach((row) => {
      const ticker = String(row.Ticker || '').trim();
      if (!ticker) return;

      const etfItem = {
        Ticker: ticker,
        Name: String(row.Name || '').trim(),
        'Change%': row['Change%'] !== undefined ? parseFloat(row['Change%']) : 0.0,
        Perf1W: row.Perf1W !== undefined ? parseFloat(row.Perf1W) : 0.0,
        Vol1M: row.Vol1M !== undefined ? parseFloat(row.Vol1M) : 0.0,
        DollarVolume: row.DollarVolume !== undefined ? parseFloat(row.DollarVolume) : 0.0,
        RelVolume: row.RelVolume !== undefined ? parseFloat(row.RelVolume) : 0.0,
        AUM: row.AUM !== undefined ? parseFloat(row.AUM) : 0.0,
        AssetClass: String(row.AssetClass || 'Unknown').trim(),
        Focus: String(row.Focus || '').trim(),
        Leverage: String(row.Leverage || '1x').trim(),
        WeightScheme: String(row.WeightScheme || 'Market Cap').trim(),
        PassedScreen: String(row.PassedScreen || 'No').trim()
      };

      if (row.FundFlow1M !== undefined && row.FundFlow1M !== null && row.FundFlow1M !== '') {
        etfItem.FundFlow1M = parseFloat(row.FundFlow1M);
      }

      mapped[ticker] = etfItem;
    });

    cacheRef.current[date] = mapped;
    return mapped;
  };

  // Background loader: fetch chronological dates sequentially
  useEffect(() => {
    if (chronologicalDates.length === 0) return;

    let isMounted = true;
    
    const loadAllDates = async () => {
      // Fetch dates sequentially to avoid overloading connections
      for (let i = 0; i < chronologicalDates.length; i++) {
        const date = chronologicalDates[i];
        if (loadedHistory[date]) continue; // Already loaded

        try {
          const dateData = await fetchDateData(date);
          if (isMounted) {
            setLoadedHistory(prev => ({
              ...prev,
              [date]: dateData
            }));
            setLoadedCount(c => c + 1);
          }
        } catch (err) {
          console.error(`Failed to load historical data for date ${date}:`, err);
        }
      }
    };

    loadAllDates();

    return () => {
      isMounted = false;
    };
  }, [chronologicalDates]);

  // Dropdown list options
  const dropdownOptions = useMemo(() => {
    if (!etfs || etfs.length === 0) return [];
    
    const query = dropdownSearch.toLowerCase().trim();
    return etfs
      .filter(e => {
        if (!e.Ticker) return false;
        if (!query) return true;
        return e.Ticker.toLowerCase().includes(query) || e.Name.toLowerCase().includes(query);
      })
      .slice(0, 100); // limit dropdown to top 100 matches for performance
  }, [etfs, dropdownSearch]);

  // Handle ticker selection toggle
  const toggleTicker = (ticker) => {
    setSelectedTickers(prev => {
      if (prev.includes(ticker)) {
        return prev.filter(t => t !== ticker);
      } else {
        return [...prev, ticker];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedTickers([]);
  };

  const handleSelectDefaults = () => {
    const topTickers = [...etfs]
      .filter(e => e.Ticker && e.DollarVolume > 0)
      .sort((a, b) => b.DollarVolume - a.DollarVolume)
      .map(e => e.Ticker)
      .filter((ticker, index, self) => self.indexOf(ticker) === index)
      .slice(0, 20);
    setSelectedTickers(topTickers);
  };

  // ----------------------------------------------------
  // GRID LAYOUT MATH & RENDERING DATA
  // ----------------------------------------------------
  const rowHeight = 70;
  const paddingLeft = 110;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 45;

  const minColWidth = 65;
  const minWidthNeeded = paddingLeft + Math.max(0, chronologicalDates.length - 1) * minColWidth + paddingRight;
  const chartWidth = Math.max(minWidthNeeded, containerWidth);
  const colWidth = chronologicalDates.length > 1 
    ? (chartWidth - paddingLeft - paddingRight) / (chronologicalDates.length - 1)
    : 0;

  const chartHeight = paddingTop + Math.max(1, selectedTickers.length) * rowHeight + paddingBottom;

  // Compute maximum sizes in history for selected tickers to scale radii
  const maxValues = useMemo(() => {
    let maxAUM = 10000000; // default 10M min limit
    let maxVol = 1000000;  // default 1M min limit
    let maxFlowAbs = 1000000;

    selectedTickers.forEach(ticker => {
      chronologicalDates.forEach(date => {
        const dateMap = loadedHistory[date];
        const item = dateMap ? dateMap[ticker] : null;
        if (item) {
          if (item.AUM > maxAUM) maxAUM = item.AUM;
          if (item.DollarVolume > maxVol) maxVol = item.DollarVolume;
          if (item.FundFlow1M !== undefined && Math.abs(item.FundFlow1M) > maxFlowAbs) {
            maxFlowAbs = Math.abs(item.FundFlow1M);
          }
        }
      });
    });

    return { maxAUM, maxVol, maxFlowAbs };
  }, [selectedTickers, chronologicalDates, loadedHistory]);

  // Get bubble size (radius)
  const getRadius = (val) => {
    if (!val || val <= 0) return 0;
    const maxVal = sizeMetric === 'AUM' ? maxValues.maxAUM : maxValues.maxVol;
    // Square root scale for area visualization
    const r = Math.sqrt(val / maxVal) * 24;
    return Math.max(4, r); // min radius 4px so it's always hoverable
  };

  // Get bubble color
  const getBubbleColor = (val) => {
    if (val === undefined || val === null) return '#334155'; // neutral slate
    
    // Scale limit depending on metric
    let limit = 3.0; // Daily Change % limit
    if (colorMetric === 'Perf1W') limit = 10.0; // 1W Perf limit
    else if (colorMetric === 'FundFlow1M') limit = maxValues.maxFlowAbs || 100000000; // dynamic fund flow limit

    const ratio = Math.min(Math.abs(val) / limit, 1.0);

    if (val > 0) {
      // Interpolate slate-700 (#334155) to emerald-500 (#10b981)
      const r = Math.round(51 + (16 - 51) * ratio);
      const g = Math.round(65 + (185 - 65) * ratio);
      const b = Math.round(85 + (129 - 85) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (val < 0) {
      // Interpolate slate-700 (#334155) to rose-500 (#f43f5e)
      const r = Math.round(51 + (244 - 51) * ratio);
      const g = Math.round(65 + (63 - 65) * ratio);
      const b = Math.round(85 + (94 - 85) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }

    return '#334155';
  };

  // Tooltip Helper Formats
  const formatCompact = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(2)}%`;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 shadow-2xl border border-slate-800 flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isCollapsed ? '' : 'border-b border-slate-900 pb-5 mb-5'}`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex-shrink-0 mt-0.5 sm:mt-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-1.5 leading-snug">
              Fund Size & Flow History Comparison
              <span className="flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5" /> Timeline
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Compare ETF AUM growth/contraction and net flows over time side-by-side.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3.5 self-end lg:self-auto">
          {/* Progress bar if background loading */}
          {loadedCount < chronologicalDates.length && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-850 rounded-xl text-[11px] text-slate-400">
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>Indexing history: {loadedCount}/{chronologicalDates.length}</span>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${(loadedCount / chronologicalDates.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Configuration Toggles (only when expanded) */}
          {!isCollapsed && (
            <>
              {/* Sizing metric toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 select-none">Size:</span>
                <button
                  onClick={() => setSizeMetric('AUM')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    sizeMetric === 'AUM' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AUM
                </button>
                <button
                  onClick={() => setSizeMetric('DollarVolume')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    sizeMetric === 'DollarVolume' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Vol
                </button>
              </div>

              {/* Coloring metric toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 select-none">Color:</span>
                <button
                  onClick={() => setColorMetric('Change%')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    colorMetric === 'Change%' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1D Chg
                </button>
                <button
                  onClick={() => setColorMetric('Perf1W')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    colorMetric === 'Perf1W' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1W Perf
                </button>
                <button
                  onClick={() => setColorMetric('FundFlow1M')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    colorMetric === 'FundFlow1M' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1M Flow
                </button>
              </div>
            </>
          )}

          {/* Collapse/Expand Panel Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 active:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-slate-600 shadow-md transition-all duration-200 flex-shrink-0 cursor-pointer"
          >
            {isCollapsed ? (
              <>
                Show History
                <ChevronDown className="w-4 h-4 text-indigo-400" />
              </>
            ) : (
              <>
                Hide History
                <ChevronUp className="w-4 h-4 text-indigo-400" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      {!isCollapsed && (
        <div className="flex flex-col gap-5">
          {/* Controls row: Dropdown and Pills */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900/60 shadow-inner">
            {/* Search Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold hover:border-indigo-500/50 hover:text-white transition-all cursor-pointer shadow-sm min-w-[180px]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" /> Add ETFs...
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Dropdown search */}
                  <div className="p-3 border-b border-slate-805 bg-slate-950/40">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search ticker or name..."
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Dropdown scroll list */}
                  <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-slate-850 bg-slate-900/80">
                    {dropdownOptions.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        No matching funds found
                      </div>
                    ) : (
                      dropdownOptions.map(etf => {
                        const isSelected = selectedTickers.includes(etf.Ticker);
                        return (
                          <div
                            key={etf.Ticker}
                            onClick={() => toggleTicker(etf.Ticker)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/40 cursor-pointer transition-colors"
                          >
                            {/* Checkbox */}
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-950'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-slate-200 text-xs">{etf.Ticker}</span>
                                <span className="text-[10px] text-slate-500 font-semibold uppercase">{etf.AssetClass}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{etf.Name}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick selectors & Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectDefaults}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800/80 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800/80 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Selection pills scroll */}
            <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
              {selectedTickers.map(ticker => {
                const details = etfs.find(e => e.Ticker === ticker);
                return (
                  <div
                    key={ticker}
                    className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded-full text-xs font-bold shadow-sm"
                  >
                    <span className="font-mono">{ticker}</span>
                    <button
                      onClick={() => toggleTicker(ticker)}
                      className="p-0.5 rounded-full hover:bg-indigo-500/20 text-indigo-400 hover:text-white transition-colors cursor-pointer"
                      title={`Remove ${ticker}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {selectedTickers.length === 0 && (
                <span className="text-slate-500 text-xs font-semibold pl-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-650" /> Select one or more ETFs from the dropdown to compare their sizes.
                </span>
              )}
            </div>
          </div>

          {/* Bubble Chart Canvas */}
          {selectedTickers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <Calendar className="w-8 h-8 text-slate-700 mb-2" />
              <span>Select funds above to render the historical size timeline.</span>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative w-full bg-slate-950/20 border border-slate-900/60 rounded-xl shadow-inner overflow-x-auto scrollbar-thin"
            >
              <div style={{ width: chartWidth, minWidth: '100%', position: 'relative' }}>
                <svg
                  width={chartWidth}
                  height={chartHeight}
                  className="block select-none font-sans"
                  onMouseLeave={() => setHoveredBubble(null)}
                >
                  {/* Grid column guidelines and Date Labels */}
                  {chronologicalDates.map((date, idx) => {
                    const x = paddingLeft + idx * colWidth;
                    return (
                      <g key={date}>
                        {/* Vertical dashed guideline */}
                        <line
                          x1={x}
                          y1={paddingTop - 10}
                          x2={x}
                          y2={chartHeight - paddingBottom + 10}
                          stroke="#1e293b"
                          strokeWidth={1}
                          strokeDasharray="2,4"
                        />
                        {/* Date column label */}
                        <text
                          x={x}
                          y={chartHeight - paddingBottom + 20}
                          textAnchor="middle"
                          className="fill-slate-500 text-[10px] font-mono font-bold"
                        >
                          {date.substring(5)} {/* show MM-DD format */}
                        </text>
                      </g>
                    );
                  })}

                  {/* Rows for each selected ticker */}
                  {selectedTickers.map((ticker, rIdx) => {
                    const y = paddingTop + rIdx * rowHeight + rowHeight / 2;
                    const details = etfs.find(e => e.Ticker === ticker);
                    
                    return (
                      <g key={ticker}>
                        {/* Row background guide line */}
                        <line
                          x1={paddingLeft - 20}
                          y1={y}
                          x2={chartWidth - paddingRight + 20}
                          y2={y}
                          stroke="#1e293b"
                          strokeWidth={1}
                          strokeDasharray="3,3"
                        />
                        
                        {/* Ticker label on the left */}
                        <text
                          x={20}
                          y={y + 4}
                          className="fill-indigo-400 font-mono font-black text-sm text-left"
                        >
                          {ticker}
                        </text>

                        {/* ETF Name sublabel (shortened) */}
                        <text
                          x={20}
                          y={y + 16}
                          className="fill-slate-500 font-semibold text-[9px]"
                        >
                          {details ? (details.Name.length > 13 ? details.Name.substring(0, 11) + '..' : details.Name) : ''}
                        </text>

                        {/* Bubbles along the timeline columns */}
                        {chronologicalDates.map((date, cIdx) => {
                          const x = paddingLeft + cIdx * colWidth;
                          const dateMap = loadedHistory[date];
                          const item = dateMap ? dateMap[ticker] : null;

                          if (!item) {
                            // Render a small empty gray dot indicating loading / no data
                            return (
                              <circle
                                key={`${ticker}-${date}`}
                                cx={x}
                                cy={y}
                                r={3}
                                fill="#1e293b"
                                stroke="#334155"
                                strokeWidth={1}
                                className="transition-all duration-300"
                                opacity={0.4}
                              />
                            );
                          }

                          const sizeVal = sizeMetric === 'AUM' ? item.AUM : item.DollarVolume;
                          const colorVal = colorMetric === 'Change%' 
                            ? item['Change%'] 
                            : colorMetric === 'Perf1W' 
                              ? item.Perf1W 
                              : item.FundFlow1M;

                          const r = getRadius(sizeVal);
                          const bubbleFill = getBubbleColor(colorVal);

                          return (
                            <g key={`${ticker}-${date}`}>
                              {/* Pulse ring for positive changes */}
                              {r > 10 && colorMetric === 'Change%' && item['Change%'] > 1.5 && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={r + 3}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth={1.5}
                                  className="animate-ping"
                                  opacity={0.15}
                                  style={{ animationDuration: '3s' }}
                                />
                              )}
                              
                              {/* Actual Bubble */}
                              <circle
                                cx={x}
                                cy={y}
                                r={r}
                                fill={bubbleFill}
                                stroke="#1e293b"
                                strokeWidth={1.5}
                                opacity={hoveredBubble?.ticker === ticker && hoveredBubble?.date === date ? 1.0 : 0.85}
                                className="transition-all duration-300 ease-out cursor-pointer hover:stroke-indigo-400 hover:stroke-[2.5]"
                                onMouseEnter={(e) => {
                                  const rect = e.target.getBoundingClientRect();
                                  const containerRect = e.target.ownerSVGElement.parentNode.getBoundingClientRect();
                                  
                                  setHoveredBubble({
                                    x: x,
                                    y: y - r - 8,
                                    etfData: item,
                                    date,
                                    ticker
                                  });
                                }}
                              />
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip inside container */}
                {hoveredBubble && (
                  <div
                    className="absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      left: `${hoveredBubble.x}px`,
                      top: `${hoveredBubble.y}px`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl w-60 text-xs text-slate-200">
                      {/* Date & Ticker Header */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {hoveredBubble.date}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {hoveredBubble.ticker}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="mb-2.5">
                        <div className="font-semibold text-[11px] text-white leading-tight">{hoveredBubble.etfData.Name}</div>
                      </div>

                      {/* Details list */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-450 text-[10px]">Total AUM:</span>
                          <span className="font-mono text-slate-200">{formatCompact(hoveredBubble.etfData.AUM)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-450 text-[10px]">Dollar Vol:</span>
                          <span className="font-mono text-slate-200">{formatCompact(hoveredBubble.etfData.DollarVolume)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-450 text-[10px]">Daily Change:</span>
                          <span className={`font-bold flex items-center gap-0.5 font-mono ${hoveredBubble.etfData['Change%'] > 0 ? 'text-emerald-400' : hoveredBubble.etfData['Change%'] < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {hoveredBubble.etfData['Change%'] > 0 ? '+' : ''}{hoveredBubble.etfData['Change%'].toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-450 text-[10px]">1-Week Perf:</span>
                          <span className={`font-bold flex items-center gap-0.5 font-mono ${hoveredBubble.etfData.Perf1W > 0 ? 'text-emerald-400' : hoveredBubble.etfData.Perf1W < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {hoveredBubble.etfData.Perf1W > 0 ? '+' : ''}{hoveredBubble.etfData.Perf1W.toFixed(2)}%
                          </span>
                        </div>

                        {hoveredBubble.etfData.FundFlow1M !== undefined && (
                          <div className="flex items-center justify-between border-t border-slate-850/60 pt-1.5 mt-1.5">
                            <span className="text-indigo-400 text-[10px] font-bold">1M Fund Flow:</span>
                            <span className={`font-bold font-mono text-[11px] ${hoveredBubble.etfData.FundFlow1M > 0 ? 'text-emerald-400' : hoveredBubble.etfData.FundFlow1M < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {formatCompact(hoveredBubble.etfData.FundFlow1M)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2 px-1 text-[11px] text-slate-400">
            {/* Sizing description */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bubble Size:</span>
              <span>Proportional to fund's <strong>{sizeMetric === 'AUM' ? 'Total Assets Under Management (AUM)' : 'Daily Dollar Volume'}</strong> on that date.</span>
            </div>

            {/* Diverging color scale explanation */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Color:</span>
              <div className="flex items-center gap-1 font-semibold">
                <span className="text-rose-400">Negative Performance</span>
                <div className="w-16 h-2 rounded bg-gradient-to-r from-rose-500 via-slate-700 to-emerald-500" />
                <span className="text-emerald-400">Positive Performance</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

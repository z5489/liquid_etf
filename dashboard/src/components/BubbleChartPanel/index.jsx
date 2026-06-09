import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import BubbleCanvas from './BubbleCanvas';
import Legend from './Legend';
import { useBubbleData } from './useBubbleData';
import { Sparkles, BarChart2, ChevronDown, ChevronUp, Play, Pause, Loader2 } from 'lucide-react';
import './bubbleChart.css';

export default function BubbleChartPanel({ etfs = [], availableDates = [], excelUrl }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const cacheRef = useRef({});

  // 1. Setup chronological list of dates (oldest first for slider)
  const chronologicalDates = useMemo(() => {
    return [...availableDates].reverse();
  }, [availableDates]);

  // 2. States for isolated panel controls
  const [localDate, setLocalDate] = useState('');
  const [localStatus, setLocalStatus] = useState('Passed'); // 'Passed' or 'All'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRawEtfs, setCurrentRawEtfs] = useState([]);
  const [previousRawEtfs, setPreviousRawEtfs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize localDate to latest date when availableDates are loaded
  useEffect(() => {
    if (chronologicalDates.length > 0 && !localDate) {
      setLocalDate(chronologicalDates[chronologicalDates.length - 1]);
    }
  }, [chronologicalDates, localDate]);

  // Helper to resolve URL for a given date
  const getExcelUrlForDate = (date) => {
    const baseUrl = excelUrl || '/data/etf_momentum.csv';
    if (!date) {
      return baseUrl;
    }
    if (baseUrl.endsWith('etf_momentum.csv')) {
      return baseUrl.replace('etf_momentum.csv', `etf_momentum_${date}.csv`);
    }
    return `/data/etf_momentum_${date}.csv`;
  };

  // Helper to load and parse CSV data
  const loadCSVData = async (date) => {
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
    
    return rawRows.map((row) => ({
      Ticker: String(row.Ticker || '').trim(),
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
    }));
  };

  // Helper to fetch data with caching
  const getETFDataForDate = async (date) => {
    if (cacheRef.current[date]) {
      return cacheRef.current[date];
    }
    const data = await loadCSVData(date);
    cacheRef.current[date] = data;
    return data;
  };

  // Fetch current and previous data when localDate changes
  useEffect(() => {
    if (!localDate || chronologicalDates.length === 0) return;

    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentData = await getETFDataForDate(localDate);
        
        // Find previous date
        const idx = chronologicalDates.indexOf(localDate);
        const prevDate = idx > 0 ? chronologicalDates[idx - 1] : null;
        
        let prevData = [];
        if (prevDate) {
          prevData = await getETFDataForDate(prevDate);
        }

        if (!isCancelled) {
          setCurrentRawEtfs(currentData);
          setPreviousRawEtfs(prevData);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setError(`Failed to load concentration map data for date: ${localDate}`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [localDate, chronologicalDates]);

  // 3. Auto-play loop timeline logic
  useEffect(() => {
    if (!isPlaying || chronologicalDates.length <= 1 || isCollapsed) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setLocalDate((prevDate) => {
        const idx = chronologicalDates.indexOf(prevDate);
        if (idx === -1) return chronologicalDates[chronologicalDates.length - 1];
        // Advance: if at the end (newest), wrap around to index 0 (oldest)
        const nextIdx = (idx + 1) % chronologicalDates.length;
        return chronologicalDates[nextIdx];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, chronologicalDates, isCollapsed]);

  // Handle slider manual dragging
  const handleSliderChange = (e) => {
    const idx = parseInt(e.target.value);
    if (chronologicalDates[idx]) {
      setLocalDate(chronologicalDates[idx]);
      setIsPlaying(false); // Pause play when manually dragged
    }
  };

  const sliderIndex = useMemo(() => {
    return chronologicalDates.indexOf(localDate);
  }, [localDate, chronologicalDates]);

  // 4. Filtering current ETFs based on local status toggle
  const filteredCurrentEtfs = useMemo(() => {
    // If historical dates are not loaded/configured, fall back to global prop
    if (chronologicalDates.length === 0) {
      return etfs;
    }
    return currentRawEtfs.filter((etf) => {
      if (localStatus === 'Passed') {
        return etf.PassedScreen === 'Yes';
      }
      return true; // 'All'
    });
  }, [currentRawEtfs, localStatus, etfs, chronologicalDates]);

  // Process D3 bubble data
  const bubbleData = useBubbleData(
    filteredCurrentEtfs,
    chronologicalDates.length > 0 ? previousRawEtfs : []
  );

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 shadow-2xl border border-slate-800 flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Panel Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isCollapsed ? '' : 'border-b border-slate-900 pb-4 mb-4'}`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex-shrink-0 mt-0.5 sm:mt-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-1.5 leading-snug">
              Sector & Holding Concentration Map
              <span className="flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5" /> D3 Visual
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Aggregated dollar volume size concentration. Hover or tap for constituents.
            </p>
          </div>
        </div>

        {/* Header Controls (Toggles & Hide button) */}
        <div className="flex items-center gap-3.5 self-end sm:self-auto flex-wrap">
          {/* Isolated Pass/All Toggle */}
          {chronologicalDates.length > 0 && !isCollapsed && (
            <div className="flex bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setLocalStatus('Passed')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  localStatus === 'Passed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                Passed Only
              </button>
              <button
                onClick={() => setLocalStatus('All')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  localStatus === 'All'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                All Statuses
              </button>
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 active:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-slate-600 shadow-md transition-all duration-200 flex-shrink-0 cursor-pointer"
          >
            {isCollapsed ? (
              <>
                Show Map
                <ChevronDown className="w-4 h-4 text-indigo-400" />
              </>
            ) : (
              <>
                Hide Map
                <ChevronUp className="w-4 h-4 text-indigo-400" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main D3 Canvas & Legend */}
      {!isCollapsed && (
        <div className="transition-all duration-500 ease-in-out opacity-100 mt-2">
          {isLoading ? (
            <div className="h-[560px] flex flex-col items-center justify-center text-slate-400 text-sm gap-3 bg-slate-950/40 rounded-xl border border-slate-900/60 shadow-inner">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="font-semibold tracking-wide animate-pulse">Loading concentration data...</span>
            </div>
          ) : error ? (
            <div className="h-[560px] flex flex-col items-center justify-center text-rose-400 text-sm gap-2 bg-slate-950/40 rounded-xl border border-slate-900/60 p-6 text-center shadow-inner">
              <span className="font-bold">Error Loading Data</span>
              <p className="text-xs text-rose-300/80 max-w-md">{error}</p>
            </div>
          ) : bubbleData.length === 0 ? (
            <div className="h-[560px] flex items-center justify-center text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-slate-900/60 shadow-inner">
              No data available for visualization matching the current filters.
            </div>
          ) : (
            <BubbleCanvas data={bubbleData} />
          )}

          {/* Chronological Date Slider timeline controls */}
          {chronologicalDates.length > 1 && !isLoading && !error && (
            <div className="mt-6 p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl flex items-center gap-4 shadow-inner">
              {/* Play/Pause Button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-750 text-white rounded-xl shadow-md transition-all duration-200 cursor-pointer flex-shrink-0"
                title={isPlaying ? "Pause Auto-play" : "Play Timeline"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Slider timeline */}
              <div className="flex-1 w-full flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>{chronologicalDates[0]}</span>
                  <span className="text-indigo-450 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono text-xs">
                    {localDate}
                  </span>
                  <span>{chronologicalDates[chronologicalDates.length - 1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={chronologicalDates.length - 1}
                  value={sliderIndex >= 0 ? sliderIndex : 0}
                  onChange={handleSliderChange}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <Legend />
        </div>
      )}
    </div>
  );
}

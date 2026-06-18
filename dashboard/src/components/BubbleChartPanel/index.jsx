import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import BubbleCanvas from './BubbleCanvas';
import Legend from './Legend';
import { useBubbleData } from './useBubbleData';
import { Sparkles, BarChart2, ChevronDown, ChevronUp, Play, Pause, Loader2, Activity } from 'lucide-react';
import './bubbleChart.css';

export default function BubbleChartPanel({ etfs = [], availableDates = [], excelUrl }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isAnimateMode, setIsAnimateMode] = useState(false);
  const cacheRef = useRef({});

  // 1. Setup chronological list of dates (oldest first for slider)
  const chronologicalDates = useMemo(() => {
    return [...availableDates].reverse();
  }, [availableDates]);

  // 2. States for isolated panel controls (only active in Animate mode)
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

  // Reset autoplay if we exit animate mode
  useEffect(() => {
    if (!isAnimateMode) {
      setIsPlaying(false);
    }
  }, [isAnimateMode]);

  // Stop playing when we reach the end of the timeline
  useEffect(() => {
    if (isPlaying && localDate === chronologicalDates[chronologicalDates.length - 1]) {
      setIsPlaying(false);
    }
  }, [localDate, chronologicalDates, isPlaying]);

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

  // Fetch current and previous data when localDate changes (only when Animate mode is active)
  useEffect(() => {
    if (!localDate || chronologicalDates.length === 0 || !isAnimateMode) return;

    let isCancelled = false;

    // Determine if we need to show the loading overlay (i.e. data not cached)
    const idx = chronologicalDates.indexOf(localDate);
    const prevDate = idx > 0 ? chronologicalDates[idx - 1] : null;
    const isCurrentCached = !!cacheRef.current[localDate];
    const isPrevCached = !prevDate || !!cacheRef.current[prevDate];
    const needsLoading = !isCurrentCached || !isPrevCached;

    const fetchData = async () => {
      if (needsLoading) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const currentData = await getETFDataForDate(localDate);
        
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
  }, [localDate, chronologicalDates, isAnimateMode]);

  // Auto-play loop timeline logic (only runs when Animate mode is active)
  useEffect(() => {
    if (!isPlaying || chronologicalDates.length <= 1 || isCollapsed || !isAnimateMode) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setLocalDate((prevDate) => {
        const idx = chronologicalDates.indexOf(prevDate);
        if (idx === -1 || idx >= chronologicalDates.length - 1) {
          return prevDate; // Don't advance past the end
        }
        return chronologicalDates[idx + 1];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, chronologicalDates, isCollapsed, isAnimateMode]);

  // Handle play button toggles
  const handlePlayToggle = () => {
    if (!isPlaying) {
      // If we are currently at the latest date, wrap back to the oldest date before playing
      const idx = chronologicalDates.indexOf(localDate);
      if (idx === chronologicalDates.length - 1) {
        setLocalDate(chronologicalDates[0]);
      }
    }
    setIsPlaying(!isPlaying);
  };

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

  // Filtering current ETFs based on local status toggle (only applies in Animate mode)
  const filteredCurrentEtfs = useMemo(() => {
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

  // Process D3 bubble data (Only compute diffs and use historical data in Animate Mode)
  const bubbleData = useBubbleData(
    isAnimateMode ? filteredCurrentEtfs : etfs,
    isAnimateMode && chronologicalDates.length > 0 ? previousRawEtfs : []
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
          {/* Animate Mode Toggle Button */}
          {!isCollapsed && chronologicalDates.length > 0 && (
            <button
              onClick={() => setIsAnimateMode(!isAnimateMode)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
                isAnimateMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-650/30'
                  : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border-slate-700/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Animate History
            </button>
          )}

          {/* Isolated Pass/All Toggle (Only in Animate Mode) */}
          {isAnimateMode && chronologicalDates.length > 0 && !isCollapsed && (
            <div className="flex bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 shadow-inner animate-in fade-in slide-in-from-right-2 duration-200">
              <button
                onClick={() => setLocalStatus('Passed')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  localStatus === 'Passed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-455 hover:text-slate-200'
                }`}
              >
                Passed Only
              </button>
              <button
                onClick={() => setLocalStatus('All')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  localStatus === 'All'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-455 hover:text-slate-200'
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
          <div className="relative">
            {bubbleData.length === 0 && !isLoading ? (
              <div className="h-[560px] flex items-center justify-center text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-slate-900/60 shadow-inner">
                No data available for visualization matching the current filters.
              </div>
            ) : (
              <BubbleCanvas data={bubbleData} />
            )}

            {isLoading && isAnimateMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm gap-3 bg-slate-950/70 rounded-xl border border-slate-900/60 shadow-inner z-20 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="font-semibold tracking-wide animate-pulse">Loading concentration data...</span>
              </div>
            )}

            {error && isAnimateMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 text-sm gap-2 bg-slate-950/90 rounded-xl border border-slate-900/60 p-6 text-center shadow-inner z-20 animate-in fade-in">
                <span className="font-bold">Error Loading Data</span>
                <p className="text-xs text-rose-300/80 max-w-md">{error}</p>
              </div>
            )}
          </div>

          {/* Chronological Date Slider timeline controls (Only in Animate Mode) */}
          {isAnimateMode && chronologicalDates.length > 1 && !isLoading && !error && (
            <div className="mt-6 p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl flex items-center gap-6 shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayToggle}
                className="flex items-center justify-center p-2.5 bg-indigo-650 hover:bg-indigo-550 active:bg-indigo-750 text-white rounded-xl shadow-md transition-all duration-200 cursor-pointer flex-shrink-0"
                title={isPlaying ? "Pause Auto-play" : "Play Timeline"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Slider timeline container */}
              <div className="flex-1 relative h-12 flex items-center">
                {/* Custom Track Background */}
                <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full top-[22px]" />
                
                {/* Active Track Progress */}
                <div 
                  className="absolute left-0 h-1 bg-indigo-500 rounded-full transition-all duration-350 top-[22px]"
                  style={{
                    width: `${(sliderIndex / (chronologicalDates.length - 1)) * 100}%`
                  }}
                />

                {/* Tick Marks & Labels */}
                <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
                  {chronologicalDates.map((date, idx) => {
                    const isSelected = idx === sliderIndex;
                    const isPast = idx < sliderIndex;
                    const pct = (idx / (chronologicalDates.length - 1)) * 100;
                    
                    return (
                      <div 
                        key={date}
                        className="absolute flex flex-col items-center select-none"
                        style={{
                          left: `${pct}%`,
                          transform: 'translateX(-50%)',
                          top: '17px'
                        }}
                      >
                        {/* Dot */}
                        <div 
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                            isSelected 
                              ? 'bg-white border-indigo-500 shadow-md shadow-indigo-500/50 scale-125' 
                              : isPast 
                                ? 'bg-indigo-500 border-indigo-650' 
                                : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                        {/* Label */}
                        <span 
                          className={`text-[10px] font-mono mt-2 transition-colors duration-300 ${
                            isSelected ? 'text-indigo-400 font-extrabold' : 'text-slate-500 font-bold'
                          }`}
                        >
                          {date}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Native range input overlaid on top, track invisible, thumb customized */}
                <input
                  type="range"
                  min="0"
                  max={chronologicalDates.length - 1}
                  value={sliderIndex >= 0 ? sliderIndex : 0}
                  onChange={handleSliderChange}
                  className="absolute left-0 w-full h-8 opacity-0 cursor-pointer z-10"
                />
                
                {/* The visible custom navigator knob */}
                <div 
                  className="absolute w-5 h-5 bg-indigo-500 border-2 border-white rounded-full shadow-lg pointer-events-none transition-all duration-150"
                  style={{
                    left: `${(sliderIndex / (chronologicalDates.length - 1)) * 100}%`,
                    transform: 'translateX(-50%)',
                    top: '14px' // Centered exactly at 24px center line
                  }}
                />
              </div>
            </div>
          )}

          <Legend isAnimateMode={isAnimateMode} />
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Toolbar from './components/Toolbar';
import ETFTable from './components/ETFTable';
import DetailDrawer from './components/DetailDrawer';
import BubbleChartPanel from './components/BubbleChartPanel';
import { Activity, ShieldAlert, Sparkles, Clock } from 'lucide-react';

export default function App() {
  const [etfs, setEtfs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetClass, setSelectedAssetClass] = useState('All');
  const [selectedLeverage, setSelectedLeverage] = useState('All');
  const [selectedFocus, setSelectedFocus] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Passed');
  const [sortColumn, setSortColumn] = useState('DollarVolume'); // default sort
  const [sortDirection, setSortDirection] = useState('desc'); // default direction

  // Selected ETF for drawer
  const [selectedETF, setSelectedETF] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  // Read config from env or default to raw github content or local mock
  // During local testing, we can serve it from '/data/etf_momentum.csv'
  const excelUrl = import.meta.env.VITE_EXCEL_URL || '/data/etf_momentum.csv';

  const currentExcelUrl = useMemo(() => {
    if (!selectedDate) {
      return excelUrl;
    }
    if (excelUrl.endsWith('etf_momentum.csv')) {
      return excelUrl.replace('etf_momentum.csv', `etf_momentum_${selectedDate}.csv`);
    }
    return `/data/etf_momentum_${selectedDate}.csv`;
  }, [selectedDate, excelUrl]);

  const loadAvailableDates = async () => {
    try {
      let datesUrl = '/data/available_dates.json';
      if (excelUrl.endsWith('etf_momentum.csv')) {
        datesUrl = excelUrl.replace('etf_momentum.csv', 'available_dates.json');
      }
      const response = await fetch(datesUrl, { cache: 'no-store' });
      if (response.ok) {
        const dates = await response.json();
        if (Array.isArray(dates) && dates.length > 0) {
          setAvailableDates(dates);
          setSelectedDate(dates[0]); // Default to the most recent date (last business day)
        }
      }
    } catch (err) {
      console.warn('Could not load available dates list:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(currentExcelUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(
          `Could not download the Excel sheet (Status: ${response.status}). ` +
          `Make sure the pipeline has run and the file exists at ${currentExcelUrl}.`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No sheets found in the data file.');
      }

      const worksheet = workbook.Sheets[sheetName];

      // Parse LastUpdated from cell A1
      const cellA1 = worksheet['A1']?.v || '';
      let parsedTimestamp = null;
      if (cellA1 && typeof cellA1 === 'string' && cellA1.startsWith('Last Updated: ')) {
        parsedTimestamp = cellA1.replace('Last Updated: ', '');
      } else {
        parsedTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      }
      setLastUpdated(parsedTimestamp);

      // Parse rows starting from Row 3 (index 2)
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { range: 2 });

      // Format rows and ensure correct data types
      const formatted = rawRows.map((row) => {
        const etfItem = {
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
        };

        if (row.FundFlow1M !== undefined && row.FundFlow1M !== null && row.FundFlow1M !== '') {
          etfItem.FundFlow1M = parseFloat(row.FundFlow1M);
        }

        return etfItem;
      });

      setEtfs(formatted);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while parsing the dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentExcelUrl]);

  // Determine dynamic options for filters based on dataset
  const assetClasses = useMemo(() => {
    const classes = etfs.map((e) => e.AssetClass).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [etfs]);

  const leverageOptions = useMemo(() => {
    const leverages = etfs.map((e) => e.Leverage).filter(Boolean);
    return [...new Set(leverages)].sort();
  }, [etfs]);

  const focusOptions = useMemo(() => {
    const focuses = etfs.map((e) => e.Focus).filter(Boolean);
    return [...new Set(focuses)].sort();
  }, [etfs]);

  // Check if FundFlow1M is present in any row in the current dataset
  const hasFundFlow = useMemo(() => {
    return etfs.some((e) => e.FundFlow1M !== undefined);
  }, [etfs]);

  // Apply filters
  const filteredETFs = useMemo(() => {
    return etfs.filter((etf) => {
      const matchesSearch =
        etf.Ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        etf.Name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAsset = selectedAssetClass === 'All' || etf.AssetClass === selectedAssetClass;
      const matchesLeverage = selectedLeverage === 'All' || etf.Leverage === selectedLeverage;
      const matchesFocus = selectedFocus === 'All' || etf.Focus === selectedFocus;

      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'Passed' && etf.PassedScreen === 'Yes') ||
        (selectedStatus === 'Failed' && etf.PassedScreen === 'No');

      return matchesSearch && matchesAsset && matchesLeverage && matchesFocus && matchesStatus;
    });
  }, [etfs, searchQuery, selectedAssetClass, selectedLeverage, selectedFocus, selectedStatus]);

  // Apply sort
  const sortedETFs = useMemo(() => {
    const sorted = [...filteredETFs];
    sorted.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredETFs, sortColumn, sortDirection]);

  // Header click sort handler
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc'); // default to descending
    }
  };

  // CSV Export handler
  const handleExport = () => {
    if (sortedETFs.length === 0) return;

    const baseCols = [
      'Ticker', 'Name', 'Change%', 'Perf1W', 'Vol1M', 'DollarVolume',
      'RelVolume', 'AUM', 'AssetClass', 'Focus', 'Leverage', 'WeightScheme', 'PassedScreen'
    ];
    if (hasFundFlow) {
      baseCols.push('FundFlow1M');
    }

    let csvContent = baseCols.join(',') + '\n';

    sortedETFs.forEach((etf) => {
      const row = baseCols.map((col) => {
        let val = etf[col];
        if (val === undefined || val === null) return '';
        if (typeof val === 'string') {
          // Escape quotes and wrap in quotes
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `etf_momentum_${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none z-0" />

      {/* Main Container */}
      <div className="w-full max-w-[1650px] mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  ETF Momentum Tracker
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/25">
                  <Sparkles className="w-3 h-3" /> Live Screen
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 sm:text-sm">
                Daily momentum screening for liquid ETFs.
              </p>
            </div>
          </div>

          {/* Metadata & Date Selection */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {availableDates.length > 0 && (
              <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 transition-all shadow-sm">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Date:</span>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-slate-200 font-bold focus:outline-none cursor-pointer pr-4 appearance-none relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23818cf8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '10px',
                  }}
                >
                  {availableDates.map((date) => (
                    <option key={date} value={date} className="bg-slate-950 text-slate-200">
                      {date}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {lastUpdated && (
              <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-400 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Last Updated: <strong className="text-slate-200">{lastUpdated}</strong>
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 mb-6 flex gap-4 items-start shadow-xl">
            <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-rose-200 font-bold text-sm">Data Loading Error</h3>
              <p className="text-rose-300/80 text-xs mt-1 leading-relaxed">
                {error}
              </p>
              <button
                onClick={loadData}
                className="mt-3 px-3 py-1.5 bg-rose-900/50 hover:bg-rose-900 border border-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Retry Fetching
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-slate-400 text-sm font-medium animate-pulse">
              Parsing momentum spreadsheet data...
            </span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <Toolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedAssetClass={selectedAssetClass}
              setSelectedAssetClass={setSelectedAssetClass}
              selectedLeverage={selectedLeverage}
              setSelectedLeverage={setSelectedLeverage}
              selectedFocus={selectedFocus}
              setSelectedFocus={setSelectedFocus}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              assetClasses={assetClasses}
              leverageOptions={leverageOptions}
              focusOptions={focusOptions}
              onRefresh={loadData}
              onExport={handleExport}
              isRefreshing={isLoading}
            />

            {/* Bubble Chart Concentration Panel */}
            <BubbleChartPanel etfs={sortedETFs} />

            {/* Table */}
            <ETFTable
              data={sortedETFs}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onRowClick={setSelectedETF}
              hasFundFlow={hasFundFlow}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-900 pt-6 text-center text-xs text-slate-500">
          <p>
            ETF Momentum Tracker
          </p>
        </footer>

        {/* Side Details Drawer */}
        <DetailDrawer
          etf={selectedETF}
          onClose={() => setSelectedETF(null)}
          hasFundFlow={hasFundFlow}
        />

      </div>
    </div>
  );
}

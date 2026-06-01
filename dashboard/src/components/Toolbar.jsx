import React, { useState } from 'react';
import { Search, RefreshCw, Download, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function Toolbar({
  searchQuery,
  setSearchQuery,
  selectedAssetClass,
  setSelectedAssetClass,
  selectedLeverage,
  setSelectedLeverage,
  selectedFocus,
  setSelectedFocus,
  selectedStatus,
  setSelectedStatus,
  assetClasses,
  leverageOptions,
  focusOptions,
  onRefresh,
  onExport,
  isRefreshing
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 shadow-xl flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4">
      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 flex-1">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Ticker or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
          
          {/* Mobile Toggle Button */}
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="xl:hidden flex items-center justify-center p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all"
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Dropdowns */}
        <div className={`${isFiltersOpen ? 'flex' : 'hidden'} xl:flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-3`}>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Asset Class Filter */}
          <select
            value={selectedAssetClass}
            onChange={(e) => setSelectedAssetClass(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none pr-9 shadow-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23818cf8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '11px',
            }}
          >
            <option value="All">All Asset Classes</option>
            {assetClasses.map((ac) => (
              <option key={ac} value={ac} className="bg-slate-950 text-slate-200">
                {ac}
              </option>
            ))}
          </select>

          {/* Leverage Filter */}
          <select
            value={selectedLeverage}
            onChange={(e) => setSelectedLeverage(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none pr-9 shadow-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23818cf8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '11px',
            }}
          >
            <option value="All">All Leverages</option>
            {leverageOptions.map((lev) => (
              <option key={lev} value={lev} className="bg-slate-950 text-slate-200">
                {lev}
              </option>
            ))}
          </select>

          {/* Focus Filter */}
          <select
            value={selectedFocus}
            onChange={(e) => setSelectedFocus(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none pr-9 shadow-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23818cf8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '11px',
            }}
          >
            <option value="All">All Focuses</option>
            {focusOptions.map((f) => (
              <option key={f} value={f} className="bg-slate-950 text-slate-200">
                {f}
              </option>
            ))}
          </select>

          {/* Screening Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none pr-9 shadow-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23818cf8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '11px',
            }}
          >
            <option value="All" className="bg-slate-950 text-slate-200">All Statuses</option>
            <option value="Passed" className="bg-slate-950 text-slate-200">Passed</option>
            <option value="Failed" className="bg-slate-950 text-slate-200">No Match</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-all text-sm font-medium shadow-md cursor-pointer disabled:cursor-not-allowed"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all text-sm shadow-lg shadow-indigo-600/20 cursor-pointer"
          title="Export CSV"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}

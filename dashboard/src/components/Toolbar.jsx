import React from 'react';
import { Search, RefreshCw, Download, SlidersHorizontal } from 'lucide-react';

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
  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 flex-1 max-w-5xl">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Ticker or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold w-full sm:w-auto">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Asset Class Filter */}
          <select
            value={selectedAssetClass}
            onChange={(e) => setSelectedAssetClass(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="All">All Asset Classes</option>
            {assetClasses.map((ac) => (
              <option key={ac} value={ac}>
                {ac}
              </option>
            ))}
          </select>

          {/* Leverage Filter */}
          <select
            value={selectedLeverage}
            onChange={(e) => setSelectedLeverage(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="All">All Leverages</option>
            {leverageOptions.map((lev) => (
              <option key={lev} value={lev}>
                {lev}
              </option>
            ))}
          </select>

          {/* Focus Filter */}
          <select
            value={selectedFocus}
            onChange={(e) => setSelectedFocus(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="All">All Focuses</option>
            {focusOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Screening Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Passed">Passed</option>
            <option value="Failed">No Match</option>
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

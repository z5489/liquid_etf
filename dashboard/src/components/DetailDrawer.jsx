import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, Info } from 'lucide-react';

const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
};

const formatFullCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

const formatMultiplier = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${val.toFixed(2)}x`;
};

export default function DetailDrawer({ etf, onClose, hasFundFlow }) {
  // Close on Escape key press
  useEffect(() => {
    if (!etf) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [etf, onClose]);

  if (!etf) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-350"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-6 z-50 overflow-y-auto flex flex-col justify-between transition-transform duration-350 translate-x-0">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-xl border border-indigo-500/20">
                {etf.Ticker}
              </span>
              <div className="flex flex-col">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">ETF Profile</span>
                <span className="text-slate-300 font-bold text-sm max-w-[200px] truncate" title={etf.Name}>{etf.Name}</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Large Performance Banner */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Daily Change */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-slate-500 text-xs font-medium mb-1">Change Today</span>
              <div className="flex items-center gap-1.5">
                {etf['Change%'] > 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : etf['Change%'] < 0 ? (
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                ) : null}
                <span className={`text-xl font-bold ${
                  etf['Change%'] > 0 ? 'text-emerald-400' : etf['Change%'] < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {formatPercent(etf['Change%'])}
                </span>
              </div>
            </div>

            {/* 1W return */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-slate-500 text-xs font-medium mb-1">Perf 1W</span>
              <div className="flex items-center gap-1.5">
                {etf.Perf1W > 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : etf.Perf1W < 0 ? (
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                ) : null}
                <span className={`text-xl font-bold ${
                  etf.Perf1W > 0 ? 'text-emerald-400' : etf.Perf1W < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {formatPercent(etf.Perf1W)}
                </span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-2">
              Metrics & Analytics
            </h3>

            {/* AUM */}
            <div className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2.5 text-slate-400">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                <span>Assets Under Management (AUM)</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatFullCurrency(etf.AUM)}</span>
            </div>

            {/* Volatility */}
            <div className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Percent className="w-4 h-4 text-indigo-400" />
                <span>Volatility (1M Average)</span>
              </div>
              <span className="font-mono font-bold text-slate-200">
                {etf.Vol1M ? `${etf.Vol1M.toFixed(2)}%` : 'N/A'}
              </span>
            </div>

            {/* Dollar Volume */}
            <div className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2.5 text-slate-400">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Dollar Volume (Today)</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatFullCurrency(etf.DollarVolume)}</span>
            </div>

            {/* Relative Volume */}
            <div className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Relative Volume (30D)</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatMultiplier(etf.RelVolume)}</span>
            </div>

            {/* Screen Status */}
            <div className="flex items-center justify-between text-sm py-1 border-t border-slate-800/40 pt-3">
              <div className="flex items-center gap-2.5 text-slate-400">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Screen Status</span>
              </div>
              {etf.PassedScreen === 'Yes' ? (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
                  Passed All Filters
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs rounded-lg bg-slate-950 text-slate-500 border border-slate-850">
                  No Match
                </span>
              )}
            </div>

            {/* Fund Flow 1M */}
            {hasFundFlow && etf.FundFlow1M !== undefined && etf.FundFlow1M !== null && (
              <div className="flex items-center justify-between text-sm py-1 border-t border-slate-800/40 pt-3">
                <div className="flex items-center gap-2.5 text-slate-400">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Net Fund Flow (1M)</span>
                </div>
                <span className={`font-mono font-bold ${
                  etf.FundFlow1M > 0 ? 'text-emerald-400' : etf.FundFlow1M < 0 ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {formatFullCurrency(etf.FundFlow1M)}
                </span>
              </div>
            )}

            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-2 pt-4">
              Structural Properties
            </h3>

            {/* Asset Class */}
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-400">Asset Class</span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {etf.AssetClass}
              </span>
            </div>

            {/* Focus */}
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-400">Focus</span>
              <span className="text-slate-300 font-medium">{etf.Focus || 'N/A'}</span>
            </div>

            {/* Leverage */}
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-400">Leverage Factor</span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {etf.Leverage}
              </span>
            </div>

            {/* Weighting Scheme */}
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-400">Weighting Scheme</span>
              <span className="text-slate-300 font-medium">{etf.WeightScheme}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-850 pt-5 mt-6 text-center">
          <p className="text-[11px] text-slate-500">
            Source: Yahoo Finance daily price and volume data.
          </p>
        </div>

      </div>
    </div>
  );
}

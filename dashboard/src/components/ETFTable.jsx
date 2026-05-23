import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Formatters
const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
};

const formatCompactCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(val);
};

const formatMultiplier = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${val.toFixed(2)}x`;
};

export default function ETFTable({
  data,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  hasFundFlow
}) {
  const headers = [
    { label: 'Ticker', key: 'Ticker', align: 'left' },
    { label: 'Status', key: 'PassedScreen', align: 'center' },
    { label: 'Name', key: 'Name', align: 'left' },
    { label: 'Change %', key: 'Change%', align: 'right' },
    { label: 'Perf 1W', key: 'Perf1W', align: 'right' },
    { label: 'Vol 1M', key: 'Vol1M', align: 'right' },
    { label: 'Dollar Volume', key: 'DollarVolume', align: 'right' },
    { label: 'Rel Volume', key: 'RelVolume', align: 'right' },
    { label: 'AUM', key: 'AUM', align: 'right' },
    { label: 'Asset Class', key: 'AssetClass', align: 'center' },
    { label: 'Focus', key: 'Focus', align: 'left' },
    { label: 'Leverage', key: 'Leverage', align: 'center' },
    { label: 'Weight Scheme', key: 'WeightScheme', align: 'left' }
  ];

  if (hasFundFlow) {
    headers.push({ label: 'Fund Flow 1M', key: 'FundFlow1M', align: 'right' });
  }

  const renderSortIcon = (colKey) => {
    if (sortColumn !== colKey) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-indigo-400 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-indigo-400 inline" />
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800 h-full flex flex-col">
      <div className="overflow-auto max-h-[70vh]">
        <table className="min-w-[900px] w-full text-left border-collapse table-auto">
          <thead className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm shadow-md">
            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => onSort(h.key)}
                  className={`px-2.5 py-3 cursor-pointer hover:bg-slate-800 hover:text-slate-200 transition-colors select-none whitespace-nowrap ${
                    h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                  } ${h.key === 'Ticker' ? 'sticky left-0 z-40 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]' : ''}`}
                >
                  <span className="inline-flex items-center">
                    {h.label}
                    {renderSortIcon(h.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center text-slate-500 text-sm">
                  No ETFs pass the screen filters at this moment.
                </td>
              </tr>
            ) : (
              data.map((etf, idx) => (
                <tr
                  key={etf.Ticker}
                  onClick={() => onRowClick(etf)}
                  className="hover:bg-slate-800/30 cursor-pointer transition-all duration-150 border-b border-slate-900 group"
                >
                  {/* Ticker */}
                  <td className="px-2.5 py-3 text-left font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors text-sm whitespace-nowrap sticky left-0 z-10 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] group-hover:bg-slate-800/50">
                    {etf.Ticker}
                  </td>

                  {/* Screen Status */}
                  <td className="px-2.5 py-3 text-center whitespace-nowrap">
                    {etf.PassedScreen === 'Yes' ? (
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
                        Passed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-900/60 text-slate-500 border border-slate-800/85">
                        No Match
                      </span>
                    )}
                  </td>
                  
                  {/* Name */}
                  <td className="px-2.5 py-3 text-left text-slate-300 font-medium max-w-[160px] lg:max-w-[200px] truncate text-sm whitespace-nowrap" title={etf.Name}>
                    {etf.Name}
                  </td>

                  {/* Change % */}
                  <td className={`px-2.5 py-3 text-right font-semibold text-sm whitespace-nowrap ${
                    etf['Change%'] > 0 ? 'text-emerald-400' : etf['Change%'] < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {formatPercent(etf['Change%'])}
                  </td>

                  {/* Perf 1W */}
                  <td className={`px-2.5 py-3 text-right font-semibold text-sm whitespace-nowrap ${
                    etf.Perf1W > 0 ? 'text-emerald-400' : etf.Perf1W < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {formatPercent(etf.Perf1W)}
                  </td>

                  {/* Vol 1M */}
                  <td className="px-2.5 py-3 text-right text-slate-200 font-mono text-sm whitespace-nowrap">
                    {etf.Vol1M ? `${etf.Vol1M.toFixed(2)}%` : 'N/A'}
                  </td>

                  {/* Dollar Volume */}
                  <td className="px-2.5 py-3 text-right text-slate-300 font-mono text-sm whitespace-nowrap">
                    {formatCompactCurrency(etf.DollarVolume)}
                  </td>

                  {/* Rel Volume */}
                  <td className="px-2.5 py-3 text-right text-slate-200 font-mono text-sm whitespace-nowrap">
                    {formatMultiplier(etf.RelVolume)}
                  </td>

                  {/* AUM */}
                  <td className="px-2.5 py-3 text-right text-slate-300 font-mono text-sm whitespace-nowrap">
                    {formatCompactCurrency(etf.AUM)}
                  </td>

                  {/* Asset Class */}
                  <td className="px-2.5 py-3 text-center whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {etf.AssetClass}
                    </span>
                  </td>

                  {/* Focus */}
                  <td className="px-2.5 py-3 text-left text-slate-300 text-sm whitespace-nowrap max-w-[140px] truncate" title={etf.Focus || 'N/A'}>
                    {etf.Focus || 'N/A'}
                  </td>

                  {/* Leverage */}
                  <td className="px-2.5 py-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${
                      etf.Leverage === '1x' || etf.Leverage === 'Non-leveraged'
                        ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                        : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
                    }`}>
                      {etf.Leverage}
                    </span>
                  </td>

                  {/* Weight Scheme */}
                  <td className="px-2.5 py-3 text-left text-slate-400 text-sm whitespace-nowrap max-w-[120px] truncate" title={etf.WeightScheme}>
                    {etf.WeightScheme}
                  </td>

                  {/* Fund Flow 1M */}
                  {hasFundFlow && (
                    <td className={`px-2.5 py-3 text-right font-mono text-sm whitespace-nowrap ${
                      etf.FundFlow1M > 0 ? 'text-emerald-400' : etf.FundFlow1M < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {formatCompactCurrency(etf.FundFlow1M)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

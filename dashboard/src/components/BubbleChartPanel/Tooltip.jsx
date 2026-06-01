import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Database } from 'lucide-react';

export default function Tooltip({ node, pos }) {
  if (!node) return null;

  const isPositive = node.changePct > 0;
  
  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-75"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl w-64 text-xs text-slate-200">
        {/* Category Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            {node.category}
          </span>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Database className="w-2.5 h-2.5" />
            {node.etfsCount} {node.etfsCount === 1 ? 'ETF' : 'ETFs'}
          </span>
        </div>

        {/* Title */}
        <div className="font-bold text-sm text-white mb-1.5">{node.keyword}</div>

        {/* Stats */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Volume:</span>
            <span className="font-semibold text-slate-100 flex items-center gap-0.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              {node.dollarVolume >= 1e9 
                ? `${(node.dollarVolume / 1e9).toFixed(2)}B` 
                : `${(node.dollarVolume / 1e6).toFixed(1)}M`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Weighted Change:</span>
            <span className={`font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{node.changePct.toFixed(2)}%
            </span>
          </div>

          {/* Constituents list */}
          <div className="border-t border-slate-800/80 pt-2 mt-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Constituents:</div>
            <div className="flex flex-wrap gap-1 text-[10px] text-slate-300 max-h-16 overflow-y-auto font-mono scrollbar-thin">
              {node.tickers.join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';

export default function Tooltip({ node, pos }) {
  if (!node) return null;

  const isPositive = node.changePct > 0;
  
  // Extract unique short tickers for list
  const contributingTickers = node.etfsList 
    ? [...new Set(node.etfsList.map(item => item.split(' ')[0]))]
    : [];

  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-75"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: pos.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl w-64 text-xs text-slate-200">
        {/* Category Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            {node.category}
          </span>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Briefcase className="w-2.5 h-2.5 text-indigo-400" />
            {node.keyword}
          </span>
        </div>

        {/* Ticker & Name */}
        <div className="mb-2">
          <div className="font-mono font-black text-indigo-400 text-sm">{node.ticker}</div>
          <div className="font-semibold text-[11px] text-white leading-tight mt-0.5">{node.name}</div>
        </div>

        {/* Stats */}
        <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Dollar Volume:</span>
            <span className="font-semibold text-slate-100 flex items-center gap-0.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              {node.dollarVolume >= 1e9 
                ? `${(node.dollarVolume / 1e9).toFixed(2)}B` 
                : `${(node.dollarVolume / 1e6).toFixed(1)}M`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Price Change:</span>
            <span className={`font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{node.changePct.toFixed(2)}%
            </span>
          </div>

          {node.aum > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">Total AUM:</span>
              <span className="font-semibold text-slate-200">
                {node.aum >= 1e9 
                  ? `$${(node.aum / 1e9).toFixed(2)}B` 
                  : `$${(node.aum / 1e6).toFixed(1)}M`}
              </span>
            </div>
          )}

          {/* Contributing ETFs */}
          {contributingTickers.length > 0 && (
            <div className="border-t border-slate-800/60 pt-2 mt-2">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Contributing ETFs:
              </div>
              <div className="text-[10px] text-slate-300 font-mono flex flex-wrap gap-1 leading-snug">
                {contributingTickers.join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

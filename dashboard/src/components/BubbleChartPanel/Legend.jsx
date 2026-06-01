import React from 'react';

export default function Legend() {
  return (
    <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-slate-900/60">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
        Average Price Change (%)
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-rose-400 font-semibold">-3% or lower</span>
        <div 
          className="w-48 h-2 rounded-full shadow-inner border border-slate-800"
          style={{
            background: 'linear-gradient(to right, #f43f5e, #334155, #10b981)'
          }}
        />
        <span className="text-xs text-emerald-400 font-semibold">+3% or higher</span>
      </div>
    </div>
  );
}

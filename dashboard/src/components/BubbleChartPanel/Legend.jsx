import React from 'react';

export default function Legend() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-4 pt-4 border-t border-slate-900/60 px-2">
      {/* Average Price Change */}
      <div className="flex flex-col items-center md:items-start gap-1.5 flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Average Price Change (%)
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-rose-400 font-semibold">-3% or lower</span>
          <div 
            className="w-36 h-2 rounded-full shadow-inner border border-slate-800"
            style={{
              background: 'linear-gradient(to right, #f43f5e, #334155, #10b981)'
            }}
          />
          <span className="text-[11px] text-emerald-400 font-semibold">+3% or higher</span>
        </div>
      </div>

      {/* Size Change vs Prior Date */}
      <div className="flex flex-col items-center md:items-end gap-1.5 flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Volume Change vs. Previous Date
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-5 text-[11px] text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" className="overflow-visible flex-shrink-0">
              <circle cx="10" cy="10" r="6" fill="#334155" stroke="#1e293b" strokeWidth="1" />
              <circle cx="10" cy="10" r="9" fill="none" stroke="#a5b4fc" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
            <span>Yesterday Larger (Shrunk)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="20" height="20" className="overflow-visible flex-shrink-0">
              <circle cx="10" cy="10" r="9" fill="#334155" stroke="#1e293b" strokeWidth="1" />
              <circle cx="10" cy="10" r="5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
            <span>Yesterday Smaller (Grew)</span>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import BubbleCanvas from './BubbleCanvas';
import Legend from './Legend';
import { useBubbleData } from './useBubbleData';
import { Sparkles, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import './bubbleChart.css';

export default function BubbleChartPanel({ etfs }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const bubbleData = useBubbleData(etfs);

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 shadow-2xl border border-slate-800 flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Panel Header */}
      <div className={`flex items-center justify-between ${isCollapsed ? '' : 'border-b border-slate-900 pb-4 mb-4'}`}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              Sector & Holding Concentration Map
              <span className="flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5" /> D3 Visual
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Aggregated dollar volume size concentration. Hover for constituents.
            </p>
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 active:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-slate-600 shadow-md transition-all duration-200"
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

      {/* Main D3 Canvas & Legend */}
      {!isCollapsed && (
        <div className="transition-all duration-500 ease-in-out opacity-100 mt-2">
          {bubbleData.length === 0 ? (
            <div className="h-[560px] flex items-center justify-center text-slate-500 text-sm">
              No data available for visualization matching the current filters.
            </div>
          ) : (
            <BubbleCanvas data={bubbleData} />
          )}
          <Legend />
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { tickerToKeyword, keywordToCategory, defaultCategory } from './categories.config';

export function useBubbleData(etfs) {
  return useMemo(() => {
    if (!etfs || etfs.length === 0) return [];

    const nodes = etfs.map((etf) => {
      const ticker = etf.Ticker;
      const vol = etf.DollarVolume || 0;
      const change = etf['Change%'] || 0;

      // Determine keyword (human-readable label/focus)
      let keyword = tickerToKeyword[ticker];
      if (!keyword) {
        if (etf.Focus && etf.Focus !== 'Unknown' && etf.Focus !== 'Total market') {
          keyword = etf.Focus;
        } else {
          keyword = etf.AssetClass || 'Other';
        }
      }

      // Determine Category
      let category = keywordToCategory[keyword];
      if (!category) {
        category = keywordToCategory[etf.Focus] || keywordToCategory[etf.AssetClass] || defaultCategory;
      }

      return {
        id: ticker,
        ticker: ticker,
        name: etf.Name,
        keyword: keyword,
        category: category,
        dollarVolume: vol,
        changePct: change,
        aum: etf.AUM || 0,
      };
    });

    // Filter to valid volume nodes, sort descending, and slice to top 45
    const validNodes = nodes.filter(n => n.dollarVolume > 0);
    validNodes.sort((a, b) => b.dollarVolume - a.dollarVolume);
    return validNodes.slice(0, 45);
  }, [etfs]);
}

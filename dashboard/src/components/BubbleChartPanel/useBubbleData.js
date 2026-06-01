import { useMemo } from 'react';
import { tickerToKeyword, keywordToCategory, defaultCategory } from './categories.config';

export function useBubbleData(etfs) {
  return useMemo(() => {
    if (!etfs || etfs.length === 0) return [];

    const groups = {};

    etfs.forEach((etf) => {
      const ticker = etf.Ticker;
      const vol = etf.DollarVolume || 0;
      const change = etf['Change%'] || 0;

      // Determine keyword
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
        // Fallback checks on Focus and AssetClass
        category = keywordToCategory[etf.Focus] || keywordToCategory[etf.AssetClass] || defaultCategory;
      }

      if (!groups[keyword]) {
        groups[keyword] = {
          id: keyword,
          keyword,
          category,
          dollarVolume: 0,
          weightedChangeSum: 0,
          tickers: [],
          etfsCount: 0,
          aumSum: 0,
        };
      }

      const g = groups[keyword];
      g.dollarVolume += vol;
      g.weightedChangeSum += change * vol;
      g.tickers.push(ticker);
      g.etfsCount += 1;
      g.aumSum += etf.AUM || 0;
    });

    // Compute final aggregated data
    const nodes = Object.values(groups).map((g) => {
      const changePct = g.dollarVolume > 0 ? g.weightedChangeSum / g.dollarVolume : 0;
      return {
        id: g.id,
        keyword: g.keyword,
        category: g.category,
        dollarVolume: g.dollarVolume,
        changePct: changePct,
        tickers: [...new Set(g.tickers)],
        etfsCount: g.etfsCount,
        aum: g.aumSum,
      };
    });

    // Sort by dollarVolume descending and take top 45 keywords for visualization sanity
    nodes.sort((a, b) => b.dollarVolume - a.dollarVolume);
    return nodes.slice(0, 45);
  }, [etfs]);
}

import { useMemo } from 'react';
import { tickerToKeyword, keywordToCategory, defaultCategory } from './categories.config';

function getUnderlyingTicker(etf) {
  const name = etf.Name || '';
  const ticker = etf.Ticker;

  // 1. Check for explicit company names first (case-insensitive)
  const nameUpper = name.toUpperCase();
  if (nameUpper.includes('NVIDIA')) return 'NVDA';
  if (nameUpper.includes('TESLA')) return 'TSLA';
  if (nameUpper.includes('MICROSOFT')) return 'MSFT';
  if (nameUpper.includes('GOOGLE')) return 'GOOGL';
  if (nameUpper.includes('AMAZON')) return 'AMZN';
  if (nameUpper.includes('APPLE')) return 'AAPL';
  if (nameUpper.includes('MICRON')) return 'MU';

  // 2. Extract all consecutive capital letter words of length 2 to 5
  // We match words that are entirely uppercase A-Z
  const matches = name.match(/\b[A-Z]{2,5}\b/g) || [];
  
  // Set of uppercase words to exclude
  const excludeWords = new Set([
    'ETF', 'ETFS', 'USD', 'USA', 'US', 'SHS', 'INC', 'PLC', 'LTD', 'CAD', 'GBP', 'EUR', 'JPY',
    'S&P', 'MSCI', 'NYSE', 'AMEX', 'CBOE', 'PHLX', 'SOX', 'FTSE', 'TSX', 'CLO', 'MBS', 'AUM',
    'TIPS', 'REIT', 'FCF', 'ESG', 'MLP', 'BULL', 'BEAR', 'LONG', 'DAILY', 'YIELD', 'CORE',
    'BOND', 'FUND', 'PORT', 'INDEX', 'CLASS', 'VALUE', 'SHORT', 'INV', 'ACTIVE', 'INCOME',
    'INTL', 'SELECT', 'GROWTH', 'TOTAL', 'MARKET', 'SPDR', 'ISHARES', 'VANECK', 'INVESCO',
    'GLOBAL', 'SERIES', 'TRUST', 'CORP', 'CO', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'X'
  ]);

  // Find the first word that is not in the exclude list
  for (const word of matches) {
    if (!excludeWords.has(word)) {
      return word;
    }
  }

  // Fallback to ETF ticker itself
  return ticker;
}

const blacklistFocus = new Set(['Large cap', 'Total market', 'Mid cap', 'Small cap', 'Investment grade']);
const blacklistTickers = new Set([
  'SPY', 'IVV', 'VOO', 'QQQ', 'VTI', 'VXUS', 'VEA', 'IEFA', 'BND', 'AGG', 
  'VWO', 'IWM', 'EFA', 'EEM', 'DIA', 'EAFE', 'TLT', 'BIL', 'SGOV'
]);

export function useBubbleData(etfs) {
  return useMemo(() => {
    if (!etfs || etfs.length === 0) return [];

    const groups = {};

    etfs.forEach((etf) => {
      // 1. Skip broad market indices that drown out single tickers
      const focus = etf.Focus || '';
      const ticker = etf.Ticker || '';
      if (blacklistFocus.has(focus) || blacklistTickers.has(ticker)) {
        return;
      }

      const vol = etf.DollarVolume || 0;
      if (vol <= 0) return;

      const change = etf['Change%'] || 0;
      
      // Determine underlying ticker
      const targetTicker = getUnderlyingTicker(etf);

      // Determine keyword (human-readable sector or focus)
      let keyword = tickerToKeyword[targetTicker] || tickerToKeyword[etf.Ticker];
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

      if (!groups[targetTicker]) {
        groups[targetTicker] = {
          id: targetTicker,
          ticker: targetTicker,
          keyword: keyword,
          category: category,
          dollarVolume: 0,
          weightedChangeSum: 0,
          aumSum: 0,
          etfsList: [],
          largestEtfName: etf.Name,
          largestEtfVol: 0,
        };
      }

      const g = groups[targetTicker];
      g.dollarVolume += vol;
      g.weightedChangeSum += change * vol;
      g.aumSum += etf.AUM || 0;
      g.etfsList.push(`${etf.Ticker} (${etf.Name})`);
      
      if (vol > g.largestEtfVol) {
        g.largestEtfVol = vol;
        g.largestEtfName = etf.Name;
      }
    });

    // Compute final aggregated data
    const nodes = Object.values(groups).map((g) => {
      const changePct = g.dollarVolume > 0 ? g.weightedChangeSum / g.dollarVolume : 0;
      return {
        id: g.id,
        ticker: g.ticker,
        keyword: g.keyword,
        category: g.category,
        dollarVolume: g.dollarVolume,
        changePct: changePct,
        aum: g.aumSum,
        name: g.largestEtfName, // Use name of largest ETF in the group
        etfsList: g.etfsList,
      };
    });

    // Sort by dollarVolume descending and take top 45/50 tickers
    nodes.sort((a, b) => b.dollarVolume - a.dollarVolume);
    return nodes.slice(0, 45);
  }, [etfs]);
}

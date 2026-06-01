// Keyword-to-Category and Coordinate Centroid configuration for the Bubble Chart

export const tickerToKeyword = {
  // Underlying stocks
  'MU': 'Micron Technology',
  'NVDA': 'NVIDIA',
  'AMD': 'AMD',
  'AAPL': 'Apple',
  'MSFT': 'Microsoft',
  'AMZN': 'Amazon',
  'BABA': 'Alibaba',
  'TSLA': 'Tesla',
  'META': 'Meta',
  'GOOGL': 'Google',
  'GOOG': 'Google',
  'NFLX': 'Netflix',
  'CORZ': 'Core Scientific',
  'PANW': 'Palo Alto Networks',
  'ACHR': 'Archer Aviation',
  'TSM': 'Taiwan Semiconductor',
  'USAR': 'USAR',
  'UUUU': 'Energy Fuels',
  'PLTR': 'Palantir Technologies',
  'MRVL': 'Marvell Technology',
  'RDW': 'Redwire',
  'RGTI': 'Rigetti Computing',
  'IONQ': 'IonQ',
  'NOW': 'ServiceNow',
  'COIN': 'Coinbase',
  'MSTR': 'MicroStrategy',
  'LUNR': 'Intuitive Machines',
  'AVGO': 'Broadcom',
  'QCOM': 'Qualcomm',
  'INTC': 'Intel',
  'ORCL': 'Oracle',
  'CRM': 'Salesforce',
  'CSCO': 'Cisco',
  'ASML': 'ASML',
  'ARM': 'Arm Holdings',

  // Semiconductors
  'SMH': 'Semiconductors',
  'SOXX': 'Semiconductors',
  'SOXS': 'Semiconductors',
  'SOXL': 'Semiconductors',
  'AAOX': 'Semiconductors',
  
  // Technology
  'QQQ': 'Tech',
  'XLK': 'Tech',
  'TECL': 'Tech',
  
  // Energy & Utilities
  'XLE': 'Energy',
  'OIH': 'Energy',
  'XLU': 'Utilities',
  'ACES': 'Clean Energy',
  
  // Financials
  'XLF': 'Financials',
  'KRE': 'Regional Banks',
  
  // Commodities
  'GLD': 'Gold',
  'IAU': 'Gold',
  'SLV': 'Silver',
  'USO': 'Crude Oil',
  'UNG': 'Natural Gas',
  
  // Fixed Income / Bonds
  'TLT': 'Long-term Bonds',
  'BND': 'Total Bond Market',
  'AGG': 'Total Bond Market',
  'HYG': 'High Yield Bonds',
  'JNK': 'High Yield Bonds',
  'LQD': 'Investment Grade Bonds',
  'MINT': 'Short-term Bonds',
  'BIL': 'T-Bills',
  
  // Real Estate
  'XLRE': 'Real Estate',
  'VNQ': 'Real Estate',
};

export const keywordToCategory = {
  // Technology
  'Micron Technology': 'Technology',
  'Semiconductors': 'Technology',
  'Tech': 'Technology',
  'AMD': 'Technology',
  'NVIDIA': 'Technology',
  'Core Scientific': 'Technology',
  'Palo Alto Networks': 'Technology',
  'Taiwan Semiconductor': 'Technology',
  'Palantir Technologies': 'Technology',
  'Marvell Technology': 'Technology',
  'ServiceNow': 'Technology',
  'Rigetti Computing': 'Technology',
  'IonQ': 'Technology',
  'Broadcom': 'Technology',
  'Qualcomm': 'Technology',
  'Intel': 'Technology',
  'Oracle': 'Technology',
  'Salesforce': 'Technology',
  'Cisco': 'Technology',
  'ASML': 'Technology',
  'Arm Holdings': 'Technology',
  'Apple': 'Technology',
  'Microsoft': 'Technology',
  'Google': 'Technology',
  'Meta': 'Technology',
  'Netflix': 'Technology',
  'Information technology': 'Technology',
  
  // Financials & Macro
  'Financials': 'Financials & Macro',
  'Regional Banks': 'Financials & Macro',
  'Gold': 'Financials & Macro',
  'Silver': 'Financials & Macro',
  'Crude Oil': 'Financials & Macro',
  'Natural Gas': 'Financials & Macro',
  'Long-term Bonds': 'Financials & Macro',
  'Total Bond Market': 'Financials & Macro',
  'High Yield Bonds': 'Financials & Macro',
  'Investment Grade Bonds': 'Financials & Macro',
  'Short-term Bonds': 'Financials & Macro',
  'T-Bills': 'Financials & Macro',
  'Commodities': 'Financials & Macro',
  'Fixed income': 'Financials & Macro',
  'Currency': 'Financials & Macro',
  'Coinbase': 'Financials & Macro',
  'MicroStrategy': 'Financials & Macro',

  // Energy & Industrials
  'Energy': 'Energy & Industrials',
  'Utilities': 'Energy & Industrials',
  'Clean Energy': 'Energy & Industrials',
  'Real Estate': 'Energy & Industrials',
  'Industrials': 'Energy & Industrials',
  'Materials': 'Energy & Industrials',
  'Archer Aviation': 'Energy & Industrials',
  'Energy Fuels': 'Energy & Industrials',
  'Intuitive Machines': 'Energy & Industrials',
  
  // Consumer & Others
  'Amazon': 'Consumer & Others',
  'Alibaba': 'Consumer & Others',
  'Tesla': 'Consumer & Others',
  'Consumer discretionary': 'Consumer & Others',
  'Consumer staples': 'Consumer & Others',
  'Consumer': 'Consumer & Others',
  'Health care': 'Consumer & Others',
  'Healthcare': 'Consumer & Others',
};

// Quadrants assignment (for width=960, height=560)
export const categoryCentroids = {
  'Technology': { x: 240, y: 150, label: 'Technology', color: 'border-indigo-500/20 text-indigo-400' },
  'Financials & Macro': { x: 720, y: 150, label: 'Financials & Macro', color: 'border-purple-500/20 text-purple-400' },
  'Energy & Industrials': { x: 240, y: 410, label: 'Energy & Industrials', color: 'border-emerald-500/20 text-emerald-400' },
  'Consumer & Others': { x: 720, y: 410, label: 'Consumer & Others', color: 'border-amber-500/20 text-amber-400' }
};

export const defaultCategory = 'Consumer & Others';

import pandas as pd
import re

df = pd.read_csv('data/etf_momentum.csv', skiprows=2)

exclude_words = {
    'ETF', 'ETFS', 'USD', 'USA', 'US', 'SHS', 'INC', 'PLC', 'LTD', 'CAD', 'GBP', 'EUR', 'JPY',
    'S&P', 'MSCI', 'NYSE', 'AMEX', 'CBOE', 'PHLX', 'SOX', 'FTSE', 'TSX', 'CLO', 'MBS', 'AUM',
    'TIPS', 'REIT', 'FCF', 'ESG', 'MLP', 'BULL', 'BEAR', 'LONG', 'DAILY', 'YIELD', 'CORE',
    'BOND', 'FUND', 'PORT', 'INDEX', 'CLASS', 'VALUE', 'SHORT', 'INV', 'ACTIVE', 'INCOME',
    'INTL', 'SELECT', 'GROWTH', 'TOTAL', 'MARKET', 'SPDR', 'ISHARES', 'VANECK', 'INVESCO',
    'GLOBAL', 'SERIES', 'TRUST', 'CORP', 'CO', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'X',
    'WEEKLY', 'MONTHLY', 'ANNUAL', 'ULTRA', 'PRO', 'PROSHARES', 'DIREXION', 'YIELDMAX', 'ROUNDHILL',
    'GRANITESHARES', 'DEFIANCE', 'TRADR', 'LEVERAGE', 'SHARES', 'REPT', 'ASSET', 'CAPITAL',
    'STRATEGY', 'STRATEGIES', 'INVERSE', 'TARGET', 'OPTION', 'PREMIUM', 'MAX', 'PLUS', 'DRX',
    'PHYSICAL', 'TRUST', 'MINI', 'GOLD', 'SILVER', 'BITCOIN', 'ETHEREUM', 'MANAGED',
    'FUNDS', 'TREASURY', 'TREASURIES', 'DEBT', 'CASH', 'BILLS', 'GOVERNMENT', 'INCOME', 'ULTRA-SHORT',
    'STREET', 'STATE', 'FIDELITY', 'BARCLAYS', 'JPMORGAN', 'MS', 'GS', 'UBS', 'HSBC', 'NOMURA',
    'BOCI', 'DBX', 'XTRACKERS', 'SWISSCANTO', 'FONDSLEITUNG', 'ZKB', 'VALOUR', 'COINSHARES',
    '21SHARES', 'GRAYSCALE', 'BITWISE', 'HASHRD', 'VALOUR', 'WISDOMTREE', 'COMMODITY', 'SECURITIES',
    'REX', 'T-REX', 'LP', 'NON', 'CI', 'ETV'
}

company_mappings = {
    'NVIDIA': 'NVDA', 'TESLA': 'TSLA', 'MICROSOFT': 'MSFT', 'GOOGLE': 'GOOGL', 'AMAZON': 'AMZN',
    'APPLE': 'AAPL', 'MICRON': 'MU', 'PALANTIR': 'PLTR', 'MARVELL': 'MRVL', 'SERVICENOW': 'NOW',
    'RIGETTI': 'RGTI', 'IONQ': 'IONQ', 'ARM': 'ARM', 'COINBASE': 'COIN', 'MICROSTRATEGY': 'MSTR',
    'REDWIRE': 'RDW', 'INTUITIVE MACHINES': 'LUNR', 'BROADCOM': 'AVGO', 'QUALCOMM': 'QCOM',
    'INTEL': 'INTC', 'ORACLE': 'ORCL', 'SALESFORCE': 'CRM', 'CISCO': 'CSCO', 'ASML': 'ASML',
    'CORE SCIENTIFIC': 'CORZ', 'PALO ALTO': 'PANW', 'ARCHER AVIATION': 'ACHR', 'TAIWAN SEMI': 'TSM',
    'ENERGY FUELS': 'UUUU', 'SUPER MICRO': 'SMCI', 'CLEAN SPARK': 'CLSK', 'MARATHON DIGITAL': 'MARA',
    'RIOT PLATFORMS': 'RIOT', 'TERADYNE': 'TER', 'ROBLOX': 'RBLX', 'SNOWFLAKE': 'SNOW', 'CROWDSTRIKE': 'CRWD',
    'DELL': 'DELL', 'VERTIV': 'VRT', 'JOBY AVIATION': 'JOBY', 'PLUG POWER': 'PLUG', 'UPSTART': 'UPST',
    'SOUNDHOUND': 'SOUN', 'LUMINAR': 'LAZR', 'RIVIAN': 'RIVN', 'CONKLIN': 'CNKL', 'OKTA': 'OKTA',
    'ALIBABA': 'BABA', 'NETFLIX': 'NFLX', 'META': 'META', 'ARCHER': 'ACHR', 'COINBASE': 'COIN',
    'MICROSTRATEGY': 'MSTR'
}

company_names = {
    # Large Cap Tech
    'NVDA': 'NVIDIA',
    'TSLA': 'Tesla',
    'MSFT': 'Microsoft',
    'GOOGL': 'Google',
    'GOOG': 'Google',
    'AMZN': 'Amazon',
    'AAPL': 'Apple',
    'META': 'Meta',
    'NFLX': 'Netflix',
    'BABA': 'Alibaba',
    'BIDU': 'Baidu',
    
    # Semiconductors & Tech Hardware
    'MU': 'Micron Technology',
    'AMD': 'AMD',
    'AVGO': 'Broadcom',
    'QCOM': 'Qualcomm',
    'INTC': 'Intel',
    'ASML': 'ASML',
    'ARM': 'Arm Holdings',
    'TXN': 'Texas Instruments',
    'LRCX': 'Lam Research',
    'KLAC': 'KLA Corp',
    'AMAT': 'Applied Materials',
    'SMCI': 'Super Micro Computer',
    'DELL': 'Dell Technologies',
    'WDC': 'Western Digital',
    'STX': 'Seagate Technology',
    
    # Software & Cloud tech
    'PLTR': 'Palantir Technologies',
    'NOW': 'ServiceNow',
    'ORCL': 'Oracle',
    'CRM': 'Salesforce',
    'CSCO': 'Cisco',
    'OKTA': 'Okta',
    'ADBE': 'Adobe',
    'SNOW': 'Snowflake',
    'CRWD': 'CrowdStrike',
    'NET': 'Cloudflare',
    'TTD': 'The Trade Desk',
    'U': 'Unity Software',
    'UNX': 'Unity Software',
    
    # AI & Hardware / Space Tech
    'RGTI': 'Rigetti Computing',
    'IONQ': 'IonQ',
    'QBTS': 'D-Wave Quantum',
    'ONDS': 'Ondas Inc.',
    'LITE': 'Lumentum Holdings',
    'AXTI': 'AXT Inc.',
    'CRWV': 'CoreWeave',
    'APLD': 'Applied Digital',
    'APP': 'AppLovin',
    'SOUN': 'SoundHound AI',
    'LAZR': 'Luminar Technologies',
    'RDW': 'Redwire',
    'RKLB': 'Rocket Lab',
    'LUNR': 'Intuitive Machines',
    'JOBY': 'Joby Aviation',
    'AVAV': 'AeroVironment',
    'RCAT': 'Red Cat Holdings',
    
    # Crypto & Blockchain
    'COIN': 'Coinbase',
    'MSTR': 'MicroStrategy',
    'CRCL': 'Circle',
    'IREN': 'Iris Energy',
    'MARA': 'MARA Holdings',
    'RIOT': 'Riot Platforms',
    'CLSK': 'CleanSpark',
    'BMNR': 'Bitmine Immersion',
    'GLXY': 'Galaxy Digital',
    'CIFR': 'Cipher Mining',
    'WULF': 'TeraWulf',
    'HUT': 'Hut 8 Mining',
    
    # Financials & Fintech
    'BRKB': 'Berkshire Hathaway',
    'BRK': 'Berkshire Hathaway',
    'PYPL': 'PayPal',
    'SOFI': 'SoFi Technologies',
    'FUTU': 'Futu Holdings',
    'UPST': 'Upstart Holdings',
    'HOOD': 'Robinhood',
    'AFRM': 'Affirm Holdings',
    'AXP': 'American Express',
    
    # Energy, Industrial & Materials
    'OKLO': 'Oklo Inc.',
    'UUUU': 'Energy Fuels',
    'PLUG': 'Plug Power',
    'BE': 'Bloom Energy',
    'XOM': 'Exxon Mobil',
    'BP': 'BP',
    'PBR': 'Petrobras',
    'VALE': 'Vale SA',
    'FCX': 'Freeport-McMoRan',
    'NEM': 'Newmont Mining',
    'HL': 'Hecla Mining',
    'PAAS': 'Pan American Silver',
    'LAC': 'Lithium Americas',
    'MP': 'MP Materials',
    'LEU': 'Centrus Energy',
    'UEC': 'Uranium Energy',
    'CORZ': 'Core Scientific',
    'ACHR': 'Archer Aviation',
    'TSM': 'Taiwan Semiconductor',
    'USAR': 'USAR',
    'PANW': 'Palo Alto Networks',
    
    # Healthcare & Biotech
    'LLY': 'Eli Lilly',
    'UNH': 'UnitedHealth',
    'MRNA': 'Moderna',
    'HIMS': 'Hims & Hers Health',
    'OSCR': 'Oscar Health',
    
    # Consumer & Others
    'UBER': 'Uber',
    'COST': 'Costco',
    'ABNB': 'Airbnb',
    'CVNA': 'Carvana',
    'DKNG': 'DraftKings',
    'SBUX': 'Starbucks',
    'SHOP': 'Shopify',
    'GME': 'GameStop',
    'RBLX': 'Roblox',
    'PDD': 'Pinduoduo',
    
    # Cryptocurrencies (underlying assets)
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'XRP': 'XRP',
    'DOGE': 'Dogecoin',
    'SUI': 'Sui',
    'AVAX': 'Avalanche',
    'LTC': 'Litecoin',
    'ADA': 'Cardano',
    'LINK': 'Chainlink',
    'BNB': 'Binance Coin',
    
    # Commodities (underlying assets)
    'GLD': 'Gold',
    'SLV': 'Silver',
    'USO': 'Crude Oil',
    'UNG': 'Natural Gas',
    'UGA': 'Gasoline',
    'CPER': 'Copper',
}

single_asset_df = df[df['WeightScheme'] == 'Single asset'].copy()

records = []
for idx, row in single_asset_df.iterrows():
    name = str(row['Name'])
    ticker = str(row['Ticker'])
    name_upper = name.upper()
    
    underlying = None
    # 1. Company mappings
    for comp, tick in company_mappings.items():
        if comp in name_upper:
            underlying = tick
            break
            
    if not underlying:
        # 2. Extract words
        name_clean = re.sub(r'\(.*?\)', '', name)
        name_clean = re.sub(r'\bT-Rex\b', '', name_clean, flags=re.IGNORECASE)
        name_clean = re.sub(r'\bT-REX\b', '', name_clean)
        matches = re.findall(r'\b[A-Z]{2,5}\b', name_clean)
        for word in matches:
            if word not in exclude_words:
                underlying = word
                break
                
    if not underlying:
        underlying = ticker
        
    records.append({
        'Ticker': ticker,
        'Name': name,
        'AssetClass': row['AssetClass'],
        'Focus': row['Focus'],
        'Underlying': underlying,
        'DollarVolume': float(row['DollarVolume']) if pd.notna(row['DollarVolume']) else 0.0,
    })

res_df = pd.DataFrame(records)

underlying_info = {}
for name_grp, group in res_df.groupby('Underlying'):
    comp_name = company_names.get(name_grp)
    if not comp_name:
        # Dynamic cleaning
        names = group['Name'].tolist()
        clean = []
        for n in names:
            # Strip prefixes/suffixes
            n_clean = re.sub(r'\b(Direxion Daily|GraniteShares 2x Long|YieldMax|Yieldmax|Roundhill|Tradr 2X Long|Leverage Shares 2X Long|Defiance Daily Target 2X Long|T-Rex 2X Long|Kurv Yield Premium Strategy|T-Rex 2X Inverse|2x Long|1.75X Long|2X Short|Bear 1X|Bull 2X|Bull 3X|Option Income Strategy|WeeklyPay|Daily Target|YieldBOOST|Yield Shs|YIELD SHS|ETF|ETFS)\b', '', n, flags=re.IGNORECASE)
            n_clean = re.sub(r'\(.*?\)', '', n_clean)
            n_clean = re.sub(r'[\(\)]', '', n_clean)
            n_clean = n_clean.strip(', ').strip()
            if n_clean: clean.append(n_clean)
        best = min(clean, key=len) if clean else name_grp
        comp_name = ' '.join([w.capitalize() for w in best.split()])
    
    # Category Assignment
    category = 'Consumer & Others'
    
    # Financials / Crypto overrides (check this FIRST to resolve miners and MSTR properly!)
    is_fin = False
    if name_grp in [
        'COIN', 'MSTR', 'CRCL', 'BRKB', 'BRK', 'PYPL', 'FUTU', 'UPST', 'GLD', 'SLV', 'IAU', 'IAUM', 'SGOL', 'SIVR', 'AAAU', 
        'ETHA', 'BTC', 'ETH', 'SOL', 'XRP', 'BND', 'AGG', 'TLT', 'BIL', 'DOGE', 'SUI', 'AVAX', 'LTC', 'ADA', 'LINK', 'BNB',
        'MARA', 'RIOT', 'CLSK', 'IREN', 'BMNR', 'GLXY', 'CIFR', 'WULF', 'HUT', 'AGQ', 'ZSL', 'GLL', 'KOLD', 'BOIL', 'UGL',
        'OILK', 'USL', 'USO', 'UNG', 'UGA', 'CPER', 'SCOP', 'PLTM', 'PPLT', 'PALL', 'UPAL', 'UPLT', 'ROYAL', 'FD'
    ]:
        is_fin = True
    else:
        # Check by Focus / AssetClass
        focuses = list(group['Focus'].dropna().unique())
        asset_classes = list(group['AssetClass'].dropna().unique())
        for f in focuses:
            f_upper = f.upper()
            if any(w in f_upper for w in ['FINANCIAL', 'GOLD', 'SILVER', 'BITCOIN', 'ETHEREUM', 'SOLANA', 'CRYPTO', 'BLOCKCHAIN', 'CURRENCY', 'BOND', 'TREASURY', 'DEBT', 'CASH', 'YIELD', 'MACRO', 'BINANCE', 'POLKADOT', 'DOGECOIN', 'STELLAR', 'AVALANCHE', 'SUI', 'HYPERLIQUID']):
                is_fin = True
                break
        for a in asset_classes:
            a_upper = a.upper()
            if any(w in a_upper for w in ['CURRENCY', 'COMMODITIES', 'FIXED INCOME']):
                is_fin = True
                break
                
    if is_fin:
        category = 'Financials & Macro'
    else:
        # Tech overrides
        is_tech = False
        if name_grp in [
            'PLTR', 'MRVL', 'NOW', 'ARM', 'AVGO', 'QCOM', 'INTC', 'ORCL', 'CRM', 'CSCO', 'ASML', 'AMD', 'NVDA', 'MSFT', 'AAPL', 
            'GOOGL', 'GOOG', 'META', 'NFLX', 'SMCI', 'RGTI', 'IONQ', 'QBTS', 'ONDS', 'AXTI', 'LITE', 'CRWV', 'OKTA', 'ADBE', 
            'AMAT', 'BIDU', 'RDDT', 'COHR', 'APLD', 'APP', 'SOUN', 'LAZR', 'PANW'
        ]:
            is_tech = True
        else:
            focuses = list(group['Focus'].dropna().unique())
            for f in focuses:
                f_upper = f.upper()
                if any(w in f_upper for w in ['TECHNOLOGY', 'SEMICONDUCTOR', 'QUANTUM', 'SOFTWARE', 'COMMUNICATION', 'CLOUD', 'TELECOM', 'INTERNET', 'CYBERSECURITY']):
                    is_tech = True
                    break
        if is_tech:
            category = 'Technology'
        else:
            # Energy & Industrials overrides
            is_energy = False
            if name_grp in [
                'XLE', 'OIH', 'XLU', 'XLRE', 'VNQ', 'LUNR', 'RDW', 'JOBY', 'PLUG', 'OKLO', 'UUUU', 'BA', 'XOM', 'RKLB', 
                'BNO', 'BP', 'PBR', 'VALE', 'FCX', 'NEM', 'HL', 'PAAS', 'LAC', 'MP', 'LEU', 'UEC', 'BE', 'ACHR', 'USAR'
            ]:
                is_energy = True
            else:
                focuses = list(group['Focus'].dropna().unique())
                for f in focuses:
                    f_upper = f.upper()
                    if any(w in f_upper for w in ['ENERGY', 'UTILITIES', 'INDUSTRIALS', 'MATERIALS', 'REAL ESTATE', 'URANIUM', 'GASOLINE', 'CRUDE', 'OIL', 'NATURAL GAS', 'CLEAN ENERGY', 'SPACE', 'AEROSPACE', 'BATTERY', 'COPPER', 'PLATINUM', 'PALLADIUM', 'NUCLEAR', 'WIND', 'SOLAR']):
                        is_energy = True
                        break
            if is_energy:
                category = 'Energy & Industrials'
                
    underlying_info[name_grp] = {
        'name': comp_name,
        'category': category
    }

# Write output to scripts/categories_generated.js
with open('scripts/categories_generated.js', 'w', encoding='utf-8') as f_out:
    f_out.write("// Keyword-to-Category and Coordinate Centroid configuration for the Bubble Chart\n\n")
    f_out.write("export const tickerToKeyword = {\n")
    f_out.write("  // Underlying stocks (Extracted from single asset ETFs)\n")
    for tick in sorted(underlying_info.keys()):
        f_out.write(f"  '{tick}': '{underlying_info[tick]['name']}',\n")
    
    f_out.write("\n  // Broad Index / Sector ETFs (Manual mappings)\n")
    f_out.write("  'SMH': 'Semiconductors',\n")
    f_out.write("  'SOXX': 'Semiconductors',\n")
    f_out.write("  'SOXS': 'Semiconductors',\n")
    f_out.write("  'SOXL': 'Semiconductors',\n")
    f_out.write("  'QQQ': 'Tech',\n")
    f_out.write("  'XLK': 'Tech',\n")
    f_out.write("  'TECL': 'Tech',\n")
    f_out.write("  'XLE': 'Energy',\n")
    f_out.write("  'OIH': 'Energy',\n")
    f_out.write("  'XLU': 'Utilities',\n")
    f_out.write("  'ACES': 'Clean Energy',\n")
    f_out.write("  'XLF': 'Financials',\n")
    f_out.write("  'KRE': 'Regional Banks',\n")
    f_out.write("  'GLD': 'Gold',\n")
    f_out.write("  'IAU': 'Gold',\n")
    f_out.write("  'SLV': 'Silver',\n")
    f_out.write("  'USO': 'Crude Oil',\n")
    f_out.write("  'UNG': 'Natural Gas',\n")
    f_out.write("  'TLT': 'Long-term Bonds',\n")
    f_out.write("  'BND': 'Total Bond Market',\n")
    f_out.write("  'AGG': 'Total Bond Market',\n")
    f_out.write("  'HYG': 'High Yield Bonds',\n")
    f_out.write("  'JNK': 'High Yield Bonds',\n")
    f_out.write("  'LQD': 'Investment Grade Bonds',\n")
    f_out.write("  'MINT': 'Short-term Bonds',\n")
    f_out.write("  'BIL': 'T-Bills',\n")
    f_out.write("  'XLRE': 'Real Estate',\n")
    f_out.write("  'VNQ': 'Real Estate',\n")
    f_out.write("};\n\n")
    
    f_out.write("export const keywordToCategory = {\n")
    
    categories_grouped = {}
    for tick, info in underlying_info.items():
        cat = info['category']
        if cat not in categories_grouped:
            categories_grouped[cat] = []
        categories_grouped[cat].append(info['name'])
        
    manual_mappings = {
        'Technology': ['Semiconductors', 'Tech', 'Information technology'],
        'Financials & Macro': ['Financials', 'Regional Banks', 'Gold', 'Silver', 'Crude Oil', 'Natural Gas', 'Long-term Bonds', 'Total Bond Market', 'High Yield Bonds', 'Investment Grade Bonds', 'Short-term Bonds', 'T-Bills', 'Commodities', 'Fixed income', 'Currency'],
        'Energy & Industrials': ['Energy', 'Utilities', 'Clean Energy', 'Real Estate', 'Industrials', 'Materials'],
        'Consumer & Others': ['Consumer discretionary', 'Consumer staples', 'Consumer', 'Health care', 'Healthcare']
    }
    
    for cat, list_names in manual_mappings.items():
        if cat not in categories_grouped:
            categories_grouped[cat] = []
        categories_grouped[cat].extend(list_names)
        
    for cat in sorted(categories_grouped.keys()):
        f_out.write(f"  // --- {cat} ---\n")
        for name in sorted(list(set(categories_grouped[cat]))):
            safe_name = name.replace("'", "\\'")
            f_out.write(f"  '{safe_name}': '{cat}',\n")
            
    f_out.write("};\n\n")
    f_out.write("// Quadrants assignment\n")
    f_out.write("export const categoryCentroids = {\n")
    f_out.write("  'Technology': { x: 240, y: 150, label: 'Technology', color: 'border-indigo-500/20 text-indigo-400' },\n")
    f_out.write("  'Financials & Macro': { x: 720, y: 150, label: 'Financials & Macro', color: 'border-purple-500/20 text-purple-400' },\n")
    f_out.write("  'Energy & Industrials': { x: 240, y: 410, label: 'Energy & Industrials', color: 'border-emerald-500/20 text-emerald-400' },\n")
    f_out.write("  'Consumer & Others': { x: 720, y: 410, label: 'Consumer & Others', color: 'border-amber-500/20 text-amber-400' }\n")
    f_out.write("};\n\n")
    f_out.write("export const defaultCategory = 'Consumer & Others';\n")
print("Done writing to scripts/categories_generated.js")

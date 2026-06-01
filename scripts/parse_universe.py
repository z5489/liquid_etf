import pandas as pd
import re

df = pd.read_csv('universe.csv')

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
    'PHYSICAL', 'TRUST', 'MINI', 'GOLD', 'SILVER', 'BITCOIN', 'ETHEREUM', 'COIN', 'MANAGED',
    'FUNDS', 'TREASURY', 'TREASURIES', 'DEBT', 'CASH', 'BILLS', 'GOVERNMENT', 'INCOME', 'ULTRA-SHORT',
    'STREET', 'STATE', 'FIDELITY', 'BARCLAYS', 'JPMORGAN', 'MS', 'GS', 'UBS', 'HSBC', 'NOMURA',
    'BOCI', 'DBX', 'XTRACKERS', 'SWISSCANTO', 'FONDSLEITUNG', 'ZKB', 'VALOUR', 'COINSHARES',
    '21SHARES', 'GRAYSCALE', 'BITWISE', 'HASHRD', 'VALOUR', 'WISDOMTREE', 'COMMODITY', 'SECURITIES',
    'REX', 'T-REX'
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
    'ALIBABA': 'BABA', 'NETFLIX': 'NFLX', 'META': 'META'
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
        # remove T-Rex specifically
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
    })

res_df = pd.DataFrame(records)
grouped = res_df.groupby('Underlying')

print("Single-asset ETFs groups with size > 1:")
for name_grp, group in sorted(grouped, key=lambda x: len(x[1]), reverse=True):
    if len(group) > 1:
        print(f"\n--- Underlying: {name_grp} (Total ETFs: {len(group)}) ---")
        for idx, row in group.iterrows():
            print(f"  {row['Ticker']}: {row['Name']}")

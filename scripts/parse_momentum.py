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

# We want to check all rows where WeightScheme is "Single asset"
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

# Find all underlyings that don't match standard stock tickers, e.g. let's see what are the top underlyings in res_df:
agg_df = res_df.groupby('Underlying').agg({
    'DollarVolume': 'sum',
    'Ticker': 'count',
    'Name': lambda x: '; '.join(list(x))
}).rename(columns={'Ticker': 'Count'}).reset_index().sort_values(by='DollarVolume', ascending=False)

# Let's inspect all rows where Underlying is 4 letters or less and not in our common lists, to find any missed tickers
print("Top 80 extracted underlyings by volume:")
for idx, row in agg_df.head(80).iterrows():
    print(f"{row['Underlying']} (Volume: {row['DollarVolume']:.2f}, Count: {row['Count']}): {row['Name'][:200]}")

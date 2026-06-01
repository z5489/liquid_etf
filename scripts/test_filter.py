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
    'MICROSTRATEGY': 'MSTR', 'CEREBRAS': 'CBRS', 'BULL DAILY': 'BULL'
}

def get_underlying(row):
    name = str(row['Name'])
    ticker = str(row['Ticker'])
    name_upper = name.upper()
    
    underlying = None
    for comp, tick in company_mappings.items():
        if comp in name_upper:
            underlying = tick
            break
            
    if not underlying:
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
    return underlying

df['Underlying'] = df.apply(get_underlying, axis=1)

# List of broad market blacklisted Focus categories and Ticker blacklists
blacklist_focus = {'Large cap', 'Total market', 'Mid cap', 'Small cap', 'Investment grade'}
blacklist_tickers = {'SPY', 'IVV', 'VOO', 'QQQ', 'VTI', 'VEA', 'IEFA', 'BND', 'AGG', 'VWO', 'IWM', 'EFA', 'EEM', 'DIA', 'EAFE', 'TLT', 'BIL', 'SGOV'}

# Filter the dataframe
filtered_df = df[
    (~df['Focus'].isin(blacklist_focus)) & 
    (~df['Ticker'].isin(blacklist_tickers))
].copy()

# Group by Underlying
records = []
for name_grp, group in filtered_df.groupby('Underlying'):
    vol = group['DollarVolume'].sum()
    if vol <= 0:
        continue
    records.append({
        'Underlying': name_grp,
        'Volume': vol,
        'ETFs': '; '.join(group['Ticker'].tolist()[:3])
    })

res_df = pd.DataFrame(records).sort_values(by='Volume', ascending=False)
print("Top 45 underlyings under 'All' view after filtering out broad market index ETFs:")
print(res_df.head(45).to_string(index=False))

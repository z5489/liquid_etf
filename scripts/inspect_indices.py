import pandas as pd
df = pd.read_csv('data/etf_momentum.csv', skiprows=2)
single_asset_df = df[df['WeightScheme'] == 'Single asset']
for ticker in ['BULG', 'BULX', 'WLDU', 'WXET', 'XNDU', 'XYZ']:
    sub = single_asset_df[single_asset_df['Ticker'].str.contains(ticker, na=False, case=False)]
    print(f"Ticker: {ticker}")
    for idx, row in sub.iterrows():
        print(f"  ETF Ticker: {row['Ticker']}, Name: {row['Name']}, Focus: {row['Focus']}")

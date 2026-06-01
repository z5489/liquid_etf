import pandas as pd
df = pd.read_csv('data/etf_momentum.csv', skiprows=2)
for ticker in ['SOXL', 'QQQ', 'SPY', 'SMH', 'NVDL']:
    sub = df[df['Ticker'] == ticker]
    for idx, row in sub.iterrows():
        print(f"Ticker: {row['Ticker']}, Name: {row['Name']}, WeightScheme: {row['WeightScheme']}, DollarVolume: {row['DollarVolume']:.2f}")

import pandas as pd
df = pd.read_csv('universe.csv')
print(df[df['Ticker'] == 'NBIS'])
print(df[df['Name'].str.contains('NBIS', na=False, case=False)].head())

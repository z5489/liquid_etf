import pandas as pd
df = pd.read_csv('universe.csv')
print(df[df['Ticker'].str.contains('XYZ', na=False, case=False)])
print(df[df['Name'].str.contains('XYZ', na=False, case=False)])

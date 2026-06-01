import pandas as pd
df = pd.read_csv('data/etf_momentum.csv', skiprows=2)

single_asset_df = df[df['WeightScheme'] == 'Single asset'].copy()

# Focus and AssetClass values
print("Unique Focus values for Single Asset ETFs:")
print(single_asset_df['Focus'].value_counts())

print("\nUnique AssetClass values for Single Asset ETFs:")
print(single_asset_df['AssetClass'].value_counts())

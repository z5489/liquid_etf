import csv
import json
import os
import math

def main():
    csv_path = "universe.csv"
    data_dir = "data"
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    # Create data directory if it doesn't exist
    os.makedirs(data_dir, exist_ok=True)

    tickers = []
    has_fund_flow = False

    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Check if FundFlow1M is present in headers
        headers = reader.fieldnames if reader.fieldnames else []
        has_fund_flow = 'FundFlow1M' in headers

        for row in reader:
            ticker_info = {
                "ticker": row.get("Ticker", "").strip(),
                "name": row.get("Name", "").strip(),
                "assetClass": row.get("AssetClass", "").strip(),
                "focus": row.get("Focus", "").strip(),
                "leverage": row.get("Leverage", "").strip(),
                "weightScheme": row.get("WeightScheme", "").strip(),
            }
            if has_fund_flow:
                ff_val = row.get("FundFlow1M")
                if ff_val is not None and ff_val.strip() != "":
                    try:
                        ticker_info["fundFlow1M"] = float(ff_val.strip())
                    except ValueError:
                        ticker_info["fundFlow1M"] = None
                else:
                    ticker_info["fundFlow1M"] = None
            
            tickers.append(ticker_info)

    # Filter out empty tickers
    tickers = [t for t in tickers if t["ticker"]]

    total_tickers = len(tickers)
    print(f"Loaded {total_tickers} tickers from {csv_path}. Has FundFlow1M: {has_fund_flow}")

    # Split into 3 roughly equal groups
    # We want to distribute them as evenly as possible.
    # We can use list slicing:
    batch_size = math.ceil(total_tickers / 3)
    batch1 = tickers[0:batch_size]
    batch2 = tickers[batch_size:batch_size * 2]
    batch3 = tickers[batch_size * 2:]

    batches = [batch1, batch2, batch3]
    for i, batch in enumerate(batches, 1):
        output_path = os.path.join(data_dir, f"batch{i}.json")
        with open(output_path, mode='w', encoding='utf-8') as out_f:
            json.dump(batch, out_f, indent=2)
        print(f"Saved batch {i} to {output_path} with {len(batch)} tickers.")

if __name__ == "__main__":
    main()

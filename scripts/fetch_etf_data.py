import argparse
import json
import os
import datetime
import time
import pandas as pd
import yfinance as yf

def parse_args():
    parser = argparse.ArgumentParser(description="Fetch ETF daily data and compute metrics.")
    parser.add_argument("--batch", type=int, required=True, choices=[1, 2, 3], help="Batch number to process (1, 2, or 3)")
    return parser.parse_args()

def get_perf_1w(df):
    """
    Perf 1W = (currentClose - openOfSameBarOneWeekAgo) / abs(openOfSameBarOneWeekAgo) * 100
    """
    if len(df) < 2:
        return 0.0

    today_dt = df.index[-1]
    # Target date is 7 calendar days ago
    target_dt = today_dt - pd.Timedelta(days=7)
    
    # Find the closest trading day in the index to target_dt
    available_dates = df.index
    closest_dt = min(available_dates, key=lambda d: abs((d - target_dt).total_seconds()))
    
    # Ensure the closest day is within 3 days of target_dt, otherwise fallback
    if abs((closest_dt - target_dt).days) <= 3:
        open_1w_ago = df.loc[closest_dt, 'Open']
    else:
        # Fallback to the bar 5 trading days ago if available
        if len(df) >= 6:
            open_1w_ago = df.iloc[-6]['Open']
        else:
            open_1w_ago = df.iloc[0]['Open']
            
    current_close = df.iloc[-1]['Close']
    
    if open_1w_ago and abs(open_1w_ago) > 0:
        return ((current_close - open_1w_ago) / abs(open_1w_ago)) * 100.0
    return 0.0

def get_vol_1m(df_30d):
    """
    For each bar in the last 30 calendar days:
        barVol = (high - low) / abs(low) * 100
    Vol 1M = sum(barVol / numBars)
    """
    if df_30d.empty:
        return 0.0
    
    bar_vols = []
    for _, row in df_30d.iterrows():
        low = row['Low']
        high = row['High']
        if low and abs(low) > 0:
            bar_vols.append(((high - low) / abs(low)) * 100.0)
        else:
            bar_vols.append(0.0)
            
    if bar_vols:
        return sum(bar_vols) / len(bar_vols)
    return 0.0

def process_ticker(ticker_info):
    ticker = ticker_info["ticker"]
    print(f"Fetching data for {ticker}...")
    
    # Download at least 35 calendar days of data to cover the 30-day and 1-week computations
    # Fetching 60 days of daily data is safer and covers holidays/weekends
    ticker_obj = yf.Ticker(ticker)
    df = ticker_obj.history(period="60d")
    
    if df.empty:
        raise ValueError("No historical price data returned from Yahoo Finance.")
    
    # Make index timezone naive for consistent date comparison
    df.index = pd.to_datetime(df.index).tz_localize(None)
    
    today_dt = df.index[-1]
    
    # 1. Change %
    if len(df) >= 2:
        close_today = df.iloc[-1]['Close']
        close_yesterday = df.iloc[-2]['Close']
        change_pct = ((close_today - close_yesterday) / close_yesterday) * 100.0
    else:
        change_pct = 0.0

    # 2. Perf 1W
    perf_1w = get_perf_1w(df)
    
    # 3. Vol 1M & relative volume
    start_30d = today_dt - pd.Timedelta(days=30)
    df_30d = df[df.index >= start_30d]
    
    vol_1m = get_vol_1m(df_30d)
    
    # 4. Dollar Volume
    close_today = df.iloc[-1]['Close']
    volume_today = df.iloc[-1]['Volume']
    dollar_volume = volume_today * close_today
    
    # 5. Relative Volume
    avg_vol_30d = df_30d['Volume'].mean()
    if avg_vol_30d and avg_vol_30d > 0:
        rel_volume = volume_today / avg_vol_30d
    else:
        rel_volume = 0.0
        
    # 6. AUM
    info = ticker_obj.info
    aum = info.get("totalAssets") or info.get("netAssets") or info.get("total_assets")
    if aum is None:
        print(f"  [WARNING] AUM could not be retrieved for {ticker}.")
        
    # Output record
    record = {
        "Ticker": ticker,
        "Name": ticker_info["name"],
        "Change%": change_pct,
        "Perf1W": perf_1w,
        "Vol1M": vol_1m,
        "DollarVolume": dollar_volume,
        "RelVolume": rel_volume,
        "AUM": aum,
        "AssetClass": ticker_info["assetClass"],
        "Focus": ticker_info.get("focus", ""),
        "Leverage": ticker_info["leverage"],
        "WeightScheme": ticker_info["weightScheme"],
    }
    
    if "fundFlow1M" in ticker_info:
        record["FundFlow1M"] = ticker_info["fundFlow1M"]
        
    return record

def main():
    args = parse_args()
    batch_num = args.batch
    batch_file = f"data/batch{batch_num}.json"
    csv_path = "data/etf_momentum.csv"
    
    if not os.path.exists(batch_file):
        print(f"Error: Batch file {batch_file} not found. Please run split_batches.py first.")
        return
        
    with open(batch_file, 'r', encoding='utf-8') as f:
        batch_tickers = json.load(f)
        
    print(f"Processing Batch {batch_num} containing {len(batch_tickers)} tickers...")
    
    successful_records = []
    succeeded_count = 0
    failed_count = 0
    
    for ticker_info in batch_tickers:
        ticker = ticker_info["ticker"]
        try:
            record = None
            try:
                record = process_ticker(ticker_info)
            except Exception as e:
                err_msg = str(e)
                if "Too Many Requests" in err_msg or "Rate limited" in err_msg or "rate limit" in err_msg.lower():
                    print(f"  [RATE LIMIT] Rate limit hit on {ticker}. Waiting 90 seconds before retrying...")
                    time.sleep(90)
                    record = process_ticker(ticker_info)
                else:
                    raise e

            # Check screening filters: Perf 1W > 10% AND Vol 1M > 2% AND AUM > $10,000,000
            perf_pass = record["Perf1W"] > 10.0
            vol_pass = record["Vol1M"] > 2.0
            aum_pass = record["AUM"] is not None and record["AUM"] > 10000000.0
            passed = perf_pass and vol_pass and aum_pass
            
            record["PassedScreen"] = "Yes" if passed else "No"
            successful_records.append(record)
            
            aum_str = f"${record['AUM']:,}" if record["AUM"] is not None else "N/A"
            if passed:
                print(f"  [PASS] {ticker} passed filters. Perf1W: {record['Perf1W']:.2f}%, Vol1M: {record['Vol1M']:.2f}%, AUM: {aum_str}")
            else:
                print(f"  [FAIL] {ticker} failed filters. Perf1W: {record['Perf1W']:.2f}%, Vol1M: {record['Vol1M']:.2f}%, AUM: {aum_str}")
                
            succeeded_count += 1
        except Exception as e:
            print(f"  [ERROR] Failed to process ticker {ticker}: {str(e)}")
            failed_count += 1
            
    print(f"\nBatch {batch_num} Fetch Summary:")
    print(f"  Succeeded: {succeeded_count}")
    print(f"  Failed: {failed_count}")
    
    # Merge results with existing CSV file
    new_df = pd.DataFrame(successful_records)
    
    # Load all tickers in current batch so we can remove them from the existing CSV file
    current_batch_tickers = {t["ticker"] for t in batch_tickers}
    
    existing_df = None
    has_fund_flow = "FundFlow1M" in batch_tickers[0] if batch_tickers else False
    
    if os.path.exists(csv_path):
        try:
            # Read existing CSV skipping the first two rows (timestamp cell & blank row)
            existing_df = pd.read_csv(csv_path, skiprows=2)
            print(f"Loaded existing CSV with {len(existing_df)} tickers.")
            
            # Filter out any tickers that are in the current batch
            if not existing_df.empty and "Ticker" in existing_df.columns:
                existing_df = existing_df[~existing_df["Ticker"].isin(current_batch_tickers)]
                print(f"Kept {len(existing_df)} tickers from other batches.")
            else:
                existing_df = None
        except Exception as e:
            print(f"Could not load or parse existing CSV file: {str(e)}. Creating new one.")
            existing_df = None
            
    # Combine old data (excluding current batch) and new data (current batch's passed tickers)
    if existing_df is not None and not existing_df.empty:
        if not new_df.empty:
            combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        else:
            combined_df = existing_df
    else:
        combined_df = new_df
        
    # Ensure correct columns order
    base_cols = [
        "Ticker", "Name", "Change%", "Perf1W", "Vol1M", "DollarVolume",
        "RelVolume", "AUM", "AssetClass", "Focus", "Leverage", "WeightScheme", "PassedScreen"
    ]
    if has_fund_flow:
        base_cols.append("FundFlow1M")
        
    if not combined_df.empty:
        # Reorder and keep only existing specified columns
        available_cols = [col for col in base_cols if col in combined_df.columns]
        combined_df = combined_df[available_cols]
    else:
        # Create an empty DataFrame with target columns if everything is empty
        combined_df = pd.DataFrame(columns=base_cols)

    # Sort combined table by Ticker for consistency in file output
    # Note: Dashboard will sort by Change% desc by default, but having sorted file makes diffs clean
    if not combined_df.empty and "Ticker" in combined_df.columns:
        combined_df = combined_df.sort_values(by="Ticker").reset_index(drop=True)
        
    # Write to CSV
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    timestamp_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        f.write(f"Last Updated: {timestamp_str}\n\n")
        combined_df.to_csv(f, index=False)
        
    print(f"Successfully saved {len(combined_df)} total tickers to {csv_path}.")

    # Save historical dated copy (UTC date)
    date_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    historical_path = f"data/etf_momentum_{date_str}.csv"
    with open(historical_path, 'w', newline='', encoding='utf-8') as f:
        f.write(f"Last Updated: {timestamp_str}\n\n")
        combined_df.to_csv(f, index=False)
    print(f"Successfully saved historical copy to {historical_path}.")

    # Update available_dates.json
    import re
    date_pattern = re.compile(r"etf_momentum_(\d{4}-\d{2}-\d{2})\.csv")
    available_dates = []
    
    # Scan the data directory for all date-stamped files
    if os.path.exists("data"):
        for f_name in os.listdir("data"):
            match = date_pattern.match(f_name)
            if match:
                available_dates.append(match.group(1))
                
    # Sort in descending order (latest dates first)
    available_dates.sort(reverse=True)
    
    dates_json_path = "data/available_dates.json"
    with open(dates_json_path, 'w', encoding='utf-8') as f:
        json.dump(available_dates, f, indent=2)
    print(f"Successfully updated {dates_json_path} with {len(available_dates)} dates: {available_dates}")

if __name__ == "__main__":
    main()

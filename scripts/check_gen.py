import re
tickers = ['PLTR', 'MRVL', 'RDW', 'RGTI', 'IONQ', 'NOW', 'ARM']
with open('scripts/categories_generated.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for ticker in tickers:
    found_tick = False
    found_keyword = False
    for line in lines:
        if f"'{ticker}':" in line:
            print(f"Ticker: {line.strip()}")
            found_tick = True
            # Get the company name mapped to the ticker
            match = re.search(r"':\s*'(.*?)'", line)
            if match:
                comp = match.group(1)
                for line2 in lines:
                    if f"'{comp}':" in line2:
                        print(f"  Category: {line2.strip()}")
                        found_keyword = True
                        break
    if not found_tick or not found_keyword:
        print(f"WARNING: Ticker {ticker} not fully mapped!")

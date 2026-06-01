import re
with open('scripts/categories_generated.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_ticker_to_keyword = False
for line in lines:
    if 'tickerToKeyword = {' in line:
        in_ticker_to_keyword = True
        continue
    if in_ticker_to_keyword and '};' in line:
        in_ticker_to_keyword = False
        break
    if in_ticker_to_keyword:
        match = re.search(r"^\s*'([A-Z0-9]+)'\s*:\s*'(.*?)'", line)
        if match:
            ticker = match.group(1)
            name = match.group(2)
            # If name is short (e.g. 2-5 chars), or contains 'Daily', or is equal to ticker capitalized
            if len(name) <= 5 or 'Daily' in name or name.upper() == ticker:
                print(f"Potential unmapped: {ticker} -> {name}")

# Previous Service Filter

Convert the dealer quote CSV export into the streamlined "Previous Service" customer CSV.

## What it does
- Keeps only rows with a first name and at least one phone number.
- Drops trades from model year 2025 or newer (default max year = 2024).
- Drops rows with more than $6,000 in negative equity (TradeEquity < -6000).
- Outputs only the required columns: phone number, customer names, purchase date, year, model, VIN, miles, payoff, and payment.
- Normalizes phone numbers to 11 digits with a leading 1 (e.g., (850) 508-6625 → 18505086625).

## Usage (two options)

### A) Web (Next.js) – for Vercel or local dev
1. Install deps: `npm install`
2. Run locally: `npm run dev` then open the URL shown (usually http://localhost:3000)
3. Upload the quote CSV export. The app applies the same filters and gives you a download link for the cleaned CSV.
4. Deploy to Vercel as a Next.js app (framework preset: Next.js, root `./`).

### B) CLI (Python) – local batch mode
1. Ensure Python 3.9+ is available on your machine.
2. Run the transformer:

   ```bash
   python previous_service_filter.py --input "/path/to/Quote - 01_05_2026 12_44 - Limited+Export.csv" --output "Previous Service Customer.csv"
   ```

3. The output CSV will be written to the path you provide (default is `Previous Service Customer.csv` in the current directory).

## Options
- `--max-year`: Keep vehicles with `TradeYear` less than or equal to this year. Default: 2024.
- `--min-equity`: Drop rows with `TradeEquity` below this value. Default: -6000.
- `--output`: Path for the transformed CSV. Default: `Previous Service Customer.csv`.

## Notes
- The script expects the column names from the provided quote export. If the export format changes, adjust the constants at the top of `previous_service_filter.py`.
- Purchase dates are formatted as `M/D/YY` when possible; unparseable dates are left as-is.
- Only built-in Python modules are used; no extra dependencies are required.
# pervious-service-filter

#!/usr/bin/env python3
"""Transform the dealer quote CSV export into the Previous Service customer list.

Steps performed:
- Keep only customers with a first name.
- Drop trades from model year 2025 or newer (TradeYear >= 2025).
- Drop rows with TradeEquity less than -6000 (more than $6k negative equity).
- Output only the Previous Service columns with cleaned formatting.
"""
from __future__ import annotations

import argparse
import csv
import re
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional

# Column names expected from the quote export. Adjust here if the export changes.
TRADE_YEAR = "TradeYear"
TRADE_MODEL = "TradeModel"
TRADE_VIN = "TradeVIN"
TRADE_MILEAGE = "TradeMileage"
TRADE_PAYOFF = "TradePayoff"
TRADE_EQUITY = "TradeEquity"
TRADE_PAYMENT = "TradeMonthlyPayment"
TRADE_PURCHASE_DATE = "TradePurchaseDate"
CUSTOMER_FIRST = "CustomerFirstName"
CUSTOMER_LAST = "CustomerLastName"
CUSTOMER_NAME = "CustomerName"
PHONE_FIELDS = [
    "CustomerVoicePhone",
    "CustomerTextPhone",
    "CustomerMobilePhone",
    "CustomerHomePhone",
    "CustomerWorkPhone",
]

OUTPUT_HEADERS = [
    "phone_number",
    "Customer",
    "Last Name",
    "Purchase Date",
    "Year",
    "Model",
    "VIN",
    "Miles",
    "Payoff",
    "Payment",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert a quote export CSV into the Previous Service format",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to the quote CSV export (source)",
    )
    parser.add_argument(
        "--output",
        default="Previous Service Customer.csv",
        help="Path for the transformed CSV (default: %(default)s)",
    )
    parser.add_argument(
        "--max-year",
        type=int,
        default=2024,
        help="Keep vehicles with TradeYear <= this year (default: %(default)s)",
    )
    parser.add_argument(
        "--min-equity",
        type=float,
        default=-6000.0,
        help="Discard rows with TradeEquity below this value (default: %(default)s)",
    )
    return parser.parse_args()


def clean_name(value: Optional[str]) -> str:
    if not value:
        return ""
    return value.strip().title()


def parse_currency(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    cleaned = re.sub(r"[^0-9.-]", "", value)
    if cleaned in {"", "-", "."}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def normalize_phone(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    # Use the last 10 digits to ignore country codes and punctuation, then prefix with 1.
    if len(digits) >= 10:
        digits = digits[-10:]
    if len(digits) == 10:
        return "1" + digits
    if len(digits) == 11 and digits.startswith("1"):
        return digits
    return digits


def choose_phone(row: dict) -> Optional[str]:
    for field in PHONE_FIELDS:
        phone = normalize_phone(row.get(field))
        if phone:
            return phone
    return None


def format_year(raw_year: Optional[str]) -> Optional[str]:
    if not raw_year:
        return None
    try:
        year_int = int(raw_year)
    except ValueError:
        return None
    return str(year_int % 100)


def format_purchase_date(raw_date: Optional[str]) -> str:
    if not raw_date:
        return ""
    raw_date = raw_date.strip()
    if not raw_date:
        return ""
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(raw_date, fmt)
            return f"{dt.month}/{dt.day}/{str(dt.year)[-2:]}"
        except ValueError:
            continue
    # If it does not parse, return the raw value stripped.
    return raw_date


def should_keep(row: dict, max_year: int, min_equity: float) -> bool:
    first_name = clean_name(row.get(CUSTOMER_FIRST) or row.get(CUSTOMER_NAME, "").split(" ")[0])
    if not first_name:
        return False

    year_str = row.get(TRADE_YEAR)
    if year_str:
        try:
            if int(year_str) >= max_year + 1:
                return False
        except ValueError:
            pass

    equity = parse_currency(row.get(TRADE_EQUITY))
    if equity is not None and equity < min_equity:
        return False

    phone = choose_phone(row)
    if not phone:
        return False

    return True


def transform_row(row: dict) -> List[str]:
    phone = choose_phone(row) or ""
    first_name = clean_name(row.get(CUSTOMER_FIRST) or row.get(CUSTOMER_NAME, "").split(" ")[0])
    last_name = clean_name(row.get(CUSTOMER_LAST) or "" )
    purchase_date = format_purchase_date(row.get(TRADE_PURCHASE_DATE))
    year = format_year(row.get(TRADE_YEAR)) or ""
    model = (row.get(TRADE_MODEL) or "").strip()
    vin = (row.get(TRADE_VIN) or "").strip()
    miles = (row.get(TRADE_MILEAGE) or "").strip()
    payoff = (row.get(TRADE_PAYOFF) or "").strip()
    payment = (row.get(TRADE_PAYMENT) or "").strip()

    return [
        phone,
        first_name,
        last_name,
        purchase_date,
        year,
        model,
        vin,
        miles,
        payoff,
        payment,
    ]


def read_rows(input_path: Path) -> Iterable[dict]:
    with input_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row


def write_rows(output_path: Path, rows: List[List[str]]) -> None:
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(OUTPUT_HEADERS)
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    input_path = Path(args.input).expanduser()
    output_path = Path(args.output).expanduser()

    filtered_rows: List[List[str]] = []
    for row in read_rows(input_path):
        if not should_keep(row, max_year=args.max_year, min_equity=args.min_equity):
            continue
        filtered_rows.append(transform_row(row))

    write_rows(output_path, filtered_rows)
    print(f"Wrote {len(filtered_rows)} rows to {output_path}")


if __name__ == "__main__":
    main()

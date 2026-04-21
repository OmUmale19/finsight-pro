from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List

import numpy as np
import pandas as pd


CATEGORY_RULES = {
    "Food": ["swiggy", "zomato", "ubereats", "restaurant", "cafe"],
    "Transport": ["uber", "ola", "rapido", "metro", "fuel", "petrol"],
    "Subscriptions": ["netflix", "spotify", "prime", "youtube", "hotstar"],
    "Groceries": ["bigbasket", "blinkit", "zepto", "grofers", "grocery"],
    "Healthcare": ["apollo", "medplus", "pharmacy", "hospital"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio"],
    "Housing": ["rent", "maintenance", "landlord"],
    "Utilities": ["electricity", "water", "wifi", "internet", "broadband"],
    "Income": ["salary", "bonus", "refund", "interest", "cashback"],
}

FIELD_ALIASES = {
    "amount": ["amount", "amt", "value", "transaction_amount"],
    "date": ["date", "transaction_date", "posted_on", "timestamp"],
    "description": ["description", "details", "remarks", "narration"],
    "merchant": ["merchant", "vendor", "payee"],
    "category": ["category", "expense_category"],
    "currency": ["currency", "ccy"],
    "type": ["type", "transaction_type", "dr_cr"],
    "source": ["source"],
}


def load_rows(input_path: str) -> List[Dict[str, Any]]:
    with open(input_path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, list):
        raise ValueError("Input file must contain a JSON array of rows.")

    normalized_rows = []
    for item in payload:
        if isinstance(item, dict):
            normalized_rows.append(item)
        else:
            normalized_rows.append({"value": item})
    return normalized_rows


def resolve_field(row: Dict[str, Any], canonical: str) -> Any:
    for alias in FIELD_ALIASES[canonical]:
        for key, value in row.items():
            if str(key).strip().lower() == alias:
                return value
    return None


def parse_amount(raw_amount: Any) -> float:
    if raw_amount is None:
        return 0.0

    text = str(raw_amount).strip()
    cleaned = re.sub(r"[^\d.\-]", "", text)
    if cleaned in {"", "-", "."}:
        return 0.0
    return float(cleaned)


def normalize_currency(raw_currency: Any, description: str) -> str:
    value = str(raw_currency or "").strip().upper()
    if value in {"INR", "USD", "EUR", "GBP"}:
        return value

    if "₹" in description or "INR" in description.upper():
        return "INR"
    return "INR"


def extract_merchant(description: str, merchant: str) -> str:
    preferred = merchant.strip()
    if preferred:
        return preferred.title()

    if not description:
        return "Unknown Merchant"

    primary = re.split(r"[/|-]", description)[0].strip()
    primary = re.sub(r"\d+", "", primary).strip()
    return primary.title() if primary else "Unknown Merchant"


def normalize_type(amount: float, raw_type: Any, category: str) -> str:
    type_value = str(raw_type or "").strip().upper()
    if type_value in {"CR", "CREDIT"}:
        return "CREDIT"
    if type_value in {"DR", "DEBIT"}:
        return "DEBIT"
    if category == "Income":
        return "CREDIT"
    return "DEBIT" if amount >= 0 else "CREDIT"


def categorize(description: str, merchant: str, category: Any) -> str:
    existing = str(category or "").strip()
    if existing and existing.lower() != "uncategorized":
        return existing.title()

    haystack = f"{description} {merchant}".lower()
    for candidate, matchers in CATEGORY_RULES.items():
        if any(token in haystack for token in matchers):
            return candidate
    return "Uncategorized"


def normalize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    description = str(resolve_field(row, "description") or "").strip()
    merchant = str(resolve_field(row, "merchant") or "").strip()
    amount = parse_amount(resolve_field(row, "amount"))
    category = categorize(description, merchant, resolve_field(row, "category"))
    txn_type = normalize_type(amount, resolve_field(row, "type"), category)
    source = str(resolve_field(row, "source") or "CSV").upper().replace("-", "_")
    parsed_date = pd.to_datetime(resolve_field(row, "date"), errors="coerce")

    return {
        "amount": abs(amount),
        "currency": normalize_currency(resolve_field(row, "currency"), description),
        "date": None if pd.isna(parsed_date) else parsed_date.isoformat(),
        "category": category,
        "merchant": extract_merchant(description, merchant),
        "description": description,
        "type": txn_type,
        "source": source,
        "metadata": {"raw": row},
    }


def clean_rows(rows: Iterable[Dict[str, Any]]) -> pd.DataFrame:
    normalized = [normalize_row(row) for row in rows]
    frame = pd.DataFrame(normalized)

    if frame.empty:
        return frame

    frame = frame.dropna(subset=["date"])
    frame["amount"] = frame["amount"].replace({np.nan: 0.0}).astype(float)
    frame["merchant"] = frame["merchant"].replace("", "Unknown Merchant")
    frame["category"] = frame["category"].replace("", "Uncategorized")
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    frame = frame.dropna(subset=["date"])
    frame["date"] = frame["date"].dt.tz_localize(None)
    frame["description"] = frame["description"].fillna("")
    frame["currency"] = frame["currency"].fillna("INR")
    frame["source"] = frame["source"].fillna("CSV")
    frame = frame.drop_duplicates(subset=["date", "amount", "merchant", "type"], keep="first")
    frame = frame.sort_values("date")
    return frame


def detect_recurring(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        frame["is_recurring"] = False
        return frame

    recurring_keys = set()
    debits = frame.loc[frame["type"] == "DEBIT"].copy()

    grouped = debits.groupby(["merchant", "amount"])
    for key, group in grouped:
        if len(group) < 3:
            continue

        sorted_dates = group["date"].sort_values().tolist()
        intervals = [
            (sorted_dates[index] - sorted_dates[index - 1]).days
            for index in range(1, len(sorted_dates))
        ]

        if not intervals:
            continue

        avg_interval = sum(intervals) / len(intervals)
        if 26 <= avg_interval <= 35 or 6 <= avg_interval <= 8:
            recurring_keys.add(key)

    frame["is_recurring"] = frame.apply(
        lambda row: (row["merchant"], row["amount"]) in recurring_keys, axis=1
    )
    return frame


def build_output(frame: pd.DataFrame) -> List[Dict[str, Any]]:
    frame = detect_recurring(frame)
    records = []
    for _, row in frame.iterrows():
        records.append(
            {
                "amount": round(float(row["amount"]), 2),
                "currency": row["currency"],
                "date": pd.to_datetime(row["date"]).isoformat(),
                "category": row["category"],
                "merchant": row["merchant"],
                "description": row["description"],
                "type": row["type"],
                "source": row["source"],
                "is_recurring": bool(row["is_recurring"]),
                "is_anomaly": False,
                "metadata": row["metadata"],
            }
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize raw financial rows into canonical transactions.")
    parser.add_argument("--input", required=True, help="Path to a JSON file containing raw transactions")
    args = parser.parse_args()

    rows = load_rows(args.input)
    cleaned = clean_rows(rows)
    output = build_output(cleaned)
    json.dump(output, sys.stdout, indent=2)


if __name__ == "__main__":
    main()

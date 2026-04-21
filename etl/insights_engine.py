from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from statistics import mean, pstdev
from typing import Dict, List

import numpy as np
import pandas as pd

from anomaly_detection import detect_anomalies


ESSENTIAL_CATEGORIES = {"Housing", "Groceries", "Transport", "Healthcare", "Utilities", "Insurance"}
NON_ESSENTIAL_CATEGORIES = {"Food", "Shopping", "Entertainment", "Subscriptions", "Travel", "Uncategorized"}


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def build_frame(transactions: List[dict]) -> pd.DataFrame:
    frame = pd.DataFrame(transactions)
    if frame.empty:
        return frame

    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    frame = frame.dropna(subset=["date"])
    frame["amount"] = frame["amount"].astype(float)
    frame["category"] = frame["category"].fillna("Uncategorized")
    frame["merchant"] = frame["merchant"].fillna("Unknown Merchant")
    frame["type"] = frame["type"].fillna("DEBIT")
    return frame


def calculate_financial_health(frame: pd.DataFrame, budget_rows: List[dict]) -> tuple[int, List[str]]:
    if frame.empty:
        return 0, ["Upload transactions to calculate your financial health score."]

    debit = frame.loc[frame["type"] == "DEBIT"]
    credit = frame.loc[frame["type"] == "CREDIT"]
    total_spend = float(debit["amount"].sum())
    total_income = float(credit["amount"].sum())

    savings_rate = 0 if total_income == 0 else max((total_income - total_spend) / total_income, 0)
    essential_total = float(debit.loc[debit["category"].isin(ESSENTIAL_CATEGORIES), "amount"].sum())
    non_essential_total = float(debit.loc[debit["category"].isin(NON_ESSENTIAL_CATEGORIES), "amount"].sum())
    essential_ratio = 0 if total_spend == 0 else essential_total / total_spend
    non_essential_ratio = 0 if total_spend == 0 else non_essential_total / total_spend

    monthly_spend = (
        debit.assign(month=debit["date"].dt.to_period("M").astype(str))
        .groupby("month")["amount"]
        .sum()
        .tolist()
    )
    consistency_score = 0.7
    if len(monthly_spend) > 1 and mean(monthly_spend) > 0:
        coefficient = pstdev(monthly_spend) / mean(monthly_spend)
        consistency_score = max(0.0, 1 - min(coefficient, 1))

    budget_usage = []
    budget_lookup = {row["category"]: float(row["limit"]) for row in budget_rows}
    current_month = debit.loc[debit["date"].dt.to_period("M") == pd.Timestamp.now().to_period("M")]
    category_current_spend = current_month.groupby("category")["amount"].sum().to_dict()
    for category, limit in budget_lookup.items():
        spent = float(category_current_spend.get(category, 0.0))
        budget_usage.append(1.0 if limit == 0 else max(0.0, 1 - min(spent / limit, 1.5)))

    budget_score = mean(budget_usage) if budget_usage else 0.8

    score = (
        savings_rate * 35
        + essential_ratio * 20
        + consistency_score * 20
        + budget_score * 25
        - non_essential_ratio * 12
    )
    score = max(0, min(100, round(score)))

    explanation = [
        f"Savings rate contributes {round(savings_rate * 100)} points of resilience.",
        f"Essential spending accounts for {round(essential_ratio * 100)}% of total outflow.",
        f"Budget adherence and month-to-month consistency keep the score stable.",
    ]
    return score, explanation


def generate_smart_insights(frame: pd.DataFrame) -> List[str]:
    insights = []
    debit = frame.loc[frame["type"] == "DEBIT"].copy()
    if debit.empty:
        return ["No debit transactions found yet, so behavioral insights are limited."]

    debit["is_weekend"] = debit["date"].dt.dayofweek >= 5
    weekend_total = debit.loc[debit["is_weekend"], "amount"].sum()
    weekday_total = debit.loc[~debit["is_weekend"], "amount"].sum()
    weekday_average = weekday_total / max(len(debit.loc[~debit["is_weekend"]]), 1)
    weekend_average = weekend_total / max(len(debit.loc[debit["is_weekend"]]), 1)
    if weekday_average > 0 and weekend_average > weekday_average * 1.25:
        increase = ((weekend_average / weekday_average) - 1) * 100
        insights.append(f"You spend {round(increase)}% more on weekends than weekdays.")

    late_night_food = debit.loc[
        (debit["category"] == "Food") & (debit["date"].dt.hour >= 21), "amount"
    ].sum()
    total_food = debit.loc[debit["category"] == "Food", "amount"].sum()
    if total_food > 0 and late_night_food / total_food >= 0.35:
        insights.append("Food expenses peak after 9 PM, suggesting late-night ordering habits.")

    monthly = debit.assign(month=debit["date"].dt.to_period("M")).groupby("month")["amount"].sum()
    if len(monthly) >= 2 and monthly.iloc[-2] > 0:
        delta = ((monthly.iloc[-1] / monthly.iloc[-2]) - 1) * 100
        if abs(delta) >= 10:
            trend = "increased" if delta > 0 else "decreased"
            insights.append(f"Spending {trend} {abs(round(delta))}% versus last month.")

    if not insights:
        insights.append("Spending patterns are stable, with no sharp behavioral spikes in the latest data.")
    return insights


def detect_recurring_expenses(frame: pd.DataFrame) -> List[dict]:
    debit = frame.loc[frame["type"] == "DEBIT"].copy()
    subscriptions = []

    for (merchant, amount), group in debit.groupby(["merchant", "amount"]):
        if len(group) < 3:
            continue

        ordered = group.sort_values("date")
        intervals = ordered["date"].diff().dropna().dt.days.tolist()
        if not intervals:
            continue

        avg_interval = mean(intervals)
        if 26 <= avg_interval <= 35:
            cadence = "monthly"
        elif 6 <= avg_interval <= 8:
            cadence = "weekly"
        else:
            continue

        subscriptions.append(
            {"merchant": merchant, "amount": round(float(amount), 2), "cadence": cadence}
        )

    return subscriptions


def detect_wasteful_spending(frame: pd.DataFrame, budgets: List[dict]) -> List[str]:
    debit = frame.loc[frame["type"] == "DEBIT"].copy()
    if debit.empty:
        return []

    total_spend = float(debit["amount"].sum())
    non_essential_total = float(debit.loc[debit["category"].isin(NON_ESSENTIAL_CATEGORIES), "amount"].sum())
    signals = []

    if total_spend > 0 and non_essential_total / total_spend >= 0.45:
        signals.append("Non-essential categories account for an elevated share of overall spending.")

    small_tx_count = len(debit.loc[debit["amount"] <= 250])
    if small_tx_count >= max(6, len(debit) * 0.35):
        signals.append("Frequent small-ticket transactions may be eroding monthly savings quietly.")

    budget_lookup = {item["category"]: float(item["limit"]) for item in budgets}
    current_month = debit.loc[debit["date"].dt.to_period("M") == pd.Timestamp.now().to_period("M")]
    category_totals = current_month.groupby("category")["amount"].sum().to_dict()

    for category, limit in budget_lookup.items():
        spent = float(category_totals.get(category, 0.0))
        if limit > 0 and spent > limit:
            signals.append(f"{category} spending exceeded budget by INR {round(spent - limit)}.")

    return signals


def forecast_next_month(frame: pd.DataFrame) -> float:
    debit = frame.loc[frame["type"] == "DEBIT"].copy()
    monthly = debit.assign(month=debit["date"].dt.to_period("M").astype(str)).groupby("month")["amount"].sum()
    values = monthly.tolist()
    if not values:
        return 0.0
    if len(values) == 1:
        return round(float(values[-1]), 2)
    if len(values) == 2:
        return round(float(mean(values)), 2)

    x = np.arange(len(values))
    slope, intercept = np.polyfit(x, values, 1)
    projected = intercept + slope * len(values)
    smoothed = (projected + values[-1] + values[-2]) / 3
    return round(float(max(smoothed, 0.0)), 2)


def classify_persona(score: int, frame: pd.DataFrame) -> str:
    debit = frame.loc[frame["type"] == "DEBIT"]
    total_spend = float(debit["amount"].sum())
    if total_spend == 0:
        return "Balanced"

    non_essential_total = float(debit.loc[debit["category"].isin(NON_ESSENTIAL_CATEGORIES), "amount"].sum())
    ratio = non_essential_total / total_spend

    if score >= 75 and ratio < 0.35:
        return "Saver"
    if score <= 45 or ratio >= 0.5:
        return "Impulse Spender"
    return "Balanced"


def create_recommendations(score: int, waste_signals: List[str], recurring_expenses: List[dict]) -> List[str]:
    recommendations = []
    if score < 60:
        recommendations.append("Shift 10-15% of monthly spending from non-essential categories into savings first.")
    if waste_signals:
        recommendations.append("Review high-frequency discretionary purchases and cap them with category budgets.")
    if recurring_expenses:
        recommendations.append("Audit recurring subscriptions and cancel services you have not used recently.")
    if not recommendations:
        recommendations.append("Current habits are healthy; keep focusing on stable budgets and consistent saving.")
    return recommendations


def build_alerts(waste_signals: List[str], anomalies: List[dict], recurring_expenses: List[dict]) -> List[str]:
    alerts = []
    if anomalies:
        alerts.append(f"{len(anomalies)} unusual transactions detected for review.")
    if waste_signals:
        alerts.extend(waste_signals[:2])
    if recurring_expenses:
        total = sum(item["amount"] for item in recurring_expenses if item["cadence"] == "monthly")
        alerts.append(
            f"{len(recurring_expenses)} recurring expenses detected costing INR {round(total)} per month."
        )
    return alerts[:4]


def build_category_totals(frame: pd.DataFrame) -> Dict[str, float]:
    debit = frame.loc[frame["type"] == "DEBIT"]
    return {
        category: round(float(amount), 2)
        for category, amount in debit.groupby("category")["amount"].sum().to_dict().items()
    }


def build_month_totals(frame: pd.DataFrame) -> List[dict]:
    debit = frame.loc[frame["type"] == "DEBIT"]
    grouped = debit.assign(month=debit["date"].dt.to_period("M").astype(str)).groupby("month")["amount"].sum()
    return [{"month": month, "total": round(float(total), 2)} for month, total in grouped.items()]


def mark_anomalies(transactions: List[dict], anomalies: List[dict]) -> List[dict]:
    anomaly_keys = {
        (item["merchant"], round(float(item["amount"]), 2), str(item["date"])) for item in anomalies
    }
    enriched = []
    for transaction in transactions:
        tx_date = str(pd.to_datetime(transaction["date"]).date())
        key = (transaction["merchant"], round(float(transaction["amount"]), 2), tx_date)
        transaction["is_anomaly"] = key in anomaly_keys
        enriched.append(transaction)
    return enriched


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate analytics insights from normalized transactions.")
    parser.add_argument("--input", required=True, help="Path to canonical transactions JSON")
    parser.add_argument("--budgets", required=True, help="Path to budgets JSON")
    args = parser.parse_args()

    transactions = load_json(args.input)
    budgets = load_json(args.budgets)
    frame = build_frame(transactions)
    anomalies = detect_anomalies(frame)
    transactions = mark_anomalies(transactions, anomalies)
    score, explanation = calculate_financial_health(frame, budgets)
    recurring_expenses = detect_recurring_expenses(frame)
    smart_insights = generate_smart_insights(frame)
    waste_signals = detect_wasteful_spending(frame, budgets)
    forecast = forecast_next_month(frame)
    persona = classify_persona(score, frame)
    recommendations = create_recommendations(score, waste_signals, recurring_expenses)
    alerts = build_alerts(waste_signals, anomalies, recurring_expenses)

    output = {
        "financial_health_score": score,
        "persona": persona,
        "explanation": explanation,
        "smart_insights": smart_insights,
        "waste_signals": waste_signals,
        "alerts": alerts,
        "recommendations": recommendations,
        "recurring_expenses": recurring_expenses,
        "anomalies": anomalies,
        "forecast_next_month": forecast,
        "category_totals": build_category_totals(frame),
        "month_totals": build_month_totals(frame),
        "transactions": transactions,
    }

    json.dump(output, sys.stdout, indent=2)


if __name__ == "__main__":
    main()

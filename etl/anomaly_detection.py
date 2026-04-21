from __future__ import annotations

from dataclasses import dataclass
from typing import List

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import IsolationForest
except Exception:  # pragma: no cover - sklearn is optional in some environments
    IsolationForest = None


@dataclass
class AnomalyResult:
    merchant: str
    amount: float
    date: str
    reason: str


def _z_score_detection(df: pd.DataFrame) -> List[AnomalyResult]:
    if df.empty or len(df) < 4:
        return []

    amounts = df["amount"].astype(float)
    std = amounts.std(ddof=0)
    if std == 0 or np.isnan(std):
        return []

    mean = amounts.mean()
    z_scores = (amounts - mean) / std

    anomalies = df.loc[z_scores.abs() >= 2.3]
    return [
        AnomalyResult(
            merchant=str(row["merchant"]),
            amount=float(row["amount"]),
            date=str(pd.to_datetime(row["date"]).date()),
            reason="Amount deviates strongly from the user's recent spending baseline.",
        )
        for _, row in anomalies.iterrows()
    ]


def _isolation_forest_detection(df: pd.DataFrame) -> List[AnomalyResult]:
    if IsolationForest is None or df.empty or len(df) < 10:
        return []

    feature_frame = pd.DataFrame(
        {
            "amount": df["amount"].astype(float),
            "day_of_month": pd.to_datetime(df["date"]).dt.day,
            "day_of_week": pd.to_datetime(df["date"]).dt.dayofweek,
            "hour": pd.to_datetime(df["date"]).dt.hour,
        }
    )

    model = IsolationForest(
        contamination=min(0.1, max(0.02, 2 / len(feature_frame))),
        random_state=42,
    )
    labels = model.fit_predict(feature_frame)
    anomalies = df.loc[labels == -1]

    return [
        AnomalyResult(
            merchant=str(row["merchant"]),
            amount=float(row["amount"]),
            date=str(pd.to_datetime(row["date"]).date()),
            reason="Isolation Forest flagged this transaction as unusual for timing and value.",
        )
        for _, row in anomalies.iterrows()
    ]


def detect_anomalies(df: pd.DataFrame) -> List[dict]:
    debit_df = df.loc[df["type"] == "DEBIT"].copy()
    anomalies = _isolation_forest_detection(debit_df)

    if not anomalies:
        anomalies = _z_score_detection(debit_df)

    unique = {}
    for anomaly in anomalies:
        key = (anomaly.merchant, round(anomaly.amount, 2), anomaly.date)
        unique[key] = anomaly

    return [
        {
            "merchant": item.merchant,
            "amount": round(item.amount, 2),
            "date": item.date,
            "reason": item.reason,
        }
        for item in unique.values()
    ]

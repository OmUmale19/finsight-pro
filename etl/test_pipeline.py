import unittest
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent))

from etl_pipeline import clean_rows
from insights_engine import build_frame, classify_persona, forecast_next_month


class PipelineTests(unittest.TestCase):
    def test_clean_rows_normalizes_categories(self):
        frame = clean_rows(
            [
                {"date": "2026-04-01", "amount": "499", "description": "Swiggy order"},
                {"date": "2026-04-02", "amount": "850", "description": "Uber ride"},
            ]
        )

        self.assertEqual(len(frame), 2)
        self.assertEqual(frame.iloc[0]["category"], "Food")
        self.assertEqual(frame.iloc[1]["category"], "Transport")

    def test_forecast_and_persona(self):
        transactions = [
            {"date": "2026-01-01", "amount": 10000, "category": "Income", "merchant": "Salary", "type": "CREDIT"},
            {"date": "2026-01-05", "amount": 1500, "category": "Groceries", "merchant": "BigBasket", "type": "DEBIT"},
            {"date": "2026-02-05", "amount": 1800, "category": "Groceries", "merchant": "BigBasket", "type": "DEBIT"},
            {"date": "2026-03-05", "amount": 2000, "category": "Groceries", "merchant": "BigBasket", "type": "DEBIT"},
        ]
        frame = build_frame(transactions)
        forecast = forecast_next_month(frame)
        persona = classify_persona(78, frame)

        self.assertGreater(forecast, 0)
        self.assertEqual(persona, "Saver")


if __name__ == "__main__":
    unittest.main()

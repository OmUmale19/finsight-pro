from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

try:
    from apscheduler.schedulers.blocking import BlockingScheduler
except Exception:  # pragma: no cover - scheduler is optional locally
    BlockingScheduler = None


ROOT = Path(__file__).resolve().parent.parent
TEMP_DIR = ROOT / "tmp" / "scheduler"


def run_health_check() -> None:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    result = {
        "ran_at": datetime.utcnow().isoformat() + "Z",
        "status": "ok",
        "message": "Scheduler heartbeat completed."
    }
    with open(TEMP_DIR / "heartbeat.json", "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2)


def main() -> None:
    if BlockingScheduler is None:
        print(
            "APScheduler is not installed. Add it with `pip install apscheduler` to enable scheduled runs.",
            file=sys.stderr,
        )
        sys.exit(1)

    scheduler = BlockingScheduler(timezone=os.environ.get("TZ", "Asia/Calcutta"))
    scheduler.add_job(run_health_check, "cron", minute="*/30", id="finsight-heartbeat")
    print("FinSight Pro scheduler started. Press Ctrl+C to stop.")
    scheduler.start()


if __name__ == "__main__":
    main()

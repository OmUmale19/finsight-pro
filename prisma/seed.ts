import bcrypt from "bcryptjs";
import { PrismaClient, TransactionType, UploadSource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@finsightpro.dev" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@finsightpro.dev",
      passwordHash
    }
  });

  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.alert.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.rawTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.pipelineLog.deleteMany({ where: { userId: user.id } });

  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: "Food", limit: 7000 },
      { userId: user.id, category: "Transport", limit: 4000 },
      { userId: user.id, category: "Shopping", limit: 6000 }
    ]
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        name: "Emergency Fund",
        targetAmount: 150000,
        currentAmount: 50000,
        deadline: new Date("2026-12-31")
      },
      {
        userId: user.id,
        name: "Vacation Fund",
        targetAmount: 60000,
        currentAmount: 22000,
        deadline: new Date("2026-09-30")
      }
    ]
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        amount: 52000,
        date: new Date("2026-04-01"),
        category: "Income",
        normalizedCategory: "Income",
        merchant: "Salary Credit",
        description: "Monthly salary",
        type: TransactionType.CREDIT,
        source: UploadSource.CSV
      },
      {
        userId: user.id,
        amount: 389,
        date: new Date("2026-04-02T22:15:00"),
        category: "Food",
        normalizedCategory: "Food",
        merchant: "Swiggy",
        description: "Dinner order",
        type: TransactionType.DEBIT,
        source: UploadSource.CSV
      },
      {
        userId: user.id,
        amount: 780,
        date: new Date("2026-04-06T09:00:00"),
        category: "Transport",
        normalizedCategory: "Transport",
        merchant: "Uber",
        description: "Airport ride",
        type: TransactionType.DEBIT,
        source: UploadSource.CSV
      },
      {
        userId: user.id,
        amount: 799,
        date: new Date("2026-04-11"),
        category: "Subscriptions",
        normalizedCategory: "Subscriptions",
        merchant: "Spotify",
        description: "Spotify recurring payment",
        type: TransactionType.DEBIT,
        source: UploadSource.CSV,
        isRecurring: true
      },
      {
        userId: user.id,
        amount: 14500,
        date: new Date("2026-04-15"),
        category: "Shopping",
        normalizedCategory: "Shopping",
        merchant: "Luxury Store",
        description: "High-value shopping",
        type: TransactionType.DEBIT,
        source: UploadSource.CSV,
        isAnomaly: true
      },
      {
        userId: user.id,
        amount: 3100,
        date: new Date("2026-04-16"),
        category: "Groceries",
        normalizedCategory: "Groceries",
        merchant: "BigBasket",
        description: "Monthly groceries",
        type: TransactionType.DEBIT,
        source: UploadSource.CSV
      }
    ]
  });

  await prisma.insight.upsert({
    where: { userId: user.id },
    update: {
      financialScore: 72,
      persona: "Balanced",
      flags: {
        recurringCount: 1,
        anomalyCount: 1,
        wasteSignals: ["Shopping exceeded comfort threshold this month."]
      },
      explanation: [
        "Savings rate is healthy relative to monthly income.",
        "Budget adherence is mixed because shopping spend spiked.",
        "Essential categories still dominate most of the monthly outflow."
      ],
      summaryJson: {
        financial_health_score: 72,
        persona: "Balanced",
        explanation: [
          "Savings rate is healthy relative to monthly income.",
          "Budget adherence is mixed because shopping spend spiked.",
          "Essential categories still dominate most of the monthly outflow."
        ],
        smart_insights: [
          "You spend 36% more on weekends than weekdays.",
          "Food expenses peak after 9 PM."
        ],
        waste_signals: ["Shopping exceeded comfort threshold this month."],
        alerts: ["1 unusual transaction detected for review."],
        recommendations: [
          "Set a tighter shopping cap next month.",
          "Review recurring subscriptions quarterly."
        ],
        recurring_expenses: [{ merchant: "Spotify", amount: 799, cadence: "monthly" }],
        anomalies: [
          {
            merchant: "Luxury Store",
            amount: 14500,
            date: "2026-04-15",
            reason: "High-value outlier compared with the recent baseline."
          }
        ],
        forecast_next_month: 21500,
        category_totals: {
          Food: 389,
          Transport: 780,
          Subscriptions: 799,
          Shopping: 14500,
          Groceries: 3100
        },
        month_totals: [{ month: "2026-04", total: 19568 }]
      }
    },
    create: {
      userId: user.id,
      financialScore: 72,
      persona: "Balanced",
      flags: {
        recurringCount: 1,
        anomalyCount: 1,
        wasteSignals: ["Shopping exceeded comfort threshold this month."]
      },
      explanation: [
        "Savings rate is healthy relative to monthly income.",
        "Budget adherence is mixed because shopping spend spiked.",
        "Essential categories still dominate most of the monthly outflow."
      ],
      summaryJson: {
        financial_health_score: 72,
        persona: "Balanced",
        explanation: [
          "Savings rate is healthy relative to monthly income.",
          "Budget adherence is mixed because shopping spend spiked.",
          "Essential categories still dominate most of the monthly outflow."
        ],
        smart_insights: [
          "You spend 36% more on weekends than weekdays.",
          "Food expenses peak after 9 PM."
        ],
        waste_signals: ["Shopping exceeded comfort threshold this month."],
        alerts: ["1 unusual transaction detected for review."],
        recommendations: [
          "Set a tighter shopping cap next month.",
          "Review recurring subscriptions quarterly."
        ],
        recurring_expenses: [{ merchant: "Spotify", amount: 799, cadence: "monthly" }],
        anomalies: [
          {
            merchant: "Luxury Store",
            amount: 14500,
            date: "2026-04-15",
            reason: "High-value outlier compared with the recent baseline."
          }
        ],
        forecast_next_month: 21500,
        category_totals: {
          Food: 389,
          Transport: 780,
          Subscriptions: 799,
          Shopping: 14500,
          Groceries: 3100
        },
        month_totals: [{ month: "2026-04", total: 19568 }]
      }
    }
  });

  await prisma.alert.createMany({
    data: [
      {
        userId: user.id,
        title: "Anomaly detected",
        message: "Luxury Store purchase looks unusually high.",
        type: "anomaly",
        severity: "CRITICAL"
      },
      {
        userId: user.id,
        title: "Budget warning",
        message: "Shopping is trending above the monthly threshold.",
        type: "budget",
        severity: "WARNING"
      }
    ]
  });

  await prisma.pipelineLog.create({
    data: {
      userId: user.id,
      source: UploadSource.CSV,
      status: "SUCCESS",
      startedAt: new Date("2026-04-20T08:00:00"),
      finishedAt: new Date("2026-04-20T08:01:00"),
      rowsProcessed: 6
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const basePrisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

export const prisma = basePrisma.$extends({
  result: {
    rawTransaction: {
      rawJson: {
        needs: { rawJson: true },
        compute(rawTransaction) {
          try {
            return JSON.parse(rawTransaction.rawJson as string);
          } catch {
            return rawTransaction.rawJson;
          }
        }
      }
    },
    transaction: {
      metadata: {
        needs: { metadata: true },
        compute(transaction) {
          if (!transaction.metadata) return null;
          try {
            return JSON.parse(transaction.metadata as string);
          } catch {
            return transaction.metadata;
          }
        }
      }
    },
    insight: {
      flags: {
        needs: { flags: true },
        compute(insight) {
          try {
            return JSON.parse(insight.flags as string);
          } catch {
            return insight.flags;
          }
        }
      },
      summaryJson: {
        needs: { summaryJson: true },
        compute(insight) {
          try {
            return JSON.parse(insight.summaryJson as string);
          } catch {
            return insight.summaryJson;
          }
        }
      },
      explanation: {
        needs: { explanation: true },
        compute(insight) {
          try {
            return JSON.parse(insight.explanation as string);
          } catch {
            return insight.explanation;
          }
        }
      }
    },
    pipelineLog: {
      metadata: {
        needs: { metadata: true },
        compute(pipelineLog) {
          if (!pipelineLog.metadata) return null;
          try {
            return JSON.parse(pipelineLog.metadata as string);
          } catch {
            return pipelineLog.metadata;
          }
        }
      }
    },
    alert: {
      metadata: {
        needs: { metadata: true },
        compute(alert) {
          if (!alert.metadata) return null;
          try {
            return JSON.parse(alert.metadata as string);
          } catch {
            return alert.metadata;
          }
        }
      }
    }
  }
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = basePrisma;
}

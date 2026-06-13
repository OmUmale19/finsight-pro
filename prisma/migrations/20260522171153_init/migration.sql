/*
  Warnings:

  - The `source` column on the `pipeline_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `severity` on the `alerts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `pipeline_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source` on the `raw_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "severity",
ADD COLUMN     "severity" TEXT NOT NULL,
ALTER COLUMN "metadata" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "insights" ALTER COLUMN "flags" SET DATA TYPE TEXT,
ALTER COLUMN "summary_json" SET DATA TYPE TEXT,
ALTER COLUMN "explanation" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "pipeline_logs" DROP COLUMN "source",
ADD COLUMN     "source" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "metadata" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "raw_transactions" DROP COLUMN "source",
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "raw_json" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "metadata" SET DATA TYPE TEXT;

-- DropEnum
DROP TYPE "AlertSeverity";

-- DropEnum
DROP TYPE "PipelineStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "UploadSource";

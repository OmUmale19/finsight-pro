ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
ALTER TABLE "users" ADD COLUMN "job_title" TEXT;
ALTER TABLE "users" ADD COLUMN "company" TEXT;
ALTER TABLE "users" ADD COLUMN "location" TEXT;
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "weekly_digest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "product_updates" BOOLEAN NOT NULL DEFAULT false;

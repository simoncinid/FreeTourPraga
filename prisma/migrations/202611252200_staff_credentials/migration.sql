-- Staff credentials live in AdminUser; peers manage accounts from the gestionale.
ALTER TABLE "AdminUser" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AdminUser" ADD COLUMN "passwordEnc" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "paused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "AdminUser" SET "role" = 'admin' WHERE "role" <> 'admin';
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'admin';

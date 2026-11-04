ALTER TABLE "packages" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
-- Data step: rows created before "transaction-script" was added hold the legacy
-- "tx-script", which the new type no longer has.
UPDATE "packages" SET "type" = 'transaction-script' WHERE "type" = 'tx-script';--> statement-breakpoint
DROP TYPE "package_type";--> statement-breakpoint
CREATE TYPE "package_type" AS ENUM('library', 'account-component', 'authentication-component', 'note', 'transaction-script');--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "type" SET DATA TYPE "package_type" USING "type"::"package_type";--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "type" SET DEFAULT 'account-component'::"package_type";
CREATE TYPE "package_status" AS ENUM('draft', 'compiled', 'error');--> statement-breakpoint
CREATE TYPE "package_type" AS ENUM('library', 'account-component', 'authentication-component', 'note', 'tx-script');--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) DEFAULT '' NOT NULL,
	"type" "package_type" DEFAULT 'account-component'::"package_type" NOT NULL,
	"status" "package_status" DEFAULT 'draft'::"package_status" NOT NULL,
	"read_only" boolean DEFAULT false NOT NULL,
	"files" jsonb DEFAULT '{}' NOT NULL,
	"masm" text DEFAULT '' NOT NULL,
	"commitment" varchar(66) DEFAULT '0x0000000000000000000000000000000000000000000000000000000000000000' NOT NULL,
	"masp" text DEFAULT '' NOT NULL,
	"exports" jsonb[] DEFAULT '{}'::jsonb[] NOT NULL,
	"dependencies" varchar(36)[] DEFAULT '{}'::varchar(36)[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

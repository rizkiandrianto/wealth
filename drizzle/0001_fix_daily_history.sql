-- Add balance column to wealth_accounts (default 0)
ALTER TABLE "wealth_accounts" ADD COLUMN "balance" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint

-- Backfill balance from existing transactions (incoming positive, outgoing negative)
UPDATE "wealth_accounts" wa
SET "balance" = COALESCE((
  SELECT SUM(
    CASE
      WHEN t."to_account_id" = wa."id" THEN t."amount"
      WHEN t."from_account_id" = wa."id" THEN -t."amount"
      ELSE 0
    END
  )
  FROM "transactions" t
  WHERE t."user_id" = wa."user_id"
    AND (t."from_account_id" = wa."id" OR t."to_account_id" = wa."id")
), 0);--> statement-breakpoint

-- Drop unused daily_balances table
DROP TABLE "daily_balances";--> statement-breakpoint

-- Create account_balance_snapshots table
CREATE TABLE "account_balance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"date" text NOT NULL,
	"balance" numeric(20, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "account_balance_snapshots" ADD CONSTRAINT "account_balance_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_balance_snapshots" ADD CONSTRAINT "account_balance_snapshots_account_id_wealth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wealth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_snapshot_user_account_date" ON "account_balance_snapshots" USING btree ("user_id","account_id","date");

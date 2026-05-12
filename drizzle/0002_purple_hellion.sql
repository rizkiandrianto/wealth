CREATE TABLE "account_balance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"date" text NOT NULL,
	"balance" numeric(20, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_value_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"cash_value" numeric(20, 4) DEFAULT '0' NOT NULL,
	"stock_value" numeric(20, 4) DEFAULT '0' NOT NULL,
	"crypto_value" numeric(20, 4) DEFAULT '0' NOT NULL,
	"gold_value" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total_value" numeric(20, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "daily_balances" CASCADE;--> statement-breakpoint
ALTER TABLE "wealth_accounts" ADD COLUMN "balance" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "account_balance_snapshots" ADD CONSTRAINT "account_balance_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_balance_snapshots" ADD CONSTRAINT "account_balance_snapshots_account_id_wealth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wealth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_value_snapshots" ADD CONSTRAINT "portfolio_value_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_snapshot_user_account_date" ON "account_balance_snapshots" USING btree ("user_id","account_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_portfolio_snapshot_user_date" ON "portfolio_value_snapshots" USING btree ("user_id","date");
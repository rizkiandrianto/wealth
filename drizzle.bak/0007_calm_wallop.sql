ALTER TABLE "crypto_sales" ADD COLUMN "purchase_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "gold_sales" ADD COLUMN "purchase_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_sales" ADD COLUMN "purchase_date" timestamp NOT NULL;
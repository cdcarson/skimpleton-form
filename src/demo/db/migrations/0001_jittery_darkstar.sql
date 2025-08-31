DROP INDEX "idx_user_account_search_vector";--> statement-breakpoint
DROP INDEX "idx_user_profile_search_vector";--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN "search_vector";--> statement-breakpoint
ALTER TABLE "user_profile" DROP COLUMN "search_vector";
ALTER TABLE "profiles" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "profiles" SET "slug" = "username";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_slug_unique" UNIQUE("slug");

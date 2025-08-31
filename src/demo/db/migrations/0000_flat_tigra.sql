CREATE EXTENSION citext;
--> statement-breakpoint

CREATE TABLE "user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_account" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"email" "citext" NOT NULL,
	"email_verified" boolean,
	"password" varchar,
	"last_signed_in_at" timestamp NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector(
        'english',
        coalesce(split_part("user_account"."email", '@', 1), '') || 
          ' ' || 
        replace(coalesce(split_part("user_account"."email", '@', 2), ''), '.', ' ') 
      )) STORED NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"avatar_url" varchar,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("user_profile"."name", '')), 'A')
        || ' ' ||
        setweight(to_tsvector('english', coalesce("user_profile"."description", '')), 'B')) STORED NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"remember" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_account_unique_email" ON "user_account" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_account_search_vector" ON "user_account" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "idx_user_profile_search_vector" ON "user_profile" USING gin ("search_vector");
CREATE TABLE "todo_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"todo_list_id" bigint NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todo_item" ADD CONSTRAINT "todo_item_todo_list_id_todo_list_id_fk" FOREIGN KEY ("todo_list_id") REFERENCES "public"."todo_list"("id") ON DELETE no action ON UPDATE no action;
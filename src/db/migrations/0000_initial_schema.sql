CREATE TABLE "clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"linkId" uuid NOT NULL,
	"clickedAt" timestamp DEFAULT now(),
	"referrer" text,
	"userAgent" text,
	"ipAddress" text,
	"country" text,
	"city" text,
	"device" text,
	"os" text
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"shortCode" text NOT NULL,
	"originalUrl" text NOT NULL,
	"customCode" integer DEFAULT 0,
	"hasPassword" integer DEFAULT 0,
	"passwordHash" text,
	"expiresAt" timestamp,
	"maxClicks" integer,
	"clickCount" integer DEFAULT 0,
	"showPreview" integer DEFAULT 0,
	"isActive" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"passwordHash" text NOT NULL,
	"plan" text DEFAULT 'free',
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "idx_click_linkId" ON "clicks" USING btree ("linkId");--> statement-breakpoint
CREATE INDEX "idx_click_clickedAt" ON "clicks" USING btree ("clickedAt");--> statement-breakpoint
CREATE INDEX "idx_link_shortCode" ON "links" USING btree ("shortCode");--> statement-breakpoint
CREATE INDEX "idx_link_userId" ON "links" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_session_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "users" USING btree ("email");
CREATE TABLE "audience_contacts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audience_contacts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"audienceId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audiences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audiences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"channel" "channel" DEFAULT 'email' NOT NULL,
	"country" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contacts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"phone" varchar(30),
	"preferredChannel" "preferredChannel" DEFAULT 'email' NOT NULL,
	"tags" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_branding" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_branding_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"logoUrl" text,
	"primaryColor" varchar(20) DEFAULT '#00BCD4' NOT NULL,
	"secondaryColor" varchar(20) DEFAULT '#0097A7' NOT NULL,
	"signatureTag" text,
	"usePlatformBranding" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_branding_organizationId_unique" UNIQUE("organizationId")
);
--> statement-breakpoint
CREATE TABLE "mfa_otp_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_otp_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"code" varchar(10) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfa_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"mfaEnabled" boolean DEFAULT false NOT NULL,
	"mfaMethod" "mfaMethod" DEFAULT 'email_otp' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mfa_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "org_manager_invites" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "org_manager_invites_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255),
	"token" varchar(64) NOT NULL,
	"invitedById" integer NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_manager_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organizations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"industry" varchar(100),
	"country" varchar(100),
	"ownerId" integer NOT NULL,
	"isRestricted" boolean DEFAULT false NOT NULL,
	"restrictionReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "password_reset_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "respondents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "respondents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"phone" varchar(30),
	"company" varchar(255),
	"country" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_answer_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "response_answer_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"responseAnswerId" integer NOT NULL,
	"surveyResponseId" integer NOT NULL,
	"questionKey" varchar(100) NOT NULL,
	"value" json,
	"version" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_answers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "response_answers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"surveyResponseId" integer NOT NULL,
	"questionKey" varchar(100) NOT NULL,
	"value" json,
	"version" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_invitations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"surveyId" integer NOT NULL,
	"surveyLinkId" integer,
	"audienceId" integer,
	"contactId" integer,
	"recipientEmail" varchar(320),
	"recipientPhone" varchar(30),
	"recipientName" varchar(255),
	"channel" "channel" DEFAULT 'email' NOT NULL,
	"inviteToken" varchar(64) NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"sentAt" timestamp,
	"openedAt" timestamp,
	"completedAt" timestamp,
	"surveyResponseId" integer,
	"sentById" integer NOT NULL,
	"personalMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "survey_invitations_inviteToken_unique" UNIQUE("inviteToken")
);
--> statement-breakpoint
CREATE TABLE "survey_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"surveyId" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"label" varchar(100),
	"isActive" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "survey_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_questions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"surveyId" integer NOT NULL,
	"organizationId" integer NOT NULL,
	"questionKey" varchar(100) NOT NULL,
	"questionText" text NOT NULL,
	"questionType" "questionType" NOT NULL,
	"options" json,
	"branchingLogic" json,
	"isRequired" boolean DEFAULT false NOT NULL,
	"maxChars" integer,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_responses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"surveyId" integer NOT NULL,
	"organizationId" integer NOT NULL,
	"respondentId" integer,
	"inviteToken" varchar(64),
	"isComplete" boolean DEFAULT false NOT NULL,
	"npsScore" integer,
	"csatScore" integer,
	"cesScore" integer,
	"sentiment" "sentiment",
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "surveys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"closingMessage" text,
	"thankYouHeadline" varchar(255),
	"objective" varchar(100),
	"joinCode" varchar(20),
	"status" "status" DEFAULT 'draft' NOT NULL,
	"isAnonymous" boolean DEFAULT false NOT NULL,
	"expiresAt" timestamp,
	"completions" integer DEFAULT 0 NOT NULL,
	"lastActivityAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_joinCode_unique" UNIQUE("joinCode")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"managedOrgId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"passwordHash" varchar(255),
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

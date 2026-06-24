-- Create enum types first (with IF NOT EXISTS to handle idempotency)
DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "channel" AS ENUM ('email', 'sms', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "preferredChannel" AS ENUM ('email', 'sms', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "mfaMethod" AS ENUM ('email_otp', 'sms_otp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "questionType" AS ENUM ('nps', 'csat', 'ces', 'text', 'multiple_choice', 'rating');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "sentiment" AS ENUM ('positive', 'negative', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "status" AS ENUM ('draft', 'active', 'closed', 'pending', 'sent', 'opened', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "users" (
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

-- Create surveys table if it doesn't exist
CREATE TABLE IF NOT EXISTS "surveys" (
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

-- Create survey_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "survey_questions" (
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

-- Create survey_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS "survey_responses" (
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

-- Create survey_ai_summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS "survey_ai_summaries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_ai_summaries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"surveyId" integer NOT NULL,
	"organizationId" integer NOT NULL,
	"themes" json,
	"sentiment" json,
	"keyPhrases" json,
	"insights" text,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create audiences table if it doesn't exist
CREATE TABLE IF NOT EXISTS "audiences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audiences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organizationId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"channel" "channel" DEFAULT 'email' NOT NULL,
	"country" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS "contacts" (
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

-- Create survey_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "survey_invitations" (
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

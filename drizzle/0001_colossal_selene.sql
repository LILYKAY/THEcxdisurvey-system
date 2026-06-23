CREATE TABLE "survey_ai_summaries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_ai_summaries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"surveyId" integer NOT NULL,
	"organizationId" integer NOT NULL,
	"themes" json,
	"sentimentBreakdown" json,
	"keyPhrases" json,
	"insights" text,
	"generatedAt" timestamp NOT NULL,
	"cachedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "survey_ai_summaries_surveyId_unique" UNIQUE("surveyId")
);

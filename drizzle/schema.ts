import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "org_owner"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  country: varchar("country", { length: 100 }),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── Surveys ──────────────────────────────────────────────────────────────────

export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  formKey: mysqlEnum("formKey", [
    "current_customers",
    "dropped_customers",
    "repeat_trial",
    "single_trial",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

// ─── Survey Links ─────────────────────────────────────────────────────────────

export const surveyLinks = mysqlTable("survey_links", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SurveyLink = typeof surveyLinks.$inferSelect;
export type InsertSurveyLink = typeof surveyLinks.$inferInsert;

// ─── Respondents ──────────────────────────────────────────────────────────────

export const respondents = mysqlTable("respondents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  company: varchar("company", { length: 255 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Respondent = typeof respondents.$inferSelect;
export type InsertRespondent = typeof respondents.$inferInsert;

// ─── Survey Responses ─────────────────────────────────────────────────────────
// Immutable header record — one per respondent per survey.
// Never deleted; status tracks completion lifecycle.

export const surveyResponses = mysqlTable("survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  surveyLinkId: int("surveyLinkId"),
  respondentId: int("respondentId").notNull(),
  organizationId: int("organizationId").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

// ─── Response Answers ─────────────────────────────────────────────────────────
// Current (latest) answer for each question in a response.
// The value is stored as JSON to support all question types uniformly.

export const responseAnswers = mysqlTable("response_answers", {
  id: int("id").autoincrement().primaryKey(),
  surveyResponseId: int("surveyResponseId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  // JSON value: string for open-ended, string[] for multi-select, string for single-choice
  value: json("value"),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseAnswer = typeof responseAnswers.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswers.$inferInsert;

// ─── Response Answer History ──────────────────────────────────────────────────
// Immutable audit log. Every time an answer is updated, the previous value
// is written here before the current record is modified.

export const responseAnswerHistory = mysqlTable("response_answer_history", {
  id: int("id").autoincrement().primaryKey(),
  responseAnswerId: int("responseAnswerId").notNull(),
  surveyResponseId: int("surveyResponseId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  value: json("value"),
  version: int("version").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type ResponseAnswerHistory = typeof responseAnswerHistory.$inferSelect;
export type InsertResponseAnswerHistory = typeof responseAnswerHistory.$inferInsert;

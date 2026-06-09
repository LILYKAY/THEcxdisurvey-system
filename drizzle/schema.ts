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
  passwordHash: varchar("passwordHash", { length: 255 }),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── MFA Settings ─────────────────────────────────────────────────────────────
export const mfaSettings = mysqlTable("mfa_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaMethod: mysqlEnum("mfaMethod", ["email_otp"]).default("email_otp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MfaSetting = typeof mfaSettings.$inferSelect;

// ─── MFA OTP Codes ────────────────────────────────────────────────────────────
export const mfaOtpCodes = mysqlTable("mfa_otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MfaOtpCode = typeof mfaOtpCodes.$inferSelect;

// ─── Organizations ────────────────────────────────────────────────────────────
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  country: varchar("country", { length: 100 }),
  ownerId: int("ownerId").notNull(),
  isRestricted: boolean("isRestricted").default(false).notNull(),
  restrictionReason: text("restrictionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── Email Branding ───────────────────────────────────────────────────────────
export const emailBranding = mysqlTable("email_branding", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().unique(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#00BCD4").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 20 }).default("#0097A7").notNull(),
  signatureTag: text("signatureTag"),
  usePlatformBranding: boolean("usePlatformBranding").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailBranding = typeof emailBranding.$inferSelect;
export type InsertEmailBranding = typeof emailBranding.$inferInsert;

// ─── Surveys ──────────────────────────────────────────────────────────────────
export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  closingMessage: text("closingMessage"),
  objective: varchar("objective", { length: 100 }),
  joinCode: varchar("joinCode", { length: 20 }).unique(),
  status: mysqlEnum("status", ["draft", "active", "inactive"]).default("draft").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  expiresAt: timestamp("expiresAt"),
  completions: int("completions").default(0).notNull(),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

// ─── Survey Questions ─────────────────────────────────────────────────────────
export const surveyQuestions = mysqlTable("survey_questions", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  organizationId: int("organizationId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", [
    "open_ended",
    "multiple_choice_single",
    "multiple_choice_multi",
    "yes_no",
    "nps",
    "csat",
    "ces_5",
    "ces_7",
    "range_0_10",
    "number_input",
    "year",
    "date",
    "consent",
    "end_message",
    "nps_comment",
  ]).notNull(),
  options: json("options"),
  branchingLogic: json("branchingLogic"),
  isRequired: boolean("isRequired").default(false).notNull(),
  maxChars: int("maxChars"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = typeof surveyQuestions.$inferInsert;

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  preferredChannel: mysqlEnum("preferredChannel", ["email", "whatsapp", "sms"]).default("email").notNull(),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Audiences ────────────────────────────────────────────────────────────────
export const audiences = mysqlTable("audiences", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "sms"]).default("email").notNull(),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Audience = typeof audiences.$inferSelect;
export type InsertAudience = typeof audiences.$inferInsert;

// ─── Audience Contacts ────────────────────────────────────────────────────────
export const audienceContacts = mysqlTable("audience_contacts", {
  id: int("id").autoincrement().primaryKey(),
  audienceId: int("audienceId").notNull(),
  contactId: int("contactId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AudienceContact = typeof audienceContacts.$inferSelect;

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
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 255 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Respondent = typeof respondents.$inferSelect;
export type InsertRespondent = typeof respondents.$inferInsert;

// ─── Survey Responses ─────────────────────────────────────────────────────────
export const surveyResponses = mysqlTable("survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  organizationId: int("organizationId").notNull(),
  respondentId: int("respondentId"),
  inviteToken: varchar("inviteToken", { length: 64 }),
  isComplete: boolean("isComplete").default(false).notNull(),
  npsScore: int("npsScore"),
  csatScore: int("csatScore"),
  cesScore: int("cesScore"),
  sentiment: mysqlEnum("sentiment", ["promoter", "passive", "detractor"]),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

// ─── Response Answers ─────────────────────────────────────────────────────────
export const responseAnswers = mysqlTable("response_answers", {
  id: int("id").autoincrement().primaryKey(),
  surveyResponseId: int("surveyResponseId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  value: json("value"),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ResponseAnswer = typeof responseAnswers.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswers.$inferInsert;

// ─── Response Answer History ──────────────────────────────────────────────────
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

// ─── Survey Invitations ───────────────────────────────────────────────────────
export const surveyInvitations = mysqlTable("survey_invitations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  surveyId: int("surveyId").notNull(),
  surveyLinkId: int("surveyLinkId"),
  audienceId: int("audienceId"),
  contactId: int("contactId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 30 }),
  recipientName: varchar("recipientName", { length: 255 }),
  channel: mysqlEnum("channel", ["email", "whatsapp", "sms"]).default("email").notNull(),
  inviteToken: varchar("inviteToken", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "sent", "opened", "completed", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  completedAt: timestamp("completedAt"),
  surveyResponseId: int("surveyResponseId"),
  sentById: int("sentById").notNull(),
  personalMessage: text("personalMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurveyInvitation = typeof surveyInvitations.$inferSelect;
export type InsertSurveyInvitation = typeof surveyInvitations.$inferInsert;

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

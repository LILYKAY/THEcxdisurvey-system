import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: pgEnum("role", ["user", "admin", "org_owner", "org_manager"])("role").notNull().default("user"),
  managedOrgId: integer("managedOrgId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── MFA Settings ─────────────────────────────────────────────────────────────
export const mfaSettings = pgTable("mfa_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().unique(),
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaMethod: pgEnum("mfaMethod", ["email_otp"])("mfaMethod").notNull().default("email_otp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MfaSetting = typeof mfaSettings.$inferSelect;

// ─── MFA OTP Codes ────────────────────────────────────────────────────────────
export const mfaOtpCodes = pgTable("mfa_otp_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MfaOtpCode = typeof mfaOtpCodes.$inferSelect;

// ─── Organizations ────────────────────────────────────────────────────────────
export const organizations = pgTable("organizations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  country: varchar("country", { length: 100 }),
  ownerId: integer("ownerId").notNull(),
  isRestricted: boolean("isRestricted").default(false).notNull(),
  restrictionReason: text("restrictionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── Email Branding ───────────────────────────────────────────────────────────
export const emailBranding = pgTable("email_branding", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull().unique(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#00BCD4").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 20 }).default("#0097A7").notNull(),
  signatureTag: text("signatureTag"),
  usePlatformBranding: boolean("usePlatformBranding").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type EmailBranding = typeof emailBranding.$inferSelect;
export type InsertEmailBranding = typeof emailBranding.$inferInsert;

// ─── Surveys ──────────────────────────────────────────────────────────────────
export const surveys = pgTable("surveys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  closingMessage: text("closingMessage"),
  thankYouHeadline: varchar("thankYouHeadline", { length: 255 }),
  objective: varchar("objective", { length: 100 }),
  joinCode: varchar("joinCode", { length: 20 }).unique(),
  status: pgEnum("status", ["draft", "active", "inactive"])("status").notNull().default("draft"),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  expiresAt: timestamp("expiresAt"),
  completions: integer("completions").default(0).notNull(),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

// ─── Survey Questions ─────────────────────────────────────────────────────────
export const surveyQuestions = pgTable("survey_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  surveyId: integer("surveyId").notNull(),
  organizationId: integer("organizationId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  questionText: text("questionText").notNull(),
  questionType: pgEnum("questionType", [
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
  ])("questionType").notNull(),
  options: json("options"),
  branchingLogic: json("branchingLogic"),
  isRequired: boolean("isRequired").default(false).notNull(),
  maxChars: integer("maxChars"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = typeof surveyQuestions.$inferInsert;

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contacts = pgTable("contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  preferredChannel: pgEnum("preferredChannel", ["email", "whatsapp", "sms"])("preferredChannel").notNull().default("email"),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Audiences ────────────────────────────────────────────────────────────────
export const audiences = pgTable("audiences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  channel: pgEnum("channel", ["email", "whatsapp", "sms"])("channel").notNull().default("email"),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Audience = typeof audiences.$inferSelect;
export type InsertAudience = typeof audiences.$inferInsert;

// ─── Audience Contacts ────────────────────────────────────────────────────────
export const audienceContacts = pgTable("audience_contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  audienceId: integer("audienceId").notNull(),
  contactId: integer("contactId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AudienceContact = typeof audienceContacts.$inferSelect;

// ─── Survey Links ─────────────────────────────────────────────────────────────
export const surveyLinks = pgTable("survey_links", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  surveyId: integer("surveyId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SurveyLink = typeof surveyLinks.$inferSelect;
export type InsertSurveyLink = typeof surveyLinks.$inferInsert;

// ─── Respondents ──────────────────────────────────────────────────────────────
export const respondents = pgTable("respondents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 255 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Respondent = typeof respondents.$inferSelect;
export type InsertRespondent = typeof respondents.$inferInsert;

// ─── Survey Responses ─────────────────────────────────────────────────────────
export const surveyResponses = pgTable("survey_responses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  surveyId: integer("surveyId").notNull(),
  organizationId: integer("organizationId").notNull(),
  respondentId: integer("respondentId"),
  inviteToken: varchar("inviteToken", { length: 64 }),
  isComplete: boolean("isComplete").default(false).notNull(),
  npsScore: integer("npsScore"),
  csatScore: integer("csatScore"),
  cesScore: integer("cesScore"),
  sentiment: pgEnum("sentiment", ["promoter", "passive", "detractor"])("sentiment"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

// ─── Response Answers ─────────────────────────────────────────────────────────
export const responseAnswers = pgTable("response_answers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  surveyResponseId: integer("surveyResponseId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  value: json("value"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ResponseAnswer = typeof responseAnswers.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswers.$inferInsert;

// ─── Response Answer History ──────────────────────────────────────────────────
export const responseAnswerHistory = pgTable("response_answer_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  responseAnswerId: integer("responseAnswerId").notNull(),
  surveyResponseId: integer("surveyResponseId").notNull(),
  questionKey: varchar("questionKey", { length: 100 }).notNull(),
  value: json("value"),
  version: integer("version").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});
export type ResponseAnswerHistory = typeof responseAnswerHistory.$inferSelect;
export type InsertResponseAnswerHistory = typeof responseAnswerHistory.$inferInsert;

// ─── Survey Invitations ───────────────────────────────────────────────────────
export const surveyInvitations = pgTable("survey_invitations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull(),
  surveyId: integer("surveyId").notNull(),
  surveyLinkId: integer("surveyLinkId"),
  audienceId: integer("audienceId"),
  contactId: integer("contactId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 30 }),
  recipientName: varchar("recipientName", { length: 255 }),
  channel: pgEnum("channel", ["email", "whatsapp", "sms"])('channel').notNull().default("email"),
  inviteToken: varchar("inviteToken", { length: 64 }).notNull().unique(),
  status: pgEnum("status", ["pending", "sent", "opened", "completed", "failed"])('status').notNull().default("pending"),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  completedAt: timestamp("completedAt"),
  surveyResponseId: integer("surveyResponseId"),
  sentById: integer("sentById").notNull(),
  personalMessage: text("personalMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SurveyInvitation = typeof surveyInvitations.$inferSelect;
export type InsertSurveyInvitation = typeof surveyInvitations.$inferInsert;

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ─── Org Manager Invites ──────────────────────────────────────────────────────
export const orgManagerInvites = pgTable("org_manager_invites", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organizationId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  invitedById: integer("invitedById").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OrgManagerInvite = typeof orgManagerInvites.$inferSelect;
export type InsertOrgManagerInvite = typeof orgManagerInvites.$inferInsert;

// ─── Survey AI Summaries ──────────────────────────────────────────────────────
export const surveyAiSummaries = pgTable("survey_ai_summaries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  surveyId: integer("surveyId").notNull().unique(),
  organizationId: integer("organizationId").notNull(),
  themes: json("themes"), // Array of { theme: string, count: number, examples: string[] }
  sentimentBreakdown: json("sentimentBreakdown"), // { positive: number, negative: number, neutral: number }
  keyPhrases: json("keyPhrases"), // Array of { phrase: string, frequency: number }
  insights: text("insights"), // Actionable insights and recommendations
  generatedAt: timestamp("generatedAt").notNull(),
  cachedAt: timestamp("cachedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SurveyAiSummary = typeof surveyAiSummaries.$inferSelect;
export type InsertSurveyAiSummary = typeof surveyAiSummaries.$inferInsert;

import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import { type MySql2Database, drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertAudience,
  AudienceContact,
  InsertContact,
  InsertEmailBranding,
  InsertOrganization,
  InsertRespondent,
  InsertResponseAnswer,
  InsertResponseAnswerHistory,
  InsertSurveyInvitation,
  InsertSurveyLink,
  InsertSurveyQuestion,
  InsertSurveyResponse,
  InsertUser,
  Organization,
  PasswordResetToken,
  SurveyInvitation,
  audienceContacts,
  audiences,
  contacts,
  emailBranding,
  mfaOtpCodes,
  mfaSettings,
  organizations,
  passwordResetTokens,
  respondents,
  responseAnswerHistory,
  responseAnswers,
  surveyInvitations,
  surveyLinks,
  surveyQuestions,
  surveyResponses,
  surveys,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: MySql2Database | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
        enableKeepAlive: true,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.passwordHash !== undefined) {
    values.passwordHash = user.passwordHash;
    updateSet.passwordHash = user.passwordHash;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "org_owner") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
  return true;
}

// ─── MFA Settings ─────────────────────────────────────────────────────────────

export async function getMfaSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(mfaSettings).where(eq(mfaSettings.userId, userId));
  return row ?? null;
}

export async function upsertMfaSettings(userId: number, mfaEnabled: boolean) {
  const db = await getDb();
  if (!db) return false;
  await db
    .insert(mfaSettings)
    .values({ userId, mfaEnabled })
    .onDuplicateKeyUpdate({ set: { mfaEnabled, updatedAt: new Date() } });
  return true;
}

export async function createMfaOtp(userId: number, code: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return false;
  await db
    .update(mfaOtpCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(mfaOtpCodes.userId, userId), sql`${mfaOtpCodes.usedAt} IS NULL`));
  await db.insert(mfaOtpCodes).values({ userId, code, expiresAt });
  return true;
}

export async function verifyMfaOtp(userId: number, code: string) {
  const db = await getDb();
  if (!db) return false;
  const now = new Date();
  const [row] = await db
    .select()
    .from(mfaOtpCodes)
    .where(
      and(
        eq(mfaOtpCodes.userId, userId),
        eq(mfaOtpCodes.code, code),
        sql`${mfaOtpCodes.usedAt} IS NULL`,
        gte(mfaOtpCodes.expiresAt, now)
      )
    );
  if (!row) return false;
  await db.update(mfaOtpCodes).set({ usedAt: now }).where(eq(mfaOtpCodes.id, row.id));
  return true;
}

// ─── Password Reset Tokens ────────────────────────────────────────────────────

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return row ?? null;
}

export async function markResetTokenUsed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
}

// ─── Organizations ────────────────────────────────────────────────────────────

export async function createOrganization(data: InsertOrganization): Promise<Organization> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(organizations).values(data);
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, data.slug))
    .limit(1);
  return result[0]!;
}

export async function getOrganizationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0];
}

export async function getOrganizationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return result[0];
}

export async function getOrganizationsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organizations).where(eq(organizations.ownerId, ownerId));
}

export async function getAllOrganizations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function updateOrganization(id: number, data: Partial<InsertOrganization>) {
  const db = await getDb();
  if (!db) return;
  await db.update(organizations).set(data).where(eq(organizations.id, id));
}

export async function setOrganizationRestriction(id: number, isRestricted: boolean, reason?: string) {
  const db = await getDb();
  if (!db) return false;
  await db
    .update(organizations)
    .set({ isRestricted, restrictionReason: reason ?? null, updatedAt: new Date() })
    .where(eq(organizations.id, id));
  return true;
}

// ─── Email Branding ───────────────────────────────────────────────────────────

export async function getEmailBranding(organizationId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(emailBranding).where(eq(emailBranding.organizationId, organizationId));
  return row ?? null;
}

export async function upsertEmailBranding(data: InsertEmailBranding) {
  const db = await getDb();
  if (!db) return false;
  await db
    .insert(emailBranding)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        signatureTag: data.signatureTag,
        usePlatformBranding: data.usePlatformBranding,
        updatedAt: new Date(),
      },
    });
  return true;
}

// ─── Surveys ──────────────────────────────────────────────────────────────────

export async function getSurveysByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveys).where(eq(surveys.organizationId, organizationId)).orderBy(desc(surveys.createdAt));
}

export async function getSurveyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
  return result[0];
}

export async function createSurveyRecord(data: {
  organizationId: number;
  title: string;
  description?: string;
  objective?: string;
  isAnonymous?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  await db.insert(surveys).values({ ...data, joinCode, status: "draft" });
  const result = await db
    .select()
    .from(surveys)
    .where(eq(surveys.organizationId, data.organizationId))
    .orderBy(desc(surveys.createdAt))
    .limit(1);
  return result[0]!;
}

export async function getAllSurveys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveys).orderBy(desc(surveys.createdAt));
}

export async function getAllSurveysWithStats() {
  const db = await getDb();
  if (!db) return [];
  const allSurveys = await db.select().from(surveys).orderBy(desc(surveys.createdAt));
  const results = await Promise.all(
    allSurveys.map(async (survey) => {
      const org = await db!.select().from(organizations).where(eq(organizations.id, survey.organizationId)).limit(1);
      const links = await db!.select().from(surveyLinks).where(eq(surveyLinks.surveyId, survey.id));
      const responses = await db!.select({ cnt: count() }).from(surveyResponses).where(eq(surveyResponses.surveyId, survey.id));
      const completedResponses = await db!
        .select({ cnt: count() })
        .from(surveyResponses)
        .where(and(eq(surveyResponses.surveyId, survey.id), eq(surveyResponses.isComplete, true)));
      return {
        ...survey,
        organization: org[0] ?? null,
        links,
        totalResponses: Number(responses[0]?.cnt ?? 0),
        completedResponses: Number(completedResponses[0]?.cnt ?? 0),
      };
    })
  );
  return results;
}

export async function updateSurvey(id: number, data: Partial<InsertSurveyResponse>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(surveys).set({ ...data, updatedAt: new Date() }).where(eq(surveys.id, id));
  return true;
}

// ─── Survey Questions ─────────────────────────────────────────────────────────

export async function getSurveyQuestions(surveyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(surveyQuestions)
    .where(and(
      eq(surveyQuestions.surveyId, surveyId),
      eq(surveyQuestions.isActive, true),
      ne(surveyQuestions.questionType, "end_message"),
    ))
    .orderBy(surveyQuestions.sortOrder);
}

/** Returns the end_message question text for a survey, if one exists. */
export async function getSurveyEndMessage(surveyId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ text: surveyQuestions.questionText })
    .from(surveyQuestions)
    .where(and(
      eq(surveyQuestions.surveyId, surveyId),
      eq(surveyQuestions.isActive, true),
      eq(surveyQuestions.questionType, "end_message"),
    ))
    .limit(1);
  return rows[0]?.text ?? null;
}

export async function createSurveyQuestion(data: InsertSurveyQuestion) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(surveyQuestions).values(data).$returningId();
  const [q] = await db.select().from(surveyQuestions).where(eq(surveyQuestions.id, result.id));
  return q ?? null;
}

export async function updateSurveyQuestion(id: number, data: Partial<InsertSurveyQuestion>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(surveyQuestions).set({ ...data, updatedAt: new Date() }).where(eq(surveyQuestions.id, id));
  return true;
}

export async function deleteSurveyQuestion(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(surveyQuestions).set({ isActive: false, updatedAt: new Date() }).where(eq(surveyQuestions.id, id));
  return true;
}

export async function reorderSurveyQuestions(questionIds: number[]) {
  const db = await getDb();
  if (!db) return false;
  for (let i = 0; i < questionIds.length; i++) {
    await db
      .update(surveyQuestions)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(surveyQuestions.id, questionIds[i]));
  }
  return true;
}

// ─── Survey Links ─────────────────────────────────────────────────────────────

export async function createSurveyLink(data: InsertSurveyLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surveyLinks).values(data);
  const result = await db.select().from(surveyLinks).where(eq(surveyLinks.token, data.token)).limit(1);
  return result[0]!;
}

export async function getSurveyLinkByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(surveyLinks)
    .where(and(eq(surveyLinks.token, token), eq(surveyLinks.isActive, true)))
    .limit(1);
  return result[0];
}

export async function getSurveyLinksBySurvey(surveyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyLinks).where(eq(surveyLinks.surveyId, surveyId));
}

export async function deactivateSurveyLink(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveyLinks).set({ isActive: false }).where(eq(surveyLinks.id, id));
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function getContactsByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.organizationId, organizationId)).orderBy(desc(contacts.createdAt));
}

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(contacts).values(data).$returningId();
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, result.id));
  return contact ?? null;
}

export async function bulkCreateContacts(data: InsertContact[]) {
  const db = await getDb();
  if (!db || data.length === 0) return 0;
  await db.insert(contacts).values(data);
  return data.length;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(contacts).set({ ...data, updatedAt: new Date() }).where(eq(contacts.id, id));
  return true;
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(contacts).where(eq(contacts.id, id));
  return true;
}

export async function countContactsByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: count() }).from(contacts).where(eq(contacts.organizationId, organizationId));
  return row?.count ?? 0;
}

// ─── Audiences ────────────────────────────────────────────────────────────────

export async function getAudiencesByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(audiences).where(eq(audiences.organizationId, organizationId)).orderBy(desc(audiences.createdAt));
}

export async function createAudience(data: InsertAudience) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(audiences).values(data).$returningId();
  const [audience] = await db.select().from(audiences).where(eq(audiences.id, result.id));
  return audience ?? null;
}

export async function deleteAudience(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(audienceContacts).where(eq(audienceContacts.audienceId, id));
  await db.delete(audiences).where(eq(audiences.id, id));
  return true;
}

export async function addContactsToAudience(audienceId: number, contactIds: number[]) {
  const db = await getDb();
  if (!db) return false;
  const values = contactIds.map((contactId) => ({ audienceId, contactId }));
  if (values.length > 0) await db.insert(audienceContacts).values(values);
  return true;
}

export async function removeContactFromAudience(audienceId: number, contactId: number) {
  const db = await getDb();
  if (!db) return false;
  await db
    .delete(audienceContacts)
    .where(and(eq(audienceContacts.audienceId, audienceId), eq(audienceContacts.contactId, contactId)));
  return true;
}

export async function getAudienceContacts(audienceId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ contact: contacts })
    .from(audienceContacts)
    .innerJoin(contacts, eq(audienceContacts.contactId, contacts.id))
    .where(eq(audienceContacts.audienceId, audienceId));
  return rows.map((r) => r.contact);
}

export async function countAudienceContacts(audienceId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: count() })
    .from(audienceContacts)
    .where(eq(audienceContacts.audienceId, audienceId));
  return row?.count ?? 0;
}

// ─── Respondents ──────────────────────────────────────────────────────────────

export async function createRespondent(data: InsertRespondent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(respondents).values(data);
  const result = await db
    .select()
    .from(respondents)
    .where(eq(respondents.organizationId, data.organizationId))
    .orderBy(desc(respondents.createdAt))
    .limit(1);
  return result[0]!;
}

export async function getRespondentsByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(respondents).where(eq(respondents.organizationId, organizationId)).orderBy(desc(respondents.createdAt));
}

export async function getRespondentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(respondents).where(eq(respondents.id, id)).limit(1);
  return result[0];
}

export async function getAllRespondents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(respondents).orderBy(desc(respondents.createdAt));
}

// ─── Survey Responses ─────────────────────────────────────────────────────────

export async function createSurveyResponse(data: InsertSurveyResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surveyResponses).values(data);
  const result = await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, data.surveyId))
    .orderBy(desc(surveyResponses.startedAt))
    .limit(1);
  return result[0]!;
}

export async function getSurveyResponseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id)).limit(1);
  return result[0];
}

export async function getSurveyResponsesByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.organizationId, organizationId))
    .orderBy(desc(surveyResponses.startedAt));
}

export async function getSurveyResponsesBySurvey(surveyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId)).orderBy(desc(surveyResponses.startedAt));
}

export async function completeSurveyResponse(id: number, data?: {
  npsScore?: number;
  csatScore?: number;
  cesScore?: number;
  sentiment?: "promoter" | "passive" | "detractor";
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(surveyResponses)
    .set({ ...data, isComplete: true, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(surveyResponses.id, id));
}

export async function getAllSurveyResponses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveyResponses).orderBy(desc(surveyResponses.startedAt));
}

// ─── Response Answers ─────────────────────────────────────────────────────────

export async function upsertResponseAnswer(
  surveyResponseId: number,
  questionKey: string,
  value: unknown
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(responseAnswers)
    .where(and(eq(responseAnswers.surveyResponseId, surveyResponseId), eq(responseAnswers.questionKey, questionKey)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0]!;
    const historyEntry: InsertResponseAnswerHistory = {
      responseAnswerId: current.id,
      surveyResponseId,
      questionKey,
      value: current.value,
      version: current.version,
    };
    await db.insert(responseAnswerHistory).values(historyEntry);
    await db.update(responseAnswers).set({ value, version: current.version + 1 }).where(eq(responseAnswers.id, current.id));
  } else {
    const newAnswer: InsertResponseAnswer = { surveyResponseId, questionKey, value, version: 1 };
    await db.insert(responseAnswers).values(newAnswer);
  }
}

export async function getAnswersByResponse(surveyResponseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(responseAnswers).where(eq(responseAnswers.surveyResponseId, surveyResponseId));
}

export async function getAnswerHistory(responseAnswerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(responseAnswerHistory)
    .where(eq(responseAnswerHistory.responseAnswerId, responseAnswerId))
    .orderBy(desc(responseAnswerHistory.recordedAt));
}

// ─── Survey Invitations ───────────────────────────────────────────────────────

export async function createSurveyInvitation(data: InsertSurveyInvitation): Promise<SurveyInvitation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surveyInvitations).values(data);
  const [row] = await db
    .select()
    .from(surveyInvitations)
    .where(eq(surveyInvitations.inviteToken, data.inviteToken!))
    .limit(1);
  return row!;
}

export async function getInvitationByToken(token: string): Promise<SurveyInvitation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(surveyInvitations).where(eq(surveyInvitations.inviteToken, token)).limit(1);
  return row;
}

export async function getInvitationsByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: surveyInvitations.id,
      recipientEmail: surveyInvitations.recipientEmail,
      recipientName: surveyInvitations.recipientName,
      status: surveyInvitations.status,
      sentAt: surveyInvitations.sentAt,
      openedAt: surveyInvitations.openedAt,
      completedAt: surveyInvitations.completedAt,
      inviteToken: surveyInvitations.inviteToken,
      personalMessage: surveyInvitations.personalMessage,
      surveyTitle: surveys.title,
      surveyId: surveyInvitations.surveyId,
      channel: surveyInvitations.channel,
      createdAt: surveyInvitations.createdAt,
    })
    .from(surveyInvitations)
    .innerJoin(surveys, eq(surveyInvitations.surveyId, surveys.id))
    .where(eq(surveyInvitations.organizationId, organizationId))
    .orderBy(desc(surveyInvitations.createdAt));
}

export async function getInvitationsBySurvey(organizationId: number, surveyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: surveyInvitations.id,
      recipientEmail: surveyInvitations.recipientEmail,
      recipientName: surveyInvitations.recipientName,
      status: surveyInvitations.status,
      sentAt: surveyInvitations.sentAt,
      openedAt: surveyInvitations.openedAt,
      completedAt: surveyInvitations.completedAt,
      inviteToken: surveyInvitations.inviteToken,
      channel: surveyInvitations.channel,
      createdAt: surveyInvitations.createdAt,
    })
    .from(surveyInvitations)
    .where(
      and(
        eq(surveyInvitations.organizationId, organizationId),
        eq(surveyInvitations.surveyId, surveyId)
      )
    )
    .orderBy(desc(surveyInvitations.createdAt));
}

export async function updateInvitationStatus(
  token: string,
  status: SurveyInvitation["status"],
  extra?: { openedAt?: Date; completedAt?: Date; surveyResponseId?: number }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveyInvitations).set({ status, ...extra }).where(eq(surveyInvitations.inviteToken, token));
}

export async function updateInvitationSentStatus(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveyInvitations).set({ status: "sent", sentAt: new Date() }).where(eq(surveyInvitations.id, id));
}

export async function markInvitationFailed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(surveyInvitations).set({ status: "failed" }).where(eq(surveyInvitations.id, id));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAdminOverviewMetrics() {
  const db = await getDb();
  if (!db) return null;
  const [totalOrgsRow, totalRespondentsRow, totalResponsesRow, completedResponsesRow, totalSurveysRow] =
    await Promise.all([
      db.select({ count: count() }).from(organizations).then(r => r[0]),
      db.select({ count: count() }).from(respondents).then(r => r[0]),
      db.select({ count: count() }).from(surveyResponses).then(r => r[0]),
      db.select({ count: count() }).from(surveyResponses).where(eq(surveyResponses.isComplete, true)).then(r => r[0]),
      db.select({ count: count() }).from(surveys).then(r => r[0]),
    ]);
  const totalResponses = totalResponsesRow?.count ?? 0;
  const completedResponses = completedResponsesRow?.count ?? 0;
  return {
    totalOrganizations: totalOrgsRow?.count ?? 0,
    totalRespondents: totalRespondentsRow?.count ?? 0,
    totalResponses,
    completedResponses,
    totalSurveys: totalSurveysRow?.count ?? 0,
    completionRate:
      totalResponses > 0
        ? Math.round((completedResponses / totalResponses) * 100)
        : 0,
  };
}

export async function getResponseTrend(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db
    .select({
      date: sql<string>`DATE(MIN(${surveyResponses.startedAt}))`,
      count: count(),
    })
    .from(surveyResponses)
    .where(gte(surveyResponses.startedAt, since))
    .groupBy(sql`DATE(${surveyResponses.startedAt})`)
    .orderBy(sql`DATE(MIN(${surveyResponses.startedAt}))`);
}

export async function getOrgOverviewMetrics(organizationId: number) {
  const db = await getDb();
  if (!db) return null;
  const [totalRespondents] = await db.select({ count: count() }).from(respondents).where(eq(respondents.organizationId, organizationId));
  const [totalResponses] = await db.select({ count: count() }).from(surveyResponses).where(eq(surveyResponses.organizationId, organizationId));
  const [completedResponses] = await db
    .select({ count: count() })
    .from(surveyResponses)
    .where(and(eq(surveyResponses.organizationId, organizationId), eq(surveyResponses.isComplete, true)));
  const [orgSurveys] = await db.select({ count: count() }).from(surveys).where(eq(surveys.organizationId, organizationId));
  const npsRows = await db
    .select({ npsScore: surveyResponses.npsScore })
    .from(surveyResponses)
    .where(and(eq(surveyResponses.organizationId, organizationId), eq(surveyResponses.isComplete, true)));
  const npsValues = npsRows.map((r) => r.npsScore).filter((v): v is number => v !== null && v !== undefined);
  const avgNps = npsValues.length > 0 ? npsValues.reduce((a, b) => a + b, 0) / npsValues.length : null;
  return {
    totalRespondents: totalRespondents?.count ?? 0,
    totalResponses: totalResponses?.count ?? 0,
    completedResponses: completedResponses?.count ?? 0,
    totalSurveys: orgSurveys?.count ?? 0,
    completionRate:
      (totalResponses?.count ?? 0) > 0
        ? Math.round(((completedResponses?.count ?? 0) / (totalResponses?.count ?? 1)) * 100)
        : 0,
    avgNps,
  };
}

export async function getOrgResponseTrend(organizationId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db
    .select({
      date: sql<string>`DATE(MIN(${surveyResponses.startedAt}))`,
      count: count(),
    })
    .from(surveyResponses)
    .where(and(eq(surveyResponses.organizationId, organizationId), gte(surveyResponses.startedAt, since)))
    .groupBy(sql`DATE(${surveyResponses.startedAt})`)
    .orderBy(sql`DATE(MIN(${surveyResponses.startedAt}))`);
}

export async function getOrgNpsSummary(organizationId: number) {
  const db = await getDb();
  if (!db) return { promoters: 0, passives: 0, detractors: 0, total: 0, npsScore: 0 };
  const rows = await db
    .select({ sentiment: surveyResponses.sentiment, cnt: count() })
    .from(surveyResponses)
    .where(
      and(
        eq(surveyResponses.organizationId, organizationId),
        eq(surveyResponses.isComplete, true),
        sql`${surveyResponses.sentiment} IS NOT NULL`
      )
    )
    .groupBy(surveyResponses.sentiment);
  let promoters = 0, passives = 0, detractors = 0;
  for (const row of rows) {
    if (row.sentiment === "promoter") promoters = row.cnt;
    else if (row.sentiment === "passive") passives = row.cnt;
    else if (row.sentiment === "detractor") detractors = row.cnt;
  }
  const total = promoters + passives + detractors;
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
  return { promoters, passives, detractors, total, npsScore };
}

export async function getOrgResponseFeed(organizationId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: surveyResponses.id,
      npsScore: surveyResponses.npsScore,
      csatScore: surveyResponses.csatScore,
      cesScore: surveyResponses.cesScore,
      sentiment: surveyResponses.sentiment,
      isComplete: surveyResponses.isComplete,
      completedAt: surveyResponses.completedAt,
      surveyTitle: surveys.title,
    })
    .from(surveyResponses)
    .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
    .where(and(eq(surveyResponses.organizationId, organizationId), eq(surveyResponses.isComplete, true)))
    .orderBy(desc(surveyResponses.completedAt))
    .limit(limit);
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalOrgs: 0, totalUsers: 0, totalSurveys: 0, totalResponses: 0 };
  const [orgRow] = await db.select({ count: count() }).from(organizations);
  const [userRow] = await db.select({ count: count() }).from(users);
  const [surveyRow] = await db.select({ count: count() }).from(surveys);
  const [responseRow] = await db.select({ count: count() }).from(surveyResponses).where(eq(surveyResponses.isComplete, true));
  return {
    totalOrgs: orgRow?.count ?? 0,
    totalUsers: userRow?.count ?? 0,
    totalSurveys: surveyRow?.count ?? 0,
    totalResponses: responseRow?.count ?? 0,
  };
}

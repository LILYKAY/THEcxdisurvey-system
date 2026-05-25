import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { type MySql2Database, drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertOrganization,
  InsertRespondent,
  InsertResponseAnswer,
  InsertResponseAnswerHistory,
  InsertSurveyLink,
  InsertSurveyResponse,
  InsertUser,
  Organization,
  organizations,
  respondents,
  responseAnswerHistory,
  responseAnswers,
  surveyLinks,
  surveyResponses,
  surveys,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: MySql2Database | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Use a connection pool for TiDB Serverless compatibility.
      // A raw connection string creates a single connection that TiDB may drop;
      // a pool keeps connections alive and reconnects automatically.
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
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
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

export async function updateOrganization(
  id: number,
  data: Partial<InsertOrganization>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(organizations).set(data).where(eq(organizations.id, id));
}

// ─── Surveys ──────────────────────────────────────────────────────────────────

export async function getSurveysByOrg(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surveys).where(eq(surveys.organizationId, organizationId));
}

export async function getSurveyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
  return result[0];
}

export async function createSurvey(data: {
  organizationId: number;
  formKey: "current_customers" | "dropped_customers" | "repeat_trial" | "single_trial";
  title: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surveys).values(data);
  const result = await db
    .select()
    .from(surveys)
    .where(
      and(
        eq(surveys.organizationId, data.organizationId),
        eq(surveys.formKey, data.formKey)
      )
    )
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
  const allSurveys = await db
    .select()
    .from(surveys)
    .orderBy(desc(surveys.createdAt));
  const results = await Promise.all(
    allSurveys.map(async (survey) => {
      const org = await db!.select().from(organizations).where(eq(organizations.id, survey.organizationId)).limit(1);
      const links = await db!.select().from(surveyLinks).where(eq(surveyLinks.surveyId, survey.id));
      const responses = await db!
        .select({ cnt: count() })
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, survey.id));
      const completedResponses = await db!
        .select({ cnt: count() })
        .from(surveyResponses)
        .where(and(eq(surveyResponses.surveyId, survey.id), eq(surveyResponses.status, "completed")));
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

// ─── Survey Links ─────────────────────────────────────────────────────────────

export async function createSurveyLink(data: InsertSurveyLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surveyLinks).values(data);
  const result = await db
    .select()
    .from(surveyLinks)
    .where(eq(surveyLinks.token, data.token))
    .limit(1);
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
  return db
    .select()
    .from(respondents)
    .where(eq(respondents.organizationId, organizationId))
    .orderBy(desc(respondents.createdAt));
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
    .where(
      and(
        eq(surveyResponses.respondentId, data.respondentId),
        eq(surveyResponses.surveyId, data.surveyId)
      )
    )
    .orderBy(desc(surveyResponses.startedAt))
    .limit(1);
  return result[0]!;
}

export async function getSurveyResponseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.id, id))
    .limit(1);
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
  return db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(desc(surveyResponses.startedAt));
}

export async function getSurveyResponsesByRespondent(respondentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.respondentId, respondentId))
    .orderBy(desc(surveyResponses.startedAt));
}

export async function completeSurveyResponse(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(surveyResponses)
    .set({ status: "completed", completedAt: new Date() })
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

  // Check if an answer already exists
  const existing = await db
    .select()
    .from(responseAnswers)
    .where(
      and(
        eq(responseAnswers.surveyResponseId, surveyResponseId),
        eq(responseAnswers.questionKey, questionKey)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0]!;
    // Archive the current version to history before updating
    const historyEntry: InsertResponseAnswerHistory = {
      responseAnswerId: current.id,
      surveyResponseId,
      questionKey,
      value: current.value,
      version: current.version,
    };
    await db.insert(responseAnswerHistory).values(historyEntry);

    // Update the current answer
    await db
      .update(responseAnswers)
      .set({ value, version: current.version + 1 })
      .where(eq(responseAnswers.id, current.id));
  } else {
    // Insert new answer
    const newAnswer: InsertResponseAnswer = {
      surveyResponseId,
      questionKey,
      value,
      version: 1,
    };
    await db.insert(responseAnswers).values(newAnswer);
  }
}

export async function getAnswersByResponse(surveyResponseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(responseAnswers)
    .where(eq(responseAnswers.surveyResponseId, surveyResponseId));
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

export async function getFullAnswerHistoryByResponse(surveyResponseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(responseAnswerHistory)
    .where(eq(responseAnswerHistory.surveyResponseId, surveyResponseId))
    .orderBy(desc(responseAnswerHistory.recordedAt));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAdminOverviewMetrics() {
  const db = await getDb();
  if (!db) return null;

  const [totalOrgs] = await db.select({ count: count() }).from(organizations);
  const [totalRespondents] = await db.select({ count: count() }).from(respondents);
  const [totalResponses] = await db.select({ count: count() }).from(surveyResponses);
  const [completedResponses] = await db
    .select({ count: count() })
    .from(surveyResponses)
    .where(eq(surveyResponses.status, "completed"));
  const [totalSurveys] = await db.select({ count: count() }).from(surveys);

  return {
    totalOrganizations: totalOrgs?.count ?? 0,
    totalRespondents: totalRespondents?.count ?? 0,
    totalResponses: totalResponses?.count ?? 0,
    completedResponses: completedResponses?.count ?? 0,
    totalSurveys: totalSurveys?.count ?? 0,
    completionRate:
      (totalResponses?.count ?? 0) > 0
        ? Math.round(((completedResponses?.count ?? 0) / (totalResponses?.count ?? 1)) * 100)
        : 0,
  };
}

export async function getResponseTrend(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${surveyResponses.startedAt})`,
      count: count(),
    })
    .from(surveyResponses)
    .where(gte(surveyResponses.startedAt, since))
    .groupBy(sql`DATE(${surveyResponses.startedAt})`)
    .orderBy(sql`DATE(${surveyResponses.startedAt})`);

  return rows;
}

export async function getResponsesByFormKey() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      formKey: surveys.formKey,
      count: count(),
    })
    .from(surveyResponses)
    .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
    .groupBy(surveys.formKey);

  return rows;
}

export async function getOrgOverviewMetrics(organizationId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalRespondents] = await db
    .select({ count: count() })
    .from(respondents)
    .where(eq(respondents.organizationId, organizationId));

  const [totalResponses] = await db
    .select({ count: count() })
    .from(surveyResponses)
    .where(eq(surveyResponses.organizationId, organizationId));

  const [completedResponses] = await db
    .select({ count: count() })
    .from(surveyResponses)
    .where(
      and(
        eq(surveyResponses.organizationId, organizationId),
        eq(surveyResponses.status, "completed")
      )
    );

  const orgSurveys = await db
    .select({ count: count() })
    .from(surveys)
    .where(eq(surveys.organizationId, organizationId));

  return {
    totalRespondents: totalRespondents?.count ?? 0,
    totalResponses: totalResponses?.count ?? 0,
    completedResponses: completedResponses?.count ?? 0,
    totalSurveys: orgSurveys[0]?.count ?? 0,
    completionRate:
      (totalResponses?.count ?? 0) > 0
        ? Math.round(((completedResponses?.count ?? 0) / (totalResponses?.count ?? 1)) * 100)
        : 0,
  };
}

export async function getOrgResponseTrend(organizationId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      date: sql<string>`DATE(${surveyResponses.startedAt})`,
      count: count(),
    })
    .from(surveyResponses)
    .where(
      and(
        eq(surveyResponses.organizationId, organizationId),
        gte(surveyResponses.startedAt, since)
      )
    )
    .groupBy(sql`DATE(${surveyResponses.startedAt})`)
    .orderBy(sql`DATE(${surveyResponses.startedAt})`);
}

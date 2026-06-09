import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB module ───────────────────────────────────────────────────────────
vi.mock("./email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendSurveyInvitationEmail: vi.fn().mockResolvedValue(true),
  sendReportEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUserRole: vi.fn(),
  updateUserPassword: vi.fn(),
  getAllUsers: vi.fn(),
  createOrganization: vi.fn(),
  getAllOrganizations: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationsByOwner: vi.fn(),
  updateOrganization: vi.fn(),
  setOrganizationRestriction: vi.fn(),
  addUserToOrganization: vi.fn(),
  getOrgMembers: vi.fn(),
  createSurvey: vi.fn(),
  getSurveysByOrg: vi.fn(),
  getSurveyById: vi.fn(),
  getAllSurveys: vi.fn(),
  getAllSurveysWithStats: vi.fn(),
  updateSurveyStatus: vi.fn(),
  createSurveyLink: vi.fn(),
  getSurveyLinksBySurvey: vi.fn(),
  getSurveyLinkByToken: vi.fn(),
  createRespondent: vi.fn(),
  getRespondentById: vi.fn(),
  getRespondentsByOrg: vi.fn(),
  getAllRespondents: vi.fn(),
  createSurveyResponse: vi.fn(),
  getSurveyResponseById: vi.fn(),
  getSurveyResponsesBySurvey: vi.fn(),
  getSurveyResponsesByOrg: vi.fn(),
  getAllSurveyResponses: vi.fn(),
  upsertResponseAnswer: vi.fn(),
  completeSurveyResponse: vi.fn(),
  getAnswersByResponse: vi.fn(),
  getAdminOverviewMetrics: vi.fn(),
  getResponseTrend: vi.fn(),
  getOrgOverviewMetrics: vi.fn(),
  getOrgResponseTrend: vi.fn(),
  getOrgNpsSummary: vi.fn(),
  getOrgResponseFeed: vi.fn(),
  getOrgInvitations: vi.fn(),
  getSurveyQuestions: vi.fn(),
  createSurveyQuestion: vi.fn(),
  updateSurveyQuestion: vi.fn(),
  deleteSurveyQuestion: vi.fn(),
  reorderSurveyQuestions: vi.fn(),
  getContactsByOrg: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
  bulkImportContacts: vi.fn(),
  getAudiencesByOrg: vi.fn(),
  createAudience: vi.fn(),
  deleteAudience: vi.fn(),
  getAudienceContacts: vi.fn(),
  addContactsToAudience: vi.fn(),
  removeContactFromAudience: vi.fn(),
  getEmailBranding: vi.fn(),
  upsertEmailBranding: vi.fn(),
  getMfaSettings: vi.fn(),
  upsertMfaSettings: vi.fn(),
  createMfaOtpCode: vi.fn(),
  verifyMfaOtpCode: vi.fn(),
  createPasswordResetToken: vi.fn(),
  getPasswordResetToken: vi.fn(),
  markPasswordResetTokenUsed: vi.fn(),
}));

vi.mock("./_core/pdf", () => ({
  generatePdfFromHtml: vi.fn().mockResolvedValue(Buffer.from("pdf")),
  buildSurveyReportHtml: vi.fn().mockReturnValue("<html>report</html>"),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
    ...overrides,
  };
}

const adminUser = {
  id: 1,
  openId: "admin-open-id",
  name: "Admin",
  email: "admin@test.com",
  role: "admin" as const,
  loginMethod: "email",
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const regularUser = {
  id: 2,
  openId: "user-open-id",
  name: "Regular User",
  email: "user@test.com",
  role: "user" as const,
  loginMethod: "email",
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null when unauthenticated", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user when authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: adminUser }));
    const result = await caller.auth.me();
    expect(result).toMatchObject({ email: "admin@test.com", role: "admin" });
  });
});

describe("org.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no orgs", async () => {
    const { getOrganizationsByOwner } = await import("./db");
    vi.mocked(getOrganizationsByOwner).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx({ user: regularUser }));
    const result = await caller.org.list();
    expect(result).toEqual([]);
  });

  it("throws when unauthenticated", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.org.list()).rejects.toThrow();
  });
});

describe("admin.overviewMetrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: regularUser }));
    await expect(caller.admin.overviewMetrics()).rejects.toThrow();
  });

  it("returns metrics for admin", async () => {
    const { getAdminOverviewMetrics } = await import("./db");
    vi.mocked(getAdminOverviewMetrics).mockResolvedValue({
      totalOrganizations: 5,
      totalRespondents: 100,
      totalResponses: 80,
      completedResponses: 60,
      totalSurveys: 20,
      completionRate: 75,
    });
    const caller = appRouter.createCaller(makeCtx({ user: adminUser }));
    const result = await caller.admin.overviewMetrics();
    expect(result?.totalOrganizations).toBe(5);
  });
});

describe("surveys.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns surveys for org member", async () => {
    const { getSurveysByOrg, getOrganizationById } = await import("./db");
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      industry: null,
      country: null,
      ownerId: 2,
      isRestricted: false,
      restrictionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getSurveysByOrg).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx({ user: regularUser }));
    const result = await caller.surveys.list({ organizationId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("contacts.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns contacts for org", async () => {
    const { getContactsByOrg, getOrganizationById } = await import("./db");
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      industry: null,
      country: null,
      ownerId: 2,
      isRestricted: false,
      restrictionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getContactsByOrg).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx({ user: regularUser }));
    const result = await caller.contacts.list({ organizationId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("audiences.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns audiences for org", async () => {
    const { getAudiencesByOrg, getOrganizationById } = await import("./db");
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      industry: null,
      country: null,
      ownerId: 2,
      isRestricted: false,
      restrictionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getAudiencesByOrg).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx({ user: regularUser }));
    const result = await caller.audiences.list({ organizationId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("public.getSurveyByToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NOT_FOUND for invalid token", async () => {
    const { getSurveyLinkByToken } = await import("./db");
    vi.mocked(getSurveyLinkByToken).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.public.getSurveyByToken({ token: "invalid" })).rejects.toThrow();
  });
});

describe("admin.allOrgs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx({ user: regularUser }));
    await expect(caller.admin.allOrgs()).rejects.toThrow();
  });

  it("returns orgs for admin", async () => {
    const { getAllOrganizations } = await import("./db");
    vi.mocked(getAllOrganizations).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx({ user: adminUser }));
    const result = await caller.admin.allOrgs();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects login for non-existent email", async () => {
    const { getUserByEmail } = await import("./db");
    vi.mocked(getUserByEmail).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.auth.login({ email: "nobody@example.com", password: "password123" })
    ).rejects.toThrow();
  });
});

describe("auth.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects registration when email already exists", async () => {
    const { getUserByEmail } = await import("./db");
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "existing",
      name: "Existing",
      email: "taken@example.com",
      loginMethod: "email",
      passwordHash: "$2b$12$hash",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.auth.register({ name: "Test", email: "taken@example.com", password: "password123" })
    ).rejects.toThrow();
  });
});

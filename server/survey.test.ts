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
  updateUserRole: vi.fn(),
  createOrganization: vi.fn(),
  getAllOrganizations: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationsByOwner: vi.fn(),
  updateOrganization: vi.fn(),
  createSurvey: vi.fn(),
  getSurveysByOrg: vi.fn(),
  getSurveyById: vi.fn(),
  getAllSurveys: vi.fn(),
  createSurveyLink: vi.fn(),
  getSurveyLinksBySurvey: vi.fn(),
  getSurveyLinkByToken: vi.fn(),
  deactivateSurveyLink: vi.fn(),
  createRespondent: vi.fn(),
  getRespondentById: vi.fn(),
  getRespondentsByOrg: vi.fn(),
  getAllRespondents: vi.fn(),
  createSurveyResponse: vi.fn(),
  getSurveyResponseById: vi.fn(),
  getSurveyResponsesByRespondent: vi.fn(),
  getSurveyResponsesBySurvey: vi.fn(),
  getSurveyResponsesByOrg: vi.fn(),
  getAllSurveyResponses: vi.fn(),
  upsertResponseAnswer: vi.fn(),
  completeSurveyResponse: vi.fn(),
  getAnswersByResponse: vi.fn(),
  getAnswerHistory: vi.fn(),
  getFullAnswerHistoryByResponse: vi.fn(),
  getResponsesByFormKey: vi.fn(),
  getAdminOverviewMetrics: vi.fn(),
  getResponseTrend: vi.fn(),
  getOrgOverviewMetrics: vi.fn(),
  getOrgResponseTrend: vi.fn(),
  getUserByEmail: vi.fn(),
  getAllSurveysWithStats: vi.fn(),
  getCustomQuestions: vi.fn(),
  createCustomQuestion: vi.fn(),
  updateCustomQuestion: vi.fn(),
  deleteCustomQuestion: vi.fn(),
  createSurveyInvitation: vi.fn(),
  updateInvitationSentStatus: vi.fn(),
  markInvitationFailed: vi.fn(),
  getInvitationsByOrg: vi.fn(),
  getInvitationBySurveyAndEmail: vi.fn(),
  updateInvitationStatus: vi.fn(),
  countUsers: vi.fn(),
  getPasswordResetToken: vi.fn(),
  createPasswordResetToken: vi.fn(),
  markResetTokenUsed: vi.fn(),
  updateUserPassword: vi.fn(),
}));

// ─── Context factories ────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({ role: "admin" });
}

function makeOrgOwnerCtx(): TrpcContext {
  return makeCtx({ role: "org_owner" });
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Import mocked db ─────────────────────────────────────────────────────────

import * as db from "./db";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.id).toBe(1);
    expect(result?.role).toBe("user");
  });

  it("returns null when unauthenticated", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("forms.list", () => {
  it("returns all 4 survey form definitions", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const forms = await caller.forms.list();
    expect(forms).toHaveLength(4);
    const keys = forms.map((f) => f.formKey);
    expect(keys).toContain("current_customers");
    expect(keys).toContain("dropped_customers");
    expect(keys).toContain("repeat_trial");
    expect(keys).toContain("single_trial");
  });

  it("each form has a title and question count", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const forms = await caller.forms.list();
    for (const form of forms) {
      expect(form.title).toBeTruthy();
      expect(form.questionCount).toBeGreaterThan(0);
    }
  });

  it("forms.get returns full form with questions", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const form = await caller.forms.get({ formKey: "current_customers" });
    expect(form.questions.length).toBeGreaterThan(0);
    for (const q of form.questions) {
      expect(q.key).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(["open_ended", "single_choice", "multiple_choice", "checkboxes"]).toContain(q.type);
    }
  });
});

describe("organizations.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admin to create organization and auto-provisions 4 surveys", async () => {
    vi.mocked(db.createOrganization).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      description: null,
      industry: null,
      country: null,
      ownerId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.createSurvey).mockResolvedValue({
      id: 1,
      organizationId: 1,
      formKey: "current_customers",
      title: "Current Customers Survey",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.createSurveyLink).mockResolvedValue({
      id: 1,
      surveyId: 1,
      token: "testtoken",
      label: "Default Link",
      isActive: true,
      createdAt: new Date(),
      expiresAt: null,
    });

    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.organizations.create({ name: "Test Org", slug: "test-org" });
    expect(result.id).toBe(1);
    expect(db.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test Org", slug: "test-org" })
    );
    // Should auto-provision 4 surveys
    expect(db.createSurvey).toHaveBeenCalledTimes(4);
    expect(db.createSurveyLink).toHaveBeenCalledTimes(4);
  });

  it("rejects non-admin from creating organization", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.organizations.create({ name: "Test", slug: "test" })
    ).rejects.toThrow();
  });
});

describe("admin.updateUserRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admin to update user role", async () => {
    vi.mocked(db.updateUserRole).mockResolvedValue(undefined);
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.updateUserRole({ userId: 2, role: "org_owner" });
    expect(result.success).toBe(true);
    expect(db.updateUserRole).toHaveBeenCalledWith(2, "org_owner");
  });

  it("rejects non-admin from updating roles", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.updateUserRole({ userId: 2, role: "admin" })
    ).rejects.toThrow();
  });
});

describe("public.resolveSurveyLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for invalid token", async () => {
    vi.mocked(db.getSurveyLinkByToken).mockResolvedValue(undefined);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.resolveSurveyLink({ token: "invalid-token" })
    ).rejects.toThrow();
  });

  it("resolves a valid survey link", async () => {
    vi.mocked(db.getSurveyLinkByToken).mockResolvedValue({
      id: 1,
      token: "abc123",
      surveyId: 1,
      isActive: true,
      createdAt: new Date(),
      expiresAt: null,
    });
    vi.mocked(db.getSurveyById).mockResolvedValue({
      id: 1,
      organizationId: 1,
      formKey: "current_customers",
      title: "Customer Survey",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getOrganizationById).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      description: null,
      industry: null,
      country: null,
      ownerId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getCustomQuestions).mockResolvedValue([]);

    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.resolveSurveyLink({ token: "abc123" });
    expect(result.survey.formKey).toBe("current_customers");
    expect(result.form.formKey).toBe("current_customers");
  });
});

describe("surveys.exportCsv", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.surveys.exportCsv({ surveyId: 1 })).rejects.toThrow();
  });

  it("returns CSV data for authenticated user", async () => {
    vi.mocked(db.getSurveyById).mockResolvedValue({
      id: 1,
      organizationId: 1,
      formKey: "current_customers",
      title: "Customer Survey",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getSurveyResponsesBySurvey).mockResolvedValue([]);

    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.surveys.exportCsv({ surveyId: 1 });
    expect(result.csv).toBeTruthy();
    expect(result.filename).toContain(".csv");
  });
});

describe("auth.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects registration when email already exists", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
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
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ name: "Test", email: "taken@example.com", password: "password123" })
    ).rejects.toThrow();
  });

  it("rejects registration with password shorter than 8 characters", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ name: "Test", email: "new@example.com", password: "short" })
    ).rejects.toThrow();
  });
});

describe("auth.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects login for non-existent email", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.login({ email: "nobody@example.com", password: "password123" })
    ).rejects.toThrow();
  });

  it("rejects login for user without a password hash (OAuth-only account)", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "user-1",
      name: "Test",
      email: "test@example.com",
      loginMethod: "email",
      passwordHash: null,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.login({ email: "test@example.com", password: "password123" })
    ).rejects.toThrow();
  });
});

describe("org.invitations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invitations list for org owner", async () => {
    vi.mocked(db.getOrganizationById).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      description: null,
      industry: null,
      country: null,
      ownerId: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getInvitationsByOrg).mockResolvedValue([
      {
        id: 1,
        organizationId: 1,
        surveyId: 1,
        recipientEmail: "customer@example.com",
        recipientName: "Customer One",
        personalMessage: null,
        inviteToken: "tok123",
        status: "sent",
        sentAt: new Date(),
        openedAt: null,
        completedAt: null,
        createdAt: new Date(),
      },
    ]);
    const ctx = makeOrgOwnerCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.org.invitations({ organizationId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0]?.recipientEmail).toBe("customer@example.com");
    expect(result[0]?.status).toBe("sent");
  });

  it("rejects unauthenticated access to invitations", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.org.invitations({ organizationId: 1 })).rejects.toThrow();
  });
});

describe("org.emailReport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.org.emailReport({ organizationId: 1, surveyId: 1 })
    ).rejects.toThrow();
  });

  it("returns error when survey not found", async () => {
    vi.mocked(db.getOrganizationById).mockResolvedValue({
      id: 1,
      name: "Test Org",
      slug: "test-org",
      description: null,
      industry: null,
      country: null,
      ownerId: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getSurveyById).mockResolvedValue(undefined);
    const ctx = makeOrgOwnerCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.org.emailReport({ organizationId: 1, surveyId: 99 })
    ).rejects.toThrow();
  });
});

describe("auth.forgotPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success even when email does not exist (prevents enumeration)", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.forgotPassword({
      email: "nobody@example.com",
      origin: "https://example.com",
    });
    expect(result.success).toBe(true);
    // Should NOT create a token when user doesn't exist
    expect(db.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("creates a reset token and sends email when user exists", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 5,
      openId: "user-5",
      name: "Alice",
      email: "alice@example.com",
      loginMethod: "email",
      passwordHash: "$2b$12$hash",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    vi.mocked(db.createPasswordResetToken).mockResolvedValue(undefined);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.forgotPassword({
      email: "alice@example.com",
      origin: "https://app.example.com",
    });
    expect(result.success).toBe(true);
    expect(db.createPasswordResetToken).toHaveBeenCalledWith(
      5,
      expect.any(String),
      expect.any(Date)
    );
  });

  it("rejects invalid email format", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.forgotPassword({ email: "not-an-email", origin: "https://example.com" })
    ).rejects.toThrow();
  });
});

describe("auth.resetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects reset with invalid token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue(null);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.resetPassword({ token: "invalid-token", password: "newpassword123" })
    ).rejects.toThrow();
  });

  it("rejects reset with password shorter than 8 characters", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.resetPassword({ token: "some-token", password: "short" })
    ).rejects.toThrow();
  });

  it("rejects already-used token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 5,
      token: "used-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: new Date(), // already used
      createdAt: new Date(),
    });
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.resetPassword({ token: "used-token", password: "newpassword123" })
    ).rejects.toThrow();
  });

  it("rejects expired token", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 2,
      userId: 5,
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000), // expired
      usedAt: null,
      createdAt: new Date(),
    });
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.resetPassword({ token: "expired-token", password: "newpassword123" })
    ).rejects.toThrow();
  });

  it("updates password and marks token used on valid reset", async () => {
    vi.mocked(db.getPasswordResetToken).mockResolvedValue({
      id: 3,
      userId: 5,
      token: "valid-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);
    vi.mocked(db.markResetTokenUsed).mockResolvedValue(undefined);
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.resetPassword({ token: "valid-token", password: "newpassword123" });
    expect(result.success).toBe(true);
    expect(db.updateUserPassword).toHaveBeenCalledWith(5, expect.any(String));
    expect(db.markResetTokenUsed).toHaveBeenCalledWith(3);
  });
});

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import bcrypt from "bcryptjs";
import {
  addContactsToAudience,
  bulkCreateContacts,
  completeSurveyResponse,
  countContactsByOrg,
  countAudienceContacts,
  createAudience,
  createContact,
  createMfaOtp,
  createOrganization,
  createRespondent,
  createSurveyInvitation,
  createSurveyLink,
  createSurveyQuestion,
  createSurveyRecord,
  createSurveyResponse,
  createPasswordResetToken,
  deactivateSurveyLink,
  deleteAudience,
  deleteContact,
  deleteSurveyQuestion,
  getAdminOverviewMetrics,
  getAllOrganizations,
  getAllRespondents,
  getAllSurveyResponses,
  getAllSurveys,
  getAllSurveysWithStats,
  getAllUsers,
  getAnswersByResponse,
  getAudienceContacts,
  getAudiencesByOrg,
  getContactsByOrg,
  getEmailBranding,
  getInvitationByToken,
  getInvitationsByOrg,
  getInvitationsBySurvey,
  getMfaSettings,
  getOrganizationById,
  getOrganizationsByOwner,
  getOrgNpsSummary,
  getOrgOverviewMetrics,
  getOrgResponseFeed,
  getOrgResponseTrend,
  getPasswordResetToken,
  getRespondentById,
  getRespondentsByOrg,
  getResponseTrend,
  getSurveyById,
  getSurveyLinkByToken,
  getSurveyLinksBySurvey,
  getSurveyEndMessage,
  getSurveyQuestions,
  getSurveyResponseById,
  getSurveyResponsesByOrg,
  getSurveyResponsesBySurvey,
  getSurveysByOrg,
  getUserByEmail,
  getUserById,
  markInvitationFailed,
  markResetTokenUsed,
  removeContactFromAudience,
  reorderSurveyQuestions,
  setOrganizationRestriction,
  updateContact,
  updateInvitationSentStatus,
  updateInvitationStatus,
  updateOrganization,
  updateSurvey,
  updateSurveyQuestion,
  updateUserPassword,
  updateUserProfile,
  updateUserRole,
  upsertEmailBranding,
  upsertMfaSettings,
  upsertResponseAnswer,
  upsertUser,
  verifyMfaOtp,
  countUsers,
  createOrgManagerInvite,
  getOrgManagerInviteByToken,
  acceptOrgManagerInvite,
  getOrgManagerInvitesByOrg,
  getOrgManagersByOrg,
  createOrgManager,
  revokeOrgManager,
} from "./db";
import { sendSurveyInvitationEmail, sendReportEmail, sendPasswordResetEmail } from "./email";
import { generatePdfFromHtml, buildSurveyReportHtml } from "./pdf";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const orgOwnerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "org_owner" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Organization owner access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ?? null),

    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
        const isFirstUser = (await countUsers()) === 0;
        const passwordHash = await hashPassword(input.password);
        const openId = `local_${nanoid(16)}`;
        await upsertUser({ openId, name: input.name, email: input.email, passwordHash, loginMethod: "email", role: isFirstUser ? "admin" : "user", lastSignedIn: new Date() });
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS / 1000 });
        return { user };
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string(), rememberMe: z.boolean().optional().default(true) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        // rememberMe = true → 1 year; false → session cookie (expires when browser closes)
        const maxAge = input.rememberMe ? ONE_YEAR_MS / 1000 : undefined;
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, ...(maxAge ? { maxAge } : {}) });
        return { user };
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email(), origin: z.string().url() }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) return { success: true };
        const token = nanoid(48);
        const expiresAt = new Date(Date.now() + 3600000);
        await createPasswordResetToken(user.id, token, expiresAt);
        const resetUrl = `${input.origin}/reset-password?token=${token}`;
        await sendPasswordResetEmail({ to: user.email!, name: user.name ?? "User", resetUrl });
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const record = await getPasswordResetToken(input.token);
        if (!record || record.usedAt || record.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
        const passwordHash = await hashPassword(input.newPassword);
        await updateUserPassword(record.userId, passwordHash);
        await markResetTokenUsed(record.id);
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(1).optional(), email: z.string().email().optional() }))
      .mutation(async ({ input, ctx }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    updatePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set" });
        const valid = await verifyPassword(input.currentPassword, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        const passwordHash = await hashPassword(input.newPassword);
        await updateUserPassword(ctx.user.id, passwordHash);
        return { success: true };
      }),
  }),

  mfa: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getMfaSettings(ctx.user.id);
      return settings ?? { mfaEnabled: false };
    }),
    toggle: protectedProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ input, ctx }) => {
      await upsertMfaSettings(ctx.user.id, input.enabled);
      return { success: true };
    }),
    sendOtp: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "No email on account" });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 600000);
      await createMfaOtp(ctx.user.id, code, expiresAt);
      await sendPasswordResetEmail({ to: user.email, name: user.name ?? "User", resetUrl: `Your OTP code: ${code}` });
      return { success: true };
    }),
    verifyOtp: protectedProcedure.input(z.object({ code: z.string().length(6) })).mutation(async ({ input, ctx }) => {
      const valid = await verifyMfaOtp(ctx.user.id, input.code);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired OTP code" });
      return { success: true };
    }),
  }),

  org: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return getAllOrganizations();
      if (ctx.user.role === "org_manager" && ctx.user.managedOrgId) {
        const org = await getOrganizationById(ctx.user.managedOrgId);
        return org ? [org] : [];
      }
      return getOrganizationsByOwner(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.id);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.id;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return org;
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(), industry: z.string().optional(), country: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await createOrganization({ ...input, ownerId: ctx.user.id });
        await updateUserRole(ctx.user.id, "org_owner");
        return org;
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), industry: z.string().optional(), country: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.id);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateOrganization(id, data);
        return { success: true };
      }),
    overviewMetrics: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.organizationId;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return getOrgOverviewMetrics(input.organizationId);
    }),
    responseTrend: protectedProcedure.input(z.object({ organizationId: z.number(), days: z.number().optional() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.organizationId;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return getOrgResponseTrend(input.organizationId, input.days);
    }),
    npsSummary: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.organizationId;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return getOrgNpsSummary(input.organizationId);
    }),
    responseFeed: protectedProcedure.input(z.object({ organizationId: z.number(), limit: z.number().optional() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.organizationId;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return getOrgResponseFeed(input.organizationId, input.limit);
    }),
    invitations: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.organizationId;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return getInvitationsByOrg(input.organizationId);
    }),
    surveyInvitations: protectedProcedure.input(z.object({ organizationId: z.number(), surveyId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const isOrgManager = ctx.user.role === "org_manager" && ctx.user.managedOrgId === input.organizationId;
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id && !isOrgManager) throw new TRPCError({ code: "FORBIDDEN" });
      return getInvitationsBySurvey(input.organizationId, input.surveyId);
    }),
  }),

  branding: router({
    get: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getEmailBranding(input.organizationId);
    }),
    upsert: protectedProcedure
      .input(z.object({ organizationId: z.number(), logoUrl: z.string().optional(), primaryColor: z.string().optional(), secondaryColor: z.string().optional(), signatureTag: z.string().optional(), usePlatformBranding: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await upsertEmailBranding(input);
        return { success: true };
      }),
  }),

  contacts: router({
    list: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getContactsByOrg(input.organizationId);
    }),
    create: protectedProcedure
      .input(z.object({ organizationId: z.number(), name: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), preferredChannel: z.enum(["email", "whatsapp", "sms"]).optional(), tags: z.array(z.string()).optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const currentCount = await countContactsByOrg(input.organizationId);
        if (currentCount >= 1500) throw new TRPCError({ code: "BAD_REQUEST", message: "Contact limit of 1,500 reached" });
        return createContact({ ...input, tags: input.tags ?? null });
      }),
    bulkImport: protectedProcedure
      .input(z.object({ organizationId: z.number(), contacts: z.array(z.object({ name: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), preferredChannel: z.enum(["email", "whatsapp", "sms"]).optional() })) }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const currentCount = await countContactsByOrg(input.organizationId);
        const remaining = 1500 - currentCount;
        const toInsert = input.contacts.slice(0, remaining).map((c) => ({ ...c, organizationId: input.organizationId, tags: null }));
        const count = await bulkCreateContacts(toInsert);
        return { imported: count, skipped: input.contacts.length - count };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), organizationId: z.number(), name: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), preferredChannel: z.enum(["email", "whatsapp", "sms"]).optional(), tags: z.array(z.string()).optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, organizationId, ...data } = input;
        await updateContact(id, { ...data, tags: data.tags ?? null });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteContact(input.id);
        return { success: true };
      }),
  }),

  audiences: router({
    list: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const auds = await getAudiencesByOrg(input.organizationId);
      return Promise.all(auds.map(async (a) => ({ ...a, contactCount: await countAudienceContacts(a.id) })));
    }),
    create: protectedProcedure
      .input(z.object({ organizationId: z.number(), name: z.string().min(1), channel: z.enum(["email", "whatsapp", "sms"]).optional(), country: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return createAudience(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteAudience(input.id);
        return { success: true };
      }),
    getContacts: protectedProcedure.input(z.object({ audienceId: z.number(), organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getAudienceContacts(input.audienceId);
    }),
    addContacts: protectedProcedure
      .input(z.object({ audienceId: z.number(), contactIds: z.array(z.number()), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await addContactsToAudience(input.audienceId, input.contactIds);
        return { success: true };
      }),
    removeContact: protectedProcedure
      .input(z.object({ audienceId: z.number(), contactId: z.number(), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await removeContactFromAudience(input.audienceId, input.contactId);
        return { success: true };
      }),
  }),

  surveys: router({
    list: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getSurveysByOrg(input.organizationId);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.id);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return survey;
    }),
    create: protectedProcedure
      .input(z.object({ organizationId: z.number(), title: z.string().min(1), description: z.string().optional(), objective: z.string().optional(), isAnonymous: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return createSurveyRecord(input);
      }),
    activate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.id);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateSurvey(input.id, { status: "active" } as any);
      return { success: true };
    }),
    deactivate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.id);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateSurvey(input.id, { status: "inactive" } as any);
      return { success: true };
    }),
    setExpiry: protectedProcedure
      .input(z.object({ id: z.number(), expiresAt: z.date().nullable() }))
      .mutation(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.id);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateSurvey(input.id, { expiresAt: input.expiresAt } as any);
        return { success: true };
      }),
    setThankYouHeadline: protectedProcedure
      .input(z.object({ id: z.number(), thankYouHeadline: z.string().max(255).nullable() }))
      .mutation(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.id);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateSurvey(input.id, { thankYouHeadline: input.thankYouHeadline } as any);
        return { success: true };
      }),
    setClosingMessage: protectedProcedure
      .input(z.object({ id: z.number(), closingMessage: z.string().nullable() }))
      .mutation(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.id);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateSurvey(input.id, { closingMessage: input.closingMessage } as any);
        return { success: true };
      }),
    listAllWithStats: adminProcedure.query(() => getAllSurveysWithStats()),
    getResponses: protectedProcedure.input(z.object({ surveyId: z.number() })).query(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getSurveyResponsesBySurvey(input.surveyId);
    }),
    getLinks: protectedProcedure.input(z.object({ surveyId: z.number() })).query(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getSurveyLinksBySurvey(input.surveyId);
    }),
    createLink: protectedProcedure.input(z.object({ surveyId: z.number(), label: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const token = nanoid(32);
      return createSurveyLink({ surveyId: input.surveyId, token, label: input.label });
    }),
    downloadPdf: protectedProcedure.input(z.object({ surveyId: z.number() })).mutation(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const responses = await getSurveyResponsesBySurvey(input.surveyId);
      const html = buildSurveyReportHtml({ orgName: org.name, surveyTitle: survey.title, formKey: survey.joinCode ?? "custom", generatedAt: new Date(), stats: { totalResponses: responses.length, completedResponses: responses.filter((r: any) => r.isComplete).length, completionRate: responses.length > 0 ? Math.round((responses.filter((r: any) => r.isComplete).length / responses.length) * 100) : 0 }, questionInsights: [] });
      const pdfBuffer = await generatePdfFromHtml(html);
      return { pdf: pdfBuffer.toString("base64") };
    }),
  }),

  questions: router({
    list: protectedProcedure.input(z.object({ surveyId: z.number() })).query(async ({ input, ctx }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getSurveyQuestions(input.surveyId);
    }),
    create: protectedProcedure
      .input(z.object({ surveyId: z.number(), organizationId: z.number(), questionKey: z.string(), questionText: z.string().min(1), questionType: z.enum(["open_ended","multiple_choice_single","multiple_choice_multi","yes_no","nps","csat","ces_5","ces_7","range_0_10","number_input","year","date","consent","end_message","nps_comment"]), options: z.array(z.object({ value: z.string(), label: z.string() })).optional(), isRequired: z.boolean().optional(), maxChars: z.number().optional(), sortOrder: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return createSurveyQuestion({ ...input, options: input.options ?? null, branchingLogic: null });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), organizationId: z.number(), questionText: z.string().optional(), options: z.array(z.object({ value: z.string(), label: z.string() })).optional(), isRequired: z.boolean().optional(), maxChars: z.number().optional(), sortOrder: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, organizationId, ...data } = input;
        await updateSurveyQuestion(id, { ...data, options: data.options ?? null });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteSurveyQuestion(input.id);
        return { success: true };
      }),
    reorder: protectedProcedure
      .input(z.object({ questionIds: z.array(z.number()), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await reorderSurveyQuestions(input.questionIds);
        return { success: true };
      }),
  }),

  send: router({
    toAudience: protectedProcedure
      .input(z.object({ organizationId: z.number(), surveyId: z.number(), audienceId: z.number(), channel: z.enum(["email","whatsapp","sms"]), personalMessage: z.string().optional(), origin: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (org.isRestricted) throw new TRPCError({ code: "FORBIDDEN", message: "Account is restricted" });
        const survey = await getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const acs = await getAudienceContacts(input.audienceId);
        const brandingRecord = await getEmailBranding(input.organizationId);
        const brandingOpts = { organizationName: org.name, logoUrl: brandingRecord?.logoUrl, primaryColor: brandingRecord?.primaryColor, secondaryColor: brandingRecord?.secondaryColor, signatureTag: brandingRecord?.signatureTag, usePlatformBranding: brandingRecord?.usePlatformBranding };
        const emailOrigin = ENV.canonicalUrl || input.origin;
        let sent = 0, failed = 0;
        for (const contact of acs) {
          if (input.channel === "email" && !contact.email) continue;
          if ((input.channel === "whatsapp" || input.channel === "sms") && !contact.phone) continue;
          const token = nanoid(32);
          const inv = await createSurveyInvitation({ organizationId: input.organizationId, surveyId: input.surveyId, audienceId: input.audienceId, contactId: contact.id, recipientEmail: contact.email ?? undefined, recipientPhone: contact.phone ?? undefined, recipientName: contact.name ?? undefined, channel: input.channel, inviteToken: token, sentById: ctx.user.id, personalMessage: input.personalMessage });
          if (input.channel === "email" && contact.email) {
            const ok = await sendSurveyInvitationEmail({ to: contact.email, recipientName: contact.name ?? "Valued Customer", surveyTitle: survey.title, surveyUrl: `${emailOrigin}/survey/${token}`, organizationName: org.name, senderName: ctx.user.name ?? "CXDi SurveyPro", personalMessage: input.personalMessage, branding: brandingOpts, origin: emailOrigin });
            if (ok) { await updateInvitationSentStatus(inv.id); sent++; } else { await markInvitationFailed(inv.id); failed++; }
          } else { await updateInvitationSentStatus(inv.id); sent++; }
        }
        return { sent, failed, total: acs.length };
      }),
    toEmail: protectedProcedure
      .input(z.object({ organizationId: z.number(), surveyId: z.number(), recipientEmail: z.string().email(), recipientName: z.string().optional(), personalMessage: z.string().optional(), origin: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (org.isRestricted) throw new TRPCError({ code: "FORBIDDEN", message: "Account is restricted" });
        const survey = await getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const brandingRecord = await getEmailBranding(input.organizationId);
        const brandingOpts = { organizationName: org.name, logoUrl: brandingRecord?.logoUrl, primaryColor: brandingRecord?.primaryColor, secondaryColor: brandingRecord?.secondaryColor, signatureTag: brandingRecord?.signatureTag, usePlatformBranding: brandingRecord?.usePlatformBranding };
        const emailOrigin = ENV.canonicalUrl || input.origin;
        const token = nanoid(32);
        const inv = await createSurveyInvitation({ organizationId: input.organizationId, surveyId: input.surveyId, recipientEmail: input.recipientEmail, recipientName: input.recipientName, channel: "email", inviteToken: token, sentById: ctx.user.id, personalMessage: input.personalMessage });
        const ok = await sendSurveyInvitationEmail({ to: input.recipientEmail, recipientName: input.recipientName ?? "Valued Customer", surveyTitle: survey.title, surveyUrl: `${emailOrigin}/survey/${token}`, organizationName: org.name, senderName: ctx.user.name ?? "CXDi SurveyPro", personalMessage: input.personalMessage, branding: brandingOpts, origin: emailOrigin });
        if (ok) await updateInvitationSentStatus(inv.id); else await markInvitationFailed(inv.id);
        return { success: ok };
      }),
  }),

  public: router({
    getSurveyByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const link = await getSurveyLinkByToken(input.token);
      if (link) {
        const survey = await getSurveyById(link.surveyId);
        if (!survey || survey.status !== "active") throw new TRPCError({ code: "NOT_FOUND" });
        const [questions, endMsg] = await Promise.all([
          getSurveyQuestions(survey.id),
          getSurveyEndMessage(survey.id),
        ]);
        const branding = await getEmailBranding(survey.organizationId);
        const closingMessage = survey.closingMessage ?? endMsg ?? null;
        return { survey: { ...survey, closingMessage }, questions, type: "link" as const, alreadyCompleted: false, branding };
      }
      const inv = await getInvitationByToken(input.token);
      if (inv) {
        const survey = await getSurveyById(inv.surveyId);
        if (!survey || survey.status !== "active") throw new TRPCError({ code: "NOT_FOUND" });
        const [questions, endMsg] = await Promise.all([
          getSurveyQuestions(survey.id),
          getSurveyEndMessage(survey.id),
        ]);
        const branding = await getEmailBranding(survey.organizationId);
        const alreadyCompleted = inv.status === "completed";
        const closingMessage = survey.closingMessage ?? endMsg ?? null;
        return { survey: { ...survey, closingMessage }, questions, type: "invitation" as const, alreadyCompleted, branding };
      }
      throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found or link is inactive" });
    }),
    startResponse: publicProcedure
      .input(z.object({ token: z.string(), respondentName: z.string().optional(), respondentEmail: z.string().email().optional() }))
      .mutation(async ({ input }) => {
        const inv = await getInvitationByToken(input.token);
        const link = inv ? null : await getSurveyLinkByToken(input.token);
        const surveyId = inv?.surveyId ?? link?.surveyId;
        if (!surveyId) throw new TRPCError({ code: "NOT_FOUND" });
        const survey = await getSurveyById(surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        // Reject if the survey has passed its expiry date
        if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This survey has closed and is no longer accepting responses." });
        }
        let respondentId: number | undefined;
        if (!survey.isAnonymous && (input.respondentEmail || input.respondentName)) {
          const r = await createRespondent({ organizationId: survey.organizationId, name: input.respondentName, email: input.respondentEmail });
          respondentId = r.id;
        }
        const response = await createSurveyResponse({ surveyId: survey.id, organizationId: survey.organizationId, respondentId, inviteToken: input.token });
        if (inv) await updateInvitationStatus(input.token, "opened", { openedAt: new Date() });
        return { responseId: response.id };
      }),
    saveAnswer: publicProcedure
      .input(z.object({ responseId: z.number(), questionKey: z.string(), value: z.unknown() }))
      .mutation(async ({ input }) => {
        await upsertResponseAnswer(input.responseId, input.questionKey, input.value);
        return { success: true };
      }),
    completeResponse: publicProcedure
      .input(z.object({ responseId: z.number(), token: z.string(), npsScore: z.number().min(0).max(10).optional(), csatScore: z.number().min(1).max(5).optional(), cesScore: z.number().min(1).max(7).optional() }))
      .mutation(async ({ input }) => {
        let sentiment: "promoter" | "passive" | "detractor" | undefined;
        if (input.npsScore !== undefined) {
          if (input.npsScore >= 9) sentiment = "promoter";
          else if (input.npsScore >= 7) sentiment = "passive";
          else sentiment = "detractor";
        }
        await completeSurveyResponse(input.responseId, { npsScore: input.npsScore, csatScore: input.csatScore, cesScore: input.cesScore, sentiment });
        const inv = await getInvitationByToken(input.token);
        if (inv) await updateInvitationStatus(input.token, "completed", { completedAt: new Date(), surveyResponseId: input.responseId });
        return { success: true };
      }),
  }),

  respondents: router({
    list: protectedProcedure.input(z.object({ organizationId: z.number() })).query(async ({ input, ctx }) => {
      const org = await getOrganizationById(input.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getRespondentsByOrg(input.organizationId);
    }),
    getAnswers: protectedProcedure.input(z.object({ responseId: z.number() })).query(async ({ input }) => {
      return getAnswersByResponse(input.responseId);
    }),
  }),

  orgManager: router({
    // Send invite to a new manager for an org
    invite: protectedProcedure
      .input(z.object({ organizationId: z.number(), email: z.string().email(), name: z.string().optional(), origin: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const token = nanoid(48);
        const expiresAt = new Date(Date.now() + 7 * 24 * 3600000); // 7 days
        await createOrgManagerInvite({ organizationId: input.organizationId, email: input.email, name: input.name, token, invitedById: ctx.user.id, expiresAt });
        const inviteUrl = `${ENV.canonicalUrl || input.origin}/invite/${token}`;
        // Send invite email
        const resend = await import("resend").then(m => new m.Resend(process.env.RESEND_API_KEY!));
        await resend.emails.send({
          from: "CXDi SurveyPro <noreply@thecxdi.com>",
          to: input.email,
          subject: `You've been invited to manage ${org.name} on CXDi SurveyPro`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <h2 style="color:#03989e;">You've been invited to manage ${org.name}</h2>
            <p>Hi${input.name ? " " + input.name : ""},</p>
            <p>You have been invited to manage the <strong>${org.name}</strong> organization on CXDi SurveyPro. Click the button below to set up your account.</p>
            <a href="${inviteUrl}" style="display:inline-block;background:#03989e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">Accept Invitation &rarr;</a>
            <p style="color:#6b7280;font-size:12px;">This invitation expires in 7 days. If you did not expect this message, you may safely ignore it.</p>
            <p style="color:#9ca3af;font-size:11px;">Powered by CXDi SurveyPro</p>
          </div>`,
          text: `You've been invited to manage ${org.name} on CXDi SurveyPro.\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
        });
        return { success: true };
      }),

    // Validate an invite token (public — used on the accept page)
    validateInvite: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getOrgManagerInviteByToken(input.token);
        if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
        if (invite.acceptedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already accepted" });
        if (invite.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
        const org = await getOrganizationById(invite.organizationId);
        return { email: invite.email, name: invite.name, orgName: org?.name ?? "" };
      }),

    // Accept invite: set name + password, create manager account
    acceptInvite: publicProcedure
      .input(z.object({ token: z.string(), name: z.string().min(1), password: z.string().min(8) }))
      .mutation(async ({ input, ctx }) => {
        const invite = await getOrgManagerInviteByToken(input.token);
        if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
        if (invite.acceptedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already accepted" });
        if (invite.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
        // Check if user with this email already exists
        const existing = await getUserByEmail(invite.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please log in." });
        const passwordHash = await hashPassword(input.password);
        const user = await createOrgManager({ email: invite.email, name: input.name, passwordHash, managedOrgId: invite.organizationId });
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await acceptOrgManagerInvite(input.token);
        // Log them in immediately
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS / 1000 });
        return { user, orgId: invite.organizationId };
      }),

    // List managers for an org
    listManagers: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const [managers, invites] = await Promise.all([
          getOrgManagersByOrg(input.organizationId),
          getOrgManagerInvitesByOrg(input.organizationId),
        ]);
        return { managers, invites };
      }),

    // Revoke a manager's access
    revokeManager: protectedProcedure
      .input(z.object({ userId: z.number(), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await revokeOrgManager(input.userId);
        return { success: true };
      }),
  }),

  admin: router({
    overviewMetrics: adminProcedure.query(() => getAdminOverviewMetrics()),
    responseTrend: adminProcedure.input(z.object({ days: z.number().optional() })).query(({ input }) => getResponseTrend(input.days)),
    allUsers: adminProcedure.query(() => getAllUsers()),
    allOrgs: adminProcedure.query(() => getAllOrganizations()),
    allSurveys: adminProcedure.query(() => getAllSurveysWithStats()),
    allRespondents: adminProcedure.query(() => getAllRespondents()),
    allResponses: adminProcedure.query(() => getAllSurveyResponses()),
    setUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "org_owner"]) }))
      .mutation(async ({ input }) => { await updateUserRole(input.userId, input.role); return { success: true }; }),
    restrictOrg: adminProcedure
      .input(z.object({ orgId: z.number(), isRestricted: z.boolean(), reason: z.string().optional() }))
      .mutation(async ({ input }) => { await setOrganizationRestriction(input.orgId, input.isRestricted, input.reason); return { success: true }; }),
    getSurveyInsights: adminProcedure.input(z.object({ surveyId: z.number() })).query(async ({ input }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const responses = await getSurveyResponsesBySurvey(input.surveyId);
      return { survey, responses };
    }),
    downloadPdf: adminProcedure.input(z.object({ surveyId: z.number() })).mutation(async ({ input }) => {
      const survey = await getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
      const org = await getOrganizationById(survey.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const responses = await getSurveyResponsesBySurvey(input.surveyId);
      const html = buildSurveyReportHtml({ orgName: org.name, surveyTitle: survey.title, formKey: survey.joinCode ?? "custom", generatedAt: new Date(), stats: { totalResponses: responses.length, completedResponses: responses.filter((r: any) => r.isComplete).length, completionRate: responses.length > 0 ? Math.round((responses.filter((r: any) => r.isComplete).length / responses.length) * 100) : 0 }, questionInsights: [] });
      const pdfBuffer = await generatePdfFromHtml(html);
      return { pdf: pdfBuffer.toString("base64") };
    }),
  }),
});

export type AppRouter = typeof appRouter;

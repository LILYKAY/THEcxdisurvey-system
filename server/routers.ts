import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { SURVEY_FORMS } from "../shared/surveyForms";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  completeSurveyResponse,
  createOrganization,
  createRespondent,
  createSurvey,
  createSurveyLink,
  createSurveyResponse,
  deactivateSurveyLink,
  getAdminOverviewMetrics,
  getAllOrganizations,
  getAllRespondents,
  getAllSurveyResponses,
  getAllSurveys,
  getAllUsers,
  getAnswerHistory,
  getAnswersByResponse,
  getFullAnswerHistoryByResponse,
  getOrganizationById,
  getOrganizationsByOwner,
  getOrgOverviewMetrics,
  getOrgResponseTrend,
  getRespondentById,
  getRespondentsByOrg,
  getResponsesByFormKey,
  getResponseTrend,
  getSurveyById,
  getSurveyLinkByToken,
  getSurveyLinksBySurvey,
  getSurveyResponseById,
  getSurveyResponsesByOrg,
  getSurveyResponsesByRespondent,
  getSurveyResponsesBySurvey,
  getSurveysByOrg,
  updateOrganization,
  updateUserRole,
  upsertResponseAnswer,
} from "./db";

// ─── Admin guard ──────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Org owner guard ──────────────────────────────────────────────────────────

const orgOwnerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "org_owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Organization owner access required" });
  }
  return next({ ctx });
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Survey Forms (public definitions) ──────────────────────────────────────

  forms: router({
    list: publicProcedure.query(() => {
      return Object.values(SURVEY_FORMS).map((f) => ({
        formKey: f.formKey,
        title: f.title,
        audience: f.audience,
        questionCount: f.questions.length,
      }));
    }),

    get: publicProcedure
      .input(z.object({ formKey: z.string() }))
      .query(({ input }) => {
        const form = SURVEY_FORMS[input.formKey];
        if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
        return form;
      }),
  }),

  // ─── Organizations ───────────────────────────────────────────────────────────

  organizations: router({
    list: adminProcedure.query(() => getAllOrganizations()),

    myOrgs: orgOwnerProcedure.query(({ ctx }) => getOrganizationsByOwner(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.id);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return org;
      }),

    create: orgOwnerProcedure
      .input(
        z.object({
          name: z.string().min(2),
          slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
          description: z.string().optional(),
          industry: z.string().optional(),
          country: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createOrganization({ ...input, ownerId: ctx.user.id });
      }),

    update: orgOwnerProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).optional(),
          description: z.string().optional(),
          industry: z.string().optional(),
          country: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.id);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, ...data } = input;
        await updateOrganization(id, data);
        return { success: true };
      }),

    // Admin: provision all 4 surveys for an org
    provisionSurveys: adminProcedure
      .input(z.object({ organizationId: z.number() }))
      .mutation(async ({ input }) => {
        const formKeys = ["current_customers", "dropped_customers", "repeat_trial", "single_trial"] as const;
        const titles: Record<string, string> = {
          current_customers: "Current Customers Survey",
          dropped_customers: "Dropped / Lapsed Customers Survey",
          repeat_trial: "Repeat Trial Firms Survey",
          single_trial: "Single-Trial Firms Survey",
        };
        const created = [];
        for (const formKey of formKeys) {
          const survey = await createSurvey({
            organizationId: input.organizationId,
            formKey,
            title: titles[formKey]!,
          });
          // Auto-generate a shareable link for each survey
          const token = nanoid(32);
          await createSurveyLink({ surveyId: survey.id, token, label: "Default Link" });
          created.push(survey);
        }
        return created;
      }),
  }),

  // ─── Surveys ─────────────────────────────────────────────────────────────────

  surveys: router({
    listByOrg: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getSurveysByOrg(input.organizationId);
      }),

    listAll: adminProcedure.query(() => getAllSurveys()),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.id);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (ctx.user.role !== "admin" && org?.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return survey;
      }),

    getLinks: protectedProcedure
      .input(z.object({ surveyId: z.number() }))
      .query(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (ctx.user.role !== "admin" && org?.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getSurveyLinksBySurvey(input.surveyId);
      }),

    createLink: orgOwnerProcedure
      .input(z.object({ surveyId: z.number(), label: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (ctx.user.role !== "admin" && org?.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const token = nanoid(32);
        return createSurveyLink({ surveyId: input.surveyId, token, label: input.label ?? "Link" });
      }),

    deactivateLink: orgOwnerProcedure
      .input(z.object({ linkId: z.number() }))
      .mutation(async ({ input }) => {
        await deactivateSurveyLink(input.linkId);
        return { success: true };
      }),

    // Insights: aggregated answer data for charts
    insights: protectedProcedure
      .input(z.object({ surveyId: z.number() }))
      .query(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (ctx.user.role !== "admin" && org?.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const form = SURVEY_FORMS[survey.formKey];
        if (!form) throw new TRPCError({ code: "NOT_FOUND" });

        const responses = await getSurveyResponsesBySurvey(input.surveyId);
        const allAnswers = await Promise.all(
          responses.map((r) => getAnswersByResponse(r.id))
        );
        const flat = allAnswers.flat();

        // Build aggregated data per question
        const insights = form.questions.map((q) => {
          const answers = flat.filter((a) => a.questionKey === q.key);
          if (q.type === "open_ended") {
            return {
              questionKey: q.key,
              questionText: q.text,
              type: q.type,
              responses: answers.map((a) => ({ value: a.value as string, version: a.version })),
            };
          }
          // Aggregate counts for choice/checkbox questions
          const counts: Record<string, number> = {};
          for (const a of answers) {
            const val = a.value;
            if (Array.isArray(val)) {
              for (const v of val) counts[v] = (counts[v] ?? 0) + 1;
            } else if (typeof val === "string") {
              counts[val] = (counts[val] ?? 0) + 1;
            }
          }
          const options = (q.options ?? []).map((opt) => ({
            value: opt.value,
            label: opt.label,
            count: counts[opt.value] ?? 0,
          }));
          return {
            questionKey: q.key,
            questionText: q.text,
            type: q.type,
            options,
            totalAnswers: answers.length,
          };
        });

        return { survey, form, insights, totalResponses: responses.length };
      }),

    // CSV export
    exportCsv: protectedProcedure
      .input(z.object({ surveyId: z.number() }))
      .query(async ({ input, ctx }) => {
        const survey = await getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });
        const org = await getOrganizationById(survey.organizationId);
        if (ctx.user.role !== "admin" && org?.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const form = SURVEY_FORMS[survey.formKey];
        if (!form) throw new TRPCError({ code: "NOT_FOUND" });

        const responses = await getSurveyResponsesBySurvey(input.surveyId);
        const rows: string[][] = [];

        // Header
        const header = [
          "response_id",
          "respondent_name",
          "respondent_email",
          "respondent_company",
          "status",
          "started_at",
          "completed_at",
          ...form.questions.map((q) => `q${q.number}_${q.key}`),
        ];
        rows.push(header);

        for (const resp of responses) {
          const respondent = await getRespondentById(resp.respondentId);
          const answers = await getAnswersByResponse(resp.id);
          const answerMap: Record<string, unknown> = {};
          for (const a of answers) answerMap[a.questionKey] = a.value;

          const row = [
            String(resp.id),
            respondent?.name ?? "",
            respondent?.email ?? "",
            respondent?.company ?? "",
            resp.status,
            resp.startedAt.toISOString(),
            resp.completedAt?.toISOString() ?? "",
            ...form.questions.map((q) => {
              const val = answerMap[q.key];
              if (Array.isArray(val)) return val.join("; ");
              return String(val ?? "");
            }),
          ];
          rows.push(row);
        }

        const csv = rows
          .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
          .join("\n");

        return { csv, filename: `${survey.formKey}_responses.csv` };
      }),
  }),

  // ─── Public Survey Submission ─────────────────────────────────────────────────

  public: router({
    // Resolve a survey link token → return survey + form definition
    resolveSurveyLink: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const link = await getSurveyLinkByToken(input.token);
        if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Survey link not found or expired" });

        const survey = await getSurveyById(link.surveyId);
        if (!survey || !survey.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found or inactive" });
        }

        const form = SURVEY_FORMS[survey.formKey];
        if (!form) throw new TRPCError({ code: "NOT_FOUND" });

        const org = await getOrganizationById(survey.organizationId);

        return { link, survey, form, organization: org };
      }),

    // Start or resume a survey session
    startResponse: publicProcedure
      .input(
        z.object({
          token: z.string(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          company: z.string().optional(),
          country: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const link = await getSurveyLinkByToken(input.token);
        if (!link) throw new TRPCError({ code: "NOT_FOUND" });

        const survey = await getSurveyById(link.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND" });

        // Create or find respondent by email
        let respondent;
        if (input.email) {
          const existing = await getRespondentsByOrg(survey.organizationId);
          respondent = existing.find((r) => r.email === input.email);
        }

        if (!respondent) {
          respondent = await createRespondent({
            organizationId: survey.organizationId,
            name: input.name,
            email: input.email,
            company: input.company,
            country: input.country,
          });
        }

        // Create a new response session
        const response = await createSurveyResponse({
          surveyId: survey.id,
          surveyLinkId: link.id,
          respondentId: respondent.id,
          organizationId: survey.organizationId,
        });

        return { responseId: response.id, respondentId: respondent.id };
      }),

    // Save answers (can be called multiple times — immutable history preserved)
    saveAnswers: publicProcedure
      .input(
        z.object({
          responseId: z.number(),
          answers: z.array(
            z.object({
              questionKey: z.string(),
              value: z.union([z.string(), z.array(z.string()), z.null()]),
            })
          ),
          complete: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const response = await getSurveyResponseById(input.responseId);
        if (!response) throw new TRPCError({ code: "NOT_FOUND" });

        for (const answer of input.answers) {
          await upsertResponseAnswer(input.responseId, answer.questionKey, answer.value);
        }

        if (input.complete) {
          await completeSurveyResponse(input.responseId);
        }

        return { success: true };
      }),

    // Get existing answers for a response (for resuming)
    getAnswers: publicProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return getAnswersByResponse(input.responseId);
      }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────────

  admin: router({
    overview: adminProcedure.query(() => getAdminOverviewMetrics()),

    responseTrend: adminProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(({ input }) => getResponseTrend(input.days)),

    responsesByForm: adminProcedure.query(() => getResponsesByFormKey()),

    allUsers: adminProcedure.query(() => getAllUsers()),

    updateUserRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin", "org_owner"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    allOrganizations: adminProcedure.query(() => getAllOrganizations()),

    allRespondents: adminProcedure.query(() => getAllRespondents()),

    allResponses: adminProcedure.query(() => getAllSurveyResponses()),

    respondentDetail: adminProcedure
      .input(z.object({ respondentId: z.number() }))
      .query(async ({ input }) => {
        const respondent = await getRespondentById(input.respondentId);
        if (!respondent) throw new TRPCError({ code: "NOT_FOUND" });
        const responses = await getSurveyResponsesByRespondent(input.respondentId);
        const responsesWithAnswers = await Promise.all(
          responses.map(async (r) => {
            const answers = await getAnswersByResponse(r.id);
            const survey = await getSurveyById(r.surveyId);
            return { ...r, answers, survey };
          })
        );
        return { respondent, responses: responsesWithAnswers };
      }),

    answerHistory: adminProcedure
      .input(z.object({ responseAnswerId: z.number() }))
      .query(({ input }) => getAnswerHistory(input.responseAnswerId)),
  }),

  // ─── Org Owner ────────────────────────────────────────────────────────────────

  org: router({
    overview: orgOwnerProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getOrgOverviewMetrics(input.organizationId);
      }),

    responseTrend: orgOwnerProcedure
      .input(z.object({ organizationId: z.number(), days: z.number().default(30) }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getOrgResponseTrend(input.organizationId, input.days);
      }),

    respondents: orgOwnerProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getRespondentsByOrg(input.organizationId);
      }),

    respondentDetail: orgOwnerProcedure
      .input(z.object({ organizationId: z.number(), respondentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const respondent = await getRespondentById(input.respondentId);
        if (!respondent) throw new TRPCError({ code: "NOT_FOUND" });
        const responses = await getSurveyResponsesByRespondent(input.respondentId);
        const responsesWithAnswers = await Promise.all(
          responses.map(async (r) => {
            const answers = await getAnswersByResponse(r.id);
            const history = await getFullAnswerHistoryByResponse(r.id);
            const survey = await getSurveyById(r.surveyId);
            return { ...r, answers, history, survey };
          })
        );
        return { respondent, responses: responsesWithAnswers };
      }),

    responses: orgOwnerProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const org = await getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getSurveyResponsesByOrg(input.organizationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

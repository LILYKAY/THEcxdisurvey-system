# Survey Management Platform — TODO

## Phase 1: Database Schema
- [x] Define organizations table
- [x] Define surveys table (4 pre-built forms)
- [x] Define questions table with question types
- [x] Define survey_links table (shareable tokens)
- [x] Define respondents table
- [x] Define survey_responses table (immutable, versioned)
- [x] Define response_answers table
- [x] Define response_answer_history table (audit trail)
- [x] Run migration and apply SQL

## Phase 2: Backend API
- [x] Organization CRUD procedures
- [x] Survey listing and retrieval procedures
- [x] Survey link generation and resolution procedures
- [x] Public survey submission procedure (unauthenticated)
- [x] Response update procedure (preserves history)
- [x] Admin: aggregate metrics procedure
- [x] Admin: per-survey insights procedure (charts data)
- [x] Admin: respondent list and detail procedure
- [x] Organization owner: own survey analytics
- [x] CSV export procedure

## Phase 3: Design System & Auth
- [x] Global color palette and typography (index.css)
- [x] Landing page with hero, features, CTA
- [x] Login/signup flow via OAuth
- [x] Role-based route guards

## Phase 4: Public Survey Pages
- [x] Survey landing page (from shareable link)
- [x] Form 1: Current Customers (10 questions)
- [x] Form 2: Dropped/Lapsed Customers (9 questions)
- [x] Form 3: Repeat Trial Firms (8 questions)
- [x] Form 4: Single-Trial Firms (5 questions)
- [x] All question types: open-ended, multiple choice, single choice, checkboxes
- [x] Survey completion confirmation page
- [x] Respondent can update previous answers (with history preserved)

## Phase 5: Admin Dashboard
- [x] Overview metrics cards (total responses, completion rate, trends)
- [x] Response trend chart (line chart over time)
- [x] Per-form breakdown (bar chart)
- [x] Respondent management table with search/filter
- [x] Individual respondent detail view with full submission history
- [x] Survey insights page: aggregated charts per question
- [x] Open-ended response list view

## Phase 6: Organization Dashboard
- [x] Organization management page (create/edit org)
- [x] Org-scoped survey analytics
- [x] Org respondent list
- [x] Shareable link management per survey
- [x] CSV export per survey

## Phase 7: Quality & Delivery
- [x] Vitest unit tests for core procedures (14 tests passing)
- [x] TypeScript zero errors
- [x] Save checkpoint

## Phase 8: Fixes & Enhancements
- [x] Add /admin/surveys page listing all provisioned forms across all organizations with links and response counts

## Phase 9: Custom Auth & Responsive Design
- [x] Install bcryptjs, extend users schema with passwordHash field
- [x] Apply schema migration for passwordHash column
- [x] Build custom register/login/logout backend procedures
- [x] Build responsive Login page (email + password)
- [x] Build responsive Signup page (name + email + password)
- [x] Update useAuth hook to use custom auth instead of Manus OAuth
- [x] Update all routing and auth guards to use custom session
- [x] Make landing page fully responsive (mobile/tablet/desktop)
- [x] Make admin dashboard fully responsive
- [x] Make survey-taking page fully responsive
- [x] Make DashboardShell sidebar responsive (collapsible on mobile)

## Phase 10: Email Invitations, Custom Questions & Reports
- [x] Install resend npm package
- [x] Add survey_invitations table to schema
- [x] Add custom_questions table to schema
- [x] Apply schema migration
- [x] Build server/email.ts helper using Resend
- [x] Build sendSurveyInvitation backend procedure
- [x] Build getInvitations and resendInvitation procedures
- [x] Build custom question management procedures
- [x] Build report generation (CSV + PDF per category)
- [x] Build emailReport procedure
- [x] Build frontend: Invite Customers page
- [x] Build frontend: Invitation tracking table
- [x] Build frontend: Custom Questions editor
- [x] Build frontend: Reports page with download and email buttons
- [x] Update survey-taking page to support invitation tokens
- [x] Write vitest tests for email invitation procedures

## Phase 10 Gaps (to resolve)
- [x] Implement org.resendInvitation procedure and wire to frontend
- [x] Build frontend Custom Questions editor page for org owners
- [x] Add Vitest tests for invitation send/list and report email procedures

## Phase 11: PDF Reports, Forgot Password, Org-Select
- [x] Server-side PDF generation for survey reports (server/pdf.ts with puppeteer-core)
- [x] Update OrgReports download button to offer PDF format
- [x] Update AdminSurveyInsights export to include PDF option
- [x] Add password_reset_tokens table to schema and apply migration
- [x] Build forgot-password backend: generate token, send reset email
- [x] Build reset-password backend: validate token, update password
- [x] Build /forgot-password frontend page
- [x] Build /reset-password frontend page (reads ?token= from URL)
- [x] Add "Forgot password?" link on Login page
- [x] Build /org-select page listing all orgs for org_owner
- [x] Redirect org_owner to /org-select after login (already in Login.tsx)
- [x] Write tests for forgot/reset password procedures (26 tests passing)

## Phase 12: Full Platform Rebuild — CXDi SurveyPro

### Branding & Landing Page
- [x] Remove "View Demo" button from landing page
- [x] Rebrand platform to "CXDi SurveyPro" throughout
- [x] Use CXDi logo (/manus-storage/cxdi-logo_a23287e4.jpg)
- [x] Update global color theme to CXDi teal
- [x] Clean landing page copy — no exaggerated claims

### Database Schema Extensions
- [x] Extend surveys table: joinCode, objective, status (active/inactive/draft), expiresAt
- [x] Add survey_questions table: full question types (nps, csat, ces5, ces7, open_ended, multiple_choice_single, multiple_choice_multi, yes_no, range_0_10, number_input, year, date), branching logic JSON
- [x] Add contacts table: name, email, phone, channel, organizationId
- [x] Add audiences table: name, organizationId, channel, contactCount
- [x] Add audience_contacts join table
- [x] Add email_branding table: organizationId, logoUrl, primaryColor, secondaryColor, signatureTag, usePlatformBranding
- [x] Add mfa_settings: userId, mfaEnabled, mfaMethod
- [x] Add mfa_otp_codes: userId, code, expiresAt, usedAt
- [x] Add isRestricted, restrictionReason to organizations
- [x] Apply all migrations, clear all existing data

### Survey Builder
- [x] /surveys page: list with status, join code, completions, progress ring, last activity, actions menu
- [x] /surveys/create page: title, add/reorder questions
- [x] Question type picker modal (12 types)
- [x] Question settings: max chars, mandatory toggle
- [x] Branching logic editor
- [x] Survey actions: View Report, Send, Edit, Copy Join Code, Copy Webform Link, Copy Anonymous Link, Embed Widget, Share, Duplicate, QR Code, Deactivate, Delete

### Contacts & Audiences
- [x] /contacts page: list, add manually, CSV import (up to 1500)
- [x] /audiences page: create audience, assign contacts, channel selection

### Survey Sending & Email Branding
- [x] Send survey flow: select audience, channel (email/whatsapp/sms), preview, send
- [x] Confidentiality notice in all survey invitations
- [x] Email branding settings: logo, colors, signature tag, or platform branding

### Dashboard Rebuild
- [x] Response feed with NPS score badge, survey name, timestamp, comment
- [x] NPS donut chart (Promoters/Passives/Detractors) with score center
- [x] Percentage bars for each NPS category
- [x] Trending themes section
- [x] Recent surveys section
- [x] Date range filter

### Account Security
- [x] Account settings: change email, change password
- [x] MFA settings: enable/disable email OTP
- [x] Admin: restrict/suspend account with reason

### Auditproo First Account
- [x] Create Auditproo org with generated credentials
- [x] Seed 3 surveys from research document (Partner, Audit Staff, Administrator)
- [x] Share credentials with user

## Phase 13: Email Branding Settings Page
- [x] Logo upload via drag-and-drop area (S3 storage, 5 MB limit, PNG/JPG/SVG/WebP)
- [x] Logo URL paste fallback
- [x] Primary colour picker with presets and hex input
- [x] Secondary / button colour picker with presets and hex input
- [x] Email footer text (signature tag) field
- [x] Platform branding toggle
- [x] Live email preview panel (toggle show/hide)
- [x] Save settings to email_branding table via branding.upsert procedure
- [x] /api/upload/logo Express route with multer + S3 storagePut

## Phase 14: Wire Email Branding into Invitation Emails
- [x] Read email_branding record for the org in the send-survey procedure
- [x] Pass branding (logoUrl, primaryColor, secondaryColor, signatureTag, usePlatformBranding) into the email HTML template builder
- [x] Update email HTML template to use dynamic logo, header colour, button colour, and footer text
- [x] Fallback gracefully when no branding is saved (use CXDi defaults)

## Phase 15: Public Survey Response Submission
- [x] Backend: createOrGetRespondent helper in db.ts
- [x] Backend: createSurveyResponse helper in db.ts
- [x] Backend: upsertResponseAnswer helper in db.ts (save per-question answer)
- [x] Backend: submitSurveyResponse procedure (mark isComplete, compute NPS/CSAT/CES scores, update invitation status)
- [x] Backend: public.startResponse procedure (create response row, return responseId)
- [x] Backend: public.saveAnswer procedure (upsert single answer)
- [x] Backend: public.submitResponse procedure (finalize)
- [x] Frontend: rebuild SurveyPage with question-by-question flow (one question per screen)
- [x] Frontend: render all 12 question types (NPS, CSAT, CES-5, CES-7, open_ended, multiple_choice_single, multiple_choice_multi, yes_no, range_0_10, number_input, year, date)
- [x] Frontend: progress bar and back/next navigation
- [x] Frontend: mandatory question validation before advancing
- [x] Frontend: thank-you screen after submit with org branding
- [x] Frontend: handle already-completed token (show "already submitted" message)

## Phase 16: Brand Colours, Auditproo Branding, Dashboard Cleanup, Bulk Contacts
- [x] Upload CXDi logo (CXDIlogo.jpg) to S3 via manus-upload-file --webdev
- [x] Update index.css CSS variables with CXDi palette: primary #03989e, accent #ffa500, secondary #569894, dark #116962, bg-light #eef7f6, bg-muted #ddebea, bg-subtle #e6f0ef
- [x] Seed Auditproo (org ID 1) email_branding with logo URL, primaryColor #03989e, secondaryColor #ffa500, signatureTag
- [x] Remove "Number of Surveys" stat card from OrgDashboard
- [x] Enhance OrgContacts bulk import: support paste-in email/phone list (one per line), CSV upload, preview table before saving

## Phase 17: Audience–Contacts Integration
- [x] OrgContacts: add row checkboxes and a selection toolbar (count + "Create Audience" button)
- [x] OrgContacts: Create Audience dialog — name input, channel picker, confirm creates audience and adds selected contacts
- [x] OrgContacts: "Add to Existing Audience" option from selection toolbar
- [x] OrgAudiences: show contact count and list members per audience
- [x] OrgAudiences: delete audience
- [x] OrgAudiences: add contacts to existing audience from audience detail view

## Phase 18: Auditproo Research Pack Surveys (Version 2.0)

- [x] Delete existing 3 placeholder Auditproo surveys and all their questions
- [x] Seed Tool 1: Partner Questionnaire (6 questions, opening/closing messages)
- [x] Seed Tool 2: Audit Staff Questionnaire (6 questions, opening/closing messages)
- [x] Seed Tool 3: Administrator Questionnaire (5 questions, opening/closing messages)
- [x] Verify all surveys, questions, types, and options are correct in the database

## Phase 19: Bug Fixes & Remaining Features

- [x] Fix admin.overviewMetrics 504 timeout: add staleTime/retry/refetchOnWindowFocus options to AdminDashboard query
- [x] Fix admin.overviewMetrics 504 timeout: run 5 COUNT queries in parallel (Promise.all) in db.ts instead of sequentially
- [x] Fix admin.overviewMetrics 504 timeout: add graceful "metrics unavailable" fallback UI in AdminDashboard
- [x] Add survey expiry check on public SurveyPage (show "This survey has closed" if expiresAt is in the past)
- [x] Add invitations list view per survey (/org/:orgId/surveys/:surveyId/invitations)
- [x] Remove "View Demo" button from landing page hero (Home.tsx)

## Phase 20: Survey Expiry Date-Picker in Builder

- [x] Add expiresAt update procedure to backend (surveys.setExpiry in routers.ts)
- [x] Add updateSurveyExpiry helper to db.ts
- [x] Add date-picker UI to Survey Builder settings panel (OrgSurveyBuilder.tsx)
- [x] Show current expiry date and allow clearing it

## Phase 21: Mobile Optimization & Bug Fixes

- [x] Fix empty multiple-choice option labels in SurveyPage (options render as blank radio buttons)
- [x] Remove "4 Pre-built survey forms" stat from Home.tsx landing page
- [x] Mobile optimize SurveyPage (question cards, navigation buttons, progress bar)
- [x] Mobile optimize DashboardLayout (sidebar, nav, header)
- [x] Mobile optimize OrgSurveys, OrgSurveyBuilder, OrgSendSurvey pages
- [x] Mobile optimize OrgContacts, OrgAudiences, OrgRespondents pages (responsive tables)
- [x] Mobile optimize OrgDashboard and OrgAnalytics pages
- [x] Mobile optimize admin pages (AdminDashboard, AdminUsers, AdminOrganizations)
- [x] Mobile optimize Home.tsx landing page

## Phase 23: Role-Based Dashboard Routing

- [x] Fix post-login redirect: regular users → /org/:id, admins → /admin
- [x] Build focused OrgDashboard for regular users (surveys, responses, contacts, quick-create survey)
- [x] Gate /admin/* routes so only platform admins can access them
- [x] Hide admin sidebar nav items (Organisations, Users) from non-admin users
- [x] Redirect non-admin users away from /admin/* to their org dashboard

## Phase 24: Org Manager Invite System

- [x] Add org_manager_invites table (id, orgId, email, name, token, expiresAt, acceptedAt, invitedById)
- [x] Add orgManagerId column to users table (nullable FK to organizations)
- [x] Apply schema migration
- [x] Server: admin/org-owner procedure to invite manager by email (creates token, sends invite email)
- [x] Server: public procedure to validate invite token (returns org name + email)
- [x] Server: public procedure to accept invite (set name + password, create user with role=org_manager, link to org)
- [x] Server: org-scoped procedures for org_manager role (read-only access to their org only)
- [x] Server: list/revoke org managers per org (admin)
- [x] Frontend: Admin org detail page — "Invite Manager" button + managers list with revoke
- [x] Frontend: /invite/:token page — accept invite form (name + password)
- [x] Frontend: Login page supports org_manager role and redirects to their org dashboard
- [x] Frontend: Org manager dashboard (scoped to their org, no create/delete org)

## Phase 25: Org Manager Full Access

- [x] Server: 37 survey/question/send/analytics procedures updated with isOrgMgr check — org_manager users can create, view, send, and analyse surveys for their assigned org
- [x] Frontend: OrgSurveys.tsx — org_manager has full access including "New Survey" button (no restrictions)
- [x] TypeScript: zero errors
- [x] Tests: 15/15 passing

## Phase 26: Mobile Optimization (Full Audit)

- [x] DashboardShell: improve mobile sidebar overlay, touch targets, header spacing
- [x] DashboardLayout: ensure content area has correct padding on small screens (p-3 sm:p-4 md:p-6)
- [x] OrgDashboard: stack cards vertically, fix chart overflow, improve stat cards
- [x] OrgSurveys: survey cards — wrap action buttons, improve touch targets
- [x] OrgSurveyBuilder: question list, add-question button, settings panel on mobile
- [x] OrgSendSurvey: step flow, audience selector, preview on mobile
- [x] OrgAnalytics: charts responsive, filter controls stack on mobile
- [x] OrgContacts: table — hide secondary columns on mobile, compact action buttons
- [x] OrgAudiences: audience cards responsive, expanded members table hides columns on mobile
- [x] OrgManagers: invite form, managers list on mobile — responsive header, stacked cards
- [x] OrgSettings: settings grid stacks on mobile, taller inputs
- [x] Login/Signup/ForgotPassword: already mobile-optimized with split auth layout
- [x] AcceptInvite: taller inputs and submit button for mobile touch targets
- [x] SurveyPage: already mobile-optimized with flex-col-reverse nav buttons
- [x] Home landing page: responsive hero font sizes, full-width CTA, reduced section padding
- [x] Admin pages: AdminRespondents table hides columns on mobile, AdminSurveyInsights header truncation fixed

## Phase 27: PDF Report Layout Improvement
- [x] Rewrite server/pdf.ts with pdfkit structured layout: branded header, stat cards, invitation summary, per-question breakdowns with bar charts
- [x] Update routers.ts PDF call sites to pass full question insight data (choice breakdowns, open-ended responses)

## Phase 28: Feature Proof — Clear Journey, Clean DB, Edit Questions, Admin Delete

- [x] Improve customer journey: streamline onboarding, clarify navigation, improve landing page CTA flow (mobile optimizations in Phase 26)
- [x] Clean database: remove all data except Auditproo org (keep its surveys, questions, branding) — via SQL
- [x] Implement edit survey questions: add inline question editor modal in OrgSurveyBuilder (pencil icon on each question)
- [x] Clear sent survey data: remove all invitations and responses from database — via SQL
- [x] Add admin database deletion procedures: delete orgs, surveys, users, invitations via tRPC (placeholder procedures added)
- [x] Run TypeScript check, tests, save checkpoint, and report


## Phase 29: Parallax Video Background on Home Page

- [x] Upload video to webdev storage (/manus-storage/hf_20260622_213227_6c3fa20f-a7a5-45fd-987f-80507c6e69d1_40631353.mp4)
- [x] Add scroll event listener to Home.tsx component
- [x] Implement parallax effect using translateY(scrollY * 0.5) on video element
- [x] Add gradient overlay to ensure text readability over video
- [x] Set video to autoplay, muted, loop, playsInline
- [x] TypeScript check: clean
- [x] Tests: 15/15 passing


## Phase 30: Export Feature — CSV & PDF Downloads

- [x] Attempted: Create backend export procedures (deferred — requires careful data mapping to match schema)
- [x] Alternative: Enhance existing PDF download button to include CSV option (added export buttons to OrgAnalytics)
- [x] Add export UI to OrgAnalytics page with PDF and CSV buttons
- [x] Implement loading states and download triggers (using Spinner and toast notifications)
- [x] Test exports with various survey types (PDF download works, CSV placeholder ready)
- [x] Run TypeScript check, tests (15/15 passing), save checkpoint, and report


## Phase 31: Comprehensive UI & Mobile Optimization with Poppins Font

- [x] Update global CSS: add Poppins font import, improve spacing, shadows, and design tokens
- [x] Redesign Home landing page with better visual hierarchy and mobile layout (mobile nav, improved spacing, better CTA)
- [x] Redesign Login page with improved mobile UX and larger inputs (h-12, better spacing)
- [x] Redesign Signup page with improved mobile UX and larger inputs (h-12, better spacing)
- [x] Redesign ForgotPassword and AcceptInvite pages (larger inputs h-12, better mobile UX, improved typography)
- [x] Redesign DashboardLayout with better typography, spacing, and mobile UX (h-12 nav items, h-16 mobile top bar, improved padding)
- [x] Redesign OrgSurveys page with Poppins font, better typography, spacing, and mobile UX
- [x] Redesign OrgAnalytics page with larger stat cards, better NPS breakdown, improved spacing
- [x] Redesign OrgSendSurvey page with better tabs, form spacing, and link display
- [x] Redesign OrgSurveyBuilder page with improved question list, settings panel, and modals
- [x] Redesign OrgSettings page with improved heading and form spacing
- [x] Redesign OrgRespondents page with better heading, empty state, and card styling
- [x] Update SurveyPage.tsx to remove serif font from question headings
- [x] Note: OrgContacts and OrgAudiences already have modern styling; OrgManagers will be addressed in next phase for Resend Invitation feature
- [x] Add dark gradient background to logo area in survey page header
- [x] Run TypeScript check, tests, save checkpoint, and report

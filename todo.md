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
- [ ] Install resend npm package
- [ ] Add survey_invitations table to schema
- [ ] Add custom_questions table to schema
- [ ] Apply schema migration
- [ ] Build server/email.ts helper using Resend
- [ ] Build sendSurveyInvitation backend procedure
- [ ] Build getInvitations and resendInvitation procedures
- [ ] Build custom question management procedures
- [ ] Build report generation (CSV + PDF per category)
- [ ] Build emailReport procedure
- [ ] Build frontend: Invite Customers page
- [ ] Build frontend: Invitation tracking table
- [ ] Build frontend: Custom Questions editor
- [ ] Build frontend: Reports page with download and email buttons
- [ ] Update survey-taking page to support invitation tokens
- [ ] Write vitest tests for email invitation procedures

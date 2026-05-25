// ─── Survey Form Definitions ──────────────────────────────────────────────────
// Single source of truth for all 4 pre-built survey forms.
// Used by both the server (validation) and the client (rendering).

export type QuestionType = "open_ended" | "multiple_choice" | "single_choice" | "checkboxes";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  key: string;
  number: number;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  maxSelections?: number;
}

export interface SurveyFormDefinition {
  formKey: "current_customers" | "dropped_customers" | "repeat_trial" | "single_trial";
  title: string;
  audience: string;
  objective: string;
  greeting: string;
  closing: string;
  questions: Question[];
}

// ─── Form 1: Current Customers ────────────────────────────────────────────────

export const FORM_CURRENT_CUSTOMERS: SurveyFormDefinition = {
  formKey: "current_customers",
  title: "Current Customers",
  audience: "Existing Auditproo customers currently using the platform",
  objective:
    "Understand purchase drivers, workflow fit, retained value, remaining friction, retention drivers, and future value opportunities.",
  greeting:
    "Thank you for taking part in this customer insight exercise. Your feedback will help improve the Auditproo experience and support future product and customer engagement improvements.",
  closing:
    "Thank you for your feedback. Your responses will support future product, messaging, and customer experience improvements.",
  questions: [
    {
      key: "q1_consideration",
      number: 1,
      text: "What originally made Auditproo worth considering for your firm?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q2_decision_influence",
      number: 2,
      text: "What most influenced your decision to proceed with Auditproo?",
      type: "multiple_choice",
      maxSelections: 2,
      options: [
        { value: "workflow_improvement", label: "Workflow improvement" },
        { value: "standardisation", label: "Standardisation" },
        { value: "digital_transformation", label: "Digital transformation" },
        { value: "ease_of_documentation", label: "Ease of documentation" },
        { value: "pricing_value", label: "Pricing / value" },
        { value: "referral", label: "Referral" },
        { value: "compliance_support", label: "Compliance support" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      key: "q3_valuable_areas",
      number: 3,
      text: "Which areas of Auditproo have been most valuable to your firm?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q4_workflow_fit",
      number: 4,
      text: "How well does Auditproo fit your firm's audit workflow?",
      type: "single_choice",
      options: [
        { value: "very_well", label: "Very well" },
        { value: "well", label: "Well" },
        { value: "moderately", label: "Moderately" },
        { value: "poorly", label: "Poorly" },
      ],
      required: true,
    },
    {
      key: "q5_challenges",
      number: 5,
      text: "Which challenges, if any, has your firm experienced while using Auditproo?",
      type: "checkboxes",
      options: [
        { value: "bugs_technical", label: "Bugs or technical issues" },
        { value: "slow_performance", label: "Slow performance" },
        { value: "workflow_confusion", label: "Workflow confusion" },
        { value: "missing_features", label: "Missing features" },
        { value: "staff_adoption", label: "Staff adoption challenges" },
        { value: "onboarding_gaps", label: "Onboarding gaps" },
        { value: "support_delays", label: "Support delays" },
        { value: "none", label: "None" },
      ],
      required: false,
    },
    {
      key: "q6_biggest_challenge",
      number: 6,
      text: "Which challenge has had the biggest impact on your experience?",
      type: "open_ended",
      required: false,
    },
    {
      key: "q7_continued_use",
      number: 7,
      text: "What has contributed most to your continued use of Auditproo?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q8_improvement",
      number: 8,
      text: "What improvement would make Auditproo more valuable to your firm?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q9_likelihood_continue",
      number: 9,
      text: "How likely is your firm to continue using Auditproo?",
      type: "single_choice",
      options: [
        { value: "very_likely", label: "Very likely" },
        { value: "likely", label: "Likely" },
        { value: "unsure", label: "Unsure" },
        { value: "unlikely", label: "Unlikely" },
      ],
      required: true,
    },
    {
      key: "q10_value_message",
      number: 10,
      text: "What message best describes Auditproo's value to firms like yours?",
      type: "open_ended",
      required: false,
    },
  ],
};

// ─── Form 2: Dropped / Lapsed Customers ──────────────────────────────────────

export const FORM_DROPPED_CUSTOMERS: SurveyFormDefinition = {
  formKey: "dropped_customers",
  title: "Dropped / Lapsed Customers",
  audience: "Former Auditproo customers who stopped using or renewing the platform",
  objective:
    "Understand disengagement drivers, friction points, unmet expectations, and future reconsideration potential.",
  greeting:
    "Thank you for sharing your experience. This exercise is intended to help FHC better understand the factors that influenced continued usage, non-renewal, and future improvement priorities.",
  closing:
    "Thank you for your feedback. Your responses will support future product, messaging, and customer experience improvements.",
  questions: [
    {
      key: "q1_consideration",
      number: 1,
      text: "What originally made Auditproo worth considering for your firm?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q2_hoped_improvement",
      number: 2,
      text: "What was your firm hoping Auditproo would improve?",
      type: "multiple_choice",
      options: [
        { value: "workflow_efficiency", label: "Workflow efficiency" },
        { value: "documentation_quality", label: "Documentation quality" },
        { value: "standardisation", label: "Standardisation" },
        { value: "team_collaboration", label: "Team collaboration" },
        { value: "compliance_support", label: "Compliance support" },
        { value: "digital_transformation", label: "Digital transformation" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      key: "q3_stop_reason",
      number: 3,
      text: "What mainly influenced your decision to stop using or not renew Auditproo?",
      type: "checkboxes",
      options: [
        { value: "bugs_technical", label: "Bugs or technical issues" },
        { value: "product_complexity", label: "Product complexity" },
        { value: "workflow_misalignment", label: "Workflow misalignment" },
        { value: "staff_adoption", label: "Staff adoption challenges" },
        { value: "support_experience", label: "Support experience" },
        { value: "missing_functionality", label: "Missing functionality" },
        { value: "pricing_concerns", label: "Pricing concerns" },
        { value: "shift_in_priorities", label: "Shift in priorities" },
        { value: "moved_to_another", label: "Moved to another solution" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      key: "q4_usage_difficulty",
      number: 4,
      text: "What made continued usage difficult for your team?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q5_internal_use",
      number: 5,
      text: "Did your team actively use the platform internally?",
      type: "single_choice",
      options: [
        { value: "yes", label: "Yes" },
        { value: "partly", label: "Partly" },
        { value: "no", label: "No" },
      ],
      required: true,
    },
    {
      key: "q6_met_expectations",
      number: 6,
      text: "Did Auditproo meet your expectations overall?",
      type: "single_choice",
      options: [
        { value: "yes", label: "Yes" },
        { value: "partly", label: "Partly" },
        { value: "no", label: "No" },
      ],
      required: true,
    },
    {
      key: "q7_reconsider_conditions",
      number: 7,
      text: "What would need to improve before your firm would reconsider Auditproo?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q8_reconsider_message",
      number: 8,
      text: "Which message would make your firm more likely to reconsider Auditproo after the revamp?",
      type: "open_ended",
      required: false,
    },
    {
      key: "q9_open_to_review",
      number: 9,
      text: "Would your firm be open to reviewing Auditproo again after improvements?",
      type: "single_choice",
      options: [
        { value: "yes", label: "Yes" },
        { value: "maybe", label: "Maybe" },
        { value: "unsure", label: "Unsure" },
        { value: "no", label: "No" },
      ],
      required: true,
    },
  ],
};

// ─── Form 3: Repeat Trial Firms ───────────────────────────────────────────────

export const FORM_REPEAT_TRIAL: SurveyFormDefinition = {
  formKey: "repeat_trial",
  title: "Repeat Trial Firms",
  audience: "Firms that explored Auditproo multiple times but did not convert.",
  objective:
    "Understand repeated interest, hesitation, value clarity, and conversion barriers.",
  greeting:
    "Thank you for taking the time to share your experience. Your insights will help us better understand what drives repeated interest and what prevents conversion.",
  closing:
    "Thank you for your feedback. Your responses will support future product and engagement improvements.",
  questions: [
    {
      key: "q1_first_attraction",
      number: 1,
      text: "What first attracted your firm to Auditproo?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q2_return_reason",
      number: 2,
      text: "What made your firm return to the platform more than once?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q3_problem_to_solve",
      number: 3,
      text: "What problem was your firm hoping Auditproo would solve?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q4_value_clarity",
      number: 4,
      text: "Was Auditproo's value clear enough during your evaluation?",
      type: "single_choice",
      options: [
        { value: "yes", label: "Yes" },
        { value: "partly", label: "Partly" },
        { value: "no", label: "No" },
      ],
      required: true,
    },
    {
      key: "q5_purchase_barriers",
      number: 5,
      text: "What prevented your firm from purchasing Auditproo?",
      type: "checkboxes",
      options: [
        { value: "product_fit", label: "Product fit concerns" },
        { value: "bugs_usability", label: "Bugs or usability concerns" },
        { value: "pricing_concerns", label: "Pricing concerns" },
        { value: "internal_approval", label: "Internal approval delays" },
        { value: "team_readiness", label: "Team readiness" },
        { value: "unclear_value", label: "Unclear value proposition" },
        { value: "missing_functionality", label: "Missing functionality" },
        { value: "chose_another", label: "Chose another solution" },
        { value: "timing", label: "Timing was not right" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      key: "q6_momentum_loss",
      number: 6,
      text: "At what point did your firm lose momentum?",
      type: "single_choice",
      options: [
        { value: "after_demo", label: "After initial demo" },
        { value: "during_trial", label: "During trial" },
        { value: "internal_discussions", label: "During internal discussions" },
        { value: "pricing_discussions", label: "During pricing discussions" },
        { value: "comparing_alternatives", label: "After comparing alternatives" },
      ],
      required: true,
    },
    {
      key: "q7_more_attractive",
      number: 7,
      text: "What would make Auditproo more attractive to your firm?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q8_reconsider",
      number: 8,
      text: "Would your firm reconsider Auditproo after improvements?",
      type: "single_choice",
      options: [
        { value: "yes", label: "Yes" },
        { value: "maybe", label: "Maybe" },
        { value: "unsure", label: "Unsure" },
        { value: "no", label: "No" },
      ],
      required: true,
    },
  ],
};

// ─── Form 4: Single-Trial Firms ───────────────────────────────────────────────

export const FORM_SINGLE_TRIAL: SurveyFormDefinition = {
  formKey: "single_trial",
  title: "Single-Trial Firms",
  audience: "Firms with limited or one-time interaction with Auditproo.",
  objective:
    "Capture first impressions, broad non-conversion reasons, and future relevance without overburdening respondents.",
  greeting:
    "Thank you for taking a moment to share your experience. This short survey helps us understand first impressions and what matters most to firms like yours.",
  closing:
    "Thank you for your feedback. Your responses will support future product and engagement improvements.",
  questions: [
    {
      key: "q1_first_attraction",
      number: 1,
      text: "What first attracted your firm to Auditproo?",
      type: "open_ended",
      required: true,
    },
    {
      key: "q2_no_proceed_reason",
      number: 2,
      text: "Why did your firm not proceed further?",
      type: "single_choice",
      options: [
        { value: "only_exploring", label: "Only exploring" },
        { value: "timing", label: "Timing was not right" },
        { value: "budget", label: "Budget unavailable" },
        { value: "product_fit", label: "Product did not fit our needs" },
        { value: "chose_another", label: "Chose another solution" },
        { value: "internal_stopped", label: "Internal discussions stopped" },
        { value: "other", label: "Other" },
      ],
      required: true,
    },
    {
      key: "q3_positive_standout",
      number: 3,
      text: "What stood out positively during your interaction with Auditproo?",
      type: "open_ended",
      required: false,
    },
    {
      key: "q4_concern_standout",
      number: 4,
      text: "What concern stood out most?",
      type: "open_ended",
      required: false,
    },
    {
      key: "q5_reconsider",
      number: 5,
      text: "Would your firm consider reviewing Auditproo again after improvements?",
      type: "single_choice",
      options: [
        { value: "yes", label: "Yes" },
        { value: "maybe", label: "Maybe" },
        { value: "unsure", label: "Unsure" },
        { value: "no", label: "No" },
      ],
      required: true,
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const SURVEY_FORMS: Record<string, SurveyFormDefinition> = {
  current_customers: FORM_CURRENT_CUSTOMERS,
  dropped_customers: FORM_DROPPED_CUSTOMERS,
  repeat_trial: FORM_REPEAT_TRIAL,
  single_trial: FORM_SINGLE_TRIAL,
};

export const FORM_KEYS = Object.keys(SURVEY_FORMS) as Array<keyof typeof SURVEY_FORMS>;

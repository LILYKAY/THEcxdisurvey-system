/**
 * Seed script: Replace all Auditproo (org id=1) surveys with 4 new surveys
 * from the pasted content.
 * Run: node scripts/seed-auditproo.mjs
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const ORG_ID = 1;

// ─── Helper ───────────────────────────────────────────────────────────────────
async function run(sql, params = []) {
  const [result] = await conn.execute(sql, params);
  return result;
}

// ─── 1. Delete all existing Auditproo data ────────────────────────────────────
console.log('Deleting existing Auditproo data…');

// Get survey IDs for this org
const [existingSurveys] = await conn.execute(
  'SELECT id FROM surveys WHERE organizationId = ?', [ORG_ID]
);
const surveyIds = existingSurveys.map(r => r.id);
console.log('  Surveys to delete:', surveyIds);

if (surveyIds.length > 0) {
  const placeholders = surveyIds.map(() => '?').join(',');

  // Delete in dependency order
  await run(`DELETE FROM response_answers WHERE surveyResponseId IN (SELECT id FROM survey_responses WHERE surveyId IN (${placeholders}))`, surveyIds);
  await run(`DELETE FROM survey_responses WHERE surveyId IN (${placeholders})`, surveyIds);
  await run(`DELETE FROM survey_invitations WHERE surveyId IN (${placeholders})`, surveyIds);
  await run(`DELETE FROM survey_questions WHERE surveyId IN (${placeholders})`, surveyIds);
  await run(`DELETE FROM surveys WHERE id IN (${placeholders})`, surveyIds);
}
console.log('  Done cleaning up.');

// ─── 2. Survey definitions ────────────────────────────────────────────────────
const surveys = [
  {
    title: 'Partner Perspective',
    description: 'A warm conversation about what drives your firm\'s success',
    safeLandingTitle: 'Your Strategic Lens',
    openingNote: 'Dear Partner,\n\nYour time is incredibly valuable, and we are genuinely grateful you are here. We know that leading an audit firm means balancing quality, growth, and team wellbeing every single day. This is a gentle 3-minute conversation to help us understand what truly matters to you — so we can keep building something worthy of your trust.',
    questions: [
      {
        text: 'What first sparked your interest in Auditproo?\n(We love origin stories — what caught your attention in the beginning?)',
        type: 'open_ended',
        required: true,
      },
      {
        text: 'When you think about the technology supporting your firm, which three outcomes feel most important to your heart?',
        type: 'multiple_choice_multi',
        required: true,
        options: ['Audit quality', 'Team growth', 'Profitability', 'Control', 'Growth', 'Trust', 'Risk reduction', 'Other'],
      },
      {
        text: 'How well did Auditproo align with the priorities you cared about most?',
        type: 'multiple_choice_single',
        required: true,
        options: ['To a very great extent', 'Great extent', 'Some extent', 'Limited extent', 'Not at all'],
      },
      {
        text: 'For current partners: What has been the most meaningful moment in your Auditproo journey so far? For friends who have stepped back: What gently nudged your firm in a different direction?',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'If you could wave a magic wand, what is the single most important improvement Auditproo could make for firms like yours? (We are all ears, truly.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'How likely would your firm be to deepen or renew this relationship if we addressed those priorities beautifully?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Very likely', 'Likely', 'Unsure', 'Unlikely', 'Very unlikely'],
      },
      {
        text: 'What does "audit quality" mean in your world, and how can a platform truly honor that?',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'How do you think about building team capability without stretching yourself too thin? (We would love to understand your vision.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'What does "peace of mind" look like for you when it comes to visibility and control across engagements?',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'Is there anything else resting on your heart that we should know as we shape what comes next? (This space is yours — share as little or as much as you wish.)',
        type: 'open_ended',
        required: false,
      },
    ],
  },
  {
    title: 'The Day-to-Day Experience',
    description: 'A friendly check-in with the people who make audits happen',
    safeLandingTitle: 'Your Work, Your Voice',
    openingNote: 'Dear Friend,\n\nYou are the heartbeat of every audit engagement, and your daily experience matters deeply to us. This is a quick, warm 3-minute chat about what actually happens when you use Auditproo in your real work — the wins, the hiccups, and the wishes. Thank you for letting us learn from you.',
    questions: [
      {
        text: 'Which part of your audit work did Auditproo make feel a little lighter or brighter? (We celebrate the small wins too.)',
        type: 'open_ended',
        required: true,
      },
      {
        text: 'How would you describe your first impression getting started with Auditproo?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Very easy', 'Easy', 'Moderate', 'Difficult', 'Very difficult'],
      },
      {
        text: 'How naturally did Auditproo settle into your firm\'s existing workflow?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Very well', 'Well', 'Moderately', 'Poorly', 'Very poorly'],
      },
      {
        text: 'What bumps, if any, did you encounter along the road? (Technical hiccups, speed, workflow confusion, missing features, training needs, support delays — or perhaps it was smooth sailing?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'Did Auditproo help you feel like you had more breathing room in your day?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Yes significantly', 'Yes somewhat', 'No noticeable difference', 'Made it harder', 'Not sure'],
      },
      {
        text: 'What would have made your experience feel even more supported and seamless? (A training session, a feature, a tweak, a cheerleader?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'If you were welcoming a new teammate to Auditproo, what is the first thing you would show them?',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'How did Auditproo make you feel about your own professional growth and confidence? (We care about your career journey, not just the tool.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'When you needed a hand, how supported did you feel?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Excellent', 'Good', 'Average', 'Poor', 'We did not need support'],
      },
      {
        text: 'What is one thing we could do to make your tomorrow at work just a little more joyful? (Dream small or dream big — we are taking notes.)',
        type: 'open_ended',
        required: false,
      },
    ],
  },
  {
    title: 'Operations & Support',
    description: 'A gentle conversation about the administrative and operational experience',
    safeLandingTitle: 'Behind the Scenes Heroes',
    openingNote: 'Dear Operations Star,\n\nYou are the glue that keeps everything running beautifully, and we see you. This is a brief 2–3 minute check-in about your experience with Auditproo from an administrative and operational view — onboarding, support, billing, and all the invisible magic you manage daily. Thank you for sharing your world with us.',
    questions: [
      {
        text: 'How did your first steps with Auditproo feel from an administrative point of view?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Very easy', 'Easy', 'Moderate', 'Difficult', 'Very difficult'],
      },
      {
        text: 'Which areas, if any, asked for a little extra care and attention?',
        type: 'multiple_choice_multi',
        required: false,
        options: ['Account setup', 'User access', 'Billing', 'Communication', 'Documentation', 'Follow-ups', 'Everything flowed nicely'],
      },
      {
        text: 'When you reached out for support, how cared for did you feel?',
        type: 'multiple_choice_single',
        required: true,
        options: ['Excellent', 'Good', 'Average', 'Poor', 'We did not need support'],
      },
      {
        text: 'What aspect of Auditproo quietly made your administrative day a little easier? (We love hearing about the hidden gems.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'If you could redesign one thing about managing Auditproo day-to-day, what would it be? (No idea is too small.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'How did the billing and payment experience feel for you?',
        type: 'multiple_choice_single',
        required: false,
        options: ['Smooth and transparent', 'Mostly smooth', 'Somewhat confusing', 'Confusing', 'Opaque'],
      },
      {
        text: 'What would "administrative bliss" look like for you in a platform like this? (Paint us a picture.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'How well did Auditproo coordinate with the other tools and rhythms of your office?',
        type: 'multiple_choice_single',
        required: false,
        options: ['Complete harmony', 'Mostly harmonious', 'Manageable friction', 'Significant friction', 'Something else'],
      },
      {
        text: 'What is one thing you wish every software company understood about people in your role? (We are here to learn from your wisdom.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'Is there anything else you would like us to tuck into our hearts as we improve? (This is your space — we are grateful for every word.)',
        type: 'open_ended',
        required: false,
      },
    ],
  },
  {
    title: 'The Internal Compass',
    description: 'A thoughtful conversation with the FH team shaping Auditproo\'s future',
    safeLandingTitle: 'Team Insights & Reflections',
    openingNote: 'Dear FH Team Member,\n\nYou are on the front lines of every story — the wins, the losses, and the almosts. This is a warm, reflective conversation to help us make sense of what we are hearing and where we should gently steer next. There are no wrong answers, only honest ones. Thank you for your trust and your insight.',
    questions: [
      {
        text: 'Which types of firms seemed to light up the most when they discovered Auditproo? (What made them feel like home?)',
        type: 'open_ended',
        required: true,
      },
      {
        text: 'What gentle patterns did you notice among firms who decided to say "yes"? (What were they whispering to themselves before they committed?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'What questions or concerns surfaced most often during demos and sales conversations? (And how did they make you feel?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'What little friction points — bugs, workflow hiccups, or usability moments — did you find yourself explaining more than once? (We want to smooth those roads.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'Where did you sense prospects quietly losing momentum or drifting away? (Was it a moment, a feature, a feeling?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'Looking back with a kind but honest eye, what do you believe most contributed to customers stepping back or lapsing? (No blame, just understanding.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'Which customer types still feel like an open door worth knocking on after the revamp? (Who is waiting for us to get this right?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'What words or messages seemed to land most softly and truly with serious prospects? (What made them lean in?)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'What is a customer success story that still makes you smile? (We need those reminders of why we do this.)',
        type: 'open_ended',
        required: false,
      },
      {
        text: 'If you could whisper one wish into the ear of the product and leadership team, what would it be? (This is your moment — we are listening with full hearts.)',
        type: 'open_ended',
        required: false,
      },
    ],
  },
];

// ─── 3. Insert new surveys and questions ──────────────────────────────────────
const closingMessage = 'Thank you for sharing your time, your honesty, and your perspective. Every response is a gift that helps us build something more human, more helpful, and more worthy of the trust you place in us. We are deeply grateful — and we are just getting started.';

for (const survey of surveys) {
  console.log(`\nCreating survey: "${survey.title}"…`);

  const [surveyResult] = await conn.execute(
    `INSERT INTO surveys (title, description, organizationId, status, createdAt, updatedAt)
     VALUES (?, ?, ?, 'active', NOW(), NOW())`,
    [survey.title, survey.description, ORG_ID]
  );
  const surveyId = surveyResult.insertId;
  console.log(`  Survey ID: ${surveyId}`);

  // Insert opening note as first question (end_message type used as intro)
  // We'll use open_ended with the opening note text as a description prefix
  // Actually insert a proper welcome/intro using questionType end_message at sort 0
  // but that would show at end. Instead we store the opening note in the survey description
  // and update it to include the opening note.
  await conn.execute(
    `UPDATE surveys SET description = ? WHERE id = ?`,
    [`${survey.openingNote}\n\n---\n\n${survey.description}`, surveyId]
  );

  // Insert questions
  let sortOrder = 1;
  for (const q of survey.questions) {
    const key = `q${sortOrder}`;
    const optionsJson = q.options ? JSON.stringify(q.options) : null;
    await conn.execute(
      `INSERT INTO survey_questions (surveyId, organizationId, questionKey, questionText, questionType, options, isRequired, sortOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [surveyId, ORG_ID, key, q.text, q.type, optionsJson, q.required ? 1 : 0, sortOrder]
    );
    console.log(`  Q${sortOrder}: ${q.text.substring(0, 60)}…`);
    sortOrder++;
  }

  // Insert closing message as final question
  await conn.execute(
    `INSERT INTO survey_questions (surveyId, organizationId, questionKey, questionText, questionType, options, isRequired, sortOrder, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'end_message', NULL, 0, ?, 1, NOW(), NOW())`,
    [surveyId, ORG_ID, `q${sortOrder}`, closingMessage, sortOrder]
  );
  console.log(`  Q${sortOrder}: [Closing message]`);
}

console.log('\n✅ All 4 Auditproo surveys created successfully.');
await conn.end();

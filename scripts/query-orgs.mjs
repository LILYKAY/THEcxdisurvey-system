import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [orgs] = await conn.execute('SELECT id, name FROM organizations ORDER BY id');
console.log('=== ORGANIZATIONS ===');
console.table(orgs);

const [surveys] = await conn.execute(
  'SELECT id, title, organizationId, status FROM surveys ORDER BY organizationId, id'
);
console.log('\n=== SURVEYS ===');
console.table(surveys);

const [questions] = await conn.execute(
  'SELECT id, surveyId, questionText, questionType, orderIndex FROM survey_questions ORDER BY surveyId, orderIndex'
);
console.log('\n=== QUESTIONS ===');
console.table(questions);

await conn.end();

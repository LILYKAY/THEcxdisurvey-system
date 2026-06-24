#!/usr/bin/env node
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://doadmin:AVNS_nfHp3Gbh3n1_RtwlbvD@db-mysql-nyc3-16637-do-user-39091696-0.a.db.ondigitalocean.com:25060/defaultdb';

async function setupDatabase() {
  let connection;
  try {
    console.log('[DB Setup] 🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('[DB Setup] ✅ Connected successfully');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'drizzle/0000_modern_onslaught.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`[DB Setup] 📋 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.execute(statements[i]);
        console.log(`[DB Setup] ✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Ignore "table already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`[DB Setup] ⚠️  Statement ${i + 1}/${statements.length} skipped (table exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('[DB Setup] ✅ All tables created/verified');

    // Create admin user
    console.log('[DB Setup] 👤 Creating admin user...');
    const email = 'info@thecxdi.com';
    const password = 'Cxsuccess!';
    const passwordHash = await bcryptjs.hash(password, 10);

    try {
      await connection.execute(
        `INSERT INTO users (openId, email, name, loginMethod, role, passwordHash, createdAt, updatedAt, lastSignedIn) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        ['admin-001', email, 'Admin User', 'email', 'admin', passwordHash]
      );
      console.log('[DB Setup] ✅ Admin user created');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('[DB Setup] ⚠️  Admin user already exists');
      } else {
        throw error;
      }
    }

    // Verify user was created
    const [users] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      console.log('[DB Setup] ✅ User verification successful:');
      console.log(`   - Email: ${users[0].email}`);
      console.log(`   - Role: ${users[0].role}`);
      console.log(`   - ID: ${users[0].id}`);
    }

    console.log('\n[DB Setup] 🎉 Database setup complete!');
    console.log('[DB Setup] You can now login with:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Password: ${password}`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('[DB Setup] ❌ Error:', error.message);
    if (error.sql) {
      console.error('[DB Setup] SQL:', error.sql);
    }
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

setupDatabase();

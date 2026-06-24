import mysql from 'mysql2/promise';
import bcryptjs from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://doadmin:AVNS_nfHp3Gbh3n1_RtwlbvD@db-mysql-nyc3-16637-do-user-39091696-0.a.db.ondigitalocean.com:25060/defaultdb';

async function createAdminUser() {
  try {
    console.log('[Setup] Connecting to database...');
    const connection = await mysql.createConnection(DATABASE_URL);
    
    const email = 'info@thecxdi.com';
    const password = 'Cxsuccess!';
    const passwordHash = await bcryptjs.hash(password, 10);
    
    console.log('[Setup] Creating admin user...');
    await connection.execute(
      `INSERT INTO users (openId, email, name, loginMethod, role, passwordHash, createdAt, updatedAt, lastSignedIn) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      ['admin-001', email, 'Admin User', 'email', 'admin', passwordHash]
    );
    
    console.log('[Setup] ✅ Admin user created successfully!');
    console.log(`[Setup] Email: ${email}`);
    console.log(`[Setup] Password: ${password}`);
    
    await connection.end();
  } catch (error) {
    console.error('[Setup] Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'kheye_now.db');
const SCHEMA_PATH = path.join(process.cwd(), 'schema.sql');
const SEED_PATH = path.join(process.cwd(), 'seed.sql');

function initDatabase() {
  console.log('🔄 Initializing Kheye Now! SQL Database...');

  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql);
    console.log('✅ Executed schema.sql - Created food_items table');

    const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
    db.exec(seedSql);
    console.log('✅ Executed seed.sql - Inserted initial food items');

    const countResult = db.prepare('SELECT COUNT(*) as count FROM food_items').get() as { count: number };
    console.log(`🎉 Database ready! Total food items in table: ${countResult.count}`);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    db.close();
  }
}

initDatabase();

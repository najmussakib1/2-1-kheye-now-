import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'kheye_now.db');
const SCHEMA_PATH = path.join(process.cwd(), 'schema.sql');
const SEED_PATH = path.join(process.cwd(), 'seed.sql');

function initDatabase() {
  console.log('🔄 Initializing Kheye Now! SQL Database...');

  // Delete existing db file for fresh initialization
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️ Removed old database file for clean reset');
  }

  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql);
    console.log('✅ Executed schema.sql - Created tables');

    const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
    db.exec(seedSql);
    console.log('✅ Executed seed.sql - Inserted initial data');

    const countResult = db.prepare('SELECT COUNT(*) as count FROM food_items').get() as { count: number };
    const restCount = db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number };
    console.log(`🎉 Database ready! Total restaurants: ${restCount.count}, food items: ${countResult.count}`);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    db.close();
  }
}

initDatabase();

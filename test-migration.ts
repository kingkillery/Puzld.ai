
import { initDatabase, closeDatabase } from './src/memory/database';

try {
  const db = initDatabase();
  const row = db.prepare("SELECT value FROM metadata WHERE key = 'schema_version'").get() as { value: string };
  const version = row ? row.value : '0';
  console.log('Schema version:', version);

  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_preferences'").get();
  console.log('user_preferences table exists:', !!tableExists);

  if (tableExists) {
     db.prepare("INSERT OR REPLACE INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)").run('test_key', 'test_value', Date.now());
     const row = db.prepare("SELECT * FROM user_preferences WHERE key = 'test_key'").get();
     console.log('Inserted row:', row);
  }

} catch (e) {
  console.error(e);
} finally {
  closeDatabase();
}

import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { getUserId } from '@/core/constants';

export interface ChatMessage {
  id: string;
  characterId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

const DB_NAME = 'bunker_chat.db';
let dbInstance: SQLiteDatabase | null = null;

async function getDb(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDatabaseAsync(DB_NAME);
  await initDb(dbInstance);
  return dbInstance;
}

async function initDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_char_time
      ON chat_messages(character_id, created_at DESC);
  `);
}

export async function getMessages(characterId: string, limit = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  try {
    const rows = await db.getAllAsync<{
      id: string;
      character_id: string;
      role: 'user' | 'assistant';
      content: string;
      created_at: number;
    }>(
      'SELECT id, character_id, role, content, created_at FROM chat_messages WHERE character_id = ? ORDER BY created_at ASC LIMIT ?',
      [characterId, limit]
    );
    return rows.map((row) => ({
      id: row.id,
      characterId: row.character_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  } catch (e) {
    console.error('[ChatStorageService] getMessages error:', e);
    throw e;
  }
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  const db = await getDb();
  try {
    await db.runAsync(
      'INSERT INTO chat_messages (id, character_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      [msg.id, msg.characterId, msg.role, msg.content, msg.createdAt]
    );
  } catch (e) {
    console.error('[ChatStorageService] saveMessage error:', e);
    throw e;
  }
}

export async function clearHistory(characterId: string): Promise<void> {
  const db = await getDb();
  try {
    await db.runAsync('DELETE FROM chat_messages WHERE character_id = ?', [characterId]);
  } catch (e) {
    console.error('[ChatStorageService] clearHistory error:', e);
    throw e;
  }
}

export async function getDbSizeBytes(): Promise<number> {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
    const info = await FileSystem.getInfoAsync(dbPath);
    if (info.exists && info.size) {
      return info.size;
    }
    return 0;
  } catch {
    return 0;
  }
}

export const ChatStorageService = {
  getMessages,
  saveMessage,
  clearHistory,
  getDbSizeBytes,
};

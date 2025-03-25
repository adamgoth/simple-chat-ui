import Database from 'better-sqlite3';
import path from 'path';
import { Message, Conversation } from '@/types/chat';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    // Store the database file in a 'data' directory
    const dbPath = path.join(process.cwd(), 'data', 'conversations.db');
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    const createTables = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        model TEXT NOT NULL,
        llm TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT,
        llm TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    `;

    this.db.exec(createTables);
  }

  createConversation(
    userId: string,
    title: string,
    model: string,
    llm: string,
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (user_id, title, model, llm)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, title, model, llm);
    return result.lastInsertRowid as number;
  }

  saveMessage(conversationId: number, message: Message) {
    const stmt = this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, model, llm)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      conversationId,
      message.role,
      message.content,
      message.model || null,
      message.llm || null,
    );

    // Update the conversation's updated_at timestamp
    this.db
      .prepare(
        `
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      )
      .run(conversationId);

    return result.lastInsertRowid;
  }

  getConversation(conversationId: number) {
    const conversation = this.db
      .prepare(
        `
      SELECT * FROM conversations WHERE id = ?
    `,
      )
      .get(conversationId) as Conversation | undefined;

    if (!conversation) return null;

    const messages = this.db
      .prepare(
        `
      SELECT * FROM messages 
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `,
      )
      .all(conversationId);

    return { conversation, messages };
  }

  getUserConversations(userId: string) {
    return this.db
      .prepare(
        `
      SELECT * FROM conversations 
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `,
      )
      .all(userId);
  }

  deleteConversation(conversationId: number) {
    return this.db
      .prepare('DELETE FROM conversations WHERE id = ?')
      .run(conversationId);
  }

  searchConversations(userId: string, query: string) {
    return this.db
      .prepare(
        `
      SELECT DISTINCT c.* 
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = ?
        AND (
          c.title LIKE ?
          OR m.content LIKE ?
        )
      ORDER BY c.updated_at DESC
    `,
      )
      .all(userId, `%${query}%`, `%${query}%`);
  }
}

// Export a singleton instance
export const dbService = new DatabaseService();

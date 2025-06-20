import fs from "fs";
import path from "path";
import { Database } from "bun:sqlite";
import { NostrEvent, NostrFilter } from "./types.js";

export default class Jar {
  db: Database;
  insertStmt: ReturnType<Database["prepare"]>;

  constructor(public filename: string) {
    const dbPath = path.resolve(filename);
    const isNew = !fs.existsSync(dbPath);

    this.db = new Database(dbPath);

    if (isNew) {
      this.db.run(`
        CREATE TABLE events (
          id TEXT PRIMARY KEY,
          pubkey TEXT,
          created_at INTEGER,
          kind INTEGER,
          tags TEXT,
          content TEXT,
          sig TEXT
        );
      `);
    }

    this.insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO events (id, pubkey, created_at, kind, tags, content, sig)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  }

  insertEvent(event: NostrEvent) {
    this.insertStmt.run(
      event.id,
      event.pubkey,
      event.created_at,
      event.kind,
      JSON.stringify(event.tags),
      event.content,
      event.sig
    );
  }

  queryEvents(filter: NostrFilter): NostrEvent[] {
    let sql = "SELECT * FROM events WHERE 1=1";
    const params: any[] = [];

    if (filter.ids && filter.ids.length > 0) {
      sql += ` AND id IN (${filter.ids.map(() => "?").join(",")})`;
      params.push(...filter.ids);
    }
    if (filter.authors && filter.authors.length > 0) {
      sql += ` AND pubkey IN (${filter.authors.map(() => "?").join(",")})`;
      params.push(...filter.authors);
    }
    if (filter.kinds && filter.kinds.length > 0) {
      sql += ` AND kind IN (${filter.kinds.map(() => "?").join(",")})`;
      params.push(...filter.kinds);
    }
    if (filter.since) {
      sql += ` AND created_at >= ?`;
      params.push(filter.since);
    }
    if (filter.until) {
      sql += ` AND created_at <= ?`;
      params.push(filter.until);
    }

    sql += " ORDER BY created_at DESC";

    if (filter.limit) {
      sql += " LIMIT ?";
      params.push(filter.limit);
    } else {
      sql += " LIMIT 100";
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map((row: any) => ({
      id: row.id,
      pubkey: row.pubkey,
      created_at: row.created_at,
      kind: row.kind,
      tags: JSON.parse(row.tags),
      content: row.content,
      sig: row.sig,
    }));
  }
}
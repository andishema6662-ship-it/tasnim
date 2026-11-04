import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

async function loadSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (file) => {
      // Prefer copied public asset for offline/Electron file:// loads.
      if (file.endsWith('.wasm')) return './sql-wasm.wasm';
      return `./${file}`;
    },
  });
  return SQL;
}

export type DocRow = {
  id: string;
  title: string;
  folder: string;
  status: string;
  classification: string;
  ocr_text: string;
  file_path: string;
  created_at: string;
  updated_at: string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  folder TEXT NOT NULL,
  status TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'عادی',
  ocr_text TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title, ocr_text, content='documents', content_rowid='rowid'
);
CREATE TABLE IF NOT EXISTS recycle_bin (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  deleted_at TEXT NOT NULL
);
`;

export async function openArchiveDb(): Promise<Database> {
  const sql = await loadSql();
  const existing = window.archiveApi ? await window.archiveApi.readSqlite() : null;
  if (existing) {
    const bytes =
      existing instanceof Uint8Array
        ? existing
        : new Uint8Array(existing as ArrayBuffer);
    db = new sql.Database(bytes);
  } else {
    db = new sql.Database();
  }
  db.run(SCHEMA);
  seedIfEmpty(db);
  await persist();
  return db;
}

function seedIfEmpty(database: Database) {
  const count = database.exec('SELECT COUNT(*) AS c FROM folders');
  const n = Number(count[0]?.values?.[0]?.[0] ?? 0);
  if (n > 0) return;
  const folders = [
    ['f-secretariat', 'دبیرخانه', null],
    ['f-active', 'پرونده‌های جاری', null],
    ['f-cold', 'بایگانی راکد', null],
    ['f-incoming', 'وارده', 'f-secretariat'],
    ['f-outgoing', 'صادره', 'f-secretariat'],
  ];
  const stmt = database.prepare(
    'INSERT INTO folders (id, name, parent_id) VALUES (?, ?, ?)',
  );
  for (const row of folders) {
    stmt.run(row);
  }
  stmt.free();
}

export async function persist() {
  if (!db || !window.archiveApi) return;
  const data = db.export();
  await window.archiveApi.writeSqlite(data);
}

export function listFolders() {
  if (!db) return [];
  return db.exec('SELECT id, name, parent_id FROM folders ORDER BY name')[0]?.values?.map(
    (v) => ({
      id: String(v[0]),
      name: String(v[1]),
      parentId: v[2] ? String(v[2]) : null,
    }),
  ) ?? [];
}

export function listDocuments(folder?: string): DocRow[] {
  if (!db) return [];
  const rows = folder
    ? db.exec(
        'SELECT id, title, folder, status, classification, ocr_text, file_path, created_at, updated_at FROM documents WHERE folder = ? ORDER BY updated_at DESC',
        [folder],
      )
    : db.exec(
        'SELECT id, title, folder, status, classification, ocr_text, file_path, created_at, updated_at FROM documents ORDER BY updated_at DESC',
      );
  return (rows[0]?.values ?? []).map((v) => ({
    id: String(v[0]),
    title: String(v[1]),
    folder: String(v[2]),
    status: String(v[3]),
    classification: String(v[4]),
    ocr_text: String(v[5]),
    file_path: String(v[6]),
    created_at: String(v[7]),
    updated_at: String(v[8]),
  }));
}

export async function upsertDocument(doc: DocRow) {
  if (!db) return;
  db.run(
    `INSERT INTO documents (id, title, folder, status, classification, ocr_text, file_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       folder=excluded.folder,
       status=excluded.status,
       classification=excluded.classification,
       ocr_text=excluded.ocr_text,
       file_path=excluded.file_path,
       updated_at=excluded.updated_at`,
    [
      doc.id,
      doc.title,
      doc.folder,
      doc.status,
      doc.classification,
      doc.ocr_text,
      doc.file_path,
      doc.created_at,
      doc.updated_at,
    ],
  );
  await persist();
}

export async function softDeleteDocument(id: string) {
  if (!db) return;
  const docs = listDocuments().filter((d) => d.id === id);
  if (!docs[0]) return;
  db.run('INSERT INTO recycle_bin (id, payload, deleted_at) VALUES (?, ?, ?)', [
    id,
    JSON.stringify(docs[0]),
    new Date().toISOString(),
  ]);
  db.run('DELETE FROM documents WHERE id = ?', [id]);
  await persist();
}

export function searchDocuments(query: string): DocRow[] {
  if (!db || !query.trim()) return listDocuments();
  const like = `%${query.trim()}%`;
  const rows = db.exec(
    `SELECT id, title, folder, status, classification, ocr_text, file_path, created_at, updated_at
     FROM documents
     WHERE title LIKE ? OR ocr_text LIKE ?
     ORDER BY updated_at DESC`,
    [like, like],
  );
  return (rows[0]?.values ?? []).map((v) => ({
    id: String(v[0]),
    title: String(v[1]),
    folder: String(v[2]),
    status: String(v[3]),
    classification: String(v[4]),
    ocr_text: String(v[5]),
    file_path: String(v[6]),
    created_at: String(v[7]),
    updated_at: String(v[8]),
  }));
}

export function stats() {
  const docs = listDocuments();
  const ocrDone = docs.filter((d) => d.status === 'بایگانی شده' || d.ocr_text).length;
  const queued = docs.filter((d) => d.status === 'در حال پردازش OCR').length;
  return {
    total: docs.length,
    ocrDone,
    queued,
    dbLabel: 'SQLite محلی',
  };
}

/// <reference types="vite/client" />

interface ArchiveApi {
  getPaths: () => Promise<{
    root: string;
    dbDir: string;
    docsDir: string;
    configPath: string;
    vaultPath: string;
    tessdata: string;
    version: string;
    offline: boolean;
  }>;
  readConfig: () => Promise<Record<string, unknown>>;
  writeConfig: (config: Record<string, unknown>) => Promise<boolean>;
  hasAdmin: () => Promise<boolean>;
  setupAdmin: (password: string) => Promise<{ user: string; recoveryKey: string }>;
  login: (password: string) => Promise<{ ok: boolean; user?: string; reason?: string }>;
  recover: (
    recoveryKey: string,
    newPassword: string,
  ) => Promise<{ ok: boolean; recoveryKey?: string; reason?: string }>;
  pickFolder: () => Promise<string | null>;
  pickImages: () => Promise<string[]>;
  readFileBase64: (filePath: string) => Promise<{
    name: string;
    path: string;
    mime: string;
    dataUrl: string;
  }>;
  saveDocument: (payload: {
    id: string;
    fileName: string;
    dataBase64: string;
  }) => Promise<string>;
  readSqlite: () => Promise<ArrayBuffer | Uint8Array | null>;
  writeSqlite: (bytes: Uint8Array | number[]) => Promise<string>;
  listOcrModels: () => Promise<Array<{ name: string; size: number; path: string }>>;
  openPath: (target: string) => Promise<string>;
}

interface Window {
  archiveApi?: ArchiveApi;
}

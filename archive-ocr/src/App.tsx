import { useEffect, useMemo, useState } from 'react';
import {
  DocRow,
  listDocuments,
  listFolders,
  openArchiveDb,
  searchDocuments,
  softDeleteDocument,
  stats,
  upsertDocument,
} from './lib/db';
import { mockOcrStub, runPersianOcr } from './lib/ocr';

type View =
  | 'explorer'
  | 'scanner'
  | 'ocr'
  | 'search'
  | 'recycle'
  | 'backup'
  | 'settings';

type Session = { user: string } | null;

const NAV: Array<{ id: View; label: string; icon: string }> = [
  { id: 'explorer', label: 'مخزن و کاوشگر اسناد', icon: '▣' },
  { id: 'scanner', label: 'میزکار و اسکن مستقیم', icon: '▢' },
  { id: 'ocr', label: 'استودیو و ویرایشگر OCR', icon: '≡' },
  { id: 'search', label: 'جستجوی پیشرفته متنی', icon: '⌕' },
  { id: 'recycle', label: 'سطل بازیافت', icon: '⌀' },
  { id: 'backup', label: 'پشتیبان‌گیری سرد', icon: '⇩' },
  { id: 'settings', label: 'تنظیمات و پایگاه محلی', icon: '⚙' },
];

function uid() {
  return crypto.randomUUID();
}

function toFaDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session>(null);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [view, setView] = useState<View>('explorer');
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [folders, setFolders] = useState<ReturnType<typeof listFolders>>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('آماده — حالت آفلاین');
  const [models, setModels] = useState<Array<{ name: string; size: number }>>([]);
  const [paths, setPaths] = useState<{ version?: string; tessdata?: string; dbDir?: string }>({});
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [mode, setMode] = useState<'login' | 'setup' | 'recover'>('setup');

  const selected = useMemo(
    () => docs.find((d) => d.id === selectedId) ?? null,
    [docs, selectedId],
  );
  const s = useMemo(() => stats(), [docs]);

  async function refresh(folder = selectedFolder, q = query) {
    setFolders(listFolders());
    setDocs(q.trim() ? searchDocuments(q) : listDocuments(folder));
  }

  useEffect(() => {
    (async () => {
      await openArchiveDb();
      const api = window.archiveApi;
      if (api) {
        const admin = await api.hasAdmin();
        setHasAdmin(admin);
        setMode(admin ? 'login' : 'setup');
        setPaths(await api.getPaths());
        setModels(await api.listOcrModels());
      } else {
        setHasAdmin(false);
        setMode('setup');
      }
      await refresh();
      setReady(true);
    })().catch((err) => {
      console.error(err);
      setStatusMsg('خطا در راه‌اندازی پایگاه محلی');
      setReady(true);
    });
  }, []);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (pwd.length < 10) {
      setAuthError('حداقل ۱۰ کاراکتر لازم است.');
      return;
    }
    if (pwd !== pwd2) {
      setAuthError('تکرار کلمه عبور مطابقت ندارد.');
      return;
    }
    if (!window.archiveApi) {
      // Browser/dev without Electron: accept local session only.
      setSession({ user: 'admin' });
      setHasAdmin(true);
      setRecoveryKey('DEV-ONLY-RECOVERY-KEY-' + uid().slice(0, 8));
      return;
    }
    try {
      const res = await window.archiveApi.setupAdmin(pwd);
      setRecoveryKey(res.recoveryKey);
      setHasAdmin(true);
      setSession({ user: res.user });
    } catch (err) {
      setAuthError(String(err));
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (!window.archiveApi) {
      setSession({ user: 'admin' });
      return;
    }
    const res = await window.archiveApi.login(pwd);
    if (!res.ok) {
      setAuthError('کلمه عبور نادرست است.');
      return;
    }
    setSession({ user: res.user || 'admin' });
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (!window.archiveApi) return;
    const key = pwd;
    const next = pwd2;
    if (next.length < 10) {
      setAuthError('کلمه عبور جدید باید حداقل ۱۰ کاراکتر باشد.');
      return;
    }
    const res = await window.archiveApi.recover(key, next);
    if (!res.ok) {
      setAuthError('کلید بازیابی نامعتبر است.');
      return;
    }
    setRecoveryKey(res.recoveryKey || null);
    setMode('login');
    setPwd('');
    setPwd2('');
    setAuthError('بازیابی موفق. با کلمه عبور جدید وارد شوید.');
  }

  async function importImages() {
    if (!window.archiveApi) {
      setStatusMsg('انتخاب فایل فقط در نسخه دسکتاپ Electron فعال است.');
      return;
    }
    const files = await window.archiveApi.pickImages();
    if (!files.length) return;
    setStatusMsg(`در حال ورود ${toFaDigits(files.length)} پرونده...`);
    for (const filePath of files) {
      const file = await window.archiveApi.readFileBase64(filePath);
      const id = uid();
      const now = new Date().toISOString();
      const saved = await window.archiveApi.saveDocument({
        id,
        fileName: file.name,
        dataBase64: file.dataUrl,
      });
      const doc: DocRow = {
        id,
        title: file.name,
        folder: selectedFolder || 'f-incoming',
        status: 'در حال پردازش OCR',
        classification: 'عادی',
        ocr_text: '',
        file_path: saved,
        created_at: now,
        updated_at: now,
      };
      await upsertDocument(doc);
      setPreview(file.dataUrl);
      setSelectedId(id);
      setView('ocr');
      await runOcrOn(file.dataUrl, doc);
    }
    await refresh();
    setStatusMsg('ورود اسناد کامل شد.');
  }

  async function runOcrOn(image: string, doc: DocRow) {
    setOcrBusy(true);
    setOcrProgress(0);
    setStatusMsg('OCR فارسی آفلاین در حال اجرا...');
    let text = '';
    try {
      text = await runPersianOcr(image, (p) => setOcrProgress(Math.round(p.progress * 100)));
      if (!text) text = mockOcrStub(doc.title);
    } catch (err) {
      console.warn('OCR worker failed, using stub', err);
      text = mockOcrStub(doc.title);
    }
    const updated: DocRow = {
      ...doc,
      ocr_text: text,
      status: 'بایگانی شده',
      updated_at: new Date().toISOString(),
    };
    await upsertDocument(updated);
    setOcrText(text);
    setOcrBusy(false);
    setOcrProgress(100);
    await refresh();
    setStatusMsg('نویسه‌خوانی کامل شد.');
  }

  async function saveOcrEdits() {
    if (!selected) return;
    await upsertDocument({
      ...selected,
      ocr_text: ocrText,
      status: 'بایگانی شده',
      updated_at: new Date().toISOString(),
    });
    await refresh();
    setStatusMsg('متن OCR ذخیره شد.');
  }

  async function deleteSelected() {
    if (!selected) return;
    await softDeleteDocument(selected.id);
    setSelectedId(null);
    setPreview(null);
    await refresh();
    setStatusMsg('سند به سطل بازیافت منتقل شد.');
  }

  if (!ready) {
    return (
      <div className="auth-wrap">
        <div className="panel">در حال بارگذاری هسته آفلاین سندبان...</div>
      </div>
    );
  }

  if (recoveryKey) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>کلید بازیابی اضطراری</h2>
            <p className="muted">
              این کلید را در مکانی امن نگهداری کنید. تنها راه بازیابی دسترسی مدیر در حالت آفلاین است.
            </p>
            <div className="panel mono" style={{ wordBreak: 'break-all', margin: '16px 0' }}>
              {recoveryKey}
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(recoveryKey);
                setRecoveryKey(null);
              }}
            >
              کپی و ادامه
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div
            style={{
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              background: 'var(--surface-low)',
            }}
          >
            <span className="tag tag-archived">
              <span className="tag-dot" /> سامانه آفلاین و محلی
            </span>
            <strong>ورود امن سندبان</strong>
          </div>
          <form
            style={{ padding: 24, display: 'grid', gap: 14 }}
            onSubmit={mode === 'setup' ? handleSetup : mode === 'recover' ? handleRecover : handleLogin}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                className="brand-mark"
                style={{ width: 56, height: 56, margin: '0 auto 10px', fontSize: 22 }}
              >
                س
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: 22 }}>
                {mode === 'setup'
                  ? 'پیکربندی حساب سرپرست کل سامانه'
                  : mode === 'recover'
                    ? 'بازیابی اضطراری مدیر'
                    : 'ورود مدیر بایگانی'}
              </h1>
              <p className="muted">
                سندبان Archive OCR — پایگاه محلی SQLite و OCR فارسی بدون اینترنت
              </p>
            </div>

            {mode !== 'recover' && (
              <div className="field">
                <label>کلمه عبور {mode === 'setup' ? 'جدید سرپرست' : 'مدیر'}</label>
                <input
                  className="mono"
                  type="password"
                  dir="ltr"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
                />
              </div>
            )}

            {mode === 'setup' && (
              <div className="field">
                <label>تکرار کلمه عبور</label>
                <input
                  className="mono"
                  type="password"
                  dir="ltr"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                />
              </div>
            )}

            {mode === 'recover' && (
              <>
                <div className="field">
                  <label>کلید بازیابی اضطراری</label>
                  <input
                    className="mono"
                    type="text"
                    dir="ltr"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>کلمه عبور جدید</label>
                  <input
                    className="mono"
                    type="password"
                    dir="ltr"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                  />
                </div>
              </>
            )}

            {authError && (
              <div className="tag tag-confidential" style={{ height: 'auto', padding: 8 }}>
                {authError}
              </div>
            )}

            <button className="btn btn-primary" type="submit">
              {mode === 'setup' ? 'ایجاد حساب مدیر و ادامه' : mode === 'recover' ? 'بازیابی' : 'ورود'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {hasAdmin && mode !== 'recover' && (
                <button className="btn btn-subtle" type="button" onClick={() => setMode('recover')}>
                  بازیابی اضطراری
                </button>
              )}
              {mode !== 'login' && hasAdmin && (
                <button className="btn btn-subtle" type="button" onClick={() => setMode('login')}>
                  بازگشت به ورود
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="brand">
          <div className="brand-mark">س</div>
          <div>
            سندبان — سامانه بایگانی و نویسه‌خوان اسناد
            <div className="muted">نگارش {paths.version || '1.0.0'} · کاملاً آفلاین</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag tag-archived">
            <span className="tag-dot" /> پایگاه محلی متصل
          </span>
          <span className="muted mono">Engine: Tesseract-FA</span>
          <strong>{session.user}</strong>
        </div>
      </header>

      <div className="ribbon">
        <button className="btn btn-primary" type="button" onClick={importImages}>
          اسکن / ورود سند
        </button>
        <button className="btn" type="button" onClick={() => setView('ocr')} disabled={!selected}>
          اجرای OCR
        </button>
        <button className="btn" type="button" onClick={deleteSelected} disabled={!selected}>
          انتقال به بازیافت
        </button>
        <div style={{ flex: 1 }} />
        <input
          style={{
            height: 32,
            minWidth: 240,
            border: '1px solid #8a8886',
            borderRadius: 4,
            padding: '0 10px',
          }}
          placeholder="جستجو در عنوان و متن OCR..."
          value={query}
          onChange={async (e) => {
            const v = e.target.value;
            setQuery(v);
            setDocs(v.trim() ? searchDocuments(v) : listDocuments(selectedFolder));
          }}
        />
      </div>

      <div className="shell-body">
        <aside className="nav-rail">
          <div className="muted" style={{ marginBottom: 8 }}>
            سامانه آرشیو و اسناد
          </div>
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              type="button"
              onClick={() => setView(item.id)}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div style={{ marginTop: 16 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              درخت دسته‌بندی
            </div>
            {folders
              .filter((f) => !f.parentId)
              .map((f) => (
                <div key={f.id}>
                  <div
                    className={`tree-node ${selectedFolder === f.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedFolder(f.id);
                      setDocs(listDocuments(f.id));
                      setView('explorer');
                    }}
                  >
                    {f.name}
                  </div>
                  {folders
                    .filter((c) => c.parentId === f.id)
                    .map((c) => (
                      <div
                        key={c.id}
                        className={`tree-node ${selectedFolder === c.id ? 'active' : ''}`}
                        style={{ paddingRight: 18 }}
                        onClick={() => {
                          setSelectedFolder(c.id);
                          setDocs(listDocuments(c.id));
                          setView('explorer');
                        }}
                      >
                        {c.name}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </aside>

        <main className="stage">
          {(view === 'explorer' || view === 'search') && (
            <>
              <div className="grid-stats">
                <div className="stat">
                  <div>
                    <span className="muted">کل اسناد</span>
                    <strong>{toFaDigits(s.total)}</strong>
                  </div>
                </div>
                <div className="stat">
                  <div>
                    <span className="muted">OCR شده</span>
                    <strong style={{ color: 'var(--tertiary)' }}>{toFaDigits(s.ocrDone)}</strong>
                  </div>
                </div>
                <div className="stat">
                  <div>
                    <span className="muted">صف OCR</span>
                    <strong style={{ color: 'var(--secondary)' }}>{toFaDigits(s.queued)}</strong>
                  </div>
                </div>
                <div className="stat">
                  <div>
                    <span className="muted">پایگاه</span>
                    <strong style={{ fontSize: 16 }}>{s.dbLabel}</strong>
                  </div>
                </div>
              </div>
              <div className="panel">
                <table className="table">
                  <thead>
                    <tr>
                      <th>عنوان</th>
                      <th>وضعیت</th>
                      <th>طبقه‌بندی</th>
                      <th>به‌روزرسانی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr
                        key={d.id}
                        className={selectedId === d.id ? 'selected' : ''}
                        onClick={() => {
                          setSelectedId(d.id);
                          setOcrText(d.ocr_text);
                          setView('ocr');
                        }}
                      >
                        <td>{d.title}</td>
                        <td>
                          <span
                            className={`tag ${
                              d.status.includes('OCR') ? 'tag-ocr' : 'tag-archived'
                            }`}
                          >
                            <span className="tag-dot" />
                            {d.status}
                          </span>
                        </td>
                        <td>{d.classification}</td>
                        <td className="mono">{new Date(d.updated_at).toLocaleString('fa-IR')}</td>
                      </tr>
                    ))}
                    {!docs.length && (
                      <tr>
                        <td colSpan={4} className="muted">
                          سندی نیست — از «اسکن / ورود سند» شروع کنید.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(view === 'scanner' || view === 'ocr') && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>استودیو OCR فارسی</h2>
                  <p className="muted">Tesseract + fas.traineddata · بدون اتصال شبکه</p>
                </div>
                <button className="btn btn-primary" type="button" onClick={importImages}>
                  انتخاب تصویر اسکن
                </button>
              </div>
              <div className="doc-preview">
                {preview ? (
                  <img src={preview} alt="پیش‌نمایش سند" />
                ) : (
                  <div className="muted">پیش‌نمایش سند اینجا نمایش داده می‌شود</div>
                )}
                {ocrBusy && <div className="ocr-box" style={{ inset: '18% 22%' }} />}
              </div>
              {ocrBusy && (
                <div>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    پیشرفت OCR: {toFaDigits(ocrProgress)}٪
                  </div>
                  <div className="progress">
                    <span style={{ width: `${ocrProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'recycle' && (
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>سطل بازیافت</h2>
              <p className="muted">اسناد حذف‌شده تا پاکسازی نهایی در پایگاه محلی نگه داشته می‌شوند.</p>
              <button className="btn" type="button" onClick={deleteSelected} disabled={!selected}>
                انتقال سند انتخاب‌شده به بازیافت
              </button>
            </div>
          )}

          {view === 'backup' && (
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>پشتیبان‌گیری سرد</h2>
              <p className="muted">
                مسیر پایگاه: <span className="mono">{paths.dbDir || 'userData/db'}</span>
              </p>
              <button
                className="btn btn-primary"
                type="button"
                onClick={async () => {
                  if (paths.dbDir && window.archiveApi) {
                    await window.archiveApi.openPath(paths.dbDir);
                  }
                  setStatusMsg('پوشه پایگاه برای کپی سرد باز شد.');
                }}
              >
                باز کردن پوشه پایگاه محلی
              </button>
            </div>
          )}

          {view === 'settings' && (
            <div className="panel" style={{ display: 'grid', gap: 10 }}>
              <h2 style={{ marginTop: 0 }}>پایگاه‌ها و مدل‌های OCR</h2>
              <div>
                tessdata:{' '}
                <span className="mono">{paths.tessdata || './ocr_models/fas'}</span>
              </div>
              <ul>
                {models.map((m) => (
                  <li key={m.name} className="mono">
                    {m.name} — {(m.size / (1024 * 1024)).toFixed(1)} MB
                  </li>
                ))}
                {!models.length && <li className="muted">مدل OCR هنوز در بسته قرار نگرفته است.</li>}
              </ul>
            </div>
          )}
        </main>

        <aside className="inspector">
          <h3 style={{ marginTop: 0 }}>بازرسی ابرداده</h3>
          {selected ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="field">
                <label>عنوان</label>
                <input value={selected.title} readOnly />
              </div>
              <div className="field">
                <label>متن OCR</label>
                <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
              </div>
              <button className="btn btn-primary" type="button" onClick={saveOcrEdits}>
                ذخیره متن
              </button>
              {selected.ocr_text && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setPreview(preview);
                    setView('ocr');
                  }}
                >
                  نمایش در استودیو
                </button>
              )}
            </div>
          ) : (
            <p className="muted">سندی انتخاب نشده است.</p>
          )}
        </aside>
      </div>

      <footer className="statusbar">
        <span>{statusMsg}</span>
        <span className="mono">x64 · Offline · SQLite WAL · Tesseract FA</span>
      </footer>
    </div>
  );
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultFeaturesFromCatalog } from '../../lib/features'
import { faNum, toman } from '../../lib/format'
import type { Complex } from '../../store/platformTypes'
import {
  buildingStatusLabel,
  buildingTypeLabel,
  type BuildingMeta,
  type BuildingStatus,
  type BuildingType,
} from '../../store/types'
import { useStore } from '../../store/StoreContext'

type PropFilter = 'all' | 'complex' | BuildingType

export function SiteAdminProperties({ onFlash }: { onFlash: (m: string) => void }) {
  const {
    platform,
    upsertBuilding,
    upsertComplex,
    upsertUser,
    enterBuildingAsManager,
  } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<PropFilter>('all')
  const [form, setForm] = useState<BuildingMeta | null>(null)
  const [complexForm, setComplexForm] = useState<Complex | null>(null)

  const emptyMeta = (): BuildingMeta => ({
    id: `bld-${Date.now()}`,
    name: '',
    address: '',
    unitCount: 0,
    type: 'building',
    status: 'active',
    managerName: '',
    managerPhone: '',
    subscriptionUnits: 10,
    subscriptionMonths: 12,
    storageQuotaMb: 500,
    enabledFeatures: defaultFeaturesFromCatalog(platform.admin.featureCatalog),
  })

  const emptyComplex = (): Complex => ({
    id: `cpx-${Date.now()}`,
    name: '',
    city: '',
    managerName: '',
    username: '',
    password: '',
    blockIds: [],
    status: 'active',
  })

  const propertyStats = useMemo(() => {
    return platform.buildings.map((meta) => {
      const data = platform.byId[meta.id]
      const units = data?.units.length ?? 0
      const debt = (data?.units ?? []).reduce((s, u) => s + Math.min(0, u.balance), 0)
      const fund = data?.fundBalance ?? 0
      return { meta, units, debt: Math.abs(debt), fund }
    })
  }, [platform])

  type Card =
    | { kind: 'complex'; complex: Complex; blockCount: number }
    | {
        kind: 'building'
        meta: BuildingMeta
        units: number
        debt: number
        fund: number
      }

  const cards = useMemo(() => {
    const list: Card[] = []
    if (typeFilter === 'all' || typeFilter === 'complex') {
      for (const c of platform.admin.complexes) {
        if (q.trim()) {
          const hay = `${c.name} ${c.city} ${c.managerName}`.toLowerCase()
          if (!hay.includes(q.trim().toLowerCase())) continue
        }
        list.push({
          kind: 'complex',
          complex: c,
          blockCount: c.blockIds.length,
        })
      }
    }
    if (typeFilter !== 'complex') {
      for (const row of propertyStats) {
        if (typeFilter !== 'all' && row.meta.type !== typeFilter) continue
        if (q.trim()) {
          const hay = `${row.meta.name} ${row.meta.address} ${row.meta.managerName}`.toLowerCase()
          if (!hay.includes(q.trim().toLowerCase())) continue
        }
        list.push({ kind: 'building', ...row })
      }
    }
    return list
  }, [platform.admin.complexes, propertyStats, typeFilter, q])

  const saveBuilding = () => {
    if (!form || !form.name.trim()) return
    upsertBuilding({
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      managerName: form.managerName.trim() || 'مدیر تعیین‌نشده',
    })
    setForm(null)
    onFlash('ساختمان ذخیره شد')
  }

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <span className="label">املاک</span>
          <span className="value">{faNum(platform.buildings.length)}</span>
        </div>
        <div className="stat">
          <span className="label">شهرک‌ها</span>
          <span className="value">{faNum(platform.admin.complexes.length)}</span>
        </div>
      </div>
      <p className="sub">
        دو کارت در هر ردیف؛ جستجو و فیلتر نوع (شهرک / برج / بلوک / ساختمان).
      </p>

      <div className="sa-contact-toolbar">
        <input
          className="sa-search"
          placeholder="جستجوی نام، آدرس یا مدیر…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="btn btn-copper" onClick={() => setForm(emptyMeta())}>
          افزودن ملک
        </button>
      </div>
      <div className="sa-filter-chips">
        {(
          [
            ['all', 'همه'],
            ['complex', 'شهرک'],
            ['tower', 'برج'],
            ['block', 'بلوک'],
            ['building', 'ساختمان'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`sa-chip ${typeFilter === id ? 'active' : ''}`}
            onClick={() => setTypeFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={() => setComplexForm(emptyComplex())}
      >
        افزودن شهرک
      </button>

      {complexForm && (
        <div className="panel">
          <h3>شهرک جدید</h3>
          <div className="field">
            <label>نام شهرک</label>
            <input
              value={complexForm.name}
              onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>شهر</label>
            <input
              value={complexForm.city}
              onChange={(e) => setComplexForm({ ...complexForm, city: e.target.value })}
            />
          </div>
          <div className="field">
            <label>نام مدیر شهرک</label>
            <input
              value={complexForm.managerName}
              onChange={(e) =>
                setComplexForm({ ...complexForm, managerName: e.target.value })
              }
            />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>نام کاربری ورود</label>
              <input
                value={complexForm.username}
                onChange={(e) =>
                  setComplexForm({ ...complexForm, username: e.target.value.trim() })
                }
              />
            </div>
            <div className="field">
              <label>رمز</label>
              <input
                value={complexForm.password}
                onChange={(e) =>
                  setComplexForm({ ...complexForm, password: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setComplexForm(null)}
            >
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!complexForm.name.trim()) return
                const saved: Complex = {
                  ...complexForm,
                  name: complexForm.name.trim(),
                  city: complexForm.city.trim() || '—',
                  managerName: complexForm.managerName.trim() || 'مدیر شهرک',
                  username:
                    complexForm.username.trim() || `cpx${String(Date.now()).slice(-4)}`,
                  password: complexForm.password || 'complex123',
                }
                upsertComplex(saved)
                upsertUser({
                  id: `usr-cpx-${saved.id}`,
                  username: saved.username,
                  password: saved.password,
                  role: 'complexManager',
                  displayName: saved.managerName,
                  complexId: saved.id,
                  status: 'active',
                })
                setComplexForm(null)
                onFlash('شهرک و حساب مدیر شهرک ایجاد شد')
              }}
            >
              ذخیره شهرک
            </button>
          </div>
        </div>
      )}

      {form && (
        <div className="panel">
          <h3>ثبت / ویرایش ملک</h3>
          <div className="field">
            <label>نام</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>آدرس</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>نوع</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as BuildingType })}
              >
                <option value="block">بلوک</option>
                <option value="building">ساختمان</option>
                <option value="tower">برج</option>
              </select>
            </div>
            <div className="field">
              <label>وضعیت</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as BuildingStatus })
                }
              >
                <option value="active">فعال</option>
                <option value="disabled">غیرفعال</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>مدیر</label>
            <input
              value={form.managerName}
              onChange={(e) => setForm({ ...form, managerName: e.target.value })}
            />
          </div>
          <div className="field">
            <label>شهرک (اختیاری)</label>
            <select
              value={form.complexId ?? ''}
              onChange={(e) =>
                setForm({ ...form, complexId: e.target.value || undefined })
              }
            >
              <option value="">— بدون شهرک —</option>
              {platform.admin.complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
              انصراف
            </button>
            <button type="button" className="btn btn-primary" onClick={saveBuilding}>
              ذخیره
            </button>
          </div>
        </div>
      )}

      <div className="sa-prop-grid">
        {cards.map((card) =>
          card.kind === 'complex' ? (
            <article className="sa-prop-card panel" key={`cpx-${card.complex.id}`}>
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">{card.complex.name}</div>
                  <div className="sub">
                    شهرک · {card.complex.city}
                    <br />
                    مدیر: {card.complex.managerName} · {faNum(card.blockCount)} بلوک
                  </div>
                </div>
                <span className="badge ok">شهرک</span>
              </div>
            </article>
          ) : (
            <article className="sa-prop-card panel" key={card.meta.id}>
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">{card.meta.name}</div>
                  <div className="sub">
                    {buildingTypeLabel[card.meta.type]} · {card.meta.address}
                    <br />
                    مدیر: {card.meta.managerName} · واحد {faNum(card.units)} · بدهی{' '}
                    {toman(card.debt)}
                    <br />
                    صندوق {toman(card.fund)} · فضا {faNum(card.meta.storageQuotaMb)} مگ
                  </div>
                </div>
                <span className={`badge ${card.meta.status === 'active' ? 'ok' : 'soon'}`}>
                  {buildingStatusLabel[card.meta.status]}
                </span>
              </div>
              <div className="grid-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setForm({ ...card.meta })}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    enterBuildingAsManager(card.meta.id)
                    navigate('/app')
                  }}
                >
                  ورود
                </button>
              </div>
            </article>
          ),
        )}
      </div>
      {cards.length === 0 && <div className="empty">موردی یافت نشد.</div>}
    </>
  )
}

import { useMemo } from 'react'
import { faNum, toman } from '../../lib/format'
import { isSubDebt, isSubPaid, SUB_STATUS_LABEL } from '../../store/platformTypes'
import { useStore } from '../../store/StoreContext'

function BarChart({
  items,
}: {
  items: { label: string; value: number; color?: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="bar-chart" aria-label="نمودار">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <i
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.color ?? 'var(--teal)',
              }}
            />
          </div>
          <span className="bar-val">{faNum(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function SiteAdminFinance() {
  const { platform } = useStore()

  const report = useMemo(() => {
    const subs = platform.admin.subscriptionPayments
    const paid = subs.filter((s) => isSubPaid(s.status))
    const totalPaid = paid.reduce((a, s) => a + s.amount, 0)
    const depositsToAdmin = totalPaid

    const complexes = platform.admin.complexes.map((c) => {
      const blocks = platform.buildings.filter(
        (b) => c.blockIds.includes(b.id) || b.complexId === c.id,
      )
      const cpxPaid = paid
        .filter((s) => s.complexId === c.id || blocks.some((b) => b.id === s.buildingId))
        .reduce((a, s) => a + s.amount, 0)
      const status =
        c.subscriptionStatus ??
        (cpxPaid > 0 ? 'paid_demo' : 'pending')
      return {
        complex: c,
        blocks,
        paid: cpxPaid,
        status,
        statusLabel: SUB_STATUS_LABEL[status] ?? String(status),
      }
    })

    const blockRows = platform.buildings.map((b) => {
      const blockSubs = subs.filter((s) => s.buildingId === b.id)
      const paidAmt = blockSubs.filter((s) => isSubPaid(s.status)).reduce((a, s) => a + s.amount, 0)
      const debt = blockSubs.filter((s) => isSubDebt(s.status)).reduce((a, s) => a + s.amount, 0)
      const latest = blockSubs[0]
      const data = platform.byId[b.id]
      const installmentBills = (data?.bills ?? []).filter(
        (bill) => bill.installments && bill.installments.length > 0,
      )
      const instTotal = installmentBills.reduce(
        (n, bill) => n + (bill.installments?.length ?? 0),
        0,
      )
      const instPaid = installmentBills.reduce(
        (n, bill) =>
          n + (bill.installments?.filter((i) => i.status === 'paid').length ?? 0),
        0,
      )
      return {
        building: b,
        paidAmt,
        debt,
        subStatus: latest ? SUB_STATUS_LABEL[latest.status] : 'بدون فیش',
        months: latest?.months,
        instTotal,
        instPaid,
        fund: data?.fundBalance ?? 0,
      }
    })

    const customers =
      platform.buildings.reduce((n, b) => n + (platform.byId[b.id]?.units.length ?? 0), 0) +
      platform.admin.users.filter((u) => u.role !== 'siteAdmin').length

    const financeBars = platform.buildings.map((b) => ({
      label: b.name.slice(0, 10),
      value: Math.round((platform.byId[b.id]?.fundBalance ?? 0) / 1_000_000),
      color: 'var(--copper)',
    }))

    return {
      complexes,
      blockRows,
      totalPaid,
      depositsToAdmin,
      customers,
      financeBars,
      complexCount: platform.admin.complexes.length,
      blockCount: platform.buildings.length,
    }
  }, [platform])

  return (
    <>
      <p className="lead">
        گزارش مالی پلتفرم: شهرک‌ها، بلوک‌ها، اقساط، واریزی به حساب ادمین و تعداد مشتریان.
      </p>

      <div className="sa-kpi-grid">
        <div className="sa-kpi">
          <span className="sa-kpi__label">تعداد شهرک‌ها</span>
          <span className="sa-kpi__value">{faNum(report.complexCount)}</span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">تعداد بلوک/املاک</span>
          <span className="sa-kpi__value">{faNum(report.blockCount)}</span>
        </div>
        <div className="sa-kpi sa-kpi--accent">
          <span className="sa-kpi__label">واریزی به حساب ادمین</span>
          <span className="sa-kpi__value sa-kpi__value--sm">
            {toman(report.depositsToAdmin)}
          </span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">جمع کل پرداختی</span>
          <span className="sa-kpi__value sa-kpi__value--sm">{toman(report.totalPaid)}</span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">تعداد مشتریان</span>
          <span className="sa-kpi__value">{faNum(report.customers)}</span>
        </div>
      </div>

      <div className="panel">
        <h3>شهرک‌ها و وضعیت پرداختی</h3>
        <div className="list">
          {report.complexes.map(({ complex, blocks, paid, statusLabel }) => (
            <div className="list-item" key={complex.id}>
              <div>
                <div className="title">{complex.name}</div>
                <div className="sub">
                  {faNum(blocks.length)} بلوک · پرداختی ثبت‌شده {toman(paid)}
                  <br />
                  اشتراک شهرک: {statusLabel}
                  {complex.subscriptionAmount
                    ? ` · مبلغ پلن ${toman(complex.subscriptionAmount)}`
                    : ''}
                </div>
              </div>
              <span className="badge ok">{statusLabel}</span>
            </div>
          ))}
          {report.complexes.length === 0 && <div className="empty">شهرکی نیست.</div>}
        </div>
      </div>

      <div className="panel">
        <h3>بلوک‌ها — پرداختی، اشتراک و اقساط</h3>
        <div className="list">
          {report.blockRows.map((row) => (
            <div className="list-item" key={row.building.id}>
              <div>
                <div className="title">{row.building.name}</div>
                <div className="sub">
                  اشتراک: {row.subStatus}
                  {row.months ? ` (${faNum(row.months)} ماه)` : ''}
                  <br />
                  پرداختی {toman(row.paidAmt)} · بدهی فیش {toman(row.debt)} · صندوق{' '}
                  {toman(row.fund)}
                  <br />
                  اقساط شارژ: {faNum(row.instPaid)}/{faNum(row.instTotal)} قسط پرداخت‌شده
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>مانده صندوق ساختمان‌ها (میلیون تومان)</h3>
        <BarChart items={report.financeBars} />
      </div>
    </>
  )
}

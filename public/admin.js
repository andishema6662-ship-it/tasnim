const faNum = new Intl.NumberFormat("fa-IR");
const el = (s) => document.querySelector(s);

const state = { meta: null, resources: [] };

const STATUS_LABELS = {
  pending: "در انتظار تایید",
  approved: "تاییدشده",
  paid: "پرداخت‌شده",
  rejected: "رد شده",
};

function toFa(v) {
  return String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}
function toman(rials) {
  return `${faNum.format(Math.round(rials / 10))} تومان`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function init() {
  state.meta = await (await fetch("/api/meta")).json();
  state.resources = await (await fetch("/api/resources")).json();

  const campSel = el("#occ-camp");
  const camps = await (await fetch("/api/camps")).json();
  campSel.innerHTML =
    '<option value="">همه اردوگاه‌ها</option>' +
    camps.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");

  el("#occ-type").innerHTML =
    '<option value="">همه انواع</option>' +
    Object.entries(state.meta.resourceTypeLabels)
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join("");

  el("#occ-date").value = todayISO();

  el("#status-filter").addEventListener("change", loadRequests);
  el("#occ-date").addEventListener("change", loadOccupancy);
  el("#occ-camp").addEventListener("change", loadOccupancy);
  el("#occ-type").addEventListener("change", loadOccupancy);

  loadStats();
  loadRequests();
  loadOccupancy();
}

async function loadStats() {
  const s = await (await fetch("/api/admin/stats")).json();
  el("#kpi-grid").innerHTML = `
    <div class="kpi-card"><div class="kpi-label">کل درخواست‌ها</div><div class="kpi-value">${toFa(s.requests.total)}</div></div>
    <div class="kpi-card accent"><div class="kpi-label">در انتظار تایید</div><div class="kpi-value">${toFa(s.requests.pending)}</div></div>
    <div class="kpi-card info"><div class="kpi-label">تاییدشده</div><div class="kpi-value">${toFa(s.requests.approved)}</div></div>
    <div class="kpi-card primary"><div class="kpi-label">پرداخت‌شده</div><div class="kpi-value">${toFa(s.requests.paid)}</div></div>
    <div class="kpi-card"><div class="kpi-label">کل منابع</div><div class="kpi-value">${toFa(s.resources.total)}</div></div>
    <div class="kpi-card"><div class="kpi-label">مجموع تخت‌ها</div><div class="kpi-value">${toFa(s.resources.totalBeds)}</div></div>
  `;
  el("#finance-grid").innerHTML = `
    <div class="finance-card paid"><div class="fc-label">درآمد وصول‌شده (پرداخت‌شده)</div><div class="fc-value">${toman(s.revenue.paid)}</div></div>
    <div class="finance-card pipeline"><div class="fc-label">در جریان (در انتظار/تاییدشده)</div><div class="fc-value">${toman(s.revenue.pipeline)}</div></div>
    <div class="finance-card tax"><div class="fc-label">مالیات وصول‌شده</div><div class="fc-value">${toman(s.revenue.taxCollected)}</div></div>
    <div class="finance-card discount"><div class="fc-label">مجموع تخفیف‌های اعطاشده</div><div class="fc-value">${toman(s.revenue.discountsGiven)}</div></div>
  `;
}

async function loadRequests() {
  const list = await (await fetch("/api/requests")).json();
  const filter = el("#status-filter").value;
  const filtered = filter ? list.filter((r) => r.status === filter) : list;
  const tbody = el("#requests-tbody");
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">درخواستی یافت نشد.</td></tr>';
    return;
  }
  tbody.innerHTML = "";
  for (const req of filtered.slice().reverse()) {
    let actions = "";
    if (req.status === "pending") {
      actions = `
        <button class="btn btn-info btn-sm" data-act="approve" data-id="${req.id}">تایید</button>
        <button class="btn btn-danger btn-sm" data-act="reject" data-id="${req.id}">رد</button>`;
    } else if (req.status === "approved") {
      actions = `<button class="btn btn-primary btn-sm" data-act="pay" data-id="${req.id}">ثبت پرداخت</button>`;
    } else {
      actions = '<span class="muted small">—</span>';
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${req.courseTitle}<div class="muted small">${req.id}</div></td>
      <td>${req.customer.name}<div class="muted small">${req.customer.phone}</div></td>
      <td>${toFa(req.items.length)} آیتم</td>
      <td class="amount">${toman(req.invoice.total)}</td>
      <td><span class="badge ${req.status}">${STATUS_LABELS[req.status]}</span></td>
      <td><div class="row-actions">${actions}</div></td>
    `;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("[data-act]").forEach((b) =>
    b.addEventListener("click", () => requestAction(b.dataset.id, b.dataset.act))
  );
}

async function requestAction(id, act) {
  const res = await fetch(`/api/requests/${id}/${act}`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    showToast(data.error || "عملیات ناموفق بود");
    return;
  }
  showToast(`وضعیت به «${STATUS_LABELS[data.status]}» تغییر کرد`);
  loadRequests();
  loadStats();
}

async function loadOccupancy() {
  const date = el("#occ-date").value || todayISO();
  const campId = el("#occ-camp").value;
  const type = el("#occ-type").value;
  const params = new URLSearchParams({ date });
  if (campId) params.set("campId", campId);
  if (type) params.set("type", type);
  const list = await (await fetch(`/api/admin/occupancy?${params}`)).json();
  const box = el("#occupancy-list");
  if (!list.length) {
    box.innerHTML = '<p class="muted">منبعی با این فیلتر یافت نشد.</p>';
    return;
  }
  box.innerHTML = "";
  for (const o of list.slice(0, 60)) {
    box.appendChild(renderOccCard(o));
  }
  if (list.length > 60) {
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = `نمایش ۶۰ مورد از ${toFa(list.length)} منبع. از فیلترها استفاده کنید.`;
    box.appendChild(p);
  }
}

function renderOccCard(o) {
  const div = document.createElement("div");
  div.className = "occ-card";
  const typeLabel = state.meta.resourceTypeLabels[o.type] ?? o.type;
  let body = "";
  if (o.unit === "night") {
    const cls = o.occupancyPct >= 90 ? "high" : o.occupancyPct >= 50 ? "mid" : "";
    body = `
      <div class="occ-bar"><span class="${cls}" style="width:${o.occupancyPct}%"></span></div>
      <div class="occ-meta">اشغال ${toFa(o.used)} از ${toFa(o.capacity)} تخت (${toFa(o.occupancyPct)}٪) · باقی‌مانده ${toFa(o.remaining)}</div>`;
  } else if (o.unit === "slot") {
    const chips = state.meta.timeSlots
      .map((s) => {
        const booked = o.bookedSlots.includes(s.id);
        return `<span class="occ-slot ${booked ? "booked" : "free"}">${s.label}${booked ? " (رزرو)" : " (آزاد)"}</span>`;
      })
      .join("");
    body = `<div class="occ-slots">${chips}</div>`;
  } else {
    const rows = o.perMeal
      .map((m) => `<div class="occ-meal"><span>${m.label}</span><span>${toFa(m.used)} نفر</span></div>`)
      .join("");
    body = `${rows}<div class="occ-meta">مجموع وعده‌ها: ${toFa(o.totalUsed)} نفر · ظرفیت هر وعده ${toFa(o.capacity)}</div>`;
  }
  div.innerHTML = `
    <div class="occ-head">
      <span class="occ-name">${o.name}</span>
      <span class="res-type">${typeLabel}</span>
    </div>
    <div class="occ-sub">${o.building}</div>
    ${body}
  `;
  return div;
}

function showToast(msg) {
  const t = el("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

init();

const faNum = new Intl.NumberFormat("fa-IR");
const el = (s) => document.querySelector(s);

const state = { meta: null, resources: [], imageSections: [], editingCampId: null };

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

  // Camp management wiring
  state.imageSections = (await (await fetch("/api/camp-profiles/meta")).json()).imageSections;
  el("#cf-img-section").innerHTML = state.imageSections
    .map((s) => `<option value="${s.id}">${s.label}</option>`)
    .join("");
  el("#add-camp-btn").addEventListener("click", () => openCampModal(null));
  document
    .getElementById("camp-modal")
    .addEventListener("hidden.bs.modal", () => (state.editingCampId = null));
  el("#cf-add-class").addEventListener("click", () => addClassRow());
  el("#cf-save").addEventListener("click", saveCamp);
  el("#cf-img-add").addEventListener("click", uploadImage);

  setupTabs();

  loadStats();
  loadRequests();
  loadOccupancy();
  loadCampProfiles();
}

function campModal() {
  return bootstrap.Modal.getOrCreateInstance(document.getElementById("camp-modal"));
}

// ---- Sidebar tab navigation ------------------------------------------------
function setupTabs() {
  const links = document.querySelectorAll(".side-link[data-tab]");
  links.forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      links.forEach((l) => l.classList.toggle("active", l === link));
      document
        .querySelectorAll(".tab-panel")
        .forEach((p) => p.classList.toggle("active", p.id === tab));
      const title = el("#page-title");
      if (title) title.textContent = link.dataset.title || title.textContent;
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
  );
}

// ---- Camp profiles management ----------------------------------------------
const CAP_ITEMS = [
  ["reception", "ظرفیت پذیرش", "نفر"],
  ["conferenceHall", "سالن همایش", "نفر"],
  ["amphitheater", "آمفی‌تئاتر", "نفر"],
  ["prayerRoom", "نمازخانه", "نفر"],
  ["selfService", "سلف‌سرویس", "نفر"],
];

function capValue(caps, key) {
  if (key === "reception") return caps.reception || 0;
  return caps[key]?.capacity || 0;
}

async function loadCampProfiles() {
  const camps = await (await fetch("/api/camp-profiles")).json();
  const box = el("#camps-admin-list");
  if (!camps.length) {
    box.innerHTML = '<p class="muted">هنوز اردوگاهی تعریف نشده است.</p>';
    return;
  }
  box.innerHTML = "";
  for (const c of camps) {
    const cover = c.images.find((i) => i.section === "cover") || c.images[0];
    const caps = c.capacities || {};
    const chips = CAP_ITEMS.filter((it) => capValue(caps, it[0]) > 0)
      .map((it) => `<span class="badge rounded-pill text-bg-dark">${it[1]}: ${toFa(capValue(caps, it[0]))} ${it[2]}</span>`)
      .join("");
    const classesChip = caps.classes?.length
      ? `<span class="badge text-bg-secondary">${toFa(caps.classes.length)} کلاس</span>`
      : "";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-body d-flex gap-3 align-items-start flex-wrap">
        <div class="cac-thumb">${cover ? `<img src="${cover.dataUrl}" alt="">` : "🏕️"}</div>
        <div class="flex-grow-1" style="min-width:220px">
          <div class="fw-bold fs-5">${c.name}</div>
          <div class="text-secondary small mb-2"><i class="bi bi-geo-alt"></i> ${c.location || "—"}</div>
          <div class="d-flex flex-wrap gap-2">${chips}${classesChip}<span class="badge text-bg-secondary"><i class="bi bi-image"></i> ${toFa(c.images.length)} تصویر</span></div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-info btn-sm" data-edit="${c.id}"><i class="bi bi-pencil"></i> ویرایش</button>
          <button class="btn btn-outline-danger btn-sm" data-del="${c.id}"><i class="bi bi-trash"></i> حذف</button>
        </div>
      </div>
    `;
    box.appendChild(card);
  }
  box.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openCampModal(b.dataset.edit))
  );
  box.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteCamp(b.dataset.del))
  );
}

function addClassRow(name = "", capacity = "") {
  const wrap = el("#cf-classes");
  const row = document.createElement("div");
  row.className = "input-group input-group-sm cf-class-row";
  row.innerHTML = `
    <input type="text" class="form-control cf-class-name" placeholder="نام کلاس" value="${name}">
    <input type="number" class="form-control cf-class-cap" placeholder="ظرفیت" min="0" value="${capacity}" style="max-width:110px">
    <button type="button" class="btn btn-outline-danger" title="حذف"><i class="bi bi-x-lg"></i></button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  wrap.appendChild(row);
}

async function openCampModal(id) {
  state.editingCampId = id;
  el("#camp-modal-message").className = "form-message hidden";
  el("#cf-classes").innerHTML = "";
  el("#cf-img-gallery").innerHTML = "";
  ["name", "location", "description"].forEach((f) => (el(`#cf-${f}`).value = ""));
  ["reception", "conference", "amphitheater", "prayer", "selfservice"].forEach(
    (f) => (el(`#cf-${f}`).value = 0)
  );

  if (id) {
    el("#camp-modal-title").textContent = "ویرایش اردوگاه";
    const c = await (await fetch(`/api/camp-profiles/${id}`)).json();
    el("#cf-name").value = c.name;
    el("#cf-location").value = c.location || "";
    el("#cf-description").value = c.description || "";
    const caps = c.capacities || {};
    el("#cf-reception").value = caps.reception || 0;
    el("#cf-conference").value = caps.conferenceHall?.capacity || 0;
    el("#cf-amphitheater").value = caps.amphitheater?.capacity || 0;
    el("#cf-prayer").value = caps.prayerRoom?.capacity || 0;
    el("#cf-selfservice").value = caps.selfService?.capacity || 0;
    (caps.classes || []).forEach((cl) => addClassRow(cl.name, cl.capacity));
    el("#cf-img-hint").classList.add("hidden");
    renderGallery(c.images);
  } else {
    el("#camp-modal-title").textContent = "افزودن اردوگاه";
    addClassRow();
    el("#cf-img-hint").classList.remove("hidden");
  }
  campModal().show();
}

function closeCampModal() {
  campModal().hide();
}

function collectPayload() {
  const classes = [...document.querySelectorAll(".cf-class-row")]
    .map((r) => ({
      name: r.querySelector(".cf-class-name").value.trim(),
      capacity: Number(r.querySelector(".cf-class-cap").value) || 0,
    }))
    .filter((c) => c.name || c.capacity > 0);
  return {
    name: el("#cf-name").value.trim(),
    location: el("#cf-location").value.trim(),
    description: el("#cf-description").value.trim(),
    capacities: {
      reception: Number(el("#cf-reception").value) || 0,
      classes,
      conferenceHall: { capacity: Number(el("#cf-conference").value) || 0 },
      amphitheater: { capacity: Number(el("#cf-amphitheater").value) || 0 },
      prayerRoom: { capacity: Number(el("#cf-prayer").value) || 0 },
      selfService: { capacity: Number(el("#cf-selfservice").value) || 0 },
    },
  };
}

async function saveCamp() {
  const msg = el("#camp-modal-message");
  const payload = collectPayload();
  if (!payload.name) {
    msg.textContent = "نام اردوگاه الزامی است.";
    msg.className = "form-message error";
    return;
  }
  const id = state.editingCampId;
  const res = await fetch(id ? `/api/camp-profiles/${id}` : "/api/camp-profiles", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    msg.textContent = data.error || "ذخیره ناموفق بود.";
    msg.className = "form-message error";
    return;
  }
  showToast(id ? "اردوگاه ویرایش شد" : "اردوگاه اضافه شد");
  if (!id) {
    // switch to edit mode so images can be uploaded
    state.editingCampId = data.id;
    el("#camp-modal-title").textContent = "ویرایش اردوگاه";
    el("#cf-img-hint").classList.add("hidden");
    renderGallery(data.images || []);
  }
  loadCampProfiles();
  loadStats();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage() {
  const msg = el("#camp-modal-message");
  const id = state.editingCampId;
  if (!id) {
    msg.textContent = "ابتدا اردوگاه را ذخیره کنید، سپس تصویر بارگذاری کنید.";
    msg.className = "form-message error";
    return;
  }
  const fileInput = el("#cf-img-file");
  const file = fileInput.files[0];
  if (!file) {
    msg.textContent = "یک فایل تصویر انتخاب کنید.";
    msg.className = "form-message error";
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch(`/api/camp-profiles/${id}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      section: el("#cf-img-section").value,
      caption: el("#cf-img-caption").value.trim(),
      dataUrl,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    msg.textContent = data.error || "بارگذاری تصویر ناموفق بود.";
    msg.className = "form-message error";
    return;
  }
  fileInput.value = "";
  el("#cf-img-caption").value = "";
  msg.className = "form-message hidden";
  const camp = await (await fetch(`/api/camp-profiles/${id}`)).json();
  renderGallery(camp.images);
  loadCampProfiles();
  showToast("تصویر بارگذاری شد");
}

function sectionLabel(id) {
  return state.imageSections.find((s) => s.id === id)?.label ?? id;
}

function renderGallery(images) {
  const box = el("#cf-img-gallery");
  box.innerHTML = "";
  for (const im of images) {
    const div = document.createElement("div");
    div.className = "img-thumb";
    div.innerHTML = `
      <span class="img-sec badge text-bg-dark">${sectionLabel(im.section)}</span>
      <button class="img-del btn btn-danger" data-img="${im.id}" title="حذف"><i class="bi bi-x"></i></button>
      <img src="${im.dataUrl}" alt="">
      <div class="img-cap">${im.caption || ""}</div>
    `;
    box.appendChild(div);
  }
  box.querySelectorAll("[data-img]").forEach((b) =>
    b.addEventListener("click", () => deleteImage(b.dataset.img))
  );
}

async function deleteImage(imageId) {
  const id = state.editingCampId;
  const res = await fetch(`/api/camp-profiles/${id}/images/${imageId}`, { method: "DELETE" });
  if (res.ok || res.status === 204) {
    const camp = await (await fetch(`/api/camp-profiles/${id}`)).json();
    renderGallery(camp.images);
    loadCampProfiles();
    showToast("تصویر حذف شد");
  }
}

async function deleteCamp(id) {
  const res = await fetch(`/api/camp-profiles/${id}`, { method: "DELETE" });
  if (res.ok || res.status === 204) {
    showToast("اردوگاه حذف شد");
    loadCampProfiles();
    loadStats();
  }
}

async function loadStats() {
  const s = await (await fetch("/api/admin/stats")).json();
  const kpi = (icon, label, value, color) => `
    <div class="col">
      <div class="card h-100 ${color ? "border-start border-4 border-" + color : ""}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <span class="text-secondary small">${label}</span>
            <i class="bi ${icon} kpi-ic ${color ? "text-" + color : "text-secondary"}"></i>
          </div>
          <div class="kpi-value ${color ? "text-" + color : ""}">${value}</div>
        </div>
      </div>
    </div>`;
  el("#kpi-grid").innerHTML =
    kpi("bi-clipboard-data", "کل درخواست‌ها", toFa(s.requests.total)) +
    kpi("bi-hourglass-split", "در انتظار تایید", toFa(s.requests.pending), "warning") +
    kpi("bi-check-circle", "تاییدشده", toFa(s.requests.approved), "info") +
    kpi("bi-credit-card", "پرداخت‌شده", toFa(s.requests.paid), "success") +
    kpi("bi-building", "کل منابع", toFa(s.resources.total)) +
    kpi("bi-house-door", "مجموع تخت‌ها", toFa(s.resources.totalBeds));

  const fc = (icon, label, value, color) => `
    <div class="col">
      <div class="card h-100 border-start border-4 border-${color}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <span class="text-secondary small">${label}</span>
            <i class="bi ${icon} text-${color}"></i>
          </div>
          <div class="fc-value text-${color} mt-1">${value}</div>
        </div>
      </div>
    </div>`;
  el("#finance-grid").innerHTML =
    fc("bi-cash-coin", "درآمد وصول‌شده (پرداخت‌شده)", toman(s.revenue.paid), "success") +
    fc("bi-graph-up-arrow", "در جریان (در انتظار/تاییدشده)", toman(s.revenue.pipeline), "warning") +
    fc("bi-receipt", "مالیات وصول‌شده", toman(s.revenue.taxCollected), "info") +
    fc("bi-tag", "مجموع تخفیف‌های اعطاشده", toman(s.revenue.discountsGiven), "primary");
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
  const BADGE = {
    pending: "text-bg-warning",
    approved: "text-bg-info",
    paid: "text-bg-success",
    rejected: "text-bg-danger",
  };
  tbody.innerHTML = "";
  for (const req of filtered.slice().reverse()) {
    let actions = "";
    if (req.status === "pending") {
      actions = `
        <button class="btn btn-info btn-sm" data-act="approve" data-id="${req.id}"><i class="bi bi-check-lg"></i> تایید</button>
        <button class="btn btn-outline-danger btn-sm" data-act="reject" data-id="${req.id}">رد</button>`;
    } else if (req.status === "approved") {
      actions = `<button class="btn btn-success btn-sm" data-act="pay" data-id="${req.id}"><i class="bi bi-credit-card"></i> ثبت پرداخت</button>`;
    } else {
      actions = '<span class="text-secondary small">—</span>';
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${req.courseTitle}<div class="text-secondary small">${req.id}</div></td>
      <td>${req.customer.name}<div class="text-secondary small">${req.customer.phone}</div></td>
      <td>${toFa(req.items.length)} آیتم</td>
      <td class="fw-bold text-warning text-nowrap">${toman(req.invoice.total)}</td>
      <td><span class="badge ${BADGE[req.status]}">${STATUS_LABELS[req.status]}</span></td>
      <td><div class="d-flex gap-2">${actions}</div></td>
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
  div.className = "col";
  const typeLabel = state.meta.resourceTypeLabels[o.type] ?? o.type;
  let body = "";
  if (o.unit === "night") {
    const color = o.occupancyPct >= 90 ? "bg-danger" : o.occupancyPct >= 50 ? "bg-warning" : "bg-success";
    body = `
      <div class="progress" role="progressbar" style="height:9px">
        <div class="progress-bar ${color}" style="width:${o.occupancyPct}%"></div>
      </div>
      <div class="text-secondary small mt-2">اشغال ${toFa(o.used)} از ${toFa(o.capacity)} تخت (${toFa(o.occupancyPct)}٪) · باقی‌مانده ${toFa(o.remaining)}</div>`;
  } else if (o.unit === "slot") {
    const chips = state.meta.timeSlots
      .map((s) => {
        const booked = o.bookedSlots.includes(s.id);
        return `<span class="badge ${booked ? "text-bg-danger" : "text-bg-success"}">${s.label}${booked ? " (رزرو)" : " (آزاد)"}</span>`;
      })
      .join("");
    body = `<div class="d-flex flex-wrap gap-2">${chips}</div>`;
  } else {
    const rows = o.perMeal
      .map((m) => `<div class="d-flex justify-content-between text-secondary small py-1"><span>${m.label}</span><span>${toFa(m.used)} نفر</span></div>`)
      .join("");
    body = `${rows}<div class="text-secondary small mt-1">مجموع وعده‌ها: ${toFa(o.totalUsed)} نفر · ظرفیت هر وعده ${toFa(o.capacity)}</div>`;
  }
  div.innerHTML = `
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center gap-2 mb-1">
          <span class="fw-bold">${o.name}</span>
          <span class="badge text-bg-secondary">${typeLabel}</span>
        </div>
        <div class="text-secondary small mb-2">${o.building}</div>
        ${body}
      </div>
    </div>
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

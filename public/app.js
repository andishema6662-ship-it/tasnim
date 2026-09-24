const faNum = new Intl.NumberFormat("fa-IR");
const el = (s) => document.querySelector(s);

const state = {
  meta: null,
  camps: [],
  resources: [],
  cart: [],
  modalResource: null,
};

function toFa(v) {
  return String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}
function toman(rials) {
  return `${faNum.format(Math.round(rials / 10))} تومان`;
}
function faDate(iso) {
  try {
    return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
  } catch {
    return iso;
  }
}
function todayISO(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}
function slotLabel(id) {
  return state.meta.timeSlots.find((s) => s.id === id)?.label ?? id;
}
function mealLabel(id) {
  return state.meta.mealSlots.find((m) => m.id === id)?.label ?? id;
}

async function init() {
  state.meta = await (await fetch("/api/meta")).json();
  state.camps = await (await fetch("/api/camps")).json();
  state.resources = await (await fetch("/api/resources")).json();

  const campFilter = el("#camp-filter");
  campFilter.innerHTML =
    '<option value="">همه اردوگاه‌ها</option>' +
    state.camps.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");

  const typeFilter = el("#type-filter");
  typeFilter.innerHTML =
    '<option value="">همه انواع</option>' +
    Object.entries(state.meta.resourceTypeLabels)
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join("");

  const discountSelect = el("#discount-select");
  discountSelect.innerHTML =
    '<option value="">بدون تخفیف</option>' +
    state.meta.discounts
      .map((d) => `<option value="${d.code}">${d.title} (${toFa(d.percent)}٪)</option>`)
      .join("");

  campFilter.addEventListener("change", renderResources);
  typeFilter.addEventListener("change", renderResources);
  discountSelect.addEventListener("change", () => {
    if (state.cart.length) previewInvoice();
  });
  el("#modal-close").addEventListener("click", closeModal);
  el("#modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  el("#modal-add").addEventListener("click", addToCartFromModal);
  el("#preview-btn").addEventListener("click", previewInvoice);
  el("#submit-btn").addEventListener("click", submitRequest);

  el("#lb-close").addEventListener("click", closeLightbox);
  el("#lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  renderResources();
  loadRequests();
  loadCampShowcase();
}

const CAP_LABELS = [
  ["reception", "ظرفیت پذیرش"],
  ["conferenceHall", "سالن همایش"],
  ["amphitheater", "آمفی‌تئاتر"],
  ["prayerRoom", "نمازخانه"],
  ["selfService", "سلف‌سرویس"],
];

function capVal(caps, key) {
  if (key === "reception") return caps.reception || 0;
  return caps[key]?.capacity || 0;
}

async function loadCampShowcase() {
  const box = el("#camps-showcase");
  if (!box) return;
  const camps = await (await fetch("/api/camp-profiles")).json();
  if (!camps.length) {
    box.innerHTML = '<p class="muted">هنوز اردوگاهی معرفی نشده است.</p>';
    return;
  }
  box.innerHTML = "";
  for (const c of camps) {
    const caps = c.capacities || {};
    const cover = c.images.find((i) => i.section === "cover") || c.images[0];
    const gallery = c.images.filter((i) => i !== cover).slice(0, 6);
    const capCards = CAP_LABELS.filter(([k]) => capVal(caps, k) > 0)
      .map(
        ([k, lbl]) =>
          `<div class="cap-item"><div class="cap-val">${toFa(capVal(caps, k))}</div><div class="cap-lbl">${lbl}</div></div>`
      )
      .join("");
    const classesLine = caps.classes?.length
      ? `<div class="showcase-classes">🎓 ${toFa(caps.classes.length)} کلاس آموزشی${
          caps.classes.length
            ? " (" + caps.classes.map((cl) => `${cl.name}: ${toFa(cl.capacity)}`).join("، ") + ")"
            : ""
        }</div>`
      : "";
    const galleryHtml = gallery.length
      ? `<div class="showcase-gallery">${gallery
          .map((im) => `<img src="${im.dataUrl}" alt="${im.caption || ""}" data-full="${im.dataUrl}">`)
          .join("")}</div>`
      : "";

    const card = document.createElement("article");
    card.className = "showcase-card";
    card.innerHTML = `
      <div class="showcase-cover">${cover ? `<img src="${cover.dataUrl}" alt="${c.name}">` : "🏕️"}</div>
      <div class="showcase-body">
        <h3 class="showcase-name">${c.name}</h3>
        <div class="showcase-loc">📍 ${c.location || "—"}</div>
        <p class="showcase-desc">${c.description || ""}</p>
        <div class="cap-grid">${capCards}</div>
        ${classesLine}
        ${galleryHtml}
      </div>
    `;
    box.appendChild(card);
  }
  box.querySelectorAll("[data-full]").forEach((img) =>
    img.addEventListener("click", () => openLightbox(img.dataset.full))
  );
}

function openLightbox(src) {
  el("#lb-img").src = src;
  el("#lightbox").classList.remove("hidden");
}
function closeLightbox() {
  el("#lightbox").classList.add("hidden");
  el("#lb-img").src = "";
}

function filteredResources() {
  const camp = el("#camp-filter").value;
  const type = el("#type-filter").value;
  return state.resources.filter(
    (r) => (!camp || r.campId === camp) && (!type || r.type === type)
  );
}

function renderResources() {
  const grid = el("#resources-grid");
  const list = filteredResources();
  if (!list.length) {
    grid.innerHTML = '<p class="muted">منبعی با این فیلتر یافت نشد.</p>';
    return;
  }
  grid.innerHTML = "";
  for (const r of list.slice(0, 60)) {
    const typeLabel = state.meta.resourceTypeLabels[r.type] ?? r.type;
    let priceHtml = "";
    if (r.bookingUnit === "night") priceHtml = `<span class="res-price">${toman(r.pricePerNight)} <span>/ شب</span></span>`;
    else if (r.bookingUnit === "slot") priceHtml = `<span class="res-price">${toman(r.pricePerSlot)} <span>/ سانس</span></span>`;
    else priceHtml = `<span class="res-price">قیمت بر اساس وعده</span>`;

    const card = document.createElement("article");
    card.className = "res-card";
    card.innerHTML = `
      <div class="res-top">
        <h3 class="res-name">${r.name}</h3>
        <span class="res-type">${typeLabel}</span>
      </div>
      <div class="res-building">🏢 ${r.building}${r.floor && r.floor !== "-" ? " · طبقه " + r.floor : ""}</div>
      <div class="res-meta">
        <span>ظرفیت: ${toFa(r.capacity)} ${r.bookingUnit === "night" ? "تخت" : "نفر"}</span>
      </div>
      <div class="res-meta">${priceHtml}</div>
      <button class="btn btn-primary btn-sm add-btn" data-id="${r.id}">افزودن به دوره</button>
    `;
    grid.appendChild(card);
  }
  const count = list.length;
  if (count > 60) {
    const note = document.createElement("p");
    note.className = "muted small";
    note.textContent = `نمایش ۶۰ مورد از ${toFa(count)} منبع. برای محدودتر شدن از فیلترها استفاده کنید.`;
    grid.appendChild(note);
  }
  grid.querySelectorAll(".add-btn").forEach((b) =>
    b.addEventListener("click", () => openModal(b.dataset.id))
  );
}

function openModal(resourceId) {
  const r = state.resources.find((x) => x.id === resourceId);
  state.modalResource = r;
  el("#modal-sub").textContent = `${r.name} — ${r.building}`;
  el("#modal-message").className = "form-message hidden";
  const body = el("#modal-body");

  if (r.bookingUnit === "night") {
    el("#modal-title").textContent = "رزرو اقامت (بر اساس شب)";
    body.innerHTML = `
      <div class="form-row">
        <label>تاریخ ورود<input type="date" id="m-checkin" value="${todayISO(1)}"></label>
        <label>تاریخ خروج<input type="date" id="m-checkout" value="${todayISO(3)}"></label>
      </div>
      <label>تعداد نفرات (ظرفیت ${toFa(r.capacity)} تخت)
        <input type="number" id="m-guests" min="1" max="${r.capacity}" value="2"></label>
    `;
  } else if (r.bookingUnit === "slot") {
    el("#modal-title").textContent = "رزرو سالن/کلاس (بر اساس سانس)";
    body.innerHTML = `
      <label>تاریخ استفاده<input type="date" id="m-date" value="${todayISO(1)}"></label>
      <div class="field"><label>سانس‌ها</label>
        <div class="slot-options">
          ${state.meta.timeSlots
            .map(
              (s) =>
                `<label class="slot-chip"><input type="checkbox" value="${s.id}" class="m-slot">${s.label}</label>`
            )
            .join("")}
        </div>
      </div>
    `;
  } else {
    el("#modal-title").textContent = "رزرو وعدهٔ غذایی (بر اساس وعده)";
    body.innerHTML = `
      <label>تاریخ<input type="date" id="m-date" value="${todayISO(1)}"></label>
      <label>وعده
        <select id="m-meal">
          ${state.meta.mealSlots
            .map((m) => `<option value="${m.id}">${m.label} — ${toman(m.pricePerPerson)} هر نفر</option>`)
            .join("")}
        </select>
      </label>
      <label>تعداد نفرات<input type="number" id="m-persons" min="1" value="20"></label>
    `;
  }
  el("#modal-overlay").classList.remove("hidden");
}

function closeModal() {
  el("#modal-overlay").classList.add("hidden");
  state.modalResource = null;
}

function showModalError(msg) {
  const m = el("#modal-message");
  m.textContent = msg;
  m.className = "form-message error";
}

async function addToCartFromModal() {
  const r = state.modalResource;
  if (!r) return;
  let item;

  if (r.bookingUnit === "night") {
    const checkIn = el("#m-checkin").value;
    const checkOut = el("#m-checkout").value;
    const guests = Number(el("#m-guests").value);
    if (!checkIn || !checkOut) return showModalError("تاریخ‌ها را وارد کنید.");
    item = { unit: "night", resourceId: r.id, resourceName: r.name, checkIn, checkOut, guests };
  } else if (r.bookingUnit === "slot") {
    const date = el("#m-date").value;
    const slots = [...document.querySelectorAll(".m-slot:checked")].map((c) => c.value);
    if (!date) return showModalError("تاریخ را وارد کنید.");
    if (!slots.length) return showModalError("حداقل یک سانس انتخاب کنید.");
    item = { unit: "slot", resourceId: r.id, resourceName: r.name, date, slots };
  } else {
    const date = el("#m-date").value;
    const meal = el("#m-meal").value;
    const persons = Number(el("#m-persons").value);
    if (!date) return showModalError("تاریخ را وارد کنید.");
    item = { unit: "meal", resourceId: r.id, resourceName: r.name, date, meal, persons };
  }

  // Validate against the availability engine before adding.
  const check = await (
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
  ).json();
  if (!check.ok) return showModalError(check.reason || "این آیتم قابل رزرو نیست.");

  state.cart.push(item);
  closeModal();
  renderCart();
  previewInvoice();
  showToast("آیتم به دوره اضافه شد");
}

function cartItemText(item) {
  if (item.unit === "night") {
    return {
      main: item.resourceName,
      detail: `اقامت · ${faDate(item.checkIn)} تا ${faDate(item.checkOut)} · ${toFa(item.guests)} نفر`,
    };
  }
  if (item.unit === "slot") {
    return {
      main: item.resourceName,
      detail: `سانس · ${faDate(item.date)} · ${item.slots.map(slotLabel).join("، ")}`,
    };
  }
  return {
    main: item.resourceName,
    detail: `وعده · ${faDate(item.date)} · ${mealLabel(item.meal)} · ${toFa(item.persons)} نفر`,
  };
}

function renderCart() {
  const box = el("#cart-items");
  if (!state.cart.length) {
    box.innerHTML = '<p class="muted small">هنوز آیتمی اضافه نشده. از فهرست منابع، «افزودن به دوره» را بزنید.</p>';
    el("#invoice-box").className = "invoice-box hidden";
  } else {
    box.innerHTML = "";
    state.cart.forEach((item, idx) => {
      const t = cartItemText(item);
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div>
          <div class="ci-main">${t.main}</div>
          <div class="ci-detail">${t.detail}</div>
        </div>
        <button class="ci-remove" data-idx="${idx}" title="حذف">×</button>
      `;
      box.appendChild(div);
    });
    box.querySelectorAll(".ci-remove").forEach((b) =>
      b.addEventListener("click", () => {
        state.cart.splice(Number(b.dataset.idx), 1);
        renderCart();
        if (state.cart.length) previewInvoice();
      })
    );
  }
  const hasItems = state.cart.length > 0;
  el("#preview-btn").disabled = !hasItems;
  el("#submit-btn").disabled = !hasItems;
}

async function previewInvoice() {
  if (!state.cart.length) return;
  const res = await fetch("/api/invoice/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: state.cart, discountCode: el("#discount-select").value }),
  });
  const data = await res.json();
  const box = el("#invoice-box");
  if (!res.ok) {
    box.className = "invoice-box";
    box.innerHTML = `<div class="form-message error">${data.error}</div>`;
    return;
  }
  renderInvoice(box, data);
}

function renderInvoice(box, inv) {
  box.className = "invoice-box";
  let html = '<div style="font-weight:700;margin-bottom:6px">پیش‌فاکتور</div>';
  html += `<div class="invoice-line"><span>جمع کل خدمات</span><span>${toman(inv.subtotal)}</span></div>`;
  if (inv.discount) {
    html += `<div class="invoice-line discount"><span>${inv.discount.title} (${toFa(inv.discount.percent)}٪)</span><span>− ${toman(inv.discountAmount)}</span></div>`;
  }
  html += `<div class="invoice-line"><span>مالیات بر ارزش افزوده (${toFa(Math.round(inv.taxRate * 100))}٪)</span><span>${toman(inv.tax)}</span></div>`;
  html += `<div class="invoice-line total"><span>مبلغ قابل پرداخت</span><span>${toman(inv.total)}</span></div>`;
  box.innerHTML = html;
}

async function submitRequest() {
  const msg = el("#cart-message");
  const payload = {
    courseTitle: el("#course-title").value.trim(),
    customer: {
      name: el("#cust-name").value.trim(),
      phone: el("#cust-phone").value.trim(),
      nationalId: el("#cust-nid").value.trim(),
      memberCount: el("#cust-members").value,
    },
    items: state.cart,
    discountCode: el("#discount-select").value,
  };
  if (!payload.customer.name || !payload.customer.phone) {
    msg.textContent = "نام و شماره تماس مسئول دوره الزامی است.";
    msg.className = "form-message error";
    return;
  }
  const btn = el("#submit-btn");
  btn.disabled = true;
  btn.textContent = "در حال ثبت…";
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || "ثبت درخواست ناموفق بود.";
      msg.className = "form-message error";
    } else {
      msg.textContent = `درخواست دوره ثبت شد. کد: ${data.id}`;
      msg.className = "form-message success";
      state.cart = [];
      el("#course-title").value = "";
      el("#cust-name").value = "";
      el("#cust-phone").value = "";
      el("#cust-nid").value = "";
      el("#cust-members").value = "";
      renderCart();
      showToast("درخواست دوره با موفقیت ثبت شد ✅");
      loadRequests();
    }
  } catch {
    msg.textContent = "خطا در ارتباط با سرور.";
    msg.className = "form-message error";
  } finally {
    btn.disabled = false;
    btn.textContent = "ثبت درخواست دوره";
  }
}

const STATUS_LABELS = {
  pending: "در انتظار تایید",
  approved: "تاییدشده",
  paid: "پرداخت‌شده",
  rejected: "رد شده",
};

async function loadRequests() {
  const list = await (await fetch("/api/requests")).json();
  const box = el("#requests-list");
  if (!list.length) {
    box.innerHTML = '<p class="muted">هنوز درخواستی ثبت نشده است.</p>';
    return;
  }
  box.innerHTML = "";
  for (const req of list.slice().reverse()) {
    const div = document.createElement("div");
    div.className = `request-item ${req.status}`;
    const itemsSummary = req.items
      .map((it) => {
        const r = state.resources.find((x) => x.id === it.resourceId);
        return r ? r.name : it.resourceId;
      })
      .join("، ");
    let actions = "";
    if (req.status === "pending") {
      actions = `
        <button class="btn btn-info btn-sm" data-act="approve" data-id="${req.id}">تایید مدیر</button>
        <button class="btn btn-danger btn-sm" data-act="reject" data-id="${req.id}">رد</button>`;
    } else if (req.status === "approved") {
      actions = `<button class="btn btn-primary btn-sm" data-act="pay" data-id="${req.id}">ثبت پرداخت</button>`;
    }
    div.innerHTML = `
      <div class="req-head">
        <span class="req-title">${req.courseTitle} — ${req.customer.name}</span>
        <span class="badge ${req.status}">${STATUS_LABELS[req.status]}</span>
      </div>
      <div class="req-detail">
        ${toFa(req.items.length)} آیتم: ${itemsSummary}<br>
        کد: ${req.id}${req.customer.memberCount ? " · اعضا: " + toFa(req.customer.memberCount) : ""}
      </div>
      <div class="req-detail">
        جمع: ${toman(req.invoice.subtotal)}
        ${req.invoice.discount ? " · تخفیف: " + toFa(req.invoice.discount.percent) + "٪" : ""}
        · مالیات: ${toman(req.invoice.tax)} ·
        <span class="req-total">قابل پرداخت: ${toman(req.invoice.total)}</span>
      </div>
      <div class="req-actions">${actions}</div>
    `;
    box.appendChild(div);
  }
  box.querySelectorAll("[data-act]").forEach((b) =>
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
}

function showToast(msg) {
  const t = el("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

init();

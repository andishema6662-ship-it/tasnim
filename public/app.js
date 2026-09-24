const fmt = new Intl.NumberFormat("fa-IR");
const state = { camps: [], selectedCamp: null };

const el = (sel) => document.querySelector(sel);

function toFa(str) {
  return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function toman(rials) {
  return `${fmt.format(Math.round(rials / 10))} تومان`;
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
  } catch {
    return iso;
  }
}

async function loadCamps() {
  const res = await fetch("/api/camps");
  state.camps = await res.json();
  renderCamps();
}

function renderCamps() {
  const grid = el("#camps-grid");
  grid.innerHTML = "";
  for (const camp of state.camps) {
    const card = document.createElement("article");
    card.className = "camp-card";
    card.innerHTML = `
      <div class="camp-emoji">${camp.image}</div>
      <div class="camp-body">
        <h3 class="camp-name">${camp.name}</h3>
        <p class="camp-loc">📍 ${camp.location}</p>
        <p class="camp-desc">${camp.description}</p>
        <div class="amenities">
          ${camp.amenities.map((a) => `<span class="chip">${a}</span>`).join("")}
        </div>
        <div class="camp-meta">
          <span class="price">${toman(camp.pricePerNight)} <span>/ هر شب</span></span>
          <span class="capacity">ظرفیت ${toFa(camp.capacity)} نفر</span>
        </div>
        <button class="btn btn-primary btn-block reserve-btn" data-id="${camp.id}">رزرو کنید</button>
      </div>
    `;
    grid.appendChild(card);
  }
  document.querySelectorAll(".reserve-btn").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
}

async function loadReservations() {
  const res = await fetch("/api/reservations");
  const reservations = await res.json();
  const list = el("#reservations-list");
  if (!reservations.length) {
    list.innerHTML = '<p class="muted">هنوز رزروی ثبت نشده است.</p>';
    return;
  }
  list.innerHTML = "";
  for (const r of reservations.slice().reverse()) {
    const camp = state.camps.find((c) => c.id === r.campId);
    const item = document.createElement("div");
    item.className = "reservation-item";
    item.innerHTML = `
      <div>
        <div class="r-main">${camp ? camp.name : r.campId} — ${r.guestName}</div>
        <div class="r-detail">
          ${formatDate(r.checkIn)} تا ${formatDate(r.checkOut)} ·
          ${toFa(r.guests)} نفر · ${toFa(r.nights)} شب · کد ${r.id}
        </div>
      </div>
      <div class="r-price">${toman(r.totalPrice)}</div>
    `;
    list.appendChild(item);
  }
}

function openModal(campId) {
  const camp = state.camps.find((c) => c.id === campId);
  state.selectedCamp = camp;
  el("#camp-id").value = campId;
  el("#modal-camp-name").textContent = camp.name;
  el("#form-message").className = "form-message hidden";
  el("#price-preview").className = "price-preview hidden";
  el("#reservation-form").reset();
  el("#guests").value = 2;

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  el("#checkIn").value = today.toISOString().slice(0, 10);
  el("#checkOut").value = tomorrow.toISOString().slice(0, 10);

  el("#modal-overlay").classList.remove("hidden");
  updatePricePreview();
}

function closeModal() {
  el("#modal-overlay").classList.add("hidden");
}

function updatePricePreview() {
  const camp = state.selectedCamp;
  if (!camp) return;
  const checkIn = el("#checkIn").value;
  const checkOut = el("#checkOut").value;
  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  const preview = el("#price-preview");
  if (nights > 0) {
    preview.innerHTML = `مبلغ کل برای ${toFa(nights)} شب: <strong>${toman(
      nights * camp.pricePerNight
    )}</strong>`;
    preview.className = "price-preview";
  } else {
    preview.className = "price-preview hidden";
  }
}

function showToast(msg) {
  const toast = el("#toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3200);
}

async function submitReservation(e) {
  e.preventDefault();
  const btn = el("#submit-btn");
  const msg = el("#form-message");
  btn.disabled = true;
  btn.textContent = "در حال ثبت…";

  const payload = {
    campId: el("#camp-id").value,
    guestName: el("#guestName").value,
    phone: el("#phone").value,
    checkIn: el("#checkIn").value,
    checkOut: el("#checkOut").value,
    guests: Number(el("#guests").value),
  };

  try {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || "ثبت رزرو ناموفق بود.";
      msg.className = "form-message error";
    } else {
      msg.textContent = `رزرو با موفقیت ثبت شد. کد رزرو: ${data.id}`;
      msg.className = "form-message success";
      await loadReservations();
      showToast("رزرو شما با موفقیت ثبت شد ✅");
      setTimeout(closeModal, 1400);
    }
  } catch {
    msg.textContent = "خطا در ارتباط با سرور.";
    msg.className = "form-message error";
  } finally {
    btn.disabled = false;
    btn.textContent = "ثبت نهایی رزرو";
  }
}

function init() {
  el("#modal-close").addEventListener("click", closeModal);
  el("#modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  el("#reservation-form").addEventListener("submit", submitReservation);
  el("#checkIn").addEventListener("change", updatePricePreview);
  el("#checkOut").addEventListener("change", updatePricePreview);

  loadCamps().then(loadReservations);
}

init();

/** @format */

const STORAGE_KEY = "little-love-archive";
const NOTES_KEY = "little-love-notes";
const defaults = window.LOVE_ARCHIVE_DEFAULTS;
let data = loadData();
let remoteArchive = false;
let actionResolver = null;
let toastTimer = null;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const safeMediaUrl = (value) => (/^(https?:\/\/|data:(image|audio)\/)/i.test(String(value || "")) ? String(value) : "");

function loadData() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaults };
  }
}
function loadNotes() {
  if (Array.isArray(data.sharedNotes)) return data.sharedNotes;
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
  } catch {
    return [];
  }
}
async function loadRemoteArchive() {
  if (window.loveSupabase?.getClient()) {
    try {
      const remote = await window.loveSupabase.loadContent();
      if (remote && Object.keys(remote).length) {
        data = { ...defaults, ...remote };
        remoteArchive = true;
        renderAll();
        return;
      }
    } catch {
      remoteArchive = false;
    }
  }
  if (location.protocol === "file:") return;
  try {
    const response = await fetch("/api/archive", { cache: "no-store" });
    if (!response.ok) return;
    const remote = await response.json();
    if (Object.keys(remote).length) {
      data = { ...defaults, ...remote };
      remoteArchive = true;
      renderAll();
    }
  } catch {
    remoteArchive = false;
  }
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}
function finishAction(confirmed) {
  const resolver = actionResolver;
  actionResolver = null;
  $("#actionDialog").close();
  resolver?.(confirmed);
}
function askConfirmation(title, message) {
  $("#actionTitle").textContent = title;
  $("#actionMessage").textContent = message;
  $("#actionDialog").showModal();
  return new Promise((resolve) => {
    actionResolver = resolve;
  });
}
$("#actionConfirm").addEventListener("click", () => finishAction(true));
$("#actionCancel").addEventListener("click", () => finishAction(false));
$("#actionDialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  finishAction(false);
});
async function saveArchive(message = "") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (window.loveSupabase?.getClient()) {
    await window.loveSupabase.saveContent(data).catch(() => {});
  } else if (remoteArchive && location.protocol !== "file:") {
    await fetch("/api/archive", { method: "PUT", headers: { "Content-Type": "application/json", "x-archive-key": sessionStorage.getItem("archive-admin-key") || "" }, body: JSON.stringify(data) }).catch(() => {});
  }
  if (message) showToast(message);
}
function setText(key, value) {
  $$(`[data-config="${key}"]`).forEach((node) => {
    const template = document.createElement("template");
    template.innerHTML = String(value ?? "");
    const appendAllowed = (parent, source) => {
      source.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) parent.appendChild(document.createTextNode(child.nodeValue));
        else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR") parent.appendChild(document.createElement("br"));
        else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "EM") {
          const emphasis = document.createElement("em");
          appendAllowed(emphasis, child);
          parent.appendChild(emphasis);
        } else if (child.textContent) parent.appendChild(document.createTextNode(child.textContent));
      });
    };
    node.replaceChildren();
    appendAllowed(node, template.content);
  });
}
function renderBase() {
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") setText(key, data[key]);
  });
  $('[data-image="hero"]').src = safeMediaUrl(data.heroImage);
}
function renderMoments() {
  const moments = Array.isArray(data.moments) ? data.moments : [];
  $("#timeline").innerHTML = moments.length ? moments.map((item, index) => `<article class="moment-card reveal" style="transition-delay:${index * 100}ms"><div class="moment-image"><img src="${escapeHtml(safeMediaUrl(item.image))}" alt="${escapeHtml(item.title)}" loading="lazy"></div><span class="moment-date">${escapeHtml(item.date)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join("") : `<p class="empty-moments">Belum ada foto momen. Tambahkan card baru dari halaman config.</p>`;
}
function renderNotes() {
  const allowedColors = ["lilac", "yellow", "pink"];
  $("#notesGrid").innerHTML = data.notes.map((note, index) => `<button class="note-card ${allowedColors.includes(note.color) ? note.color : "lilac"} reveal" style="transition-delay:${index * 100}ms" data-note-index="${index}" type="button"><small>${escapeHtml(note.label)}</small><h3>${escapeHtml(note.title)}</h3><span class="note-hint">tap to open</span><span class="note-fold" aria-hidden="true"></span></button>`).join("");
  $$("[data-note-index]").forEach((card) =>
    card.addEventListener("click", () => {
      const note = data.notes[card.dataset.noteIndex];
      $("#secretTitle").textContent = note.title;
      $("#secretText").textContent = note.text;
      $("#secretLabel").textContent = note.label;
      $("#secretDialog").showModal();
    }),
  );
}
function renderWishlist() {
  $("#wishlistGrid").innerHTML = data.wishlist.map((item, index) => `<label class="wish-card ${item.done ? "is-done" : ""} reveal" style="transition-delay:${index * 80}ms"><input type="checkbox" data-wish-index="${index}" ${item.done ? "checked" : ""}><span class="wish-check"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><b>0${index + 1}</b></label>`).join("");
  $$("[data-wish-index]").forEach((input) =>
    input.addEventListener("change", (event) => {
      data.wishlist[event.target.dataset.wishIndex].done = event.target.checked;
      event.target.closest(".wish-card").classList.toggle("is-done", event.target.checked);
      saveArchive("Wishlist tersimpan");
    }),
  );
}
function renderTracks() {
  $("#tracks").innerHTML = data.tracks.map((track, index) => `<div class="track" data-src="${escapeHtml(safeMediaUrl(track.src))}"><span class="track-number">0${index + 1}</span><button type="button" aria-label="Putar ${escapeHtml(track.title)}">▶</button><div><span class="track-name">${escapeHtml(track.title)}</span><span class="track-artist">${escapeHtml(track.artist)}</span></div></div>`).join("");
}
function renderSharedNotes() {
  const notes = loadNotes();
  $("#sharedNotesGrid").innerHTML = notes.length ? notes.map((note, index) => `<article class="shared-note"><button class="delete-note" type="button" data-shared-note-index="${index}" aria-label="Hapus catatan">×</button><small>${escapeHtml(note.author)}</small><p>${escapeHtml(note.message)}</p><time>${escapeHtml(note.date)}</time></article>`).join("") : `<p class="empty-notes">Belum ada catatan. Tinggalkan satu untuk membuka halaman pertama.</p>`;
}
function initNoteForm() {
  $("#sharedNotesGrid").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-shared-note-index]");
    if (!button) return;
    const confirmed = await askConfirmation("Hapus catatan?", "Catatan kecil ini akan dihapus dari archive.");
    if (!confirmed) return;
    const notes = loadNotes();
    notes.splice(Number(button.dataset.sharedNoteIndex), 1);
    data.sharedNotes = notes;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    await saveArchive("Catatan dihapus");
    renderSharedNotes();
  });
  $("#noteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const notes = loadNotes();
    notes.unshift({ author: $("#noteAuthor").value, message: $("#noteMessage").value, date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) });
    data.sharedNotes = notes.slice(0, 12);
    localStorage.setItem(NOTES_KEY, JSON.stringify(data.sharedNotes));
    saveArchive("Catatan tersimpan");
    event.target.reset();
    renderSharedNotes();
  });
}
function initSecretDialog() {
  $("#closeSecret").addEventListener("click", () => $("#secretDialog").close());
  $("#secretDialog").addEventListener("click", (event) => {
    if (event.target === $("#secretDialog")) $("#secretDialog").close();
  });
}
function initAudio() {
  const player = $("#audioPlayer");
  $("#tracks").addEventListener("click", (event) => {
    const track = event.target.closest(".track");
    if (!track) return;
    const button = $("button", track);
    const src = track.dataset.src;
    if (!src) {
      button.textContent = button.textContent === "▶" ? "♪" : "▶";
      $(".record").classList.toggle("playing", button.textContent === "♪");
      return;
    }
    if (player.src !== new URL(src, location.href).href) player.src = src;
    player.paused ? player.play() : player.pause();
    button.textContent = player.paused ? "▶" : "Ⅱ";
    $(".record").classList.toggle("playing", !player.paused);
  });
}
function initStars() {
  const field = $("#starField");
  for (let index = 0; index < 65; index += 1) {
    const star = document.createElement("i");
    star.className = "star-dot";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 180}%`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    star.style.animationDuration = `${2 + Math.random() * 4}s`;
    field.appendChild(star);
  }
}
function initParallax() {
  const layers = $$("[data-parallax]");
  window.addEventListener(
    "scroll",
    () =>
      layers.forEach((layer) => {
        const speed = Number(layer.dataset.parallax) || 0.1;
        layer.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`;
      }),
    { passive: true },
  );
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    $$(".hero-collage .sticker").forEach((sticker, index) => {
      sticker.style.translate = `${x * (index + 2)}px ${y * (index + 2)}px`;
    });
  });
}
function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((item) => observer.observe(item));
}
function renderAll() {
  renderBase();
  renderMoments();
  renderNotes();
  renderWishlist();
  renderTracks();
  renderSharedNotes();
  revealOnScroll();
}
renderAll();
initNoteForm();
initSecretDialog();
initAudio();
initStars();
initParallax();
loadRemoteArchive();

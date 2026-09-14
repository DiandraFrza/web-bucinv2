/** @format */

const STORAGE_KEY = "little-love-archive";
const NOTES_KEY = "little-love-notes";
const defaults = window.LOVE_ARCHIVE_DEFAULTS;
let data = loadData();
let remoteArchive = false;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

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
async function saveArchive() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (!remoteArchive || location.protocol === "file:") return;
  await fetch("/api/archive", { method: "PUT", headers: { "Content-Type": "application/json", "x-archive-key": sessionStorage.getItem("archive-admin-key") || "" }, body: JSON.stringify(data) }).catch(() => {});
}
function setText(key, value) {
  $$(`[data-config="${key}"]`).forEach((node) => (node.innerHTML = value));
}
function renderBase() {
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") setText(key, data[key]);
  });
  $('[data-image="hero"]').src = data.heroImage;
}
function renderMoments() {
  $("#timeline").innerHTML = data.moments.map((item, index) => `<article class="moment-card reveal" style="transition-delay:${index * 100}ms"><div class="moment-image"><img src="${item.image}" alt="${item.title}" loading="lazy"></div><span class="moment-date">${item.date}</span><h3>${item.title}</h3><p>${item.text}</p></article>`).join("");
}
function renderNotes() {
  $("#notesGrid").innerHTML = data.notes.map((note, index) => `<button class="note-card ${note.color} reveal" style="transition-delay:${index * 100}ms" data-note-index="${index}" type="button"><small>${note.label}</small><h3>${note.title}</h3><span class="note-hint">tap to open</span><span class="note-fold" aria-hidden="true"></span></button>`).join("");
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
  $("#wishlistGrid").innerHTML = data.wishlist.map((item, index) => `<label class="wish-card ${item.done ? "is-done" : ""} reveal" style="transition-delay:${index * 80}ms"><input type="checkbox" data-wish-index="${index}" ${item.done ? "checked" : ""}><span class="wish-check"></span><span><strong>${item.title}</strong><small>${item.detail}</small></span><b>0${index + 1}</b></label>`).join("");
  $$("[data-wish-index]").forEach((input) =>
    input.addEventListener("change", (event) => {
      data.wishlist[event.target.dataset.wishIndex].done = event.target.checked;
      event.target.closest(".wish-card").classList.toggle("is-done", event.target.checked);
      saveArchive();
    }),
  );
}
function renderTracks() {
  $("#tracks").innerHTML = data.tracks.map((track, index) => `<div class="track" data-src="${track.src}"><span class="track-number">0${index + 1}</span><button type="button" aria-label="Putar ${track.title}">▶</button><div><span class="track-name">${track.title}</span><span class="track-artist">${track.artist}</span></div></div>`).join("");
}
function renderSharedNotes() {
  const notes = loadNotes();
  $("#sharedNotesGrid").innerHTML = notes.length ? notes.map((note) => `<article class="shared-note"><small>${note.author}</small><p>${note.message}</p><time>${note.date}</time></article>`).join("") : `<p class="empty-notes">Belum ada catatan. Tinggalkan satu untuk membuka halaman pertama.</p>`;
}
function initNoteForm() {
  $("#noteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const notes = loadNotes();
    notes.unshift({ author: $("#noteAuthor").value, message: $("#noteMessage").value, date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) });
    data.sharedNotes = notes.slice(0, 12);
    localStorage.setItem(NOTES_KEY, JSON.stringify(data.sharedNotes));
    saveArchive();
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

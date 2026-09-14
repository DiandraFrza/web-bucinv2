/** @format */

const STORAGE_KEY = "little-love-archive";
const defaults = window.LOVE_ARCHIVE_DEFAULTS;
const textKeys = ["brand", "title", "intro", "quote", "signature", "heroKicker", "heroYear", "heroLink", "heroCaption", "heroSticker", "heroNote", "quoteByline", "momentsKicker", "momentsTitle", "momentsAside", "notesKicker", "notesTitle", "notesAside", "playlistKicker", "playlistTitle", "playlistAside", "wishlistKicker", "wishlistTitle", "wishlistAside", "sharedNotesKicker", "sharedNotesTitle", "sharedNotesAside", "letterKicker", "letter", "footerLeft", "footerMark", "footerRight"];
const labels = { brand: "Nama archive", title: "Judul utama", intro: "Pesan pembuka", quote: "Kutipan utama", signature: "Tanda tangan", heroKicker: "Label pembuka", heroYear: "Tahun / periode", heroLink: "Teks link hero", heroCaption: "Caption foto utama", heroSticker: "Teks sticker", heroNote: "Catatan vertikal", quoteByline: "Byline kutipan", momentsKicker: "Label timeline", momentsTitle: "Judul timeline", momentsAside: "Deskripsi timeline", notesKicker: "Label notes", notesTitle: "Judul notes", notesAside: "Deskripsi notes", playlistKicker: "Label playlist", playlistTitle: "Judul playlist", playlistAside: "Deskripsi playlist", wishlistKicker: "Label wishlist", wishlistTitle: "Judul wishlist", wishlistAside: "Deskripsi wishlist", sharedNotesKicker: "Label mailbox", sharedNotesTitle: "Judul mailbox", sharedNotesAside: "Deskripsi mailbox", letterKicker: "Label surat", letter: "Isi surat", footerLeft: "Footer kiri", footerMark: "Footer simbol", footerRight: "Footer kanan" };
function normalizeData(value) {
  const saved = value || {};
  return { ...defaults, ...saved, moments: Array.isArray(saved.moments) ? saved.moments : defaults.moments, notes: Array.isArray(saved.notes) ? saved.notes : defaults.notes, tracks: Array.isArray(saved.tracks) ? saved.tracks : defaults.tracks, wishlist: Array.isArray(saved.wishlist) ? saved.wishlist : defaults.wishlist };
}
const getData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    return normalizeData(saved);
  } catch {
    return { ...defaults };
  }
};
let data = getData();
const notesKey = "little-love-notes";
const textFields = document.querySelector("#textFields");
textFields.innerHTML = textKeys.map((key) => `<label>${labels[key]}${key === "intro" || key === "quote" || key === "letter" || key.endsWith("Aside") || key.endsWith("Title") ? `<textarea data-text="${key}" rows="3"></textarea>` : `<input data-text="${key}" type="text">`}</label>`).join("");
textKeys.forEach((key) => {
  document.querySelector(`[data-text="${key}"]`).value = data[key];
});
document.querySelectorAll("[data-json]").forEach((field) => {
  field.value = JSON.stringify(data[field.dataset.json], null, 2);
});
function saveCurrentData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function populateMediaTargets() {
  const target = document.querySelector("#mediaTarget");
  target.innerHTML = `<option value="heroImage">Foto hero</option>${data.moments.map((item, index) => `<option value="moment-${index}">Foto momen: ${item.title}</option>`).join("")} ${data.tracks.map((item, index) => `<option value="track-${index}">Lagu: ${item.title}</option>`).join("")}`;
}
populateMediaTargets();
async function loadRemoteConfig() {
  if (window.loveSupabase?.getClient()) {
    try {
      const remote = await window.loveSupabase.loadContent();
      if (remote && Object.keys(remote).length) {
        data = normalizeData(remote);
        textKeys.forEach((key) => {
          document.querySelector(`[data-text="${key}"]`).value = data[key] || "";
        });
        document.querySelectorAll("[data-json]").forEach((field) => {
          field.value = JSON.stringify(data[field.dataset.json] || [], null, 2);
        });
        populateMediaTargets();
        return;
      }
    } catch {
      /* use local fallback */
    }
  }
  if (location.protocol === "file:") return;
  try {
    const response = await fetch("/api/archive", { cache: "no-store" });
    const remote = await response.json();
    if (response.ok && Object.keys(remote).length) {
      data = normalizeData(remote);
      textKeys.forEach((key) => {
        document.querySelector(`[data-text="${key}"]`).value = data[key] || "";
      });
      document.querySelectorAll("[data-json]").forEach((field) => {
        field.value = JSON.stringify(data[field.dataset.json] || [], null, 2);
      });
      populateMediaTargets();
    }
  } catch {
    /* local fallback */
  }
}
loadRemoteConfig();
document.querySelector("#mediaFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const target = document.querySelector("#mediaTarget").value;
    let source = reader.result;
    if (window.loveSupabase?.getClient()) {
      try {
        source = await window.loveSupabase.uploadFile(file, target.startsWith("track-") ? "audio" : "images");
      } catch {
        document.querySelector("#mediaStatus").textContent = "upload Supabase gagal — file tetap disimpan lokal";
      }
    }
    if (target === "heroImage") data.heroImage = source;
    else if (target.startsWith("moment-")) data.moments[Number(target.split("-")[1])].image = source;
    else data.tracks[Number(target.split("-")[1])].src = source;
    saveCurrentData();
    document.querySelector("#mediaStatus").textContent = `${file.name} tersimpan`;
    if (window.loveSupabase?.getClient()) await window.loveSupabase.saveContent(data).catch(() => {});
  };
  reader.readAsDataURL(file);
});
document.querySelector("#configForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  textKeys.forEach((key) => {
    data[key] = document.querySelector(`[data-text="${key}"]`).value;
  });
  try {
    document.querySelectorAll("[data-json]").forEach((field) => {
      data[field.dataset.json] = JSON.parse(field.value);
    });
    saveCurrentData();
    if (window.loveSupabase?.getClient()) {
      try {
        await window.loveSupabase.saveContent(data);
        document.querySelector("#saveStatus").textContent = "tersimpan ke Supabase — device lain akan ikut melihatnya";
      } catch {
        document.querySelector("#saveStatus").textContent = "gagal menyimpan ke Supabase — cek SQL policy dan konfigurasi project";
      }
      return;
    }
    document.querySelector("#saveStatus").textContent = "tersimpan di browser lokal — Supabase belum terkonfigurasi";
  } catch (error) {
    document.querySelector("#saveStatus").textContent = `format JSON belum valid: ${error.message}`;
  }
});
document.querySelector("#exportConfig").addEventListener("click", () => {
  const backup = { version: 1, exportedAt: new Date().toISOString(), archive: data, sharedNotes: JSON.parse(localStorage.getItem(notesKey) || "[]") };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "little-love-archive-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
  document.querySelector("#saveStatus").textContent = "database berhasil diexport";
});
document.querySelector("#importConfig").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      data = normalizeData(backup.archive || backup);
      saveCurrentData();
      if (backup.sharedNotes) localStorage.setItem(notesKey, JSON.stringify(backup.sharedNotes));
      location.reload();
    } catch {
      document.querySelector("#saveStatus").textContent = "file JSON tidak bisa dibaca";
    }
  };
  reader.readAsText(file);
});
document.querySelector("#resetConfig").addEventListener("click", () => {
  data = normalizeData(defaults);
  textKeys.forEach((key) => {
    document.querySelector(`[data-text="${key}"]`).value = data[key];
  });
  document.querySelectorAll("[data-json]").forEach((field) => {
    field.value = JSON.stringify(data[field.dataset.json], null, 2);
  });
  document.querySelector("#saveStatus").textContent = "contoh awal dimuat — belum disimpan";
  populateMediaTargets();
});
document.querySelector("#openGuide").addEventListener("click", () => document.querySelector("#guideDialog").showModal());
document.querySelector("#closeGuide").addEventListener("click", () => document.querySelector("#guideDialog").close());
document.querySelector("#guideDialog").addEventListener("click", (event) => {
  if (event.target === document.querySelector("#guideDialog")) document.querySelector("#guideDialog").close();
});

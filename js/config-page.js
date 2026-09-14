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
function saveCurrentData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
let actionResolver = null;
let toastTimer = null;
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}
function finishAction(confirmed) {
  const resolver = actionResolver;
  actionResolver = null;
  document.querySelector("#actionDialog").close();
  resolver?.(confirmed);
}
function askConfirmation(title, message) {
  const dialog = document.querySelector("#actionDialog");
  document.querySelector("#actionTitle").textContent = title;
  document.querySelector("#actionMessage").textContent = message;
  dialog.showModal();
  return new Promise((resolve) => {
    actionResolver = resolve;
  });
}
document.querySelector("#actionConfirm").addEventListener("click", () => finishAction(true));
document.querySelector("#actionCancel").addEventListener("click", () => finishAction(false));
document.querySelector("#actionDialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  finishAction(false);
});
function persistData(message = "") {
  saveCurrentData();
  const request = window.loveSupabase?.getClient() ? window.loveSupabase.saveContent(data).catch(() => {}) : Promise.resolve();
  return request.then(() => {
    if (message) showToast(message);
  });
}
function renderMomentEditor() {
  const editor = document.querySelector("#momentEditor");
  editor.innerHTML = "";
  data.moments.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "moment-editor-card";
    card.dataset.momentIndex = index;
    card.innerHTML = `<img class="moment-editor-preview" alt="Preview foto momen"><div class="moment-editor-fields"><label>Tanggal<input data-moment-field="date" type="text"></label><label>Judul<input data-moment-field="title" type="text"></label><label>Cerita<textarea data-moment-field="text" rows="3"></textarea></label><label class="moment-editor-upload file-picker">Ganti foto<input data-moment-file type="file" accept="image/*"><span class="file-picker-label">pilih foto</span><span class="file-name">foto saat ini</span></label></div><button class="delete-moment" data-delete-moment type="button">hapus</button>`;
    card.querySelector(".moment-editor-preview").src = item.image || "";
    card.querySelector('[data-moment-field="date"]').value = item.date || "";
    card.querySelector('[data-moment-field="title"]').value = item.title || "";
    card.querySelector('[data-moment-field="text"]').value = item.text || "";
    editor.appendChild(card);
  });
}
document.querySelector("#addMoment").addEventListener("click", () => {
  data.moments.push({ date: "", title: "Momen baru", text: "", image: "", tone: "lavender" });
  renderMomentEditor();
  persistData("Card foto ditambahkan");
  const titles = document.querySelectorAll('[data-moment-field="title"]');
  titles[titles.length - 1]?.focus();
});
document.querySelector("#momentEditor").addEventListener("input", (event) => {
  const field = event.target.closest("[data-moment-field]");
  if (!field) return;
  const card = field.closest("[data-moment-index]");
  data.moments[Number(card.dataset.momentIndex)][field.dataset.momentField] = field.value;
  saveCurrentData();
});
document.querySelector("#momentEditor").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-moment]");
  if (!button) return;
  const card = button.closest("[data-moment-index]");
  const index = Number(card.dataset.momentIndex);
  const confirmed = await askConfirmation("Hapus card foto?", `Card "${data.moments[index].title || "momen ini"}" akan dihapus.`);
  if (!confirmed) return;
  data.moments.splice(index, 1);
  renderMomentEditor();
  persistData("Card foto dihapus");
});
document.querySelector("#momentEditor").addEventListener("change", (event) => {
  const input = event.target.closest("[data-moment-file]");
  if (!input?.files[0]) return;
  const card = input.closest("[data-moment-index]");
  const index = Number(card.dataset.momentIndex);
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    let source = reader.result;
    try {
      if (window.loveSupabase?.getClient()) {
        try {
          source = await window.loveSupabase.uploadFile(file, "images");
        } catch {
          document.querySelector("#mediaStatus").textContent = "upload cloud gagal — foto disimpan lokal";
        }
      }
      data.moments[index].image = source;
      card.querySelector(".moment-editor-preview").src = source;
      card.querySelector(".file-name").textContent = file.name;
      await persistData(`${file.name} tersimpan`);
      document.querySelector("#mediaStatus").textContent = `${file.name} tersimpan di card momen`;
    } catch {
      document.querySelector("#mediaStatus").textContent = "upload foto gagal — coba lagi";
    }
  };
  reader.readAsDataURL(file);
});
function renderSimpleEditor(collection, selector, fields, options = {}) {
  const editor = document.querySelector(selector);
  editor.innerHTML = "";
  data[collection].forEach((item, index) => {
    const card = document.createElement("article");
    card.className = `simple-editor-card ${options.className || ""}`;
    card.dataset.collection = collection;
    card.dataset.collectionIndex = index;
    card.innerHTML = `<div class="simple-editor-fields">${fields.map((field) => `<label>${field.label}${field.type === "textarea" ? `<textarea data-collection-field="${field.key}" rows="2"></textarea>` : field.type === "select" ? `<select data-collection-field="${field.key}">${field.options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}</select>` : `<input data-collection-field="${field.key}" type="${field.type || "text"}">`}</label>`).join("")}${options.upload ? `<label class="inline-file file-picker">${options.upload.label}<input data-collection-file type="file" accept="${options.upload.accept}"><span class="file-picker-label">pilih file audio</span><span class="file-name">pilih file</span></label>` : ""}</div><button class="delete-moment" data-delete-collection type="button">${options.deleteLabel || "hapus"}</button>`;
    fields.forEach((field) => {
      const input = card.querySelector(`[data-collection-field="${field.key}"]`);
      if (field.type === "checkbox") input.checked = Boolean(item[field.key]);
      else input.value = item[field.key] || "";
    });
    if (options.upload) card.querySelector(".file-name").textContent = item.src ? "file sudah dipilih" : "pilih file";
    editor.appendChild(card);
  });
}
function renderAllCollectionEditors() {
  renderMomentEditor();
  renderSimpleEditor(
    "notes",
    "#notesEditor",
    [
      { key: "label", label: "Label" },
      { key: "title", label: "Judul" },
      { key: "text", label: "Pesan", type: "textarea" },
      {
        key: "color",
        label: "Warna",
        type: "select",
        options: [
          { value: "lilac", label: "Lilac" },
          { value: "yellow", label: "Kuning" },
          { value: "pink", label: "Pink" },
        ],
      },
    ],
    { deleteLabel: "hapus catatan" },
  );
  renderSimpleEditor(
    "tracks",
    "#trackEditor",
    [
      { key: "title", label: "Judul lagu" },
      { key: "artist", label: "Penyanyi" },
    ],
    { upload: { label: "File lagu", accept: "audio/*" } },
  );
  renderSimpleEditor("wishlist", "#wishlistEditor", [
    { key: "title", label: "Nama rencana" },
    { key: "detail", label: "Keterangan" },
    { key: "done", label: "Sudah dilakukan", type: "checkbox" },
  ]);
  document.querySelector("#heroPreview").src = data.heroImage || "";
}
document.querySelectorAll(".simple-editor").forEach((editor) => {
  editor.addEventListener("input", (event) => {
    const field = event.target.closest("[data-collection-field]");
    if (!field) return;
    const card = field.closest("[data-collection]");
    const item = data[card.dataset.collection][Number(card.dataset.collectionIndex)];
    item[field.dataset.collectionField] = field.type === "checkbox" ? field.checked : field.value;
    saveCurrentData();
  });
  editor.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-collection-file]");
    if (!input?.files[0]) return;
    const card = input.closest("[data-collection]");
    const item = data[card.dataset.collection][Number(card.dataset.collectionIndex)];
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      let source = reader.result;
      if (window.loveSupabase?.getClient()) {
        try {
          source = await window.loveSupabase.uploadFile(file, "audio");
        } catch {
          document.querySelector("#mediaStatus").textContent = "upload cloud gagal — file disimpan lokal";
        }
      }
      item.src = source;
      card.querySelector(".file-name").textContent = file.name;
      await persistData(`${file.name} tersimpan`);
      document.querySelector("#mediaStatus").textContent = `${file.name} tersimpan`;
    };
    reader.readAsDataURL(file);
  });
  editor.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-collection]");
    if (!button) return;
    const card = button.closest("[data-collection]");
    const collection = card.dataset.collection;
    const index = Number(card.dataset.collectionIndex);
    const names = { notes: "catatan kecil", tracks: "lagu", wishlist: "rencana" };
    const confirmed = await askConfirmation(`Hapus ${names[collection] || "item ini"}?`, "Item ini akan dihapus dari archive.");
    if (!confirmed) return;
    data[collection].splice(index, 1);
    renderAllCollectionEditors();
    persistData(`${names[collection] || "Item"} dihapus`);
  });
});
document.querySelector("#addNote").addEventListener("click", () => {
  data.notes.push({ label: "open when...", title: "Catatan baru", text: "", color: "lilac" });
  renderAllCollectionEditors();
  persistData("Catatan kecil ditambahkan");
});
document.querySelector("#addTrack").addEventListener("click", () => {
  data.tracks.push({ title: "Lagu baru", artist: "", src: "" });
  renderAllCollectionEditors();
  persistData("Lagu ditambahkan");
});
document.querySelector("#addWish").addEventListener("click", () => {
  data.wishlist.push({ title: "Rencana baru", detail: "", done: false });
  renderAllCollectionEditors();
  persistData("Rencana ditambahkan");
});
document.querySelector("#heroFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let source = reader.result;
    if (window.loveSupabase?.getClient()) {
      try {
        source = await window.loveSupabase.uploadFile(file, "images");
      } catch {
        document.querySelector("#mediaStatus").textContent = "upload cloud gagal — foto disimpan lokal";
      }
    }
    data.heroImage = source;
    document.querySelector("#heroPreview").src = source;
    document.querySelector("#heroFileName").textContent = file.name;
    await persistData(`${file.name} tersimpan sebagai foto utama`);
    document.querySelector("#mediaStatus").textContent = `${file.name} tersimpan sebagai foto utama`;
  };
  reader.readAsDataURL(file);
});
renderAllCollectionEditors();
async function loadRemoteConfig() {
  if (window.loveSupabase?.getClient()) {
    try {
      const remote = await window.loveSupabase.loadContent();
      if (remote && Object.keys(remote).length) {
        data = normalizeData(remote);
        textKeys.forEach((key) => {
          document.querySelector(`[data-text="${key}"]`).value = data[key] || "";
        });
        renderAllCollectionEditors();
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
      renderAllCollectionEditors();
    }
  } catch {
    /* local fallback */
  }
}
loadRemoteConfig();
document.querySelector("#configForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  textKeys.forEach((key) => {
    data[key] = document.querySelector(`[data-text="${key}"]`).value;
  });
  saveCurrentData();
  if (window.loveSupabase?.getClient()) {
    try {
      await window.loveSupabase.saveContent(data);
      document.querySelector("#saveStatus").textContent = "tersimpan ke Supabase — device lain akan ikut melihatnya";
      showToast("Semua perubahan tersimpan");
    } catch {
      document.querySelector("#saveStatus").textContent = "gagal menyimpan — cek koneksi Supabase";
    }
    return;
  }
  document.querySelector("#saveStatus").textContent = "tersimpan di browser lokal";
  showToast("Semua perubahan tersimpan");
});
document.querySelector("#exportConfig").addEventListener("click", () => {
  const backup = { version: 1, exportedAt: new Date().toISOString(), archive: data, sharedNotes: JSON.parse(localStorage.getItem(notesKey) || "[]") };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "little-love-archive-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
  document.querySelector("#saveStatus").textContent = "backup berhasil dibuat";
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
      document.querySelector("#saveStatus").textContent = "file backup tidak bisa dibaca";
    }
  };
  reader.readAsText(file);
});
document.querySelector("#resetConfig").addEventListener("click", () => {
  data = normalizeData(defaults);
  textKeys.forEach((key) => {
    document.querySelector(`[data-text="${key}"]`).value = data[key];
  });
  renderAllCollectionEditors();
  document.querySelector("#saveStatus").textContent = "contoh awal dimuat — belum disimpan";
  showToast("Contoh awal dimuat");
});
document.querySelector("#openGuide").addEventListener("click", () => document.querySelector("#guideDialog").showModal());
document.querySelector("#closeGuide").addEventListener("click", () => document.querySelector("#guideDialog").close());
document.querySelector("#guideDialog").addEventListener("click", (event) => {
  if (event.target === document.querySelector("#guideDialog")) document.querySelector("#guideDialog").close();
});

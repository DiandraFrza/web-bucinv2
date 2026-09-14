/** @format */

(() => {
  const CONFIG_KEY = "little-love-supabase-config";
  let clientInstance = null;
  let clientConfigKey = "";

  function getConfig() {
    if (window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey) return window.SUPABASE_CONFIG;
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      return saved?.url && saved?.anonKey ? saved : null;
    } catch {
      return null;
    }
  }
  function getClient() {
    const config = getConfig();
    if (!config || !window.supabase?.createClient) return null;
    const key = `${config.url}|${config.anonKey}`;
    if (!clientInstance || clientConfigKey !== key) {
      clientInstance = window.supabase.createClient(config.url, config.anonKey);
      clientConfigKey = key;
    }
    return clientInstance;
  }
  async function loadContent() {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client.from("love_content").select("content").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data?.content || null;
  }
  async function saveContent(content) {
    const client = getClient();
    if (!client) return false;
    const { error } = await client.from("love_content").upsert({ id: 1, content }, { onConflict: "id" });
    if (error) throw error;
    return true;
  }
  async function uploadFile(file, folder) {
    const client = getClient();
    if (!client) return null;
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from("love-media").upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    return client.storage.from("love-media").getPublicUrl(path).data.publicUrl;
  }
  window.loveSupabase = { getConfig, getClient, loadContent, saveContent, uploadFile };
})();

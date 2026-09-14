/** @format */

const ARCHIVE_KEY = "little-love-archive:database";

function getRedisConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

async function redisRequest(command) {
  const { url, token } = getRedisConfig();
  if (!url || !token) return null;
  const response = await fetch(`${url}/${command.map(encodeURIComponent).join("/")}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Storage request failed: ${response.status}`);
  return response.json();
}

function isAuthorized(request) {
  const expected = process.env.ARCHIVE_ADMIN_KEY;
  return Boolean(expected && request.headers.get("x-archive-key") === expected);
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, x-archive-key");
  response.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  if (request.method === "OPTIONS") return response.status(204).end();
  try {
    if (request.method === "GET") {
      const result = await redisRequest(["GET", ARCHIVE_KEY]);
      return response.status(200).json(result?.result ? JSON.parse(result.result) : {});
    }
    if (request.method === "PUT") {
      if (!isAuthorized(request)) return response.status(401).json({ error: "Unauthorized" });
      const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      if (!payload || typeof payload !== "object") return response.status(400).json({ error: "Invalid archive" });
      await redisRequest(["SET", ARCHIVE_KEY, JSON.stringify(payload)]);
      return response.status(200).json({ ok: true });
    }
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}

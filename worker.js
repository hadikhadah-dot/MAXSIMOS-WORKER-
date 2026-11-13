
const API_BASE = "https://otcharts.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/") {
      return json({
        name: "MAXSIMOS-WORKER",
        status: "READY",
        endpoints: ["/health", "/symbols", "/candles"]
      });
    }

    if (url.pathname === "/health") {
      return json({
        status: "OK",
        apiKeyConfigured: Boolean(env.OTCHARTS_API_KEY)
      });
    }

    if (!env.OTCHARTS_API_KEY) {
      return json({
        error: "OTCHARTS_API_KEY is missing"
      }, 500);
    }

    const venue = url.searchParams.get("venue") || "otc";

    if (!["otc", "regular"].includes(venue)) {
      return json({ error: "Invalid venue" }, 400);
    }

    let endpoint;

    if (url.pathname === "/symbols") {
      endpoint = "/v1/symbols";
    } else if (url.pathname === "/candles") {
      const symbol = url.searchParams.get("symbol");
      const tf = Number(url.searchParams.get("tf") || 60);
      const limit = Number(url.searchParams.get("limit") || 300);

      if (!symbol) {
        return json({ error: "Symbol is required" }, 400);
      }

      if (!Number.isInteger(tf) || tf < 1) {
        return json({ error: "Invalid timeframe" }, 400);
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 5000) {
        return json({ error: "Invalid limit" }, 400);
      }

      endpoint = "/v1/candles";
    } else {
      return json({ error: "Not found" }, 404);
    }

    const params = new URLSearchParams(url.searchParams);
    params.set("venue", venue);

    const target = `${API_BASE}${endpoint}?${params.toString()}`;

    try {
      const response = await fetch(target, {
        headers: {
          "Authorization": `Bearer ${env.OTCHARTS_API_KEY}`,
          "Accept": "application/json"
        }
      });

      return new Response(response.body, {
        status: response.status,
        headers: {
          ...CORS,
          "Content-Type":
            response.headers.get("Content-Type") ||
            "application/json; charset=utf-8"
        }
      });
    } catch (error) {
      return json({
        error: "Upstream connection failed",
        detail: String(error)
      }, 502);
    }
  }
};

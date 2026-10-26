// Scheduled Netlify Function: imports headline metadata, not full article text.
// Set NEWSDATA_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.
const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  const { NEWSDATA_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!NEWSDATA_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables");
    return { statusCode: 500, body: "Missing required environment variables" };
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", NEWSDATA_API_KEY);
  url.searchParams.set("country", "bd");
  url.searchParams.set("language", "bn,en");
  url.searchParams.set("removeduplicate", "1");
  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`News API status ${response.status}`);
    const payload = await response.json();
    const results = (payload.results || []).filter(x => x.title && x.link);
    const rows = results.map(item => ({
      title: item.title.slice(0, 180),
      slug: `api-${safeSlug(item.article_id || item.link)}`.slice(0, 150),
      category: categoryFrom(item.category),
      caption: [item.description, `সূত্র: ${item.source_name || item.source_id || "News source"}`, `মূল প্রতিবেদন: ${item.link}`].filter(Boolean).join("\n\n").slice(0, 12000),
      media_type: item.image_url ? "image" : "none",
      media_url: item.image_url || null,
      source_url: item.link,
      source_name: item.source_name || item.source_id || null,
      api_source: "newsdata.io",
      status: "published",
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
    }));
    // Requires the optional source_url/source_name/api_source columns described in README.
    if (rows.length) {
      const { error } = await db.from("daily_news_posts").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
      if (error) throw error;
    }
    return { statusCode: 200, body: JSON.stringify({ imported: rows.length }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "News sync failed" };
  }
};
function safeSlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 130) || String(Date.now());
}
function categoryFrom(categories) {
  const text = Array.isArray(categories) ? categories.join(" ").toLowerCase() : "";
  if (text.includes("sport")) return "খেলাধুলা";
  if (text.includes("technology")) return "প্রযুক্তি";
  if (text.includes("entertainment")) return "বিনোদন";
  if (text.includes("politic")) return "রাজনীতি";
  return "আন্তর্জাতিক";
}

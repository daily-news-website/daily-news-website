DAILY NEWS — GitHub / Netlify starter
======================================

১) GitHub-এ নতুন repository তৈরি করে এই ZIP-এর সব ফাইল upload করুন।
২) config.js খুলে SUPABASE_URL এবং SUPABASE_ANON_KEY বসান।
   Supabase Dashboard > Project Settings > API থেকে Project URL এবং publishable/anon key পাবেন।
   service_role key কখনো config.js বা GitHub-এ দেবেন না।
৩) Netlify-তে Add new site > Import an existing project > GitHub repository বেছে deploy করুন।
৪) Netlify Site configuration > Environment variables-এ এই variables যোগ করুন:
   NEWSDATA_API_KEY = আপনার NewsData.io API key
   SUPABASE_URL = আপনার Supabase project URL
   SUPABASE_SERVICE_ROLE_KEY = Supabase service_role/secret key
   Secret key শুধু Netlify environment variable-এ থাকবে; GitHub-এ নয়।
৫) Environment variables যোগ/পরিবর্তনের পর redeploy করুন।

SUPABASE SQL ADDITIONS
----------------------
Scheduled news importer source fields ব্যবহার করে। Supabase SQL Editor-এ চালান:

ALTER TABLE public.daily_news_posts
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS api_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS daily_news_posts_slug_unique
  ON public.daily_news_posts (slug);

নোট:
- আগে তৈরি করা table/columns ও daily_news_is_admin() function-এর সঙ্গে এই starter মিলিয়ে তৈরি।
- Supabase Auth-এ তৈরি করা admin user-কে daily_news_admins টেবিলে যুক্ত থাকতে হবে।
- Storage bucket: daily-news-media (Public read, admin-only write policies আগেই তৈরি করেছেন)।
- NewsData.io key নিজে তৈরি করে Netlify environment variable-এ দিন। API free tier/parameters সীমিত হতে পারে।
- Auto import scheduled every 3 hours; Netlify Scheduled Functions availability depends on plan/account. Function only imports title/description/image/source link, not full article.
- Individual article URLs are /?news=SLUG. To support direct links, Netlify _redirects is included.
- Check that RLS policies already allow public SELECT of published posts and admin insert/update/delete.
- Never share passwords, service_role keys, or NewsData API keys in chat or repository.

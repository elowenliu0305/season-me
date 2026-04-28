export const config = { maxDuration: 10 };

const DEFAULT_SUPABASE_URL = 'https://ufwogjbbhkhnxqtdbplj.supabase.co';

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

function json(res, status, body) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

function cleanText(value, fallback, maxLength) {
  return String(value || fallback || '').trim().slice(0, maxLength);
}

function normalizePost(post) {
  if (!post) return post;
  return {
    ...post,
    card_image_url: String(post.card_image_url || '').replace(/\s+/g, ''),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return json(res, 500, { ok: false, error: 'Supabase not configured' });

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  try {
    if (req.method === 'GET') {
      const limit = Math.min(Math.max(Number(req.query?.limit) || 200, 1), 500);
      const resp = await fetch(
        `${url}/rest/v1/community_posts?select=*&order=created_at.desc&limit=${limit}`,
        { headers }
      );
      const text = await resp.text();
      if (!resp.ok) {
        console.error('community posts list error:', resp.status, text);
        return json(res, resp.status, { ok: false, error: 'Failed to load community posts' });
      }
      return json(res, 200, { ok: true, data: JSON.parse(text).map(normalizePost) });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return json(res, 400, { ok: false, error: 'Invalid location' });
      }
      if (!body.card_image_url) {
        return json(res, 400, { ok: false, error: 'Missing card image' });
      }

      const post = {
        session_id: cleanText(body.session_id, 'anonymous', 80),
        nickname: cleanText(body.nickname, 'ANONYMOUS', 40),
        spirit: cleanText(body.spirit, 'swan', 40),
        season: cleanText(body.season, 'cool-summer', 40),
        card_image_url: cleanText(body.card_image_url, '', 600),
        quote_text: cleanText(body.quote_text, '', 100),
        latitude,
        longitude,
        location_label: cleanText(body.location_label, '', 120),
      };

      const resp = await fetch(`${url}/rest/v1/community_posts?select=*`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(post),
      });
      const text = await resp.text();
      if (!resp.ok) {
        console.error('community posts insert error:', resp.status, text);
        return json(res, resp.status, { ok: false, error: 'Failed to create community post' });
      }
      const data = JSON.parse(text);
      return json(res, 200, { ok: true, data: normalizePost(data[0] || null) });
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('community-posts error:', err);
    return json(res, 500, { ok: false, error: err.message });
  }
}

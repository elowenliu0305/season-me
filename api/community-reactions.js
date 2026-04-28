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

async function supabaseFetch(url, key, path, options = {}) {
  const resp = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function hasReaction(url, key, table, postId, sessionId) {
  const rows = await supabaseFetch(
    url,
    key,
    `/rest/v1/${table}?select=post_id&post_id=eq.${encodeURIComponent(postId)}&session_id=eq.${encodeURIComponent(sessionId)}&limit=1`
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function setReaction(url, key, table, rpcName, postId, sessionId) {
  await supabaseFetch(url, key, `/rest/v1/${table}`, {
    method: 'POST',
    body: JSON.stringify({ post_id: postId, session_id: sessionId }),
  });
  await supabaseFetch(url, key, `/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    body: JSON.stringify({ post_id_input: postId }),
  });
}

async function clearReaction(url, key, table, rpcName, postId, sessionId) {
  await supabaseFetch(
    url,
    key,
    `/rest/v1/${table}?post_id=eq.${encodeURIComponent(postId)}&session_id=eq.${encodeURIComponent(sessionId)}`,
    { method: 'DELETE' }
  );
  await supabaseFetch(url, key, `/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    body: JSON.stringify({ post_id_input: postId }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return json(res, 500, { ok: false, error: 'Supabase not configured' });

  const { postId, sessionId, reaction, active } = req.body || {};
  if (!postId || !sessionId) return json(res, 400, { ok: false, error: 'Missing post or session' });
  if (reaction !== 'like' && reaction !== 'dislike') {
    return json(res, 400, { ok: false, error: 'Invalid reaction' });
  }

  try {
    const hasLike = await hasReaction(url, key, 'community_likes', postId, sessionId);
    const hasDislike = await hasReaction(url, key, 'community_dislikes', postId, sessionId);

    if (reaction === 'like') {
      if (active) {
        if (hasDislike) {
          await clearReaction(url, key, 'community_dislikes', 'decrement_dislikes', postId, sessionId);
        }
        if (!hasLike) {
          await setReaction(url, key, 'community_likes', 'increment_likes', postId, sessionId);
        }
      } else if (hasLike) {
        await clearReaction(url, key, 'community_likes', 'decrement_likes', postId, sessionId);
      }
    } else if (active) {
      if (hasLike) {
        await clearReaction(url, key, 'community_likes', 'decrement_likes', postId, sessionId);
      }
      if (!hasDislike) {
        await setReaction(url, key, 'community_dislikes', 'increment_dislikes', postId, sessionId);
      }
    } else if (hasDislike) {
      await clearReaction(url, key, 'community_dislikes', 'decrement_dislikes', postId, sessionId);
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    console.error('community-reactions error:', err);
    return json(res, 500, { ok: false, error: 'Failed to update reaction' });
  }
}

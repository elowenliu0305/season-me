export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://ufwogjbbhkhnxqtdbplj.supabase.co';
  const SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_API_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  try {
    const { data, mimeType, fileName } = req.body;
    if (!data) return res.status(400).json({ ok: false, error: 'No data' });
    if (!/^image\/(png|jpe?g|webp)$/.test(mimeType || '')) {
      return res.status(400).json({ ok: false, error: 'Unsupported image type' });
    }

    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(413).json({ ok: false, error: 'Image exceeds 2MB limit' });
    }

    const fallbackExt = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const ext = ((fileName || '').split('.').pop() || fallbackExt).replace(/[^a-z0-9]/gi, '').toLowerCase();
    const storagePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const uploadResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/share-cards/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: buffer,
      }
    );

    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      console.error('Storage upload error:', errText);
      return res.status(502).json({ ok: false, error: 'Upload failed' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/share-cards/${storagePath}`;
    return res.status(200).json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error('upload-card error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

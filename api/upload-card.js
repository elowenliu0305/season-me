export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return res.status(400).json({ ok: false, error: 'No file' });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'png';
    const storagePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const uploadResp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/share-cards/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'image/png',
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

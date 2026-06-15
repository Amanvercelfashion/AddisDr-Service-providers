const { createClient } = require('@supabase/supabase-js');
const path = require('path');

let _supabase = null;

function getClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  _supabase = createClient(url, key);
  return _supabase;
}

async function uploadFile(file) {
  const client = getClient();
  const ext  = path.extname(file.originalname).toLowerCase();
  const name = `${file.fieldname}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

  const { error } = await client.storage
    .from('uploads')
    .upload(name, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = client.storage.from('uploads').getPublicUrl(name);
  return data.publicUrl;
}

async function deleteFile(publicUrl) {
  if (!publicUrl || !publicUrl.includes('/uploads/')) return;
  try {
    const client = getClient();
    const name = publicUrl.split('/uploads/').pop();
    await client.storage.from('uploads').remove([name]);
  } catch (err) {
    console.warn('deleteFile warning:', err.message);
  }
}

module.exports = { uploadFile, deleteFile };

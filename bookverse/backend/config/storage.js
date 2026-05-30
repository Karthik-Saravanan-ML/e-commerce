const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Supabase — optional, only init if URL is real
let supabase = null;
const getSupabase = () => {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL || '';
  if (!url || url.includes('your_project')) {
    console.log('⚠️  Supabase not configured — PDF/audio uploads disabled');
    return null;
  }
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY);
  return supabase;
};

module.exports = { cloudinary, getSupabase };

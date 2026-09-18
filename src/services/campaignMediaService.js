import { supabase } from '../lib/supabase';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);

function getExtension(fileName) {
  return String(fileName).split('.').pop()?.toLowerCase() || '';
}

export async function uploadCampaignImage(businessId, file) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!businessId) throw new Error('Select a business before uploading an image.');
  if (!file || !ALLOWED_IMAGE_TYPES.has(file.type) || !ALLOWED_IMAGE_EXTENSIONS.has(getExtension(file.name))) {
    throw new Error('Please choose a PNG, JPG, or JPEG image.');
  }

  const extension = getExtension(file.name);
  const path = `${businessId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('customer_images')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('customer_images').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('The uploaded image does not have a public URL.');

  return {
    type: 'image',
    url: data.publicUrl,
    mime_type: file.type,
    file_name: file.name,
    caption: null,
  };
}
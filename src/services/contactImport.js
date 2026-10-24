// Adding or importing people by phone number. A number the business already has (from WhatsApp or an earlier import)
// is reused, never added a second time: a second copy of the same person is where their replies used to get lost.
import { supabase } from '../lib/supabase';

// The last 9 digits, the same rule as contacts.phone_key in the database (Kenyan numbers with or without 254 / 0).
export const phoneKey = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : null;
};

// rows: [{ business_id, name, phone, ...other columns }] for one business. Returns the contacts (existing or new),
// one per distinct number, in the order the numbers first appear. Rows without a usable number are inserted as given.
export async function findOrCreateContacts(businessId, rows, { select = '*' } = {}) {
  if (!supabase) throw new Error('Supabase client is not initialized.');
  const firstByKey = new Map();
  const noKey = [];
  for (const row of rows) {
    const key = phoneKey(row.phone);
    if (!key) noKey.push(row);
    else if (!firstByKey.has(key)) firstByKey.set(key, row);
  }

  const keys = [...firstByKey.keys()];
  const existingByKey = new Map();
  for (let i = 0; i < keys.length; i += 200) {
    const { data, error } = await supabase.from('contacts').select(`${select === '*' ? '*' : `${select}, phone_key`}`)
      .eq('business_id', businessId).in('phone_key', keys.slice(i, i + 200));
    if (error) throw error;
    for (const contact of data || []) if (!existingByKey.has(contact.phone_key)) existingByKey.set(contact.phone_key, contact);
  }

  const toInsert = [...keys.filter((key) => !existingByKey.has(key)).map((key) => firstByKey.get(key)), ...noKey];
  let created = [];
  if (toInsert.length) {
    const { data, error } = await supabase.from('contacts').insert(toInsert).select(select === '*' ? '*' : `${select}, phone_key`);
    if (error) throw error;
    created = data || [];
  }
  const createdByKey = new Map(created.filter((c) => c.phone_key).map((c) => [c.phone_key, c]));
  return [
    ...keys.map((key) => existingByKey.get(key) || createdByKey.get(key)).filter(Boolean),
    ...created.filter((c) => !c.phone_key),
  ];
}

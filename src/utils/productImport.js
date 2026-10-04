// Reads a product list from .csv, .xlsx or .xml and turns every row into the same plain shape.
// Pure functions: no screens, no database. The Products page decides what to do with the result.
//
// Columns that are understood (any order, any capitalisation, spaces or underscores):
//   name | title | product            required
//   price | selling_price             optional   (1500, "KES 1,500", 1.5k)
//   old_price | compare_at_price | was_price
//   category | type | collection | product_type
//   description | details | short_description
//   stock | quantity | stock_quantity
//   image | image_url | images | photo    one link, or several separated by | or ,
//   aliases | also_called | other_names   separated by | or ;
// XML: <products><product><name>..</name><price>..</price></product></products>, or a
// Google Merchant / RSS feed (<item><g:title>, <g:price>, <g:image_link>).
import * as XLSX from 'xlsx';
import { parsePrice, cleanCategory } from './productHelpers';

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

const COLS = {
  name: ['name', 'title', 'product', 'product_name', 'item', 'item_name'],
  price: ['price', 'selling_price', 'sale_price', 'amount', 'cost'],
  oldPrice: ['old_price', 'compare_at_price', 'was_price', 'regular_price'],
  category: ['category', 'collection', 'product_type', 'type', 'group'],
  description: ['description', 'short_description', 'details', 'about'],
  stock: ['stock', 'quantity', 'stock_quantity', 'qty', 'inventory'],
  images: ['image', 'image_url', 'image_link', 'images', 'photo', 'photo_url', 'picture'],
  aliases: ['aliases', 'also_called', 'other_names', 'alt_names'],
};

const normKey = (k) => String(k ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const pick = (row, names) => { for (const n of names) if (row[n] !== undefined && String(row[n]).trim() !== '') return row[n]; return ''; };
const splitList = (value, seps) => String(value ?? '').split(seps).map((v) => v.trim()).filter(Boolean);

export function normalizeImportRow(raw, line) {
  const row = Object.fromEntries(Object.entries(raw || {}).map(([k, v]) => [normKey(k), v]));
  const title = String(pick(row, COLS.name)).replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!title) return { line, error: 'No product name' };

  const priceRaw = pick(row, COLS.price);
  const price = parsePrice(priceRaw);
  const oldPrice = parsePrice(pick(row, COLS.oldPrice));
  const stockRaw = pick(row, COLS.stock);
  const stock = stockRaw === '' ? null : Math.max(0, Math.round(Number(String(stockRaw).replace(/[^\d.-]/g, ''))));
  const images = splitList(pick(row, COLS.images), /[|\n]|,(?=\s*https?:)/).filter((u) => /^https?:\/\//i.test(u)).slice(0, 6);
  const description = String(pick(row, COLS.description)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
  const warnings = [];
  if (priceRaw !== '' && price === null) warnings.push(`Price "${priceRaw}" was not understood, left blank`);

  return {
    line,
    title,
    price,
    old_price: oldPrice,
    category: cleanCategory(pick(row, COLS.category)),
    description_short: description || null,
    stock_quantity: Number.isFinite(stock) ? stock : null,
    images,
    aliases: splitList(pick(row, COLS.aliases), /[|;]/).slice(0, 8),
    warnings,
  };
}

function rowsFromSheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

function rowsFromXml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('This XML file could not be read. Check that it is complete.');
  const local = (el) => (el.localName || el.nodeName).split(':').pop().toLowerCase();
  const all = [...doc.getElementsByTagName('*')];
  const containerNames = ['product', 'item', 'entry', 'row', 'listing'];
  const containers = all.filter((el) => containerNames.includes(local(el)) && el.children.length > 0);
  // keep the outermost repeated element only
  const top = containers.filter((el) => !containers.some((other) => other !== el && other.contains(el)));
  return top.map((el) => {
    const out = {};
    for (const attr of [...el.attributes]) out[attr.name] = attr.value;
    for (const child of [...el.children]) {
      const key = local(child);
      const value = child.children.length ? [...child.children].map((c) => c.textContent.trim()).join('|') : child.textContent.trim();
      out[key] = out[key] ? `${out[key]}|${value}` : value;
    }
    return out;
  });
}

// file: a File from <input type="file">. Returns { rows, errors, format }.
export async function readProductFile(file) {
  if (!file) throw new Error('Choose a file first.');
  if (file.size > MAX_IMPORT_BYTES) throw new Error('That file is over 5 MB. Split it into smaller files.');
  const name = file.name.toLowerCase();
  let rawRows;
  let format;
  if (name.endsWith('.xml')) {
    format = 'xml';
    rawRows = rowsFromXml(await file.text());
  } else if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
    format = 'csv';
    rawRows = rowsFromSheet(await file.arrayBuffer());
  } else {
    throw new Error('Upload a .csv, .xlsx or .xml file.');
  }
  if (!rawRows.length) throw new Error('No products found in this file. Check that the first row has column names such as name and price.');
  if (rawRows.length > MAX_IMPORT_ROWS) throw new Error(`This file has ${rawRows.length} rows. The limit is ${MAX_IMPORT_ROWS} per upload.`);

  const rows = [];
  const errors = [];
  rawRows.forEach((raw, i) => {
    const parsed = normalizeImportRow(raw, i + 2);
    if (parsed.error) errors.push(parsed); else rows.push(parsed);
  });
  if (!rows.length) throw new Error('None of the rows has a product name. Add a column called name.');
  return { rows, errors, format };
}

export const TEMPLATE_CSV = [
  'name,price,category,description,stock,image_url,aliases',
  'Classic lash set,2500,Lash extensions,Natural everyday look,10,,classic set|classic lashes',
  'Aftercare kit,1200,Aftercare,Cleanser and brush,25,,',
].join('\n');

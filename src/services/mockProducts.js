// Mock catalog matching the real `products` table shape (id is text —
// Shopify-style IDs, not uuid). Titles deliberately overlap with the mock
// leads' product_interests tags (classic_lashes, volume_lashes, etc.) so
// the suggested-product matching in useProductSearch has something real
// to fuzzy-match against during dev.
export const MOCK_PRODUCTS = [
  { id: 'prod_001', title: 'Classic Lash Set', price: 2500, images: [] },
  { id: 'prod_002', title: 'Volume Lash Set', price: 3500, images: [] },
  { id: 'prod_003', title: 'Hybrid Lash Set', price: 3000, images: [] },
  { id: 'prod_004', title: 'Lash Lift & Tint', price: 1800, images: [] },
  { id: 'prod_005', title: 'Gift Voucher — Classic Set', price: 2500, images: [] },
  { id: 'prod_006', title: 'Lash Refill (2 weeks)', price: 1500, images: [] },
  { id: 'prod_007', title: 'Brow Lamination', price: 2000, images: [] },
];
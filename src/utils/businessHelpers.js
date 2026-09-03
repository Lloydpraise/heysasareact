export function getBusinessDisplayName(business, index = 0) {
  const name = business?.name || business?.business_name;
  return name?.trim() || `Business name - ${Math.max(index, 0) + 1}`;
}
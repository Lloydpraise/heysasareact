// The four tabs on the Lists page. Ad lists are made automatically, one per ad, from the leads that came in through it.
export const LIST_GROUPS = [
  { id: 'Auto', label: 'Auto', match: (list) => list.type === 'auto' && !list.archived },
  { id: 'Ads', label: 'Ads', match: (list) => list.type === 'ad' && !list.archived },
  { id: 'Manual', label: 'Manual', match: (list) => list.type === 'manual' && !list.archived },
  { id: 'Archived', label: 'Archived', match: (list) => Boolean(list.archived) },
];

export const DEFAULT_LIST_GROUP = LIST_GROUPS[0].id;

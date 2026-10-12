-- Lets each business define its own sales funnel (stages, rules, close chance) for the Analytics overview.
-- Additive only. Safe to run more than once.
alter table public.businesses add column if not exists sales_funnel jsonb;

comment on column public.businesses.sales_funnel is
  'Owner-defined funnel: [{id,label,color,weight,qualities[],states[],minIntent}]. Null = default Hot/Warm/Cold.';

alter table alayacare.client
  add column external_id text,
  add column risks text,
  add column services text[] not null default '{}'::text[];

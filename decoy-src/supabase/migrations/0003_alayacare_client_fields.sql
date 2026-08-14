alter table alayacare.client
  add column status text not null default 'Active' check (status in ('Active', 'Inactive')),
  add column address_line text,
  add column city text,
  add column state text;

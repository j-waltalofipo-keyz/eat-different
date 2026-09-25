-- 003: owner dashboard (SOPs admin.md, menu-admin.md, order-queue.md; D41–D46). Additive only.

-- Site content Eddie edits in /admin → Site.
alter table settings
  add column pickup_area       text,                                   -- public, neighborhood only (D43)
  add column hours             jsonb not null default '[null,null,null,null,null,null,null]'::jsonb,
  add column hours_note        text,                                   -- display-only hours (D42)
  add column announcement_on   boolean not null default false,
  add column announcement_text text,
  add column drink_of_the_day  text,
  add column instagram_url     text,
  add column tiktok_url        text,
  add column facebook_url      text;
alter table settings
  add constraint settings_hours_week check (jsonb_typeof(hours) = 'array' and jsonb_array_length(hours) = 7);

-- Tonight's orders: website-only "Done" (D45). Square orders are never touched.
alter table orders add column fulfilled_at timestamptz;
create index orders_queue_idx on orders (kind, status, paid_at);

-- Website-only menu presentation + flags; Square stays the menu truth (D46).
create table menu_meta (
  square_item_id text primary key,
  seed_key       text,
  subtitle       text check (subtitle is null or char_length(subtitle) <= 60),
  hidden         boolean not null default false,
  sold_out       boolean not null default false,
  updated_at     timestamptz not null default now()
);
alter table menu_meta enable row level security;  -- no policies: service role only, like every table

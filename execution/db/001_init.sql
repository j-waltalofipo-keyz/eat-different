-- Eat. Different. — initial schema. Mirrors CLAUDE.md "Supabase tables"; change CLAUDE.md first.
-- RLS is enabled on every table with NO policies: the anon key can read nothing.
-- All access goes through server routes using the service role key.

create table orders (
  square_order_id   text primary key,
  kind              text not null check (kind in ('FOOD', 'DONATION')),
  square_payment_id text unique,
  receipt_number    text,
  buyer_email       text,
  customer_name     text,
  total_cents       integer not null check (total_cents >= 0),
  status            text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'REFUNDED')),
  view_token_hash   text,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);
create index orders_receipt_idx on orders (receipt_number);

-- Append-only. One row per (order, reason) makes webhook replays harmless.
create table fund_ledger (
  id              bigint generated always as identity primary key,
  square_order_id text not null references orders (square_order_id),
  reason          text not null check (reason in ('ORDER', 'DONATION', 'REFUND')),
  amount_cents    integer not null,
  created_at      timestamptz not null default now(),
  unique (square_order_id, reason)
);

create table reviews (
  id              bigint generated always as identity primary key,
  square_order_id text not null unique references orders (square_order_id),
  display_name    text not null check (char_length(display_name) between 1 and 40),
  rating          smallint not null check (rating between 1 and 5),
  body            text not null check (char_length(body) between 10 and 1000),
  hidden          boolean not null default false,
  created_at      timestamptz not null default now()
);

create table notify_signups (
  email           text primary key check (email = lower(email)),
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table webhook_events (
  event_id    text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

-- Exactly one row (id = 1). Kitchen starts CLOSED.
create table settings (
  id                     smallint primary key default 1 check (id = 1),
  kitchen_open           boolean not null default false,
  fund_per_order_cents   integer not null default 500 check (fund_per_order_cents >= 0),
  fund_goal_cents        integer not null default 4200000 check (fund_goal_cents > 0),
  donation_presets_cents integer[] not null default '{500,1000,2500,5000}',
  donation_min_cents     integer not null default 100,
  donation_max_cents     integer not null default 100000,
  pickup_address         text,
  pickup_instructions    text,
  google_review_url      text,
  updated_at             timestamptz not null default now(),
  check (donation_min_cents > 0 and donation_max_cents >= donation_min_cents)
);
insert into settings (id) values (1);

alter table orders         enable row level security;
alter table fund_ledger    enable row level security;
alter table reviews        enable row level security;
alter table notify_signups enable row level security;
alter table webhook_events enable row level security;
alter table settings       enable row level security;

-- Digital Signage Schema for Chabad Limassol

-- Media items (videos, images from events)
create table media (
  id bigint generated always as identity primary key,
  type text not null check (type in ('video', 'image')),
  url text not null,
  title text,
  description text,
  category text default 'general', -- 'event', 'promo', 'general'
  duration_seconds int default 10, -- how long to show images
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Announcements (ticker/banner)
create table announcements (
  id bigint generated always as identity primary key,
  text text not null,
  priority int default 0, -- higher = shown first
  active boolean default true,
  starts_at timestamptz default now(),
  ends_at timestamptz, -- null = no expiry
  created_at timestamptz default now()
);

-- Prayer times
create table prayer_times (
  id bigint generated always as identity primary key,
  name text not null, -- e.g. 'שחרית', 'מנחה', 'ערבית'
  time text not null, -- e.g. '07:00', '13:30'
  day_of_week text, -- null = every day, or 'שבת', 'ראשון' etc
  notes text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Display settings
create table display_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Default settings
insert into display_settings (key, value) values
  ('ticker_speed', '30'),
  ('slide_duration', '10'),
  ('theme', 'dark'),
  ('shul_name', 'בית חב"ד לימסול'),
  ('show_weather', 'true'),
  ('weather_city', 'Limassol'),
  ('show_date', 'true'),
  ('show_zmanim', 'true');

-- RLS
alter table media enable row level security;
alter table announcements enable row level security;
alter table prayer_times enable row level security;
alter table display_settings enable row level security;

-- Public read access for display
create policy "Public read media" on media for select using (true);
create policy "Public read announcements" on announcements for select using (true);
create policy "Public read prayer_times" on prayer_times for select using (true);
create policy "Public read display_settings" on display_settings for select using (true);

-- Service role full access for admin
create policy "Service write media" on media for all using (true);
create policy "Service write announcements" on announcements for all using (true);
create policy "Service write prayer_times" on prayer_times for all using (true);
create policy "Service write display_settings" on display_settings for all using (true);

-- Storage bucket for media files
-- Run this in Supabase dashboard:
-- insert into storage.buckets (id, name, public) values ('media', 'media', true);

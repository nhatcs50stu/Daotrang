-- Dán toàn bộ nội dung này vào Supabase > SQL Editor > Run
create table if not exists kv (key text primary key, value jsonb not null);
alter table kv enable row level security;
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict (id) do nothing;

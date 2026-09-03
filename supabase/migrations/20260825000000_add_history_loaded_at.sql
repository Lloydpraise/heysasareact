alter table public.whatsapp_sessions
add column if not exists history_loaded_at timestamptz;
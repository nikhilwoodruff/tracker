-- Create entries table
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  date date default current_date not null,
  
  -- Nutrition metrics
  calories integer,
  calories_certainty float,
  protein_g float,
  protein_certainty float,
  carbs_g float,
  carbs_certainty float,
  fat_g float,
  fat_certainty float,
  fiber_g float,
  
  -- Exercise metrics
  exercise_minutes integer,
  exercise_type text[],
  exercise_intensity text,
  steps integer,
  
  -- Mood and wellness
  mood_score integer check (mood_score >= 1 and mood_score <= 10),
  mood_certainty float,
  energy_level integer check (energy_level >= 1 and energy_level <= 10),
  sleep_hours float,
  sleep_quality integer check (sleep_quality >= 1 and sleep_quality <= 10),
  
  -- Body metrics
  weight_kg float,
  weight_lbs float,
  weight_certainty float,
  
  -- Time tracking
  hourly_activities jsonb, -- {hour: activity} mapping
  productive_hours float,
  
  -- General
  category text,
  tags text[],
  metadata jsonb,
  ai_analysis jsonb, -- Full AI analysis with all extracted data
  
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.entries enable row level security;

-- Create RLS policies
create policy "Users can view own entries"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.entries for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on public.entries
  for each row
  execute function public.handle_updated_at();
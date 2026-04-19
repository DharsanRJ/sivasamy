-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  persona text check (persona in ('Job Switcher', 'Fresher', 'Upskilling Engineer')),
  target_role text,
  current_streak integer default 0,
  highest_streak integer default 0,
  streak_warning_state boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

create policy "Users can view own profile."
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- SKILLS TABLE
create table public.skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  proficiency integer check (proficiency >= 1 and proficiency <= 5) not null,
  status text check (status in ('Backlog', 'Learning', 'Practicing', 'Mastered')) not null,
  last_reviewed timestamp with time zone default timezone('utc'::text, now()),
  next_review_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.skills enable row level security;

create policy "Users can view own skills."
  on public.skills for select
  using ( auth.uid() = user_id );

create policy "Users can insert own skills."
  on public.skills for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own skills."
  on public.skills for update
  using ( auth.uid() = user_id );

create policy "Users can delete own skills."
  on public.skills for delete
  using ( auth.uid() = user_id );

-- PRACTICE LOGS TABLE
create table public.practice_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  prompt_data jsonb not null,
  artifact_link text,
  reflection text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.practice_logs enable row level security;

create policy "Users can view own practice logs."
  on public.practice_logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own practice logs."
  on public.practice_logs for insert
  with check ( auth.uid() = user_id );

-- Function to automatically update 'updated_at' column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_skills_updated_at
  before update on public.skills
  for each row execute procedure public.handle_updated_at();

-- Trigger to automatically create a user profile when they sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

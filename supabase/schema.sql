-- Create table for meetings
create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  date timestamp with time zone not null,
  original_transcript text,
  analysis_json jsonb,
  created_at timestamp with time zone default now()
);

-- Create table for tasks
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meetings(id) on delete cascade not null,
  description text not null,
  assignee text,
  due_date timestamp with time zone,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table meetings enable row level security;
alter table tasks enable row level security;

-- Policies for meetings
create policy "Users can view their own meetings"
  on meetings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meetings"
  on meetings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meetings"
  on meetings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meetings"
  on meetings for delete
  using (auth.uid() = user_id);

-- Policies for tasks
create policy "Users can view tasks of their meetings"
  on tasks for select
  using (
    exists (
      select 1 from meetings
      where meetings.id = tasks.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

create policy "Users can insert tasks to their meetings"
  on tasks for insert
  with check (
    exists (
      select 1 from meetings
      where meetings.id = tasks.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

create policy "Users can update tasks of their meetings"
  on tasks for update
  using (
    exists (
      select 1 from meetings
      where meetings.id = tasks.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

create policy "Users can delete tasks of their meetings"
  on tasks for delete
  using (
    exists (
      select 1 from meetings
      where meetings.id = tasks.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

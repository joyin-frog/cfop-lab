create table if not exists public.user_learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  favorites jsonb not null default '{}'::jsonb,
  review_history jsonb not null default '[]'::jsonb,
  state_version integer not null default 1,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_learning_state_progress_object check (jsonb_typeof(progress) = 'object'),
  constraint user_learning_state_favorites_object check (jsonb_typeof(favorites) = 'object'),
  constraint user_learning_state_review_history_array check (jsonb_typeof(review_history) = 'array')
);

alter table public.user_learning_state enable row level security;

revoke all on table public.user_learning_state from anon, authenticated;
grant select, insert, update, delete on table public.user_learning_state to authenticated;

drop policy if exists "Users can read their own learning state" on public.user_learning_state;
create policy "Users can read their own learning state"
  on public.user_learning_state for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own learning state" on public.user_learning_state;
create policy "Users can create their own learning state"
  on public.user_learning_state for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own learning state" on public.user_learning_state;
create policy "Users can update their own learning state"
  on public.user_learning_state for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own learning state" on public.user_learning_state;
create policy "Users can delete their own learning state"
  on public.user_learning_state for delete
  to authenticated
  using ((select auth.uid()) = user_id);

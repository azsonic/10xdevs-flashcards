/*
 * Migration: Disable RLS Policies
 * Created: 2025-12-28
 * 
 * Purpose:
 *   Drops all RLS policies from flashcards, generations, and generation_error_logs tables
 *   while keeping RLS enabled on the tables themselves.
 * 
 * Note:
 *   This leaves the tables with RLS enabled but no policies, which means
 *   NO ONE can access the data (not even authenticated users).
 *   You may want to disable RLS entirely or create new policies.
 */

-- ==============================================================================
-- Drop RLS Policies for generations table
-- ==============================================================================

drop policy if exists "generations_select_policy_authenticated" on public.generations;
drop policy if exists "generations_insert_policy_authenticated" on public.generations;
drop policy if exists "generations_update_policy_authenticated" on public.generations;
drop policy if exists "generations_delete_policy_authenticated" on public.generations;

-- ==============================================================================
-- Drop RLS Policies for flashcards table
-- ==============================================================================

drop policy if exists "flashcards_select_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_insert_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_update_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_delete_policy_authenticated" on public.flashcards;

-- ==============================================================================
-- Drop RLS Policies for generation_error_logs table
-- ==============================================================================

drop policy if exists "generation_error_logs_select_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_insert_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_update_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_delete_policy_authenticated" on public.generation_error_logs;

-- Optional: Disable RLS entirely on these tables
-- Uncomment the following lines if you want to disable RLS completely:
alter table public.flashcards disable row level security;
alter table public.generations disable row level security;
alter table public.generation_error_logs disable row level security;


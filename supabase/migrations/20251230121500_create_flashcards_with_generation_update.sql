-- Create RPC to insert flashcards in bulk and update generation counters atomically
create or replace function public.create_flashcards_with_generation_update(
  generation_id bigint,
  flashcards_json jsonb,
  user_id uuid,
  accepted_unedited_delta integer default 0,
  accepted_edited_delta integer default 0
)
returns setof public.flashcards
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_rows public.flashcards[];
begin
  -- Insert flashcards in a single statement
  with payload as (
    select
      (card ->> 'front')::varchar(200) as front,
      (card ->> 'back')::varchar(500) as back,
      (card ->> 'source')::varchar as source
    from jsonb_array_elements(flashcards_json) as card
  ),
  inserted as (
    insert into public.flashcards (front, back, source, generation_id, user_id)
    select 
      payload.front, 
      payload.back, 
      payload.source, 
      create_flashcards_with_generation_update.generation_id, 
      create_flashcards_with_generation_update.user_id 
    from payload
    returning *
  )
  select array_agg(i.*) into inserted_rows from inserted i;

  -- Update generation counters when applicable
  if create_flashcards_with_generation_update.generation_id is not null then
    update public.generations
    set
      accepted_unedited_count = coalesce(accepted_unedited_count, 0) + coalesce(create_flashcards_with_generation_update.accepted_unedited_delta, 0),
      accepted_edited_count = coalesce(accepted_edited_count, 0) + coalesce(create_flashcards_with_generation_update.accepted_edited_delta, 0),
      updated_at = now()
    where generations.id = create_flashcards_with_generation_update.generation_id 
      and generations.user_id = create_flashcards_with_generation_update.user_id;
  end if;

  -- Return inserted rows
  return query select (unnest(inserted_rows)).*;
end;
$$;

comment on function public.create_flashcards_with_generation_update is
'Inserts flashcards in bulk and, when a generation_id is provided, increments accepted counters on the associated generation.';


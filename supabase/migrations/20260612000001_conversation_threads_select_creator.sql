-- Q&A threads could never be created: INSERT ... RETURNING (postgrest .insert().select())
-- applies the SELECT policy to the just-inserted row, and can_access_conversation_thread()
-- queries conversation_threads ITSELF — the new row is not visible in the function's
-- snapshot yet, so the policy evaluated false and every thread creation failed with 42501.
-- Fix: give the creator a direct column-predicate leg that evaluates against the NEW row
-- without a self-referencing subquery. (Creator visibility was already the function's
-- intent — ct.created_by = uid — it just couldn't see the row during RETURNING.)
drop policy if exists conversation_threads_select on public.conversation_threads;
create policy conversation_threads_select on public.conversation_threads
  for select
  using (
    (created_by = (select auth.uid()))
    or public.can_access_conversation_thread(id, (select auth.uid()))
  );

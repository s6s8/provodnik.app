-- Atomic QA message send with 8-message limit enforcement.
-- Count check and INSERT happen in a single function call — no TOCTOU.
CREATE OR REPLACE FUNCTION public.send_qa_message(
  p_thread_id   UUID,
  p_sender_id   UUID,
  p_sender_role public.message_sender_role,
  p_body        TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM messages WHERE thread_id = p_thread_id;

  IF v_count >= 8 THEN
    RAISE EXCEPTION 'qa_thread_at_limit';
  END IF;

  INSERT INTO messages (thread_id, sender_id, sender_role, body)
  VALUES (p_thread_id, p_sender_id, p_sender_role, p_body);
END;
$$;

REVOKE ALL ON FUNCTION public.send_qa_message(UUID, UUID, public.message_sender_role, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_qa_message(UUID, UUID, public.message_sender_role, TEXT) TO authenticated;

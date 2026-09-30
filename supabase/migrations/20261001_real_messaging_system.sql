-- ==============================================================================
-- NAIJAHOMES REAL ESTATE PORTAL - REAL MESSAGING SYSTEM MIGRATION
-- Production PostgreSQL DDL with Row Level Security (RLS) & Realtime
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
-- Represents a 1-on-1 direct conversation between two users, optionally linked to a property
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  participant_one uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_two uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_text text DEFAULT '',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Prevent participant from being the exact same user
  CONSTRAINT chk_different_participants CHECK (participant_one <> participant_two)
);

-- Index for fast user conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant_one);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant_two);
CREATE INDEX IF NOT EXISTS idx_conversations_prop ON public.conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

-- Unique index preventing duplicate conversations between two users for the same property
-- (or null property), regardless of who initiates first
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_pair_property
  ON public.conversations (
    LEAST(participant_one, participant_two),
    GREATEST(participant_one, participant_two),
    COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ------------------------------------------------------------------------------
-- 1.1 ROW LEVEL SECURITY: public.conversations
-- ------------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- SELECT: Only participants can view their conversations
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = participant_one OR auth.uid() = participant_two
    )
  );

-- INSERT: Authenticated users can start a conversation if they are participant_one or participant_two
CREATE POLICY "Users can create conversations they belong to"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = participant_one OR auth.uid() = participant_two
    )
  );

-- UPDATE: Participants can update their conversation record (e.g. last_message metadata)
CREATE POLICY "Participants can update their conversation"
  ON public.conversations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = participant_one OR auth.uid() = participant_two
    )
  );

-- DELETE: Participants can delete their conversation
CREATE POLICY "Participants can delete their conversation"
  ON public.conversations
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = participant_one OR auth.uid() = participant_two
    )
  );

-- ==============================================================================
-- 2. MESSAGES TABLE
-- Individual messages exchanged within a conversation
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast conversation message history retrieval
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON public.messages(recipient_id, read_at) WHERE read_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2.1 ROW LEVEL SECURITY: public.messages
-- ------------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Only sender or recipient can read messages
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = sender_id OR auth.uid() = recipient_id
    )
  );

-- INSERT: User can only send messages as themselves in conversations they belong to
CREATE POLICY "Users can insert messages as sender in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- UPDATE: Only recipient can update message (e.g. marking read_at)
CREATE POLICY "Recipient can mark messages as read"
  ON public.messages
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND auth.uid() = recipient_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = recipient_id
  );

-- ==============================================================================
-- 3. AUTOMATED TRIGGER: UPDATE CONVERSATION LAST MESSAGE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_text = new.content,
    last_message_at = new.created_at,
    updated_at = now()
  WHERE id = new.conversation_id;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_message_insert ON public.messages;
CREATE TRIGGER trg_on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- ==============================================================================
-- 4. FUNCTION: GET OR CREATE CONVERSATION (ATOMIC & IDEMPOTENT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_other_user_id uuid,
  p_property_id uuid DEFAULT NULL
)
RETURNS TABLE (
  conversation_id uuid,
  created boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id uuid := auth.uid();
  v_conv_id uuid;
  v_p1 uuid;
  v_p2 uuid;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to start a conversation.';
  END IF;

  IF v_my_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself.';
  END IF;

  -- Order participants to maintain canonical pairing
  IF v_my_id < p_other_user_id THEN
    v_p1 := v_my_id;
    v_p2 := p_other_user_id;
  ELSE
    v_p1 := p_other_user_id;
    v_p2 := v_my_id;
  END IF;

  -- Check if conversation already exists
  IF p_property_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE participant_one = v_p1
      AND participant_two = v_p2
      AND property_id = p_property_id
    LIMIT 1;
  ELSE
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE participant_one = v_p1
      AND participant_two = v_p2
      AND property_id IS NULL
    LIMIT 1;
  END IF;

  IF v_conv_id IS NOT NULL THEN
    RETURN QUERY SELECT v_conv_id, false;
    RETURN;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (participant_one, participant_two, property_id)
  VALUES (v_p1, v_p2, p_property_id)
  RETURNING id INTO v_conv_id;

  RETURN QUERY SELECT v_conv_id, true;
END;
$$;

-- ==============================================================================
-- 5. SUPABASE REALTIME ENABLEMENT
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;

-- ==============================================================================
-- NAIJAHOMES REAL ESTATE PORTAL - SUPABASE DATABASE & SECURITY SCHEMA
-- Production PostgreSQL DDL with Row Level Security (RLS) & Storage Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: public.profiles
-- User profile information extending auth.users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  account_type text NOT NULL CHECK (account_type IN ('Buyer', 'Tenant', 'Agent', 'Property Owner')),
  city text,
  state text DEFAULT 'Lagos State',
  avatar_url text,
  agency_name text,
  years_experience text,
  whatsapp_number text,
  bio text,
  agree_terms boolean NOT NULL DEFAULT true,
  agreed_terms_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index frequently queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);

-- ------------------------------------------------------------------------------
-- 2.1 ROW LEVEL SECURITY: public.profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLICY: Profiles Select
-- Users can view their own profile; public can view registered Agents and Property Owners
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR account_type IN ('Agent', 'Property Owner')
  );

-- POLICY: Profiles Insert
-- Users can only insert their own profile matching their authenticated auth.uid()
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- POLICY: Profiles Update
-- Users can ONLY update their own profile record
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- POLICY: Profiles Delete
-- Users can only delete their own profile record
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ==============================================================================
-- 3. AUTOMATED USER REGISTRATION TRIGGER (SECURITY DEFINER)
-- Creates a public.profiles row automatically when a user signs up via auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    email,
    phone,
    account_type,
    city,
    state,
    avatar_url,
    agency_name,
    years_experience,
    whatsapp_number,
    bio,
    agree_terms,
    agreed_terms_at,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'NaijaHomes User'),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'account_type', 'Buyer'),
    COALESCE(new.raw_user_meta_data->>'city', ''),
    COALESCE(new.raw_user_meta_data->>'state', 'Lagos State'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'photo', ''),
    COALESCE(new.raw_user_meta_data->>'agency_name', ''),
    COALESCE(new.raw_user_meta_data->>'years_experience', ''),
    COALESCE(new.raw_user_meta_data->>'whatsapp_number', ''),
    COALESCE(new.raw_user_meta_data->>'bio', ''),
    COALESCE((new.raw_user_meta_data->>'agree_terms')::boolean, true),
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    account_type = EXCLUDED.account_type,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    avatar_url = EXCLUDED.avatar_url,
    agency_name = EXCLUDED.agency_name,
    years_experience = EXCLUDED.years_experience,
    whatsapp_number = EXCLUDED.whatsapp_number,
    bio = EXCLUDED.bio,
    updated_at = now();

  RETURN new;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. TABLE: public.properties
-- Real Nigerian property listings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('sale', 'rent', 'shortlet', 'land')),
  property_type text NOT NULL,
  state text NOT NULL,
  location text NOT NULL,
  price_ngn numeric NOT NULL CHECK (price_ngn >= 0),
  price_period text DEFAULT '',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  title_doc text NOT NULL,
  title_doc_type text DEFAULT 'gov-consent',
  image_url text,
  gallery text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  description text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON public.properties(purpose);
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- ------------------------------------------------------------------------------
-- 4.1 ROW LEVEL SECURITY: public.properties
-- ------------------------------------------------------------------------------
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- POLICY: Properties Select
-- Anyone can view active listings; owners can view all their listings regardless of status
CREATE POLICY "Public can view active properties"
  ON public.properties
  FOR SELECT
  USING (
    status = 'active'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- POLICY: Properties Insert
-- Authenticated users can insert properties where user_id matches auth.uid()
CREATE POLICY "Authenticated users can insert properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- POLICY: Properties Update
-- Users can ONLY update their own property listings
CREATE POLICY "Users can update own properties"
  ON public.properties
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLICY: Properties Delete
-- Users can ONLY delete their own property listings
CREATE POLICY "Users can delete own properties"
  ON public.properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. TABLE: public.inspections
-- Physical inspection bookings for Nigerian properties
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  inspection_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an inspection booking
CREATE POLICY "Anyone can book an inspection"
  ON public.inspections
  FOR INSERT
  WITH CHECK (true);

-- Users can view inspections they requested OR received for their properties
CREATE POLICY "Users can view relevant inspections"
  ON public.inspections
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = client_id)
    OR (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT user_id FROM public.properties WHERE id = property_id))
  );

-- Property owners can update inspection status
CREATE POLICY "Owners can update inspection status"
  ON public.inspections
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND auth.uid() IN (SELECT user_id FROM public.properties WHERE id = property_id)
  );

-- ==============================================================================
-- 6. STORAGE BUCKETS & POLICIES (AVATARS & PROPERTY IMAGES)
-- ==============================================================================

-- Create 'avatars' storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create 'property-images' storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------------------------
-- 6.1 AVATARS STORAGE POLICIES
-- Path pattern: avatars/{userId}/{filename}
-- ------------------------------------------------------------------------------

-- Public can view avatars
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated user can upload only to their own directory: avatars/{auth.uid()}/...
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can update only files in their own directory
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated user can delete only their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------------------------
-- 6.2 PROPERTY IMAGES STORAGE POLICIES
-- Path pattern: property-images/{userId}/{filename}
-- ------------------------------------------------------------------------------

-- Public can view property images
CREATE POLICY "Property images are publicly viewable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');

-- Authenticated user can upload only to their own directory: property-images/{auth.uid()}/...
CREATE POLICY "Users can upload property images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update images in their own directory
CREATE POLICY "Users can update their own property images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete images in their own directory
CREATE POLICY "Users can delete their own property images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================================================
-- 7. AUTOMATED UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_properties_updated_at ON public.properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


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

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

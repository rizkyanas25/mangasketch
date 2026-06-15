-- =======================================================
-- MangaSketch Database Schema
-- Run this in the Supabase SQL Editor to set up your database
-- =======================================================

-- 1. Create the sketches table
CREATE TABLE IF NOT EXISTS public.sketches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.sketches(id) ON DELETE CASCADE,
  user_id UUID NOT null REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT null,
  manga_style TEXT NOT null,
  drawing_style TEXT NOT null,
  image_url TEXT NOT null,
  seed BIGINT NOT null,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

-- 2. Enable Row Level Security (RLS) for database protection
ALTER TABLE public.sketches ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy for SELECT: Users can only read sketches that belong to them
CREATE POLICY "Users can view their own sketches" 
  ON public.sketches FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. RLS Policy for INSERT: Authenticated users can only insert sketches with their own user_id
CREATE POLICY "Users can insert their own sketches" 
  ON public.sketches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS Policy for DELETE: Users can only delete their own sketches
CREATE POLICY "Users can delete their own sketches" 
  ON public.sketches FOR DELETE 
  USING (auth.uid() = user_id);

-- =======================================================
-- Storage Bucket Instructions (Manual Setup in Supabase Console)
-- =======================================================
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Create a new bucket named "sketches"
-- 3. Set the bucket privacy to "Public"
-- 4. In the policies section for "sketches", enable:
--    - Public Read (SELECT) for everyone
--    - Upload (INSERT) for authenticated users only
-- =======================================================

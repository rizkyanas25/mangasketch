import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const isMissingEnv = !supabaseUrl || !supabasePublishableKey;

if (isMissingEnv) {
  console.warn(
    'Supabase environment variables are missing on the client side. Using placeholder credentials for build-time safety.',
  );
}

// Fallback values prevent Next.js static page generation (like /_not-found)
// from crashing the build when env vars are not present in the build pipeline.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
);

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Simple .env parser to avoid external dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('\x1b[31m[Error] No .env file found at:', envPath);
    console.error('Please copy .env.example to .env and fill in your API keys first.\x1b[0m');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !key.startsWith('#')) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your_supabase')) {
  console.error('\x1b[31m[Error] Supabase credentials are not configured in your .env file.\x1b[0m');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '--- Supabase Connection Verification ---');
console.log('Connecting to:', supabaseUrl);

// Initialize Supabase Client with service role key to perform admin checks
const supabase = createClient(supabaseUrl, serviceKey);

async function runChecks() {
  let hasErrors = false;

  // Check 1: Query public.sketches table
  try {
    console.log('\n[Check 1] Querying "sketches" table...');
    const { data, error } = await supabase.from('sketches').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    console.log('\x1b[32m%s\x1b[0m', '✓ Success: Connected to Database. Table "sketches" is accessible.');
    console.log(`  Current row count (limit 1): ${data.length}`);
  } catch (err) {
    hasErrors = true;
    console.error('\x1b[31m%s\x1b[0m', '✗ Failure: Database check failed.');
    console.error('  Details:', err.message || err);
  }

  // Check 2: Check storage bucket "sketches"
  try {
    console.log('\n[Check 2] Checking "sketches" Storage Bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      throw bucketError;
    }
    
    const sketchesBucket = buckets.find(b => b.name === 'sketches');
    if (!sketchesBucket) {
      throw new Error('Bucket named "sketches" was not found in your Supabase storage. Please create it.');
    }
    
    console.log('\x1b[32m%s\x1b[0m', '✓ Success: Connected to Storage. Bucket "sketches" is active.');
    console.log(`  Bucket Privacy: ${sketchesBucket.public ? 'Public' : 'Private'}`);
  } catch (err) {
    hasErrors = true;
    console.error('\x1b[31m%s\x1b[0m', '✗ Failure: Storage check failed.');
    console.error('  Details:', err.message || err);
  }

  // Final status report
  console.log('\n----------------------------------------');
  if (hasErrors) {
    console.log('\x1b[31m%s\x1b[0m', 'Verification Status: FAILED. Please resolve the errors above.');
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'Verification Status: ALL CHECKS PASSED! Supabase is fully configured.');
  }
}

runChecks();

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setup() {
  console.log('Setting up database tables...')

  // Create media table
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS media (
        id bigint generated always as identity primary key,
        type text not null check (type in ('video', 'image')),
        url text not null,
        title text,
        description text,
        category text default 'general',
        duration_seconds int default 10,
        sort_order int default 0,
        active boolean default true,
        created_at timestamptz default now()
      );
    `
  })

  if (e1) {
    console.log('Note: rpc exec_sql not available, trying direct approach...')
    // Try creating via REST - insert a dummy and delete to trigger table creation
    // This won't work for table creation. User needs to run SQL manually.
    console.log('')
    console.log('Please run the SQL in supabase/schema.sql in the Supabase SQL Editor:')
    console.log(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/project/opkkguzwloscebvcgfyf/sql`)
    console.log('')

    // Let's try to check if tables already exist
    const { data, error } = await supabase.from('media').select('id').limit(1)
    if (!error) {
      console.log('✓ media table exists')
    } else {
      console.log('✗ media table needs to be created')
    }

    const { error: e2 } = await supabase.from('announcements').select('id').limit(1)
    if (!e2) console.log('✓ announcements table exists')
    else console.log('✗ announcements table needs to be created')

    const { error: e3 } = await supabase.from('prayer_times').select('id').limit(1)
    if (!e3) console.log('✓ prayer_times table exists')
    else console.log('✗ prayer_times table needs to be created')

    const { error: e4 } = await supabase.from('display_settings').select('key').limit(1)
    if (!e4) console.log('✓ display_settings table exists')
    else console.log('✗ display_settings table needs to be created')

    return
  }

  console.log('✓ Tables created successfully!')
}

setup().catch(console.error)

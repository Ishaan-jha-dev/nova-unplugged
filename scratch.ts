import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  const { data: d1, error: e1 } = await supabase.from('registrations').select('*, events(title, category, start_time, participation_type)').limit(1)
  console.log("REG:", e1 || d1)

  const { data: d2, error: e2 } = await supabase.from('announcements').select('*, users(full_name)').limit(1)
  console.log("ANN:", e2 || d2)
}
test()

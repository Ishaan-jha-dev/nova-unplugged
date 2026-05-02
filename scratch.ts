import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  const { data, error } = await supabase.from('payment_submissions').select('*, user:users!user_id(full_name)').limit(1)
  console.log("PAYMENTS:", error || data)

  const { data: d2, error: e2 } = await supabase.from('scanner_log').select('*, scanned_by_user:users!scanned_by(full_name)').limit(1)
  console.log("SCANNER:", e2 || d2)
}
test()

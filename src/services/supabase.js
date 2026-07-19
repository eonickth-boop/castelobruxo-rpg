import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://gmogsbyqeledwlmyeqim.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_HLbOy38sbBwsupF6MfQ4mg_ZezW_BAk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

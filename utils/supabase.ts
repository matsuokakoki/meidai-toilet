// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// .env.local に設定したキーを読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// どこからでも使えるように export する
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

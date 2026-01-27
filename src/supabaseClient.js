import { createClient } from '@supabase/supabase-js'

// Replace these with your actual keys from Supabase Dashboard > Project Settings > API
const supabaseUrl = "https://tffnixbpzdvjcvltlbjl.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZm5peGJwemR2amN2bHRsYmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc0MTI4NDAsImV4cCI6MjA0Mjk4ODg0MH0.UTjgNKhI9crSJ1wQSAX3DWqWo7jivJGhaqoHiFiAslE"

export const supabase = createClient(supabaseUrl, supabaseKey)
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase env vars: URL=${supabaseUrl ? "set" : "MISSING"}, KEY=${supabaseAnonKey ? "set" : "MISSING"}`
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

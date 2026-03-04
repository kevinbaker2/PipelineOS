import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[supabase:server] Missing env vars at createClient() call:", {
      url: supabaseUrl ? "SET" : "MISSING",
      key: supabaseAnonKey ? "SET" : "MISSING",
    });
    throw new Error(
      `Missing Supabase env vars: URL=${supabaseUrl ? "set" : "MISSING"}, KEY=${supabaseAnonKey ? "set" : "MISSING"}`
    );
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll is called from a Server Component — ignore.
          // Middleware will handle refreshing the session.
        }
      },
    },
  });
}

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Missing Supabase env vars: URL=${supabaseUrl ? "set" : "MISSING"}, SERVICE_KEY=${serviceRoleKey ? "set" : "MISSING"}`
    );
  }

  return createJsClient(supabaseUrl, serviceRoleKey);
}

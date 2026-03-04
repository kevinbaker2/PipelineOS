import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase env vars: URL=${supabaseUrl ? "set" : "MISSING"}, KEY=${supabaseAnonKey ? "set" : "MISSING"}`
    );
  }

  const cookieStore = cookies();

  // cookies() returns a Promise in Next.js 14.2+ but the Supabase SSR
  // cookie adapter expects sync access. We handle both cases.
  const getCookie = (name: string) => {
    try {
      const store = cookieStore as ReturnType<typeof cookies> & { get: (name: string) => { value: string } | undefined };
      return store.get(name)?.value;
    } catch {
      return undefined;
    }
  };

  const setCookie = (name: string, value: string, options: CookieOptions) => {
    try {
      const store = cookieStore as ReturnType<typeof cookies> & { set: (opts: Record<string, unknown>) => void };
      store.set({ name, value, ...options });
    } catch {
      // Server component context - ignore
    }
  };

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: getCookie,
        set: setCookie,
        remove(name: string, options: CookieOptions) {
          setCookie(name, "", options);
        },
      },
    }
  );
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

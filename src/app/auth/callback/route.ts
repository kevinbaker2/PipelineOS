import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Collect cookies set during auth exchange so we can forward them
  // onto the redirect response (cookieStore.set won't do this).
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => cookiesToSet.push(cookie));
        },
      },
    }
  );

  const isRecovery = type === "recovery";
  let authError: unknown = null;

  // PKCE flow — Supabase redirected with a `code` param
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  }
  // Implicit / magic-link flow — Supabase sent `token_hash` + `type` directly
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    authError = error;
  }
  // No recognisable auth params at all
  else {
    authError = new Error("Missing code or token_hash parameter");
  }

  if (authError) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.delete("code");
    redirectUrl.searchParams.delete("token_hash");
    redirectUrl.searchParams.delete("type");
    redirectUrl.searchParams.delete("next");
    redirectUrl.searchParams.set(
      "error",
      "Unable to verify recovery link. Please request a new one."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Build the redirect URL
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = isRecovery ? "/auth/reset-password" : next;
  redirectUrl.searchParams.delete("code");
  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");
  redirectUrl.searchParams.delete("next");

  const response = NextResponse.redirect(redirectUrl);

  // Forward session cookies onto the redirect response
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

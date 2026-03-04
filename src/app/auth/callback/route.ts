import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If this is a password recovery flow, redirect to the reset page
      if (data.session?.user?.recovery_sent_at) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/auth/reset-password";
        redirectUrl.searchParams.delete("code");
        redirectUrl.searchParams.delete("next");
        return NextResponse.redirect(redirectUrl);
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.searchParams.delete("code");
      redirectUrl.searchParams.delete("next");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If code exchange fails, redirect to login with error
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("error", "Unable to verify recovery link. Please try again.");
  return NextResponse.redirect(redirectUrl);
}

import { AppShell } from "@/components/app-shell";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userInfo: { email: string; full_name: string; role: string; xp_total: number } | undefined;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          userInfo = {
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            xp_total: profile.xp_total ?? 0,
          };
        }
      }
    } catch (err) {
      console.error("[auth:layout] Failed to load user profile:", err);
    }
  }

  return (
    <AppShell user={userInfo || { email: "demo@pipeline.os", full_name: "Demo User", role: "admin", xp_total: 0 }}>
      {children}
    </AppShell>
  );
}

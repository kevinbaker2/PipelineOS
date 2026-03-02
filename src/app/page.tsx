import Link from "next/link";
import { Zap, TrendingUp, Target, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">PipelineOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
              <Zap className="h-3.5 w-3.5 text-primary" />
              MRR Sales Intelligence Platform
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Your pipeline,{" "}
              <span className="text-primary">intelligently managed</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground">
              PipelineOS gives B2B sales teams real-time pipeline health scoring,
              AI-driven mission planning, and revenue forecasting — all in one
              beautiful dashboard.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-card/50 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BarChart3, title: "Pipeline Analytics", desc: "Real-time KPIs, weighted pipeline, and close rate tracking" },
              { icon: TrendingUp, title: "Revenue Forecast", desc: "Best, weighted, and conservative forecast scenarios by month" },
              { icon: Target, title: "Smart Missions", desc: "AI-generated daily tasks based on pipeline stagnation and targets" },
              { icon: Shield, title: "Health Score", desc: "0-100 pipeline health with velocity, conversion, and coverage metrics" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          PipelineOS — Built for B2B sales teams that want to close more deals.
        </div>
      </footer>
    </div>
  );
}

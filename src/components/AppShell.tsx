import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, BarChart3, History, Info, Moon, Sun, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/predict", label: "Predict", icon: Zap },
  { to: "/history", label: "History", icon: History },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.82_0.16_210)] to-[oklch(0.72_0.18_305)] shadow-[0_0_24px_oklch(0.82_0.16_210_/_0.5)]">
              <Activity className="h-5 w-5 text-background" strokeWidth={2.5} />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight">
                SMART <span className="text-gradient">TRAFFIC</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                ml · v1.0
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                    active && "text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-lg bg-white/5 ring-1 ring-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/5 transition hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground",
                  active && "bg-white/10 text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="mx-auto mt-16 max-w-7xl px-4 pb-10 text-center text-xs text-muted-foreground sm:px-6">
        <p>
          SMART TRAFFIC · ML-powered urban traffic forecasting · Built with TanStack Start,
          Recharts &amp; Leaflet
        </p>
      </footer>
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  title,
  subtitle,
  action,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-base text-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/** Renders children only after client mount — prevents SSR/window errors. */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode; }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}

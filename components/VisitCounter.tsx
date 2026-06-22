"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { usePathname } from "next/navigation";

const sessionKey = "stardust-visit-counted";

export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const alreadyCounted = sessionStorage.getItem(sessionKey) === "true";
    if (!alreadyCounted) sessionStorage.setItem(sessionKey, "true");

    fetch("/api/visits", {
      method: alreadyCounted ? "GET" : "POST",
      cache: "no-store",
    })
      .then(response => {
        if (!response.ok) throw new Error(`VISIT_COUNTER_${response.status}`);
        return response.json() as Promise<{ count: number }>;
      })
      .then(data => setCount(data.count))
      .catch(error => console.error("Could not display visit count", error));
  }, [pathname]);

  if (count === null) return null;

  return <span className="visit-counter" title="Una visita por sesión del navegador">
    <Eye aria-hidden="true" />
    <b>{new Intl.NumberFormat("es-PE").format(count)}</b>
    {count === 1 ? " visita" : " visitas"}
  </span>;
}

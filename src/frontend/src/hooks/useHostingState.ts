import { useCallback, useState } from "react";

const HOSTING_KEY = "hotbox_hosting_state";

function loadHosting(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(HOSTING_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useHostingState() {
  const [hosting, setHosting] = useState<Record<string, boolean>>(loadHosting);

  const toggle = useCallback((id: string) => {
    setHosting((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(HOSTING_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isHosting = useCallback(
    (id: string) => hosting[id] ?? false,
    [hosting],
  );

  return { isHosting, toggle };
}

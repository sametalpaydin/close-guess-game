import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "close_visitor_id";
const VISIT_SESSION_KEY = "close_visit_logged";

/** Stable anonymous id for one browser (no personal data). */
export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

async function record(eventType: "visit" | "play_start") {
  const visitorId = getVisitorId();
  if (!visitorId) return;
  await supabase.from("analytics_events").insert({
    visitor_id: visitorId,
    event_type: eventType,
  });
}

/** One visit per browser tab session. */
export async function trackVisit() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(VISIT_SESSION_KEY)) return;
    sessionStorage.setItem(VISIT_SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
  await record("visit");
}

export async function trackPlayStart() {
  await record("play_start");
}

/** Real number of distinct players who started the game today (UTC). */
export function usePlayersToday(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    supabase.rpc("players_today").then(({ data, error }) => {
      if (!active || error) return;
      setCount(typeof data === "number" ? data : 0);
    });
    return () => {
      active = false;
    };
  }, []);

  return count;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatToday(): string {
  const d = new Date();
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Computed after hydration so server and client markup always match. */
export function useTodayLabel(): string {
  const [label, setLabel] = useState("");
  useEffect(() => setLabel(formatToday()), []);
  return label;
}

export function todayLabel(): string {
  return formatToday();
}

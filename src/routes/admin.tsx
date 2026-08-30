import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Analytics — CLOSE" },
      {
        name: "description",
        content: "Private analytics panel for CLOSE: real visitors, visits and players.",
      },
      { property: "og:title", content: "Analytics — CLOSE" },
      { property: "og:description", content: "Private analytics panel for CLOSE." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Row = {
  scope: string;
  unique_visitors: number;
  total_visits: number;
  players: number;
};

const SCOPES: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last7", label: "Last 7 days" },
  { key: "all", label: "All time" },
];

function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("analytics_summary");
    if (rpcError) {
      setError("This account is not an admin yet.");
      setRows(null);
      return;
    }
    setError("");
    setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const active = Boolean(data.session);
      setSignedIn(active);
      if (active) void load();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
      if (session) void load();
      else setRows(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setBusy(false);
  }

  async function signUp() {
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (authError) setError(authError.message);
    setBusy(false);
  }

  return (
    <main translate="no" className="notranslate min-h-screen bg-hero-glow px-5 pb-16 pt-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">Analytics</h1>
          <Link translate="no" to="/" className="text-xs text-muted-foreground underline">
            Back to game
          </Link>
        </div>

        {signedIn === null ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : !signedIn ? (
          <form onSubmit={signIn} className="mt-8 grid gap-3 rounded-2xl border border-border p-5 card-surface">
            <p className="text-sm text-muted-foreground">Sign in to view real stats.</p>
            <input
              translate="no"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="notranslate h-12 rounded-xl border border-border bg-secondary px-4 text-sm outline-none"
            />
            <input
              translate="no"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="notranslate h-12 rounded-xl border border-border bg-secondary px-4 text-sm outline-none"
            />
            <button
              translate="no"
              type="submit"
              disabled={busy}
              className="h-12 rounded-xl font-display text-sm font-bold uppercase tracking-[0.18em] cta-gradient disabled:opacity-60"
            >
              Sign in
            </button>
            <button
              translate="no"
              type="button"
              onClick={signUp}
              disabled={busy}
              className="text-xs text-muted-foreground underline"
            >
              Create admin account
            </button>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </form>
        ) : (
          <div className="mt-8 grid gap-3">
            {error ? (
              <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground card-surface">
                {error}
              </p>
            ) : null}
            {SCOPES.map((s) => {
              const row = rows?.find((r) => r.scope === s.key);
              return (
                <div key={s.key} className="rounded-2xl border border-border p-5 card-surface">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                    {s.label}
                  </h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Visitors" value={row?.unique_visitors} />
                    <Stat label="Visits" value={row?.total_visits} />
                    <Stat label="Players" value={row?.players} />
                  </div>
                </div>
              );
            })}
            <div className="mt-2 flex gap-2">
              <button
                translate="no"
                onClick={() => void load()}
                className="h-11 flex-1 rounded-xl border border-border text-sm font-semibold card-surface"
              >
                Refresh
              </button>
              <button
                translate="no"
                onClick={() => supabase.auth.signOut()}
                className="h-11 flex-1 rounded-xl border border-border text-sm font-semibold card-surface"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <div className="num-tabular font-display text-xl font-bold text-primary">
        {value == null ? "—" : value.toLocaleString("en-US")}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

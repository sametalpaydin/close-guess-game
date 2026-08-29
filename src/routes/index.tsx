import { createFileRoute, Link } from "@tanstack/react-router";
import { GLOBAL_RANKING, PLAYERS_TODAY, TODAY_LABEL } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CLOSE — How close can you get?" },
      {
        name: "description",
        content:
          "CLOSE is a free daily guessing game. Five visual estimation questions a day. Guess, submit, and see how close you are to everyone else.",
      },
      { property: "og:title", content: "CLOSE — How close can you get?" },
      {
        property: "og:description",
        content: "Five daily visual estimation puzzles. Free to play. See how close you are.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "1", t: "Guess", d: "Look at the image, trust your gut." },
  { n: "2", t: "Submit", d: "Lock in one number." },
  { n: "3", t: "See how close", d: "Compare with the world." },
];

function Landing() {
  return (
    <main translate="no" className="notranslate relative min-h-screen overflow-hidden bg-hero-glow px-5 pb-16 pt-14">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <section className="animate-rise text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
            Daily · {TODAY_LABEL}
          </p>
          <h1 className="mt-5 font-display text-7xl font-bold tracking-[-0.06em]">CLOSE</h1>
          <p className="mt-3 text-base text-muted-foreground">How close can you get?</p>
        </section>

        <Link
          translate="no"
          to="/play"
          className="animate-glow mt-10 flex h-16 items-center justify-center rounded-2xl font-display text-lg font-bold uppercase tracking-[0.18em] transition-transform duration-200 active:scale-[0.97] cta-gradient"
        >
          Play Today
        </Link>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
          <span className="num-tabular">{PLAYERS_TODAY.toLocaleString("en-US")}</span> players today
        </div>

        <section className="mt-12 grid gap-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="animate-rise flex items-center gap-4 rounded-2xl border border-border p-4 card-surface"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-primary">
                {s.n}
              </span>
              <div>
                <h2 className="font-display text-base font-semibold">{s.t}</h2>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="animate-rise mt-10" style={{ animationDelay: "420ms" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
              Global Ranking
            </h2>
            <span className="text-xs text-muted-foreground">Today · Top 5</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border card-surface">
            {GLOBAL_RANKING.slice(0, 5).map((r, i) => (
              <div
                key={r.name}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span className="w-5 num-tabular text-sm text-muted-foreground">{i + 1}</span>
                <span className="text-lg">{r.country}</span>
                <span className="flex-1 truncate text-sm">{r.name}</span>
                <span className="num-tabular text-sm font-semibold text-primary">
                  {r.score.toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Free to play. No deposits, no betting, no prizes — just estimation and bragging rights.
        </p>
      </div>
    </main>
  );
}

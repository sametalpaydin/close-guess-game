import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  GLOBAL_RANKING,
  QUESTIONS,
  accuracyPercent,
  offBy,
  percentileFor,
  rankFor,
  scoreGuess,
  verdict,
} from "@/lib/game";
import { trackPlayStart, usePlayersToday, useTodayLabel } from "@/lib/analytics";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Today's Challenge — CLOSE" },
      {
        name: "description",
        content:
          "Play today's five CLOSE estimation questions, score your accuracy and compare against the global ranking.",
      },
      { property: "og:title", content: "Today's Challenge — CLOSE" },
      {
        property: "og:description",
        content: "Five visual estimation questions. Guess, submit, see how close you are.",
      },
    ],
  }),
  component: Play,
});

type Result = { guess: number; points: number; accuracy: number };

function Play() {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [revealed, setRevealed] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const todayLabel = useTodayLabel();
  const playersToday = usePlayersToday();

  useEffect(() => {
    void trackPlayStart();
  }, []);

  const q = QUESTIONS[index]!;
  const done = results.length === QUESTIONS.length && !revealed;
  const total = results.reduce((s, r) => s + r.points, 0);

  const shareText = useMemo(() => {
    const bars = results
      .map((r) => (r.points >= 950 ? "🟩" : r.points >= 700 ? "🟨" : r.points >= 400 ? "🟧" : "⬛"))
      .join("");
    return `CLOSE${todayLabel ? ` · ${todayLabel}` : ""}\n${bars}\n${total}/5000 — top ${100 - percentileFor(total)}%\nHow close can you get?`;
  }, [results, total, todayLabel]);

  function submit() {
    const guess = Number(input);
    if (!Number.isFinite(guess) || input.trim() === "") return;
    const points = scoreGuess(guess, q.answer);
    const r = { guess, points, accuracy: accuracyPercent(guess, q.answer) };
    setResults((prev) => [...prev, r]);
    setRevealed(r);
  }

  function next() {
    setRevealed(null);
    setInput("");
    setIndex((i) => Math.min(i + 1, QUESTIONS.length - 1));
  }




  async function share() {
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* dismissed */
    }
  }

  if (done) {
    const pct = percentileFor(total);
    const rank = rankFor(total, playersToday ?? 1);
    const avgAccuracy = Math.round(
      results.reduce((s, r) => s + r.accuracy, 0) / results.length,
    );
    return (
      <main translate="no" className="notranslate min-h-screen bg-hero-glow px-5 pb-16 pt-12">
        <div className="mx-auto w-full max-w-md">
          <p className="text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Your Score{todayLabel ? ` · ${todayLabel}` : ""}
          </p>
          <div className="animate-pop mt-6 rounded-3xl border border-border p-8 text-center card-surface">
            <div className="num-tabular font-display text-6xl font-bold text-primary">{total}</div>
            <p className="mt-1 text-sm text-muted-foreground">out of 5000</p>
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
              <div>
                <div className="num-tabular font-display text-lg font-bold">{avgAccuracy}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Accuracy
                </div>
              </div>
              <div>
                <div className="num-tabular font-display text-lg font-bold">
                  #{rank.toLocaleString("en-US")}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Today's rank
                </div>
              </div>
              <div>
                <div className="num-tabular font-display text-lg font-bold">Top {100 - pct}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  of {playersToday == null ? "—" : playersToday.toLocaleString("en-US")}
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="animate-rise rounded-xl border border-border py-3 text-center card-surface"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="num-tabular text-sm font-semibold">{r.points}</div>
                <div className="text-[10px] text-muted-foreground">Q{i + 1}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Each question is worth up to 1000 points — the closer your guess, the more you earn.
          </p>

          <button
            translate="no"
            onClick={share}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl font-display text-base font-bold uppercase tracking-[0.18em] transition-transform active:scale-[0.97] cta-gradient"
          >
            {copied ? "Copied!" : "Share Result"}
          </button>

          <h2 className="mt-10 font-display text-sm font-semibold uppercase tracking-[0.2em]">
            Global Ranking
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border card-surface">
            {GLOBAL_RANKING.map((r, i) => (
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
            <div className="flex items-center gap-3 bg-secondary px-4 py-3">
              <span className="w-5 text-sm text-muted-foreground">—</span>
              <span className="text-lg">🌍</span>
              <span className="flex-1 text-sm font-semibold">You</span>
              <span className="num-tabular text-sm font-semibold text-primary">{total}</span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border p-5 text-center card-surface">
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">
              Play again tomorrow
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              A new set of 5 questions drops at midnight. See you then.
            </p>
          </div>

          <Link
            translate="no"
            to="/"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold card-surface"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main translate="no" className="notranslate min-h-screen px-5 pb-10 pt-8">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center justify-between">
          <Link translate="no" to="/" className="font-display text-lg font-bold tracking-tight">
            CLOSE
          </Link>
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Question {index + 1} of {QUESTIONS.length}
          </span>
        </header>

        <div className="mt-4 flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i < results.length ? "bg-primary" : i === index ? "bg-muted-foreground" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <section key={q.id} className="animate-rise mt-6">
          <div className="overflow-hidden rounded-3xl border border-border card-surface">
            <img
              src={q.image}
              alt={q.prompt}
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover"
            />
          </div>

          <h1 className="mt-6 font-display text-2xl font-semibold leading-tight tracking-tight">
            {q.prompt}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{q.hint}</p>

          {!revealed ? (
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-2xl border border-input px-4 py-3 card-surface">
                <input
                  translate="no"
                  inputMode="decimal"
                  type="number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="0"
                  className="notranslate num-tabular w-full bg-transparent font-display text-3xl font-bold outline-none placeholder:text-muted-foreground"
                />
                <span className="shrink-0 text-sm text-muted-foreground">{q.unit}</span>
              </div>
              <input
                translate="no"
                type="range"
                min={0}
                max={q.max}
                step={q.step}
                value={Number(input) || 0}
                onChange={(e) => setInput(e.target.value)}
                className="notranslate mt-5 w-full accent-[var(--primary)]"
                aria-label="Adjust your guess"
              />
              <button
                translate="no"
                onClick={submit}
                disabled={input.trim() === ""}
                className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl font-display text-base font-bold uppercase tracking-[0.18em] transition-transform active:scale-[0.97] disabled:opacity-40 cta-gradient"
              >
                Submit Guess
              </button>
            </div>
          ) : (
            <div className="animate-pop mt-6 rounded-2xl border border-border p-5 card-surface">
              <p className="font-display text-xs uppercase tracking-[0.25em] text-primary">
                {verdict(revealed.points)}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="num-tabular font-display text-xl font-bold">{revealed.guess}</div>
                  <div className="text-[11px] text-muted-foreground">You</div>
                </div>
                <div>
                  <div className="num-tabular font-display text-xl font-bold text-primary">
                    {q.answer}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Answer</div>
                </div>
                <div>
                  <div className="num-tabular font-display text-xl font-bold">
                    {q.crowdAverage}
                  </div>
                  <div className="text-[11px] text-muted-foreground">World avg</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-secondary px-4 py-3 text-center text-sm">
                Off by{" "}
                <span className="num-tabular font-semibold">
                  {offBy(revealed.guess, q.answer)} {q.unit}
                </span>{" "}
                · {revealed.accuracy}% accurate
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Points earned</span>
                <span className="num-tabular font-display font-bold text-primary">
                  +{revealed.points} pts
                </span>
              </div>
              <button
                translate="no"
                onClick={() => (results.length === QUESTIONS.length ? setRevealed(null) : next())}
                className="mt-5 flex h-13 w-full items-center justify-center rounded-xl border border-border py-3 font-display text-sm font-bold uppercase tracking-[0.18em] active:scale-[0.98]"
              >
                {results.length === QUESTIONS.length ? "See final score" : "Next question"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

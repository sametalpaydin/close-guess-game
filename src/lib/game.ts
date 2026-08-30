import q1 from "@/assets/q1.jpg";
import q2 from "@/assets/q2.jpg";
import q3 from "@/assets/q3.jpg";
import q4 from "@/assets/q4.jpg";
import q5 from "@/assets/q5.jpg";

export type Question = {
  id: number;
  image: string;
  prompt: string;
  hint: string;
  unit: string;
  answer: number;
  crowdAverage: number;
  step: number;
  max: number;
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    image: q1,
    prompt: "What percentage of this image is red?",
    hint: "Only the red blocks count.",
    unit: "%",
    answer: 12,
    crowdAverage: 18,
    step: 1,
    max: 100,
  },
  {
    id: 2,
    image: q2,
    prompt: "How many objects are in this image?",
    hint: "Count every yellow shape you can see.",
    unit: "objects",
    answer: 84,
    crowdAverage: 71,
    step: 1,
    max: 400,
  },
  {
    id: 3,
    image: q3,
    prompt: "How tall is this building?",
    hint: "Roof height, in meters.",
    unit: "m",
    answer: 310,
    crowdAverage: 254,
    step: 5,
    max: 800,
  },
  {
    id: 4,
    image: q4,
    prompt: "How many people are in this crowd?",
    hint: "Estimate everyone visible from above.",
    unit: "people",
    answer: 620,
    crowdAverage: 480,
    step: 10,
    max: 3000,
  },
  {
    id: 5,
    image: q5,
    prompt: "How many jelly beans are in the jar?",
    hint: "Include the ones on the table.",
    unit: "beans",
    answer: 247,
    crowdAverage: 198,
    step: 1,
    max: 1000,
  },
];

/** 0-1000 points based on relative distance from the true answer. */
export function scoreGuess(guess: number, answer: number): number {
  const denom = Math.max(Math.abs(answer), 1);
  const error = Math.abs(guess - answer) / denom;
  const accuracy = Math.max(0, 1 - error);
  return Math.round(1000 * Math.pow(accuracy, 1.5));
}

export function accuracyPercent(guess: number, answer: number): number {
  const denom = Math.max(Math.abs(answer), 1);
  return Math.max(0, Math.round((1 - Math.abs(guess - answer) / denom) * 100));
}

/** Absolute distance between guess and answer, rounded for display. */
export function offBy(guess: number, answer: number): number {
  return Math.round(Math.abs(guess - answer) * 100) / 100;
}

/** Estimated rank among today's real players (1 = best). */
export function rankFor(score: number, playersToday: number): number {
  const pct = percentileFor(score);
  return Math.max(1, Math.round(Math.max(playersToday, 1) * (1 - pct / 100)));
}

export function verdict(points: number): string {
  if (points >= 950) return "PERFECT";
  if (points >= 820) return "SO CLOSE";
  if (points >= 600) return "CLOSE";
  if (points >= 350) return "NOT BAD";
  return "WAY OFF";
}

export type RankRow = { name: string; country: string; score: number };

export const GLOBAL_RANKING: RankRow[] = [
  { name: "mira_k", country: "🇸🇪", score: 4812 },
  { name: "tofu", country: "🇯🇵", score: 4740 },
  { name: "danvers", country: "🇺🇸", score: 4693 },
  { name: "lupe", country: "🇲🇽", score: 4551 },
  { name: "arda", country: "🇹🇷", score: 4488 },
  { name: "nkechi", country: "🇳🇬", score: 4402 },
  { name: "pieter", country: "🇳🇱", score: 4317 },
  { name: "sana", country: "🇮🇳", score: 4260 },
  { name: "brz_ana", country: "🇧🇷", score: 4185 },
  { name: "leo", country: "🇮🇹", score: 4098 },
];

export const PLAYERS_TODAY = 128_463;

export function percentileFor(score: number): number {
  const max = 5000;
  const ratio = Math.min(1, Math.max(0, score / max));
  return Math.max(1, Math.min(99, Math.round(1 + Math.pow(ratio, 1.6) * 98)));
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic (UTC) so SSR and client always render the same label.
export const TODAY_LABEL = (() => {
  const d = new Date();
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
})();

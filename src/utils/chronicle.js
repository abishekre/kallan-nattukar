// ---------------------------------------------------------------------------
// Panchayat Chronicle: a persistent, per-village feed of past rounds, plus the
// "played every day" habit streak. Pure helpers — the store lives in
// GameContext via useLocalStorage. Keeping these functions free of Date.now()
// arguments-in (callers pass timestamps) keeps them testable.
// ---------------------------------------------------------------------------

export const MAX_CHRONICLE_ENTRIES = 50;

// Build one immutable chronicle entry from a finished round.
export const buildChronicleEntry = ({
  id,
  timestamp,
  round,
  winner,
  winningTeam,
  category,
  difficulty,
  nattukaranWord,
  kallanWord,
  kallans = [],
  pottan = null,
  mvpName = null,
}) => ({
  id,
  timestamp,
  round,
  winner,
  winningTeam,
  category,
  difficulty,
  nattukaranWord,
  kallanWord,
  kallans,
  pottan,
  mvpName,
});

// Prepend an entry, capping the log so storage never grows unbounded.
export const addChronicleEntry = (log = [], entry) =>
  [entry, ...log].slice(0, MAX_CHRONICLE_ENTRIES);

// Convert a timestamp (ms) to a local YYYY-MM-DD day key.
export const dayKey = (timestamp) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Whole-day difference between two day keys (b - a). Used to decide whether a
// daily streak continues (1 day gap), holds (same day) or resets (>1).
const daysBetween = (aKey, bKey) => {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
};

// Update the daily streak given the previous streak record and "now".
// Returns { current, best, lastDay, isNewDay }.
export const updateDailyStreak = (prev, timestamp) => {
  const today = dayKey(timestamp);
  const safe = prev || { current: 0, best: 0, lastDay: null };

  if (safe.lastDay === today) {
    // Already counted today — no change to the streak length.
    return { ...safe, isNewDay: false };
  }

  let current;
  if (safe.lastDay && daysBetween(safe.lastDay, today) === 1) {
    current = (safe.current || 0) + 1; // consecutive day
  } else {
    current = 1; // first ever, or a gap broke the streak
  }

  const best = Math.max(safe.best || 0, current);
  return { current, best, lastDay: today, isNewDay: true };
};

// Small human-friendly relative time for the chronicle feed.
export const relativeTime = (timestamp, now) => {
  const diff = Math.max(0, now - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

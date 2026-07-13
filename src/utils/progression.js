// ---------------------------------------------------------------------------
// Progression system: XP, Ranks, Achievements.
// Pure logic only — no React, no DOM. Everything here is deterministic given
// its inputs so it stays easy to reason about and cheap to call from effects.
// ---------------------------------------------------------------------------

// Canonical per-player stats shape. Extended over the original (points,
// timesKallan, timesPottan, wrongfulDeaths, winStreak, caughtKallans) with the
// fields the progression + achievement systems rely on. `overrides` lets
// migration preserve existing values.
export const makePlayerStats = (overrides = {}) => ({
  points: 0,
  timesKallan: 0,
  timesPottan: 0,
  wrongfulDeaths: 0,
  winStreak: 0,
  caughtKallans: 0,
  roundsPlayed: 0,
  kallanWins: 0,
  pottanWins: 0,
  bestStreak: 0,
  ...overrides,
});

// XP awarded to a player at the end of a round, based on what happened.
// Tuned so that "just one more round" always feels rewarding — even a loss
// grants participation XP so the bar is never fully stagnant.
export const XP_RULES = {
  participate: 10,   // everyone who played
  win: 25,           // on the winning team
  kallanWin: 15,     // bonus for winning AS a Kallan (harder role)
  pottanWin: 40,     // bonus for the Pottan stealing the win (hardest)
  survive: 5,        // not eliminated this round
  streakBonus: 10,   // per point of active win-streak (capped below)
};

const STREAK_BONUS_CAP = 5; // don't let streaks balloon XP unboundedly

// Rank ladder. `min` is the cumulative XP needed to reach the rank.
// Titles lean into the Kerala village theme for flavour + status.
export const RANKS = [
  { min: 0,     name: 'Nattukaran',      tag: 'Villager',        icon: '🌱' },
  { min: 100,   name: 'Karyasthan',      tag: 'Overseer',        icon: '🧭' },
  { min: 250,   name: 'Mooppan',         tag: 'Village Elder',   icon: '🪕' },
  { min: 500,   name: 'Pramaani',        tag: 'Big Shot',        icon: '🎩' },
  { min: 900,   name: 'Karanavar',       tag: 'Patriarch',       icon: '👑' },
  { min: 1500,  name: 'Desha Nayakan',   tag: 'Legend',          icon: '🔱' },
  { min: 2500,  name: 'Ithihasam',       tag: 'Mythic',          icon: '🐉' },
];

export const getRankForXp = (xp = 0) => {
  let rank = RANKS[0];
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) {
      rank = RANKS[i];
      index = i;
    }
  }
  const next = RANKS[index + 1] || null;
  const spanStart = rank.min;
  const spanEnd = next ? next.min : rank.min;
  const progress = next ? Math.min(1, (xp - spanStart) / (spanEnd - spanStart)) : 1;
  return { rank, index, next, progress, xpIntoRank: xp - spanStart, xpForNext: next ? next.min - xp : 0 };
};

// Compute XP earned by a single player for the just-finished round.
export const computeRoundXp = ({ role, eliminated, winningTeam, winStreak = 0 }) => {
  let xp = XP_RULES.participate;
  if (!eliminated) xp += XP_RULES.survive;

  const won =
    (winningTeam === 'nattukar' && role === 'Nattukaran') ||
    (winningTeam === 'kallans' && role === 'Kallan') ||
    (winningTeam === 'pottan' && role === 'Pottan');

  if (won) {
    xp += XP_RULES.win;
    if (role === 'Kallan') xp += XP_RULES.kallanWin;
    if (role === 'Pottan') xp += XP_RULES.pottanWin;
    xp += Math.min(winStreak, STREAK_BONUS_CAP) * XP_RULES.streakBonus;
  }

  return xp;
};

// ---------------------------------------------------------------------------
// Achievements. Each has an `id`, display metadata, and a `check(stats)`
// predicate evaluated against a player's cumulative stats object.
// Unlocks are persisted per-village so they feel permanent and collectible.
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    title: 'Adyathe Pooram',
    desc: 'Play your very first round.',
    icon: '🎉',
    check: (s) => (s.roundsPlayed || 0) >= 1,
  },
  {
    id: 'master_kallan',
    title: 'Master of Deception',
    desc: 'Win 5 rounds as the Kallan.',
    icon: '🥷',
    check: (s) => (s.kallanWins || 0) >= 5,
  },
  {
    id: 'silver_tongue',
    title: 'Silver Tongue',
    desc: 'Steal a win as the Pottan.',
    icon: '🎭',
    check: (s) => (s.pottanWins || 0) >= 1,
  },
  {
    id: 'untouchable',
    title: 'Untouchable',
    desc: 'Reach a 3-round win streak.',
    icon: '🔥',
    check: (s) => (s.bestStreak || 0) >= 3,
  },
  {
    id: 'on_fire',
    title: 'Kola Mass',
    desc: 'Reach a 5-round win streak.',
    icon: '⚡',
    check: (s) => (s.bestStreak || 0) >= 5,
  },
  {
    id: 'scapegoat_king',
    title: 'The Scapegoat',
    desc: 'Get wrongfully eliminated 5 times.',
    icon: '🐐',
    check: (s) => (s.wrongfulDeaths || 0) >= 5,
  },
  {
    id: 'veteran',
    title: 'Panchayat Veteran',
    desc: 'Play 25 rounds.',
    icon: '🎖️',
    check: (s) => (s.roundsPlayed || 0) >= 25,
  },
  {
    id: 'centurion',
    title: 'Ithihasam',
    desc: 'Earn 500 total points.',
    icon: '💯',
    check: (s) => (s.points || 0) >= 500,
  },
  {
    id: 'kallan_hunter',
    title: 'CID Dasan',
    desc: 'Catch 10 Kallans.',
    icon: '🔍',
    check: (s) => (s.caughtKallans || 0) >= 10,
  },
];

// Given previous stats snapshot and new stats, return newly-unlocked achievements
// (relative to an `alreadyUnlocked` id set). Pure — caller persists the result.
export const detectNewAchievements = (stats, alreadyUnlocked = []) => {
  const unlockedSet = new Set(alreadyUnlocked);
  return ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id) && a.check(stats || {}));
};

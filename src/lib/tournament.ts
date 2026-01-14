// lib/tournament.ts
export type Player = {
  id: string;
  name: string;
};

export type MatchSlot = {
  playerId: string;
  name: string;
};

export type Match = {
  id: string;
  roundIndex: number;
  matchIndex: number;

  a?: MatchSlot;
  b?: MatchSlot;

  bestOf: number;

  // Leg-Stand
  legsA: number;
  legsB: number;

  // Wer startet Leg 1 (optional, Standard: "a")
  startPlayer?: "a" | "b";

  winnerId?: string;
  isBye?: boolean;
};

export type TournamentMeta = {
  bracketSize: number;
  byes: number;
  roundLabels: string[];
};

export type Tournament = {
  id: string;
  createdAt: number;
  bestOf: number;
  players: Player[];
  rounds: Match[][];
  meta: TournamentMeta;
};

function uuid() {
  // @ts-ignore
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function nextPowerOfTwo(n: number) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundLabel(size: number) {
  if (size === 2) return "Finale";
  if (size === 4) return "Halbfinale";
  if (size === 8) return "Viertelfinale";
  if (size === 16) return "Achtelfinale";
  if (size === 32) return "Sechzehntelfinale";
  return `Runde mit ${size}`;
}

export function legsToWin(bestOf: number) {
  return Math.floor(bestOf / 2) + 1;
}

function winnerSlot(match: Match): MatchSlot | undefined {
  if (!match.winnerId) return undefined;
  if (match.a?.playerId === match.winnerId) return match.a;
  if (match.b?.playerId === match.winnerId) return match.b;
  return undefined;
}

function clearParticipantsFromRound(t: Tournament, startRoundIndex: number) {
  for (let r = startRoundIndex; r < t.rounds.length; r++) {
    for (const m of t.rounds[r]) {
      m.a = undefined;
      m.b = undefined;
    }
  }
}

function validateWinners(t: Tournament) {
  for (const round of t.rounds) {
    for (const m of round) {
      if (!m.winnerId) continue;
      const valid =
        (m.a && m.a.playerId === m.winnerId) ||
        (m.b && m.b.playerId === m.winnerId);
      if (!valid) m.winnerId = undefined;
    }
  }
}

function propagateWinnersForward(t: Tournament, startRoundIndex: number) {
  for (let r = startRoundIndex; r < t.rounds.length - 1; r++) {
    const current = t.rounds[r];
    const next = t.rounds[r + 1];

    for (const m of current) {
      const w = winnerSlot(m);
      if (!w) continue;

      const nextMatchIndex = Math.floor(m.matchIndex / 2);
      const slotKey = m.matchIndex % 2 === 0 ? "a" : "b";
      next[nextMatchIndex][slotKey] = { ...w };
    }

    validateWinners(t);
  }
}

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function recomputeWinnerFromLegs(match: Match) {
  // Byes behalten ihre winnerId
  if (match.isBye && match.winnerId) return;

  const target = legsToWin(match.bestOf);

  // Nur wenn beide Teilnehmer da sind, kann es ein echter winner sein
  const ready = !!match.a?.playerId && !!match.b?.playerId;
  if (!ready) {
    match.winnerId = undefined;
    return;
  }

  if (match.legsA >= target && match.legsA > match.legsB) {
    match.winnerId = match.a!.playerId;
    return;
  }
  if (match.legsB >= target && match.legsB > match.legsA) {
    match.winnerId = match.b!.playerId;
    return;
  }
  match.winnerId = undefined;
}

export function generateTournament(players: Player[], bestOf: number): Tournament {
  if (players.length < 2) throw new Error("Mindestens 2 Spieler benötigt.");
  if (bestOf < 1 || bestOf % 2 === 0)
    throw new Error("Best-of muss ungerade und >= 1 sein (z.B. 1,3,5,7).");

  const shuffled = shuffle(players);
  const bracketSize = nextPowerOfTwo(shuffled.length);
  const byes = bracketSize - shuffled.length;

  const slots: Array<MatchSlot | undefined> = shuffled.map((p) => ({
    playerId: p.id,
    name: p.name,
  }));
  for (let i = 0; i < byes; i++) slots.push(undefined);

  const roundsCount = Math.log2(bracketSize);

  const round0: Match[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];

    const isBye = (!!a && !b) || (!a && !!b);
    const winnerId = isBye ? (a?.playerId ?? b?.playerId) : undefined;

    round0.push({
      id: uuid(),
      roundIndex: 0,
      matchIndex: i / 2,
      a,
      b,
      bestOf,
      legsA: 0,
      legsB: 0,
      startPlayer: "a",
      isBye,
      winnerId,
    });
  }

  const rounds: Match[][] = [round0];

  for (let r = 1; r < roundsCount; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r + 1);
    const roundR: Match[] = Array.from({ length: matchesInRound }, (_, m) => ({
      id: uuid(),
      roundIndex: r,
      matchIndex: m,
      bestOf,
      legsA: 0,
      legsB: 0,
      startPlayer: "a",
    }));
    rounds.push(roundR);
  }

  const t: Tournament = {
    id: uuid(),
    createdAt: Date.now(),
    bestOf,
    players,
    rounds,
    meta: {
      bracketSize,
      byes,
      roundLabels: Array.from({ length: roundsCount }, (_, r) =>
        roundLabel(bracketSize / Math.pow(2, r))
      ),
    },
  };

  // Byes weitertragen
  clearParticipantsFromRound(t, 1);
  propagateWinnersForward(t, 0);

  return t;
}

export function updateLegs(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number,
  legsA: number,
  legsB: number
): Tournament {
  const t: Tournament = structuredClone(tournament);

  const match = t.rounds[roundIndex]?.[matchIndex];
  if (!match) return t;

  // Byes: keine Leg-Änderung nötig (aber erlauben wir trotzdem)
  const target = legsToWin(match.bestOf);

  match.legsA = Math.min(clampInt(legsA), match.bestOf);
  match.legsB = Math.min(clampInt(legsB), match.bestOf);

  // Optional: über "bestOf" hinaus verhindern
  match.legsA = Math.min(match.legsA, match.bestOf);
  match.legsB = Math.min(match.legsB, match.bestOf);

  // Auto-Winner aus Legs
  recomputeWinnerFromLegs(match);

  // Ab nächster Runde neu berechnen
  clearParticipantsFromRound(t, roundIndex + 1);
  propagateWinnersForward(t, roundIndex);

  return t;
}

export function incrementLeg(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number,
  side: "a" | "b",
  delta: 1 | -1
): Tournament {
  const match = tournament.rounds[roundIndex]?.[matchIndex];
  if (!match) return tournament;

  const nextA = side === "a" ? match.legsA + delta : match.legsA;
  const nextB = side === "b" ? match.legsB + delta : match.legsB;

  return updateLegs(tournament, roundIndex, matchIndex, nextA, nextB);
}

export function quickSetWinner(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number,
  winner: "a" | "b"
): Tournament {
  const match = tournament.rounds[roundIndex]?.[matchIndex];
  if (!match || !match.a?.playerId || !match.b?.playerId) return tournament;

  const target = legsToWin(match.bestOf);

  const nextA = winner === "a" ? target : Math.min(match.legsA, target - 1);
  const nextB = winner === "b" ? target : Math.min(match.legsB, target - 1);

  return updateLegs(tournament, roundIndex, matchIndex, nextA, nextB);
}

export function resetTournamentWinners(tournament: Tournament): Tournament {
  const t: Tournament = structuredClone(tournament);

  for (const round of t.rounds) {
    for (const m of round) {
      // Bye-Winner behalten
      if (!(m.isBye && m.winnerId)) {
        m.winnerId = undefined;
      }
      m.legsA = 0;
      m.legsB = 0;
    }
  }

  clearParticipantsFromRound(t, 1);
  propagateWinnersForward(t, 0);
  return t;
}

export function nextLegStarter(match: Match): "a" | "b" {
  // Leg 1 starter = startPlayer (default "a")
  const start = match.startPlayer ?? "a";
  const playedLegs = (match.legsA ?? 0) + (match.legsB ?? 0);
  // nächstes Leg ist playedLegs+1 => Starter wechselt jedes Leg
  const isOddNext = ((playedLegs + 1) % 2) === 1;
  // Wenn Leg 1 "start" ist, dann sind ungerade Legs = start
  return isOddNext ? start : (start === "a" ? "b" : "a");
}

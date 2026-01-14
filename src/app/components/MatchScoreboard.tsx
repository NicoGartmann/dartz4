"use client";

import type { Tournament, Match } from "@/lib/tournament";
import { incrementLeg, legsToWin, nextLegStarter } from "@/lib/tournament";

function matchTitle(m: Match) {
  const a = m.a?.name ?? "—";
  const b = m.b?.name ?? "—";
  return `${a} vs ${b}`;
}

export function MatchScoreboard({
  tournament,
  onChange,
}: {
  tournament: Tournament;
  onChange: (t: Tournament) => void;
}) {
  return (
    <section className="card">
      <h2>Scoreboard (Legs)</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        501 Double Out · Best-of {tournament.bestOf} (first to {legsToWin(tournament.bestOf)}) · Anwurf wechselt jedes Leg
      </p>

      <div className="scoreRounds">
        {tournament.rounds.map((round, r) => (
          <div key={r} className="scoreRound">
            <div className="scoreRoundHeader">
              <strong>{tournament.meta.roundLabels[r]}</strong>
              <span className="muted">({round.length} Matches)</span>
            </div>

            <div className="scoreMatchList">
              {round.map((m) => {
                const ready = !!m.a?.playerId && !!m.b?.playerId && !m.isBye;
                const target = legsToWin(m.bestOf);
                const starter = nextLegStarter(m);

                return (
                  <div key={m.id} className="scoreMatch">
                    <div className="scoreMatchTop">
                      <div>
                        <div className="scoreMatchTitle">{matchTitle(m)}</div>
                        <div className="muted">
                          {m.isBye
                            ? "BYE (auto-advance)"
                            : ready
                            ? `Score ${m.legsA}–${m.legsB} · first to ${target} · Nächstes Leg startet: ${starter === "a" ? (m.a?.name ?? "A") : (m.b?.name ?? "B")}`
                            : "Warte auf Teilnehmer…"}
                        </div>
                      </div>

                      {m.winnerId ? <span className="pill">Winner gesetzt</span> : <span className="pill mutedPill">offen</span>}
                    </div>

                    <div className="scoreControls">
                      <div className="scoreSide">
                        <div className="scoreName">{m.a?.name ?? "—"}</div>
                        <div className="scoreBtns">
                          <button
                            className="btn btnGhost"
                            onClick={() => onChange(incrementLeg(tournament, r, m.matchIndex, "a", -1))}
                            disabled={!ready || m.legsA <= 0}
                            title="-1 Leg"
                          >
                            –
                          </button>
                          <span className="scoreNumber">{m.legsA}</span>
                          <button
                            className="btn"
                            onClick={() => onChange(incrementLeg(tournament, r, m.matchIndex, "a", +1))}
                            disabled={!ready || m.legsA >= m.bestOf}
                            title="+1 Leg"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="scoreSide">
                        <div className="scoreName">{m.b?.name ?? "—"}</div>
                        <div className="scoreBtns">
                          <button
                            className="btn btnGhost"
                            onClick={() => onChange(incrementLeg(tournament, r, m.matchIndex, "b", -1))}
                            disabled={!ready || m.legsB <= 0}
                            title="-1 Leg"
                          >
                            –
                          </button>
                          <span className="scoreNumber">{m.legsB}</span>
                          <button
                            className="btn"
                            onClick={() => onChange(incrementLeg(tournament, r, m.matchIndex, "b", +1))}
                            disabled={!ready || m.legsB >= m.bestOf}
                            title="+1 Leg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="muted" style={{ marginTop: 8 }}>
                      Hinweis: Sobald jemand „first to {target}“ erreicht, wird der Sieger automatisch gesetzt und in die nächste Runde übernommen.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

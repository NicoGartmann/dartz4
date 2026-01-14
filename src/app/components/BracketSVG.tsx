"use client";

import type { Tournament, Match } from "@/lib/tournament";
import { legsToWin } from "@/lib/tournament";

type Layout = {
  paddingX: number;
  paddingY: number;
  matchW: number;
  matchH: number;
  colGap: number;
  baseSpacing: number;
  fontSize: number;
};

const L: Layout = {
  paddingX: 20,
  paddingY: 20,
  matchW: 240,
  matchH: 76,
  colGap: 140,
  baseSpacing: 120,
  fontSize: 13,
};

function matchY(roundIndex: number, matchIndex: number) {
  const spacing = L.baseSpacing * Math.pow(2, roundIndex);
  return L.paddingY + matchIndex * spacing + (spacing - L.matchH) / 2;
}

function matchX(roundIndex: number) {
  return L.paddingX + roundIndex * (L.matchW + L.colGap);
}

function centerY(y: number) {
  return y + L.matchH / 2;
}

function isWinner(match: Match, playerId?: string) {
  return !!playerId && match.winnerId === playerId;
}

function slotText(slot?: { name: string }) {
  return slot?.name ?? "—";
}

export function BracketSVG({
  tournament,
  onQuickWinner,
}: {
  tournament: Tournament;
  onQuickWinner: (roundIndex: number, matchIndex: number, winner: "a" | "b") => void;
}) {
  const rounds = tournament.rounds;
  const roundsCount = rounds.length;

  const firstRoundMatches = rounds[0].length;
  const height = L.paddingY * 2 + firstRoundMatches * L.baseSpacing;
  const width =
    L.paddingX * 2 +
    roundsCount * L.matchW +
    (roundsCount - 1) * L.colGap;

  const connectorPaths: Array<{ d: string; key: string }> = [];

  for (let r = 0; r < roundsCount - 1; r++) {
    const current = rounds[r];
    for (const m of current) {
      const srcX = matchX(r) + L.matchW;
      const srcY = centerY(matchY(r, m.matchIndex));

      const targetMatchIndex = Math.floor(m.matchIndex / 2);
      const dstX = matchX(r + 1);
      const dstY = centerY(matchY(r + 1, targetMatchIndex));

      const midX = srcX + L.colGap / 2;
      const d = `M ${srcX} ${srcY} L ${midX} ${srcY} L ${midX} ${dstY} L ${dstX} ${dstY}`;
      connectorPaths.push({ d, key: `${r}-${m.matchIndex}` });
    }
  }

  return (
    <section className="card">
      <div className="rowBetween">
        <div>
          <h2>Turnierbaum</h2>
          <p className="muted">
            Modus: 501 Double Out · Best-of {tournament.bestOf} (first to {legsToWin(tournament.bestOf)})
          </p>
          <p className="muted">
            Spieler: {tournament.players.length} → Bracket: {tournament.meta.bracketSize} → Byes:{" "}
            {tournament.meta.byes}
          </p>
        </div>
        <div className="pillRow">
          {tournament.meta.roundLabels.map((label, i) => (
            <span key={i} className="pill">
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="bracketScroll">
        <svg width={width} height={height} className="bracketSvg">
          <g>
            {connectorPaths.map((p) => (
              <path key={p.key} d={p.d} fill="none" stroke="currentColor" opacity={0.25} />
            ))}
          </g>

          {rounds.map((round, r) =>
            round.map((m) => {
              const x = matchX(r);
              const y = matchY(r, m.matchIndex);

              const aWinner = isWinner(m, m.a?.playerId);
              const bWinner = isWinner(m, m.b?.playerId);

              const ready = !!m.a?.playerId && !!m.b?.playerId && !m.isBye;
              const scoreText = ready ? `${m.legsA}–${m.legsB}` : (m.isBye ? "BYE" : "");

              return (
                <g key={m.id} transform={`translate(${x}, ${y})`}>
                  <rect
                    x={0}
                    y={0}
                    width={L.matchW}
                    height={L.matchH}
                    rx={12}
                    ry={12}
                    fill="white"
                    stroke="currentColor"
                    opacity={0.9}
                  />

                  {/* Slot A */}
                  <rect
                    x={0}
                    y={0}
                    width={L.matchW}
                    height={L.matchH / 2}
                    rx={12}
                    ry={12}
                    fill={aWinner ? "currentColor" : "transparent"}
                    opacity={aWinner ? 0.12 : 0}
                    style={{ cursor: ready ? "pointer" : "default" }}
                    onClick={() => ready && onQuickWinner(r, m.matchIndex, "a")}
                  />

                  {/* Slot B */}
                  <rect
                    x={0}
                    y={L.matchH / 2}
                    width={L.matchW}
                    height={L.matchH / 2}
                    rx={12}
                    ry={12}
                    fill={bWinner ? "currentColor" : "transparent"}
                    opacity={bWinner ? 0.12 : 0}
                    style={{ cursor: ready ? "pointer" : "default" }}
                    onClick={() => ready && onQuickWinner(r, m.matchIndex, "b")}
                  />

                  <line
                    x1={10}
                    y1={L.matchH / 2}
                    x2={L.matchW - 10}
                    y2={L.matchH / 2}
                    stroke="currentColor"
                    opacity={0.2}
                  />

                  <text
                    x={14}
                    y={L.matchH / 2 - 12}
                    fontSize={L.fontSize}
                    fill="currentColor"
                    opacity={m.a ? 0.9 : 0.4}
                  >
                    {slotText(m.a)}
                  </text>

                  <text
                    x={14}
                    y={L.matchH - 12}
                    fontSize={L.fontSize}
                    fill="currentColor"
                    opacity={m.b ? 0.9 : 0.4}
                  >
                    {slotText(m.b)}
                  </text>

                  {/* Score / BYE */}
                  {scoreText ? (
                    <text
                      x={L.matchW - 12}
                      y={L.matchH / 2 + 5}
                      fontSize={12}
                      textAnchor="end"
                      fill="currentColor"
                      opacity={0.75}
                    >
                      {scoreText}
                    </text>
                  ) : null}

                  {m.winnerId ? (
                    <text
                      x={L.matchW - 12}
                      y={14}
                      fontSize={11}
                      textAnchor="end"
                      fill="currentColor"
                      opacity={0.6}
                    >
                      ✓
                    </text>
                  ) : null}
                </g>
              );
            })
          )}
        </svg>
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        Du kannst weiterhin im Match auf Spieler klicken, um schnell den Sieger zu setzen (Score springt auf „first to …“).
        Die genaue Leg-Zählung machst du unten im Scoreboard.
      </p>
    </section>
  );
}

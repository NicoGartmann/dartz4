"use client";

import { useEffect, useMemo, useState } from "react";
import { PlayerManager } from "@/app/components/PlayerManager";
import { ConfigPanel } from "@/app/components/ConfigPanel";
import { BracketSVG } from "@/app/components/BracketSVG";
import { MatchScoreboard } from "@/app/components/MatchScoreboard";
import {
  generateTournament,
  resetTournamentWinners,
  quickSetWinner,
  type Player,
  type Tournament,
} from "@/lib/tournament";

const STORAGE_KEY = "darts-tournament:v2";

export default function Page() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [bestOf, setBestOf] = useState<number>(3);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.players) setPlayers(data.players);
      if (typeof data?.bestOf === "number") setBestOf(data.bestOf);
      if (data?.tournament) setTournament(data.tournament);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, bestOf, tournament }));
  }, [players, bestOf, tournament]);

  const canGenerate = useMemo(() => players.length >= 2, [players.length]);

  function onGenerate() {
    setError(null);
    try {
      const t = generateTournament(players, bestOf);
      setTournament(t);
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
    }
  }

  function onQuickWinner(roundIndex: number, matchIndex: number, winner: "a" | "b") {
    if (!tournament) return;
    setTournament(quickSetWinner(tournament, roundIndex, matchIndex, winner));
  }

  function onResetWinners() {
    if (!tournament) return;
    setTournament(resetTournamentWinners(tournament));
  }

  function onClearAll() {
    setPlayers([]);
    setTournament(null);
    setBestOf(3);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Dart Turnierplan</h1>
        <p className="muted">
          K.O.-Turnier ohne Gruppenphase · Random Bracket · 501 Double Out · Legs pro Match
        </p>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid">
        <PlayerManager players={players} onChange={setPlayers} disabled={!!tournament} />
        <ConfigPanel bestOf={bestOf} onBestOfChange={setBestOf} disabled={false} />

        <section className="card">
          <h2>Aktionen</h2>
          <div className="rowWrap">
            <button className="btn" onClick={onGenerate} disabled={!canGenerate}>
              Turnierplan erstellen (zufällig)
            </button>

            <button className="btn btnGhost" onClick={() => tournament && onGenerate()} disabled={!tournament}>
              Neu mischen
            </button>

            <button className="btn btnGhost" onClick={onResetWinners} disabled={!tournament}>
              Gewinner & Legs zurücksetzen
            </button>

            <button className="btn btnDanger" onClick={onClearAll}>
              Alles löschen
            </button>
          </div>

          {!canGenerate ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Mindestens 2 Spieler hinzufügen, um ein Turnier zu erstellen.
            </p>
          ) : null}

          {tournament ? (
            <p className="muted" style={{ marginTop: 8 }}>
              Hinweis: Spieler-Liste ist nach Erstellung gesperrt (damit der Baum stabil bleibt).
            </p>
          ) : null}
        </section>
      </div>

      {tournament ? (
        <>
          <BracketSVG tournament={tournament} onQuickWinner={onQuickWinner} />
          <MatchScoreboard tournament={tournament} onChange={setTournament} />
        </>
      ) : (
        <section className="card">
          <h2>Turnierbaum</h2>
          <p className="muted">Erstelle ein Turnier, dann erscheinen Turnierbaum + Scoreboard.</p>
        </section>
      )}
    </main>
  );
}

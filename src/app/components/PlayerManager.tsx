"use client";

import { useMemo, useState } from "react";
import type { Player } from "@/lib/tournament";

function uuid() {
  // @ts-ignore
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
}

export function PlayerManager({
  players,
  onChange,
  disabled,
}: {
  players: Player[];
  onChange: (next: Player[]) => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");

  const canAdd = useMemo(() => name.trim().length > 0, [name]);

  function add() {
    const n = name.trim();
    if (!n) return;
    onChange([...players, { id: uuid(), name: n }]);
    setName("");
  }

  function remove(id: string) {
    onChange(players.filter((p) => p.id !== id));
  }

  return (
    <section className="card">
      <h2>Spieler</h2>

      <div className="row">
        <input
          className="input"
          placeholder="Name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          disabled={disabled}
        />
        <button className="btn" onClick={add} disabled={!canAdd || disabled}>
          Hinzufügen
        </button>
      </div>

      <div className="list">
        {players.length === 0 ? (
          <p className="muted">Noch keine Spieler hinzugefügt.</p>
        ) : (
          players.map((p) => (
            <div key={p.id} className="listItem">
              <span>{p.name}</span>
              <button
                className="btn btnGhost"
                onClick={() => remove(p.id)}
                disabled={disabled}
                title="Entfernen"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

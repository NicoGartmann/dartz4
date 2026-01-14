"use client";

export function ConfigPanel({
  bestOf,
  onBestOfChange,
  disabled,
}: {
  bestOf: number;
  onBestOfChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <section className="card">
      <h2>Konfiguration</h2>

      <div className="row">
        <label className="label">Modus (Best-of)</label>
        <select
          className="select"
          value={bestOf}
          onChange={(e) => onBestOfChange(Number(e.target.value))}
          disabled={disabled}
        >
          <option value={1}>Best of 1</option>
          <option value={3}>Best of 3</option>
          <option value={5}>Best of 5</option>
          <option value={7}>Best of 7</option>
        </select>
      </div>

      <p className="muted">
        Standard ist Best-of 3. Gewinnerwahl im Bracket übernimmt automatisch in
        die nächste Runde.
      </p>
    </section>
  );
}

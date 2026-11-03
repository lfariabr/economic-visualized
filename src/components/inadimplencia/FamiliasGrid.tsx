"use client";

import { COLS, ROWS, STATUS_COR, STATUS_LABEL, codeStatus, type Status } from "./familiasSim";

const W = 400;
const H = 300;
const CELL = W / COLS;

/** grade de famílias coloridas pelo status; anel tracejado = desempregado */
export function FamiliasGrid({
  codes,
  desempregados,
  selected,
  onSelect,
}: {
  codes: ArrayLike<number>;
  desempregados?: ArrayLike<boolean>;
  selected?: number | null;
  onSelect?: (i: number) => void;
}) {
  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const s = codeStatus(codes[i] ?? 0);
    const cx = Math.round(((i % COLS) + 0.5) * CELL * 100) / 100;
    const cy = Math.round((Math.floor(i / COLS) + 0.5) * CELL * 100) / 100;
    const sem = s === "semdivida";
    cells.push(
      <g key={i} onClick={onSelect ? () => onSelect(i) : undefined} className={onSelect ? "cursor-pointer" : undefined}>
        <circle
          cx={cx}
          cy={cy}
          r={sem ? 5 : 6.5}
          fill={sem ? "none" : STATUS_COR[s]}
          stroke={sem ? "#5a6275" : "none"}
          strokeWidth={1}
          opacity={sem ? 0.7 : 0.92}
        />
        {desempregados?.[i] && <circle cx={cx} cy={cy} r={8.6} fill="none" stroke="#e7e9f0" strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />}
        {selected === i && <circle cx={cx} cy={cy} r={9.4} fill="none" stroke="#e7e9f0" strokeWidth={1.8} />}
      </g>,
    );
  }
  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="Grade de 300 famílias coloridas pelo status da dívida">
        {cells}
      </svg>
      <Legenda comDesemprego={!!desempregados} />
    </div>
  );
}

const ORDEM: Status[] = ["emdia", "atrasado", "negativado", "renegociado", "semdivida"];

export function Legenda({ comDesemprego }: { comDesemprego?: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {ORDEM.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <svg width="10" height="10" aria-hidden>
            <circle
              cx="5"
              cy="5"
              r="4"
              fill={s === "semdivida" ? "none" : STATUS_COR[s]}
              stroke={s === "semdivida" ? "#5a6275" : "none"}
            />
          </svg>
          {STATUS_LABEL[s]}
        </span>
      ))}
      {comDesemprego && (
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="5" fill="none" stroke="#e7e9f0" strokeDasharray="2 2" />
          </svg>
          desempregado
        </span>
      )}
    </div>
  );
}

/** Barras subindo + linha da inflação. Mesma arte de app/icon.svg. Funciona em React e Satori. */
export function Glyph({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx={rounded ? 8 : 0} fill="#171b24" />
      <rect x="7" y="18" width="4" height="7" rx="1" fill="#38bdf8" />
      <rect x="14" y="13" width="4" height="12" rx="1" fill="#facc15" />
      <rect x="21" y="9" width="4" height="16" rx="1" fill="#4ade80" />
      <path d="M6 15 L12 10 L17 12 L26 5" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

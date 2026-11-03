import { Glyph } from "./Glyph";

export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <Glyph size={32} />
    </span>
  );
}

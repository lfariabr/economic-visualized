"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Logo } from "./Logo";
import { CHAPTER_COLOR, NAV } from "./nav";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-panel/60 px-3 py-5 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
        <Logo />
        <div className="leading-tight">
          <div className="text-sm font-semibold">Economia, visualizada</div>
          <div className="text-xs text-muted">Brasil · 12 capítulos interativos</div>
        </div>
      </Link>
      <nav className="flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item, i) => {
          const heading = i > 0 && NAV[i - 1].group !== item.group ? item.group : null;
          const active = isActive(pathname, item.href);
          const color = item.chapter ? CHAPTER_COLOR[item.chapter] : undefined;
          return (
            <div key={item.href}>
              {heading && (
                <div className="mt-4 mb-1 px-2 text-[10px] font-semibold tracking-widest text-faint uppercase">{heading}</div>
              )}
              <Link
                href={item.href}
                className={clsx(
                  "group flex gap-3 rounded-lg px-2 py-1.5 transition-colors",
                  active ? "bg-panel-2 text-ink" : "text-muted hover:bg-panel-2/60 hover:text-ink",
                )}
              >
                <span
                  className={clsx("mt-0.5 font-mono text-[11px]", !color && (active ? "text-accent" : "text-faint"))}
                  style={color ? { color: active ? color : undefined } : undefined}
                >
                  {item.n}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-faint group-hover:text-muted">{item.blurb}</span>
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-4 text-xs leading-relaxed text-faint">
        Modelos econômicos simplificados, com foco no Brasil. Mexa nos parâmetros e veja os problemas aparecerem. Valores aproximados, para fins educativos.
        <a
          href="https://github.com/sibelius/economic-visualized"
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-1.5 text-muted hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Código aberto no GitHub
        </a>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 lg:hidden">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "shrink-0 rounded-md px-2.5 py-1 text-xs",
            isActive(pathname, item.href) ? "bg-panel-2 text-ink" : "text-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

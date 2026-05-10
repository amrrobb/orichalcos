/**
 * Title progression indicator — Initiate → Apprentice → Adept → Master → Sage.
 *
 * Five dots with the current Title's dot filled brass-bright, prior tiers
 * filled brass-dim, future tiers as outlined dots. Used on detail pages.
 */
import { TITLES } from "@/lib/contracts";

interface TitleProgressProps {
  currentTitle: number;
  className?: string;
}

export function TitleProgress({ currentTitle, className = "" }: TitleProgressProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {TITLES.map((title, i) => {
        const isCurrent = i === currentTitle;
        const isPrior = i < currentTitle;
        const isFuture = i > currentTitle;
        return (
          <div key={title} className="flex flex-col items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{
                background: isCurrent
                  ? "var(--brass-bright)"
                  : isPrior
                  ? "var(--brass-dim)"
                  : "transparent",
                border: isFuture ? "1px solid var(--brass-dim)" : "none",
                boxShadow: isCurrent ? "0 0 8px var(--brass-bright)" : "none",
              }}
            />
            <span
              className="label"
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.15em",
                color: isCurrent ? "var(--brass-bright)" : isPrior ? "var(--brass-dim)" : "var(--ink-faint)",
              }}
            >
              {title.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

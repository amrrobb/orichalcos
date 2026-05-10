/**
 * Statistic card for the 'Why this exists' evidence wall.
 *
 * Codex register (terminal feel): JetBrains Mono numerals, hairline brass rules,
 * citation in caption beneath. Per docs/USER_FLOW.md §1.1.
 */

interface StatisticCardProps {
  numeral: string;       // '56%', '69%', '$11.3B'
  claim: string;         // 'of financial influencers produce negative returns'
  citation: string;      // 'Swiss Finance Institute, 2023'
  link?: string;         // optional external citation link
}

export function StatisticCard({ numeral, claim, citation, link }: StatisticCardProps) {
  const Wrapper = link
    ? (props: React.PropsWithChildren) => (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-6 hover:border-[var(--brass-dim)] transition-colors group"
        >
          {props.children}
        </a>
      )
    : (props: React.PropsWithChildren) => (
        <div className="bg-[var(--surface-raised)] border border-[var(--rule)] rounded-[var(--radius-lg)] p-6">
          {props.children}
        </div>
      );

  return (
    <Wrapper>
      <p
        className="numeral mono mb-3"
        style={{
          fontSize: "3.5rem",
          color: "var(--brass-bright)",
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        {numeral}
      </p>
      <div className="hairline-rule mb-3" />
      <p className="body-sm text-[var(--ink-dim)] mb-3 leading-snug">{claim}</p>
      <p className="caption text-[var(--ink-faint)] italic">{citation}</p>
    </Wrapper>
  );
}

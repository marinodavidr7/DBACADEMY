import React from 'react';

interface FormattedTheoryContentProps {
  text: string;
  zenMode?: boolean;
}

function renderInlineNodes(line: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  const parts = line.split(tokenRegex);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-stone-100 dark:bg-zinc-800/90 border border-stone-200/90 dark:border-zinc-700/80 px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--dba-accent-ink)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--dba-accent-ink)] underline hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export const FormattedTheoryContent: React.FC<FormattedTheoryContentProps> = ({
  text,
  zenMode = false,
}) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraphBuf: string[] = [];
  let bulletBuf: string[] = [];
  let orderedBuf: string[] = [];
  let codeBuf: string[] = [];
  let inCode = false;

  const textSizeClass = zenMode ? 'text-[15px] leading-7' : 'text-sm leading-relaxed';

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className={`${textSizeClass} text-slate-700 dark:text-slate-200`}>
        {paragraphBuf.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {renderInlineNodes(line, `p-${blocks.length}-${i}`)}
          </React.Fragment>
        ))}
      </p>
    );
    paragraphBuf = [];
  };

  const flushBullets = () => {
    if (bulletBuf.length === 0) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className={`list-disc pl-5 space-y-1.5 ${textSizeClass} text-slate-700 dark:text-slate-200`}
      >
        {bulletBuf.map((item, i) => (
          <li key={i}>{renderInlineNodes(item, `ul-${blocks.length}-${i}`)}</li>
        ))}
      </ul>
    );
    bulletBuf = [];
  };

  const flushOrdered = () => {
    if (orderedBuf.length === 0) return;
    blocks.push(
      <ol
        key={`ol-${blocks.length}`}
        className={`list-decimal pl-5 space-y-1.5 ${textSizeClass} text-slate-700 dark:text-slate-200`}
      >
        {orderedBuf.map((item, i) => (
          <li key={i}>{renderInlineNodes(item, `ol-${blocks.length}-${i}`)}</li>
        ))}
      </ol>
    );
    orderedBuf = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      if (inCode) {
        blocks.push(
          <pre
            key={`pre-${blocks.length}`}
            className="overflow-x-auto rounded-lg border border-stone-200 dark:border-zinc-700 bg-[#121216] p-3 text-xs font-mono text-amber-200"
          >
            <code>{codeBuf.join('\n')}</code>
          </pre>
        );
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (trimmed === '') {
      flushParagraph();
      flushBullets();
      flushOrdered();
      continue;
    }

    const legacyHeading = trimmed.match(/^===\s*(.+?)\s*===$/);
    const mdHeading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (legacyHeading || mdHeading) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      const titleText = legacyHeading ? legacyHeading[1] : mdHeading![2];
      const level = mdHeading ? mdHeading[1].length : 3;
      const headingClass =
        level <= 2
          ? 'text-base font-bold text-slate-900 dark:text-white pt-2'
          : 'text-sm font-bold text-slate-900 dark:text-amber-300 pt-1.5';
      blocks.push(
        <h3 key={`h-${blocks.length}`} className={headingClass}>
          {renderInlineNodes(titleText, `h-${blocks.length}`)}
        </h3>
      );
      continue;
    }

    if (/^[•\-*]\s+/.test(trimmed)) {
      flushParagraph();
      flushOrdered();
      bulletBuf.push(trimmed.replace(/^[•\-*]\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushBullets();
      orderedBuf.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    flushBullets();
    flushOrdered();
    paragraphBuf.push(trimmed);
  }

  flushParagraph();
  flushBullets();
  flushOrdered();
  if (inCode && codeBuf.length > 0) {
    blocks.push(
      <pre
        key={`pre-${blocks.length}`}
        className="overflow-x-auto rounded-lg border border-stone-200 dark:border-zinc-700 bg-[#121216] p-3 text-xs font-mono text-amber-200"
      >
        <code>{codeBuf.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-3">{blocks}</div>;
};

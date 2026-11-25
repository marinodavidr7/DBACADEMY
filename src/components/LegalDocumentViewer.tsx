import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Download, FileText, Printer, Scale } from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';
import {
  getLegalDocumentByFile,
  getLegalDocumentBySlug,
  legalDocumentPath,
  legalMarkdownPath,
  LEGAL_DOCUMENTS,
  navigateToLegalDocument,
  type LegalDocSlug,
} from '../services/legalDocuments';

interface Heading {
  id: string;
  title: string;
  level: 2 | 3;
}

interface ListItem {
  indent: number;
  ordered: boolean;
  content: string;
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\([^)\s]+\))/g;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'seccion';

/** Corrige el doble cifrado clásico (TÃ©rminos) y el BOM, incluso si el servidor ya envía UTF-8. */
export function normalizeUtf8(raw: string): string {
  let text = raw.replace(/^\uFEFF/, '');
  if (/[\u00C3][\u0080-\u00BF\u00A0-\u00FF]/.test(text)) {
    try {
      const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
      const repaired = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (!repaired.includes('\uFFFD')) text = repaired;
    } catch {
      // Se conserva el texto original si la reparación no es válida.
    }
  }
  return text;
}

/** Formato en línea: negrita, cursiva, código, enlaces internos .md y enlaces externos. */
function renderInline(
  text: string,
  onDocLink: (file: string) => void,
  keyPrefix: string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = new RegExp(INLINE_PATTERN.source, 'g');
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const [, label, href] = link;
        const target = href.toLowerCase().endsWith('.md') ? getLegalDocumentByFile(href) : undefined;
        if (target && target.slug) {
          nodes.push(
            <a
              key={key}
              href={legalDocumentPath(target.slug)}
              onClick={(event) => {
                event.preventDefault();
                onDocLink(href);
              }}
            >
              {renderInline(label, onDocLink, `${key}-label`)}
            </a>
          );
        } else if (/^https?:\/\//i.test(href)) {
          nodes.push(
            <a key={key} href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          );
        } else {
          nodes.push(
            <a key={key} href={href}>
              {label}
            </a>
          );
        }
      } else {
        nodes.push(token);
      }
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

const renderListLevel = (
  items: ListItem[],
  start: number,
  indent: number,
  onDocLink: (file: string) => void,
  keyPrefix: string
): [React.ReactNode[], number] => {
  const ordered = items[start].ordered;
  const Tag = ordered ? 'ol' : 'ul';
  const children: React.ReactNode[] = [];
  let index = start;

  while (index < items.length && items[index].indent === indent && items[index].ordered === ordered) {
    const item = items[index];
    const nested: React.ReactNode[] = [];
    let next = index + 1;
    if (next < items.length && items[next].indent > indent) {
      const [nodes, after] = renderListLevel(
        items,
        next,
        items[next].indent,
        onDocLink,
        `${keyPrefix}-${index}-nested`
      );
      nested.push(...nodes);
      next = after;
    }
    children.push(
      <li key={`${keyPrefix}-${index}`}>
        {renderInline(item.content, onDocLink, `${keyPrefix}-${index}`)}
        {nested}
      </li>
    );
    index = next;
  }

  const result: [React.ReactNode[], number] = [[<Tag key={`${keyPrefix}-list`}>{children}</Tag>], index];
  return result;
};

/** Parser ligero orientado a los documentos legales del repositorio. */
function parseMarkdown(markdown: string, onDocLink: (file: string) => void) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  const headings: Heading[] = [];
  const usedIds = new Set<string>();
  let index = 0;

  const addHeading = (level: 2 | 3, title: string) => {
    const base = slugify(title);
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    headings.push({ id, title, level });
    return id;
  };

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Separador
    if (/^\s*-{3,}\s*$/.test(line)) {
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    // Encabezados h1-h3
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = level === 1 ? undefined : addHeading(level as 2 | 3, title);
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      blocks.push(
        <Tag key={`h-${index}`} id={id}>
          {renderInline(title, onDocLink, `h-${index}`)}
        </Tag>
      );
      index += 1;
      continue;
    }

    // Cita (incluye las líneas de continuación que empiezan con >)
    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        const content = lines[index].replace(/^\s*>\s?/, '').trim();
        if (content) quoteLines.push(content);
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`}>
          {quoteLines.map((content, offset) => (
            <p key={offset}>{renderInline(content, onDocLink, `quote-${index}-${offset}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Tabla: fila de cabecera + fila separadora
    if (line.trim().startsWith('|') && /^\s*\|?\s*:?-{3,}:?\s*\|/.test(lines[index + 1] || '')) {
      const splitCells = (row: string) =>
        row
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((cell) => cell.trim());
      const header = splitCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} className="legal-doc-table-wrap">
          <table>
            <thead>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex}>{renderInline(cell, onDocLink, `th-${index}-${cellIndex}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{renderInline(cell, onDocLink, `td-${index}-${rowIndex}-${cellIndex}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Listas numeradas y con viñetas (con un nivel de anidamiento por indentación)
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const items: ListItem[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
        if (!item) break;
        items.push({
          indent: Math.floor(item[1].replace(/\t/g, '  ').length / 2),
          ordered: /\d/.test(item[2]),
          content: item[3].trim(),
        });
        index += 1;
      }
      // Puede haber varios grupos seguidos con distinto tipo (ol/ul) en el mismo nivel.
      let listIndex = 0;
      let group = 0;
      while (listIndex < items.length) {
        const [nodes, next] = renderListLevel(
          items,
          listIndex,
          items[listIndex].indent,
          onDocLink,
          `list-${index}-${group}`
        );
        blocks.push(...nodes);
        group += 1;
        if (next <= listIndex) break;
        listIndex = next;
      }
      continue;
    }

    // Párrafo: líneas consecutivas hasta una línea vacía o un bloque especial
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      const current = lines[index];
      if (
        /^\s*-{3,}\s*$/.test(current) ||
        /^(#{1,3})\s+/.test(current) ||
        /^\s*>\s?/.test(current) ||
        /^\s*\|/.test(current) ||
        /^(\s*)([-*]|\d+\.)\s+/.test(current)
      ) {
        break;
      }
      paragraph.push(current.trim());
      index += 1;
    }
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${index}`}>{renderInline(paragraph.join(' '), onDocLink, `p-${index}`)}</p>
      );
    } else {
      index += 1;
    }
  }

  return { blocks, headings };
}

interface LegalDocumentViewerProps {
  slug: LegalDocSlug;
  onBack: () => void;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({ slug, onBack }) => {
  const doc = getLegalDocumentBySlug(slug);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  const handleDocLink = useCallback((file: string) => {
    const target = getLegalDocumentByFile(file);
    if (!target) return;
    navigateToLegalDocument(target.slug);
  }, []);

  useEffect(() => {
    if (!doc) {
      setError('Documento no encontrado.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMarkdown('');
    setActiveHeading(null);

    fetch(`${legalMarkdownPath(doc.file)}?v=${encodeURIComponent(doc.version)}`, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar el documento (HTTP ${response.status}).`);
        return response.text();
      })
      .then((text) => {
        if (!cancelled) {
          setMarkdown(normalizeUtf8(text));
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el documento.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [doc]);

  const { blocks, headings } = useMemo(
    () => (markdown ? parseMarkdown(markdown, handleDocLink) : { blocks: [], headings: [] }),
    [markdown, handleDocLink]
  );

  useEffect(() => {
    if (!headings.length) return;
    const syncActive = () => {
      const current = [...headings].reverse().find((heading) => {
        const element = document.getElementById(heading.id);
        return element ? element.getBoundingClientRect().top <= 180 : false;
      });
      setActiveHeading(current?.id ?? headings[0].id);
    };
    syncActive();
    window.addEventListener('scroll', syncActive, { passive: true });
    return () => window.removeEventListener('scroll', syncActive);
  }, [headings]);

  const tableOfContents = (className: string) => (
    <nav className={className} aria-label="Índice de secciones">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--dba-accent-ink)]">
        En este documento
      </p>
      <ul className="space-y-1.5 text-xs sm:text-sm">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState({}, '', `#${heading.id}`);
              }}
              className={`block border-l-2 pl-2.5 py-0.5 transition-colors ${
                activeHeading === heading.id
                  ? 'border-[var(--dba-accent)] font-semibold text-[var(--dba-text-primary)]'
                  : 'border-transparent text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
              }`}
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  const otherDocs = LEGAL_DOCUMENTS.filter((item) => item.slug !== slug).slice(0, 4);

  return (
    <div className="legal-doc-root min-h-[100dvh] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)]">
      <header className="legal-doc-no-print sticky top-0 z-30 border-b border-[var(--dba-border)] bg-[var(--dba-bg-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--dba-border)] px-3 py-2 text-xs font-medium text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)] sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="hidden sm:block">
            <BrandLogo size="sm" showWordmark />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--dba-border)] px-3 py-2 text-xs font-medium text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)] sm:text-sm"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            {doc && (
              <a
                href={legalMarkdownPath(doc.file)}
                download={doc.file}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--dba-accent)] px-3 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] hover:bg-[var(--dba-accent-hover)] sm:text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Descargar .md</span>
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12 lg:py-12">
        <aside className="legal-doc-no-print hidden lg:block">
          <div className="sticky top-24">
            {tableOfContents('max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2')}
            <div className="mt-8 border-t border-[var(--dba-border)] pt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--dba-accent-ink)]">
                Otros documentos
              </p>
              <ul className="space-y-2 text-xs">
                {otherDocs.map((item) => (
                  <li key={item.slug}>
                    <a
                      href={legalDocumentPath(item.slug)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateToLegalDocument(item.slug);
                      }}
                      className="flex items-start gap-2 text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]"
                    >
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main className="min-w-0 w-full max-w-4xl">
          <div className="mb-8">
            <div className="legal-doc-no-print mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--dba-accent-ink)]">
              <Scale className="h-3.5 w-3.5" />
              DB Academy · Centro Legal · República Dominicana
            </div>
            <h1 className="legal-doc-screen-title font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {doc?.title ?? 'Documento legal'}
            </h1>
            {doc && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-1 font-mono text-[11px] text-[var(--dba-text-secondary)]">
                  {doc.version}
                </span>
                <span className="rounded-full border border-[var(--dba-accent)]/40 bg-[var(--dba-accent)]/10 px-3 py-1 text-[11px] font-medium text-[var(--dba-accent-ink)]">
                  {doc.lawRef}
                </span>
              </div>
            )}
            <p className="mt-3 text-sm text-[var(--dba-text-secondary)]">
              {doc?.description}
            </p>
            <div className="legal-doc-no-print mt-5">
              <details className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-3">
                <summary className="cursor-pointer text-xs font-medium text-[var(--dba-text-secondary)]">
                  Ver índice de secciones
                </summary>
                <div className="pt-3">{tableOfContents('')}</div>
              </details>
            </div>
          </div>

          <article className="legal-doc-content rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-5 shadow-sm sm:p-9 lg:p-11">
            {loading && (
              <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Cargando documento">
                <div className="h-6 w-2/3 rounded bg-[var(--dba-bg-elevated)]" />
                <div className="h-4 w-full rounded bg-[var(--dba-bg-elevated)]" />
                <div className="h-4 w-11/12 rounded bg-[var(--dba-bg-elevated)]" />
                <div className="h-4 w-4/5 rounded bg-[var(--dba-bg-elevated)]" />
              </div>
            )}
            {!loading && error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">No se pudo mostrar el documento</p>
                  <p>{error}</p>
                  {doc && (
                    <a
                      href={legalMarkdownPath(doc.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block underline"
                    >
                      Abrir archivo Markdown original
                    </a>
                  )}
                </div>
              </div>
            )}
            {!loading && !error && blocks}
          </article>

          <footer className="legal-doc-no-print mt-8 flex flex-col gap-3 border-t border-[var(--dba-border)] pt-6 text-xs text-[var(--dba-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Texto oficial vigente · Consulta la versión registrada antes de realizar un pago.
            </p>
            <button type="button" onClick={onBack} className="font-medium underline underline-offset-4">
              Volver a DB Academy
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

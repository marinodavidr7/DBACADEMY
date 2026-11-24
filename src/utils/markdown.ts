import { extractYouTubeId } from './courseEditor';

/**
 * Renderizador Markdown mínimo y seguro para la vista previa del editor.
 * Escapa HTML antes de aplicar la sintaxis, de modo que el contenido del
 * instructor no pueda inyectar etiquetas.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeImageSrc(src: string): boolean {
  const clean = src.trim();
  return (
    /^https?:\/\//i.test(clean) ||
    clean.startsWith('/') ||
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(clean)
  );
}

function inline(value: string): string {
  let out = escapeHtml(value);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt: string, src: string) =>
    isSafeImageSrc(src)
      ? `<img src="${src}" alt="${alt}" loading="lazy" referrerPolicy="no-referrer" style="max-width:100%;height:auto;border-radius:0.75rem;margin:0.75rem 0;" />`
      : alt
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(`<p>${paragraph.map(inline).join(' ')}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length > 0) {
      html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
      list = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html.push(escapeHtml(line));
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^([-*]|\d+\.)\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^([-*]|\d+\.)\s+/, ''));
      continue;
    }

    const trimmedLine = line.trim();
    if (
      trimmedLine.startsWith('http://') ||
      trimmedLine.startsWith('https://') ||
      trimmedLine.startsWith('<iframe') ||
      (trimmedLine.startsWith('[') && trimmedLine.includes('http'))
    ) {
      const ytid = extractYouTubeId(trimmedLine);
      if (ytid) {
        flushParagraph();
        flushList();
        html.push(
          `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.75rem;margin:1rem 0;background:#000;"><iframe src="https://www.youtube-nocookie.com/embed/${ytid}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1" title="Reproductor de lección" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div>`
        );
        continue;
      }
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  if (inCode) html.push('</code></pre>');

  return html.join('\n');
}

import DOMPurify from 'dompurify';
import { renderMarkdown } from './markdown';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'sub', 'sup',
  'iframe',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
  'width', 'height', 'loading', 'referrerpolicy', 'decoding',
  'colspan', 'rowspan', 'scope',
  'allow', 'allowfullscreen', 'frameborder', 'sandbox',
];

// Allow only safe inline style properties (colors, alignment, sizes)
const ALLOWED_STYLE_PROPS = new Set([
  'color', 'background-color', 'background', 'text-align', 'font-size',
  'font-weight', 'font-style', 'text-decoration', 'text-decoration-line',
  'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
  'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
  'line-height', 'border', 'border-radius', 'width', 'max-width', 'height',
  'display', 'list-style-type',
]);

function sanitizeStyle(style: string): string {
  return style
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(':');
      if (idx === -1) return null;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return null;
      // Block dangerous values
      if (/url\s*\(|expression\s*\(|javascript:|@import/i.test(val)) return null;
      return `${prop}: ${val}`;
    })
    .filter((d): d is string => Boolean(d))
    .join('; ');
}

let hooksInstalled = false;
function ensureHooks() {
  if (hooksInstalled || typeof window === 'undefined') return;
  hooksInstalled = true;
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') {
      data.attrValue = sanitizeStyle(data.attrValue || '');
      if (!data.attrValue) data.forceKeepAttr = false;
    }
    if (data.attrName === 'target' && data.attrValue === '_blank') {
      // keep, rel handled below
    }
  });
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      } else {
        node.removeAttribute('href');
      }
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!/^https?:\/\//i.test(src) && !src.startsWith('/') && !/^data:image\//i.test(src)) {
        node.removeAttribute('src');
      }
      node.setAttribute('loading', 'lazy');
      node.setAttribute('referrerpolicy', 'no-referrer');
    }
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src') || '';
      if (!/^https:\/\//i.test(src)) {
        node.remove();
        return;
      }
      node.setAttribute('loading', 'lazy');
      node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      // Allow fullscreen for simulators/videos but keep sandbox restrictive by default
      if (!node.getAttribute('sandbox')) {
        node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation');
      }
      if (!node.getAttribute('allow')) {
        node.setAttribute('allow', 'fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      }
    }
  });
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  ensureHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/** Heuristic: content is HTML from WYSIWYG if it contains block/inline HTML tags. */
export function isHtmlContent(content: string): boolean {
  const t = (content || '').trim();
  if (!t) return false;
  // Quill/HTML typically starts with <p>, <h1-6>, <ul>, <ol>, <blockquote>, <div>, <pre>
  if (/^<(p|div|h[1-6]|ul|ol|blockquote|pre|table|hr|img)\b/i.test(t)) return true;
  // Or contains common HTML tags
  if (/<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|span|strong|em|a|br)>/i.test(t)) return true;
  return false;
}

/** Render lesson content: HTML is sanitized; legacy Markdown is converted then returned. */
export function renderLessonContent(content: string): string {
  const raw = content || '';
  if (!raw.trim()) return '';
  if (isHtmlContent(raw)) return sanitizeHtml(raw);
  return renderMarkdown(raw);
}

/** Strip HTML to plain text (for previews/checks). */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ');
  const div = document.createElement('div');
  div.innerHTML = sanitizeHtml(html);
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

export function hasMeaningfulContent(content: string): boolean {
  const raw = (content || '').trim();
  if (!raw) return false;
  if (isHtmlContent(raw)) return htmlToPlainText(raw).length > 0 || /<img\b/i.test(raw) || /<iframe\b/i.test(raw);
  return raw.length > 0;
}

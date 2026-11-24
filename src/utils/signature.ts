export const DAVID_SIGNER_NAME = 'David';
export const DAVID_SIGNER_TITLE = 'Director Académico · DB Academy';

export const DAVID_SIGNATURE_VIEWBOX = '0 0 260 88';

export const DAVID_SIGNATURE_STROKES = [
  {
    d: 'M36 66 C39 44, 46 20, 52 14 C46 18, 28 24, 24 38 C20 52, 34 62, 54 60 C74 58, 86 44, 84 28 C82 14, 62 12, 46 22',
    stroke: '#0F172A',
    strokeWidth: 3.2,
    opacity: 1,
  },
  {
    d: 'M96 46 C90 46, 82 52, 84 58 C86 63, 96 61, 102 52 C104 48, 103 57, 106 59 C109 61, 114 54, 118 47 C120 53, 123 60, 126 60 C129 60, 134 50, 138 44 C140 50, 141 59, 145 59 C149 59, 154 51, 157 46',
    stroke: '#0F172A',
    strokeWidth: 2.7,
    opacity: 1,
  },
  {
    d: 'M175 45 C168 45, 160 51, 162 58 C164 63, 173 60, 179 49 C183 41, 187 22, 189 15 C186 28, 181 49, 182 57 C183 62, 191 58, 202 52',
    stroke: '#0F172A',
    strokeWidth: 2.7,
    opacity: 1,
  },
  {
    d: 'M26 73 C78 65, 146 63, 224 68 C212 71, 188 74, 166 76',
    stroke: '#0052CC',
    strokeWidth: 2,
    opacity: 0.85,
  },
] as const;

export const DAVID_SIGNATURE_DOT = {
  cx: 143,
  cy: 31,
  r: 2.2,
  fill: '#0F172A',
} as const;

const DAVID_SIGNATURE_SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${DAVID_SIGNATURE_VIEWBOX}" fill="none">
${DAVID_SIGNATURE_STROKES.map(
  (s) =>
    `  <path d="${s.d}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${s.opacity}" />`
).join('\n')}
  <circle cx="${DAVID_SIGNATURE_DOT.cx}" cy="${DAVID_SIGNATURE_DOT.cy}" r="${DAVID_SIGNATURE_DOT.r}" fill="${DAVID_SIGNATURE_DOT.fill}" />
</svg>`;

let cachedSignaturePngUrl: string | null = null;

export async function loadDavidSignaturePngDataUrl(): Promise<string | null> {
  if (cachedSignaturePngUrl) return cachedSignaturePngUrl;
  if (typeof window === 'undefined' || typeof Image === 'undefined') return null;

  return new Promise((resolve) => {
    const svgBlob = new Blob([DAVID_SIGNATURE_SVG_MARKUP], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 520;
        canvas.height = 176;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cachedSignaturePngUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(cachedSignaturePngUrl);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

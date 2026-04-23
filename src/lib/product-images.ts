type ResolvedProductImage = {
  imageUrl: string;
  imageSource: string;
  imageAttribution?: string;
};

type BrandRule = {
  keywords: string[];
  brand: string;
  bg: string;
  fg: string;
};

const BRAND_RULES: BrandRule[] = [
  { keywords: ['indomie'], brand: 'Indomie', bg: '#E11D48', fg: '#FFFFFF' },
  { keywords: ['mie sedaap', 'miesedap'], brand: 'Mie Sedaap', bg: '#B91C1C', fg: '#FFFFFF' },
  { keywords: ['pop mie', 'popmie'], brand: 'Pop Mie', bg: '#F97316', fg: '#FFFFFF' },
  { keywords: ['aqua'], brand: 'AQUA', bg: '#2563EB', fg: '#FFFFFF' },
  { keywords: ['teh pucuk', 'pucuk'], brand: 'Teh Pucuk', bg: '#16A34A', fg: '#FFFFFF' },
  { keywords: ['kapal api'], brand: 'Kapal Api', bg: '#991B1B', fg: '#FFFFFF' },
  { keywords: ['roma'], brand: 'Roma', bg: '#A16207', fg: '#FFFFFF' },
  { keywords: ['qtela'], brand: 'Qtela', bg: '#7C3AED', fg: '#FFFFFF' },
  { keywords: ['chitato'], brand: 'Chitato', bg: '#F59E0B', fg: '#111827' },
  { keywords: ['gudang garam', 'surya'], brand: 'Gudang Garam', bg: '#DC2626', fg: '#FFFFFF' },
  { keywords: ['lifebuoy', 'sunsilk'], brand: 'Unilever', bg: '#1D4ED8', fg: '#FFFFFF' },
];

function sanitizeKeyword(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function buildFallbackImageUrl(name: string, category: string, seed?: string) {
  const title = (name || category || 'Produk').slice(0, 28);
  const subtitle = `SKU ${seed || '-'} - ${category || 'Warung'}`;
  return createSvgCard(title, subtitle, '#0EA5E9', '#FFFFFF');
}

export function buildPlaceholderImageUrl(name: string) {
  return createSvgCard((name || 'Produk').slice(0, 28), 'Inventor.io', '#334155', '#FFFFFF');
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSvgCard(title: string, subtitle: string, bg: string, fg: string) {
  const safeTitle = title.replace(/[<&>]/g, '');
  const safeSubtitle = subtitle.replace(/[<&>]/g, '');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="${bg}" />
  <rect x="24" y="24" width="592" height="432" rx="28" fill="rgba(255,255,255,0.14)" />
  <text x="48" y="220" fill="${fg}" font-family="Arial, sans-serif" font-size="52" font-weight="700">${safeTitle}</text>
  <text x="48" y="276" fill="${fg}" font-family="Arial, sans-serif" font-size="24" opacity="0.9">${safeSubtitle}</text>
  <text x="48" y="420" fill="${fg}" font-family="Arial, sans-serif" font-size="18" opacity="0.85">Inventor.io Product Image</text>
</svg>`;

  return svgToDataUrl(svg);
}

function resolveBrandLogoByName(name: string) {
  const normalized = sanitizeKeyword(name);
  const matched = BRAND_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (!matched) return null;

  return {
    imageUrl: createSvgCard(matched.brand, 'Brand matched', matched.bg, matched.fg),
    imageSource: `Local brand image (${matched.brand})`,
    imageAttribution: 'generated-local-svg',
  };
}

export async function resolveProductImage(
  name: string,
  category: string,
  seed?: string
): Promise<ResolvedProductImage> {
  const brandLogo = resolveBrandLogoByName(name);
  if (brandLogo) {
    return brandLogo;
  }

  return {
    imageUrl: buildFallbackImageUrl(name, category, seed),
    imageSource: 'Placeholder by product name',
    imageAttribution: 'placehold.co',
  };
}

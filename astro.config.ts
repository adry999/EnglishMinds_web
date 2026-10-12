import { defineConfig, fontProviders } from 'astro/config';
import { requireCompleteContent } from './src/core/build/require-complete-content';
import { site } from './src/shared/content/site';

type Variant = { weight: number; style: 'normal'; unicodeRange: [string]; src: [string] };

// Unicode ranges copied from the @fontsource CSS: latin covers ASCII, latin-ext covers the Romanian ș/ț/ă.
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

const variants = (pkg: string, weights: number[]): [Variant, ...Variant[]] =>
  weights.flatMap((weight) =>
    [
      ['latin', LATIN],
      ['latin-ext', LATIN_EXT],
    ].map(([subset, unicodeRange]) => ({
      weight,
      style: 'normal' as const,
      unicodeRange: [unicodeRange] as [string],
      src: [`@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`] as [string],
    })),
  ) as [Variant, ...Variant[]];

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  // Inline all CSS: a separate stylesheet is a render-blocking request that delays the LCP text on mobile.
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Self-hosted fonts (GDPR): the local provider reads the woff2 files shipped by @fontsource, nothing is fetched at runtime.
  // Astro also emits metric-matched fallback faces (size-adjust and overrides), so the swap does not shift the layout.
  fonts: [
    {
      name: 'Nunito',
      cssVariable: '--font-nunito',
      provider: fontProviders.local(),
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
      options: { variants: variants('nunito', [600, 700, 800, 900]) },
    },
    {
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow-condensed',
      provider: fontProviders.local(),
      display: 'swap',
      fallbacks: ['Arial Narrow', 'sans-serif'],
      options: { variants: variants('barlow-condensed', [700]) },
    },
  ],
  vite: {
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
  },
  integrations: [requireCompleteContent(site, process.env.SITE_ENV === 'production')],
});

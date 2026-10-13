export type NavKey = 'acasa' | 'grupe' | 'metoda' | 'test' | 'tabere' | 'blog';

export const NAV: readonly { key: NavKey; label: string; href: string }[] = [
  { key: 'acasa', label: 'Acasă', href: '/' },
  { key: 'grupe', label: 'Grupe', href: '/grupe/' },
  { key: 'metoda', label: 'Metoda Cambridge', href: '/metoda-cambridge/' },
  { key: 'test', label: 'Test de nivel', href: '/test-de-nivel/' },
  { key: 'tabere', label: 'Tabere de vară', href: '/tabere/' },
  { key: 'blog', label: 'Blog', href: '/blog/' },
];

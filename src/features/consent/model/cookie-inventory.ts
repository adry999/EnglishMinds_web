export type CookieInfo = {
  readonly category: 'necessary' | 'analytics' | 'marketing';
  readonly service: string;
  readonly names: string;
  readonly duration: string;
  readonly purpose: string;
};

export const COOKIE_INVENTORY: readonly CookieInfo[] = [
  { category: 'necessary', service: 'English Minds Academy', names: 'em_consent', duration: '182 de zile', purpose: 'Ține minte alegerea ta despre cookie-uri.' },
  { category: 'analytics', service: 'Google Analytics 4', names: '_ga, _ga_*', duration: '2 ani', purpose: 'Numără vizitele și paginile citite.' },
  { category: 'analytics', service: 'Google Analytics 4', names: '_gid', duration: '24 de ore', purpose: 'Deosebește vizitatorii în aceeași zi.' },
  { category: 'marketing', service: 'Meta Pixel', names: '_fbp, _fbc', duration: '90 de zile', purpose: 'Arată ce reclame Meta aduc rezervări.' },
  { category: 'marketing', service: 'Google Ads', names: '_gcl_*', duration: '90 de zile', purpose: 'Arată ce reclame Google aduc rezervări.' },
];

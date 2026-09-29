export const SECTIONS = [
  { name: 'overview', path: '/' },
  { name: 'issues', path: '/reclamations' },
  { name: 'accounts', path: '/comptes' },
  { name: 'listings', path: '/annonces' },
  { name: 'requests', path: '/demandes' },
  { name: 'settings', path: '/reglages' },
  { name: 'journal', path: '/journal' },
] as const;

export type SectionName = (typeof SECTIONS)[number]['name'];
